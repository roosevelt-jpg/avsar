import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionEmployer } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { EMPLOYER_VISIBLE_STATUSES } from '@/lib/applications/status';
import { notifyStaff } from '@/lib/notifications/staff';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = z.object({ applicationId: z.string().uuid(), reason: z.string().trim().min(5).max(500) }).strict();

/**
 * An employer asks to see an applicant's full name.
 *
 * Applicants are shown with a shortened name so that the first look is at the
 * skills, not the surname, and so a name is not handed to every employer a
 * candidate is put forward to. The request goes to our team; nothing is
 * released until a person approves it, and the release is logged against the
 * candidate's record.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'demo_mode', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const employer = await getSessionEmployer();
  if (!employer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: application } = await admin
    .from('applications')
    .select('id, reference, status, candidate_id, job_postings!inner (employer_id)')
    .eq('id', parsed.data.applicationId)
    .maybeSingle();
  const job = (Array.isArray(application?.job_postings) ? application.job_postings[0] : application?.job_postings) as { employer_id?: string } | undefined;
  if (!application || job?.employer_id !== employer.employerId || !EMPLOYER_VISIBLE_STATUSES.includes(application.status)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data, error } = await admin
    .from('profile_unlock_requests')
    .insert({
      employer_id: employer.employerId,
      candidate_id: application.candidate_id,
      application_id: application.id,
      requested_by: employer.userId,
      reason: parsed.data.reason,
    })
    .select('id')
    .maybeSingle();
  /* The unique index allows one open request per employer and candidate. */
  if (error?.code === '23505') return NextResponse.json({ status: 'already_requested' });
  if (error || !data) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await audit(employer.userId, 'unlock.request', `application:${application.id}`, { request: data.id });
  await notifyStaff({
    permission: 'relocation.manage',
    kind: 'unlock.request',
    title: `${employer.name || 'An employer'} asks to see a full profile`,
    body: String(application.reference),
    href: '/admin/unlocks',
  });
  return NextResponse.json({ status: 'requested' }, { status: 201 });
}
