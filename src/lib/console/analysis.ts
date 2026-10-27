import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';
import { containsPromise } from '@/lib/assistant/guard';
import { anthropic, isAiConfigured } from '@/lib/cv/client';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { zonedDate } from '@/lib/console/workdays';
import { zonedLocalToUtc } from '@/lib/interviews/time';

/**
 * A briefing for the team, built only from counts in the database.
 * The model may restate those counts. It may not add a conversion rate we
 * did not calculate, a salary, or a promise about a job or a visa. With no
 * API key the same counts are written out in plain sentences.
 */

export type ConversionFacts = {
  since: string;
  /** Applicant dashboard: what a candidate sees, counted across everyone. */
  newAccounts: number;
  profilesComplete: number;
  finishedTests: number;
  applications: number;
  interviews: number;
  openJobs: number;
  awaitingPayment: number;
  familyLinks: number;
  /** Employer dashboard: vacancies, the applicants they can open, the assessed pool. */
  employerVacancies: number;
  employerApplicants: number;
  assessedPool: number;
  talk: number;
  familySent: number;
  familyFailed: number;
  checkoutsOpen: number;
  paid: number;
};

export type Briefing = {
  summary: string;
  calls: string[];
  watch: string[];
  source: 'model' | 'counts';
};

const briefingSchema = z.object({
  summary: z.string().max(900),
  calls: z.array(z.string().max(160)).max(5),
  watch: z.array(z.string().max(160)).max(5),
});

const MODEL = process.env.ASSISTANT_MODEL || process.env.CV_MODEL || 'claude-sonnet-4-5';

export async function conversionFacts(days = 7): Promise<ConversionFacts> {
  const empty: ConversionFacts = {
    since: '',
    newAccounts: 0,
    profilesComplete: 0,
    finishedTests: 0,
    applications: 0,
    interviews: 0,
    openJobs: 0,
    awaitingPayment: 0,
    familyLinks: 0,
    employerVacancies: 0,
    employerApplicants: 0,
    assessedPool: 0,
    talk: 0,
    familySent: 0,
    familyFailed: 0,
    checkoutsOpen: 0,
    paid: 0,
  };
  const admin = getAdminSupabase();
  if (!admin) return empty;
  const end = zonedDate(new Date());
  let start = end;
  for (let i = 1; i < days; i += 1) start = shiftBack(start);
  const from = zonedLocalToUtc(`${start}T00:00`, 'Asia/Kolkata')?.toISOString() ?? new Date().toISOString();
  const employerVisible = ['shortlisted', 'interview', 'offer', 'hired', 'visa_processing', 'relocated'];
  const [tests, signals, checkouts, paid, accounts, profiles, applications, interviews, openJobs, awaiting, familyLinks, vacancies, applicants, pool] =
    await Promise.all([
      admin.from('reports').select('candidate_id', { count: 'exact', head: true }).gte('generated_at', from),
      admin.from('conversion_signals').select('kind, sent').gte('created_at', from),
      admin.from('payments').select('id', { count: 'exact', head: true }).in('status', ['created', 'pending', 'failed']).gte('created_at', from),
      admin.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'paid').gte('created_at', from),
      admin.from('candidates').select('id', { count: 'exact', head: true }).gte('created_at', from).is('erased_at', null),
      admin.from('candidates').select('id', { count: 'exact', head: true }).gte('profile_completed_at', from).is('erased_at', null),
      admin.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', from),
      admin.from('application_interviews').select('id', { count: 'exact', head: true }).gte('created_at', from),
      admin.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      admin.from('reports').select('candidate_id, candidates!inner(payment_status)', { count: 'exact', head: true }).neq('candidates.payment_status', 'paid'),
      admin.from('family_links').select('id', { count: 'exact', head: true }).gte('created_at', from).is('revoked_at', null),
      admin.from('job_postings').select('id', { count: 'exact', head: true }).not('employer_id', 'is', null).in('status', ['draft', 'published']),
      admin.from('applications').select('id', { count: 'exact', head: true }).in('status', employerVisible),
      admin.from('reports').select('candidate_id', { count: 'exact', head: true }),
    ]);
  const rows = signals.data ?? [];
  return {
    since: start,
    newAccounts: accounts.count ?? 0,
    profilesComplete: profiles.count ?? 0,
    finishedTests: tests.count ?? 0,
    applications: applications.count ?? 0,
    interviews: interviews.count ?? 0,
    openJobs: openJobs.count ?? 0,
    awaitingPayment: awaiting.count ?? 0,
    familyLinks: familyLinks.count ?? 0,
    employerVacancies: vacancies.count ?? 0,
    employerApplicants: applicants.count ?? 0,
    assessedPool: pool.count ?? 0,
    talk: rows.filter((row) => row.kind === 'talk').length,
    familySent: rows.filter((row) => row.kind === 'family_send' && row.sent).length,
    familyFailed: rows.filter((row) => row.kind === 'family_send' && !row.sent).length,
    checkoutsOpen: checkouts.count ?? 0,
    paid: paid.count ?? 0,
  };
}

function shiftBack(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const prev = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) - 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}-${String(prev.getUTCDate()).padStart(2, '0')}`;
}

export function briefingFromFacts(facts: ConversionFacts): Briefing {
  return {
    summary: `Since ${facts.since}, on applicant dashboards: ${facts.newAccounts} new accounts, ${facts.profilesComplete} profiles finished, ${facts.finishedTests} scores written, ${facts.applications} applications and ${facts.interviews} interviews. ${facts.openJobs} jobs are open, ${facts.awaitingPayment} people with a score have not paid for both reports, and ${facts.familyLinks} family links were created. On employer dashboards: ${facts.employerVacancies} vacancies, ${facts.employerApplicants} applicants they can open, and ${facts.assessedPool} people assessed in the pool. On payment: ${facts.talk} asked to talk before paying, ${facts.checkoutsOpen} opened checkout and have not paid, and ${facts.paid} payments completed. ${facts.familySent} family pages were sent${facts.familyFailed ? `, and ${facts.familyFailed} could not be sent` : ''}.`,
    calls: facts.talk > 0 ? [`Call the ${facts.talk} who asked to talk before paying. They are on Due today.`] : [],
    watch: [
      ...(facts.checkoutsOpen > 0 ? [`${facts.checkoutsOpen} opened checkout and did not pay.`] : []),
      ...(facts.employerApplicants > 0 ? [`${facts.employerApplicants} applicants are visible on employer dashboards.`] : []),
      ...(facts.awaitingPayment > 0 ? [`${facts.awaitingPayment} applicant dashboards are still waiting on a payment.`] : []),
    ],
    source: 'counts',
  };
}

export async function writeBriefing(facts: ConversionFacts): Promise<Briefing> {
  const plain = briefingFromFacts(facts);
  if (!isAiConfigured()) return plain;
  try {
    const response = await anthropic().messages.parse({
      model: MODEL,
      max_tokens: 700,
      system:
        'You brief a recruitment team. Use only the JSON counts. Cover the applicant dashboard, the employer dashboard, and payment. Do not invent a rate, a salary, a name, or a reason. Do not promise a job or a visa. Write plain sentences. calls are who to phone. watch are the numbers that need a person to look.',
      messages: [{ role: 'user', content: JSON.stringify(facts) }],
      output_config: { format: zodOutputFormat(briefingSchema) },
    });
    const parsed = response.parsed_output;
    if (!parsed || containsPromise(parsed.summary) || parsed.calls.some(containsPromise) || parsed.watch.some(containsPromise)) {
      return plain;
    }
    return { summary: parsed.summary, calls: parsed.calls, watch: parsed.watch, source: 'model' };
  } catch (error) {
    console.error('[analysis] briefing failed', error);
    return plain;
  }
}

export function scoreReadingFromFacts(input: { scoreOutOf10: string; strongest: string | null; above: boolean }): string {
  const field = input.strongest ? ` Your strongest field is ${input.strongest}.` : '';
  const line = input.above
    ? ' That score is above the shortlist line. Applying stays free.'
    : ' That score is below the shortlist line. Applying stays free.';
  return `Your free score is ${input.scoreOutOf10} out of 10.${field}${line}`;
}

/** A short reading of the free score. The paid PDF is not written here. */
export async function writeScoreReading(input: { scoreOutOf10: string; strongest: string | null; above: boolean; locale: string }): Promise<string> {
  const plain = scoreReadingFromFacts(input);
  if (!isAiConfigured()) return plain;
  try {
    const response = await anthropic().messages.parse({
      model: MODEL,
      max_tokens: 300,
      system:
        'Rewrite the facts into two short sentences in the language named by locale. Use only these facts. Do not add a salary, a job offer, a visa outcome, or a percentage. Do not say the score guarantees anything.',
      messages: [{ role: 'user', content: JSON.stringify({ ...input, english: plain }) }],
      output_config: { format: zodOutputFormat(z.object({ reading: z.string().max(600) })) },
    });
    const reading = response.parsed_output?.reading?.trim() ?? '';
    if (!reading || containsPromise(reading) || reading.length > 600) return plain;
    return reading;
  } catch (error) {
    console.error('[analysis] score reading failed', error);
    return plain;
  }
}
