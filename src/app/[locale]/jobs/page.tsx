import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import { BlockRenderer } from '@/components/cms/BlockRenderer';
import { cmsMetadata } from '@/components/cms/CmsPageView';
import { JobCard } from '@/components/jobs/JobCard';
import { getPublishedPage, getSiteSettings } from '@/lib/cms/data';
import { listPublishedJobs, openCities } from '@/lib/jobs/data';
import { AREAS, POSITIONS } from '@/lib/data/positions';
import { isLocale } from '@/lib/i18n';

/**
 * The jobs board.
 *
 * Filters are a plain GET form: they work with no JavaScript, the URL is
 * shareable on WhatsApp ("here are all the chef jobs"), and the back button
 * does what people expect. Text above and below the listing is the "jobs"
 * page in the CMS.
 */

type Search = { q?: string; position?: string; area?: string; city?: string; page?: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return cmsMetadata(await getPublishedPage('jobs', locale), `/${locale}/jobs`);
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

  const [cms, settings, result, cities] = await Promise.all([
    getPublishedPage('jobs', locale),
    getSiteSettings(),
    listPublishedJobs({ q: search.q, position: search.position, area: search.area, city: search.city, page, pageSize: 12 }),
    openCities(),
  ]);

  const blocks = cms?.blocks.filter((block) => !block.hidden) ?? [];
  const intro = blocks[0]?.type === 'hero' ? [blocks[0]] : [];
  const after = intro.length ? blocks.slice(1) : blocks;
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filtered = Boolean(search.q || search.position || search.area || search.city);

  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) if (value && key !== 'page') next.set(key, value);
    if (n > 1) next.set('page', String(n));
    const qs = next.toString();
    return `/${locale}/jobs${qs ? `?${qs}` : ''}`;
  };

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <BlockRenderer blocks={intro} locale={locale} settings={settings} />

        <section className="px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,7cqi,96px)]">
          <div className="mx-auto w-full max-w-[1200px]">
            <form
              method="get"
              action={`/${locale}/jobs`}
              className="grid gap-3 rounded-[22px] border border-line bg-surface p-3 shadow-[0_18px_40px_-30px_rgba(27,26,23,0.35)] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <label className="sr-only" htmlFor="q">Search jobs</label>
              <input
                id="q"
                name="q"
                defaultValue={search.q ?? ''}
                placeholder="Job title, skill or city"
                className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[16px] outline-none focus:border-ink"
              />
              <label className="sr-only" htmlFor="position">Role</label>
              <select id="position" name="position" defaultValue={search.position ?? ''} className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[16px]">
                <option value="">All roles</option>
                {AREAS.map((area) => (
                  <optgroup key={area.slug} label={area.label}>
                    {POSITIONS.filter((p) => p.area === area.slug).map((p) => (
                      <option key={p.slug} value={p.slug}>{p.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <label className="sr-only" htmlFor="city">City</label>
              <select id="city" name="city" defaultValue={search.city ?? ''} className="rounded-[14px] border border-line bg-paper px-4 py-3 text-[16px]">
                <option value="">All cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <button type="submit" className="t-colors cursor-pointer rounded-[14px] border-0 bg-ink px-6 py-3 text-[16px] font-medium text-paper hover:bg-accent">
                Search
              </button>
            </form>

            <div className="mt-8 mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-[15px] text-ink-2">
                <strong className="text-ink">{result.total}</strong> {result.total === 1 ? 'open job' : 'open jobs'}
                {filtered ? ' matching your search' : ''}
              </p>
              {filtered && (
                <Link href={`/${locale}/jobs`} className="prose-link text-[14px]">
                  Clear filters
                </Link>
              )}
            </div>

            {result.jobs.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
                <p className="m-0 text-[18px] font-semibold">No jobs match this search right now.</p>
                <p className="m-0 mt-2 text-[15px] text-ink-2">Try another role or city, or create your profile and we will tell you when one opens.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href={`/${locale}/jobs`} className="rounded-full border border-line-strong bg-paper px-5 py-2.5 text-[15px] text-ink no-underline">See all jobs</Link>
                  <Link href={`/${locale}/signup`} className="rounded-full bg-accent px-5 py-2.5 text-[15px] text-white no-underline">Create my profile</Link>
                </div>
              </div>
            ) : (
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {result.jobs.map((job, index) => (
                  <li key={job.id}>
                    <JobCard job={job} locale={locale} priority={index < 3} />
                  </li>
                ))}
              </ul>
            )}

            {pages > 1 && (
              <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
                  n === page ? (
                    <span key={n} aria-current="page" className="grid size-10 place-items-center rounded-full bg-ink text-[14px] text-paper">{n}</span>
                  ) : (
                    <Link key={n} href={pageHref(n)} className="grid size-10 place-items-center rounded-full border border-line bg-surface text-[14px] text-ink no-underline hover:border-ink">
                      {n}
                    </Link>
                  ),
                )}
              </nav>
            )}
          </div>
        </section>

        <BlockRenderer blocks={after} locale={locale} settings={settings} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
