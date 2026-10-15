import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiPermission, demoWriteRefusal } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getMailer } from '@/lib/email';
import { renderEmail } from '@/lib/email/template';
import { localePath } from '@/lib/i18n';
import { sendWhatsApp } from '@/lib/whatsapp';
import { INTERVIEW_MODE_LABELS, INTERVIEW_ZONES, interviewTimes, zonedLocalToUtc } from '@/lib/interviews/time';
import { becomesVisibleToEmployer, pipelineIndex, type ApplicationStatus } from '@/lib/applications/status';
import { notifyEmployersOfShortlist } from '@/lib/employer/notify';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

const schema = z.object({
  /** Wall-clock time from a datetime-local input, read in `timezone`. */
  localTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  timezone: z.enum(INTERVIEW_ZONES),
  durationMinutes: z.number().int().min(10).max(240).default(30),
  mode: z.enum(['video', 'phone', 'in_person']),
  link: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((value) => value.startsWith('https://'), 'https only')
    .optional()
    .or(z.literal('')),
  location: z.string().trim().max(300).optional(),
  candidateMessage: z.string().trim().max(1000).optional(),
  notify: z.boolean().default(true),
});

/**
 * Books an interview. Moves the application to "interview" if it is earlier in
 * the pipeline (history first, then state), then tells the candidate the time
 * in India and in Lisbon, by email and, if they opted in, WhatsApp.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const guard = await apiPermission('applications.manage');
  if (guard instanceof NextResponse) return guard;
  const refusal = demoWriteRefusal(guard);
  if (refusal) return refusal;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_payload', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const body = parsed.data;

  const startsAt = zonedLocalToUtc(body.localTime, body.timezone);
  if (!startsAt) return NextResponse.json({ error: 'invalid_time' }, { status: 400 });
  if (startsAt.getTime() < Date.now() - 5 * 60_000) return NextResponse.json({ error: 'in_the_past' }, { status: 422 });

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data: current } = await admin
    .from('applications')
    .select('id, reference, status, candidates!inner (id, full_name, email, locale), job_postings!inner (title)')
    .eq('id', id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const candidate = (Array.isArray(current.candidates) ? current.candidates[0] : current.candidates) as { id: string; full_name: string; email: string; locale: string };
  const job = (Array.isArray(current.job_postings) ? current.job_postings[0] : current.job_postings) as { title: string };
  const from = current.status as ApplicationStatus;
  const times = interviewTimes(startsAt);

  const { data: interview, error: insertError } = await admin
    .from('application_interviews')
    .insert({
      application_id: id,
      starts_at: startsAt.toISOString(),
      duration_minutes: body.durationMinutes,
      timezone: body.timezone,
      mode: body.mode,
      link: body.link || null,
      location: body.location || null,
      candidate_message: body.candidateMessage || null,
      created_by: guard.userId,
    })
    .select('id')
    .single();
  if (insertError || !interview) {
    console.error('[interviews] insert failed', insertError);
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 });
  }

  /* Only forward: an application already at offer or beyond keeps its stage. */
  const moving = pipelineIndex(from) >= 0 && pipelineIndex(from) < pipelineIndex('interview');
  const { error: eventError } = await admin.from('application_events').insert({
    application_id: id,
    from_status: moving ? from : null,
    to_status: moving ? 'interview' : null,
    note: `${INTERVIEW_MODE_LABELS[body.mode]} interview booked for ${times.both}.`,
    visible_to_candidate: true,
    actor: guard.userId,
  });
  if (eventError) console.error('[interviews] event insert failed', eventError);
  if (moving && !eventError) {
    const { error } = await admin.from('applications').update({ status: 'interview', status_changed_at: new Date().toISOString() }).eq('id', id);
    if (error) console.error('[interviews] status update failed', error);
    else if (becomesVisibleToEmployer(from, 'interview')) await notifyEmployersOfShortlist([id], new URL(request.url).origin);
  }

  if (body.notify) {
    const origin = new URL(request.url).origin;
    const first = candidate.full_name.split(' ')[0] || candidate.full_name;
    const url = `${origin}${localePath(candidate.locale ?? 'en', '/dashboard/applications')}`;
    const paragraphs = [
      `Hello ${first},`,
      `Your interview for ${job.title} (${current.reference}) is booked.`,
      `When: ${times.india}. That is ${times.lisbon}.`,
      `How: ${INTERVIEW_MODE_LABELS[body.mode]}, about ${body.durationMinutes} minutes.${body.location ? ` Where: ${body.location}.` : ''}`,
      ...(body.candidateMessage ? [`From your recruiter: ${body.candidateMessage}`] : []),
      ...(body.link ? [`Join here: ${body.link}`] : []),
    ];
    try {
      await getMailer().send({
        to: candidate.email,
        subject: `Interview booked: ${job.title}`,
        text: `${paragraphs.join('\n\n')}\n\nSee it in your tracker: ${url}`,
        html: renderEmail({ preheader: times.india, heading: 'Your interview is booked', paragraphs, action: { label: 'See my interview', url }, origin }),
      });
    } catch (error) {
      console.error('[interviews] email failed', error);
    }
    await sendWhatsApp({
      candidateId: candidate.id,
      applicationId: id,
      template: 'interview_scheduled',
      params: [first, job.title, times.both],
    });
  }

  await audit(guard.userId, 'interview.schedule', `application:${id}`, {
    interview: interview.id,
    startsAt: startsAt.toISOString(),
    moved: moving,
  });

  return NextResponse.json({ id: interview.id, startsAt: startsAt.toISOString() });
}
