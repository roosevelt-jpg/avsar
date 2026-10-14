import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiAnyPermission, apiPermission, demoWriteRefusal } from '@/lib/rbac/server';
import { listMedia } from '@/lib/cms/data';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';
import { MEDIA_BUCKET, MEDIA_TYPES } from '@/lib/cms/media';

export const runtime = 'nodejs';

/** The media library, for the picker in every editor. */
export async function GET(request: Request) {
  const guard = await apiAnyPermission(['media.manage', 'cms.edit', 'jobs.edit']);
  if (guard instanceof NextResponse) return guard;
  const kind = new URL(request.url).searchParams.get('kind');
  const items = await listMedia(kind === 'image' || kind === 'video' || kind === 'document' ? kind : undefined);
  return NextResponse.json({ items });
}

const confirmSchema = z.object({
  path: z.string().regex(/^uploads\/\d{4}\/\d{2}\/[0-9a-f-]{36}-[a-z0-9._-]{1,120}$/),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().max(100),
  bytes: z.number().int().min(0).max(200 * 1024 * 1024),
  width: z.number().int().min(0).max(20000).nullable().optional(),
  height: z.number().int().min(0).max(20000).nullable().optional(),
  alt: z.string().trim().max(300).default(''),
});

/**
 * Records an upload that the browser has already sent straight to storage
 * (see ./sign). Uploading through this function would hit the platform's
 * request-body limit long before a video's size.
 */
export async function POST(request: Request) {
  const guard = await apiPermission('media.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const parsed = confirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: publicUrl } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(parsed.data.path);
  const type = MEDIA_TYPES[parsed.data.mimeType];
  if (!type) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  const kind = type.kind;

  const { data, error } = await admin
    .from('cms_media')
    .insert({
      kind,
      storage_path: parsed.data.path,
      url: publicUrl.publicUrl,
      file_name: parsed.data.fileName,
      mime_type: parsed.data.mimeType,
      bytes: parsed.data.bytes,
      width: parsed.data.width ?? null,
      height: parsed.data.height ?? null,
      alt: parsed.data.alt,
      title: parsed.data.fileName,
      created_by: guard.userId,
    })
    .select('id, url')
    .single();

  if (error) {
    console.error('[media] record failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }
  await audit(guard.userId, 'media.upload', `media:${data.id}`, { path: parsed.data.path });
  return NextResponse.json({ id: data.id, url: data.url, kind });
}
