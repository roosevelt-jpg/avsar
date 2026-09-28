/**
 * Cohort configuration.
 *
 * Every price, date and count below is a placeholder from the design handoff,
 * except the candidate fee. Fee amounts are held in paise so nothing in the
 * payment path ever touches a float.
 */

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

/** Early-bird and standard pricing, in paise. GST is included in the total. */
export const PRICING = {
  early: { netPaise: 169_400, gstPaise: 30_500, totalPaise: 199_900 },
  standard: { netPaise: 211_800, gstPaise: 38_100, totalPaise: 249_900 },
  gstRate: 0.18,
  currency: 'INR',
} as const;

export type PriceTier = keyof Pick<typeof PRICING, 'early' | 'standard'>;

/** The tier on sale. Flip to 'standard' when early registration closes. */
export const ACTIVE_TIER: PriceTier = 'early';

export function activePrice() {
  return PRICING[ACTIVE_TIER];
}

/** 199900 -> "₹1,999". Indian digit grouping, no decimals. */
export function formatInr(paise: number): string {
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString('en-IN')}`;
}

/** Employer pricing placeholder from the handoff. */
export const EMPLOYER_PRICE_EUR = 1800;
