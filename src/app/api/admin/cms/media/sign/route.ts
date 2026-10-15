import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { MEDIA_BUCKET, MEDIA_TYPES, safeFileName } from '@/lib/cms/media';
import { rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().max(100),
  bytes: z.number().int().min(1),
});

/**
 * Step one of an upload: a one-time URL the browser can send the file to
 * directly. The type and size are checked here, before any bytes move.
 */
export async function POST(request: Request) {
  const guard = await apiPermission('media.manage');
  if (guard instanceof NextResponse) return guard;

  const limited = await rateLimit(RATE_LIMITS.mediaSign, guard.userId);
  if (!limited.ok) return rateLimitedResponse(limited);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const type = MEDIA_TYPES[parsed.data.mimeType];
  if (!type) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  if (parsed.data.bytes > type.maxBytes) {
    return NextResponse.json({ error: 'too_large', maxBytes: type.maxBytes }, { status: 413 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const now = new Date();
  const path = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}-${safeFileName(parsed.data.fileName)}`;

  const { data, error } = await admin.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error('[media] sign failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }
  return NextResponse.json({ path: data.path, token: data.token, bucket: MEDIA_BUCKET });
}
