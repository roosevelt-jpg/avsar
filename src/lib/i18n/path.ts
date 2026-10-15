/**
 * Public URLs for each language.
 *
 * English is the default, so it has no prefix: `/` and `/jobs`. Every other
 * language keeps one: `/ml/jobs`, `/ta/jobs`, `/ur/jobs`. The app router still
 * serves English from `app/[locale]` with `locale=en`; `src/proxy.ts` rewrites
 * the bare URL onto that route and sends any old `/en/...` link to the bare one.
 *
 * These constants live here, not in the dictionary, so the proxy can import
 * them without pulling every translated string into the edge bundle.
 */

/** English, then the major languages of India by speakers, then Arabic. */
export const locales = ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'ur', 'gu', 'kn', 'or', 'ml', 'pa', 'as', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** First path segment of routes that are not candidate pages. */
const RESERVED = new Set(['admin', 'api', 'auth', 'employers', 'family', 'dev', 'brand', 'positions', 'video', 'walkthrough']);

function splitSuffix(path: string): [pathname: string, suffix: string] {
  const index = path.search(/[?#]/);
  if (index === -1) return [path, ''];
  return [path.slice(0, index), path.slice(index)];
}

function firstSegment(pathname: string): string {
  return pathname.split('/')[1] ?? '';
}

/** Drop a leading locale segment so the path can be prefixed again. */
export function barePath(path: string): string {
  const [pathname, suffix] = splitSuffix(path);
  const segment = firstSegment(pathname);
  if (!isLocale(segment)) return `${pathname || '/'}${suffix}`;
  const rest = pathname.slice(segment.length + 1);
  return `${rest || '/'}${suffix}`;
}

function isReserved(pathname: string): boolean {
  const segment = firstSegment(pathname);
  if (!segment) return false;
  if (segment.includes('.')) return true;
  return RESERVED.has(segment);
}

/**
 * The URL a visitor should see for this language.
 * `localePath('en', '/jobs')` is `/jobs`. `localePath('hi', '/jobs')` is `/hi/jobs`.
 */
export function localePath(locale: string, path: string): string {
  const code: Locale = isLocale(locale) ? locale : defaultLocale;
  const [raw, suffix] = splitSuffix(path);
  let pathname = raw.startsWith('/') ? raw : `/${raw}`;
  pathname = barePath(pathname);
  if (isReserved(pathname)) return `${pathname}${suffix}`;
  if (code === defaultLocale) return `${pathname}${suffix}`;
  if (pathname === '/') return `/${code}${suffix}`;
  return `/${code}${pathname}${suffix}`;
}

/**
 * The same page in every language, for `<link rel="alternate" hreflang>` and
 * the sitemap. Without it, fourteen versions of one page read to a search
 * engine as duplicates, and a Hindi speaker can be shown the Tamil one.
 * `x-default` is English, the version for anyone whose language is not listed.
 */
export function languageAlternates(path: string): { canonical: string; languages: Record<string, string> } {
  const bare = barePath(path);
  const languages: Record<string, string> = Object.fromEntries(locales.map((code) => [code, localePath(code, bare)]));
  languages['x-default'] = localePath(defaultLocale, bare);
  return { canonical: path, languages };
}

/**
 * Where an `/en` request should send the browser. Null for every other path,
 * including `/hi` and `/ar`, which keep their prefix.
 */
export function englishRedirectPath(pathname: string): string | null {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return null;
}

/**
 * The internal `/en/...` path a bare English URL should render. Null when the
 * request is already localised, or when it is not a candidate page.
 */
export function englishRewritePath(pathname: string): string | null {
  if (englishRedirectPath(pathname)) return null;
  if (isReserved(pathname)) return null;
  const segment = firstSegment(pathname);
  if (isLocale(segment)) return null;
  if (pathname === '/') return '/en';
  return `/en${pathname}`;
}
