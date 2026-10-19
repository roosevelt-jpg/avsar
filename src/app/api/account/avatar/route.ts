import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { rateLimit, rateLimitedResponse, RATE_LIMITS } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Console users only: the profile image is shown in the console header. */
async function consoleUserId(): Promise<string | null> {
  const viewer = await getViewer();
  if (viewer.role === 'staff') return viewer.staff.userId;
  if (viewer.role === 'employer') return viewer.employer.userId;
  return null;
}

/**
 * Replaces the signed-in user's profile image.
 *
 * The user id comes from the session, never the form, and the service role is
 * used only after that check. The URL is kept in the auth user's metadata, so
 * every header can read it without another query.
 */
export async function POST(request: Request) {
  const userId = await consoleUserId();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const limited = await rateLimit(RATE_LIMITS.avatar, userId);
  if (!limited.ok) return rateLimitedResponse(limited);

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large', maxBytes: MAX_BYTES }, { status: 413 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  /* A new name on every upload, so browsers and the CDN never show the old face. */
  const path = `${userId}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error('[avatar] upload failed', uploadError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const { data: user } = await admin.auth.admin.getUserById(userId);
  const previous = (user.user?.user_metadata?.avatar_path as string | undefined) ?? null;
  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...user.user?.user_metadata, avatar_url: url, avatar_path: path },
  });
  if (updateError) {
    console.error('[avatar] metadata update failed', updateError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  if (previous && previous.startsWith(`${userId}/`)) {
    await admin.storage.from(BUCKET).remove([previous]);
  }
  return NextResponse.json({ url });
}

/** Removes the profile image; the header falls back to initials. */
export async function DELETE() {
  const userId = await consoleUserId();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { data: user } = await admin.auth.admin.getUserById(userId);
  const meta = { ...user.user?.user_metadata };
  const previous = meta.avatar_path as string | undefined;
  delete meta.avatar_url;
  delete meta.avatar_path;

  const { error } = await admin.auth.admin.updateUserById(userId, { user_metadata: meta });
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  if (previous && previous.startsWith(`${userId}/`)) await admin.storage.from(BUCKET).remove([previous]);
  return NextResponse.json({ ok: true });
}
