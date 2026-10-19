import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { DEFAULT_PAGES } from '@/lib/cms/defaults';
import { sanitizeBlocks, sanitizeSeo } from '@/lib/cms/sanitize';
import { DEFAULT_SETTINGS, SETTINGS_KEYS } from '@/lib/cms/settings';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * Loads the starter content into the database: every settings section and
 * every page (English, published), each only where nothing is stored yet.
 *
 * After this the site runs from database rows that staff edit, rather than
 * from the defaults in code. Existing rows are never touched, so pressing it
 * twice, or after editing, changes nothing that was already saved.
 */
export async function POST() {
  const guard = await apiPermission('company.manage');
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const now = new Date().toISOString();

  const settings = SETTINGS_KEYS.map((key) => ({ key, value: DEFAULT_SETTINGS[key], updated_by: guard.userId, updated_at: now }));
  const { data: insertedSettings, error: settingsError } = await admin
    .from('site_settings')
    .upsert(settings, { onConflict: 'key', ignoreDuplicates: true })
    .select('key');
  if (settingsError) return NextResponse.json({ error: 'settings_failed' }, { status: 500 });

  const pages = DEFAULT_PAGES.map((page) => {
    const blocks = sanitizeBlocks(page.blocks);
    const seo = sanitizeSeo(page.seo);
    return {
      slug: page.slug,
      locale: 'en',
      title: page.title,
      blocks,
      seo,
      published_blocks: blocks,
      published_seo: seo,
      published_at: now,
      published_by: guard.userId,
      updated_by: guard.userId,
    };
  });
  const { data: insertedPages, error: pagesError } = await admin
    .from('cms_pages')
    .upsert(pages, { onConflict: 'slug,locale', ignoreDuplicates: true })
    .select('slug');
  if (pagesError) return NextResponse.json({ error: 'pages_failed' }, { status: 500 });

  const result = { settings: insertedSettings?.length ?? 0, pages: insertedPages?.length ?? 0 };
  await audit(guard.userId, 'setup.starter_content', 'site', result);
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, ...result });
}
