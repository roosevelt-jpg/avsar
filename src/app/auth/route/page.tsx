import { redirect } from 'next/navigation';
import { getViewer, resolveDestination } from '@/lib/auth';
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n';

/**
 * Post-sign-in router.
 *
 * The destination is decided here, on the server, from the session. The form
 * never says where it wants to go, so nothing a browser sends can talk its way
 * into a surface the viewer is not entitled to. An explicit `next` is honoured
 * only when it is same-origin and the viewer's role allows it; otherwise they
 * land at their own home.
 */
export default async function AuthRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; locale?: string }>;
}) {
  const { next, locale: rawLocale } = await searchParams;
  const locale: Locale = rawLocale && isLocale(rawLocale) ? rawLocale : defaultLocale;

  const viewer = await getViewer();
  if (viewer.role === 'anonymous') redirect(`/${locale}/signin`);

  redirect(resolveDestination(viewer, next, locale));
}
