import 'server-only';
import { can, type StaffAccess } from '@/lib/rbac/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export type SearchHit = { kind: SearchKind; id: string; title: string; detail: string; href: string };
export type SearchKind = 'candidate' | 'application' | 'job' | 'employer' | 'lead' | 'staff' | 'payment';

const PER_KIND = 5;

/**
 * Text safe to put inside a PostgREST or() filter: commas, brackets and the
 * wildcard would otherwise change the filter itself, not just what it matches.
 */
export function searchTerm(raw: string): string {
  return raw.replace(/[%,()*\\:"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

type Row = Record<string, unknown>;
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const one = (value: unknown): Row => (Array.isArray(value) ? ((value[0] as Row | undefined) ?? {}) : ((value as Row | null) ?? {}));

/**
 * One search across the platform, run with the service role. Every section is
 * gated by the same permission as the page its results open, so a person can
 * only find what they could already have reached by clicking. Callers must
 * have checked that `access` is a signed-in staff member first.
 */
export async function searchConsole(access: StaffAccess, raw: string): Promise<SearchHit[]> {
  const q = searchTerm(raw);
  const admin = getAdminSupabase();
  if (!admin || q.length < 2) return [];
  const like = `%${q}%`;
  const tasks: Promise<SearchHit[]>[] = [];

  if (can(access, 'candidates.view')) {
    tasks.push(
      (async () => {
        const { data } = await admin
          .from('candidates')
          .select('id, full_name, email, phone, sector')
          .is('erased_at', null)
          .or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
          .limit(PER_KIND);
        /* There is no single candidate page; open the most useful one this
           person is allowed to see. */
        const target = (row: Row) =>
          can(access, 'privacy.manage')
            ? `/admin/privacy?candidate=${text(row.id)}`
            : can(access, 'applications.view')
              ? `/admin/applications?q=${encodeURIComponent(text(row.email))}`
              : `/admin?q=${encodeURIComponent(text(row.full_name))}`;
        return (data ?? []).map((row: Row) => ({
          kind: 'candidate' as const,
          id: text(row.id),
          title: text(row.full_name) || text(row.email),
          detail: [text(row.email), text(row.phone), text(row.sector)].filter(Boolean).join(' · '),
          href: target(row),
        }));
      })(),
    );
  }

  if (can(access, 'applications.view')) {
    tasks.push(
      (async () => {
        const columns = 'id, reference, status, candidates!inner (full_name, email), job_postings (title, city)';
        const [byPerson, byReference] = await Promise.all([
          admin.from('applications').select(columns).or(`full_name.ilike.${like},email.ilike.${like}`, { referencedTable: 'candidates' }).order('status_changed_at', { ascending: false }).limit(PER_KIND),
          admin.from('applications').select(columns).ilike('reference', like).limit(PER_KIND),
        ]);
        const rows = new Map<string, Row>();
        for (const row of [...(byReference.data ?? []), ...(byPerson.data ?? [])] as Row[]) rows.set(text(row.id), row);
        return [...rows.values()].slice(0, PER_KIND).map((row) => {
          const candidate = one(row.candidates);
          const job = one(row.job_postings);
          return {
            kind: 'application' as const,
            id: text(row.id),
            title: `${text(candidate.full_name)} → ${text(job.title)}`,
            detail: [text(row.reference), text(row.status), text(job.city)].filter(Boolean).join(' · '),
            href: `/admin/applications/${text(row.id)}`,
          };
        });
      })(),
    );
  }

  if (can(access, 'jobs.view')) {
    tasks.push(
      (async () => {
        const { data } = await admin
          .from('job_postings')
          .select('id, title, city, status, employer_display')
          .or(`title.ilike.${like},city.ilike.${like},employer_display.ilike.${like}`)
          .limit(PER_KIND);
        return (data ?? []).map((row: Row) => ({
          kind: 'job' as const,
          id: text(row.id),
          title: text(row.title),
          detail: [text(row.city), text(row.employer_display), text(row.status)].filter(Boolean).join(' · '),
          href: `/admin/jobs/${text(row.id)}`,
        }));
      })(),
    );
  }

  if (can(access, 'employers.manage')) {
    tasks.push(
      (async () => {
        const { data } = await admin.from('employers').select('id, name').ilike('name', like).limit(PER_KIND);
        return (data ?? []).map((row: Row) => ({
          kind: 'employer' as const,
          id: text(row.id),
          title: text(row.name),
          detail: 'Employer',
          href: '/admin/employers',
        }));
      })(),
    );
  }

  if (can(access, 'leads.manage')) {
    tasks.push(
      (async () => {
        const { data } = await admin
          .from('leads')
          .select('id, full_name, email, phone, company, status, topic')
          .or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like},company.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(PER_KIND);
        return (data ?? []).map((row: Row) => ({
          kind: 'lead' as const,
          id: text(row.id),
          title: text(row.company) || text(row.full_name) || text(row.email),
          detail: [text(row.company) ? text(row.full_name) : '', text(row.email), text(row.status)].filter(Boolean).join(' · '),
          href: `/admin/inbox/${text(row.id)}`,
        }));
      })(),
    );
  }

  if (can(access, 'staff.manage')) {
    tasks.push(
      (async () => {
        const { data } = await admin
          .from('staff_users')
          .select('auth_user_id, email, full_name, role')
          .or(`email.ilike.${like},full_name.ilike.${like}`)
          .limit(PER_KIND);
        return (data ?? []).map((row: Row) => ({
          kind: 'staff' as const,
          id: text(row.auth_user_id),
          title: text(row.full_name) || text(row.email),
          detail: [text(row.email), text(row.role)].filter(Boolean).join(' · '),
          href: '/admin/staff',
        }));
      })(),
    );
  }

  if (can(access, 'payments.view')) {
    tasks.push(
      (async () => {
        const { data } = await admin
          .from('payments')
          .select('id, receipt_no, provider_order_id, status, amount_paise, candidates (full_name)')
          .or(`receipt_no.ilike.${like},provider_order_id.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(PER_KIND);
        return (data ?? []).map((row: Row) => ({
          kind: 'payment' as const,
          id: text(row.id),
          title: text(row.receipt_no) || text(row.provider_order_id),
          detail: [text(one(row.candidates).full_name), text(row.status)].filter(Boolean).join(' · '),
          href: '/admin/payments',
        }));
      })(),
    );
  }

  /* One failing section (a missing column on an older database) must not
     blank the others. */
  const settled = await Promise.allSettled(tasks);
  return settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}
