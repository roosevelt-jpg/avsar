import { NextResponse } from 'next/server';
import { refreshIntegrations } from '@/lib/integrations/runtime';

/**
 * Fixed-window rate limiting on Upstash Redis, over its REST API.
 *
 * Plain fetch rather than an SDK: three commands do not justify a dependency,
 * and it needs nothing installed. Without Upstash configured every call is
 * allowed, which keeps local development unthrottled.
 *
 * It fails open. If Redis is down, candidates can still register and apply;
 * losing the throttle for a few minutes is a smaller harm than a dead funnel.
 */

export type RateLimitRule = {
  /** Short name, part of the Redis key, e.g. "apply". */
  name: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

/* Named here so every route uses the same numbers, and so they can be read in
   one place. Mobile carriers in India put many people behind one IP (CGNAT),
   so per-IP limits are set well above what one honest person needs. */
export const RATE_LIMITS = {
  register: { name: 'register', limit: 10, windowSeconds: 600 },
  avatar: { name: 'avatar', limit: 10, windowSeconds: 600 },
  /* The header search fires as staff type; generous, but a script harvesting
     the database through it is stopped. */
  consoleSearch: { name: 'console-search', limit: 120, windowSeconds: 60 },
  apply: { name: 'apply', limit: 10, windowSeconds: 60 },
  requestCodeIp: { name: 'code-ip', limit: 10, windowSeconds: 600 },
  requestCodeEmail: { name: 'code-email', limit: 3, windowSeconds: 600 },
  mediaSign: { name: 'media-sign', limit: 60, windowSeconds: 60 },
  vacancyRequest: { name: 'vacancy-request', limit: 10, windowSeconds: 3600 },
  contact: { name: 'contact', limit: 8, windowSeconds: 600 },
  selfExport: { name: 'self-export', limit: 5, windowSeconds: 3600 },
} satisfies Record<string, RateLimitRule>;

function upstash(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

export function isRateLimitConfigured(): boolean {
  return upstash() !== null;
}

/**
 * The caller's IP. On Vercel the first x-forwarded-for entry is set by the
 * platform and cannot be spoofed by the client; elsewhere it is best effort.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function rateLimit(rule: RateLimitRule, subject: string): Promise<RateLimitResult> {
  await refreshIntegrations();
  const config = upstash();
  if (!config) return { ok: true, remaining: rule.limit, retryAfter: 0 };

  const key = `rl:${rule.name}:${subject}`;
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: 'POST',
      headers: { authorization: `Bearer ${config.token}`, 'content-type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(rule.windowSeconds), 'NX'],
        ['TTL', key],
      ]),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`upstash ${response.status}`);
    const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(results[0]?.result);
    const ttl = Number(results[2]?.result);
    if (!Number.isFinite(count)) throw new Error('upstash_bad_response');
    return {
      ok: count <= rule.limit,
      remaining: Math.max(0, rule.limit - count),
      retryAfter: Number.isFinite(ttl) && ttl > 0 ? ttl : rule.windowSeconds,
    };
  } catch (error) {
    console.error('[rate-limit] check failed, allowing', rule.name, error);
    return { ok: true, remaining: rule.limit, retryAfter: 0 };
  }
}

/** The 429 every throttled route returns, with a Retry-After the browser can show. */
export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: 'rate_limited', status: 'rate_limited', retryAfter: result.retryAfter },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } },
  );
}
