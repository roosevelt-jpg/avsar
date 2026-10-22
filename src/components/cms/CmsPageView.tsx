import type { Metadata } from 'next';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import type { ResolvedPage } from '@/lib/cms/data';
import { getSiteSettings } from '@/lib/cms/data';
import type { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import { FamilyShare } from '@/components/candidate/FamilyShare';
import { publicOrigin } from '@/lib/http/origin';
import { localePath } from '@/lib/i18n';
import { BlockRenderer } from './BlockRenderer';

/** A whole CMS page: header and rendered blocks. The footer comes from the locale layout. */
export async function CmsPageView({
  page,
  locale,
  banner,
  notice,
}: {
  page: ResolvedPage;
  locale: Locale;
  /** Shown above everything, e.g. "Preview of an unpublished draft". */
  banner?: React.ReactNode;
  /** Shown under the header, e.g. a signed-in candidate's document downloads. */
  notice?: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <>
      {banner}
      <SiteHeader locale={locale} />
      <main>
        {notice}
        <BlockRenderer blocks={page.blocks} locale={locale} settings={settings} />
        {page.slug === 'for-your-family' ? (
          <section id="send" className="px-[clamp(20px,4cqi,56px)] pb-[clamp(48px,8cqi,96px)]">
            <div className="mx-auto w-full max-w-[720px]">
              <FamilyShare
                locale={locale}
                voiceUrl={settings.general.familyVoiceUrl}
                shareUrl={`${await publicOrigin()}${localePath(locale, '/for-your-family')}`}
              />
            </div>
          </section>
        ) : null}
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
