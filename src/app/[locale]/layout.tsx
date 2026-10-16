import { notFound } from 'next/navigation';
import { LocaleFooter } from '@/components/candidate/LocaleFooter';
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
   * The footer lives here for most candidate pages. Sign-in and sign-up hide
   * it (see LocaleFooter) so those screens stay a single full-viewport composition.
   */
  return (
    <div lang={locale} dir={localeDirection[locale]} className="avsar-root">
      {children}
      <LocaleFooter locale={locale} />
    </div>
  );
}
