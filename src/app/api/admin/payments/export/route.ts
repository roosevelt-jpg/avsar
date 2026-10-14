import { NextResponse } from 'next/server';
import { apiPermission } from '@/lib/rbac/server';
import { listPayments } from '@/lib/payments/console';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  /* Leading = + - @ would be run as a formula by Excel. */
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Payments as CSV for the accountant. Logged, because it contains personal data. */
export async function GET(request: Request) {
  const guard = await apiPermission('payments.view');
  if (guard instanceof NextResponse) return guard;
  const status = new URL(request.url).searchParams.get('status') ?? undefined;
  const rows = await listPayments(status, 10000);

  const header = ['receipt', 'candidate', 'email', 'amount', 'currency', 'status', 'provider', 'provider_order_id', 'method', 'created_at', 'paid_at'];
  const lines = rows.map((r) =>
    [r.receipt, r.candidate.name, r.candidate.email, (r.amountMinor / 100).toFixed(2), r.currency, r.status, r.provider, r.providerOrderId, r.methodHint, r.createdAt, r.paidAt]
      .map(csvCell)
      .join(','),
  );
  await audit(guard.userId, 'payments.export', 'payments', { rows: rows.length, status });

  return new NextResponse([header.join(','), ...lines].join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
