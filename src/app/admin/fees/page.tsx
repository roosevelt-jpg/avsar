import Link from 'next/link';
import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { FeeEditor } from '@/components/admin/HiringActions';
import { Mono } from '@/components/ui/Mono';
import { FEE_STATUS_LABELS, FEE_STATUSES, listEmployerFees, type FeeStatus } from '@/lib/hiring/data';
import { can, requirePermission } from '@/lib/rbac/server';

export const metadata = { title: 'Employer fees' };

const euros = (minor: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(minor / 100);

/**
 * Placement fees owed by employers, one per hire, created when an
 * application is moved to "hired". Candidates are never charged a placement
 * fee, so nothing here is ever addressed to a candidate.
 */
export default async function AdminFees({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const access = await requirePermission('payments.view', '/admin/fees');
  const { status: raw } = await searchParams;
  const status = FEE_STATUSES.includes(raw as FeeStatus) ? (raw as FeeStatus) : undefined;
  const fees = await listEmployerFees(status);
  const editable = can(access, 'fees.manage');
  const outstanding = fees.filter((f) => f.status === 'pending' || f.status === 'invoiced').reduce((sum, f) => sum + f.amountMinor, 0);

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[13px] no-underline ${active ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2 hover:border-ink'}`;

  return (
    <AdminShell current="/admin/fees" isStaff>
      <AdminHeading
        title="Employer fees"
        lead={`Placement fees, created automatically when an application is marked hired on an employer's vacancy. Outstanding in this view: ${euros(outstanding)}.`}
      />
      <nav aria-label="Status" className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/fees" className={chip(!status)}>All</Link>
        {FEE_STATUSES.map((s) => (
          <Link key={s} href={`/admin/fees?status=${s}`} className={chip(status === s)}>{FEE_STATUS_LABELS[s]}</Link>
        ))}
      </nav>

      {fees.length === 0 ? (
        <AdminEmpty>No fees in this view.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-7 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Employer', 'Hire', 'Amount', 'Status', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} className="border-b border-line-soft align-top last:border-0">
                  <td className="px-4 py-3 font-medium">{fee.employerName}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${fee.applicationId}`} className="text-ink no-underline hover:text-employer">{fee.candidateName}</Link>
                    <span className="block text-[13px] text-muted">{fee.jobTitle} · {fee.reference}</span>
                  </td>
                  <td className="px-4 py-3"><Mono>{euros(fee.amountMinor)}</Mono></td>
                  <td className="px-4 py-3">
                    <Pill tone={fee.status === 'paid' ? 'success' : fee.status === 'waived' ? 'muted' : 'accent'}>{FEE_STATUS_LABELS[fee.status]}</Pill>
                    {fee.invoiceRef && <Mono className="block text-muted">{fee.invoiceRef}</Mono>}
                  </td>
                  <td className="px-4 py-3">{editable && <FeeEditor id={fee.id} status={fee.status} invoiceRef={fee.invoiceRef} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
