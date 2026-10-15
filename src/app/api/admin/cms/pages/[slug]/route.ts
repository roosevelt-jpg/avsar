import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission, demoWriteRefusal } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { defaultPage } from '@/lib/cms/defaults';
import { sanitizeBlocks, sanitizeSeo } from '@/lib/cms/sanitize';
import { audit } from '@/lib/audit';
import { locales } from '@/lib/i18n/path';

export const runtime = 'nodejs';

const putSchema = z.object({
  locale: z.enum(locales),
  title: z.string().trim().min(1).max(120),
  blocks: z.array(z.unknown()).max(60),
  seo: z.unknown(),
  action: z.enum(['save', 'publish', 'unpublish']),
  note: z.string().trim().max(200).optional(),
});

/**
 * Saves, publishes or unpublishes one page in one language.
 *
 * Saving needs cms.edit; publishing and unpublishing need cms.publish, which is
 * how "editors draft, managers publish" is enforced. Every save and publish
 * leaves a version behind.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!defaultPage(slug)) return NextResponse.json({ error: 'unknown_page' }, { status: 404 });

  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const { locale, action } = parsed.data;

  const guard = await apiPermission(action === 'save' ? 'cms.edit' : 'cms.publish');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const blocks = sanitizeBlocks(parsed.data.blocks);
  const seo = sanitizeSeo(parsed.data.seo);
  const now = new Date().toISOString();

  const row: Record<string, unknown> = {
    slug,
    locale,
    title: parsed.data.title,
    blocks,
    seo,
    updated_by: guard.userId,
  };
  if (action === 'publish') {
    Object.assign(row, { published_blocks: blocks, published_seo: seo, published_at: now, published_by: guard.userId });
  }
  if (action === 'unpublish') {
    Object.assign(row, { published_blocks: null, published_seo: null, published_at: null, published_by: null });
  }

  const { data: page, error } = await admin.from('cms_pages').upsert(row, { onConflict: 'slug,locale' }).select('id').single();
  if (error || !page) {
    console.error('[cms] save failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  if (action !== 'unpublish') {
    const { error: versionError } = await admin.from('cms_page_versions').insert({
      page_id: page.id,
      blocks,
      seo,
      kind: action === 'publish' ? 'published' : 'draft',
      note: parsed.data.note ?? null,
      created_by: guard.userId,
    });
    if (versionError) console.error('[cms] version insert failed', versionError);
  }

  await audit(guard.userId, `cms.${action}`, `page:${slug}:${locale}`, { blocks: blocks.length });

  /* The public pages read through cached server components; drop the cache so
     a publish is visible on the next request rather than after a deploy. */
  if (action !== 'save') revalidatePath('/', 'layout');

  return NextResponse.json({ ok: true, action });
}

/** Reset to default: delete the stored page (and its versions) for one language. */
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!defaultPage(slug)) return NextResponse.json({ error: 'unknown_page' }, { status: 404 });

  const parsed = z.object({ locale: z.enum(locales) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const guard = await apiPermission('cms.publish');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { error } = await admin.from('cms_pages').delete().eq('slug', slug).eq('locale', parsed.data.locale);
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  await audit(guard.userId, 'cms.reset', `page:${slug}:${parsed.data.locale}`);
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true });
}
