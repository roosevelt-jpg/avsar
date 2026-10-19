import { CEFR, type Cefr } from '@/lib/data/candidates';
import { positionBySlug } from '@/lib/data/positions';
import { matchScore, type MatchResult } from '@/lib/hiring/match';
import type { Recommendation } from '@/lib/hiring/scorecard';
import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * Hiring reads for the console's application page: the match score, the
 * interview scorecards and the employer's fee. Called only from that page,
 * after `requirePermission('applications.view')`.
 */

export { RECOMMENDATIONS, RECOMMENDATION_LABELS, type Recommendation } from '@/lib/hiring/scorecard';

export type Scorecard = {
  id: string;
  interviewId: string;
  criteria: { label: string; score: number }[];
  recommendation: Recommendation;
  summary: string | null;
  authorKind: 'staff' | 'employer';
  createdAt: string;
};

export const FEE_STATUSES = ['pending', 'invoiced', 'paid', 'waived'] as const;
export type FeeStatus = (typeof FEE_STATUSES)[number];
export const FEE_STATUS_LABELS: Record<FeeStatus, string> = { pending: 'To invoice', invoiced: 'Invoiced', paid: 'Paid', waived: 'Waived' };

export type EmployerFee = {
  id: string;
  applicationId: string;
  amountMinor: number;
  currency: 'EUR';
  status: FeeStatus;
  invoiceRef: string | null;
  note: string | null;
  createdAt: string;
};

/** The experience band's upper bound in years, as the bench function reads it. */
export function yearsFromBand(band: number | null | undefined): number | null {
  if (band == null) return null;
  return [0, 2, 4, 6][band] ?? 6;
}

export function asCefr(value: unknown): Cefr | null {
  return typeof value === 'string' && (CEFR as readonly string[]).includes(value) ? (value as Cefr) : null;
}

export function sectorOf(position: string | null | undefined): string | null {
  return position ? (positionBySlug(position)?.area ?? null) : null;
}

export function scorecardFrom(row: Record<string, unknown>): Scorecard {
  return {
    id: String(row.id),
    interviewId: String(row.interview_id),
    criteria: Array.isArray(row.criteria) ? (row.criteria as { label: string; score: number }[]) : [],
    recommendation: row.recommendation as Recommendation,
    summary: (row.summary as string | null) ?? null,
    authorKind: row.author_kind as Scorecard['authorKind'],
    createdAt: String(row.created_at),
  };
}

export function feeFrom(row: Record<string, unknown>): EmployerFee {
  return {
    id: String(row.id),
    applicationId: String(row.application_id),
    amountMinor: Number(row.amount_minor),
    currency: 'EUR',
    status: row.status as FeeStatus,
    invoiceRef: (row.invoice_ref as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export type UnlockRequest = {
  id: string;
  employerName: string;
  candidateId: string;
  candidateName: string;
  applicationId: string | null;
  reference: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
};

/** For `/admin/unlocks`, after `requirePermission('relocation.manage')`. Pending first. */
export async function listUnlockRequests(): Promise<UnlockRequest[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  const { data } = await admin
    .from('profile_unlock_requests')
    .select('id, candidate_id, application_id, reason, status, created_at, employers (name), candidates (full_name), applications (reference)')
    .order('created_at', { ascending: false })
    .limit(200);
  const one = (value: unknown) => (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  return ((data ?? []) as Record<string, unknown>[])
    .map((r) => ({
      id: String(r.id),
      employerName: String(one(r.employers)?.name ?? ''),
      candidateId: String(r.candidate_id),
      candidateName: String(one(r.candidates)?.full_name ?? ''),
      applicationId: (r.application_id as string | null) ?? null,
      reference: (one(r.applications)?.reference as string | undefined) ?? null,
      reason: String(r.reason),
      status: r.status as UnlockRequest['status'],
      createdAt: String(r.created_at),
    }))
    .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));
}

export type FeeRow = EmployerFee & { employerName: string; candidateName: string; reference: string; jobTitle: string };

/** For `/admin/fees`, after `requirePermission('payments.view')`. */
export async function listEmployerFees(status?: FeeStatus): Promise<FeeRow[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  let query = admin
    .from('employer_fees')
    .select('id, application_id, amount_minor, currency, status, invoice_ref, note, created_at, employers (name), applications (reference, candidates (full_name), job_postings (title))')
    .order('created_at', { ascending: false })
    .limit(500);
  if (status) query = query.eq('status', status);
  const { data } = await query;
  const one = (value: unknown) => (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => {
    const app = one(r.applications);
    return {
      ...feeFrom(r),
      employerName: String(one(r.employers)?.name ?? ''),
      candidateName: String(one(app?.candidates)?.full_name ?? ''),
      reference: String(app?.reference ?? ''),
      jobTitle: String(one(app?.job_postings)?.title ?? ''),
    };
  });
}

export type ApplicationHiring = { match: MatchResult; assessmentScore: number | null; scorecards: Scorecard[]; fee: EmployerFee | null };

export async function applicationHiring(applicationId: string): Promise<ApplicationHiring> {
  const admin = getAdminSupabase();
  const empty: ApplicationHiring = { match: { score: 0, parts: [] }, assessmentScore: null, scorecards: [], fee: null };
  if (!admin) return empty;

  const { data: app } = await admin
    .from('applications')
    .select('candidate_id, candidates (position, years_experience_band), job_postings (position_slug, area, min_english, min_experience_years)')
    .eq('id', applicationId)
    .maybeSingle();
  if (!app) return empty;
  const one = (value: unknown) => (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
  const c = one(app.candidates) ?? {};
  const j = one(app.job_postings) ?? {};

  const [report, docs, cards, fee] = await Promise.all([
    admin.from('reports').select('english_cefr, overall_score').eq('candidate_id', String(app.candidate_id)).maybeSingle(),
    admin
      .from('relocation_documents')
      .select('kind, expires_on')
      .eq('candidate_id', String(app.candidate_id))
      .eq('status', 'verified')
      .is('superseded_at', null),
    admin.from('interview_scorecards').select('id, interview_id, criteria, recommendation, summary, author_kind, created_at').eq('application_id', applicationId).order('created_at'),
    admin.from('employer_fees').select('id, application_id, amount_minor, currency, status, invoice_ref, note, created_at').eq('application_id', applicationId).maybeSingle(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const position = (c.position as string | null) ?? null;
  const match = matchScore(
    {
      position: (j.position_slug as string | null) ?? null,
      sector: (j.area as string | null) ?? null,
      minEnglish: asCefr(j.min_english),
      minYears: j.min_experience_years == null ? null : Number(j.min_experience_years),
    },
    {
      position,
      sector: sectorOf(position),
      english: asCefr(report.data?.english_cefr),
      yearsExperience: yearsFromBand(c.years_experience_band as number | null),
      overallScore: report.data?.overall_score == null ? null : Number(report.data.overall_score),
      verifiedDocuments: (docs.data ?? []).filter((d) => !d.expires_on || String(d.expires_on) >= today).map((d) => String(d.kind)),
    },
  );

  return {
    match,
    assessmentScore: report.data?.overall_score == null ? null : Number(report.data.overall_score),
    scorecards: (cards.data ?? []).map((r) => scorecardFrom(r as Record<string, unknown>)),
    fee: fee.data ? feeFrom(fee.data as Record<string, unknown>) : null,
  };
}
