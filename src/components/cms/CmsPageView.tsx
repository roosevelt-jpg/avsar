import type { Metadata } from 'next';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { SiteFooter } from '@/components/candidate/SiteFooter';
import type { ResolvedPage } from '@/lib/cms/data';
import { getSiteSettings } from '@/lib/cms/data';
import { languageAlternates, type Locale } from '@/lib/i18n';
import { BlockRenderer } from './BlockRenderer';

/** A whole CMS page: site chrome around the rendered blocks. */
export async function CmsPageView({
  page,
  locale,
  banner,
}: {
  page: ResolvedPage;
  locale: Locale;
  /** Shown above everything, e.g. "Preview of an unpublished draft". */
  banner?: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <>
      {banner}
      <SiteHeader locale={locale} />
      <main>
        <BlockRenderer blocks={page.blocks} locale={locale} settings={settings} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

export async function cmsMetadata(page: ResolvedPage | null, path: string): Promise<Metadata> {
  if (!page) return {};
  const settings = await getSiteSettings();
  const image = page.seo.ogImage || settings.seo.ogImage;
  return {
    title: page.seo.title || page.title,
    description: page.seo.description || settings.seo.defaultDescription,
    alternates: languageAlternates(path),
    robots: page.seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: page.seo.title || page.title,
      description: page.seo.description || settings.seo.defaultDescription,
      images: image ? [{ url: image }] : undefined,
      type: 'website',
    },
  };
}
