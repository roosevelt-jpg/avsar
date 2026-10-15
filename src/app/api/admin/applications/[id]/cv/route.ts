import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

/**
 * Downloads the CV attached to an application, through a one-minute signed
 * URL. The bucket is private; this route is the only way staff reach the file,
 * so every download is permission-checked and audited.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const guard = await apiPermission('candidates.view');
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'demo_mode' }, { status: 503 });

  const { data: application } = await admin
    .from('applications')
    .select('cv_document_id, cv_documents (storage_path)')
    .eq('id', id)
    .maybeSingle();
  const doc = application?.cv_documents as { storage_path?: string } | { storage_path?: string }[] | null | undefined;
  const path = (Array.isArray(doc) ? doc[0] : doc)?.storage_path;
  if (!path) return NextResponse.json({ error: 'no_cv' }, { status: 404 });

  const { data, error } = await admin.storage.from('cvs').createSignedUrl(path, 60, { download: true });
  if (error || !data) {
    console.error('[cv] sign failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await audit(guard.userId, 'cv.download', `application:${id}`);
  return NextResponse.redirect(data.signedUrl, 303);
}
