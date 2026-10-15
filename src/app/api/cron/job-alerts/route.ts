import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getMailer, unsubscribeToken } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { localePath } from '@/lib/i18n';
import { positionLabel } from '@/lib/data/positions';
import { formatSalary, jobFromRow, type Job } from '@/lib/jobs/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Weekly email: new jobs for the role each candidate chose.
 *
 * Only to candidates who proved their address (sending to unverified ones is
 * how a domain ends up in spam) and who have not unsubscribed. Nothing is sent
 * when there is nothing new; an alert with no jobs teaches people to ignore
 * the next one. `job_alert_sent_at` is stamped only after the mailer accepts,
 * and a candidate alerted in the last six days is skipped, so a retried run
 * cannot double-send.
 */

const WEEK_MS = 7 * 86_400_000;
const MIN_GAP_MS = 6 * 86_400_000;
const MAX_JOBS = 5;

type CandidateRow = {
  id: string;
  full_name: string;
  email: string;
  locale: string | null;
  position: string;
  job_alert_sent_at: string | null;
};

async function run(request: Request) {
  await refreshIntegrations();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const since = new Date(Date.now() - WEEK_MS).toISOString();
  const { data: jobRows, error: jobsError } = await admin
    .from('job_postings')
    .select('*')
    .eq('status', 'published')
    .gte('published_at', since)
    .order('published_at', { ascending: false })
    .limit(200);
  if (jobsError) {
    console.error('[job-alerts] jobs query failed', jobsError);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const byPosition = new Map<string, Job[]>();
  for (const row of jobRows ?? []) {
    const job = jobFromRow(row as Record<string, unknown>);
    if (!job.positionSlug || (job.closesAt && new Date(job.closesAt).getTime() < Date.now())) continue;
    byPosition.set(job.positionSlug, [...(byPosition.get(job.positionSlug) ?? []), job]);
  }
  if (byPosition.size === 0) return NextResponse.json({ considered: 0, sent: 0, reason: 'no_new_jobs' });

  const { data: candidateRows, error: candidatesError } = await admin
    .from('candidates')
    .select('id, full_name, email, locale, position, job_alert_sent_at')
    .in('position', [...byPosition.keys()])
    .is('unsubscribed_at', null)
    .not('email_verified_at', 'is', null)
    .or(`job_alert_sent_at.is.null,job_alert_sent_at.lt.${new Date(Date.now() - MIN_GAP_MS).toISOString()}`)
    .limit(500);
  if (candidatesError) {
    console.error('[job-alerts] candidates query failed', candidatesError);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const mailer = getMailer();
  const origin = new URL(request.url).origin;
  let sent = 0;

  for (const candidate of (candidateRows ?? []) as CandidateRow[]) {
    /* Only jobs published since the last alert, so nobody sees the same job twice. */
    const after = candidate.job_alert_sent_at ? new Date(candidate.job_alert_sent_at).getTime() : 0;
    const jobs = (byPosition.get(candidate.position) ?? [])
      .filter((job) => new Date(job.publishedAt ?? job.createdAt).getTime() > after)
      .slice(0, MAX_JOBS);
    if (jobs.length === 0) continue;

    const locale = candidate.locale ?? 'en';
    const first = candidate.full_name.split(' ')[0] || candidate.full_name;
    const role = positionLabel(candidate.position);
    const unsubscribe = `${origin}/api/unsubscribe?c=${candidate.id}&t=${unsubscribeToken(candidate.id)}`;
    const lines = jobs.map((job) => `${job.title}, ${job.city}${formatSalary(job) ? ` · ${formatSalary(job)}` : ''}: ${origin}${localePath(locale, `/jobs/${job.slug}`)}`);
    const allJobs = `${origin}${localePath(locale, `/jobs?position=${candidate.position}`)}`;
    const heading = jobs.length === 1 ? `A new ${role} job in Portugal` : `${jobs.length} new ${role} jobs in Portugal`;

    const email = await composeEmail(
      'job_alerts',
      { first_name: first, role, count: String(jobs.length), jobs_heading: heading, jobs: lines.join('\n\n') },
      { origin, actionUrl: allJobs, unsubscribe: { label: 'Stop job alerts', url: unsubscribe } },
    );
    const result = await mailer.send({ to: candidate.email, ...email, unsubscribeUrl: unsubscribe });
    if (!result.sent) continue;

    const { error } = await admin.from('candidates').update({ job_alert_sent_at: new Date().toISOString() }).eq('id', candidate.id);
    if (error) console.error('[job-alerts] mark failed', candidate.id, error.message);
    sent += 1;
  }

  return NextResponse.json({ mailer: mailer.name, considered: candidateRows?.length ?? 0, sent });
}

export const GET = run;
export const POST = run;
