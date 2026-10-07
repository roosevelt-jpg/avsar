import type { MetadataRoute } from 'next';

/**
 * Closed to search engines until somebody says otherwise.
 *
 * Reaching the site at its own address and being listed in Google are two
 * different decisions, and only the first one has been taken. The legal pages
 * are still marked DRAFT and the payment rail is waiting on EximPe's approval,
 * and a crawler that arrives now indexes and caches both. Getting a page out
 * of an index is slower and less reliable than keeping it out.
 *
 * Opening it is one environment variable and no deploy: set `ALLOW_INDEXING`
 * to `true` in Vercel.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com';

  if (process.env.ALLOW_INDEXING !== 'true') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        /* Nothing behind a session, and nothing that is only a route. */
        disallow: ['/api/', '/admin/', '/dev/', '/auth/', '/en/dashboard', '/hi/dashboard'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
