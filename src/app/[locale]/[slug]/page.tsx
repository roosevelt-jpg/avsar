import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CmsPageView, cmsMetadata } from '@/components/cms/CmsPageView';
import { getPublishedPage } from '@/lib/cms/data';
import { CMS_ROUTED_SLUGS } from '@/lib/cms/defaults';
import { isLocale, locales, localePath } from '@/lib/i18n';

/**
 * Every CMS content page: /about, /hi/faq, /visa-and-relocation, ...
 *
 * Static routes in this folder (signup, dashboard, jobs, pricing, the legal
 * pages) take precedence over this dynamic segment, so a CMS slug can never
 * shadow them. The slugs that render here are exactly the default pages in
 * src/lib/cms/defaults, which is also the list the console offers.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => CMS_ROUTED_SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !CMS_ROUTED_SLUGS.includes(slug)) return {};
  return cmsMetadata(await getPublishedPage(slug, locale), localePath(locale, `/${slug}`));
}

export default async function CmsPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !CMS_ROUTED_SLUGS.includes(slug)) notFound();
  const page = await getPublishedPage(slug, locale);
  if (!page) notFound();
  return <CmsPageView page={page} locale={locale} />;
}
