import { privateMetadata } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mono } from '@/components/ui/Mono';
import { VisibilityToggle } from '@/components/candidate/VisibilityToggle';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import {
  ApplicationProgressPanel,
  DashboardHero,
  DashboardStatStrip,
  NextStepsChecklist,
  RecommendedJobsPanel,
  RelocationJourneyStrip,
  RelocationPromoCard,
  profileCompletionPct,
} from '@/components/candidate/DashboardOverviewShell';
import { listCandidateApplications } from '@/lib/applications/data';
import { STATUS_META } from '@/lib/applications/status';
import { JourneyStatus } from '@/components/candidate/JourneyStatus';
import { VerifyEmailBanner } from '@/components/candidate/VerifyEmailBanner';
import { UnlockReport } from '@/components/candidate/UnlockReport';
import { PackageOfferBanner } from '@/components/candidate/PackageOfferBanner';
import { StickyPackageCta } from '@/components/candidate/StickyPackageCta';
import { ReportPreview } from '@/components/candidate/ReportPreview';
import { PaymentFailedNotice } from '@/components/candidate/PaymentFailedNotice';
import { LegalReviewSample } from '@/components/candidate/LegalReviewSample';
import { DemandStrip } from '@/components/candidate/DemandStrip';
import { OfferScroll } from '@/components/candidate/OfferScroll';
import { FamilyLinks } from '@/components/relocation/FamilyLinks';
import { availablePaymentMethods, getPaymentProvider } from '@/lib/payments';
import { getSiteSettings } from '@/lib/cms/data';
import { formatFee, formatProductFee } from '@/lib/company/config';
import { getCandidateStatus, type CandidateStatus } from '@/lib/candidate/status';
import { CareerPack } from '@/components/candidate/CareerPack';
import { getAdminSupabase } from '@/lib/supabase/admin';
import type { CareerPack as Pack } from '@/lib/cv/coach-schema';
import { fill, getDictionary, isLocale, localePath } from '@/lib/i18n';
import { requireCandidate } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { sectorLabel, SECTOR_SLUGS, type SectorSlug } from '@/lib/data/sectors';
import { englishBand, skillBand } from '@/lib/report/bands';
import { listSavedJobs } from '@/lib/jobs/saved';
import { listPublishedJobs, recommendedJobs } from '@/lib/jobs/data';
import { formatSalary } from '@/lib/jobs/types';
import { interviewTimes } from '@/lib/interviews/time';
import { deliveredReviewFor } from '@/lib/legal/review';
import { backgroundFor, EMPTY_BACKGROUND } from '@/lib/candidate/background';
import { BackgroundForm } from '@/components/candidate/BackgroundForm';
import { getCandidateRelocation } from '@/lib/relocation/data';
import { getFunnelStats } from '@/lib/stats/funnel';
import { siteText } from '@/lib/cms/localize';
import { linesTheyWrote } from '@/lib/candidate/own-words';
import { publicOrigin } from '@/lib/http/origin';
import { EXPERIENCE_BANDS } from '@/lib/employer/portal';

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
  searchParams: Promise<{ offer?: string; paid?: string; status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const d = t.dash;
  const query = await searchParams;
  const showOffer = query.offer === '1';
  const justPaid = Boolean(query.paid);
  const paymentCancelled = query.status === 'cancelled';

  let r: DashboardReport | null = null;
  let pack: Pack | null = null;
  let ownLines: string[] = [];
  let whatsappOptIn = false;
  const settings = await getSiteSettings();
  const prices = {
    skills: formatProductFee(settings.pricing, 'skills_report'),
    visa: formatProductFee(settings.pricing, 'visa_requirements'),
    bundle: formatProductFee(settings.pricing, 'bundle'),
    separate: formatFee(settings.pricing),
  };

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

    const fromCv = linesTheyWrote(pack?.improvedCv);
    if (fromCv.length > 0) {
      ownLines = fromCv;
    } else if (candidate.sector && (SECTOR_SLUGS as readonly string[]).includes(candidate.sector)) {
      const band = EXPERIENCE_BANDS[candidate.yearsBand ?? 0] ?? 'Under 1 year';
      const sectorName = t.sectors[SECTOR_SLUGS.indexOf(sector)] ?? sectorLabel(sector);
      ownLines = [
        fill(siteText(locale, 'You told us your work is {sector}, and your experience is {years}.'), {
          sector: sectorName,
          years: siteText(locale, band),
        }),
      ];
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
  const recommended = await recommendedJobs(
    candidate.position,
    applications.map((application) => application.job.id),
    3,
  );
  const tx = (english: string) => siteText(locale, english);
  const nextInterview = applications
    .flatMap((application) => application.interviews.map((interview) => ({ interview, application })))
    .sort((a, b) => a.interview.startsAt.localeCompare(b.interview.startsAt))[0];
  const activeApplications = applications.filter((a) => STATUS_META[a.status].tone !== 'stopped');
  const interviewCount = applications.filter((a) => a.status === 'interview' || a.interviews.length > 0).length;
  const relocationOpen = relocation.plan
    ? relocation.plan.milestones.filter((m) => m.status === 'pending' || m.status === 'in_progress' || m.status === 'blocked')
        .length
    : relocation.documents.filter((doc) => doc.status !== 'verified').length;
  const profilePct = profileCompletionPct(status, applications.length);
  const matchedJobs = publishedJobs.total ?? openJobs.length;
  const journeyMilestones = relocation.plan?.milestones ?? [];

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

  const shareUrl = `${await publicOrigin()}${localePath(locale, '/for-your-family')}`;
  const providerName = getPaymentProvider().name;
  const providerMode =
    providerName === 'eximpe'
      ? process.env.EXIMPE_ENV === 'production'
        ? 'production'
        : 'sandbox'
      : providerName === 'paytm'
        ? process.env.PAYTM_ENV === 'production'
          ? 'production'
          : 'sandbox'
        : process.env.CASHFREE_ENV === 'production'
          ? 'production'
          : 'sandbox';

  return (
    <DashboardNav
      locale={locale}
      current="overview"
      candidate={{ fullName: candidate.fullName, emailConfirmed: candidate.emailConfirmed }}
      savedCount={savedJobs.length}
      whatsapp={settings.general.whatsapp}
    >
      <div className={`mx-auto w-full max-w-[1180px] ${status.awaitingPayment ? 'pb-28' : ''}`}>
        {unverifiedEmail && <VerifyEmailBanner email={unverifiedEmail} t={t} />}

        <OfferScroll active={status.awaitingPayment && (showOffer || paymentCancelled)} />

        {status.awaitingPayment && paymentCancelled ? (
          <PaymentFailedNotice locale={locale} whatsapp={settings.general.whatsapp} />
        ) : null}

        {justPaid && status.paid ? (
          <section
            id="family-share"
            className="mb-6 scroll-mt-24 rounded-[16px] border border-[#b28a49] bg-[#b28a49]/12 p-5"
          >
            <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">
              {tx('Payment received. Share progress with family')}
            </h2>
            <p className="m-0 mt-2 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">
              {tx(
                'Create a private link so your family can see your job, city and visa steps — without salary, employer name or documents. Scroll to the family section below.',
              )}
            </p>
            <a
              href="#family"
              className="t-colors mt-4 inline-flex rounded-[8px] bg-[#142438] px-4 py-2.5 text-[14px] font-medium text-white no-underline hover:bg-[#1e334d]"
            >
              {tx('Create a family link')}
            </a>
          </section>
        ) : null}

        {status.awaitingPayment && showOffer ? (
          <div className="mb-6">
            <PackageOfferBanner locale={locale} conversion={settings.conversion} fee={prices.bundle} />
          </div>
        ) : null}

        <div className="flex flex-col gap-5">
          <DashboardHero locale={locale} firstName={firstName} assessmentComplete={status.assessmentComplete} />
          <DashboardStatStrip
            matchedJobs={matchedJobs}
            inProgress={activeApplications.length}
            interviews={interviewCount}
            relocationOpen={relocationOpen}
            profilePct={profilePct}
          />
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.9fr_0.85fr]">
            <ApplicationProgressPanel locale={locale} applications={applications} />
            <NextStepsChecklist
              locale={locale}
              status={status}
              applicationCount={applications.length}
              hasInterview={Boolean(nextInterview) || interviewCount > 0}
            />
            <RelocationPromoCard locale={locale} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <RecommendedJobsPanel locale={locale} jobs={recommended.length ? recommended : openJobs} />
            <RelocationJourneyStrip applications={applications} milestones={journeyMilestones} />
          </div>
        </div>

        {status.awaitingPayment ? <div className="mt-8"><LegalReviewSample locale={locale} /></div> : null}

        {status.awaitingPayment && reportReady && r ? (
          <div className="mt-6">
            <ReportPreview
              locale={locale}
              overall={r.overall}
              breakdown={r.breakdown}
              shortlistMin={settings.hiring.shortlistMinScore}
              price={prices.skills}
              bundle={prices.bundle}
            />
          </div>
        ) : null}

        <div className="mt-6">
          <DemandStrip
            locale={locale}
            jobCount={publishedJobs.total ?? openJobs.length}
            titles={openJobs.slice(0, 3).map((job) => job.title)}
            funnel={funnel}
          />
        </div>

        {nextInterview ? (
          <p className="m-0 mt-4 rounded-[12px] border border-[#b28a49]/35 bg-[#b28a49]/10 px-4 py-3 text-[14px] text-[#142438]">
            Next interview: <strong>{nextInterview.application.job.title}</strong> ·{' '}
            {interviewTimes(nextInterview.interview.startsAt).both}
          </p>
        ) : null}

        {status.awaitingPayment && (
          <div className="motion-rise mt-8" style={{ ['--delay' as string]: '80ms' }}>
            <UnlockReport
              t={t}
              locale={locale}
              prices={prices}
              owns={{ skills: status.ownsSkills, visa: status.ownsVisa }}
              conversion={settings.conversion}
              hiring={settings.hiring}
              company={settings.company}
              whatsapp={settings.general.whatsapp}
              supportEmail={settings.general.supportEmail || settings.company.supportEmail}
              preferUpi={paymentCancelled}
              methods={availablePaymentMethods()}
              lines={ownLines}
              voiceUrl={settings.general.familyVoiceUrl}
              shareUrl={shareUrl}
              provider={providerName}
              providerMode={providerMode}
            />
          </div>
        )}

        {savedJobs.length > 0 && (
          <section id="saved" className="motion-rise mt-10 scroll-mt-24" style={{ ['--delay' as string]: '160ms' }}>
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
                    className="t-colors rounded-[8px] border border-line-strong px-4 py-2 text-[14px] text-ink no-underline hover:border-ink"
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
              <div className="flex flex-wrap gap-2">
                {status.ownsSkills && candidate.emailConfirmed ? (
                  <Link
                    href={localePath(locale, '/dashboard/report.pdf')}
                    className="t-colors rounded-[8px] border border-line-strong bg-surface px-4 py-2.5 text-[14px] no-underline hover:border-ink"
                  >
                    {d.download}
                  </Link>
                ) : null}
                {pack ? (
                  <Link
                    href={localePath(locale, '/dashboard/cv.pdf')}
                    className="t-colors rounded-[8px] border border-line-strong bg-surface px-4 py-2.5 text-[14px] no-underline hover:border-ink"
                  >
                    {d.downloadCv}
                  </Link>
                ) : null}
                {legalReview ? (
                  <Link
                    href={localePath(locale, '/dashboard/legal.pdf')}
                    className="t-colors rounded-[8px] border border-line-strong bg-surface px-4 py-2.5 text-[14px] no-underline hover:border-ink"
                  >
                    {d.downloadLegal}
                  </Link>
                ) : null}
              </div>
            </div>

            {!reportReady && (
              <p className="mt-4 mb-0 max-w-[62ch] text-[15px] leading-[1.6] text-ink-2">{d.pendingNote}</p>
            )}

            {reportReady && (
              <ul className="m-0 mt-6 grid list-none grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 p-0">
                {stats.map((stat) => (
                  <li
                    key={stat.label}
                    className={`rounded-[16px] border p-[22px] ${
                      stat.dark ? 'border-[#142438] bg-[#142438] text-white' : 'border-line/80 bg-white'
                    }`}
                  >
                    <Mono className={stat.dark ? 'text-white/60' : 'text-muted'}>{stat.label}</Mono>
                    <p className="mt-3 mb-1 text-[34px] font-semibold leading-none tracking-[-0.03em]">
                      {stat.value}
                      {stat.suffix ? (
                        <span className={`text-[16px] font-normal ${stat.dark ? 'text-white/60' : 'text-muted'}`}>
                          {stat.suffix}
                        </span>
                      ) : null}
                    </p>
                    <p className={`m-0 text-[13px] ${stat.dark ? 'text-white/55' : 'text-muted'}`}>{stat.note}</p>
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
                    <div className="motion-fill h-full rounded-full bg-[#b28a49]" style={{ width: `${axis.score}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {(status.profileComplete || status.cvUploaded || pack) && (
          <div id="cv" className="mt-12 scroll-mt-24">
            <CareerPack
              pack={pack}
              canGenerate={status.profileComplete || status.cvUploaded || status.reportReady}
              locale={locale}
            />
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

        {(legalReview || status.ownsVisa) && (
          <section className="mt-12 border-t border-line pt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">Preliminary legal review</h2>
              {legalReview ? (
                <Link
                  href={localePath(locale, '/dashboard/legal.pdf')}
                  className="t-colors rounded-[8px] border border-line-strong bg-surface px-4 py-2.5 text-[14px] no-underline hover:border-ink"
                >
                  {d.downloadLegal}
                </Link>
              ) : null}
            </div>
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
      </div>

      {status.awaitingPayment ? (
        <StickyPackageCta href="#package" label={settings.conversion.stickyCtaLabel} />
      ) : null}
    </DashboardNav>
  );
}
