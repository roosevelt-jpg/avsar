import { getAdminSupabase } from '@/lib/supabase/admin';
import type { DocumentKind } from '@/lib/relocation/documents';
import { BACKGROUND_COLUMNS, backgroundFrom, type CandidateBackground } from '@/lib/candidate/background';

/**
 * The preliminary legal due diligence report, one per paying candidate.
 *
 * Owed to every buyer of the package whatever happens to their applications,
 * so the queue is "everyone who paid" rather than "everyone who asked". It is a
 * preliminary review of the documents provided, never permission to work and
 * never a prediction of a visa decision; the dashboard says so beside it.
 */

export type LegalReviewStatus = 'none' | 'draft' | 'delivered';

export type LegalReview = {
  candidateId: string;
  status: LegalReviewStatus;
  summary: string;
  requirements: string;
  missingDocuments: string;
  issues: string;
  deliveredAt: string | null;
};

export type LegalReviewQueueItem = LegalReview & {
  candidateName: string;
  position: string | null;
  paidAt: string | null;
  documents: { kind: DocumentKind; status: string }[];
  background: CandidateBackground | null;
};

const EMPTY = { summary: '', requirements: '', missingDocuments: '', issues: '', deliveredAt: null };

export function reviewFrom(candidateId: string, row: Record<string, unknown> | null | undefined): LegalReview {
  if (!row) return { candidateId, status: 'none', ...EMPTY };
  return {
    candidateId,
    status: row.status === 'delivered' ? 'delivered' : 'draft',
    summary: String(row.summary ?? ''),
    requirements: String(row.requirements ?? ''),
    missingDocuments: String(row.missing_documents ?? ''),
    issues: String(row.issues ?? ''),
    deliveredAt: (row.delivered_at as string | null) ?? null,
  };
}

/** The candidate's own review, only once delivered. */
export async function deliveredReviewFor(candidateId: string | null): Promise<LegalReview | null> {
  const admin = getAdminSupabase();
  if (!admin || !candidateId) return null;
  const { data } = await admin
    .from('legal_reviews')
    .select('status, summary, requirements, missing_documents, issues, delivered_at')
    .eq('candidate_id', candidateId)
    .eq('status', 'delivered')
    .maybeSingle();
  return data ? reviewFrom(candidateId, data as Record<string, unknown>) : null;
}

/** Everyone who bought the package, oldest undelivered first. Call after requirePermission. */
export async function legalReviewQueue(): Promise<LegalReviewQueueItem[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];

  const { data: candidates } = await admin
    .from('candidates')
    .select('id, full_name, position, payments (paid_at, status)')
    .eq('payment_status', 'paid')
    .is('erased_at', null)
    .limit(500);
  const ids = (candidates ?? []).map((c) => String(c.id));
  if (ids.length === 0) return [];

  const [reviews, documents, backgrounds] = await Promise.all([
    admin.from('legal_reviews').select('candidate_id, status, summary, requirements, missing_documents, issues, delivered_at').in('candidate_id', ids),
    admin.from('relocation_documents').select('candidate_id, kind, status').in('candidate_id', ids).is('superseded_at', null),
    admin.from('candidate_backgrounds').select(`candidate_id, ${BACKGROUND_COLUMNS}`).in('candidate_id', ids),
  ]);

  const reviewBy = new Map((reviews.data ?? []).map((r) => [String(r.candidate_id), r as Record<string, unknown>]));
  const backgroundBy = new Map(
    ((backgrounds.data ?? []) as unknown as Record<string, unknown>[]).map((b) => [String(b.candidate_id), backgroundFrom(b)]),
  );
  const docsBy = new Map<string, { kind: DocumentKind; status: string }[]>();
  for (const d of documents.data ?? []) {
    const list = docsBy.get(String(d.candidate_id)) ?? [];
    list.push({ kind: d.kind as DocumentKind, status: String(d.status) });
    docsBy.set(String(d.candidate_id), list);
  }

  const items = (candidates ?? []).map((c) => {
    const id = String(c.id);
    const paid = (Array.isArray(c.payments) ? c.payments : [])
      .filter((p) => (p as { status?: string }).status === 'paid')
      .map((p) => String((p as { paid_at?: string }).paid_at ?? ''))
      .sort()[0];
    return {
      ...reviewFrom(id, reviewBy.get(id)),
      candidateName: String(c.full_name ?? ''),
      position: (c.position as string | null) ?? null,
      paidAt: paid || null,
      documents: docsBy.get(id) ?? [],
      background: backgroundBy.get(id) ?? null,
    };
  });

  const rank = { none: 0, draft: 1, delivered: 2 } as const;
  return items.sort((a, b) => rank[a.status] - rank[b.status] || String(a.paidAt).localeCompare(String(b.paidAt)));
}
