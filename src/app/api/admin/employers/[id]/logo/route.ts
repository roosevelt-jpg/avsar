import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { getViewer } from '@/lib/auth';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const BUCKET = 'employer-logos';
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * The mark shown for one employer on the homepage.
 *
 * Staff with employers.manage can set any company's logo. An employer can
 * set only their own. The service role runs after that check. The path is
 * a new name every time, so a replaced logo is not served from cache.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const guard = await apiPermission('employers.manage');
  let actor: string | null = null;
  if (guard instanceof NextResponse) {
    const viewer = await getViewer();
    if (viewer.role !== 'employer' || viewer.employer.employerId !== id) return guard;
    actor = viewer.employer.userId;
  } else {
    actor = guard.userId;
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { data: existing } = await admin.from('employers').select('id, logo_path').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const path = `${id}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error('[employers] logo upload failed', uploadError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const { error: updateError } = await admin.from('employers').update({ logo_path: path }).eq('id', id);
  if (updateError) {
    console.error('[employers] logo path failed', updateError);
    await admin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const previous = typeof existing.logo_path === 'string' ? existing.logo_path : '';
  if (previous.startsWith(`${id}/`) && previous !== path) {
    await admin.storage.from(BUCKET).remove([previous]);
  }

  await audit(actor, 'employer.logo', `employer:${id}`, {});
  return NextResponse.json({ status: 'saved' });
}
