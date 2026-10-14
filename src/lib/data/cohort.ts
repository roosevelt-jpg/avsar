/**
 * Cohort configuration.
 *
 * Every price, date and count below is a placeholder from the design handoff,
 * except the candidate fee. Fee amounts are held in paise so nothing in the
 * payment path ever touches a float.
 */

import { ASSESSMENT_FEE, PLACEMENT_FEE, RESPONSE_DAYS } from './brand';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const COHORT = {
  id: process.env.NEXT_PUBLIC_COHORT_ID ?? 'cohort-01',
  name: 'Cohort 01',
  corridor: 'India → Portugal',
  closesAt: '2026-11-30',
  reviewUntil: '2026-12-15',
  announceAt: '2027-01-15',
} as const;

/**
 * How many candidates have actually been assessed in this cohort.
 *
 * This used to be a constant, 20,418, with a comment calling it a placeholder.
 * It rendered on the staff search header as a plain figure next to the real
 * match count, which is how a placeholder becomes a number somebody repeats to
 * an employer. It is counted now.
 *
 * `cohortSize: 20000` and `selectedPerCohort: 1` lived here too, left over from
 * the one-in-twenty-thousand framing the meeting replaced with the published
 * funnel. Nothing read them any more, and the stale consent sentence they had
 * produced has already been rewritten, so they are gone rather than waiting to
 * be picked up by something new.
 */
export async function assessedCount(): Promise<number> {
  const supabase = getAdminSupabase();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('reports')
    .select('candidate_id', { count: 'exact', head: true });

  if (error) {
    console.error('[cohort] assessed count failed', error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Price, in paise, derived from the euro headline in `brand.ts`.
 *
 * One source. The fee appears on the landing page, in the hero meta, at
 * checkout and in the FAQ, and three of those disagreeing the first time
 * someone changes the price is how a candidate is charged more than the site
 * quoted.
 *
 * VAT is inside the total, not added to it. A price that grows at the till is
 * the single most common reason somebody abandons a checkout they had already
 * decided to complete.
 *
 * The rate moved with the seller, twice. It was 18% as India's OIDAR charge on
 * a foreign supplier of a digital service, then 5% as UAE VAT. It is 0 now, and
 * that needs saying out loud rather than looking like an oversight:
 *
 * The seller is a Portuguese company supplying a digital service to consumers.
 * To a consumer resident in the EU that is VAT of the consumer's own country,
 * declared through the OSS return. To a consumer resident outside the EU the
 * supply is outside the scope of EU VAT, and essentially every candidate this
 * platform has is outside the EU: India, Nepal, Bangladesh, Pakistan, Sri
 * Lanka, the Philippines, Egypt, Kenya.
 *
 * So 0 is right for the candidates who actually buy, and wrong for an EU one.
 * CONFIRM WITH THE ACCOUNTANT before the first EU resident pays, and if they do
 * the answer is per-country OSS rates keyed on residence, not a single rate
 * here. Until then the site states a total payable and does not break out a VAT
 * line it cannot stand behind.
 */
export const VAT_RATE = 0;

function priceFromTotal(totalMinor: number) {
  const netMinor = Math.round(totalMinor / (1 + VAT_RATE));
  return { netMinor, vatMinor: totalMinor - netMinor, totalMinor };
}

/**
 * The currency the candidate is charged in.
 *
 * Follows the payment rail, and is set with NEXT_PUBLIC_CHARGE_CURRENCY so the
 * server and the browser always agree on it:
 *
 *   INR  with PAYMENT_PROVIDER=eximpe (recommended for a UAE company), cashfree
 *        or razorpay. These collect rupees by UPI, RuPay and Indian net
 *        banking. EximPe and Cashfree hold RBI cross-border (PA-CB) licences, so
 *        the money can settle to a company outside India.
 *   EUR  with viva or stripe, which cannot take UPI.
 *
 * Defaults to EUR so an existing deployment keeps charging exactly what it
 * charged before this setting existed. /api/payments/checkout refuses to start
 * a payment when this and the rail disagree, rather than charging the wrong
 * currency.
 */
export const CHARGE_CURRENCY: 'INR' | 'EUR' = process.env.NEXT_PUBLIC_CHARGE_CURRENCY === 'INR' ? 'INR' : 'EUR';

const FEE_MINOR = CHARGE_CURRENCY === 'INR' ? Math.round(ASSESSMENT_FEE.inr * 100) : Math.round(ASSESSMENT_FEE.eur * 100);

export const PRICING = {
  early: priceFromTotal(FEE_MINOR),
  standard: priceFromTotal(FEE_MINOR),
  vatRate: VAT_RATE,
  currency: CHARGE_CURRENCY,
} as const;

/** Rails that can charge each currency. Used to refuse a mismatched configuration. */
export const RAIL_CURRENCIES: Record<string, readonly ('INR' | 'EUR')[]> = {
  eximpe: ['INR'],
  cashfree: ['INR'],
  razorpay: ['INR'],
  viva: ['EUR'],
  dodo: ['EUR', 'INR'],
  stripe: ['EUR', 'INR'],
};

/** Minor units in the charge currency: paise or euro cents. */
export function chargeAmountMinor(): number {
  return activePrice().totalMinor;
}

export type PriceTier = 'early' | 'standard';

/** The tier on sale. A single price now; the tier survives for when that changes. */
export const ACTIVE_TIER: PriceTier = 'early';

export function activePrice() {
  return PRICING[ACTIVE_TIER];
}

/**
 * 2500 -> "EUR 25".
 *
 * The three-letter code rather than the symbol. The audience is worldwide and
 * reads the site in English or Hindi, and "EUR" is unambiguous to all of them.
 */
export function formatPrice(minor: number): string {
  const units = Math.round(minor / 100);
  /*
    Wrapped in a Unicode isolate, because this string is dropped into Arabic
    sentences. Without it the bidi algorithm can reorder the figure against the
    surrounding right-to-left text. The two characters are invisible elsewhere.
  */
  return CHARGE_CURRENCY === 'INR'
    ? `\u2066₹${units.toLocaleString('en-IN')}\u2069`
    : `\u2066EUR ${units.toLocaleString('en-US')}\u2069`;
}

/**
 * Placement fee, in euros.
 *
 * Whether a candidate or an employer pays this is the open commercial question,
 * and it is the one with legal consequences. See `PLACEMENT_FEE` in brand.ts.
 */
export const EMPLOYER_PRICE_EUR = PLACEMENT_FEE.eur;

/** Working days to an answer. Re-exported so copy has one import. */
export const ANSWER_WITHIN_DAYS = RESPONSE_DAYS;
