import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission, can } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { jobInputSchema, jobStatusSchema } from '@/lib/jobs/schema';
import { jobToRow, type JobInput } from '@/lib/jobs/types';
import { audit } from '@/lib/audit';
import { notifyEmployerJobLive } from '@/lib/employer/notify';

export const runtime = 'nodejs';

const bodySchema = z.object({ job: z.unknown().optional(), status: jobStatusSchema.optional() });

/**
 * Updates a posting, and optionally moves its status in the same request.
 * Editing needs jobs.edit; any status change needs jobs.publish.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const guard = await apiPermission(body.data.job ? 'jobs.edit' : 'jobs.publish');
  if (guard instanceof NextResponse) return guard;
  if (body.data.status && !can(guard, 'jobs.publish')) {
    return NextResponse.json({ error: 'forbidden', need: 'jobs.publish' }, { status: 403 });
  }

  const update: Record<string, unknown> = { updated_by: guard.userId };
  if (body.data.job) {
    const parsed = jobInputSchema.safeParse(body.data.job);
    if (!parsed.success) return NextResponse.json({ error: 'validation_failed', issues: parsed.error.flatten() }, { status: 422 });
    Object.assign(update, jobToRow(parsed.data as JobInput));
  }
  if (body.data.status) update.status = body.data.status;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: before } = await admin
    .from('job_postings')
    .select('status, title, city, employer_id')
    .eq('id', id)
    .maybeSingle();

  const { error } = await admin.from('job_postings').update(update).eq('id', id);
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'slug_taken' }, { status: 409 });
    console.error('[jobs] update failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await audit(guard.userId, body.data.status ? `job.${body.data.status}` : 'job.update', `job:${id}`);
  revalidatePath('/', 'layout');

  /* First time a linked employer vacancy goes live, tell their contacts. */
  if (
    body.data.status === 'published' &&
    before?.status !== 'published' &&
    before?.employer_id
  ) {
    await notifyEmployerJobLive({
      employerId: String(before.employer_id),
      jobTitle: String(body.data.job ? (update.title ?? before.title) : before.title),
      city: String(body.data.job ? (update.city ?? before.city) : before.city),
      origin: new URL(request.url).origin,
    });
  }

  return NextResponse.json({ id });
}

/** Deletes a posting only if nobody has applied; otherwise archive it, so applications keep their history. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const guard = await apiPermission('jobs.publish');
  if (guard instanceof NextResponse) return guard;

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { count } = await admin.from('applications').select('id', { count: 'exact', head: true }).eq('job_id', id);
  if ((count ?? 0) > 0) return NextResponse.json({ error: 'has_applications' }, { status: 409 });

  const { error } = await admin.from('job_postings').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  await audit(guard.userId, 'job.delete', `job:${id}`);
  revalidatePath('/', 'layout');
  return NextResponse.json({ deleted: true });
}
