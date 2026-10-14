import type { MetadataRoute } from 'next';

/**
 * Closed to search engines until somebody says otherwise.
 *
 * Reaching the site at its own address and being listed in Google are two
 * different decisions, and only the first one has been taken. The legal pages
 * were approved on 6 October 2026, so what is left is the payment rail: a
 * candidate arriving from a search result today finishes the assessment and
 * meets a checkout that cannot charge, because EximPe has not approved the
 * account yet. Getting a page out of an index is slower and less reliable
 * than keeping it out, so it stays out until that leg works.
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
        disallow: ['/api/', '/admin/', '/dev/', '/auth/', '/en/dashboard', '/hi/dashboard', '/ar/dashboard', '/en/classic', '/hi/classic', '/ar/classic'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
