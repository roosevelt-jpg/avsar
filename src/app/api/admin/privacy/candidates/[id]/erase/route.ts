import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { eraseCandidate } from '@/lib/privacy/erase';
import { logDataAccess } from '@/lib/privacy/log';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { log } from '@/lib/observability/log';

export const runtime = 'nodejs';

const schema = z
  .object({
    /** Typed by the person pressing the button. Irreversible things take two hands. */
    confirm: z.literal('ERASE'),
    /** The privacy request this answers, closed with a note when it succeeds. */
    leadId: z.string().uuid().optional(),
  })
  .strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const guard = await apiPermission('privacy.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'confirmation_required' }, { status: 400 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  /* Logged before the attempt, so the record exists even if erasure fails halfway. */
  await logDataAccess(guard.userId, id, 'candidate.erase');

  let result;
  try {
    result = await eraseCandidate(admin, id);
  } catch (error) {
    log.error('privacy.erase_failed', { candidateId: id, error });
    return NextResponse.json({ error: 'erase_failed' }, { status: 500 });
  }

  if (result.status === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (result.status === 'blocked') {
    return NextResponse.json({ error: 'active_process', references: result.references }, { status: 409 });
  }

  await audit(guard.userId, 'privacy.erase', `candidate:${id}`, parsed.data.leadId ? { lead: parsed.data.leadId } : undefined);

  if (parsed.data.leadId) {
    const { data: lead } = await admin.from('leads').select('status').eq('id', parsed.data.leadId).maybeSingle();
    if (lead) {
      await admin.from('lead_events').insert([
        { lead_id: parsed.data.leadId, kind: 'note', body: 'Personal data erased.', actor: guard.userId },
        { lead_id: parsed.data.leadId, kind: 'status', from_status: lead.status, to_status: 'closed', actor: guard.userId },
      ]);
      await admin.from('leads').update({ status: 'closed' }).eq('id', parsed.data.leadId);
    }
  }

  return NextResponse.json({ status: 'erased' });
}
