import { refreshIntegrations } from '@/lib/integrations/runtime';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getMailer, unsubscribeToken } from '@/lib/email';
import { reminderStage, renderReminder } from '@/lib/email/reminder';
import { SECTION_ORDER } from '@/lib/assessment/items';
import { getSiteSettings } from '@/lib/cms/data';
import { formatProductFee } from '@/lib/company/config';
import { sendWhatsApp } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Reminds people who opened an account and stopped.
 *
 * Someone who registered is the top of the funnel, not litter: they gave a
 * name, a number and an address, and they did it unprompted. Three reminders,
 * then nothing.
 *
 * Stage is chosen from what they have actually done: profile, assessment, or
 * optional package. Assessed-but-unpaid people get the package template, never
 * "take the assessment" again.
 *
 * The count lives on the row rather than in this function, so a retried or
 * overlapping run cannot send a fourth. It is incremented for every candidate
 * the mailer accepted, and left alone for the ones it refused, so a bounced
 * send is retried on the next run instead of being silently spent.
 */

/** Days after the previous contact before the next reminder goes out. */
const SCHEDULE = [1, 3, 10];
const MAX_REMINDERS = SCHEDULE.length;

type Row = {
  id: string;
  full_name: string;
  email: string;
  locale: string;
  created_at: string;
  profile_completed_at: string | null;
  reminder_count: number;
  last_reminder_at: string | null;
};

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

async function run(request: Request) {
  /**
   * Vercel signs its cron calls with this header. Without the check the
   * endpoint is a button anyone can press to make us send mail, which is both
   * a bill and a way to burn a sending reputation.
   */
  await refreshIntegrations();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = getAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'storage_unconfigured' }, { status: 503 });

  const { data, error } = await admin
    .from('candidates')
    .select(
      'id, full_name, email, locale, created_at, profile_completed_at, reminder_count, last_reminder_at',
    )
    .neq('payment_status', 'paid')
    .is('unsubscribed_at', null)
    .lt('reminder_count', MAX_REMINDERS)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[reminders] query failed', error);
    return NextResponse.json({ error: 'query_failed' }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];
  const ids = rows.map((row) => row.id);

  /* One round-trip for who has finished every section, so we do not send
     "take the assessment" to people who already have. */
  const assessed = new Set<string>();
  if (ids.length > 0) {
    const { data: attempts } = await admin
      .from('assessment_attempts')
      .select('candidate_id, section, submitted_at')
      .in('candidate_id', ids)
      .not('submitted_at', 'is', null);
    const byCandidate = new Map<string, Set<string>>();
    for (const row of attempts ?? []) {
      const id = String(row.candidate_id);
      const set = byCandidate.get(id) ?? new Set();
      set.add(String(row.section));
      byCandidate.set(id, set);
    }
    for (const [id, sections] of byCandidate) {
      if (SECTION_ORDER.every((section) => sections.has(section))) assessed.add(id);
    }
  }

  const mailer = getMailer();
  const origin = new URL(request.url).origin;
  const settings = await getSiteSettings();
  const packagePrice = formatProductFee(settings.pricing, 'bundle').replace(/[\u2066\u2069]/g, '');

  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    /* Time is measured from the last contact, not from registration, so a run
       that was missed yesterday does not fire two reminders today. */
    const since = daysSince(row.last_reminder_at ?? row.created_at);
    if (since < SCHEDULE[row.reminder_count]!) {
      skipped += 1;
      continue;
    }

    const assessmentComplete = assessed.has(row.id);
    const stage = reminderStage({
      profile_completed_at: row.profile_completed_at,
      assessment_complete: assessmentComplete,
    });

    const unsubscribe = `${origin}/api/unsubscribe?c=${row.id}&t=${unsubscribeToken(row.id)}`;
    const { subject, text, html } = await renderReminder(
      {
        full_name: row.full_name,
        locale: row.locale,
        profile_completed_at: row.profile_completed_at,
        assessment_complete: assessmentComplete,
      },
      origin,
      unsubscribe,
    );

    const result = await mailer.send({
      to: row.email,
      subject,
      text,
      html,
      unsubscribeUrl: unsubscribe,
    });

    /* Package stage also nudges on WhatsApp when opted in. Count as contacted
       if either channel accepted, so we do not burn three emails then three WAs. */
    let contacted = result.sent;
    if (stage === 'package') {
      const firstName = (row.full_name.split(' ')[0] || row.full_name).trim() || 'there';
      await sendWhatsApp({
        candidateId: row.id,
        template: 'package_offer',
        params: [firstName, packagePrice],
      });
      /* sendWhatsApp is fire-and-forget on opt-in; treat email success as enough. */
      contacted = result.sent;
    }

    /* Only a send that was accepted is counted. A refused one is retried next
       run rather than quietly using up one of the three. */
    if (!contacted) continue;

    const { error: markError } = await admin
      .from('candidates')
      .update({
        reminder_count: row.reminder_count + 1,
        last_reminder_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (markError) console.error('[reminders] mark failed', row.id, markError.message);
    sent += 1;
  }

  return NextResponse.json({ mailer: mailer.name, considered: rows.length, sent, skipped });
}

/* Vercel invokes a cron with GET. POST is accepted too, so the job can be
   triggered by hand from a terminal without pretending to be the scheduler. */
export const GET = run;
export const POST = run;
