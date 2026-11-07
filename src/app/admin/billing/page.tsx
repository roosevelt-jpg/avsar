import { AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { formatMoney, type ChargeCurrency } from '@/lib/company/config';
import { listOwnEmployerFees, requireEmployerPortal } from '@/lib/employer/portal';

export const metadata = { title: 'Billing & Plans' };

/**
 * Employer Billing & Plans from the HTML-44 pack. Read-only view of placement
 * fees already recorded for this employer; payments stay with staff.
 */
export default async function EmployerBillingPage() {
  const portal = await requireEmployerPortal('/admin/billing', '/admin/fees');
  const fees = await listOwnEmployerFees(portal);
  const open = fees.filter((f) => f.status === 'open' || f.status === 'invoiced').length;
  const paid = fees.filter((f) => f.status === 'paid').length;

  return (
    <AdminShell current="/admin/billing" isStaff={false} suffix="employer">
      <AdminHeading
        title="Billing & Plans"
        lead="Placement fees linked to your hires. Questions about an invoice go to your recruiter — employers do not pay candidates."
      />

      <div className="sa-kpis mt-6">
        <div className="sa-kpi">
          <strong>{fees.length}</strong>
          <span>Fee lines</span>
        </div>
        <div className="sa-kpi">
          <strong>{open}</strong>
          <span>Open / invoiced</span>
        </div>
        <div className="sa-kpi">
          <strong>{paid}</strong>
          <span>Paid</span>
        </div>
        <div className="sa-kpi">
          <strong>—</strong>
          <span>Self-serve checkout</span>
        </div>
      </div>

      {fees.length === 0 ? (
        <AdminEmpty>
          No fees recorded yet. When a hire is confirmed and a placement fee is raised, it will appear here.
        </AdminEmpty>
      ) : (
        <div className="sa-tablewrap mt-4">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Reference</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Role</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Candidate</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Amount</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Status</th>
                <th className="bg-[#f8fafc] px-4 py-3 text-left text-[12px] font-semibold text-[#526477]">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} className="border-t border-[#e9edf2]">
                  <td className="px-4 py-3">
                    <Mono>{fee.reference || '—'}</Mono>
                  </td>
                  <td className="px-4 py-3 text-[#5c7084]">{fee.jobTitle || '—'}</td>
                  <td className="px-4 py-3 text-[#142438]">{fee.candidateName || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-[#142438]">
                    {formatMoney(fee.amountMinor, (fee.currency as ChargeCurrency) || 'EUR')}
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={fee.status === 'paid' ? 'success' : 'neutral'}>{fee.status}</Pill>
                  </td>
                  <td className="px-4 py-3 text-[#5c7084]">{fee.invoiceRef || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
