/**
 * Query keys worth carrying from an ad or WhatsApp link on /go into /signup
 * so attribution survives the hand-off. Anything else on the funnel URL is
 * dropped so we do not turn sign-up into an open redirect dump.
 */
const TRACKING_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'msclkid',
  'ttclid',
  'ref',
  'position',
]);

/** Build a relative sign-up path that keeps ad and position params. */
export function signupHrefWithTracking(
  localePathFn: (path: string) => string,
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const kept = new URLSearchParams();
  for (const [key, raw] of Object.entries(searchParams)) {
    if (!TRACKING_KEYS.has(key)) continue;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) kept.set(key, value);
  }
  const base = localePathFn('/signup');
  const qs = kept.toString();
  return qs ? `${base}?${qs}` : base;
}
