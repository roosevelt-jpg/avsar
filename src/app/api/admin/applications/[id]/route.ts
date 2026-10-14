import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission, demoWriteRefusal } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/applications/status';
import { sendApplicationUpdate } from '@/lib/email/application';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const schema = z
  .object({
    status: z.enum(APPLICATION_STATUSES).optional(),
    note: z.string().trim().max(2000).optional(),
    visibleToCandidate: z.boolean().default(true),
    notify: z.boolean().default(true),
    rating: z.number().int().min(1).max(5).nullable().optional(),
  })
  .refine((body) => body.status || body.note || body.rating !== undefined, 'nothing to change');

/**
 * Moves an application, adds a note, or rates it.
 *
 * The event is written before the status, as with placements: a failure then
 * leaves a history one entry ahead of the state, which is explainable, rather
 * than a state nobody can account for.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const guard = await apiPermission('applications.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const body = parsed.data;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: current } = await admin
    .from('applications')
    .select('id, reference, status, candidates!inner (full_name, email, locale), job_postings!inner (title)')
    .eq('id', id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const from = current.status as ApplicationStatus;
  const moving = body.status && body.status !== from;

  if (moving || body.note) {
    const { error } = await admin.from('application_events').insert({
      application_id: id,
      from_status: moving ? from : null,
      to_status: moving ? body.status : null,
      note: body.note || null,
      visible_to_candidate: body.visibleToCandidate,
      actor: guard.userId,
    });
    if (error) {
      console.error('[applications] event insert failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
  }

  const update: Record<string, unknown> = {};
  if (moving) Object.assign(update, { status: body.status, status_changed_at: new Date().toISOString() });
  if (body.rating !== undefined) update.rating = body.rating;
  if (Object.keys(update).length) {
    const { error } = await admin.from('applications').update(update).eq('id', id);
    if (error) {
      console.error('[applications] update failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
  }

  if (moving && body.visibleToCandidate && body.notify) {
    const candidate = (Array.isArray(current.candidates) ? current.candidates[0] : current.candidates) as { full_name: string; email: string; locale: string };
    const job = (Array.isArray(current.job_postings) ? current.job_postings[0] : current.job_postings) as { title: string };
    await sendApplicationUpdate({
      to: candidate.email,
      name: candidate.full_name,
      jobTitle: job.title,
      reference: String(current.reference),
      status: body.status as ApplicationStatus,
      note: body.note,
      origin: new URL(request.url).origin,
      locale: candidate.locale ?? 'en',
    });
  }

  await audit(guard.userId, moving ? 'application.move' : 'application.note', `application:${id}`, {
    from: moving ? from : undefined,
    to: moving ? body.status : undefined,
  });

  return NextResponse.json({ ok: true });
}
