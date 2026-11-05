import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DashboardNav } from '@/components/candidate/DashboardNav';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { BlockRenderer } from '@/components/cms/BlockRenderer';
import { cmsMetadata } from '@/components/cms/CmsPageView';
import { JobCard } from '@/components/jobs/JobCard';
import { JobsBoardHero } from '@/components/jobs/JobsBoardHero';
import { BRAND_SLIDES } from '@/lib/cms/brand-media';
import { getPublishedPage, getSiteSettings } from '@/lib/cms/data';
import { getFunnelStats } from '@/lib/stats/funnel';

const JOBS_HERO_SLIDES = BRAND_SLIDES.jobs.map((slide) => ({ src: slide.src, alt: slide.alt }));
import { listPublishedJobs, openCities } from '@/lib/jobs/data';
import {
  EXPERIENCE_BANDS,
  jobBoardFacets,
  parseListParam,
  type ExperienceBand,
} from '@/lib/jobs/board';
import { EMPLOYMENT_LABELS, EMPLOYMENT_TYPES, type EmploymentType } from '@/lib/jobs/types';
import { AREAS } from '@/lib/data/positions';
import { localizeJob, siteText } from '@/lib/cms/localize';
import { fill, isLocale, localePath } from '@/lib/i18n';
import { getViewer } from '@/lib/auth';
import { savedJobIds } from '@/lib/jobs/saved';

/**
 * The jobs board — Job Opportunities mockup shell.
 *
 * Filters are a plain GET form (shareable URL, no JS required). Hero and
 * ribbon figures come from Settings › Jobs board; the listing is live data.
 * CMS blocks after the hero still render for the closer CTA.
 */

type Search = {
  q?: string;
  position?: string;
  area?: string | string[];
  city?: string;
  type?: string | string[];
  exp?: string | string[];
  salaryMin?: string;
  salaryMax?: string;
  sort?: string;
  page?: string;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return cmsMetadata(await getPublishedPage('jobs', locale), localePath(locale, '/jobs'));
}

function asEmployment(values: string[]): EmploymentType[] {
  return values.filter((value): value is EmploymentType => (EMPLOYMENT_TYPES as readonly string[]).includes(value));
}

function asExperience(values: string[]): ExperienceBand[] {
  return values.filter((value): value is ExperienceBand => (EXPERIENCE_BANDS as readonly string[]).includes(value));
}

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const search = await searchParams;
  const page = Math.max(1, Number(search.page) || 1);
  const areas = parseListParam(search.area);
  const employmentTypes = asEmployment(parseListParam(search.type));
  const experience = asExperience(parseListParam(search.exp));
  const salaryMin = search.salaryMin ? Number(search.salaryMin) : undefined;
  const salaryMax = search.salaryMax ? Number(search.salaryMax) : undefined;
  const sort = search.sort === 'salary' ? 'salary' : 'newest';

  const [cms, settings, result, cities, facets, viewer, funnel] = await Promise.all([
    getPublishedPage('jobs', locale),
    getSiteSettings(),
    listPublishedJobs({
      q: search.q,
      position: search.position,
      areas,
      city: search.city,
      employmentTypes,
      experience,
      salaryMin: Number.isFinite(salaryMin) ? salaryMin : undefined,
      salaryMax: Number.isFinite(salaryMax) ? salaryMax : undefined,
      sort,
      page,
      pageSize: 12,
    }),
    openCities(),
    jobBoardFacets(),
    getViewer(),
    getFunnelStats(),
  ]);

  const board = settings.jobsBoard;
  const tx = (english: string) => siteText(locale, english);
  const saved = viewer.role === 'candidate' ? await savedJobIds(viewer.candidate.id) : null;

  const blocks = cms?.blocks.filter((block) => !block.hidden) ?? [];
  /* Hero shell is built below; keep any non-hero CMS blocks for the closer. */
  const after = blocks.filter((block) => block.type !== 'hero');
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filtered = Boolean(
    search.q ||
      search.position ||
      areas.length ||
      search.city ||
      employmentTypes.length ||
      experience.length ||
      salaryMin != null ||
      salaryMax != null,
  );

  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (!value || key === 'page') continue;
      if (Array.isArray(value)) value.forEach((item) => next.append(key, item));
      else next.set(key, value);
    }
    if (n > 1) next.set('page', String(n));
    const qs = next.toString();
    return localePath(locale, `/jobs${qs ? `?${qs}` : ''}`);
  };

  const number = new Intl.NumberFormat(locale === 'en' ? 'en-IN' : locale);
  /* Live vacancy count only — Settings mockup figures (150+, 1,200+) are never shown. */
  const heroStats = [
    { value: number.format(result.total), label: tx(board.statsVacancies || 'Open roles'), icon: 'briefcase' },
    ...(funnel.hired > 0
      ? [{ value: number.format(funnel.hired), label: tx(board.statsPlaced || 'Hired'), icon: 'users' }]
      : []),
  ];
  const field =
    't-colors w-full border-0 bg-transparent py-3 pe-3 ps-10 text-[15px] text-ink outline-none';

  const searchForm = (
    <form
      method="get"
      action={localePath(locale, '/jobs')}
      id="jobs-search"
      className="grid gap-0 divide-y divide-[#e2e5ea] rounded-[14px] border border-[#e2e5ea] bg-white shadow-[0_16px_36px_-28px_rgba(20,36,56,0.55)] md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto]"
    >
      <label className="relative block">
        <span className="sr-only">{tx(board.searchKeywordPlaceholder)}</span>
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#b28a49]" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" strokeLinecap="round" />
          </svg>
        </span>
        <input id="q" name="q" defaultValue={search.q ?? ''} placeholder={tx(board.searchKeywordPlaceholder)} className={field} />
      </label>
      <label className="relative block">
        <span className="sr-only">{tx(board.searchLocationLabel)}</span>
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#b28a49]" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        </span>
        <select id="city" name="city" defaultValue={search.city ?? ''} className={`${field} appearance-none`}>
          <option value="">{tx(board.searchLocationLabel)}</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>
      <label className="relative block">
        <span className="sr-only">{tx(board.searchCategoryLabel)}</span>
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#b28a49]" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M4 8h16v11H4z M9 8V5h6v3" />
          </svg>
        </span>
        <select id="area-top" name="area" defaultValue={areas[0] ?? ''} className={`${field} appearance-none`}>
          <option value="">{tx(board.searchCategoryLabel)}</option>
          {AREAS.map((area) => (
            <option key={area.slug} value={area.slug}>
              {tx(area.label)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="t-colors m-2 cursor-pointer rounded-[10px] bg-[#b28a49] px-6 py-3 text-[15px] font-semibold text-[#142438] hover:bg-[#c49a58] md:m-2.5"
      >
        {tx(board.searchButton)}
        <span aria-hidden className="ms-1">
          →
        </span>
      </button>
    </form>
  );

  const signedIn = viewer.role === 'candidate';

  const boardMain = (
      <main className={signedIn ? '' : 'bg-[#f4f5f7]'}>
        {signedIn ? null : (
        <JobsBoardHero
          eyebrow={board.heroEyebrow}
          headline={board.heroHeadline}
          accentWord={board.heroAccentWord}
          intro={board.heroIntro}
          imageSrc={board.heroImage}
          imageAlt={board.heroImageAlt}
          slides={JOBS_HERO_SLIDES}
          stats={heroStats}
          search={searchForm}
        />
        )}

        {signedIn ? <div className="mb-6">{searchForm}</div> : null}

        <section className={signedIn ? 'pb-4 pt-2' : 'px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,7cqi,96px)] pt-12 sm:pt-14'}>
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
              <aside className="shop-sticky rounded-[12px] border border-[#e2e5ea] bg-[#f4f5f7] p-5 lg:sticky lg:self-start">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="m-0 text-[16px] font-semibold text-[#142438]">{tx(board.filterTitle)}</h2>
                  <Link
                    href={localePath(locale, '/jobs')}
                    className={`text-[13px] font-medium text-[var(--color-gold-deep)] no-underline hover:underline ${filtered ? '' : 'opacity-50'}`}
                  >
                    {tx(board.clearAll)}
                  </Link>
                </div>

                <form method="get" action={localePath(locale, '/jobs')} className="flex flex-col gap-1">
                  {search.q ? <input type="hidden" name="q" value={search.q} /> : null}
                  {search.city ? <input type="hidden" name="city" value={search.city} /> : null}
                  {search.position ? <input type="hidden" name="position" value={search.position} /> : null}
                  {sort !== 'newest' ? <input type="hidden" name="sort" value={sort} /> : null}

                  <FilterGroup title={tx(board.categoryHeading)} open>
                    {facets.areas.map((area) => (
                      <label key={area.slug} className="flex cursor-pointer items-center justify-between gap-3 text-[14px] text-ink-2">
                        <span className="inline-flex items-center gap-2">
                          <input type="checkbox" name="area" value={area.slug} defaultChecked={areas.includes(area.slug)} className="size-4 accent-[#142438]" />
                          {tx(area.label)}
                        </span>
                        <span className="text-[12px] text-muted">{area.count}</span>
                      </label>
                    ))}
                  </FilterGroup>

                  <FilterGroup title={tx(board.experienceHeading)}>
                    {facets.experience.map((item) => {
                      const label =
                        item.band === 'entry' ? board.experienceEntry : item.band === 'mid' ? board.experienceMid : board.experienceSenior;
                      return (
                        <label key={item.band} className="flex cursor-pointer items-center justify-between gap-3 text-[14px] text-ink-2">
                          <span className="inline-flex items-center gap-2">
                            <input type="checkbox" name="exp" value={item.band} defaultChecked={experience.includes(item.band)} className="size-4 accent-[#142438]" />
                            {tx(label)}
                          </span>
                          <span className="text-[12px] text-muted">{item.count}</span>
                        </label>
                      );
                    })}
                  </FilterGroup>

                  <FilterGroup title={tx(board.employmentHeading)}>
                    {facets.employment.map((item) => (
                      <label key={item.type} className="flex cursor-pointer items-center justify-between gap-3 text-[14px] text-ink-2">
                        <span className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="type"
                            value={item.type}
                            defaultChecked={employmentTypes.includes(item.type)}
                            className="size-4 accent-[#142438]"
                          />
                          {tx(EMPLOYMENT_LABELS[item.type])}
                        </span>
                        <span className="text-[12px] text-muted">{item.count}</span>
                      </label>
                    ))}
                  </FilterGroup>

                  <FilterGroup title={tx(board.salaryHeading)}>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[12px] text-muted">
                        {tx(board.salaryMinLabel)}
                        <input
                          type="number"
                          name="salaryMin"
                          min={0}
                          step={50}
                          placeholder={String(facets.salaryMin)}
                          defaultValue={salaryMin ?? ''}
                          className="mt-1 w-full rounded-[10px] border border-line bg-[#f4f5f7] px-3 py-2 text-[14px] text-ink"
                        />
                      </label>
                      <label className="text-[12px] text-muted">
                        {tx(board.salaryMaxLabel)}
                        <input
                          type="number"
                          name="salaryMax"
                          min={0}
                          step={50}
                          placeholder={String(facets.salaryMax)}
                          defaultValue={salaryMax ?? ''}
                          className="mt-1 w-full rounded-[10px] border border-line bg-[#f4f5f7] px-3 py-2 text-[14px] text-ink"
                        />
                      </label>
                    </div>
                    <p className="m-0 mt-2 text-[12px] text-muted">
                      €{facets.salaryMin.toLocaleString('en-US')} – €{facets.salaryMax.toLocaleString('en-US')}
                    </p>
                  </FilterGroup>

                  <button
                    type="submit"
                    className="mt-3 cursor-pointer rounded-[10px] bg-[#b28a49] px-4 py-2.5 text-[14px] font-semibold text-[#142438] hover:bg-[#c49a58]"
                  >
                    {tx(board.searchButton)}
                  </button>
                </form>
              </aside>

              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="display-serif m-0 text-[clamp(22px,2.6cqi,30px)] font-normal tracking-[-0.02em] text-[#142438]">
                    {fill(tx(board.resultsHeading.replace('{count}+', '{count}')), {
                      count: number.format(result.total),
                    })}
                  </h2>
                  <form method="get" action={localePath(locale, '/jobs')} className="flex flex-wrap items-center gap-2 text-[14px]">
                    {search.q ? <input type="hidden" name="q" value={search.q} /> : null}
                    {search.city ? <input type="hidden" name="city" value={search.city} /> : null}
                    {areas.map((area) => (
                      <input key={area} type="hidden" name="area" value={area} />
                    ))}
                    {employmentTypes.map((type) => (
                      <input key={type} type="hidden" name="type" value={type} />
                    ))}
                    {experience.map((band) => (
                      <input key={band} type="hidden" name="exp" value={band} />
                    ))}
                    {salaryMin != null ? <input type="hidden" name="salaryMin" value={String(salaryMin)} /> : null}
                    {salaryMax != null ? <input type="hidden" name="salaryMax" value={String(salaryMax)} /> : null}
                    <label className="inline-flex items-center gap-2 text-ink-2">
                      <span className="text-[13px] text-muted">{tx(board.sortLabel)}:</span>
                      <select name="sort" defaultValue={sort} className="rounded-[8px] border border-line bg-white px-3 py-2 text-[14px]">
                        <option value="newest">{tx(board.sortNewest)}</option>
                        <option value="salary">{tx(board.sortSalary)}</option>
                      </select>
                    </label>
                    <button type="submit" className="rounded-[8px] border border-line bg-white px-3 py-2 text-[13px] font-medium text-[#142438]">
                      {tx(board.searchButton)}
                    </button>
                  </form>
                </div>

                {result.jobs.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-[#d5d9e0] bg-white px-6 py-14 text-center">
                    <p className="m-0 text-[18px] font-semibold text-[#142438]">{tx(board.emptyTitle)}</p>
                    <p className="m-0 mt-2 text-[15px] text-ink-2">{tx(board.emptyBody)}</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <Link href={localePath(locale, '/jobs')} className="rounded-[8px] border border-line-strong bg-paper px-5 py-2.5 text-[15px] text-ink no-underline">
                        {tx('See all jobs')}
                      </Link>
                      <Link href={localePath(locale, '/signup')} className="rounded-[8px] bg-[#b28a49] px-5 py-2.5 text-[15px] font-semibold text-[#142438] no-underline">
                        {tx('Create my free profile')}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-4 p-0">
                    {result.jobs.map((job, index) => (
                      <li key={job.id}>
                        <JobCard
                          job={localizeJob(job, locale)}
                          locale={locale}
                          variant="list"
                          board={board}
                          priority={index < 3}
                          saved={saved ? saved.has(job.id) : undefined}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {pages > 1 && (
                  <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
                      n === page ? (
                        <span key={n} aria-current="page" className="grid size-10 place-items-center rounded-full bg-[#142438] text-[14px] text-white">
                          {n}
                        </span>
                      ) : (
                        <Link
                          key={n}
                          href={pageHref(n)}
                          className="grid size-10 place-items-center rounded-[8px] border border-line bg-white text-[14px] text-ink no-underline hover:border-[#142438]"
                        >
                          {n}
                        </Link>
                      ),
                    )}
                  </nav>
                )}
              </div>
            </div>
          </div>
        </section>

        {signedIn ? null : <BlockRenderer blocks={after} locale={locale} settings={settings} />}
      </main>
  );

  if (signedIn) {
    return (
      <DashboardNav
        locale={locale}
        current="jobs"
        candidate={{
          fullName: viewer.candidate.fullName,
          emailConfirmed: viewer.candidate.emailConfirmed,
        }}
        savedCount={saved?.size ?? 0}
        whatsapp={settings.general.whatsapp}
      >
        {boardMain}
      </DashboardNav>
    );
  }

  return (
    <>
      <SiteHeader locale={locale} />
      {boardMain}
    </>
  );
}

function FilterGroup({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-[#eee7dc] py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold text-[#142438] [&::-webkit-details-marker]:hidden">
        {title}
        <svg viewBox="0 0 24 24" className="size-4 text-[#b28a49] transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </details>
  );
}
