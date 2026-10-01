import { Mono } from '@/components/ui/Mono';
import { AdminShell, AdminHeading, AdminEmpty } from '@/components/employer/AdminShell';
import { AddEmployer } from '@/components/employer/AddEmployer';
import { requireStaff } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata = { title: 'Employers' };

/**
 * Employers, and whether anyone can actually sign in as one.
 *
 * The contact count is the column that matters. Before this screen existed
 * there was an employer row with no contacts, which looks fine in a database
 * and means the employer side of the product is unreachable.
 */
export default async function EmployersPage() {
  if (isSupabaseConfigured()) await requireStaff('/admin/employers');

  const admin = getAdminSupabase();
  const { data } = (await admin
    ?.from('employers')
    .select('id, name, country, vat_number, vetted_at, created_at, employer_users (auth_user_id)')
    .order('created_at', { ascending: false })) ?? { data: null };

  const rows = (data ?? []) as unknown as {
    id: string;
    name: string;
    country: string;
    vat_number: string | null;
    vetted_at: string | null;
    employer_users: { auth_user_id: string }[];
  }[];

  return (
    <AdminShell current="/admin/employers" isStaff suffix="employers">
      <AdminHeading
        title="Employers"
        lead="An employer with no contact cannot sign in, so adding one creates the company and its first login together."
      />

      <AddEmployer />

      {rows.length === 0 ? (
        <AdminEmpty>No employers yet.</AdminEmpty>
      ) : (
        <table className="mt-8 w-full border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">EMPLOYER</Mono></th>
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">COUNTRY</Mono></th>
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">VAT</Mono></th>
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">CONTACTS</Mono></th>
              <th className="py-2.5 pr-4 font-normal"><Mono className="text-muted">VETTED</Mono></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line-soft">
                <td className="py-3 pr-4">{row.name}</td>
                <td className="py-3 pr-4 text-ink-2">{row.country}</td>
                <td className="py-3 pr-4 text-ink-2">{row.vat_number ?? '-'}</td>
                <td className="py-3 pr-4">
                  {row.employer_users.length === 0 ? (
                    <span className="text-accent-deep">none, cannot sign in</span>
                  ) : (
                    <span className="text-ink-2">{row.employer_users.length}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <Mono className="text-muted">
                    {row.vetted_at ? new Date(row.vetted_at).toLocaleDateString('en-GB') : 'not yet'}
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
