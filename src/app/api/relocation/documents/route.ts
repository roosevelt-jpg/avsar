import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { notifyStaff } from '@/lib/notifications/staff';
import { DOCUMENT_KINDS, DOCUMENT_LABELS, DOCUMENT_MAX_BYTES, DOCUMENT_TYPES, type DocumentKind } from '@/lib/relocation/documents';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EXTENSION: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/* The declared type is the browser's guess from the file name. The first bytes
   are what the file is; a renamed executable does not start like a PDF. */
function looksLike(type: string, bytes: Buffer): boolean {
  const hex = bytes.subarray(0, 12).toString('hex');
  if (type === 'application/pdf') return hex.startsWith('25504446');
  if (type === 'image/jpeg') return hex.startsWith('ffd8ff');
  if (type === 'image/png') return hex.startsWith('89504e47');
  if (type === 'image/webp') return hex.startsWith('52494646') && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

/**
 * A document for the visa file.
 *
 * Stored in a private bucket under the candidate's own folder, a path built
 * from the session. A new upload of the same kind supersedes the previous one
 * rather than deleting it, so a recruiter can see what was replaced and why.
 * Staff are told there is something to check.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'demo_mode', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const kind = String(form?.get('kind') ?? '');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (!(DOCUMENT_KINDS as readonly string[]).includes(kind)) return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  if (file.size === 0 || file.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  if (!DOCUMENT_TYPES.has(file.type)) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!looksLike(file.type, bytes)) return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });

  const path = `${candidate.id}/${randomUUID()}.${EXTENSION[file.type]}`;
  const upload = await admin.storage.from('relocation-docs').upload(path, bytes, { contentType: file.type, upsert: false });
  if (upload.error) return NextResponse.json({ error: 'upload_failed' }, { status: 500 });

  await admin
    .from('relocation_documents')
    .update({ superseded_at: new Date().toISOString() })
    .eq('candidate_id', candidate.id)
    .eq('kind', kind)
    .is('superseded_at', null);

  const { data, error } = await admin
    .from('relocation_documents')
    .insert({
      candidate_id: candidate.id,
      kind,
      storage_path: path,
      file_name: file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 200) || `document.${EXTENSION[file.type]}`,
      mime_type: file.type,
      byte_size: file.size,
    })
    .select('id')
    .single();
  if (error || !data) {
    await admin.storage.from('relocation-docs').remove([path]);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await notifyStaff({
    permission: 'relocation.manage',
    kind: 'relocation.document',
    title: `Document to check: ${DOCUMENT_LABELS[kind as DocumentKind]}`,
    body: candidate.fullName,
    href: '/admin/relocation',
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}
