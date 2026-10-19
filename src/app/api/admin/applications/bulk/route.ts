import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { APPLICATION_STATUSES, becomesVisibleToEmployer, type ApplicationStatus } from '@/lib/applications/status';
import { notifyStageChange } from '@/lib/applications/notify';
import { notifyEmployersOfShortlist } from '@/lib/employer/notify';
import { audit } from '@/lib/audit';
import { recordEmployerFees } from '@/lib/hiring/fees';
import { withIdempotency } from '@/lib/security/idempotency';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(APPLICATION_STATUSES),
  notify: z.boolean().default(true),
});

type Row = {
  id: string;
  reference: string;
  status: ApplicationStatus;
  candidates: { id: string; full_name: string; email: string; locale: string } | { id: string; full_name: string; email: string; locale: string }[];
  job_postings: { title: string } | { title: string }[];
};

/**
 * Moves many applications to one stage, e.g. rejecting everyone left after a
 * job fills. Same order as the single move: history first, then state, then
 * the candidate is told. Applications already at that stage are left alone.
 * Capped at 100 per request so the emails finish inside one function run.
 */
export async function POST(request: Request) {
  const guard = await apiPermission('applications.manage');
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  /* A retried bulk move would email every candidate in it a second time. */
  return withIdempotency(request, 'applications.bulk', guard.userId, () => bulkMove(request, guard.userId, parsed.data));
}

async function bulkMove(request: Request, userId: string, input: z.infer<typeof schema>): Promise<NextResponse> {
  const { ids, status, notify } = input;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data, error } = await admin
    .from('applications')
    .select('id, reference, status, candidates!inner (id, full_name, email, locale), job_postings!inner (title)')
    .in('id', ids);
  if (error) {
    console.error('[applications] bulk read failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const moving = ((data ?? []) as unknown as Row[]).filter((row) => row.status !== status);
  if (moving.length === 0) return NextResponse.json({ moved: 0 });

  const { error: eventError } = await admin.from('application_events').insert(
    moving.map((row) => ({
      application_id: row.id,
      from_status: row.status,
      to_status: status,
      note: null,
      visible_to_candidate: true,
      actor: userId,
    })),
  );
  if (eventError) {
    console.error('[applications] bulk event insert failed', eventError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from('applications')
    .update({ status, status_changed_at: new Date().toISOString() })
    .in('id', moving.map((row) => row.id));
  if (updateError) {
    console.error('[applications] bulk update failed', updateError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  if (notify) {
    const origin = new URL(request.url).origin;
    for (const row of moving) {
      const candidate = Array.isArray(row.candidates) ? row.candidates[0] : row.candidates;
      const job = Array.isArray(row.job_postings) ? row.job_postings[0] : row.job_postings;
      if (!candidate || !job) continue;
      await notifyStageChange({
        applicationId: row.id,
        candidateId: candidate.id,
        email: candidate.email,
        name: candidate.full_name,
        locale: candidate.locale ?? 'en',
        jobTitle: job.title,
        reference: row.reference,
        status,
        origin,
      });
    }
  }

  /* Sent whether or not candidates were told; see the single move. */
  await notifyEmployersOfShortlist(
    moving.filter((row) => becomesVisibleToEmployer(row.status, status)).map((row) => row.id),
    new URL(request.url).origin,
  );
  if (status === 'hired') await recordEmployerFees(admin, moving.map((row) => row.id));

  await audit(userId, 'application.bulk_move', `applications:${moving.length}`, {
    to: status,
    ids: moving.map((row) => row.id),
    notified: notify,
  });

  return NextResponse.json({ moved: moving.length });
}
