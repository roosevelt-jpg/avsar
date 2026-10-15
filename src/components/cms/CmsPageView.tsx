import type { Metadata } from 'next';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import type { ResolvedPage } from '@/lib/cms/data';
import { getSiteSettings } from '@/lib/cms/data';
import type { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import { BlockRenderer } from './BlockRenderer';

/** A whole CMS page: header and rendered blocks. The footer comes from the locale layout. */
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
    </>
  );
}

export async function cmsMetadata(page: ResolvedPage | null, path: string): Promise<Metadata> {
  if (!page) return {};
  return pageMetadata({
    title: page.seo.title || page.title,
    description: page.seo.description,
    ogTitle: page.seo.ogTitle,
    ogDescription: page.seo.ogDescription,
    image: page.seo.ogImage,
    path,
    locale: page.locale,
    noindex: page.seo.noindex,
  });
}
