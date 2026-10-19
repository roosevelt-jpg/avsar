import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z.object({ decision: z.enum(['approved', 'rejected']) }).strict();

/**
 * Publish or decline a candidate's story. Staff can approve or decline, never
 * edit: what appears on the site is the candidate's own words or nothing.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('relocation.manage');
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('success_stories')
    .update({ status: parsed.data.decision, reviewed_by: guard.userId, reviewed_at: now, published_at: parsed.data.decision === 'approved' ? now : null })
    .eq('id', id)
    .eq('status', 'submitted')
    .select('candidate_id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found_or_decided' }, { status: 404 });

  await audit(guard.userId, `story.${parsed.data.decision}`, `candidate:${String(data.candidate_id)}`, { story: id });
  return NextResponse.json({ status: parsed.data.decision });
}
