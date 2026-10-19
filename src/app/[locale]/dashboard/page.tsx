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
import { DashboardNextStep } from '@/components/candidate/DashboardNextStep';
import { VerifyEmailBanner } from '@/components/candidate/VerifyEmailBanner';
import { UnlockReport } from '@/components/candidate/UnlockReport';
import { PackageOfferBanner } from '@/components/candidate/PackageOfferBanner';
import { StickyPackageCta } from '@/components/candidate/StickyPackageCta';
import { ReportPreview } from '@/components/candidate/ReportPreview';
import { DemandStrip } from '@/components/candidate/DemandStrip';
import { OfferScroll } from '@/components/candidate/OfferScroll';
import { FamilyLinks } from '@/components/relocation/FamilyLinks';
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
import { listPublishedJobs } from '@/lib/jobs/data';
import { formatSalary } from '@/lib/jobs/types';
import { interviewTimes } from '@/lib/interviews/time';
import { deliveredReviewFor } from '@/lib/legal/review';
import { backgroundFor, EMPTY_BACKGROUND } from '@/lib/candidate/background';
import { BackgroundForm } from '@/components/candidate/BackgroundForm';
import { getCandidateRelocation } from '@/lib/relocation/data';
import { getFunnelStats } from '@/lib/stats/funnel';
import { siteText } from '@/lib/cms/localize';

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
  searchParams: Promise<{ offer?: string; paid?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const d = t.dash;
  const query = await searchParams;
  const showOffer = query.offer === '1';
  const justPaid = Boolean(query.paid);

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
  const [applications, savedJobs, legalReview, background, relocation, publishedJobs, funnel] = await Promise.all([
    listCandidateApplications(candidateId),
    listSavedJobs(candidateId),
    deliveredReviewFor(candidateId),
    backgroundFor(candidateId),
    getCandidateRelocation(candidateId),
    listPublishedJobs({ pageSize: 6 }),
    getFunnelStats(),
  ]);
  const openJobs = publishedJobs.jobs;
  const tx = (english: string) => siteText(locale, english);
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

  const firstName = candidate.fullName.split(' ')[0] ?? candidate.fullName;

  return (
    <div className="dash-atmosphere min-h-screen">
      <DashboardNav locale={locale} current="overview" />

      <main
        className={`mx-auto w-full max-w-[1120px] px-[clamp(16px,4cqi,56px)] py-[clamp(24px,4cqi,56px)] ${
          status.awaitingPayment ? 'pb-28 md:pb-[clamp(28px,5cqi,64px)]' : ''
        }`}
      >
        {unverifiedEmail && <VerifyEmailBanner email={unverifiedEmail} t={t} />}

        <OfferScroll active={status.awaitingPayment && showOffer} />

        {justPaid && status.paid ? (
          <section
            id="family-share"
            className="mb-6 scroll-mt-24 rounded-[20px] border border-accent bg-accent-tint p-[clamp(18px,2.5cqi,24px)]"
          >
            <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">
              {tx('Payment received. Share progress with family')}
            </h2>
            <p className="m-0 mt-2 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
              {tx(
                'Create a private link so your family can see your job, city and visa steps — without salary, employer name or documents. Scroll to the family section below.',
              )}
            </p>
            <a href="#family" className="t-colors mt-4 inline-flex rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper no-underline hover:bg-ink-hover">
              {tx('Create a family link')}
            </a>
          </section>
        ) : null}

        {status.awaitingPayment && showOffer ? (
          <div className="mb-6">
            <PackageOfferBanner locale={locale} conversion={settings.conversion} fee={fee} />
          </div>
        ) : null}

        {status.awaitingPayment && reportReady && r ? (
          <ReportPreview
            locale={locale}
            overall={r.overall}
            breakdown={r.breakdown}
            shortlistMin={settings.hiring.shortlistMinScore}
            price={fee}
          />
        ) : null}

        <DemandStrip
          locale={locale}
          jobCount={publishedJobs.total ?? openJobs.length}
          titles={openJobs.slice(0, 3).map((job) => job.title)}
          funnel={funnel}
        />

        <DashboardNextStep
          locale={locale}
          status={status}
          firstName={firstName}
          fee={fee}
          shortlistMin={settings.hiring.shortlistMinScore}
          nextInterview={
            nextInterview
              ? {
                  title: nextInterview.application.job.title,
                  when: interviewTimes(nextInterview.interview.startsAt).both,
                }
              : null
          }
          applicationCount={applications.length}
          familyLinkCount={relocation.familyLinks.filter((link) => !link.revokedAt).length}
          highlightFamily={justPaid && status.paid}
        />

        {/* Fee ask after the free score preview so they buy clarity, not a guess. */}
        {status.awaitingPayment && (
          <div className="motion-rise mt-8" style={{ ['--delay' as string]: '80ms' }}>
            <UnlockReport
              t={t}
              locale={locale}
              price={fee}
              pricing={settings.pricing}
              conversion={settings.conversion}
              hiring={settings.hiring}
              company={settings.company}
              whatsapp={settings.general.whatsapp}
              supportEmail={settings.general.supportEmail || settings.company.supportEmail}
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
          </div>
        )}

        <section className="motion-rise mt-10" style={{ ['--delay' as string]: '120ms' }}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">My applications</h2>
              <p className="m-0 mt-1 text-[14px] text-muted">Where each application stands right now.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={localePath(locale, '/jobs')}
                className="t-colors rounded-full border border-line-strong px-4 py-2 text-[14px] text-ink no-underline hover:border-ink"
              >
                Find jobs
              </Link>
              {applications.length > 0 && (
                <Link
                  href={localePath(locale, '/dashboard/applications')}
                  className="t-colors rounded-full bg-ink px-4 py-2 text-[14px] text-paper no-underline hover:bg-ink-hover"
                >
                  Track all
                </Link>
              )}
            </div>
          </div>
          {applications.length > 0 && (
            <div className="mt-5">
              <ApplicationStats applications={applications} />
            </div>
          )}
          {applications.length === 0 ? (
            <p className="m-0 mt-5 text-[15px] leading-[1.6] text-ink-2">
              You have not applied to a job yet. Applying is free:{' '}
              <Link href={localePath(locale, '/jobs')} className="prose-link">
                see open jobs
              </Link>
              .
            </p>
          ) : (
            <ul className="m-0 mt-2 flex list-none flex-col p-0">
              {applications.slice(0, 4).map((application) => (
                <li
                  key={application.id}
                  className="motion-row t-colors flex flex-wrap items-center justify-between gap-3 border-b border-line-soft py-4 last:border-b-0"
                >
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
          <section className="motion-rise mt-10" style={{ ['--delay' as string]: '160ms' }}>
            <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Saved jobs</h2>
            <p className="m-0 mt-1 text-[14px] text-muted">Jobs you marked with the heart. Closed jobs drop off this list.</p>
            <ul className="m-0 mt-2 flex list-none flex-col p-0">
              {savedJobs.map((job) => (
                <li
                  key={job.id}
                  className="motion-row t-colors flex flex-wrap items-center justify-between gap-3 border-b border-line-soft py-4 last:border-b-0"
                >
                  <div>
                    <Link
                      href={localePath(locale, `/jobs/${job.slug}`)}
                      className="text-[15px] font-medium text-ink no-underline hover:text-accent"
                    >
                      {job.title}
                    </Link>
                    <p className="m-0 font-mono text-[12px] text-muted">
                      {[job.city, formatSalary(job)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Link
                    href={localePath(locale, `/jobs/${job.slug}`)}
                    className="t-colors rounded-full border border-line-strong px-4 py-2 text-[14px] text-ink no-underline hover:border-ink"
                  >
                    View and apply
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(reportReady || status.assessmentComplete) && (
          <section className="motion-rise mt-12" style={{ ['--delay' as string]: '180ms' }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Mono className="text-muted">{fill(d.greeting, { name: firstName })}</Mono>
                <h2 className="m-0 mt-2 text-[clamp(24px,3.2cqi,34px)] font-semibold leading-[1.1] tracking-[-0.03em]">
                  {reportReady ? d.title : d.pending}
                </h2>
              </div>
              {canReceiveReport(candidate) ? (
                <Link
                  href={localePath(locale, '/dashboard/report.pdf')}
                  className="t-colors rounded-full border border-line-strong bg-surface px-4 py-2.5 text-[14px] no-underline hover:border-ink"
                >
                  {d.download}
                </Link>
              ) : null}
            </div>

            {!reportReady && (
              <p className="mt-4 mb-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">{d.pendingNote}</p>
            )}

            {reportReady && (
              <ul className="m-0 mt-6 grid list-none grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 p-0">
                {stats.map((stat) => (
                  <li
                    key={stat.label}
                    className={`rounded-[20px] border p-[22px] ${
                      stat.dark ? 'border-ink bg-ink text-paper' : 'border-line/80 bg-surface'
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
          </section>
        )}

        <div
          className="motion-rise mt-12 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[clamp(24px,3cqi,40px)]"
          style={{ ['--delay' as string]: '200ms' }}
        >
          <JourneyStatus locale={locale} t={t} status={status} />
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
                    <div className="motion-fill h-full rounded-full bg-accent" style={{ width: `${axis.score}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {(status.paid || pack) && (
          <div className="mt-12">
            <CareerPack pack={pack} canGenerate={status.paid && status.reportReady} locale={locale} />
          </div>
        )}

        {status.paid ? (
          <div id="family" className="mt-12 scroll-mt-24">
            <FamilyLinks links={relocation.familyLinks} />
            {relocation.placed ? (
              <p className="m-0 mt-4 text-[14px] leading-[1.6] text-ink-2">
                {tx('Arrived and working?')}{' '}
                <Link href={localePath(locale, '/dashboard/relocation')} className="prose-link">
                  {tx('Share your story for the site')}
                </Link>
                {tx(' — only with your written consent, in your own words.')}
              </p>
            ) : null}
          </div>
        ) : null}

        {(legalReview || status.paid) && (
          <section className="mt-12 border-t border-line pt-10">
            <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Preliminary legal review</h2>
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
                <Link href={localePath(locale, '/dashboard/relocation')} className="prose-link">
                  Upload documents
                </Link>
                .
              </p>
            )}
          </section>
        )}

        <details open={!background?.updatedAt} className="mt-12 border-t border-line pt-10">
          <summary className="cursor-pointer text-[22px] font-semibold tracking-[-0.02em]">
            Your background{' '}
            {background?.updatedAt ? <span className="text-[14px] font-normal text-muted">· answered</span> : null}
          </summary>
          <p className="m-0 mt-3 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
            A few questions our recruiters and the immigration lawyers need before a visa file is started. A &ldquo;yes&rdquo; does
            not rule you out: knowing early lets us plan around it. Only our team sees these answers, never employers.
          </p>
          <BackgroundForm initial={background ?? EMPTY_BACKGROUND} />
        </details>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-8">
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
        <StickyPackageCta href="#package" label={settings.conversion.stickyCtaLabel} />
      ) : null}
    </div>
  );
}
