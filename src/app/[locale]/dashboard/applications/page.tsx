import Link from 'next/link';
import { privateMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { ApplicationTracker } from '@/components/candidate/ApplicationTracker';
import { ApplicationStats } from '@/components/candidate/ApplicationStats';
import { JobCard } from '@/components/jobs/JobCard';
import { listCandidateApplications } from '@/lib/applications/data';
import { STATUS_META } from '@/lib/applications/status';
import { requireCandidate } from '@/lib/auth';
import { recommendedJobs } from '@/lib/jobs/data';
import { isLocale, localePath } from '@/lib/i18n';

export const metadata = privateMetadata('My applications');

export default async function ApplicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const candidate = await requireCandidate(locale, localePath(locale, '/dashboard/applications'));
  const position = candidate.position;

  const applications = await listCandidateApplications(candidate.id);
  const active = applications.filter((a) => STATUS_META[a.status].tone !== 'stopped');
  const closed = applications.filter((a) => STATUS_META[a.status].tone === 'stopped');
  const suggestions = await recommendedJobs(position, applications.map((a) => a.job.id), 3);

  return (
    <>
      <DashboardNav locale={locale} current="applications" />
      <main className="px-[clamp(20px,4cqi,56px)] py-[clamp(28px,5cqi,56px)]">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="m-0 font-mono text-[12px] uppercase tracking-[0.12em] text-accent">Your applications</p>
              <h1 className="m-0 mt-2 text-[clamp(28px,4cqi,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
                {active.length ? `${active.length} in progress` : 'Nothing in progress yet'}
              </h1>
            </div>
            <Link href={localePath(locale, '/jobs')} className="t-colors rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-paper no-underline hover:bg-ink-hover">
              Find more jobs
            </Link>
          </div>

          {applications.length > 0 && (
            <div className="mt-8">
              <ApplicationStats applications={applications} />
            </div>
          )}

          {applications.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
              <p className="m-0 text-[19px] font-semibold">You have not applied to any jobs yet.</p>
              <p className="m-0 mt-2 text-[15px] text-ink-2">Applying is free and takes a minute. Every application you send appears here with its progress.</p>
              <Link href={localePath(locale, '/jobs')} className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-[15px] text-paper no-underline">Browse open jobs</Link>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-4">
              {active.map((application) => (
                <ApplicationTracker key={application.id} application={application} locale={locale} />
              ))}
              {closed.length > 0 && (
                <details className="rounded-[20px] border border-line bg-paper p-4">
                  <summary className="cursor-pointer text-[15px] text-ink-2">Closed and withdrawn ({closed.length})</summary>
                  <div className="mt-4 flex flex-col gap-4">
                    {closed.map((application) => (
                      <ApplicationTracker key={application.id} application={application} locale={locale} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {suggestions.length > 0 && (
            <section className="mt-14">
              <h2 className="m-0 mb-5 text-[24px] font-semibold tracking-[-0.02em]">Jobs you might like</h2>
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((job) => (
                  <li key={job.id}>
                    <JobCard job={job} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
