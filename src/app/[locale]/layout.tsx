import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { MarketShell } from '@/components/candidate/MarketShell';
import { MarketingFooter } from '@/components/candidate/MarketingFooter';
import { getViewer } from '@/lib/auth';
import { PATHNAME_HEADER } from '@/proxy';
import { isLocale, locales, localeDirection } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  /**
   * `lang` has to be right for the script fallback stacks and for screen
   * readers, and the root layout cannot know the locale, so it is set here.
   *
   * `dir` rides along for the same reason. Everything inside inherits it, so
   * one attribute flips text alignment, list markers, the order of flex and
   * grid children, and which side the scrollbar sits on.
   *
   * Signed-in candidates / staff / employers get no marketing chrome or footer;
   * their pages wrap in CandidateDashShell / AdminShell themselves.
   */
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? '';
  const viewer = await getViewer();
  const signedIn = viewer.role !== 'anonymous';

  return (
    <div lang={locale} dir={localeDirection[locale]} className="avsar-root">
      <MarketShell locale={locale} signedIn={signedIn}>
        {children}
        <MarketingFooter locale={locale} pathname={pathname} />
      </MarketShell>
    </div>
  );
}
