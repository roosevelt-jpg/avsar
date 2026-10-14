import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';

/**
 * The pages worth finding, in both languages.
 *
 * Only what a stranger should land on: the pitch, the price, and the terms.
 * Sign-in, sign-up, the assessment and the dashboard are steps in a journey
 * rather than destinations, and the /b variant is an internal comparison that
 * would read as duplicate content.
 *
 * `robots.ts` points here only when indexing has been switched on, so until
 * then this file is listed by nobody.
 */
const PATHS = [
  '',
  '/pricing',
  '/terms',
  '/selection-rules',
  '/refund-policy',
  '/delivery',
  '/privacy',
  '/contact',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com';

  return locales.flatMap((locale) =>
    PATHS.map((path) => ({
      url: `${origin}/${locale}${path}`,
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.6,
    })),
  );
}
