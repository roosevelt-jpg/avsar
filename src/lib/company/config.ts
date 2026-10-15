/**
 * Company, pricing and hiring terms: the facts a meeting can change.
 *
 * They are site settings (keys `company`, `pricing`, `hiring`, `cohort`),
 * edited by super admins on Settings › Company & pricing, and every change is
 * audited. The values below are the starting values a fresh database is
 * seeded with, not a second source: once a row is saved, the row wins.
 *
 * One place, because the fee, the shortlist rule and the company name each
 * appear on the landing page, at checkout, in the terms and in emails, and
 * copies that disagree are how a candidate ends up paying more than the site
 * said.
 *
 * Safe to import from client components: pure data and functions, no secrets.
 */

export type ChargeCurrency = 'INR' | 'EUR' | 'AED';
export const CHARGE_CURRENCIES: readonly ChargeCurrency[] = ['INR', 'EUR', 'AED'];

export const INDICATIVE_CURRENCIES = ['INR', 'PHP', 'NPR', 'BDT', 'PKR', 'LKR', 'AED', 'EGP', 'KES', 'NGN', 'USD', 'GBP'] as const;
export type IndicativeCurrency = (typeof INDICATIVE_CURRENCIES)[number];

export type Office = { city: string; address: string };

export type CompanySettings = {
  /** The registered entity that takes payment. Must match the merchant account exactly. */
  legalName: string;
  /** The name candidates know, which should also reach their card statement. */
  tradingAs: string;
  /** What the bank statement shows. Set it to match a live test payment. */
  statementDescriptor: string;
  registrationLabel: string;
  registrationNumber: string;
  registeredAddress: string;
  jurisdiction: string;
  /** What the company is and whose it is, e.g. "A recruitment agency under the Smith & Adams brand". */
  descriptor: string;
  parentBrand: string;
  shortName: string;
  locations: string;
  website: string;
  phone: string;
  supportEmail: string;
  employerEmail: string;
  /** Fraud and scam reports. Must be an inbox somebody reads. */
  reportEmail: string;
  offices: Office[];
  partner: {
    legalName: string;
    registrationLabel: string;
    registrationNumber: string;
    address: string;
    manager: string;
    email: string;
  };
  dataProtectionName: string;
  dataProtectionEmail: string;
  financeName: string;
  financeEmail: string;
};

export type PricingSettings = {
  /** Must match the active payment rail; checkout refuses a mismatch rather than charging the wrong currency. */
  chargeCurrency: ChargeCurrency;
  /** Package price in minor units (paise, cents, fils), per currency. */
  feeMinor: Record<ChargeCurrency, number>;
  /** VAT included in the price, in basis points (500 = 5%). The price shown is always the total. */
  vatBasisPoints: number;
  /**
   * Display-only conversions from one euro, for "about ₹2,400" beside the price.
   * Never charged. Rounded on purpose so the figure reads as an estimate.
   */
  indicativeRates: Record<IndicativeCurrency, number>;
  /** Placement fee charged to the employer, in euro cents. Candidates never pay it. */
  employerPlacementFeeMinor: number;
};

export type HiringSettings = {
  /** Assessment score out of 100 a candidate must exceed to be shortlisted. */
  shortlistMinScore: number;
  /** The published historical outcome: `hired` of every `shortlisted`. */
  outcomeShortlisted: number;
  outcomeHired: number;
  outcomeVisible: boolean;
  /** Said beside the figure every time it appears. */
  outcomeBasis: string;
  /** Working days from a completed application to an answer. */
  responseDays: number;
  contractYears: number;
  reportWithinDays: number;
  profileMonths: number;
  /**
   * Which wording a candidate agreed to, stored with their consent. Change it
   * whenever the terms, refund policy or selection rules change in substance.
   */
  consentVersion: string;
};

export type CohortSettings = {
  id: string;
  name: string;
  corridor: string;
  closesAt: string;
  reviewUntil: string;
  announceAt: string;
};

export const DEFAULT_COMPANY: CompanySettings = {
  legalName: 'SMTADM REAL ESTATE',
  tradingAs: 'S&A Recruitment',
  statementDescriptor: 'SMTADM REAL ESTATE',
  registrationLabel: 'Trade licence',
  registrationNumber: '1174293',
  registeredAddress: 'Office 102-08, Bin Dasmal Building, Al Goze Industrial First, Dubai, United Arab Emirates',
  jurisdiction: 'Dubai, United Arab Emirates',
  descriptor: 'A recruitment agency under the Smith & Adams brand',
  parentBrand: 'Smith & Adams',
  shortName: 'S&A',
  locations: 'Lisbon · Dubai',
  website: 'https://www.smithandadams.com',
  phone: '+351 938 227 348',
  supportEmail: 'candidates@smithandadams.com',
  employerEmail: 'candidates@smithandadams.com',
  reportEmail: 'candidates@smithandadams.com',
  offices: [
    { city: 'Lisbon', address: 'Avenida da Liberdade 69, 4.º A, 1250-140 Lisboa, Portugal' },
    { city: 'Dubai', address: 'Office 102-08, Bin Dasmal Building, Al Goze Industrial First, Dubai, United Arab Emirates' },
  ],
  partner: {
    legalName: 'BENEFIT DISCOVERY, LDA',
    registrationLabel: 'NIPC',
    registrationNumber: '517818817',
    address: 'Avenida da Liberdade 258, 9.º andar, Lisboa, Portugal',
    manager: 'Teresa Gama',
    email: 'geral@smithandadams.com',
  },
  dataProtectionName: 'Abilio Diz',
  dataProtectionEmail: 'abilio.diz@smithandadams.com',
  financeName: 'Furkan Ismail',
  financeEmail: 'furkan@smithandadams.com',
};

/* Deployments that set the currency in the environment before it moved to the
   console keep charging the same currency until somebody saves this page. */
const LEGACY_CURRENCY = process.env.NEXT_PUBLIC_CHARGE_CURRENCY;

export const DEFAULT_PRICING: PricingSettings = {
  chargeCurrency: LEGACY_CURRENCY === 'INR' || LEGACY_CURRENCY === 'AED' ? LEGACY_CURRENCY : 'EUR',
  feeMinor: { INR: 240_000, EUR: 2_500, AED: 10_500 },
  vatBasisPoints: 0,
  indicativeRates: { INR: 95, PHP: 65, NPR: 152, BDT: 128, PKR: 305, LKR: 345, AED: 4.1, EGP: 54, KES: 148, NGN: 1750, USD: 1.1, GBP: 0.85 },
  employerPlacementFeeMinor: 100_000,
};

export const DEFAULT_HIRING: HiringSettings = {
  shortlistMinScore: 70,
  outcomeShortlisted: 15,
  outcomeHired: 10,
  outcomeVisible: true,
  outcomeBasis:
    'Historical average reported by Smith & Adams for its recruitment programme: about 10 of every 15 shortlisted candidates hired. Past results, not a prediction for any individual. Hiring depends on available vacancies, interview performance and the required checks; visa decisions are made only by the authorities.',
  responseDays: 15,
  contractYears: 5,
  reportWithinDays: 7,
  profileMonths: 12,
  consentVersion: 'v7-2026-10',
};

export const DEFAULT_COHORT: CohortSettings = {
  id: 'cohort-01',
  name: 'Cohort 01',
  corridor: 'India → Portugal',
  closesAt: '2026-11-30',
  reviewUntil: '2026-12-15',
  announceAt: '2027-01-15',
};

/** Rails that can charge each currency. Used to refuse a mismatched configuration. */
export const RAIL_CURRENCIES: Record<string, readonly ChargeCurrency[]> = {
  ngenius: ['AED'],
  eximpe: ['INR'],
  cashfree: ['INR'],
  razorpay: ['INR'],
  viva: ['EUR'],
  dodo: ['EUR', 'INR'],
  stripe: ['EUR', 'INR'],
};

/** The package price in the charge currency, in minor units. */
export function feeMinor(pricing: PricingSettings): number {
  return Math.max(0, Math.round(pricing.feeMinor[pricing.chargeCurrency] ?? 0));
}

/** VAT is inside the total, never added at the till. */
export function priceBreakdown(pricing: PricingSettings) {
  const totalMinor = feeMinor(pricing);
  const netMinor = Math.round(totalMinor / (1 + pricing.vatBasisPoints / 10_000));
  return { netMinor, vatMinor: totalMinor - netMinor, totalMinor, currency: pricing.chargeCurrency };
}

/**
 * 2500 EUR -> "EUR 25"; 240000 INR -> "₹2,400".
 *
 * Wrapped in Unicode isolates because the string is dropped into Arabic
 * sentences, where the bidi algorithm could otherwise reorder the figure.
 */
export function formatMoney(minor: number, currency: ChargeCurrency | 'USD' | 'GBP'): string {
  const units = Math.round(minor / 100);
  if (currency === 'INR') return `\u2066₹${units.toLocaleString('en-IN')}\u2069`;
  return `\u2066${currency} ${units.toLocaleString('en-US')}\u2069`;
}

export function formatFee(pricing: PricingSettings): string {
  return formatMoney(feeMinor(pricing), pricing.chargeCurrency);
}

export const CURRENCY_SYMBOLS: Record<IndicativeCurrency, string> = {
  INR: '₹',
  PHP: '₱',
  NPR: 'Rs',
  BDT: '৳',
  PKR: 'Rs',
  LKR: 'Rs',
  AED: 'AED',
  EGP: 'E£',
  KES: 'KSh',
  NGN: '₦',
  USD: '$',
  GBP: '£',
};

/**
 * Roughly what the package costs in another currency, rounded hard so it
 * reads as an estimate. When the charge is in that currency it is exact.
 */
export function indicativeAmount(pricing: PricingSettings, currency: IndicativeCurrency): number {
  if (currency === pricing.chargeCurrency) return Math.round(feeMinor(pricing) / 100);
  const raw = (pricing.feeMinor.EUR / 100) * (pricing.indicativeRates[currency] ?? 0);
  if (raw >= 1000) return Math.round(raw / 100) * 100;
  if (raw >= 100) return Math.round(raw / 10) * 10;
  return Math.round(raw);
}

/** "₹2,400". Callers put "about" in front unless the charge is in that currency. */
export function formatIndicative(pricing: PricingSettings, currency: IndicativeCurrency = 'INR'): string {
  return `${CURRENCY_SYMBOLS[currency]}${indicativeAmount(pricing, currency).toLocaleString('en-US')}`;
}

/** The owner's shortlist rule: a score above the threshold, never equal to it. */
export function meetsShortlistScore(hiring: Pick<HiringSettings, 'shortlistMinScore'>, overallScore: number | null): boolean {
  return overallScore !== null && overallScore > hiring.shortlistMinScore;
}

/** Policy pages say plainly when a company detail is missing rather than printing a blank. */
export function entityIsComplete(company: CompanySettings): boolean {
  return Boolean(company.legalName && company.registeredAddress && company.phone);
}
