import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CmsPageView, cmsMetadata } from '@/components/cms/CmsPageView';
import { getPublishedPage } from '@/lib/cms/data';
import { isLocale, localePath } from '@/lib/i18n';

/**
 * The home page, rendered from the CMS.
 *
 * Until an admin publishes the "home" page in the console, this renders the
 * default content in src/lib/cms/defaults/home.ts. The previous hand-built
 * landing page lives at /[locale]/classic for reference.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return cmsMetadata(await getPublishedPage('home', locale), localePath(locale, '/'));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const page = await getPublishedPage('home', locale);
  if (!page) notFound();
  return <CmsPageView page={page} locale={locale} />;
}
