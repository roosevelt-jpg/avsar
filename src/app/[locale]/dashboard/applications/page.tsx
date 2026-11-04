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
import { getSiteSettings } from '@/lib/cms/data';
import { recommendedJobs } from '@/lib/jobs/data';
import { listSavedJobs } from '@/lib/jobs/saved';
import { isLocale, localePath } from '@/lib/i18n';

export const metadata = privateMetadata('My applications');

export default async function ApplicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const candidate = await requireCandidate(locale, localePath(locale, '/dashboard/applications'));
  const position = candidate.position;
  const settings = await getSiteSettings();

  const [applications, savedJobs] = await Promise.all([
    listCandidateApplications(candidate.id),
    listSavedJobs(candidate.id),
  ]);
  const active = applications.filter((a) => STATUS_META[a.status].tone !== 'stopped');
  const closed = applications.filter((a) => STATUS_META[a.status].tone === 'stopped');
  const suggestions = await recommendedJobs(position, applications.map((a) => a.job.id), 3);

  return (
    <DashboardNav
      locale={locale}
      current="applications"
      candidate={{ fullName: candidate.fullName, emailConfirmed: candidate.emailConfirmed }}
      savedCount={savedJobs.length}
      whatsapp={settings.general.whatsapp}
    >
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="m-0 font-mono text-[12px] uppercase tracking-[0.12em] text-[#b28a49]">Your applications</p>
            <h1 className="m-0 mt-2 text-[clamp(28px,4cqi,44px)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#142438]">
              {active.length ? `${active.length} in progress` : 'Nothing in progress yet'}
            </h1>
          </div>
          <Link
            href={localePath(locale, '/jobs')}
            className="t-colors rounded-[8px] bg-[#b28a49] px-5 py-3 text-[15px] font-semibold text-[#142438] no-underline hover:bg-[#c9a35f]"
          >
            Find more jobs
          </Link>
        </div>

        {applications.length > 0 && (
          <div className="mt-8">
            <ApplicationStats applications={applications} />
          </div>
        )}

        {applications.length === 0 ? (
          <div className="mt-8 rounded-[16px] border border-dashed border-[#142438]/2 bg-white px-6 py-14 text-center">
            <p className="m-0 text-[19px] font-semibold text-[#142438]">You have not applied to any jobs yet.</p>
            <p className="m-0 mt-2 text-[15px] text-ink-2">
              Applying is free and takes a minute. Every application you send appears here with its progress.
            </p>
            <Link
              href={localePath(locale, '/jobs')}
              className="mt-6 inline-flex rounded-[8px] bg-[#142438] px-5 py-3 text-[15px] text-white no-underline"
            >
              Browse open jobs
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {active.map((application) => (
              <ApplicationTracker key={application.id} application={application} locale={locale} />
            ))}
            {closed.length > 0 && (
              <details className="rounded-[16px] border border-line bg-white p-4">
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
            <h2 className="m-0 mb-5 text-[24px] font-semibold tracking-[-0.02em] text-[#142438]">Jobs you might like</h2>
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
    </DashboardNav>
  );
}
