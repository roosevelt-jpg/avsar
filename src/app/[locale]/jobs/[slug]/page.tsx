import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { Markdown } from '@/components/cms/Markdown';
import { Icon } from '@/components/cms/primitives';
import { ApplyPanel, type ApplyViewer } from '@/components/jobs/ApplyPanel';
import { JobCard, jobImage } from '@/components/jobs/JobCard';
import { JobSectionNav } from '@/components/jobs/JobSectionNav';
import { SaveJobButton } from '@/components/jobs/SaveJobButton';
import { BRAND_SLIDES } from '@/lib/cms/brand-media';
import { listSavedJobs, savedJobIds } from '@/lib/jobs/saved';
import { getViewer, hasPaid } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { localizeJob, siteText } from '@/lib/cms/localize';
import { areaLabel } from '@/lib/data/positions';
import { getPublishedJob, recommendedJobs } from '@/lib/jobs/data';
import { EMPLOYMENT_LABELS, formatSalary, HOUSING_LABELS, isOpen, jobLocation } from '@/lib/jobs/types';
import { isLocale, localePath } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import { getServerSupabase } from '@/lib/supabase/server';
import { STATUS_META, type ApplicationStatus } from '@/lib/applications/status';

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const stored = await getPublishedJob(slug);
  if (!stored) return {};
  const job = localizeJob(stored, locale);
  const title = job.seoTitle || `${job.title} · ${job.city}`;
  const description = job.seoDescription || job.summary;
  return pageMetadata({
    title,
    description,
    image: jobImage(job) ?? undefined,
    imageAlt: `${job.title}, ${job.city}`,
    path: localePath(locale, `/jobs/${job.slug}`),
    locale,
    type: 'article',
  });
}

export default async function JobPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const stored = await getPublishedJob(slug);
  if (!stored) notFound();
  const job = localizeJob(stored, locale);

  const [viewer, settings] = await Promise.all([getViewer(), getSiteSettings()]);

  let applyViewer: ApplyViewer = { kind: 'anonymous' };
  let saved: boolean | undefined;
  if (viewer.role === 'candidate') {
    saved = (await savedJobIds(viewer.candidate.id)).has(job.id);
    let existing: { reference: string; status: ApplicationStatus } | null = null;
    const supabase = await getServerSupabase();
    if (supabase) {
      const { data } = await supabase
        .from('applications')
        .select('reference, status')
        .eq('job_id', job.id)
        .eq('candidate_id', viewer.candidate.id)
        .maybeSingle();
      if (data) existing = { reference: String(data.reference), status: data.status as ApplicationStatus };
    }
    applyViewer = {
      kind: 'candidate',
      firstName: viewer.candidate.fullName.split(' ')[0] ?? '',
      paid: hasPaid(viewer.candidate),
      existing: existing && existing.status !== 'withdrawn' ? { ...existing, label: STATUS_META[existing.status].candidateTitle } : null,
    };
  } else if (viewer.role === 'staff' || viewer.role === 'employer') {
    applyViewer = { kind: 'staff' };
  } else if (viewer.role === 'registered') {
    applyViewer = { kind: 'registered' };
  }

  const open = isOpen(job);
  const salary = formatSalary(job);
  const image = jobImage(job);
  const others = (await recommendedJobs(job.positionSlug, [job.id], 3)).map((other) => localizeJob(other, locale));
  const t = (english: string) => siteText(locale, english);
  const dateLocale = locale === 'en' ? 'en-GB' : locale;

  const heroPhoto = image || '/kitchen-work-1400.jpg';
  const sidePhoto = image && image !== '/photos/kitchen.jpg' && image !== '/kitchen-work-1400.jpg' ? image : '/lisbon-rooftops-1200.jpg';

  const metaRow = [
    { icon: 'map', label: jobLocation(job) },
    ...(job.area ? [{ icon: 'star' as const, label: areaLabel(job.area) }] : []),
    { icon: 'briefcase', label: t(EMPLOYMENT_LABELS[job.employmentType]) },
  ];

  const offerItems = [
    salary ? { icon: 'euro', title: t('Competitive Monthly Salary'), detail: salary } : null,
    {
      icon: 'home',
      title: t('Accommodation Support'),
      detail: t(HOUSING_LABELS[job.housing]),
    },
    job.mealsIncluded ? { icon: 'heart', title: t('Meals During Work'), detail: t('Staff meal on shift') } : null,
    {
      icon: 'shield',
      title: t('Work Contract & Legal Employment'),
      detail: t('Written employment under Portuguese law'),
    },
    {
      icon: 'plane',
      title: t('Visa & Relocation Assistance'),
      detail: job.visaSponsored ? t('Supported after a successful offer') : t('You need the right to work'),
    },
    {
      icon: 'star',
      title: t('Career Growth Opportunities'),
      detail: t('Build experience with a verified Portuguese employer'),
    },
  ].filter(Boolean) as { icon: string; title: string; detail: string }[];

  const navItems = [
    { id: 'overview', label: t('Job Details'), icon: 'document' },
    ...(job.employerDisplay ? [{ id: 'company', label: t('Company'), icon: 'briefcase' }] : []),
    ...(job.benefits.length || offerItems.length ? [{ id: 'benefits', label: t('Benefits'), icon: 'heart' }] : []),
    ...(job.requirements.length ? [{ id: 'requirements', label: t('Requirements'), icon: 'check' }] : []),
    { id: 'location', label: t('Location'), icon: 'map' },
  ];

  const deadlineLabel = job.closesAt
    ? new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(job.closesAt))
    : t('Open until filled');

  const startLabel = job.expectedStartOn
    ? new Intl.DateTimeFormat(dateLocale, { month: 'short', year: 'numeric' }).format(new Date(`${job.expectedStartOn}T12:00:00Z`))
    : null;

  const keyFacts = [
    { icon: 'clock', label: t('Application Deadline'), value: deadlineLabel },
    { icon: 'users', label: t('Open Positions'), value: String(job.openings) },
    ...(startLabel ? [{ icon: 'briefcase' as const, label: t('Expected Start Date'), value: startLabel }] : []),
    { icon: 'globe', label: t('Work Location'), value: jobLocation(job) },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: [job.summary, job.description, ...job.responsibilities, ...job.requirements].filter(Boolean).join('\n'),
    datePosted: job.publishedAt ?? job.createdAt,
    validThrough: job.closesAt ?? undefined,
    employmentType: job.employmentType === 'full_time' ? 'FULL_TIME' : job.employmentType === 'part_time' ? 'PART_TIME' : 'TEMPORARY',
    hiringOrganization: { '@type': 'Organization', name: job.employerDisplay || settings.general.siteName },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.city, addressRegion: job.region ?? undefined, addressCountry: job.country },
    },
    applicantLocationRequirements: { '@type': 'Country', name: 'India' },
    baseSalary:
      job.salaryMinEur != null
        ? {
            '@type': 'MonetaryAmount',
            currency: 'EUR',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMinEur,
              maxValue: job.salaryMaxEur ?? job.salaryMinEur,
              unitText: job.salaryPeriod.toUpperCase(),
            },
          }
        : undefined,
    directApply: true,
  };

  const body = (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <main>
        <section className="relative isolate overflow-hidden bg-[#142438] text-white">
          <div className="absolute inset-0" aria-hidden>
            <Image src={heroPhoto} alt="" fill priority sizes="100vw" className="object-cover object-[center_30%] opacity-55" />
            <div className="absolute inset-0 bg-[#142438]/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#142438] via-[#142438]/88 to-[#142438]/35" />
          </div>

          <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-end gap-8 px-[clamp(20px,4cqi,56px)] pb-[clamp(36px,5cqi,56px)] pt-[clamp(32px,5cqi,56px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-white/70">
                <Link href={localePath(locale, '/')} className="inline-flex items-center gap-1 text-white/70 no-underline hover:text-white">
                  <Icon name="home" className="size-3.5" />
                  <span className="sr-only">{t('Home')}</span>
                </Link>
                <span aria-hidden>›</span>
                <Link href={localePath(locale, '/jobs')} className="text-white/70 no-underline hover:text-white">
                  {t('Jobs')}
                </Link>
                <span aria-hidden>›</span>
                <span className="text-white">{job.title}</span>
              </nav>

              {open ? (
                <p className="m-0 mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-3.5 py-1.5 text-[12px] font-semibold text-[#142438]">
                  <Icon name="check" className="size-3.5" />
                  {t('Verified Opportunity')}
                </p>
              ) : null}

              <h1 className="display-serif m-0 text-balance text-[clamp(34px,5cqi,56px)] font-normal leading-[1.06]">
                {job.title}
              </h1>

              <ul className="m-0 mt-6 flex list-none flex-wrap items-center gap-x-5 gap-y-3 p-0 text-[14px] text-white/92">
                {metaRow.map((item) => (
                  <li key={item.label} className="inline-flex items-center gap-2">
                    <Icon name={item.icon} className="size-4 text-[var(--color-gold)]" />
                    {item.label}
                  </li>
                ))}
                {salary ? (
                  <li className="inline-flex items-center rounded-full bg-[var(--color-gold)] px-3.5 py-1.5 text-[13px] font-semibold text-[#142438]">
                    <bdi>{salary}</bdi>
                  </li>
                ) : null}
              </ul>

              {job.summary ? (
                <p className="m-0 mt-6 max-w-[54ch] text-[16px] leading-[1.6] text-white/88">{job.summary}</p>
              ) : null}

              {!open ? (
                <p className="m-0 mt-6 rounded-[12px] border border-white/25 bg-white/10 px-5 py-4 text-[15px]">
                  {t('This job is no longer taking applications. See similar jobs below.')}
                </p>
              ) : null}
            </div>

            <div className="relative hidden min-h-[320px] lg:block">
              <div className="absolute inset-x-0 bottom-0 top-6 overflow-hidden rounded-[18px]">
                <Image src={sidePhoto} alt={`${job.title}, ${job.city}`} fill sizes="420px" className="object-cover object-[center_20%]" priority />
              </div>
              {saved !== undefined ? <SaveJobButton jobId={job.id} initialSaved={saved} className="absolute end-4 top-4 z-10" /> : null}
            </div>
          </div>
        </section>

        <div className="bg-[#f5f6f8] px-[clamp(20px,4cqi,56px)] py-[clamp(24px,4cqi,40px)]">
          <div className="mx-auto grid w-full max-w-[1200px] gap-[clamp(24px,3.5cqi,40px)] lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <JobSectionNav items={navItems} />

              <article className="mt-4 rounded-[18px] border border-[#142438]/08 bg-white p-[clamp(22px,3cqi,40px)] shadow-[0_18px_40px_-28px_rgba(20,36,56,0.35)]">
                <section id="overview">
                  <h2 className="display-serif m-0 mb-4 text-[28px] font-normal tracking-[-0.02em] text-[#142438]">
                    {t('Job Overview')}
                  </h2>
                  {job.description ? <Markdown text={job.description} locale={locale} className="text-[16px] text-ink-2" /> : null}
                  {job.responsibilities.length > 0 ? (
                    <>
                      <h3 className="display-serif m-0 mt-8 mb-4 text-[22px] font-normal tracking-[-0.02em] text-[#142438]">
                        {t('Key Responsibilities')}
                      </h3>
                      <CheckList items={job.responsibilities} />
                    </>
                  ) : null}
                </section>

                {job.requirements.length > 0 ? (
                  <section id="requirements" className="mt-10">
                    <h2 className="display-serif m-0 mb-4 text-[24px] font-normal tracking-[-0.02em] text-[#142438]">
                      {t('Requirements')}
                    </h2>
                    <CheckList items={job.requirements} />
                  </section>
                ) : null}

                {job.employerDisplay ? (
                  <section id="company" className="mt-10">
                    <h2 className="display-serif m-0 mb-4 text-[24px] font-normal tracking-[-0.02em] text-[#142438]">
                      {t('Company')}
                    </h2>
                    <p className="m-0 text-[16px] leading-[1.6] text-ink-2">
                      {job.employerDisplay}. {t('Every posting is confirmed with the Portuguese employer before it goes live.')}
                    </p>
                  </section>
                ) : null}

                <section id="benefits" className="mt-10">
                  <h2 className="display-serif m-0 mb-5 text-[24px] font-normal tracking-[-0.02em] text-[#142438]">
                    {t('What We Offer')}
                  </h2>
                  {job.benefits.length > 0 ? (
                    <div className="mb-6">
                      <CheckList items={job.benefits} />
                    </div>
                  ) : null}
                  <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                    {offerItems.map((item) => (
                      <li
                        key={item.title}
                        className="flex flex-col gap-3 rounded-[14px] border border-[#142438]/08 bg-[#f4f5f7] px-4 py-4"
                      >
                        <span className="grid size-10 place-items-center rounded-[10px] bg-white text-[var(--color-gold)] shadow-[0_8px_18px_-12px_rgba(20,36,56,0.35)]">
                          <Icon name={item.icon} className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="m-0 text-[14px] font-semibold leading-[1.3] text-[#142438]">{item.title}</p>
                          <p className="m-0 mt-1 text-[13px] leading-[1.45] text-ink-2">
                            <bdi>{item.detail}</bdi>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section id="location" className="mt-10">
                  <h2 className="display-serif m-0 mb-4 text-[24px] font-normal tracking-[-0.02em] text-[#142438]">
                    {t('Location')}
                  </h2>
                  <p className="m-0 flex items-start gap-3 text-[16px] leading-[1.6] text-ink-2">
                    <Icon name="map" className="mt-1 size-5 shrink-0 text-[var(--color-gold)]" />
                    <span>{jobLocation(job)}</span>
                  </p>
                </section>

                <section className="mt-10 rounded-[16px] border border-line bg-[#f4f5f7] p-6">
                  <h2 className="m-0 text-[18px] font-semibold text-[#142438]">{t('Free to apply. No placement fee.')}</h2>
                  <p className="m-0 mt-2 text-[15px] leading-[1.6] text-ink-2">
                    {t('You never pay to be hired. If anyone asks you for money for this job outside this website, it is not us.')}{' '}
                    <Link href={localePath(locale, '/stay-safe')} className="prose-link">
                      {t('How to stay safe')}
                    </Link>
                    .
                  </p>
                </section>
              </article>
            </div>

            <aside id="apply" className="shop-sticky flex flex-col gap-4 lg:sticky lg:self-start">
              <ApplyPanel
                locale={locale}
                job={{ id: job.id, slug: job.slug, title: job.title, questions: job.screeningQuestions, open }}
                viewer={applyViewer}
                allowQuickApply={settings.applications.allowQuickApply}
                requirePaidAssessment={settings.applications.requirePaidAssessment}
                shortlistMinScore={settings.hiring.shortlistMinScore}
                salary={salary}
              />

              <dl className="m-0 grid grid-cols-2 gap-3 rounded-[16px] border border-[#142438]/08 bg-white p-4 shadow-[0_18px_40px_-28px_rgba(20,36,56,0.35)]">
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="rounded-[12px] bg-[#f4f5f7] px-3 py-3">
                    <dt className="m-0 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-2">
                      <Icon name={fact.icon} className="size-3.5 text-[var(--color-gold)]" />
                      {fact.label}
                    </dt>
                    <dd className="m-0 mt-1 text-[14px] font-semibold text-[#142438]">{fact.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="overflow-hidden rounded-[16px] border border-[#142438]/08 bg-white shadow-[0_18px_40px_-28px_rgba(20,36,56,0.35)]">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={BRAND_SLIDES.portugal[0]?.src || '/lisbon-rooftops-1200.jpg'}
                    alt={t('Lisbon rooftops')}
                    fill
                    sizes="340px"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h2 className="display-serif m-0 flex items-center gap-2 text-[22px] font-normal text-[#142438]">
                    <span aria-hidden className="text-[20px] leading-none">
                      🇵🇹
                    </span>
                    {t('Work & Live in Portugal')}
                  </h2>
                  <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0 text-[14px] text-ink-2">
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-[var(--color-gold)]" />
                      {t('European work experience')}
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-[var(--color-gold)]" />
                      {t('Safe cities and a high quality of life')}
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-[var(--color-gold)]" />
                      {t('Path to long-term residency')}
                    </li>
                  </ul>
                  <Link
                    href={localePath(locale, '/why-portugal')}
                    className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--color-gold)] no-underline hover:underline"
                  >
                    {t('Learn More About Living in Portugal')} <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {others.length > 0 ? (
          <section className="bg-white px-[clamp(20px,4cqi,56px)] py-[clamp(48px,7cqi,80px)]">
            <div className="mx-auto w-full max-w-[1200px]">
              <h2 className="display-serif m-0 mb-6 text-[28px] font-normal tracking-[-0.02em] text-[#142438]">
                {t('Similar jobs')}
              </h2>
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((other) => (
                  <li key={other.id}>
                    <JobCard job={other} locale={locale} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );

  if (viewer.role === 'candidate') {
    const savedCount = (await listSavedJobs(viewer.candidate.id)).length;
    return (
      <DashboardNav
        locale={locale}
        current="jobs"
        candidate={{
          fullName: viewer.candidate.fullName,
          emailConfirmed: viewer.candidate.emailConfirmed,
        }}
        savedCount={savedCount}
        whatsapp={settings.general.whatsapp}
      >
        {body}
      </DashboardNav>
    );
  }

  return (
    <>
      <SiteHeader locale={locale} />
      {body}
    </>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[16px] leading-[1.55] text-ink-2">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-gold)]/15 text-[var(--color-gold)]">
            <Icon name="check" className="size-3.5" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
