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
 * VAT is inside the total, not added to it. The UAE rate is 5%, and a price
 * that grows at the till is the single most common reason somebody abandons a
 * checkout they had already decided to complete.
 *
 * It was 18% when this was an Indian product and the tax was India's OIDAR
 * charge on a foreign supplier of a digital service. The jurisdiction moved
 * with the rest of the business.
 */
export const VAT_RATE = 0.05;

function priceFromAed(aed: number) {
  const totalFils = aed * 100;
  const netFils = Math.round(totalFils / (1 + VAT_RATE));
  return { netFils, vatFils: totalFils - netFils, totalFils };
}

/**
 * The currency the candidate is actually charged in.
 *
 * AED is what the site quotes and what a candidate expects to see on their
 * statement. A candidate paying from outside the UAE has their own bank
 * convert, which is normal and visible; what is not acceptable is the site
 * quoting one currency and the charge arriving in another.
 *
 * CHARGE_CURRENCY=EUR falls back to the euro anchor rather than leaving the
 * checkout broken. Confirm AED presentment with the provider before assuming
 * the default works.
 */
export const CHARGE_CURRENCY: 'AED' | 'EUR' =
  process.env.CHARGE_CURRENCY === 'EUR' ? 'EUR' : 'AED';

export const PRICING = {
  early: priceFromAed(ASSESSMENT_FEE.aed),
  standard: priceFromAed(ASSESSMENT_FEE.aed),
  vatRate: VAT_RATE,
  currency: CHARGE_CURRENCY,
} as const;

/** Minor units in the charge currency: fils for AED, cents for EUR. */
export function chargeAmountMinor(): number {
  return CHARGE_CURRENCY === 'EUR' ? ASSESSMENT_FEE.eur * 100 : activePrice().totalFils;
}

export type PriceTier = 'early' | 'standard';

/** The tier on sale. A single price now; the tier survives for when that changes. */
export const ACTIVE_TIER: PriceTier = 'early';

export function activePrice() {
  return PRICING[ACTIVE_TIER];
}

/**
 * 9900 -> "AED 99".
 *
 * The three-letter code rather than the Arabic symbol. The audience is now
 * worldwide and reads the site in English or Hindi, and "AED" is unambiguous
 * to all of them in a way that "د.إ" is not.
 */
export function formatAed(fils: number): string {
  const dirhams = Math.round(fils / 100);
  return `AED ${dirhams.toLocaleString('en-US')}`;
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
