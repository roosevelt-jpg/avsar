import { asPaidProduct, type ChargeCurrency, type PaidProduct } from '@/lib/company/config';
import { getAdminSupabase } from '@/lib/supabase/admin';

export type CandidateReceipt = {
  id: string;
  receiptNo: string;
  product: PaidProduct;
  amountMinor: number;
  methodHint: string | null;
  provider: string;
  /** What checkout/gateway charged; null on older rows before currency was stored. */
  currency: ChargeCurrency | null;
  paidAt: string;
};

/**
 * Paid rows for the signed-in candidate, newest first.
 *
 * Called only after requireCandidate on the dashboard. Service role is used
 * because the candidate's own RLS may not expose every historical payment
 * column we need for the receipt card.
 */
export async function listCandidateReceipts(candidateId: string): Promise<CandidateReceipt[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];

  /* currency is on migration 0044; fall back so receipts still render before it lands. */
  const primary = await admin
    .from('payments')
    .select('id, receipt_no, product, amount_paise, method_hint, provider, currency, paid_at, status')
    .eq('candidate_id', candidateId)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false });

  let rows: Record<string, unknown>[] | null = (primary.data as Record<string, unknown>[] | null) ?? null;
  let error = primary.error;
  if (error?.code === '42703' || /currency/i.test(error?.message ?? '')) {
    const fallback = await admin
      .from('payments')
      .select('id, receipt_no, product, amount_paise, method_hint, provider, paid_at, status')
      .eq('candidate_id', candidateId)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false });
    rows = (fallback.data as Record<string, unknown>[] | null) ?? null;
    error = fallback.error;
  }

  if (error) {
    console.error('[payments] candidate receipts failed', error);
    return [];
  }

  const out: CandidateReceipt[] = [];
  for (const row of rows ?? []) {
    const paidAt = typeof row.paid_at === 'string' ? row.paid_at : null;
    if (!paidAt) continue;
    const rawCurrency = typeof row.currency === 'string' ? row.currency : null;
    const currency: ChargeCurrency | null =
      rawCurrency === 'INR' || rawCurrency === 'EUR' || rawCurrency === 'AED' ? rawCurrency : null;
    out.push({
      id: String(row.id),
      receiptNo: String(row.receipt_no ?? ''),
      product: asPaidProduct(row.product),
      amountMinor: Number(row.amount_paise ?? 0),
      methodHint: (row.method_hint as string | null) ?? null,
      provider: String(row.provider ?? ''),
      currency,
      paidAt,
    });
  }
  return out;
}

export function receiptProductLabel(product: PaidProduct): string {
  if (product === 'skills_report') return 'Skills report';
  if (product === 'visa_requirements') return 'Visa requirements';
  if (product === 'bundle') return 'Skills report and visa requirements';
  return 'Career package';
}

export function receiptMethodLabel(hint: string | null): string {
  if (hint === 'upi') return 'UPI';
  if (hint === 'card') return 'Card';
  if (hint === 'netbanking') return 'Net banking';
  if (hint === 'apple_pay') return 'Apple Pay';
  if (hint === 'samsung_pay') return 'Samsung Pay';
  if (hint === 'google_pay') return 'Google Pay';
  return 'Online payment';
}

/**
 * Prefer the currency stored on the payment. Older rows fall back to today's
 * charge currency rather than guessing from the rail name (CCAvenue can be
 * AED or INR depending on the outlet).
 */
export function receiptCurrency(
  stored: ChargeCurrency | null,
  fallback: ChargeCurrency,
): ChargeCurrency {
  return stored ?? fallback;
}
