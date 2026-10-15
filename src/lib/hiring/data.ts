import { CEFR, type Cefr } from '@/lib/data/candidates';
import { positionBySlug } from '@/lib/data/positions';
import { matchScore, type MatchCandidate, type MatchResult } from '@/lib/hiring/match';
import type { Recommendation } from '@/lib/hiring/scorecard';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

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
  if (!isSupabaseConfigured()) {
    return [
      { id: 'sample-unlock', employerName: 'Sample hotel group', candidateId: 'sample', candidateName: 'Sample: Priya Sharma', applicationId: 'sample-1', reference: 'APP-2M8X4C1R', reason: 'We would like to invite her to a second interview with the head chef.', status: 'pending', createdAt: '2026-10-15T08:30:00Z' },
    ];
  }
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
  if (!isSupabaseConfigured()) {
    return [
      { id: 'sample-fee', applicationId: 'sample-4', amountMinor: 100_000, currency: 'EUR', status: 'pending', invoiceRef: null, note: null, createdAt: '2026-10-14T16:00:00Z', employerName: 'Sample hotel group', candidateName: 'Sample: Anjali Menon', reference: 'APP-SAMPLE4', jobTitle: 'Waiter' },
    ].filter((f) => !status || f.status === status) as FeeRow[];
  }
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

export type ApplicationHiring = { match: MatchResult; scorecards: Scorecard[]; fee: EmployerFee | null };

const SAMPLE_CANDIDATE: MatchCandidate = { position: 'chef', sector: 'food-beverage', english: 'B1', yearsExperience: 4, overallScore: 74, verifiedDocuments: ['passport'] };

export async function applicationHiring(applicationId: string): Promise<ApplicationHiring> {
  if (!isSupabaseConfigured()) {
    return {
      match: matchScore({ position: 'chef', sector: 'food-beverage', minEnglish: 'A2', minYears: 2 }, SAMPLE_CANDIDATE),
      scorecards: [
        { id: 'sample-card', interviewId: 'sample-interview', criteria: [{ label: 'Kitchen hygiene', score: 4 }, { label: 'English', score: 3 }, { label: 'Team fit', score: 4 }], recommendation: 'advance', summary: 'Clear answers on HACCP. English is workable for the kitchen.', authorKind: 'staff', createdAt: '2026-10-14T12:00:00Z' },
      ],
      fee: null,
    };
  }
  const admin = getAdminSupabase();
  const empty: ApplicationHiring = { match: { score: 0, parts: [] }, scorecards: [], fee: null };
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
    scorecards: (cards.data ?? []).map((r) => scorecardFrom(r as Record<string, unknown>)),
    fee: fee.data ? feeFrom(fee.data as Record<string, unknown>) : null,
  };
}
