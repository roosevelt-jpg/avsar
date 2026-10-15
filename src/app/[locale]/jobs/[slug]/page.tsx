import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { Markdown } from '@/components/cms/Markdown';
import { Icon } from '@/components/cms/primitives';
import { ApplyPanel, type ApplyViewer } from '@/components/jobs/ApplyPanel';
import { JobCard, jobImage } from '@/components/jobs/JobCard';
import { SaveJobButton } from '@/components/jobs/SaveJobButton';
import { savedJobIds } from '@/lib/jobs/saved';
import { getViewer, hasPaid } from '@/lib/auth';
import { getSiteSettings } from '@/lib/cms/data';
import { localizeJob, siteText } from '@/lib/cms/localize';
import { getPublishedJob, recommendedJobs } from '@/lib/jobs/data';
import { EMPLOYMENT_LABELS, formatSalary, HOUSING_LABELS, isOpen, jobLocation } from '@/lib/jobs/types';
import { BRAND } from '@/lib/data/brand';
import { isLocale, languageAlternates, localePath } from '@/lib/i18n';
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
  const image = jobImage(job);
  return {
    title,
    description,
    alternates: languageAlternates(localePath(locale, `/jobs/${job.slug}`)),
    openGraph: { title, description, images: image ? [{ url: image }] : undefined, type: 'website' },
  };
}

export default async function JobPage({ params }: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const stored = await getPublishedJob(slug);
  if (!stored) notFound();
  const job = localizeJob(stored, locale);

  const [viewer, settings] = await Promise.all([getViewer(), getSiteSettings()]);

  /* Who is looking decides what the apply panel offers. A candidate who has
     already applied sees where their application is, not a second button. */
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

  const facts = [
    { icon: 'euro', label: t('Salary'), value: salary ?? t('Discussed at interview') },
    { icon: 'map', label: t('Location'), value: jobLocation(job) },
    { icon: 'briefcase', label: t('Contract'), value: `${t(EMPLOYMENT_LABELS[job.employmentType])}${job.contractMonths ? `, ${job.contractMonths} ${t('months')}` : ''}` },
    { icon: 'home', label: t('Housing'), value: `${t(HOUSING_LABELS[job.housing])}${job.mealsIncluded ? ` · ${t('meals included')}` : ''}` },
    { icon: 'star', label: t('Experience'), value: job.minExperienceYears ? `${job.minExperienceYears}+ ${t('years')}` : t('No minimum') },
    { icon: 'globe', label: t('English'), value: job.minEnglish ? `${job.minEnglish} ${t('or above')}` : t('Basic') },
    { icon: 'plane', label: t('Visa'), value: job.visaSponsored ? t('Employer supports the work visa') : t('You need the right to work') },
    { icon: 'users', label: t('Openings'), value: String(job.openings) },
  ];

  /* Google for Jobs. A job board that does not emit JobPosting data is
     invisible in the job search box most candidates actually use. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: [job.summary, job.description, ...job.responsibilities, ...job.requirements].filter(Boolean).join('\n'),
    datePosted: job.publishedAt ?? job.createdAt,
    validThrough: job.closesAt ?? undefined,
    employmentType: job.employmentType === 'full_time' ? 'FULL_TIME' : job.employmentType === 'part_time' ? 'PART_TIME' : 'TEMPORARY',
    hiringOrganization: { '@type': 'Organization', name: job.employerDisplay || BRAND.name },
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
      <main className="px-[clamp(20px,4cqi,56px)] pt-[clamp(24px,4cqi,40px)] pb-[clamp(48px,7cqi,96px)]">
        <div className="mx-auto w-full max-w-[1200px]">
          <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[12px] text-muted">
            <Link href={localePath(locale, '/jobs')} className="text-muted no-underline hover:text-accent">{siteText(locale, 'Jobs')}</Link>
            <span aria-hidden> / </span>
            <span>{job.title}</span>
          </nav>

          <div className="grid gap-[clamp(28px,4cqi,56px)] lg:grid-cols-[minmax(0,1fr)_380px]">
            <article>
              <div className="relative aspect-[21/9] overflow-hidden rounded-[28px] bg-canvas">
                {image ? (
                  <Image src={image} alt="" fill priority sizes="(max-width: 1024px) 100vw, 780px" unoptimized={!image.startsWith('/')} className="object-cover" />
                ) : (
                  <div className="placeholder-stripes size-full" />
                )}
                {saved !== undefined && <SaveJobButton jobId={job.id} initialSaved={saved} className="absolute end-4 top-4" />}
              </div>

              <p className="m-0 mt-8 font-mono text-[13px] text-muted">{jobLocation(job)}</p>
              <h1 className="m-0 mt-2 text-balance text-[clamp(32px,4.4cqi,52px)] font-semibold leading-[1.04] tracking-[-0.035em]">{job.title}</h1>
              {job.employerDisplay ? <p className="m-0 mt-2 text-[18px] text-ink-2">{job.employerDisplay}</p> : null}
              {job.summary ? <p className="m-0 mt-5 max-w-[62ch] text-[18px] leading-[1.6] text-ink-2">{job.summary}</p> : null}

              {!open && (
                <p className="m-0 mt-6 rounded-[16px] border border-accent/40 bg-accent-tint px-5 py-4 text-[15px] text-ink">
                  {t('This job is no longer taking applications. See similar jobs below.')}
                </p>
              )}

              <dl className="m-0 mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex gap-3 bg-surface p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-accent-deep">
                      <Icon name={fact.icon} className="size-[18px]" />
                    </span>
                    <div>
                      <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{fact.label}</dt>
                      {/* <bdi>: a value like "€1,050 – €1,250 / month" is Latin
                          text, and inside an Arabic page it would otherwise be
                          reordered into nonsense. The row keeps the page's alignment. */}
                      <dd className="m-0 mt-0.5 text-[15px] font-medium"><bdi>{fact.value}</bdi></dd>
                    </div>
                  </div>
                ))}
              </dl>

              {job.description ? (
                <section className="mt-10">
                  <h2 className="m-0 mb-4 text-[24px] font-semibold tracking-[-0.02em]">{t('About the job')}</h2>
                  <Markdown text={job.description} locale={locale} className="text-[16px] text-ink-2" />
                </section>
              ) : null}

              {[
                { title: t('What you will do'), list: job.responsibilities },
                { title: t('What the employer is looking for'), list: job.requirements },
                { title: t('What you get'), list: job.benefits },
              ]
                .filter((section) => section.list.length > 0)
                .map((section) => (
                  <section key={section.title} className="mt-10">
                    <h2 className="m-0 mb-4 text-[24px] font-semibold tracking-[-0.02em]">{section.title}</h2>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                      {section.list.map((item) => (
                        <li key={item} className="flex gap-3 text-[16px] leading-[1.55] text-ink-2">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                            <Icon name="check" className="size-4" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

              <section className="mt-10 rounded-[22px] border border-line bg-surface p-6">
                <h2 className="m-0 text-[18px] font-semibold">{t('Free to apply. No placement fee.')}</h2>
                <p className="m-0 mt-2 text-[15px] leading-[1.6] text-ink-2">
                  {t('You never pay to be hired. If anyone asks you for money for this job outside this website, it is not us.')}{' '}
                  <Link href={localePath(locale, '/stay-safe')} className="prose-link">{t('How to stay safe')}</Link>.
                </p>
              </section>
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <ApplyPanel
                locale={locale}
                job={{ id: job.id, slug: job.slug, title: job.title, questions: job.screeningQuestions, open }}
                viewer={applyViewer}
                allowQuickApply={settings.applications.allowQuickApply}
                requirePaidAssessment={settings.applications.requirePaidAssessment}
                salary={salary}
              />
            </aside>
          </div>

          {others.length > 0 && (
            <section className="mt-[clamp(48px,7cqi,96px)]">
              <h2 className="m-0 mb-6 text-[28px] font-semibold tracking-[-0.03em]">{t('Similar jobs')}</h2>
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((other) => (
                  <li key={other.id}>
                    <JobCard job={other} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
