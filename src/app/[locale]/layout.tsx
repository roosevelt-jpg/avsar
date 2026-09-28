import { notFound } from 'next/navigation';
import { isLocale, locales } from '@/lib/i18n';

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
   * `lang` has to be right for the Devanagari fallback stack and for screen
   * readers, and the root layout cannot know the locale, so it is set here.
   */
  return (
    <div lang={locale} className="avsar-root">
      {children}
    </div>
  );
}
