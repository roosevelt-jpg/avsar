import type { MetadataRoute } from 'next';
import { languageAlternates, locales, localePath } from '@/lib/i18n';
import { DEFAULT_PAGES } from '@/lib/cms/defaults';
import { listPublishedJobSlugs } from '@/lib/jobs/data';

/**
 * The pages worth finding, in every language: the CMS pages, the jobs board,
 * every open job, the price and the terms.
 *
 * Sign-in, sign-up, the assessment and the dashboard are steps in a journey
 * rather than destinations, and are left out. `robots.ts` points here only
 * when indexing has been switched on.
 *
 * Each entry lists its other languages, so a search engine treats the
 * fourteen versions of a page as one page in fourteen languages rather than as
 * duplicates competing with each other.
 */
const STATIC_PATHS = ['/go', '/pricing', '/terms', '/selection-rules', '/refund-policy', '/delivery', '/privacy', '/contact'];

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com';
  const cmsPaths = DEFAULT_PAGES.map((page) => page.path || '/');
  const jobs = await listPublishedJobSlugs();

  const absolute = (languages: Record<string, string>) =>
    Object.fromEntries(Object.entries(languages).map(([code, path]) => [code, `${origin}${path}`]));

  const entry = (locale: string, path: string, rest: Omit<Entry, 'url'>): Entry => ({
    url: `${origin}${localePath(locale, path)}`,
    alternates: { languages: absolute(languageAlternates(localePath(locale, path)).languages) },
    ...rest,
  });

  return locales.flatMap((locale) => [
    ...cmsPaths.map((path) =>
      entry(locale, path, {
        changeFrequency: path === '/' || path === '/jobs' ? 'daily' : 'weekly',
        priority: path === '/' ? 1 : path === '/jobs' ? 0.9 : 0.7,
      }),
    ),
    ...jobs.map((job) => entry(locale, `/jobs/${job.slug}`, { lastModified: job.updatedAt, changeFrequency: 'daily', priority: 0.8 })),
    ...STATIC_PATHS.map((path) => entry(locale, path, { changeFrequency: 'monthly', priority: 0.4 })),
  ]);
}
