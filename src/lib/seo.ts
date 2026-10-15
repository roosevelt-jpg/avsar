import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/cms/data';
import { STATIC_SEO_PAGES, type StaticSeoPage } from '@/lib/cms/settings';
import { applyTokens, tokenValues } from '@/lib/cms/tokens';
import { languageAlternates, localePath } from '@/lib/i18n';

/** The Open Graph locale for each site language. */
const OG_LOCALE: Record<string, string> = {
  en: 'en_IN',
  hi: 'hi_IN',
  ar: 'ar_AE',
  bn: 'bn_IN',
  mr: 'mr_IN',
  te: 'te_IN',
  ta: 'ta_IN',
  ur: 'ur_IN',
  gu: 'gu_IN',
  kn: 'kn_IN',
  or: 'or_IN',
  ml: 'ml_IN',
  pa: 'pa_IN',
  as: 'as_IN',
};

export type SeoInput = {
  title: string;
  description?: string;
  /** What a shared link shows, when it should differ from the search result. */
  ogTitle?: string;
  ogDescription?: string;
  image?: string;
  imageAlt?: string;
  /** The page's own path, with its locale prefix, e.g. /hi/jobs. */
  path: string;
  locale?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  /** Off for pages that exist in one language only, such as a job. */
  alternates?: boolean;
};

/**
 * Title, description, canonical, language alternates, Open Graph and Twitter
 * card for one page, with the site defaults from Settings › Search & sharing
 * filling any gap.
 *
 * Every public page goes through here, so a link shared on WhatsApp always
 * shows a title, a description and an image, and placeholders such as
 * {{brand}} typed into an SEO field are filled like they are in page text.
 */
export async function pageMetadata(input: SeoInput): Promise<Metadata> {
  const settings = await getSiteSettings();
  const values = tokenValues(settings);
  const fill = (text: string | undefined) => (text ? applyTokens(text, values).trim() : '');

  const title = fill(input.title) || settings.seo.defaultTitle;
  const description = fill(input.description) || settings.seo.defaultDescription;
  const ogTitle = fill(input.ogTitle) || title;
  const ogDescription = fill(input.ogDescription) || description;
  const image = input.image || settings.seo.ogImage;
  const images = image ? [{ url: image, width: 1200, height: 630, alt: input.imageAlt || ogTitle }] : undefined;

  return {
    /* The site default already names the brand, so it skips the "· Brand" template. */
    title: fill(input.title) ? title : { absolute: title },
    description,
    alternates: input.alternates === false ? { canonical: input.path } : languageAlternates(input.path),
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: input.type ?? 'website',
      siteName: settings.general.siteName,
      title: ogTitle,
      description: ogDescription,
      url: input.path,
      locale: OG_LOCALE[input.locale ?? 'en'] ?? 'en_IN',
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      images: images?.map((item) => item.url),
    },
  };
}

/** A page built in code, with its search and share text from Settings › Search & sharing. */
export async function staticPageMetadata(key: StaticSeoPage, locale: string): Promise<Metadata> {
  const settings = await getSiteSettings();
  const page = settings.seo.pages[key];
  const path = STATIC_SEO_PAGES.find((item) => item.key === key)?.path ?? '/';
  return pageMetadata({
    title: page.title,
    description: page.description,
    ogTitle: page.ogTitle,
    image: page.ogImage,
    path: key === 'employers' ? path : localePath(locale, path),
    locale,
    alternates: key !== 'employers',
  });
}

/** For signed-in areas: a title, and nothing a search engine should index. */
export function privateMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}
