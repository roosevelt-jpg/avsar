import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionCandidate } from '@/lib/auth';
import { notifyStaff } from '@/lib/notifications/staff';
import { milestoneTemplate } from '@/lib/relocation/milestones';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z.object({ done: z.literal(true) }).strict();

/**
 * "I have landed", "I have the keys", "first shift done": the arrival steps
 * only the candidate can confirm. Every other step is moved by staff, who can
 * see the paperwork behind it.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!schema.safeParse(await request.json().catch(() => null)).success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const candidate = await getSessionCandidate();
  if (!candidate) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'demo_mode' }, { status: 503 });

  const { data: milestone } = await admin
    .from('relocation_milestones')
    .select('id, key, status, application_id')
    .eq('id', id)
    .eq('candidate_id', candidate.id)
    .maybeSingle();
  if (!milestone) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!milestoneTemplate(String(milestone.key))?.arrival) return NextResponse.json({ error: 'staff_only' }, { status: 403 });
  if (milestone.status === 'done') return NextResponse.json({ status: 'saved' });

  const { error } = await admin.from('relocation_milestones').update({ status: 'done', done_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await notifyStaff({
    permission: 'applications.view',
    kind: 'relocation.arrival',
    title: `${milestoneTemplate(String(milestone.key))?.label}: ${candidate.fullName}`,
    href: `/admin/applications/${milestone.application_id}`,
  });
  return NextResponse.json({ status: 'saved' });
}
