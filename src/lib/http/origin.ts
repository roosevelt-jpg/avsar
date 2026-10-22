import { headers } from 'next/headers';

/**
 * The site the visitor is on, so a link they forward opens the same place.
 * A configured SITE_ORIGIN is only the fallback when the request has no host.
 */
export async function publicOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get('x-forwarded-host') ?? list.get('host');
  if (host) {
    const local = host.startsWith('localhost') || host.startsWith('127.');
    const proto = local ? 'http' : list.get('x-forwarded-proto') === 'http' ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  return (process.env.SITE_ORIGIN ?? 'https://recruitment.smithandadams.com').replace(/\/$/, '');
}
