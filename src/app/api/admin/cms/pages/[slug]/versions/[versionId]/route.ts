import { NextResponse } from 'next/server';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

/**
 * Restores a version into the draft. It does not publish: the person
 * restoring looks at the result first, then publishes deliberately.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string; versionId: string }> }) {
  const { slug, versionId } = await params;
  const id = Number(versionId);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const guard = await apiPermission('cms.publish');
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: version } = await admin
    .from('cms_page_versions')
    .select('page_id, blocks, seo, cms_pages!inner (slug)')
    .eq('id', id)
    .maybeSingle();

  const page = version ? ((Array.isArray(version.cms_pages) ? version.cms_pages[0] : version.cms_pages) as { slug?: string } | null) : null;
  if (!version || page?.slug !== slug) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { error } = await admin
    .from('cms_pages')
    .update({ blocks: version.blocks, seo: version.seo, updated_by: guard.userId })
    .eq('id', version.page_id);
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  await audit(guard.userId, 'cms.restore', `page:${slug}`, { version: id });
  return NextResponse.json({ ok: true });
}
