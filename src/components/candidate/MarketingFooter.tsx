import { getSessionCandidate } from '@/lib/auth';
import type { Locale } from '@/lib/i18n';
import { SiteFooter } from '@/components/candidate/SiteFooter';

/**
 * Marketing site footer for public shopfront pages only.
 *
 * Signed-in candidates live inside the dashboard shell — the shop footer must
 * never appear under their pages (profile, assessment, jobs from the sidebar,
 * etc.). Auth and the /go funnel stay quiet for anonymous visitors too.
 *
 * This is a Server Component on purpose: a client pathname check can still
 * ship the footer HTML on first paint, which is what candidates were seeing.
 */
const QUIET_ANON = /\/(signin|signup|go|reset-password|applicant)(\/|$)/;

export async function MarketingFooter({
  locale,
  pathname,
}: {
  locale: Locale;
  /** Request path from the proxy (`x-pathname`), including any locale prefix. */
  pathname: string;
}) {
  if (QUIET_ANON.test(pathname)) return null;
  if (await getSessionCandidate()) return null;
  return <SiteFooter locale={locale} />;
}
