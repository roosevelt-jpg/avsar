import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/** The candidate opens their own document, through a one-minute signed URL. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'demo_mode' }, { status: 503 });

  /* Matched on the session's candidate as well as the id: an id alone is not permission. */
  const { data: doc } = await admin
    .from('relocation_documents')
    .select('storage_path')
    .eq('id', id)
    .eq('candidate_id', candidate.id)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data, error } = await admin.storage.from('relocation-docs').createSignedUrl(String(doc.storage_path), 60);
  if (error || !data) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, 303);
}
