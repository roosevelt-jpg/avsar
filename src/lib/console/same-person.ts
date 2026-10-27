import { audit } from '@/lib/audit';
import { normalisePhone } from '@/lib/leads/phone';
import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * One person can arrive as a lead and later as a candidate.
 * Email and phone are the join. Linking writes the candidate id onto any
 * open lead that still has none, so the inbox and the application open the
 * same file instead of two.
 */

export type PersonLink = {
  candidate: { id: string; fullName: string; email: string; phone: string } | null;
  applications: { id: string; reference: string; status: string; jobTitle: string }[];
  leads: { id: string; fullName: string; topic: string; status: string }[];
};

type Identity = { email?: string | null; phone?: string | null; candidateId?: string | null; excludeLeadId?: string | null; excludeApplicationId?: string | null };

function cleanEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase() ?? '';
  return email.includes('@') ? email : null;
}

function cleanPhone(value: string | null | undefined): string | null {
  return normalisePhone(value);
}

/** Point unmatched leads at this candidate. Safe to call more than once. */
export async function attachLeads(input: Identity & { actor?: string | null }): Promise<number> {
  const admin = getAdminSupabase();
  const email = cleanEmail(input.email);
  const phone = cleanPhone(input.phone);
  if (!admin || !input.candidateId || (!email && !phone)) return 0;

  const filters = [email ? `email.ilike.${email}` : '', phone ? `phone.eq.${phone}` : ''].filter(Boolean).join(',');
  const { data, error } = await admin
    .from('leads')
    .update({ candidate_id: input.candidateId })
    .is('candidate_id', null)
    .or(filters)
    .select('id');
  if (error) {
    console.error('[same-person] attach failed', error);
    return 0;
  }
  const ids = (data ?? []).map((row) => String(row.id));
  if (ids.length && input.actor) {
    await audit(input.actor, 'person.link', `candidate:${input.candidateId}`, { leads: ids });
  }
  return ids.length;
}

export async function findSamePerson(input: Identity): Promise<PersonLink> {
  const empty: PersonLink = { candidate: null, applications: [], leads: [] };
  const admin = getAdminSupabase();
  if (!admin) return empty;

  const email = cleanEmail(input.email);
  const phone = cleanPhone(input.phone);
  let candidateId = input.candidateId ?? null;

  if (!candidateId && (email || phone)) {
    const filters = [email ? `email.ilike.${email}` : '', phone ? `phone.eq.${phone}` : ''].filter(Boolean).join(',');
    const { data } = await admin.from('candidates').select('id').or(filters).is('erased_at', null).limit(1);
    candidateId = data?.[0] ? String(data[0].id) : null;
  }

  const candidateQuery = candidateId
    ? admin.from('candidates').select('id, full_name, email, phone').eq('id', candidateId).maybeSingle()
    : Promise.resolve({ data: null });

  const leadFilters = [
    candidateId ? `candidate_id.eq.${candidateId}` : '',
    email ? `email.ilike.${email}` : '',
    phone ? `phone.eq.${phone}` : '',
  ].filter(Boolean);

  const [candidateRow, applications, leads] = await Promise.all([
    candidateQuery,
    candidateId
      ? admin
          .from('applications')
          .select('id, reference, status, job_postings (title)')
          .eq('candidate_id', candidateId)
          .order('created_at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    leadFilters.length
      ? admin.from('leads').select('id, full_name, topic, status').or(leadFilters.join(',')).order('created_at', { ascending: false }).limit(8)
      : Promise.resolve({ data: [] }),
  ]);

  const candidate = candidateRow.data;
  const one = (value: unknown) => (Array.isArray(value) ? value[0] : value) as { title?: string } | undefined;

  return {
    candidate: candidate
      ? {
          id: String(candidate.id),
          fullName: String(candidate.full_name ?? ''),
          email: String(candidate.email ?? ''),
          phone: String(candidate.phone ?? ''),
        }
      : null,
    applications: (applications.data ?? [])
      .filter((row) => String(row.id) !== input.excludeApplicationId)
      .map((row) => ({
        id: String(row.id),
        reference: String(row.reference),
        status: String(row.status),
        jobTitle: String(one(row.job_postings)?.title ?? ''),
      })),
    leads: (leads.data ?? [])
      .filter((row) => String(row.id) !== input.excludeLeadId)
      .map((row) => ({
        id: String(row.id),
        fullName: String(row.full_name ?? ''),
        topic: String(row.topic),
        status: String(row.status),
      })),
  };
}
