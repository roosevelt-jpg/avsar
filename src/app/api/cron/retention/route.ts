import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { eraseCandidate } from '@/lib/privacy/erase';
import { log } from '@/lib/observability/log';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** The owner's answer: data is kept for one year after an application ends. */
const RETENTION_DAYS = 365;
const BATCH = 100;

/* Applications in these states have ended. Anything else is still moving and
   keeps the candidate's data, however old the account is. */
const ENDED = new Set(['relocated', 'rejected', 'withdrawn']);

/**
 * Daily: erase candidates whose data has outlived its purpose.
 *
 * A candidate is erased when their account is over a year old, none of their
 * applications is still open, nothing on an application has changed for a
 * year, and they have not paid for the package within the year. Someone who
 * never applied is kept for a year from registration, which is what the
 * privacy page says. The erase itself is the same one staff use, so payment
 * records and the audit trail survive as the law requires.
 */
async function run(request: Request) {
  await refreshIntegrations();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();

  const { data: old, error } = await admin
    .from('candidates')
    .select('id')
    .is('erased_at', null)
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(BATCH);
  if (error) {
    log.error('retention.list_failed', { error: error.message });
    return NextResponse.json({ error: 'list_failed' }, { status: 500 });
  }

  const ids = (old ?? []).map((row) => String(row.id));
  if (ids.length === 0) return NextResponse.json({ erased: 0, kept: 0 });

  const [applications, payments] = await Promise.all([
    admin.from('applications').select('candidate_id, status, status_changed_at').in('candidate_id', ids),
    admin.from('payments').select('candidate_id').eq('status', 'paid').gte('paid_at', cutoff).in('candidate_id', ids),
  ]);

  const keep = new Set<string>((payments.data ?? []).map((row) => String(row.candidate_id)));
  for (const application of applications.data ?? []) {
    const candidateId = String(application.candidate_id);
    if (!ENDED.has(String(application.status))) keep.add(candidateId);
    else if (String(application.status_changed_at) >= cutoff) keep.add(candidateId);
  }

  let erased = 0;
  for (const id of ids) {
    if (keep.has(id)) continue;
    const result = await eraseCandidate(admin, id);
    if (result.status === 'erased') erased += 1;
  }

  log.info('retention.run', { checked: ids.length, erased, kept: ids.length - erased });
  return NextResponse.json({ erased, kept: ids.length - erased });
}

export const GET = run;
export const POST = run;
