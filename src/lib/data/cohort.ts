/**
 * Cohort configuration.
 *
 * Every price, date and count below is a placeholder from the design handoff,
 * except the candidate fee. Fee amounts are held in paise so nothing in the
 * payment path ever touches a float.
 */

import { ASSESSMENT_FEE, PLACEMENT_FEE, RESPONSE_DAYS } from './brand';

export const COHORT = {
  id: process.env.NEXT_PUBLIC_COHORT_ID ?? 'cohort-01',
  name: 'Cohort 01',
  corridor: 'India → Portugal',
  closesAt: '2026-11-30',
  reviewUntil: '2026-12-15',
  announceAt: '2027-01-15',
  /** Placeholder count shown in the admin header. */
  assessedCount: 20418,
  /** Disclosed selection odds. Shown on the landing page, checkout and FAQ. */
  cohortSize: 20000,
  selectedPerCohort: 1,
} as const;

/**
 * Price, in paise, derived from the euro headline in `brand.ts`.
 *
 * One source. The fee appears on the landing page, in the hero meta, at
 * checkout and in the FAQ, and three of those disagreeing the first time
 * someone changes the price is how a candidate is charged more than the site
 * quoted.
 *
 * GST is inside the total, not added to it. India's OIDAR regime makes a
 * foreign supplier of a digital service liable for 18% on a sale to an Indian
 * consumer, so the tax is the platform's to pay out of what it collects rather
 * than a surcharge at the till.
 */
export const GST_RATE = 0.18;

function priceFromInr(inr: number) {
  const totalPaise = inr * 100;
  const netPaise = Math.round(totalPaise / (1 + GST_RATE));
  return { netPaise, gstPaise: totalPaise - netPaise, totalPaise };
}

/**
 * The currency the candidate is actually charged in.
 *
 * INR is what the site quotes and what a candidate expects to see on their
 * statement. Not every provider can present in rupees from a European account,
 * and when it cannot, the candidate's own bank converts and adds a
 * foreign-transaction fee on top of a price the site advertised in rupees.
 *
 * CHARGE_CURRENCY=EUR falls back to the euro headline rather than leaving the
 * checkout broken. Confirm INR presentment with the provider before assuming
 * the default works.
 */
export const CHARGE_CURRENCY: 'INR' | 'EUR' =
  process.env.CHARGE_CURRENCY === 'EUR' ? 'EUR' : 'INR';

export const PRICING = {
  early: priceFromInr(ASSESSMENT_FEE.inr),
  standard: priceFromInr(ASSESSMENT_FEE.inr),
  gstRate: GST_RATE,
  currency: CHARGE_CURRENCY,
} as const;

/** Minor units in the charge currency: paise for INR, cents for EUR. */
export function chargeAmountMinor(): number {
  return CHARGE_CURRENCY === 'EUR' ? ASSESSMENT_FEE.eur * 100 : activePrice().totalPaise;
}

export type PriceTier = 'early' | 'standard';

/** The tier on sale. A single price now; the tier survives for when that changes. */
export const ACTIVE_TIER: PriceTier = 'early';

export function activePrice() {
  return PRICING[ACTIVE_TIER];
}

/** 199900 -> "₹1,999". Indian digit grouping, no decimals. */
export function formatInr(paise: number): string {
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString('en-IN')}`;
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
