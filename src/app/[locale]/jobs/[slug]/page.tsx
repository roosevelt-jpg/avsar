import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { Markdown } from '@/components/cms/Markdown';
import { Icon } from '@/components/cms/primitives';
import { FilmButton } from '@/components/cms/VideoPlayer';
import { ApplyPanel, type ApplyViewer } from '@/components/jobs/ApplyPanel';
import { JobCard, jobImage } from '@/components/jobs/JobCard';
import { JobSectionNav } from '@/components/jobs/JobSectionNav';
import { SaveJobButton } from '@/components/jobs/SaveJobButton';
import { MarketingEyebrow } from '@/components/marketing/MarketingEyebrow';
import { MarketingSlideshow } from '@/components/marketing/MarketingSlideshow';
import { BRAND_SLIDES, INTRO_FILM } from '@/lib/cms/brand-media';
import { savedJobIds } from '@/lib/jobs/saved';
import { getViewer, hasPaid } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { localizeJob, siteText } from '@/lib/cms/localize';
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

  const heroSlides = [
    ...(image ? [{ src: image, alt: `${job.title}, ${job.city}` }] : []),
    ...BRAND_SLIDES.jobDetailFallback.map((slide) => ({ src: slide.src, alt: slide.alt })),
  ].filter((slide, index, all) => all.findIndex((other) => other.src === slide.src) === index);

  const filmUrl = settings.applications.filmUrl.trim() || INTRO_FILM.url;
  const filmLabel = settings.applications.filmLabel.trim() || INTRO_FILM.label;

  const metaRow = [
    { icon: 'map', label: jobLocation(job) },
    { icon: 'briefcase', label: t(EMPLOYMENT_LABELS[job.employmentType]) },
    ...(job.area ? [{ icon: 'star' as const, label: job.area.replace(/-/g, ' ') }] : []),
  ];

  const offerItems = [
    salary ? { icon: 'euro', label: salary } : null,
    { icon: 'home', label: `${t(HOUSING_LABELS[job.housing])}${job.mealsIncluded ? ` · ${t('meals included')}` : ''}` },
    { icon: 'document', label: t('Written employment contract') },
    {
      icon: 'plane',
      label: job.visaSponsored ? t('Employer supports the work visa') : t('You need the right to work'),
    },
    { icon: 'users', label: `${job.openings} ${t('openings')}` },
    { icon: 'globe', label: job.minEnglish ? `${job.minEnglish} ${t('or above')}` : t('Basic English') },
  ].filter(Boolean) as { icon: string; label: string }[];

  const navItems = [
    { id: 'overview', label: t('Job details') },
    ...(job.responsibilities.length ? [{ id: 'responsibilities', label: t('What you will do') }] : []),
    ...(job.requirements.length ? [{ id: 'requirements', label: t('Requirements') }] : []),
    ...(job.benefits.length || offerItems.length ? [{ id: 'benefits', label: t('Benefits') }] : []),
    { id: 'apply', label: t('Apply') },
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteHeader locale={locale} />
      <main>
        <section className="relative overflow-hidden bg-[#0a088f] text-white">
          <MarketingSlideshow slides={heroSlides} className="absolute inset-0 opacity-35" sizes="100vw" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0a088f] via-[#0a088f]/92 to-[#0a088f]/55" />
          <div className="relative mx-auto w-full max-w-[1200px] px-[clamp(20px,4cqi,56px)] py-[clamp(36px,6cqi,72px)]">
            <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[12px] text-white/70">
              <Link href={localePath(locale, '/')} className="text-white/70 no-underline hover:text-white">
                {t('Home')}
              </Link>
              <span aria-hidden> › </span>
              <Link href={localePath(locale, '/jobs')} className="text-white/70 no-underline hover:text-white">
                {t('Jobs')}
              </Link>
              <span aria-hidden> › </span>
              <span className="text-white">{job.title}</span>
            </nav>

            <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div>
                {open ? (
                  <p className="m-0 mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/60 bg-[var(--color-gold)]/15 px-3 py-1 text-[12px] font-semibold text-[var(--color-gold)]">
                    <Icon name="check" className="size-3.5" />
                    {t('Verified opportunity')}
                  </p>
                ) : null}
                <MarketingEyebrow className="text-[var(--color-gold)]">{t('Job details')}</MarketingEyebrow>
                <h1 className="display-serif m-0 mt-3 text-balance text-[clamp(32px,4.8cqi,56px)] font-normal leading-[1.06]">
                  {job.title}
                </h1>
                {job.employerDisplay ? <p className="m-0 mt-3 text-[17px] text-white/85">{job.employerDisplay}</p> : null}
                <ul className="m-0 mt-6 flex list-none flex-wrap items-center gap-x-5 gap-y-3 p-0 text-[14px] text-white/90">
                  {metaRow.map((item) => (
                    <li key={item.label} className="inline-flex items-center gap-2 capitalize">
                      <Icon name={item.icon} className="size-4 text-[var(--color-gold)]" />
                      {item.label}
                    </li>
                  ))}
                  {salary ? (
                    <li className="inline-flex items-center rounded-full bg-[var(--color-gold)] px-3.5 py-1.5 text-[13px] font-semibold text-[#0a088f]">
                      <bdi>{salary}</bdi>
                    </li>
                  ) : null}
                </ul>
                {job.summary ? <p className="m-0 mt-6 max-w-[58ch] text-[16px] leading-[1.6] text-white/88">{job.summary}</p> : null}
                <div className="mt-6">
                  <FilmButton src={filmUrl} poster={INTRO_FILM.poster} label={t(filmLabel)} tone="dark" />
                </div>
                {!open ? (
                  <p className="m-0 mt-6 rounded-[12px] border border-white/25 bg-white/10 px-5 py-4 text-[15px]">
                    {t('This job is no longer taking applications. See similar jobs below.')}
                  </p>
                ) : null}
              </div>

              <div className="relative hidden min-h-[300px] lg:block">
                <MarketingSlideshow slides={heroSlides} className="absolute inset-0" rounded sizes="420px" />
                {saved !== undefined ? <SaveJobButton jobId={job.id} initialSaved={saved} className="absolute end-4 top-4 z-10" /> : null}
              </div>
            </div>
          </div>
        </section>

        <div className="bg-ivory px-[clamp(20px,4cqi,56px)] py-[clamp(28px,5cqi,48px)]">
          <div className="mx-auto grid w-full max-w-[1200px] gap-[clamp(28px,4cqi,48px)] lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <JobSectionNav items={navItems} />
              <article className="mt-4 rounded-[18px] border border-line bg-white p-[clamp(20px,3cqi,36px)] shadow-[0_18px_40px_-28px_rgba(10,8,143,0.35)]">
                <section id="overview">
                  {job.description ? (
                    <>
                      <h2 className="display-serif m-0 mb-4 text-[28px] font-normal tracking-[-0.02em]">{t('About the job')}</h2>
                      <Markdown text={job.description} locale={locale} className="text-[16px] text-ink-2" />
                    </>
                  ) : (
                    <h2 className="display-serif m-0 text-[28px] font-normal tracking-[-0.02em]">{t('About the job')}</h2>
                  )}
                </section>

                {job.responsibilities.length > 0 ? (
                  <section id="responsibilities" className="mt-10">
                    <h2 className="display-serif m-0 mb-4 text-[24px] font-normal tracking-[-0.02em]">{t('What you will do')}</h2>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                      {job.responsibilities.map((item) => (
                        <li key={item} className="flex gap-3 text-[16px] leading-[1.55] text-ink-2">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-gold-soft)] text-[var(--color-gold-deep)]">
                            <Icon name="check" className="size-4" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {job.requirements.length > 0 ? (
                  <section id="requirements" className="mt-10">
                    <h2 className="display-serif m-0 mb-4 text-[24px] font-normal tracking-[-0.02em]">{t('What the employer is looking for')}</h2>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                      {job.requirements.map((item) => (
                        <li key={item} className="flex gap-3 text-[16px] leading-[1.55] text-ink-2">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-gold-soft)] text-[var(--color-gold-deep)]">
                            <Icon name="check" className="size-4" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section id="benefits" className="mt-10">
                  <h2 className="display-serif m-0 mb-5 text-[24px] font-normal tracking-[-0.02em]">{t('What you get')}</h2>
                  {job.benefits.length > 0 ? (
                    <ul className="m-0 mb-6 flex list-none flex-col gap-3 p-0">
                      {job.benefits.map((item) => (
                        <li key={item} className="flex gap-3 text-[16px] leading-[1.55] text-ink-2">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-gold-soft)] text-[var(--color-gold-deep)]">
                            <Icon name="check" className="size-4" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                    {offerItems.map((item) => (
                      <li key={item.label} className="flex gap-3 rounded-[14px] border border-line bg-ivory px-4 py-3 text-[14px] text-ink-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--color-gold)]/40 text-[var(--color-gold-deep)]">
                          <Icon name={item.icon} className="size-[18px]" />
                        </span>
                        <bdi className="self-center font-medium text-ink">{item.label}</bdi>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-10 rounded-[16px] border border-line bg-ivory p-6">
                  <h2 className="m-0 text-[18px] font-semibold">{t('Free to apply. No placement fee.')}</h2>
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

            <aside id="apply" className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
              <ApplyPanel
                locale={locale}
                job={{ id: job.id, slug: job.slug, title: job.title, questions: job.screeningQuestions, open }}
                viewer={applyViewer}
                allowQuickApply={settings.applications.allowQuickApply}
                requirePaidAssessment={settings.applications.requirePaidAssessment}
                shortlistMinScore={settings.hiring.shortlistMinScore}
                salary={salary}
              />
              <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[0_18px_40px_-28px_rgba(10,8,143,0.35)]">
                <MarketingSlideshow
                  slides={BRAND_SLIDES.portugal.map((slide) => ({ src: slide.src, alt: slide.alt }))}
                  className="aspect-[16/9]"
                  sizes="360px"
                />
                <div className="p-5">
                  <h2 className="display-serif m-0 text-[22px] font-normal">{t('Work and live in Portugal')}</h2>
                  <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0 text-[14px] text-ink-2">
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-[var(--color-gold-deep)]" />
                      {t('European work experience on a written contract')}
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-[var(--color-gold-deep)]" />
                      {t('Housing and meals included with many roles')}
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-[var(--color-gold-deep)]" />
                      {t('Visa file prepared with you after a successful offer')}
                    </li>
                  </ul>
                  <Link
                    href={localePath(locale, '/why-portugal')}
                    className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-[#0a088f] no-underline"
                  >
                    {t('Learn more about living in Portugal')} <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {others.length > 0 ? (
          <section className="bg-white px-[clamp(20px,4cqi,56px)] py-[clamp(48px,7cqi,80px)]">
            <div className="mx-auto w-full max-w-[1200px]">
              <h2 className="display-serif m-0 mb-6 text-[28px] font-normal tracking-[-0.02em]">{t('Similar jobs')}</h2>
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
}
