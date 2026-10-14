import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { DEFAULT_PAGES } from '@/lib/cms/defaults';
import { listPublishedJobs } from '@/lib/jobs/data';

/**
 * The pages worth finding, in every language: the CMS pages, the jobs board,
 * every open job, the price and the terms.
 *
 * Sign-in, sign-up, the assessment and the dashboard are steps in a journey
 * rather than destinations, and are left out. `robots.ts` points here only
 * when indexing has been switched on.
 */
const STATIC_PATHS = ['/pricing', '/terms', '/selection-rules', '/refund-policy', '/delivery', '/privacy', '/contact'];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com';
  const cmsPaths = DEFAULT_PAGES.map((page) => page.path);
  const { jobs } = await listPublishedJobs({ pageSize: 50 });

  return locales.flatMap((locale) => [
    ...cmsPaths.map((path) => ({
      url: `${origin}/${locale}${path}`,
      changeFrequency: path === '' || path === '/jobs' ? ('daily' as const) : ('weekly' as const),
      priority: path === '' ? 1 : path === '/jobs' ? 0.9 : 0.7,
    })),
    ...jobs.map((job) => ({
      url: `${origin}/${locale}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...STATIC_PATHS.map((path) => ({ url: `${origin}/${locale}${path}`, changeFrequency: 'monthly' as const, priority: 0.4 })),
  ]);
}
