import { getSessionCandidate, getSessionStaff, getSessionEmployer } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * Streams one candidate's voice introduction.
 *
 * Who may hear it is decided here and then confirmed by RLS: the row is read
 * through the request-scoped client, so a caller who should not see it gets
 * nothing back regardless of what this code believes. Only the file itself is
 * then fetched with the service role, because the bucket is private and a
 * signed URL would leak past the end of the session.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  const { candidateId } = await params;

  const supabase = await getServerSupabase();
  const admin = getAdminSupabase();
  if (!supabase || !admin) return new Response('Not available', { status: 503 });

  const [candidate, staff, employer] = await Promise.all([
    getSessionCandidate(),
    getSessionStaff(),
    getSessionEmployer(),
  ]);
  if (!candidate && !staff && !employer) return new Response('Unauthorized', { status: 401 });

  /* A candidate may only ask for their own, and the RLS policy says the same
     thing again underneath. */
  if (candidate && !staff && !employer && candidate.id !== candidateId) {
    return new Response('Not found', { status: 404 });
  }

  const { data: row } = await supabase
    .from('candidate_voice_intros')
    .select('storage_path, mime_type')
    .eq('candidate_id', candidateId)
    .maybeSingle();

  if (!row) return new Response('Not found', { status: 404 });

  const file = await admin.storage.from('voice-intros').download(row.storage_path as string);
  if (file.error || !file.data) {
    console.error('[voice] download failed', file.error?.message);
    return new Response('Not found', { status: 404 });
  }

  return new Response(await file.data.arrayBuffer(), {
    headers: {
      'content-type': row.mime_type as string,
      /* Private, and never by an intermediary: this is a recording of a named
         person that only some viewers are allowed to hear. */
      'cache-control': 'private, max-age=0, no-store',
    },
  });
}
