import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionEmployer } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { EMPLOYER_VISIBLE_STATUSES } from '@/lib/applications/status';
import { scorecardSchema } from '@/lib/hiring/scorecard';
import { notifyStaff } from '@/lib/notifications/staff';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

const schema = scorecardSchema.extend({ applicationId: z.string().uuid() });

/**
 * The employer's scorecard after interviewing one of their applicants.
 *
 * Employers do not see interview ids, so the card is attached to the
 * application's most recent interview that has already started. The
 * application must be on one of the employer's own postings and at a stage
 * they can see; both are checked here against the session's employer, never
 * an id from the body.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Supabase is not configured, so nothing can be saved.' }, { status: 503 });
  }
  const employer = await getSessionEmployer();
  if (!employer) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: application } = await admin
    .from('applications')
    .select('id, reference, status, job_postings!inner (employer_id)')
    .eq('id', parsed.data.applicationId)
    .maybeSingle();
  const job = (Array.isArray(application?.job_postings) ? application.job_postings[0] : application?.job_postings) as { employer_id?: string } | undefined;
  if (!application || job?.employer_id !== employer.employerId || !EMPLOYER_VISIBLE_STATUSES.includes(application.status)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data: interview } = await admin
    .from('application_interviews')
    .select('id')
    .eq('application_id', application.id)
    .neq('status', 'cancelled')
    .lte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!interview) return NextResponse.json({ error: 'no_interview_yet' }, { status: 409 });

  const { error } = await admin.from('interview_scorecards').upsert(
    {
      interview_id: interview.id,
      application_id: application.id,
      criteria: parsed.data.criteria,
      recommendation: parsed.data.recommendation,
      summary: parsed.data.summary || null,
      author: employer.userId,
      author_kind: 'employer',
    },
    { onConflict: 'interview_id,author' },
  );
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await audit(employer.userId, 'scorecard.employer_save', `application:${application.id}`, { recommendation: parsed.data.recommendation });
  await notifyStaff({
    permission: 'applications.manage',
    kind: 'scorecard.employer',
    title: `${employer.name || 'An employer'} scored an interview`,
    body: `${String(application.reference)} · ${parsed.data.recommendation === 'advance' ? 'wants to move forward' : parsed.data.recommendation === 'hold' ? 'is not sure yet' : 'says not a fit'}`,
    href: `/admin/applications/${application.id}`,
  });
  return NextResponse.json({ status: 'saved' });
}
