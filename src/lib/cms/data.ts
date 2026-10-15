import { cache } from 'react';
import { getAnonSupabase } from '@/lib/supabase/anon';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Block } from './blocks';
import { DEFAULT_PAGES, defaultPage } from './defaults';
import { sanitizeBlocks, sanitizeSeo, type PageSeo } from './sanitize';
import { isLocale, locales, type Locale } from '@/lib/i18n/path';
import { localizePage } from './localize';
import { mergeSettings, type SiteSettings, DEFAULT_SETTINGS } from './settings';

/**
 * Reading CMS content.
 *
 * Resolution order for a public page, most specific first:
 *   1. the published copy in the visitor's locale
 *   2. the translation of the default content that ships in code
 *   3. the published English copy
 *   4. the English default
 *
 * A page is never empty. Resetting a language deletes its stored row and the
 * site falls back to the translation that ships with that language.
 */

export type ResolvedPage = {
  slug: string;
  locale: string;
  title: string;
  blocks: Block[];
  seo: PageSeo;
  source: 'published' | 'published-fallback-en' | 'default' | 'draft';
};

function fromDefault(slug: string, locale: string): ResolvedPage | null {
  const page = defaultPage(slug);
  if (!page) return null;
  const localized = isLocale(locale) ? localizePage(page, locale) : page;
  return {
    slug,
    locale,
    title: localized.title,
    blocks: localized.blocks,
    seo: { title: localized.seo.title, description: localized.seo.description, ogImage: '', noindex: false },
    source: 'default',
  };
}

export const getPublishedPage = cache(async (slug: string, locale: string): Promise<ResolvedPage | null> => {
  if (!isSupabaseConfigured()) return fromDefault(slug, locale);

  const supabase = getAnonSupabase();
  const { data, error } = (await supabase
    ?.from('cms_public_pages')
    .select('slug, locale, title, blocks, seo')
    .eq('slug', slug)
    .in('locale', locale === 'en' ? ['en'] : [locale, 'en'])) ?? { data: null, error: null };

  if (error) console.error('[cms] published read failed', slug, error);

  const rows = (data ?? []) as { slug: string; locale: string; title: string; blocks: unknown; seo: unknown }[];
  const own = rows.find((r) => r.locale === locale);
  /* No published copy in this language: use the translation that ships in
     code, rather than a later English edit the visitor cannot read. */
  if (!own && locale !== 'en') return fromDefault(slug, locale);
  const row = own ?? rows.find((r) => r.locale === 'en');
  if (!row) return fromDefault(slug, locale);

  const fallback = defaultPage(slug);
  const seo = sanitizeSeo(row.seo);
  return {
    slug,
    locale: row.locale,
    title: row.title,
    blocks: sanitizeBlocks(row.blocks),
    seo: {
      ...seo,
      title: seo.title || fallback?.seo.title || row.title,
      description: seo.description || fallback?.seo.description || '',
    },
    source: row.locale === locale ? 'published' : 'published-fallback-en',
  };
});

/** The working draft, for the editor and for preview. Service role: caller checks cms.view. */
export async function getDraftPage(slug: string, locale: string): Promise<(ResolvedPage & { stored: boolean; publishedAt: string | null; updatedAt: string | null; hasUnpublishedChanges: boolean }) | null> {
  const fallback = fromDefault(slug, locale);
  if (!isSupabaseConfigured()) {
    return fallback ? { ...fallback, stored: false, publishedAt: null, updatedAt: null, hasUnpublishedChanges: false } : null;
  }

  const admin = getAdminSupabase();
  const { data } = (await admin
    ?.from('cms_pages')
    .select('slug, locale, title, blocks, seo, published_blocks, published_at, updated_at')
    .eq('slug', slug)
    .eq('locale', locale)
    .maybeSingle()) ?? { data: null };

  if (!data) {
    /* Not stored yet. Open the editor on the translation that already ships,
       so a Malayalam editor is correcting Malayalam rather than starting from
       a blank English page. */
    return fallback ? { ...fallback, stored: false, publishedAt: null, updatedAt: null, hasUnpublishedChanges: false } : null;
  }

  const row = data as Record<string, unknown>;
  return {
    slug,
    locale,
    title: String(row.title),
    blocks: sanitizeBlocks(row.blocks),
    seo: sanitizeSeo(row.seo),
    source: 'draft',
    stored: true,
    publishedAt: (row.published_at as string | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
    hasUnpublishedChanges: JSON.stringify(row.blocks) !== JSON.stringify(row.published_blocks),
  };
}

export type PageListEntry = {
  slug: string;
  path: string;
  title: string;
  purpose: string;
  locales: { locale: Locale; stored: boolean; publishedAt: string | null; updatedAt: string | null; dirty: boolean }[];
};

/** Every page the CMS knows about, with what is stored for each locale. */
export async function listPagesForConsole(): Promise<PageListEntry[]> {
  const stored = new Map<string, { locale: string; publishedAt: string | null; updatedAt: string | null; dirty: boolean }[]>();

  if (isSupabaseConfigured()) {
    const admin = getAdminSupabase();
    const { data } = (await admin
      ?.from('cms_pages')
      .select('slug, locale, published_at, updated_at, blocks, published_blocks')) ?? { data: null };
    for (const raw of data ?? []) {
      const row = raw as Record<string, unknown>;
      const list = stored.get(String(row.slug)) ?? [];
      list.push({
        locale: String(row.locale),
        publishedAt: (row.published_at as string | null) ?? null,
        updatedAt: (row.updated_at as string | null) ?? null,
        dirty: JSON.stringify(row.blocks) !== JSON.stringify(row.published_blocks),
      });
      stored.set(String(row.slug), list);
    }
  }

  return DEFAULT_PAGES.map((page) => {
    const rows = stored.get(page.slug) ?? [];
    return {
      slug: page.slug,
      path: page.path,
      title: page.title,
      purpose: page.purpose,
      locales: locales.map((locale) => {
        const row = rows.find((r) => r.locale === locale);
        return row
          ? { locale, stored: true, publishedAt: row.publishedAt, updatedAt: row.updatedAt, dirty: row.dirty }
          : { locale, stored: false, publishedAt: null, updatedAt: null, dirty: false };
      }),
    };
  });
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  const supabase = getAnonSupabase();
  const { data, error } = (await supabase?.from('site_settings').select('key, value')) ?? { data: null, error: null };
  if (error) console.error('[cms] settings read failed', error);
  return mergeSettings((data ?? []) as { key: string; value: unknown }[]);
});

export type MediaItem = {
  id: string;
  kind: 'image' | 'video' | 'document';
  url: string;
  fileName: string;
  mimeType: string;
  bytes: number;
  alt: string;
  title: string;
  createdAt: string;
};

/** Files already in the repository, offered in the media picker alongside uploads. */
export const BUILT_IN_MEDIA: MediaItem[] = [
  '/lisbon-rooftops-1200.jpg',
  '/kitchen-work-1400.jpg',
  '/kitchen-work-2400.jpg',
  '/dubai-skyline-1200.jpg',
  '/walkthrough/register.jpg',
  '/walkthrough/assessment.jpg',
  '/walkthrough/call.jpg',
  '/walkthrough/letter.jpg',
  '/walkthrough/documents.jpg',
  '/walkthrough/fee.jpg',
  '/video/hero-poster.jpg',
  '/video/intro-poster.jpg',
  ...['chef', 'fb-service', 'cleaner', 'property-manager', 'driver', 'logistics', 'construction-worker', 'electrician', 'plumber', 'welder', 'data-analyst', 'qa-tester'].map(
    (slug) => `/positions/${slug}-840.jpg`,
  ),
  '/video/hero-loop.mp4',
  '/video/intro.mp4',
].map((url) => ({
  id: `builtin:${url}`,
  kind: url.endsWith('.mp4') ? ('video' as const) : ('image' as const),
  url,
  fileName: url.split('/').pop() ?? url,
  mimeType: url.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
  bytes: 0,
  alt: '',
  title: url.split('/').pop() ?? url,
  createdAt: '2026-10-01T00:00:00Z',
}));

export async function listMedia(kind?: 'image' | 'video' | 'document'): Promise<MediaItem[]> {
  const builtIn = BUILT_IN_MEDIA.filter((item) => !kind || item.kind === kind);
  if (!isSupabaseConfigured()) return builtIn;
  const admin = getAdminSupabase();
  let query = admin?.from('cms_media').select('*').order('created_at', { ascending: false }).limit(500);
  if (query && kind) query = query.eq('kind', kind);
  const { data } = (await query) ?? { data: null };
  const uploaded = (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: String(row.id),
      kind: row.kind as MediaItem['kind'],
      url: String(row.url),
      fileName: String(row.file_name),
      mimeType: String(row.mime_type),
      bytes: Number(row.bytes ?? 0),
      alt: String(row.alt ?? ''),
      title: String(row.title ?? ''),
      createdAt: String(row.created_at),
    };
  });
  return [...uploaded, ...builtIn];
}
