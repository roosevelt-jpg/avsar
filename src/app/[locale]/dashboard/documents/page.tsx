import Link from 'next/link';
import { notFound } from 'next/navigation';
import { privateMetadata } from '@/lib/seo';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { CvUpload } from '@/components/candidate/CvUpload';
import { requireCandidate } from '@/lib/auth';
import { getCandidateStatus } from '@/lib/candidate/status';
import { getSiteSettings } from '@/lib/cms/data';
import { getDictionary, isLocale, localePath } from '@/lib/i18n';
import { listSavedJobs } from '@/lib/jobs/saved';

export const metadata = privateMetadata('CV & documents');

/**
 * Candidate documents workspace from the HTML-44 pack. CV upload lives here;
 * relocation paperwork stays on the visa page so the two vaults stay clear.
 */
export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const candidate = await requireCandidate(locale, localePath(locale, '/dashboard/documents'));
  const [status, settings, savedJobs] = await Promise.all([
    getCandidateStatus(candidate.id, candidate.paymentStatus),
    getSiteSettings(),
    listSavedJobs(candidate.id),
  ]);

  return (
    <DashboardNav
      locale={locale}
      current="documents"
      candidate={{ fullName: candidate.fullName, emailConfirmed: candidate.emailConfirmed }}
      savedCount={savedJobs.length}
      whatsapp={settings.general.whatsapp}
    >
      <div className="mx-auto w-full max-w-[840px]">
        <div className="sa-workheading">
          <div>
            <p className="m-0 text-[12px] font-semibold tracking-[0.12em] text-[#b28a49] uppercase">CV &amp; documents</p>
            <h1 className="m-0 mt-2 text-[29px] font-extrabold text-[#142438]">Your recruitment file</h1>
          </div>
        </div>
        <p className="m-0 mb-6 max-w-[62ch] text-[15px] leading-[1.55] text-[#5c7084]">
          Keep your CV current here. Passport, police clearance and visa papers live under Visa &amp; Relocation.
        </p>

        <div className="mb-5 rounded-[12px] border border-[#dfe6ee] bg-white p-5">
          <CvUpload t={t} alreadyUploaded={status.cvUploaded} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={localePath(locale, '/profile')}
            className="rounded-[12px] border border-[#dfe6ee] bg-white p-5 no-underline hover:border-[#b28a49]"
          >
            <h2 className="m-0 text-[18px] font-bold text-[#142438]">Profile settings</h2>
            <p className="m-0 mt-2 text-[14px] text-[#5c7084]">Experience, education, skills and voice intro.</p>
          </Link>
          <Link
            href={localePath(locale, '/dashboard/relocation')}
            className="rounded-[12px] border border-[#dfe6ee] bg-white p-5 no-underline hover:border-[#b28a49]"
          >
            <h2 className="m-0 text-[18px] font-bold text-[#142438]">Visa &amp; relocation vault</h2>
            <p className="m-0 mt-2 text-[14px] text-[#5c7084]">Passport, police clearance and arrival steps.</p>
          </Link>
        </div>
      </div>
    </DashboardNav>
  );
}
