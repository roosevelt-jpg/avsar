import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { logDataAccess } from '@/lib/privacy/log';
import { notifyEmployerOfUnlock } from '@/lib/employer/notify';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z.object({ decision: z.enum(['approved', 'declined']) }).strict();

/**
 * Approve or decline an employer's request to see a candidate's full name.
 * An approval is a disclosure of personal data to a third party, so it goes
 * in the candidate's access log as well as the audit log.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('relocation.manage');
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data, error } = await admin
    .from('profile_unlock_requests')
    .update({ status: parsed.data.decision, decided_by: guard.userId, decided_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('candidate_id, employer_id, application_id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found_or_decided' }, { status: 404 });

  if (parsed.data.decision === 'approved') {
    await logDataAccess(guard.userId, String(data.candidate_id), 'employer.profile_unlock', { employer: data.employer_id, request: id });
  }
  await audit(guard.userId, `unlock.${parsed.data.decision}`, `candidate:${String(data.candidate_id)}`, { employer: data.employer_id, request: id });
  if (data.employer_id) {
    await notifyEmployerOfUnlock({
      employerId: String(data.employer_id),
      decision: parsed.data.decision,
      origin: new URL(request.url).origin,
    });
  }
  return NextResponse.json({ status: parsed.data.decision });
}
