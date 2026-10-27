import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { APPLICATION_STATUSES, becomesVisibleToEmployer, type ApplicationStatus } from '@/lib/applications/status';
import { notifyStageChange } from '@/lib/applications/notify';
import { notifyEmployersOfShortlist } from '@/lib/employer/notify';
import { audit } from '@/lib/audit';
import { recordEmployerFees } from '@/lib/hiring/fees';

export const runtime = 'nodejs';

const schema = z
  .object({
    status: z.enum(APPLICATION_STATUSES).optional(),
    note: z.string().trim().max(2000).optional(),
    visibleToCandidate: z.boolean().default(true),
    notify: z.boolean().default(true),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    assign: z.enum(['me', 'nobody']).optional(),
    nextStep: z.string().trim().max(200).nullable().optional(),
    nextStepOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  })
  .refine(
    (body) => body.status || body.note || body.rating !== undefined || body.assign || body.nextStep !== undefined || body.nextStepOn !== undefined,
    'nothing to change',
  );

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

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const body = parsed.data;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: current } = await admin
    .from('applications')
    .select('id, reference, status, candidates!inner (id, full_name, email, locale), job_postings!inner (title)')
    .eq('id', id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const from = current.status as ApplicationStatus;
  const moving = body.status && body.status !== from;

  const stepNote =
    body.nextStep !== undefined
      ? body.nextStep
        ? `Next step: ${body.nextStep}${body.nextStepOn ? ` (${body.nextStepOn})` : ''}`
        : 'Next step cleared.'
      : body.assign === 'me'
        ? 'Taken.'
        : body.assign === 'nobody'
          ? 'Released.'
          : null;

  if (moving || body.note || stepNote) {
    const { error } = await admin.from('application_events').insert({
      application_id: id,
      from_status: moving ? from : null,
      to_status: moving ? body.status : null,
      note: body.note || stepNote,
      visible_to_candidate: Boolean(moving || body.note) && body.visibleToCandidate,
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
  if (body.assign) update.assigned_to = body.assign === 'me' ? guard.userId : null;
  if (body.nextStep !== undefined) update.next_step = body.nextStep || null;
  if (body.nextStepOn !== undefined) update.next_step_on = body.nextStepOn;
  if (Object.keys(update).length) {
    const { error } = await admin.from('applications').update(update).eq('id', id);
    if (error) {
      console.error('[applications] update failed', error);
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
    }
  }

  if (moving && body.visibleToCandidate && body.notify) {
    const candidate = (Array.isArray(current.candidates) ? current.candidates[0] : current.candidates) as { id: string; full_name: string; email: string; locale: string };
    const job = (Array.isArray(current.job_postings) ? current.job_postings[0] : current.job_postings) as { title: string };
    await notifyStageChange({
      applicationId: id,
      candidateId: candidate.id,
      email: candidate.email,
      name: candidate.full_name,
      jobTitle: job.title,
      reference: String(current.reference),
      status: body.status as ApplicationStatus,
      note: body.note,
      origin: new URL(request.url).origin,
      locale: candidate.locale ?? 'en',
    });
  }

  /* Independent of "tell the candidate": the employer is a different audience,
     and a shortlist they never hear about is a shortlist nobody interviews. */
  if (moving && becomesVisibleToEmployer(from, body.status as ApplicationStatus)) {
    await notifyEmployersOfShortlist([id], new URL(request.url).origin);
  }
  if (moving && body.status === 'hired') await recordEmployerFees(admin, [id]);

  await audit(guard.userId, moving ? 'application.move' : body.assign || body.nextStep !== undefined ? 'application.plan' : 'application.note', `application:${id}`, {
    from: moving ? from : undefined,
    to: moving ? body.status : undefined,
    assign: body.assign,
    nextStep: body.nextStep,
    nextStepOn: body.nextStepOn,
  });

  return NextResponse.json({ ok: true });
}
