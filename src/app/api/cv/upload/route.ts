import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getSessionCandidate } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

/**
 * Receives a CV.
 *
 * The storage path is built from the session, never from the filename the
 * browser sends: the path is the authorisation boundary in the bucket policies,
 * so letting the client influence it would hand it the ability to write into
 * someone else's folder.
 *
 * Assessment is not triggered here. Reading a CV with a model costs real money
 * per document, and a candidate who uploads the wrong file four times should not
 * be four assessments. Staff or a worker starts it from `/api/cv/assess`.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  const admin = getAdminSupabase();
  if (!supabase || !admin) {
    return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });
  }

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no_file' }, { status: 400 });

  if (file.size === 0) return NextResponse.json({ error: 'empty_file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const documentHash = crypto.createHash('sha256').update(bytes).digest('hex');

  const extension = file.type === 'application/pdf' ? 'pdf' : file.name.split('.').pop() || 'bin';
  const path = `${candidate.id}/${Date.now()}.${extension}`;

  const upload = await supabase.storage
    .from('cvs')
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (upload.error) {
    console.error('[cv/upload] storage failed', upload.error);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }

  const { data, error } = await admin
    .from('cv_documents')
    .insert({
      candidate_id: candidate.id,
      storage_path: path,
      mime_type: file.type,
      byte_size: file.size,
      document_hash: documentHash,
      state: 'uploaded',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[cv/upload] record failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  return NextResponse.json({ documentId: data.id, bytes: file.size });
}
