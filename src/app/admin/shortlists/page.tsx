import Link from 'next/link';
import { Mono } from '@/components/ui/Mono';
import { AdminShell, AdminHeading, AdminEmpty } from '@/components/employer/AdminShell';
import { requireStaffOrEmployer } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { sectorLabel, SECTOR_SLUGS, type SectorSlug } from '@/lib/data/sectors';
import { maskName } from '@/lib/hiring/redact';

export const metadata = { title: 'Shortlists' };

/**
 * Who an employer has kept.
 *
 * Read through the request-scoped client, so RLS decides whose shortlist this
 * is. Staff see every employer's, because resolving a placement means knowing
 * who is interested in whom; an employer sees only their own, and the query is
 * the same either way.
 */
/** The sector is nullable until the profile step, so it is narrowed here. */
function labelFor(sector: string | null | undefined): string {
  if (sector && (SECTOR_SLUGS as readonly string[]).includes(sector)) {
    return sectorLabel(sector as SectorSlug);
  }
  return '-';
}

export default async function ShortlistsPage() {
  const access = isSupabaseConfigured()
    ? await requireStaffOrEmployer('/admin/shortlists')
    : { isStaff: true, label: 'Preview' };

  const supabase = await getServerSupabase();
  const { data } = (await supabase
    ?.from('shortlist_entries')
    .select(
      'created_at, note, employers (name), candidates (id, full_name, sector, position, city_state, payment_status)',
    )
    .order('created_at', { ascending: false })) ?? { data: null };

  const rows = (data ?? []) as unknown as {
    created_at: string;
    note: string | null;
    employers: { name: string } | null;
    candidates: {
      id: string;
      full_name: string;
      sector: string | null;
      position: string | null;
      city_state: string | null;
    } | null;
  }[];

  /* Employers see the same shortened names as in search, unless we released the identity. */
  let released = new Set<string>();
  if (!access.isStaff && supabase && rows.length) {
    const { data: unlocks } = await supabase.from('profile_unlock_requests').select('candidate_id').eq('status', 'approved');
    released = new Set((unlocks ?? []).map((u) => String(u.candidate_id)));
  }
  const displayName = (c: { id: string; full_name: string }) => (access.isStaff || released.has(c.id) ? c.full_name : maskName(c.full_name));

  return (
    <AdminShell current="/admin/shortlists" isStaff={access.isStaff} suffix="shortlists">
      <AdminHeading
        title="Shortlists"
        lead={
          access.isStaff
            ? 'Every employer’s shortlist. A candidate appearing on more than one is not a conflict: it is the signal to move them to a placement before someone else does.'
            : 'Candidates you have kept. Shortlisting tells us you are interested; it does not reserve anyone.'
        }
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          Nothing shortlisted yet. Keep a candidate from the search and they appear here.
        </AdminEmpty>
      ) : (
        <table className="mt-7 w-full border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2.5 pr-4 font-normal">
                <Mono className="text-muted">CANDIDATE</Mono>
              </th>
              <th className="py-2.5 pr-4 font-normal">
                <Mono className="text-muted">ROLE</Mono>
              </th>
              {access.isStaff && (
                <th className="py-2.5 pr-4 font-normal">
                  <Mono className="text-muted">EMPLOYER</Mono>
                </th>
              )}
              <th className="py-2.5 pr-4 font-normal">
                <Mono className="text-muted">KEPT</Mono>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.employers?.name}-${row.candidates?.id}`}
                className="border-b border-line-soft"
              >
                <td className="py-3 pr-4">
                  {row.candidates ? (
                    <Link href={`/admin?q=${encodeURIComponent(displayName(row.candidates))}`} className="prose-link">
                      {displayName(row.candidates)}
                    </Link>
                  ) : (
                    <span className="text-muted">Removed</span>
                  )}
                  {row.candidates?.city_state && (
                    <span className="block text-[13px] text-muted">{row.candidates.city_state}</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-ink-2">
                  {row.candidates?.position ?? labelFor(row.candidates?.sector)}
                </td>
                {access.isStaff && (
                  <td className="py-3 pr-4 text-ink-2">{row.employers?.name ?? '-'}</td>
                )}
                <td className="py-3 pr-4">
                  <Mono className="text-muted">
                    {new Date(row.created_at).toLocaleDateString('en-GB')}
                  </Mono>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminShell>
  );
}
