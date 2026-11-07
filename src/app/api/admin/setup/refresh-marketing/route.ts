import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { DEFAULT_PAGES } from '@/lib/cms/defaults';
import { sanitizeBlocks, sanitizeSeo } from '@/lib/cms/sanitize';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const SLUGS = new Set([
  'home',
  'jobs',
  'how-it-works',
  'why-portugal',
  'visa-and-relocation',
  'about',
  'contact',
  'success-stories',
  'news-and-insights',
  'industries',
  'cookie-policy',
  'faq',
]);

/**
 * Overwrites English published CMS rows for the marketing mockup pages with
 * the latest code defaults (slideshows, films, honest funnel blocks). Staff
 * can still edit afterward. Requires company.manage.
 */
export async function POST() {
  const guard = await apiPermission('company.manage');
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const now = new Date().toISOString();
  const pages = DEFAULT_PAGES.filter((page) => SLUGS.has(page.slug)).map((page) => {
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
      updated_at: now,
    };
  });

  const { data, error } = await admin.from('cms_pages').upsert(pages, { onConflict: 'slug,locale' }).select('slug');
  if (error) return NextResponse.json({ error: 'pages_failed', detail: error.message }, { status: 500 });

  await audit(guard.userId, 'setup.refresh_marketing', 'site', { pages: data?.length ?? 0 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, pages: data?.map((row) => row.slug) ?? [] });
}
