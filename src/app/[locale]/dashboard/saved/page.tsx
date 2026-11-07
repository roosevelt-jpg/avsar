import Link from 'next/link';
import { notFound } from 'next/navigation';
import { privateMetadata } from '@/lib/seo';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { JobCard } from '@/components/jobs/JobCard';
import { requireCandidate } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { listSavedJobs } from '@/lib/jobs/saved';
import { isLocale, localePath } from '@/lib/i18n';

export const metadata = privateMetadata('Saved jobs');

export default async function SavedJobsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const candidate = await requireCandidate(locale, localePath(locale, '/dashboard/saved'));
  const [settings, savedJobs] = await Promise.all([getSiteSettings(), listSavedJobs(candidate.id)]);

  return (
    <DashboardNav
      locale={locale}
      current="saved"
      candidate={{ fullName: candidate.fullName, emailConfirmed: candidate.emailConfirmed }}
      savedCount={savedJobs.length}
      whatsapp={settings.general.whatsapp}
    >
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="sa-workheading">
          <div>
            <p className="m-0 text-[12px] font-semibold tracking-[0.12em] text-[#b28a49] uppercase">Saved jobs</p>
            <h1 className="m-0 mt-2 text-[29px] font-extrabold text-[#142438]">Jobs you want to revisit</h1>
          </div>
          <Link
            href={localePath(locale, '/jobs')}
            className="t-colors rounded-[5px] bg-[#b28a49] px-4 py-2.5 text-[13px] font-bold text-[#142438] no-underline hover:bg-[#c9a35f]"
          >
            Find more jobs
          </Link>
        </div>

        {savedJobs.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#dfe6ee] bg-white px-6 py-14 text-center">
            <p className="m-0 text-[18px] font-semibold text-[#142438]">No saved jobs yet.</p>
            <p className="m-0 mt-2 text-[15px] text-[#5c7084]">
              Tap Save on a job you like and it will appear here.
            </p>
            <Link
              href={localePath(locale, '/jobs')}
              className="mt-6 inline-flex rounded-[5px] bg-[#142438] px-5 py-3 text-[14px] font-semibold text-white no-underline"
            >
              Browse open jobs
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} locale={locale} saved />
            ))}
          </div>
        )}
      </div>
    </DashboardNav>
  );
}
