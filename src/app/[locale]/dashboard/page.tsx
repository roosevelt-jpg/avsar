import { headers } from 'next/headers';
import { privateMetadata } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { VisibilityToggle } from '@/components/candidate/VisibilityToggle';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { listCandidateApplications } from '@/lib/applications/data';
import { STATUS_META } from '@/lib/applications/status';
import { ApplicationStats } from '@/components/candidate/ApplicationStats';
import { JourneyStatus } from '@/components/candidate/JourneyStatus';
import { VerifyEmailBanner } from '@/components/candidate/VerifyEmailBanner';
import { UnlockReport } from '@/components/candidate/UnlockReport';
import { PackageOfferBanner } from '@/components/candidate/PackageOfferBanner';
import { StickyPackageCta } from '@/components/candidate/StickyPackageCta';
import { availablePaymentMethods, getPaymentProvider } from '@/lib/payments';
import { getSiteSettings } from '@/lib/cms/data';
import { formatFee } from '@/lib/company/config';
import { getCandidateStatus, type CandidateStatus } from '@/lib/candidate/status';
import { CareerPack } from '@/components/candidate/CareerPack';
import { getAdminSupabase } from '@/lib/supabase/admin';
import type { CareerPack as Pack } from '@/lib/cv/coach-schema';
import { fill, getDictionary, isLocale, localePath } from '@/lib/i18n';
import { canReceiveReport, requireCandidate } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { sectorLabel, SECTOR_SLUGS, type SectorSlug } from '@/lib/data/sectors';
import { englishBand, skillBand } from '@/lib/report/bands';
import { listSavedJobs } from '@/lib/jobs/saved';
import { formatSalary } from '@/lib/jobs/types';
import { interviewTimes } from '@/lib/interviews/time';
import { deliveredReviewFor } from '@/lib/legal/review';
import { backgroundFor, EMPTY_BACKGROUND } from '@/lib/candidate/background';
import { BackgroundForm } from '@/components/candidate/BackgroundForm';

export const metadata = privateMetadata('Your dashboard');

type DashboardReport = {
  name: string;
  overall: number;
  percentile: number;
  english: string;
  skills: number;
  experienceScore: number;
  years: number;
  sector: string;
  breakdown: { label: string; score: number }[];
};

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ offer?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const d = t.dash;
  const query = await searchParams;
  const showOffer = query.offer === '1';

  let r: DashboardReport | null = null;
  let pack: Pack | null = null;
  let whatsappOptIn = false;
  const settings = await getSiteSettings();
  const fee = formatFee(settings.pricing);

  const candidate = await requireCandidate(locale, localePath(locale, '/dashboard'));
  const candidateId = candidate.id;
  const visible = candidate.visibleToEmployers;
  const status: CandidateStatus = await getCandidateStatus(candidate.id, candidate.paymentStatus);
  /* Shown only while the address is unproved, and it is the only thing on this
     page that asks for anything. The report is what the proof releases. */
  const unverifiedEmail = candidate.emailConfirmed ? null : candidate.email;
  {

    const admin = getAdminSupabase();
    const { data: prefs } = (await admin
      ?.from('candidates')
      .select('whatsapp_opt_in_at')
      .eq('id', candidate.id)
      .maybeSingle()) ?? { data: null };
    whatsappOptIn = Boolean(prefs?.whatsapp_opt_in_at);

    const { data: stored } = (await admin
      ?.from('career_packs')
      .select('strengths, improvements, interview, improved_cv, translated')
      .eq('candidate_id', candidate.id)
      .maybeSingle()) ?? { data: null };

    if (stored) {
      pack = {
        strengths: stored.strengths,
        improvements: stored.improvements,
        interview: stored.interview,
        improvedCv: stored.improved_cv,
        translated: stored.translated,
      } as Pack;
    }

    const supabase = await getServerSupabase();
    const { data: report } = (await supabase
      ?.from('reports')
      .select('overall_score, english_cefr, skills_score, experience_score, percentile, breakdown')
      .eq('candidate_id', candidate.id)
      .maybeSingle()) ?? { data: null };

    const sector: SectorSlug = (SECTOR_SLUGS as readonly string[]).includes(candidate.sector ?? '')
      ? (candidate.sector as SectorSlug)
      : SECTOR_SLUGS[0];

    if (report) {
      /* Axes come from the item bank and differ by sector, so the labels are
         read from the report rather than from a fixed list in the dictionary:
         a driver has no "housekeeping standards" score. */
      const breakdown = Array.isArray(report.breakdown)
        ? (report.breakdown as { label?: string; score?: number }[]).map((entry) => ({
            label: entry.label ?? '',
            score: entry.score ?? 0,
          }))
        : [];
      r = {
        name: candidate.fullName,
        overall: report.overall_score as number,
        percentile: (report.percentile as number | null) ?? 0,
        english: report.english_cefr as string,
        skills: report.skills_score as number,
        experienceScore: report.experience_score as number,
        years: [0, 2, 4, 6][candidate.yearsBand ?? 0] ?? 0,
        sector: sectorLabel(sector),
        breakdown,
      };
    }
  }
  /* Not assessed yet, or assessed but not scored: the page says plainly that
     the report is not ready rather than showing a placeholder score. */
  const reportReady = r !== null;

  /* Applications sit at the top: for most candidates "where is my
     application?" is the reason they signed in. */
  const [applications, savedJobs, legalReview, background] = await Promise.all([
    listCandidateApplications(candidateId),
    listSavedJobs(candidateId),
    deliveredReviewFor(candidateId),
    backgroundFor(candidateId),
  ]);
  const nextInterview = applications
    .flatMap((application) => application.interviews.map((interview) => ({ interview, application })))
    .sort((a, b) => a.interview.startsAt.localeCompare(b.interview.startsAt))[0];

  const stats = !r ? [] : [
    { label: d.overall, value: String(r.overall), suffix: '/100', note: fill(d.overallNote, { percentile: r.percentile }), dark: true },
    /* The word under the number comes from the number. See lib/report/bands. */
    { label: d.englishLabel, value: r.english, note: englishBand(r.english, t), dark: false },
    {
      label: fill(d.skillsLabel, { sector: r.sector }),
      value: String(r.skills),
      note: skillBand(r.skills, t),
      dark: false,
    },
    { label: d.expLabel, value: String(r.experienceScore), note: fill(d.expNote, { years: r.years }), dark: false },
  ];

  return (
    <>
      <DashboardNav locale={locale} current="overview" />

      <main
        className={`px-[clamp(16px,4cqi,56px)] py-[clamp(28px,5cqi,64px)] ${
          status.awaitingPayment ? 'pb-28 md:pb-[clamp(28px,5cqi,64px)]' : ''
        }`}
      >
        {unverifiedEmail && <VerifyEmailBanner email={unverifiedEmail} t={t} />}

        {status.awaitingPayment && showOffer ? (
          <PackageOfferBanner locale={locale} conversion={settings.conversion} fee={fee} />
        ) : null}

        {/* The assessment is done and the fee is outstanding. This is the only
            place the fee is asked for, and it sits above the report so the
            score they already have is visible while they decide. */}
        {status.awaitingPayment && (
          <UnlockReport
            t={t}
            locale={locale}
            price={fee}
            pricing={settings.pricing}
            conversion={settings.conversion}
            hiring={settings.hiring}
            methods={availablePaymentMethods()}
            provider={getPaymentProvider().name}
            country={(await headers()).get('x-vercel-ip-country')}
            providerMode={(() => {
              const name = getPaymentProvider().name;
              if (name === 'eximpe') return process.env.EXIMPE_ENV === 'production' ? 'production' : 'sandbox';
              if (name === 'paytm') return process.env.PAYTM_ENV === 'production' ? 'production' : 'sandbox';
              return process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
            })()}
          />
        )}
        {/* Until the test is finished there is no report to unlock and nothing
            for employers to search, so finishing it is the first thing asked. */}
        {!status.assessmentComplete && (
          <section className="mb-10 rounded-[24px] border border-accent/40 bg-accent-tint p-5 sm:p-6">
            <Mono className="text-accent-deep">
              {status.sectionsDone.length === 0
                ? 'Your next step'
                : `${status.sectionsDone.length} of ${status.sectionsTotal} parts done`}
            </Mono>
            <h2 className="m-0 mt-2 text-[22px] font-semibold tracking-[-0.02em]">
              {status.sectionsDone.length === 0 ? 'Take the skills test' : 'Finish your skills test'}
            </h2>
            <p className="m-0 mt-2 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
              Skills and English questions for your trade, up to 90 minutes on your phone, and free. Once you finish, you
              are in our recruitment database and your result goes with every application you send. Scores above{' '}
              {settings.hiring.shortlistMinScore / 10} out of 10 qualify for the shortlist, whether or not you buy anything. The career package (
              {fee}) is optional.
            </p>
            <Link
              href={localePath(locale, status.nextSection ? `/assessment?section=${status.nextSection}` : '/assessment')}
              className="t-colors mt-4 inline-flex rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-paper no-underline hover:bg-ink-hover"
            >
              {status.sectionsDone.length === 0 ? 'Start the test' : 'Continue the test'}
            </Link>
          </section>
        )}
        <section className="mb-10 rounded-[24px] border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">My applications</h2>
            <div className="flex gap-2">
              <Link href={localePath(locale, '/jobs')} className="t-colors rounded-full border border-line-strong px-4 py-2 text-[14px] text-ink no-underline hover:border-ink">
                Find jobs
              </Link>
              {applications.length > 0 && (
                <Link href={localePath(locale, '/dashboard/applications')} className="t-colors rounded-full bg-ink px-4 py-2 text-[14px] text-paper no-underline">
                  Track all
                </Link>
              )}
            </div>
          </div>
          {nextInterview && (
            <Link
              href={localePath(locale, '/dashboard/applications')}
              className="mt-4 block rounded-[16px] border border-accent/40 bg-accent-tint px-4 py-3 text-ink no-underline"
            >
              <span className="block font-mono text-[11px] uppercase tracking-[0.1em] text-accent-deep">Next interview</span>
              <span className="mt-1 block text-[15px] font-medium">{nextInterview.application.job.title}</span>
              <span className="block text-[14px] text-ink-2">{interviewTimes(nextInterview.interview.startsAt).both}</span>
            </Link>
          )}
          {applications.length > 0 && (
            <div className="mt-4">
              <ApplicationStats applications={applications} />
            </div>
          )}
          {applications.length === 0 ? (
            <p className="m-0 mt-3 text-[15px] text-ink-2">
              You have not applied to a job yet. Applying is free:{' '}
              <Link href={localePath(locale, '/jobs')} className="prose-link">see open jobs</Link>.
            </p>
          ) : (
            <ul className="m-0 mt-4 flex list-none flex-col divide-y divide-line-soft p-0">
              {applications.slice(0, 4).map((application) => (
                <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="m-0 text-[15px] font-medium">{application.job.title}</p>
                    <p className="m-0 font-mono text-[12px] text-muted">
                      {application.job.city} · {application.reference}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent-tint px-3 py-1 text-[13px] text-accent-deep">
                    {STATUS_META[application.status].candidateTitle}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {savedJobs.length > 0 && (
          <section className="mb-10 rounded-[24px] border border-line bg-surface p-5 sm:p-6">
            <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">Saved jobs</h2>
            <p className="m-0 mt-1 text-[14px] text-muted">Jobs you marked with the heart. Closed jobs drop off this list.</p>
            <ul className="m-0 mt-4 flex list-none flex-col divide-y divide-line-soft p-0">
              {savedJobs.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={localePath(locale, `/jobs/${job.slug}`)} className="text-[15px] font-medium text-ink no-underline hover:text-accent">
                      {job.title}
                    </Link>
                    <p className="m-0 font-mono text-[12px] text-muted">{[job.city, formatSalary(job)].filter(Boolean).join(' · ')}</p>
                  </div>
                  <Link href={localePath(locale, `/jobs/${job.slug}`)} className="t-colors rounded-full border border-line-strong px-4 py-2 text-[14px] text-ink no-underline hover:border-ink">
                    View and apply
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Mono className="text-muted">{fill(d.greeting, { name: candidate.fullName.split(' ')[0] ?? candidate.fullName })}</Mono>
        <div className="mt-3 mb-9 flex flex-wrap items-end justify-between gap-4">
          <h1 className="m-0 text-[clamp(28px,4cqi,48px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {reportReady ? d.title : d.pending}
          </h1>
          {canReceiveReport(candidate) ? (
            <Link
              href={localePath(locale, '/dashboard/report.pdf')}
              className="t-colors rounded-[12px] border border-line-strong bg-surface px-4 py-2.5 text-[14px] no-underline hover:border-ink"
            >
              {d.download}
            </Link>
          ) : null}
        </div>

        {!reportReady && (
          <p className="mt-0 mb-9 max-w-[62ch] rounded-[16px] border border-line bg-surface px-5 py-4 text-[15px] leading-[1.6] text-ink-2">
            {d.pendingNote}
          </p>
        )}

        {/* stat cards */}
        {reportReady && (
        <ul className="m-0 mb-10 grid list-none grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 p-0">
          {stats.map((stat) => (
            <li
              key={stat.label}
              className={`rounded-[20px] border p-[22px] ${
                stat.dark ? 'border-ink bg-ink text-paper' : 'border-line bg-surface'
              }`}
            >
              <Mono className={stat.dark ? 'text-dark-muted' : 'text-muted'}>{stat.label}</Mono>
              <p className="mt-3 mb-1 text-[34px] font-semibold leading-none tracking-[-0.03em]">
                {stat.value}
                {stat.suffix ? (
                  <span className={`text-[16px] font-normal ${stat.dark ? 'text-dark-muted' : 'text-muted'}`}>
                    {stat.suffix}
                  </span>
                ) : null}
              </p>
              <p className={`m-0 text-[13px] ${stat.dark ? 'text-dark-muted-2' : 'text-muted'}`}>{stat.note}</p>
            </li>
          ))}
        </ul>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[clamp(20px,3cqi,40px)]">
          <JourneyStatus locale={locale} t={t} status={status} />

          {/* report breakdown */}
          <section hidden={!reportReady}>
            <h2 className="m-0 mb-5 text-[21px] font-semibold">{d.breakdown}</h2>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {(r?.breakdown ?? []).map((axis) => (
                <li key={axis.label}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-[15px]">{axis.label}</span>
                    <Mono className="text-muted">{axis.score}</Mono>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${axis.score}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* The part of the fee the candidate keeps, whether or not they are
            ever placed. It sits above the visibility switch because it is the
            thing they came back for. */}
        {/* Generate is paid-gated on the API; the button must match or unpaid
            candidates hit a 402 after pressing Build. */}
        {(status.paid || pack) && (
          <div className="mt-12">
            <CareerPack pack={pack} canGenerate={status.paid && status.reportReady} locale={locale} />
          </div>
        )}

        {/* The package's legal review needs documents to review, so a buyer
            without one delivered yet is pointed at the upload page. */}
        {(legalReview || status.paid) && (
          <section className="mt-12 rounded-[24px] border border-line bg-surface p-5 sm:p-6">
            <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">Preliminary legal review</h2>
            {legalReview ? (
              <>
                <dl className="m-0 mt-4 flex flex-col gap-4 text-[15px] leading-[1.6]">
                  {[
                    ['Summary', legalReview.summary],
                    ['What a Portuguese work visa needs', legalReview.requirements],
                    ['Still missing', legalReview.missingDocuments],
                    ['Needs a closer look', legalReview.issues],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt className="font-medium">{label}</dt>
                        <dd className="m-0 whitespace-pre-line text-ink-2">{value}</dd>
                      </div>
                    ))}
                </dl>
                <p className="m-0 mt-4 text-[13px] text-muted">
                  A preliminary review of the documents you provided by our legal team. It is not permission to work and not
                  a decision on a visa: those are made only by the authorities.
                </p>
              </>
            ) : (
              <p className="m-0 mt-2 text-[15px] leading-[1.6] text-ink-2">
                Our legal team reviews the documents you provide and tells you what a Portuguese work visa needs and what is
                missing. Upload your passport, or a national ID card if you have no passport yet, so we can start.{' '}
                <Link href={localePath(locale, '/dashboard/relocation')} className="prose-link">Upload documents</Link>.
              </p>
            )}
          </section>
        )}

        {/* Native <details>, closed once answered, so a finished form does not
            push the settings below it off the screen. */}
        <details open={!background?.updatedAt} className="mt-12 rounded-[24px] border border-line bg-surface p-5 sm:p-6">
          <summary className="cursor-pointer text-[20px] font-semibold tracking-[-0.02em]">
            Your background {background?.updatedAt ? <span className="text-[14px] font-normal text-muted">· answered</span> : null}
          </summary>
          <p className="m-0 mt-3 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
            A few questions our recruiters and the immigration lawyers need before a visa file is started. A &ldquo;yes&rdquo; does
            not rule you out: knowing early lets us plan around it. Only our team sees these answers, never employers.
          </p>
          <BackgroundForm initial={background ?? EMPTY_BACKGROUND} />
        </details>

        <div className="mt-10 flex flex-col gap-3">
          <VisibilityToggle label={d.visible} note={d.visibleNote} initial={visible} />
          <VisibilityToggle
            label="WhatsApp updates"
            note="Messages on WhatsApp when your application moves or an interview is booked. Email updates continue either way."
            initial={whatsappOptIn}
            endpoint="/api/candidate/whatsapp"
            field="optIn"
          />
        </div>
      </main>

      {status.awaitingPayment ? (
        <StickyPackageCta
          href="#package"
          label={settings.conversion.stickyCtaLabel}
        />
      ) : null}
    </>
  );
}
