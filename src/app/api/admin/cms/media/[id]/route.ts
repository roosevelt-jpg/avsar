import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { MEDIA_BUCKET } from '@/lib/cms/media';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const patchSchema = z.object({
  alt: z.string().trim().max(300).optional(),
  title: z.string().trim().max(200).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await apiPermission('media.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const { error } = (await admin?.from('cms_media').update(parsed.data).eq('id', id)) ?? { error: null };
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  return NextResponse.json({ updated: true });
}

/**
 * Deletes the file and its record. Pages that still point at the URL will
 * show a broken image, so the library screen warns before calling this.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await apiPermission('media.manage');
  if (guard instanceof NextResponse) return guard;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: row } = await admin.from('cms_media').select('storage_path').eq('id', id).maybeSingle();
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { error: storageError } = await admin.storage.from(MEDIA_BUCKET).remove([String(row.storage_path)]);
  if (storageError) console.error('[media] storage remove failed', storageError);

  const { error } = await admin.from('cms_media').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });

  await audit(guard.userId, 'media.delete', `media:${id}`, { path: row.storage_path });
  return NextResponse.json({ deleted: true });
}
