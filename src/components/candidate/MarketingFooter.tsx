import { getViewer } from '@/lib/auth';
import type { Locale } from '@/lib/i18n';
import { SiteFooter } from '@/components/candidate/SiteFooter';

/**
 * Marketing site footer for public shopfront pages only.
 *
 * Any signed-in audience (candidate, staff, employer, or a bare registered
 * account) lives in a dashboard shell — the shop footer must never appear
 * under those sessions. Auth and the /go funnel stay quiet for anonymous
 * visitors too.
 *
 * Server Component on purpose: a client pathname check can still ship the
 * footer HTML on first paint.
 */
const QUIET_ANON = /\/(signin|signup|go|reset-password|applicant)(\/|$)/;
/* Jobs stay public for anonymous visitors (they still get the shop footer).
   Signed-in audiences are blocked by the viewer check below. */
const QUIET_APP = /\/(dashboard|profile|assessment|admin)(\/|$)/i;

export async function MarketingFooter({
  locale,
  pathname,
}: {
  locale: Locale;
  /** Request path from the proxy (`x-pathname`), including any locale prefix. */
  pathname: string;
}) {
  if (QUIET_ANON.test(pathname)) return null;
  if (QUIET_APP.test(pathname)) return null;

  const viewer = await getViewer();
  if (viewer.role !== 'anonymous') return null;

  return <SiteFooter locale={locale} />;
}
