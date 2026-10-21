import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getMailer, unsubscribeToken } from '@/lib/email';
import { composeEmail } from '@/lib/email/compose';
import { localePath } from '@/lib/i18n';
import { positionLabel } from '@/lib/data/positions';
import { formatSalary, jobFromRow, type Job } from '@/lib/jobs/types';
import { getSiteSettings } from '@/lib/cms/data';
import { formatProductFee } from '@/lib/company/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Weekly email: new jobs.
 *
 * Two audiences share this Monday run:
 *   1. Registered candidates, matched to the role they chose.
 *   2. Footer newsletter subscribers, who get a short digest of every new
 *      job (no role filter). Addresses that already get a candidate alert
 *      are skipped here, so nobody is emailed twice in one week.
 *
 * Only verified candidate addresses are mailed (sending to unverified ones
 * is how a domain ends up in spam). Newsletter sign-ups are already a
 * deliberate address left on the site. Nothing is sent when there is
 * nothing new. The stamp (`job_alert_sent_at` / `last_alert_sent_at`) is
 * written only after the mailer accepts, and a row alerted in the last six
 * days is skipped, so a retried run cannot double-send.
 */

const WEEK_MS = 7 * 86_400_000;
const MIN_GAP_MS = 6 * 86_400_000;
const MAX_JOBS_CANDIDATE = 5;
const MAX_JOBS_NEWSLETTER = 8;

type CandidateRow = {
  id: string;
  full_name: string;
  email: string;
  locale: string | null;
  position: string;
  job_alert_sent_at: string | null;
  payment_status: string | null;
};

type SubscriberRow = {
  id: string;
  email: string;
  locale: string | null;
  last_alert_sent_at: string | null;
};

function jobLine(job: Job, origin: string, locale: string): string {
  const salary = formatSalary(job);
  return `${job.title}, ${job.city}${salary ? ` · ${salary}` : ''}: ${origin}${localePath(locale, `/jobs/${job.slug}`)}`;
}

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

  const openJobs: Job[] = [];
  const byPosition = new Map<string, Job[]>();
  for (const row of jobRows ?? []) {
    const job = jobFromRow(row as Record<string, unknown>);
    if (job.closesAt && new Date(job.closesAt).getTime() < Date.now()) continue;
    openJobs.push(job);
    if (!job.positionSlug) continue;
    byPosition.set(job.positionSlug, [...(byPosition.get(job.positionSlug) ?? []), job]);
  }
  if (openJobs.length === 0) return NextResponse.json({ considered: 0, sent: 0, newsletterSent: 0, reason: 'no_new_jobs' });

  const mailer = getMailer();
  const origin = new URL(request.url).origin;
  const gapBefore = new Date(Date.now() - MIN_GAP_MS).toISOString();
  const settings = await getSiteSettings();
  const packageSoftLine = settings.conversion.mentionPackageInJobAlerts
    ? `Optional reports (${formatProductFee(settings.pricing, 'bundle')} for both): a skills report and a visa-requirements list. The CV and the score are free. Buying does not change shortlist chances.`
    : null;
  let sent = 0;
  const alertedEmails = new Set<string>();

  /* ---------- Registered candidates (role-matched) ---------- */
  const { data: candidateRows, error: candidatesError } = await admin
    .from('candidates')
    .select('id, full_name, email, locale, position, job_alert_sent_at, payment_status')
    .in('position', [...byPosition.keys()])
    .is('unsubscribed_at', null)
    .not('email_verified_at', 'is', null)
    .or(`job_alert_sent_at.is.null,job_alert_sent_at.lt.${gapBefore}`)
    .limit(500);
  if (candidatesError) {
    console.error('[job-alerts] candidates query failed', candidatesError);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  for (const candidate of (candidateRows ?? []) as CandidateRow[]) {
    /* Only jobs published since the last alert, so nobody sees the same job twice. */
    const after = candidate.job_alert_sent_at ? new Date(candidate.job_alert_sent_at).getTime() : 0;
    const jobs = (byPosition.get(candidate.position) ?? [])
      .filter((job) => new Date(job.publishedAt ?? job.createdAt).getTime() > after)
      .slice(0, MAX_JOBS_CANDIDATE);
    if (jobs.length === 0) continue;

    const locale = candidate.locale ?? 'en';
    const first = candidate.full_name.split(' ')[0] || candidate.full_name;
    const role = positionLabel(candidate.position);
    const unsubscribe = `${origin}/api/unsubscribe?c=${candidate.id}&t=${unsubscribeToken(candidate.id)}`;
    const lines = jobs.map((job) => jobLine(job, origin, locale));
    const allJobs = `${origin}${localePath(locale, `/jobs?position=${candidate.position}`)}`;
    const heading = jobs.length === 1 ? `A new ${role} job in Portugal` : `${jobs.length} new ${role} jobs in Portugal`;

    const email = await composeEmail(
      'job_alerts',
      { first_name: first, role, count: String(jobs.length), jobs_heading: heading, jobs: lines.join('\n\n') },
      {
        origin,
        actionUrl: allJobs,
        extra: packageSoftLine && candidate.payment_status !== 'paid' ? [packageSoftLine] : undefined,
        unsubscribe: { label: 'Stop job alerts', url: unsubscribe },
      },
    );
    const result = await mailer.send({ to: candidate.email, ...email, unsubscribeUrl: unsubscribe });
    if (!result.sent) continue;

    const { error } = await admin.from('candidates').update({ job_alert_sent_at: new Date().toISOString() }).eq('id', candidate.id);
    if (error) console.error('[job-alerts] mark failed', candidate.id, error.message);
    sent += 1;
    alertedEmails.add(candidate.email.toLowerCase());
  }

  /* ---------- Footer newsletter (all new jobs) ---------- */
  /* Verified candidates already get role alerts. Keep them off this digest
     even in a week their role has nothing new, so one address never gets
     both lists. */
  const { data: activeCandidateEmails } = await admin
    .from('candidates')
    .select('email')
    .is('unsubscribed_at', null)
    .not('email_verified_at', 'is', null)
    .limit(5000);
  for (const row of activeCandidateEmails ?? []) {
    if (typeof row.email === 'string' && row.email) alertedEmails.add(row.email.toLowerCase());
  }

  let newsletterSent = 0;
  const { data: subscriberRows, error: subscribersError } = await admin
    .from('newsletter_subscribers')
    .select('id, email, locale, last_alert_sent_at')
    .is('unsubscribed_at', null)
    .or(`last_alert_sent_at.is.null,last_alert_sent_at.lt.${gapBefore}`)
    .limit(1000);
  if (subscribersError) {
    console.error('[job-alerts] subscribers query failed', subscribersError);
    return NextResponse.json({
      mailer: mailer.name,
      considered: candidateRows?.length ?? 0,
      sent,
      newsletterSent: 0,
      newsletterError: 'query_failed',
    });
  }

  for (const subscriber of (subscriberRows ?? []) as SubscriberRow[]) {
    if (alertedEmails.has(subscriber.email.toLowerCase())) continue;

    const after = subscriber.last_alert_sent_at ? new Date(subscriber.last_alert_sent_at).getTime() : 0;
    const jobs = openJobs
      .filter((job) => new Date(job.publishedAt ?? job.createdAt).getTime() > after)
      .slice(0, MAX_JOBS_NEWSLETTER);
    if (jobs.length === 0) continue;

    const locale = subscriber.locale ?? 'en';
    const unsubscribe = `${origin}/api/unsubscribe?n=${subscriber.id}&t=${unsubscribeToken(subscriber.id, 'newsletter')}`;
    const lines = jobs.map((job) => jobLine(job, origin, locale));
    const allJobs = `${origin}${localePath(locale, '/jobs')}`;
    const heading = jobs.length === 1 ? 'A new job in Portugal' : `${jobs.length} new jobs in Portugal`;

    const email = await composeEmail(
      'newsletter_jobs',
      { count: String(jobs.length), jobs_heading: heading, jobs: lines.join('\n\n') },
      { origin, actionUrl: allJobs, unsubscribe: { label: 'Unsubscribe', url: unsubscribe } },
    );
    const result = await mailer.send({ to: subscriber.email, ...email, unsubscribeUrl: unsubscribe });
    if (!result.sent) continue;

    const { error } = await admin
      .from('newsletter_subscribers')
      .update({ last_alert_sent_at: new Date().toISOString() })
      .eq('id', subscriber.id);
    if (error) console.error('[job-alerts] newsletter mark failed', subscriber.id, error.message);
    newsletterSent += 1;
  }

  return NextResponse.json({
    mailer: mailer.name,
    considered: candidateRows?.length ?? 0,
    sent,
    newsletterConsidered: subscriberRows?.length ?? 0,
    newsletterSent,
  });
}

export const GET = run;
export const POST = run;
