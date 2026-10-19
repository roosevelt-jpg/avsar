import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { apiPermission } from '@/lib/rbac/server';
import { MILESTONE_STATUSES } from '@/lib/relocation/milestones';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z
  .object({
    status: z.enum(MILESTONE_STATUSES).optional(),
    dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    /** Shown to the candidate and their family, so it is written for them. */
    blocker: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

/** Move one step: its status, its expected date, or what it is waiting for. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('relocation.manage');
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(id).success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const body = parsed.data;
  const update: Record<string, unknown> = { updated_by: guard.userId };
  if (body.status) {
    update.status = body.status;
    update.done_at = body.status === 'done' ? new Date().toISOString() : null;
    /* A step that is no longer blocked should not keep showing the old reason. */
    if (body.status !== 'blocked' && body.blocker === undefined) update.blocker = null;
  }
  if (body.dueOn !== undefined) update.due_on = body.dueOn;
  if (body.blocker !== undefined) update.blocker = body.blocker || null;

  const { data, error } = await admin.from('relocation_milestones').update(update).eq('id', id).select('application_id, key').maybeSingle();
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await audit(guard.userId, 'relocation.milestone_update', `application:${String(data.application_id)}`, { step: data.key, ...body });
  return NextResponse.json({ status: 'saved' });
}
