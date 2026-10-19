import { Mono } from '@/components/ui/Mono';
import { AdminShell, AdminHeading, AdminEmpty } from '@/components/employer/AdminShell';
import { PlacementState } from '@/components/employer/PlacementState';
import { requireStaffOrEmployer } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { PLACEMENT_STATES, stateLabel } from '@/lib/data/placements';

export const metadata = { title: 'Placements' };

/**
 * The case files.
 *
 * The low-volume, high-value side: each row is a person moving country, with a
 * contract, a visa and dates that matter. The state is an explicit machine and
 * every move is written to `placement_transitions`, so the history is the
 * record rather than the current value being the record.
 */
export default async function PlacementsPage() {
  const access = await requireStaffOrEmployer('/admin/placements');
  if (access.isStaff) await requirePermission('placements.manage', '/admin/placements');

  const supabase = await getServerSupabase();
  const { data } = (await supabase
    ?.from('placements')
    .select('id, role, state, salary_eur, housing_included, sla_due_at, created_at, candidates (full_name, city_state), employers (name)')
    .order('created_at', { ascending: false })) ?? { data: null };

  const rows = (data ?? []) as unknown as {
    id: string;
    role: string;
    state: string;
    salary_eur: string | null;
    housing_included: boolean;
    sla_due_at: string | null;
    created_at: string;
    candidates: { full_name: string; city_state: string | null } | null;
    employers: { name: string } | null;
  }[];

  return (
    <AdminShell current="/admin/placements" isStaff={access.isStaff} suffix="placements">
      <AdminHeading
        title="Placements"
        lead="One row per person moving. The state is what the file is waiting on, and every change is kept with who made it, so a question about why something took three weeks has an answer."
      />

      {rows.length === 0 ? (
        <AdminEmpty>
          No placements yet. One is opened from a shortlisted candidate once an employer commits
          to an offer.
        </AdminEmpty>
      ) : (
        <table className="mt-7 w-full border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">CANDIDATE</Mono></th>
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">ROLE</Mono></th>
              {access.isStaff && (
                <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">EMPLOYER</Mono></th>
              )}
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">TERMS</Mono></th>
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">STATE</Mono></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const overdue =
                row.sla_due_at !== null &&
                new Date(row.sla_due_at) < new Date() &&
                row.state !== PLACEMENT_STATES[PLACEMENT_STATES.length - 1];

              return (
                <tr key={row.id} className="border-b border-line-soft align-top">
                  <td className="py-3 pr-4">
                    {row.candidates?.full_name ?? '-'}
                    {row.candidates?.city_state && (
                      <span className="block text-[13px] text-muted">{row.candidates.city_state}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-ink-2">{row.role}</td>
                  {access.isStaff && <td className="py-3 pr-4 text-ink-2">{row.employers?.name ?? '-'}</td>}
                  <td className="py-3 pr-4 text-ink-2">
                    {row.salary_eur ? `€${Number(row.salary_eur).toLocaleString('en-GB')}` : '-'}
                    <span className="block text-[13px] text-muted">
                      {row.housing_included ? 'housing included' : 'no housing'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {access.isStaff ? (
                      <PlacementState id={row.id} state={row.state} />
                    ) : (
                      <span>{stateLabel(row.state)}</span>
                    )}
                    {overdue && (
                      <Mono className="mt-1 block text-accent-deep">
                        overdue since {new Date(row.sla_due_at as string).toLocaleDateString('en-GB')}
                      </Mono>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </AdminShell>
  );
}
