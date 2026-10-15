import { getAdminSupabase } from '@/lib/supabase/admin';
import { ERASE_BLOCKING_STATUSES } from '@/lib/privacy/erase';

/**
 * Reads for the privacy page. Called only from that page, after
 * `requirePermission('privacy.manage')`; the service role is used because
 * finding a person by email across candidates is exactly what this
 * permission is for.
 */

export type PrivacyCandidate = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  erasedAt: string | null;
  blockingReferences: string[];
};

export type AccessEntry = { id: number; actor: string | null; actorEmail: string | null; candidateId: string | null; action: string; detail: unknown; createdAt: string };
export type ConsentEntry = { consent: string; granted: boolean; version: string | null; source: string | null; createdAt: string };

export const ACCESS_LABELS: Record<string, string> = {
  'cv.download': 'Downloaded the CV',
  'application.view': 'Opened an application',
  'cv_assessment.view': 'Opened the CV assessment',
  'candidate.export': 'Exported all data (staff)',
  'candidate.self_export': 'Downloaded their own data',
  'candidate.erase': 'Erased personal data',
  'employer.profile_unlock': 'Identity released to an employer',
  'relocation_doc.view': 'Opened a visa document',
};

export async function searchPrivacyCandidates(q: string): Promise<PrivacyCandidate[]> {
  const term = q.replace(/[%,()]/g, ' ').trim();
  if (term.length < 3) return [];
  const admin = getAdminSupabase();
  if (!admin) return [];
  const { data } = await admin
    .from('candidates')
    .select('id, full_name, email, phone, created_at, erased_at')
    .or(`email.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone ?? ''),
    createdAt: String(row.created_at),
    erasedAt: (row.erased_at as string | null) ?? null,
    blockingReferences: [],
  }));
}

export async function getPrivacyCandidate(id: string): Promise<{ candidate: PrivacyCandidate; log: AccessEntry[]; consents: ConsentEntry[] } | null> {
  const admin = getAdminSupabase();
  if (!admin) return null;

  const [{ data: row }, { data: blocking }, log, { data: consents }] = await Promise.all([
    admin.from('candidates').select('id, full_name, email, phone, created_at, erased_at').eq('id', id).maybeSingle(),
    admin.from('applications').select('reference').eq('candidate_id', id).in('status', [...ERASE_BLOCKING_STATUSES]),
    accessLog({ candidateId: id, limit: 200 }),
    admin.from('consent_events').select('consent, granted, version, source, created_at').eq('candidate_id', id).order('created_at', { ascending: false }),
  ]);
  if (!row) return null;

  return {
    candidate: {
      id: String(row.id),
      fullName: String(row.full_name),
      email: String(row.email),
      phone: String(row.phone ?? ''),
      createdAt: String(row.created_at),
      erasedAt: (row.erased_at as string | null) ?? null,
      blockingReferences: (blocking ?? []).map((b) => String(b.reference)),
    },
    log,
    consents: (consents ?? []).map((c) => ({
      consent: String(c.consent),
      granted: Boolean(c.granted),
      version: (c.version as string | null) ?? null,
      source: (c.source as string | null) ?? null,
      createdAt: String(c.created_at),
    })),
  };
}

export async function accessLog(filter: { candidateId?: string; limit?: number } = {}): Promise<AccessEntry[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  let query = admin
    .from('data_access_log')
    .select('id, actor, candidate_id, action, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(filter.limit ?? 100);
  if (filter.candidateId) query = query.eq('candidate_id', filter.candidateId);
  const { data } = await query;
  const rows = data ?? [];

  /* Staff emails, so the log names people rather than ids. */
  const actorIds = [...new Set(rows.map((r) => r.actor as string | null).filter((a): a is string => Boolean(a)))];
  const { data: staff } = actorIds.length
    ? await admin.from('staff_users').select('auth_user_id, email').in('auth_user_id', actorIds)
    : { data: [] as { auth_user_id: string; email: string }[] };
  const emails = new Map((staff ?? []).map((s) => [String(s.auth_user_id), String(s.email)]));

  return rows.map((r) => ({
    id: Number(r.id),
    actor: (r.actor as string | null) ?? null,
    actorEmail: r.actor ? (emails.get(String(r.actor)) ?? null) : null,
    candidateId: (r.candidate_id as string | null) ?? null,
    action: String(r.action),
    detail: r.detail,
    createdAt: String(r.created_at),
  }));
}
