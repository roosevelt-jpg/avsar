import { notFound } from 'next/navigation';
import { VslFunnel } from '@/components/marketing/VslFunnel';
import { getSiteSettings } from '@/lib/cms/data';
import { resolveVslVideo } from '@/lib/cms/settings';
import { getDictionary, isLocale, localePath } from '@/lib/i18n';
import { signupHrefWithTracking } from '@/lib/marketing/tracking';
import { staticPageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return staticPageMetadata('go', locale);
}

/**
 * Cross-platform marketing funnel (ads, WhatsApp, Instagram).
 *
 * Video sales letter → one CTA to sign-up. Query params for attribution are
 * forwarded. Edit copy and the film under Settings › VSL funnel.
 */
export default async function GoFunnelPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const t = getDictionary(locale);
  const settings = await getSiteSettings();
  const video = resolveVslVideo(settings);
  const signupHref = signupHrefWithTracking((path) => localePath(locale, path), query);

  return (
    <VslFunnel
      locale={locale}
      copy={settings.vsl}
      video={video}
      signupHref={signupHref}
      homeHref={localePath(locale, '/')}
      signInHref={localePath(locale, '/signin')}
      signInLabel={t.signIn}
    />
  );
}
