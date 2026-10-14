import { getAdminSupabase } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type PaymentRow = {
  id: string;
  receipt: string;
  provider: string;
  providerOrderId: string;
  amountMinor: number;
  currency: 'INR' | 'EUR';
  status: string;
  methodHint: string | null;
  createdAt: string;
  paidAt: string | null;
  candidate: { name: string; email: string };
};

/** Rails that settle Indian rupees; everything else on this platform charges euros. */
const INR_RAILS = new Set(['eximpe', 'cashfree', 'razorpay']);

export function formatMinor(minor: number, currency: 'INR' | 'EUR'): string {
  const units = minor / 100;
  return currency === 'INR'
    ? `₹${units.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    : `€${units.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
}

export async function listPayments(status?: string, limit = 200): Promise<PaymentRow[]> {
  if (!isSupabaseConfigured()) {
    return [
      { id: 'p1', receipt: 'SA-01-000412', provider: 'eximpe', providerOrderId: 'order_demo_1', amountMinor: 240000, currency: 'INR', status: 'paid', methodHint: 'upi', createdAt: '2026-10-12T08:10:00Z', paidAt: '2026-10-12T08:11:00Z', candidate: { name: 'Arjun Nair', email: 'arjun@example.com' } },
      { id: 'p2', receipt: 'SA-01-000413', provider: 'eximpe', providerOrderId: 'order_demo_2', amountMinor: 240000, currency: 'INR', status: 'created', methodHint: 'upi', createdAt: '2026-10-13T11:40:00Z', paidAt: null, candidate: { name: 'Priya Sharma', email: 'priya@example.com' } },
    ];
  }
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
      currency: INR_RAILS.has(provider) ? 'INR' : 'EUR',
      status: String(row.status),
      methodHint: (row.method_hint as string | null) ?? null,
      createdAt: String(row.created_at),
      paidAt: (row.paid_at as string | null) ?? null,
      candidate: { name: c?.full_name ?? '', email: c?.email ?? '' },
    };
  });
}
