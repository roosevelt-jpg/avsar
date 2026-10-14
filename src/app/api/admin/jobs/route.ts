import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission, can, demoWriteRefusal } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { jobInputSchema, jobStatusSchema } from '@/lib/jobs/schema';
import { jobToRow, type JobInput } from '@/lib/jobs/types';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const bodySchema = z.object({ job: z.unknown(), status: jobStatusSchema.optional() });

/** Creates a job posting. Drafts need jobs.edit; creating straight into published also needs jobs.publish. */
export async function POST(request: Request) {
  const guard = await apiPermission('jobs.edit');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const parsed = jobInputSchema.safeParse(body.data.job);
  if (!parsed.success) return NextResponse.json({ error: 'validation_failed', issues: parsed.error.flatten() }, { status: 422 });

  const status = body.data.status ?? 'draft';
  if (status !== 'draft' && !can(guard, 'jobs.publish')) {
    return NextResponse.json({ error: 'forbidden', need: 'jobs.publish' }, { status: 403 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data, error } = await admin
    .from('job_postings')
    .insert({ ...jobToRow(parsed.data as JobInput), status, created_by: guard.userId, updated_by: guard.userId })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'slug_taken' }, { status: 409 });
    console.error('[jobs] create failed', error);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  await audit(guard.userId, 'job.create', `job:${data.id}`, { slug: parsed.data.slug, status });
  if (status === 'published') revalidatePath('/', 'layout');
  return NextResponse.json({ id: data.id });
}
