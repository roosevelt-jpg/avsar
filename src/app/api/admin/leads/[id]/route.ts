import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { LEAD_STATUSES } from '@/lib/leads/types';
import { apiPermission, demoWriteRefusal } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    /** Only ever "me" or nobody: who picked it up comes from the session. */
    assign: z.enum(['me', 'nobody']).optional(),
  })
  .strict();

/** Move a lead along, or take it. History first, then the state. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('leads.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.status && !parsed.data.assign)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: lead } = await admin.from('leads').select('id, status').eq('id', id).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (parsed.data.status && parsed.data.status !== lead.status) {
    const { error } = await admin.from('lead_events').insert({
      lead_id: id,
      kind: 'status',
      from_status: lead.status,
      to_status: parsed.data.status,
      actor: guard.userId,
    });
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    update.status = parsed.data.status;
  }
  if (parsed.data.assign) update.assigned_to = parsed.data.assign === 'me' ? guard.userId : null;

  if (Object.keys(update).length > 0) {
    const { error } = await admin.from('leads').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    await audit(guard.userId, 'lead.update', `lead:${id}`, update);
  }
  return NextResponse.json({ status: 'saved' });
}
