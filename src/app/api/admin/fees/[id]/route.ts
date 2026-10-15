import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { FEE_STATUSES } from '@/lib/hiring/data';
import { apiPermission, demoWriteRefusal } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/* The amount is not editable here: it was fixed at the moment of hire. A
   different price is a waiver plus a note, so the history stays readable. */
const schema = z
  .object({
    status: z.enum(FEE_STATUSES).optional(),
    invoiceRef: z.string().trim().max(60).nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('fees.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(id).success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const body = parsed.data;
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {};
  if (body.status) {
    update.status = body.status;
    if (body.status === 'invoiced') update.invoiced_at = now;
    if (body.status === 'paid') update.paid_at = now;
  }
  if (body.invoiceRef !== undefined) update.invoice_ref = body.invoiceRef || null;
  if (body.note !== undefined) update.note = body.note || null;

  const { data, error } = await admin.from('employer_fees').update(update).eq('id', id).select('application_id').maybeSingle();
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await audit(guard.userId, 'fee.update', `application:${String(data.application_id)}`, body);
  return NextResponse.json({ status: 'saved' });
}
