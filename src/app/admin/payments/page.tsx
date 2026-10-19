import Link from 'next/link';
import { AdminButton, AdminEmpty, AdminHeading, AdminShell, Pill } from '@/components/employer/AdminShell';
import { Mono } from '@/components/ui/Mono';
import { formatMinor, listPayments } from '@/lib/payments/console';
import { getPaymentProvider } from '@/lib/payments';
import { requirePermission } from '@/lib/rbac/server';
import type { ChargeCurrency } from '@/lib/company/config';

export const metadata = { title: 'Payments' };

const STATUSES = ['paid', 'created', 'failed', 'refunded', 'simulated'] as const;

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePermission('payments.view', '/admin/payments');
  const { status: raw } = await searchParams;
  const status = (STATUSES as readonly string[]).includes(raw ?? '') ? raw : undefined;
  const payments = await listPayments(status);

  const totals = payments
    .filter((p) => p.status === 'paid')
    .reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.currency]: (acc[p.currency] ?? 0) + p.amountMinor }), {});

  return (
    <AdminShell current="/admin/payments" isStaff>
      <AdminHeading
        title="Payments"
        lead={`Assessment fees collected on this site. The active rail is ${getPaymentProvider().name}. The webhook is the source of truth: a payment shows as paid only after the provider confirms it.`}
        actions={<AdminButton href={`/api/admin/payments/export${status ? `?status=${status}` : ''}`} variant="light">Export CSV</AdminButton>}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        {Object.entries(totals).map(([currency, minor]) => (
          <div key={currency} className="rounded-[16px] border border-line bg-surface px-5 py-4">
            <Mono className="text-muted">PAID IN THIS LIST · {currency}</Mono>
            <p className="m-0 mt-1 text-[26px] font-semibold tracking-[-0.02em]">{formatMinor(minor, currency as ChargeCurrency)}</p>
          </div>
        ))}
      </div>

      <nav aria-label="Status" className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/payments" className={`rounded-full border px-3 py-1 text-[13px] no-underline ${!status ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2'}`}>All</Link>
        {STATUSES.map((value) => (
          <Link key={value} href={`/admin/payments?status=${value}`} className={`rounded-full border px-3 py-1 text-[13px] capitalize no-underline ${status === value ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-2'}`}>
            {value}
          </Link>
        ))}
      </nav>

      {payments.length === 0 ? (
        <AdminEmpty>No payments yet.</AdminEmpty>
      ) : (
        <div className="scroll-x mt-6 rounded-[16px] border border-line bg-surface">
          <table className="w-full min-w-[900px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line">
                {['Receipt', 'Candidate', 'Amount', 'Status', 'Rail', 'Method', 'Created', 'Paid'].map((h) => (
                  <th key={h} className="px-4 py-3 text-start font-normal"><Mono className="text-muted">{h.toUpperCase()}</Mono></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-mono text-[13px]">{p.receipt}</td>
                  <td className="px-4 py-3">{p.candidate.name}<span className="block text-[12px] text-muted">{p.candidate.email}</span></td>
                  <td className="px-4 py-3 font-medium">{formatMinor(p.amountMinor, p.currency)}</td>
                  <td className="px-4 py-3"><Pill tone={p.status === 'paid' ? 'success' : p.status === 'failed' ? 'accent' : 'neutral'}>{p.status}</Pill></td>
                  <td className="px-4 py-3 text-ink-2">{p.provider}</td>
                  <td className="px-4 py-3 uppercase text-ink-2">{p.methodHint ?? '-'}</td>
                  <td className="px-4 py-3"><Mono className="text-muted">{new Date(p.createdAt).toLocaleString('en-GB')}</Mono></td>
                  <td className="px-4 py-3"><Mono className="text-muted">{p.paidAt ? new Date(p.paidAt).toLocaleString('en-GB') : '-'}</Mono></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
