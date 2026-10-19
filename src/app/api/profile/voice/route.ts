import { NextResponse } from 'next/server';
import { getSessionCandidate } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Forty-five seconds of opus is around 150KB. This is room, not a target. */
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_SECONDS = 90;

/**
 * Android records `audio/webm;codecs=opus`, iOS Safari records `audio/mp4`.
 * Both are accepted because both are what the phones in this audience produce,
 * and the browser is not asked to transcode.
 */
const ACCEPTED = /^audio\/(webm|mp4|ogg|mpeg|aac|x-m4a)(;.*)?$/;

/** Saves the candidate's voice introduction, replacing any previous one. */
export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const file = form.get('audio');
  const seconds = Number(form.get('seconds'));

  if (!(file instanceof File)) return NextResponse.json({ error: 'no_audio' }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: 'empty' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
  if (!ACCEPTED.test(file.type)) {
    return NextResponse.json({ error: 'unsupported_type', type: file.type }, { status: 415 });
  }
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > MAX_SECONDS) {
    return NextResponse.json({ error: 'bad_duration' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.type.includes('mp4') || file.type.includes('m4a') ? 'm4a' : 'webm';

  /* Built from the session. The first segment is the authorisation boundary in
     the bucket policy, so it must never come from the browser. */
  const path = `${candidate.id}/intro-${Date.now()}.${extension}`;

  const upload = await supabase.storage
    .from('voice-intros')
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (upload.error) {
    console.error('[voice] upload failed', upload.error);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }

  /* Read the old path before overwriting the row, so the replaced object can be
     removed rather than left paying rent in the bucket for ever. */
  const { data: previous } = await supabase
    .from('candidate_voice_intros')
    .select('storage_path')
    .eq('candidate_id', candidate.id)
    .maybeSingle();

  const { error } = await supabase.from('candidate_voice_intros').upsert(
    {
      candidate_id: candidate.id,
      storage_path: path,
      mime_type: file.type,
      duration_seconds: Math.round(seconds),
      bytes: bytes.length,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'candidate_id' },
  );

  if (error) {
    /* The row is the record. An orphaned object is tidier to live with than a
       row pointing at a file that is not there. */
    await supabase.storage.from('voice-intros').remove([path]);
    console.error('[voice] row upsert failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const old = previous?.storage_path as string | undefined;
  if (old && old !== path) await supabase.storage.from('voice-intros').remove([old]);

  return NextResponse.json({ saved: true, seconds: Math.round(seconds) });
}

/** Removes it. Theirs to take back. */
export async function DELETE() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: existing } = await supabase
    .from('candidate_voice_intros')
    .select('storage_path')
    .eq('candidate_id', candidate.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ deleted: false });

  const { error } = await supabase
    .from('candidate_voice_intros')
    .delete()
    .eq('candidate_id', candidate.id);

  if (error) {
    console.error('[voice] delete failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await supabase.storage.from('voice-intros').remove([existing.storage_path as string]);
  return NextResponse.json({ deleted: true });
}
