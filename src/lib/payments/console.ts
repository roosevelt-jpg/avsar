import { getAdminSupabase } from '@/lib/supabase/admin';
import type { ChargeCurrency } from '@/lib/company/config';

export type PaymentRow = {
  id: string;
  receipt: string;
  provider: string;
  providerOrderId: string;
  amountMinor: number;
  currency: ChargeCurrency;
  status: string;
  methodHint: string | null;
  createdAt: string;
  paidAt: string | null;
  candidate: { name: string; email: string };
};

/** Rails that settle Indian rupees or dirhams; everything else on this platform charges euros. */
const INR_RAILS = new Set(['eximpe', 'cashfree', 'razorpay']);
const AED_RAILS = new Set(['ngenius']);

function railCurrency(provider: string): ChargeCurrency {
  if (INR_RAILS.has(provider)) return 'INR';
  if (AED_RAILS.has(provider)) return 'AED';
  return 'EUR';
}

export function formatMinor(minor: number, currency: ChargeCurrency): string {
  const units = minor / 100;
  if (currency === 'INR') return `₹${units.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  if (currency === 'AED') return `AED ${units.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
  return `€${units.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
}

export async function listPayments(status?: string, limit = 200): Promise<PaymentRow[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  let query = admin
    .from('payments')
    .select('id, receipt_no, provider, provider_order_id, amount_paise, status, method_hint, created_at, paid_at, candidates (full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) console.error('[payments] console list failed', error);
  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const c = (Array.isArray(row.candidates) ? row.candidates[0] : row.candidates) as { full_name?: string; email?: string } | null;
    const provider = String(row.provider);
    return {
      id: String(row.id),
      receipt: String(row.receipt_no),
      provider,
      providerOrderId: String(row.provider_order_id),
      amountMinor: Number(row.amount_paise ?? 0),
      currency: railCurrency(provider),
      status: String(row.status),
      methodHint: (row.method_hint as string | null) ?? null,
      createdAt: String(row.created_at),
      paidAt: (row.paid_at as string | null) ?? null,
      candidate: { name: c?.full_name ?? '', email: c?.email ?? '' },
    };
  });
}
