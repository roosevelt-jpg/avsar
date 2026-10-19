/**
 * The visa file: which documents, how much each matters, and how ready a
 * candidate is to travel. Client-safe and pure, so the dashboard, the console,
 * the employer bench and the family page all score the same file the same way.
 *
 * Weights follow what actually holds a Portuguese work visa up for someone in
 * India: no passport or police clearance, no appointment; no contract, no
 * visa. The rest smooth the path but do not stop it. Requirements are set by
 * the Portuguese authorities and change; the recruiter confirms the list.
 */

export const DOCUMENT_KINDS = [
  'passport',
  'national_id',
  'police_clearance',
  'contract',
  'medical',
  'insurance',
  'accommodation',
  'photo',
  'qualification',
  'bank_statement',
  'other',
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  passport: 'Passport',
  national_id: 'National ID card',
  police_clearance: 'Police clearance certificate',
  contract: 'Signed contract or job offer',
  medical: 'Medical certificate',
  insurance: 'Travel insurance',
  accommodation: 'Proof of accommodation',
  photo: 'Passport photographs',
  qualification: 'Qualification or experience letters',
  bank_statement: 'Bank statement',
  other: 'Other document',
};

/** What a candidate needs to know about each, in one line. */
export const DOCUMENT_HINTS: Record<DocumentKind, string> = {
  passport: 'Photo page and last page. Valid well beyond your contract.',
  national_id: 'If you have no passport yet. For Aadhaar, upload the masked version from the UIDAI website, with only the last four digits showing.',
  police_clearance: 'From Passport Seva. Apply early: it can take a few weeks, and it expires.',
  contract: 'Your employer sends this after the offer. We upload it if you prefer.',
  medical: 'Only if your recruiter asks for it.',
  insurance: 'Covering your travel to Portugal and the first weeks.',
  accommodation: 'From the employer, or the rental agreement.',
  photo: 'White background, recent, as for a passport.',
  qualification: 'Certificates or letters from past employers.',
  bank_statement: 'Only if your recruiter asks for it.',
  other: 'Anything else your recruiter has asked for.',
};

/* A national ID proves identity for the legal review but carries no weight
   here: a visa needs the passport, whatever else is on file. */
const WEIGHTS: Partial<Record<DocumentKind, number>> = {
  passport: 25,
  police_clearance: 20,
  contract: 20,
  insurance: 10,
  accommodation: 10,
  photo: 5,
  qualification: 5,
  medical: 5,
};

/** Without all three, nobody is travel-ready whatever the score says. */
export const REQUIRED_KINDS: DocumentKind[] = ['passport', 'police_clearance', 'contract'];

/** Without these two, a candidate is not ready even to be offered quickly. */
export const BENCH_REQUIRED_KINDS: DocumentKind[] = ['passport', 'police_clearance'];

export const READY_THRESHOLD = 70;

export type DocumentState = {
  kind: DocumentKind;
  status: 'uploaded' | 'verified' | 'rejected';
  expiresOn: string | null;
  supersededAt?: string | null;
};

export type Readiness = {
  score: number;
  ready: boolean;
  verified: DocumentKind[];
  awaitingReview: DocumentKind[];
  missing: DocumentKind[];
  /** Verified, but expiring within 45 days. Police clearance is the usual one. */
  expiringSoon: DocumentKind[];
};

function daysUntil(date: string, today: Date): number {
  return Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / 86_400_000);
}

export function computeReadiness(documents: DocumentState[], today = new Date()): Readiness {
  const current = documents.filter((d) => !d.supersededAt);
  const valid = (d: DocumentState) => !d.expiresOn || daysUntil(d.expiresOn, today) >= 0;

  const verified = [...new Set(current.filter((d) => d.status === 'verified' && valid(d)).map((d) => d.kind))];
  const awaitingReview = [...new Set(current.filter((d) => d.status === 'uploaded').map((d) => d.kind))].filter((k) => !verified.includes(k));
  const expiringSoon = current
    .filter((d) => d.status === 'verified' && d.expiresOn && valid(d) && daysUntil(d.expiresOn, today) <= 45)
    .map((d) => d.kind);

  return { ...scoreKinds(verified), awaitingReview, expiringSoon };
}

/** From verified kinds alone, as the employer views receive them. */
export function scoreKinds(verifiedKinds: readonly string[]): Pick<Readiness, 'score' | 'ready' | 'verified' | 'missing'> {
  const verified = DOCUMENT_KINDS.filter((k) => verifiedKinds.includes(k));
  const score = Math.min(100, verified.reduce((sum, kind) => sum + (WEIGHTS[kind] ?? 0), 0));
  const missing = (Object.keys(WEIGHTS) as DocumentKind[]).filter((k) => !verified.includes(k));
  return { score, ready: score >= READY_THRESHOLD && REQUIRED_KINDS.every((k) => verified.includes(k)), verified, missing };
}

/** Ready for the employer bench: a lower bar, before any contract exists. */
export function benchReady(verifiedKinds: readonly string[]): boolean {
  return BENCH_REQUIRED_KINDS.every((k) => verifiedKinds.includes(k));
}

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
