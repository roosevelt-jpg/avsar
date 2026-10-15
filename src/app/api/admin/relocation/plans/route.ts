import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { apiPermission } from '@/lib/rbac/server';
import { planFrom } from '@/lib/relocation/milestones';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z
  .object({
    applicationId: z.string().uuid(),
    /** Day zero of the plan; defaults to today. Every due date is an offset from it. */
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

/** A plan only makes sense once there is a job to move for. */
const PLANNABLE = ['offer', 'hired', 'visa_processing'];

/**
 * Create the relocation plan for an application from the standard steps.
 * Re-running it is safe: steps that already exist are left as they are, so a
 * recruiter who adjusted dates by hand does not lose them.
 */
export async function POST(request: Request) {
  const guard = await apiPermission('relocation.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: application } = await admin.from('applications').select('id, candidate_id, status').eq('id', parsed.data.applicationId).maybeSingle();
  if (!application) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!PLANNABLE.includes(String(application.status))) return NextResponse.json({ error: 'not_at_offer_yet' }, { status: 409 });

  const start = parsed.data.start ?? new Date().toISOString().slice(0, 10);
  const rows = planFrom(start).map((step) => ({ ...step, application_id: application.id, candidate_id: application.candidate_id, updated_by: guard.userId }));
  const { error } = await admin.from('relocation_milestones').upsert(rows, { onConflict: 'application_id,key', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await audit(guard.userId, 'relocation.plan_create', `application:${application.id}`, { start });
  return NextResponse.json({ status: 'created' }, { status: 201 });
}
