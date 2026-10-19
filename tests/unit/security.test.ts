import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientIp, rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { captureServerError } from '@/lib/monitoring/sentry';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('rateLimit', () => {
  it('allows everything when Upstash is not configured', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const fetchMock = stubFetch([]);
    const result = await rateLimit(RATE_LIMITS.apply, '1.2.3.4');
    expect(result.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throttles once the count passes the limit and reports the TTL', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example/');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok');
    const fetchMock = stubFetch([{ result: RATE_LIMITS.apply.limit + 1 }, { result: 0 }, { result: 42 }]);
    const result = await rateLimit(RATE_LIMITS.apply, '1.2.3.4');
    expect(result).toEqual({ ok: false, remaining: 0, retryAfter: 42 });
    expect(fetchMock).toHaveBeenCalledWith('https://redis.example/pipeline', expect.objectContaining({ method: 'POST' }));
  });

  it('allows up to the limit', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok');
    stubFetch([{ result: RATE_LIMITS.apply.limit }, { result: 1 }, { result: 60 }]);
    expect((await rateLimit(RATE_LIMITS.apply, 'x')).ok).toBe(true);
  });

  it('fails open when Redis errors', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch({}, false);
    expect((await rateLimit(RATE_LIMITS.register, 'x')).ok).toBe(true);
  });

  it('reads the first forwarded IP', () => {
    const request = new Request('https://x.test', { headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' } });
    expect(clientIp(request)).toBe('9.9.9.9');
    expect(clientIp(new Request('https://x.test'))).toBe('unknown');
  });
});

describe('verifyTurnstile', () => {
  it('passes without a secret', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    expect(await verifyTurnstile(null, 'ip')).toBe(true);
  });

  it('refuses a missing token when configured', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    expect(await verifyTurnstile(null, 'ip')).toBe(false);
  });

  it('trusts only success: true from Cloudflare', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    stubFetch({ success: true });
    expect(await verifyTurnstile('token', '1.2.3.4')).toBe(true);
    stubFetch({ success: false });
    expect(await verifyTurnstile('token', '1.2.3.4')).toBe(false);
  });
});

describe('captureServerError', () => {
  it('sends nothing without a DSN', async () => {
    vi.stubEnv('SENTRY_DSN', '');
    const fetchMock = stubFetch({});
    await captureServerError(new Error('boom'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts an envelope without query strings or headers', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://abc123@o1.ingest.sentry.io/456');
    const fetchMock = stubFetch({});
    await captureServerError(new Error('boom'), { path: '/en/jobs?email=a@b.c', method: 'GET' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://o1.ingest.sentry.io/api/456/envelope/?sentry_key=abc123&sentry_version=7');
    const body = String(init.body);
    expect(body).toContain('"value":"boom"');
    expect(body).toContain('"url":"/en/jobs"');
    expect(body).not.toContain('a@b.c');
  });
});
