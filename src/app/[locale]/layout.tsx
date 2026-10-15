import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/candidate/SiteFooter';
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
   * The footer lives here rather than in each page so every candidate page,
   * sign-up and dashboard included, carries the same legal details and links.
   */
  return (
    <div lang={locale} dir={localeDirection[locale]} className="avsar-root">
      {children}
      <SiteFooter locale={locale} />
    </div>
  );
}
