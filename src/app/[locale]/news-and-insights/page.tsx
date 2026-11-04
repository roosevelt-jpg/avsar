import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/candidate/SiteHeader';
import { NewsFeed } from '@/components/candidate/NewsFeed';
import { BlockRenderer } from '@/components/cms/BlockRenderer';
import { cmsMetadata } from '@/components/cms/CmsPageView';
import type { Block } from '@/lib/cms/blocks';
import { getPublishedPage, getSiteSettings } from '@/lib/cms/data';
import { defaultPage } from '@/lib/cms/defaults';
import { isLocale, localePath, type Locale } from '@/lib/i18n';
import { listPublishedNewsletters } from '@/lib/newsletter/data';

/**
 * News & Insights: CMS hero / notice / cta shell, plus editions staff send
 * from Email subscribers (Resend). Staff-instruction rich_text is stripped so
 * the feed is the only "latest" section.
 */
export default async function NewsAndInsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const [cms, settings, posts] = await Promise.all([
    getPublishedPage('news-and-insights', locale),
    getSiteSettings(),
    listPublishedNewsletters(),
  ]);

  const fallback = defaultPage('news-and-insights');
  const blocks = ((cms?.blocks ?? fallback?.blocks ?? []) as Block[]).filter(
    (block) => block.type !== 'rich_text',
  );
  const heroIndex = blocks.findIndex((block) => block.type === 'hero');
  const before = heroIndex >= 0 ? blocks.slice(0, heroIndex + 1) : [];
  const after = heroIndex >= 0 ? blocks.slice(heroIndex + 1) : blocks;

  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        {before.length ? <BlockRenderer blocks={before} locale={locale} settings={settings} /> : null}
        <NewsFeed locale={locale} posts={posts} />
        {after.length ? <BlockRenderer blocks={after} locale={locale} settings={settings} /> : null}
      </main>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const page = await getPublishedPage('news-and-insights', raw);
  return cmsMetadata(page, localePath(raw, '/news-and-insights'));
}
