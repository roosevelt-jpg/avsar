import { asPaidProduct, type ChargeCurrency, type PaidProduct } from '@/lib/company/config';
import { getAdminSupabase } from '@/lib/supabase/admin';

export type CandidateReceipt = {
  id: string;
  receiptNo: string;
  product: PaidProduct;
  amountMinor: number;
  methodHint: string | null;
  provider: string;
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

  const { data, error } = await admin
    .from('payments')
    .select('id, receipt_no, product, amount_paise, method_hint, provider, paid_at, status')
    .eq('candidate_id', candidateId)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false });

  if (error) {
    console.error('[payments] candidate receipts failed', error);
    return [];
  }

  const out: CandidateReceipt[] = [];
  for (const row of data ?? []) {
    const paidAt = typeof row.paid_at === 'string' ? row.paid_at : null;
    if (!paidAt) continue;
    out.push({
      id: String(row.id),
      receiptNo: String(row.receipt_no ?? ''),
      product: asPaidProduct(row.product),
      amountMinor: Number(row.amount_paise ?? 0),
      methodHint: (row.method_hint as string | null) ?? null,
      provider: String(row.provider ?? ''),
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

/** Currency for display when the payments row has none of its own. */
export function receiptCurrency(provider: string, fallback: ChargeCurrency): ChargeCurrency {
  if (provider === 'ngenius') return 'AED';
  if (
    provider === 'ccavenue' ||
    provider === 'eximpe' ||
    provider === 'cashfree' ||
    provider === 'razorpay' ||
    provider === 'paytm'
  ) {
    return fallback === 'AED' || fallback === 'INR' ? fallback : 'INR';
  }
  return fallback;
}
