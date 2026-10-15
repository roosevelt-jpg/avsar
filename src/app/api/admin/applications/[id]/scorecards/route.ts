import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { scorecardSchema } from '@/lib/hiring/scorecard';
import { apiPermission } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const schema = scorecardSchema.extend({ interviewId: z.string().uuid() });

/**
 * A recruiter's scorecard for one interview. One per interviewer per
 * interview: sending again replaces your own card, never someone else's.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await apiPermission('applications.manage');
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: interview } = await admin.from('application_interviews').select('id').eq('id', parsed.data.interviewId).eq('application_id', id).maybeSingle();
  if (!interview) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { error } = await admin.from('interview_scorecards').upsert(
    {
      interview_id: parsed.data.interviewId,
      application_id: id,
      criteria: parsed.data.criteria,
      recommendation: parsed.data.recommendation,
      summary: parsed.data.summary || null,
      author: guard.userId,
      author_kind: 'staff',
    },
    { onConflict: 'interview_id,author' },
  );
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });

  await audit(guard.userId, 'scorecard.save', `application:${id}`, { interview: parsed.data.interviewId, recommendation: parsed.data.recommendation });
  return NextResponse.json({ status: 'saved' });
}
