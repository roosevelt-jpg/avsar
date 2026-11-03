import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { BlockRenderer } from '@/components/cms/BlockRenderer';
import { cmsMetadata } from '@/components/cms/CmsPageView';
import { Icon } from '@/components/cms/primitives';
import { JobCard } from '@/components/jobs/JobCard';
import { getPublishedPage, getSiteSettings } from '@/lib/cms/data';
import { listPublishedJobs, openCities } from '@/lib/jobs/data';
import {
  EXPERIENCE_BANDS,
  jobBoardFacets,
  jobBoardStats,
  parseListParam,
  type ExperienceBand,
} from '@/lib/jobs/board';
import { EMPLOYMENT_LABELS, EMPLOYMENT_TYPES, type EmploymentType } from '@/lib/jobs/types';
import { AREAS } from '@/lib/data/positions';
import { localizeJob, siteText } from '@/lib/cms/localize';
import { fill, isLocale, localePath } from '@/lib/i18n';
import { getViewer } from '@/lib/auth';
import { savedJobIds } from '@/lib/jobs/saved';
import type { JobsBoardSettings } from '@/lib/cms/settings';

/**
 * The jobs board.
 *
 * Filters are a plain GET form: they work with no JavaScript, the URL is
 * shareable on WhatsApp, and the back button does what people expect. Hero
 * and closer copy come from the CMS; search and filter labels from Settings ›
 * Jobs board. Counts are live from the database.
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

  const [cms, settings, result, cities, facets, stats, viewer] = await Promise.all([
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
    jobBoardStats(),
    getViewer(),
  ]);

  const board = settings.jobsBoard;
  const tx = (english: string) => siteText(locale, english);
  const saved = viewer.role === 'candidate' ? await savedJobIds(viewer.candidate.id) : null;

  const blocks = cms?.blocks.filter((block) => !block.hidden) ?? [];
  const intro = blocks[0]?.type === 'hero' ? [blocks[0]] : [];
  const after = intro.length ? blocks.slice(1) : blocks;
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

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <BlockRenderer blocks={intro} locale={locale} settings={settings} />

        <section className="relative z-10 -mt-6 px-[clamp(20px,4cqi,56px)] pb-4">
          <div className="mx-auto w-full max-w-[1200px]">
            <LiveStats board={board} locale={locale} stats={stats} format={number} />
          </div>
        </section>

        <section className="relative z-10 -mt-2 px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,7cqi,96px)]">
          <div className="mx-auto w-full max-w-[1200px]">
            <form
              method="get"
              action={localePath(locale, '/jobs')}
              id="jobs-search"
              className="grid gap-3 rounded-[18px] border border-line bg-white p-3 shadow-[0_18px_40px_-28px_rgba(10,8,143,0.45)] md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1fr)_auto]"
            >
              <label className="sr-only" htmlFor="q">
                {tx(board.searchKeywordPlaceholder)}
              </label>
              <input
                id="q"
                name="q"
                defaultValue={search.q ?? ''}
                placeholder={tx(board.searchKeywordPlaceholder)}
                className="rounded-full border border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-[#0a088f]"
              />
              <label className="sr-only" htmlFor="city">
                {tx(board.searchLocationLabel)}
              </label>
              <select
                id="city"
                name="city"
                defaultValue={search.city ?? ''}
                className="rounded-full border border-line bg-paper px-4 py-3 text-[15px]"
              >
                <option value="">{tx(board.searchLocationLabel)}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="area-top">
                {tx(board.searchCategoryLabel)}
              </label>
              <select
                id="area-top"
                name="area"
                defaultValue={areas[0] ?? ''}
                className="rounded-full border border-line bg-paper px-4 py-3 text-[15px]"
              >
                <option value="">{tx(board.searchCategoryLabel)}</option>
                {AREAS.map((area) => (
                  <option key={area.slug} value={area.slug}>
                    {tx(area.label)}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-gradient t-colors cursor-pointer px-6 py-3 text-[15px] font-semibold">
                {tx(board.searchButton)}
                <span aria-hidden className="ms-1">
                  →
                </span>
              </button>
            </form>

            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
              <aside className="rounded-[18px] border border-line bg-white p-5 shadow-[0_10px_28px_-24px_rgba(10,8,143,0.35)] lg:sticky lg:top-24 lg:self-start">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="m-0 text-[16px] font-semibold text-[#0a088f]">{tx(board.filterTitle)}</h2>
                  {filtered ? (
                    <Link href={localePath(locale, '/jobs')} className="text-[13px] font-medium text-[var(--color-gold-deep)] no-underline hover:underline">
                      {tx(board.clearAll)}
                    </Link>
                  ) : null}
                </div>

                <form method="get" action={localePath(locale, '/jobs')} className="flex flex-col gap-6">
                  {search.q ? <input type="hidden" name="q" value={search.q} /> : null}
                  {search.city ? <input type="hidden" name="city" value={search.city} /> : null}
                  {search.position ? <input type="hidden" name="position" value={search.position} /> : null}
                  {sort !== 'newest' ? <input type="hidden" name="sort" value={sort} /> : null}

                  <FilterGroup title={tx(board.categoryHeading)}>
                    {facets.areas.map((area) => (
                      <label key={area.slug} className="flex cursor-pointer items-center justify-between gap-3 text-[14px] text-ink-2">
                        <span className="inline-flex items-center gap-2">
                          <input type="checkbox" name="area" value={area.slug} defaultChecked={areas.includes(area.slug)} className="size-4 accent-[#0a088f]" />
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
                            <input type="checkbox" name="exp" value={item.band} defaultChecked={experience.includes(item.band)} className="size-4 accent-[#0a088f]" />
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
                            className="size-4 accent-[#0a088f]"
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
                          className="mt-1 w-full rounded-[10px] border border-line px-3 py-2 text-[14px] text-ink"
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
                          className="mt-1 w-full rounded-[10px] border border-line px-3 py-2 text-[14px] text-ink"
                        />
                      </label>
                    </div>
                  </FilterGroup>

                  <button type="submit" className="btn-gradient t-colors cursor-pointer px-4 py-2.5 text-[14px] font-semibold">
                    {tx(board.searchButton)}
                  </button>
                </form>
              </aside>

              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="m-0 text-[clamp(20px,2.4cqi,28px)] font-semibold tracking-[-0.02em] text-[#0a088f]">
                    {fill(tx(board.resultsHeading), { count: number.format(result.total) })}
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
                      <span className="text-[13px] text-muted">{tx(board.sortLabel)}</span>
                      <select name="sort" defaultValue={sort} className="rounded-full border border-line bg-white px-3 py-2 text-[14px]">
                        <option value="newest">{tx(board.sortNewest)}</option>
                        <option value="salary">{tx(board.sortSalary)}</option>
                      </select>
                    </label>
                    <button type="submit" className="rounded-full border border-line bg-white px-3 py-2 text-[13px] font-medium text-[#0a088f]">
                      {tx(board.searchButton)}
                    </button>
                  </form>
                </div>

                {result.jobs.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-line-strong bg-white px-6 py-14 text-center">
                    <p className="m-0 text-[18px] font-semibold text-[#0a088f]">{tx(board.emptyTitle)}</p>
                    <p className="m-0 mt-2 text-[15px] text-ink-2">{tx(board.emptyBody)}</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <Link href={localePath(locale, '/jobs')} className="rounded-full border border-line-strong bg-paper px-5 py-2.5 text-[15px] text-ink no-underline">
                        {tx('See all jobs')}
                      </Link>
                      <Link href={localePath(locale, '/signup')} className="btn-gradient px-5 py-2.5 text-[15px] no-underline">
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
                        <span key={n} aria-current="page" className="grid size-10 place-items-center rounded-full bg-[#0a088f] text-[14px] text-white">
                          {n}
                        </span>
                      ) : (
                        <Link
                          key={n}
                          href={pageHref(n)}
                          className="grid size-10 place-items-center rounded-full border border-line bg-white text-[14px] text-ink no-underline hover:border-[#0a088f]"
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

        <BlockRenderer blocks={after} locale={locale} settings={settings} />
      </main>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="m-0 mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gold-deep)]">{title}</p>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function LiveStats({
  board,
  locale,
  stats,
  format,
}: {
  board: JobsBoardSettings;
  locale: import('@/lib/i18n').Locale;
  stats: { vacancies: number; employers: number; placed: number };
  format: Intl.NumberFormat;
}) {
  const tx = (english: string) => siteText(locale, english);
  const items = [
    { label: fill(tx(board.statsVacancies), { count: format.format(stats.vacancies) }), icon: 'briefcase' as const },
    { label: fill(tx(board.statsEmployers), { count: format.format(stats.employers) }), icon: 'home' as const },
    { label: fill(tx(board.statsPlaced), { count: format.format(stats.placed) }), icon: 'users' as const },
  ];
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-3 rounded-[16px] border border-white/15 bg-[#0a088f] p-4 text-white shadow-[0_16px_36px_-20px_rgba(10,8,143,0.55)] sm:grid-cols-3 sm:gap-6 sm:px-6 sm:py-5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3 text-[14px] font-medium leading-[1.35]">
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--color-gold)]/50 text-[var(--color-gold)]">
            <Icon name={item.icon} className="size-4" />
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
