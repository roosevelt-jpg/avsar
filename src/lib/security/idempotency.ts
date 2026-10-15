import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { log, requestIdOf } from '@/lib/observability/log';

/**
 * Replays the first response to a retried request instead of applying it twice.
 *
 * Candidates apply and pay on mobile data that drops mid-request. The browser
 * shows an error, they tap again, and without this the second tap can create a
 * second checkout or move a batch of applications twice. The client sends an
 * `Idempotency-Key` header, fresh for each deliberate action and reused for
 * retries of it; the first response is stored for a day and returned to
 * every retry with `Idempotent-Replay: true`.
 *
 * Without the header, or without a database, the handler simply runs: the
 * header is a safety net, not a requirement.
 */

export const IDEMPOTENCY_HEADER = 'idempotency-key';
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const TTL_HOURS = 24;

/** A stable, non-reversible stand-in for an IP, for anonymous callers. */
export function anonymousActor(ip: string): string {
  return `ip:${createHash('sha256').update(`idem:${ip}`).digest('hex').slice(0, 24)}`;
}

export async function withIdempotency(
  request: Request,
  scope: string,
  actor: string,
  run: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const key = request.headers.get(IDEMPOTENCY_HEADER);
  if (!key || !isSupabaseConfigured()) return run();
  if (!KEY_PATTERN.test(key)) return NextResponse.json({ error: 'invalid_idempotency_key' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return run();

  /* Claim the key. The primary key on (scope, key) makes this the lock: of two
     identical requests racing, exactly one insert succeeds. */
  const { error: claimError } = await admin.from('idempotency_keys').insert({ scope, key, actor });

  if (claimError) {
    if (claimError.code !== '23505') {
      /* The table is unavailable. Running is better than refusing a candidate. */
      log.warn('idempotency.claim_failed', { scope, requestId: requestIdOf(request), error: claimError.message });
      return run();
    }
    const { data: existing } = await admin
      .from('idempotency_keys')
      .select('actor, status_code, response, created_at')
      .eq('scope', scope)
      .eq('key', key)
      .maybeSingle();

    if (!existing || existing.actor !== actor) {
      return NextResponse.json({ error: 'idempotency_key_conflict' }, { status: 409 });
    }
    if (existing.status_code == null) {
      /* The first request is still running. Say so rather than run it twice. */
      return NextResponse.json({ error: 'in_progress', status: 'in_progress' }, { status: 409, headers: { 'retry-after': '2' } });
    }
    return NextResponse.json(existing.response ?? {}, {
      status: Number(existing.status_code),
      headers: { 'idempotent-replay': 'true' },
    });
  }

  let response: NextResponse;
  try {
    response = await run();
  } catch (error) {
    await admin.from('idempotency_keys').delete().eq('scope', scope).eq('key', key);
    throw error;
  }

  /* Server errors are not remembered, so a retry gets a real second attempt.
     Everything else, refusals included, is the answer this request gets. */
  if (response.status >= 500) {
    await admin.from('idempotency_keys').delete().eq('scope', scope).eq('key', key);
  } else {
    const body = await response.clone().json().catch(() => ({}));
    await admin.from('idempotency_keys').update({ status_code: response.status, response: body }).eq('scope', scope).eq('key', key);
  }

  /* Housekeeping on a small share of requests, so the table never needs a cron. */
  if (Math.random() < 0.02) {
    const cutoff = new Date(Date.now() - TTL_HOURS * 3600_000).toISOString();
    await admin.from('idempotency_keys').delete().lt('created_at', cutoff);
  }

  return response;
}
