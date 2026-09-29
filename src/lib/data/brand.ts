/**
 * Brand and commercial terms, in one place.
 *
 * Everything a meeting can change lives here rather than scattered through
 * copy: the fee, the response time, the placement fee, the success rate. A
 * number that appears on the landing page, at checkout and in the FAQ must come
 * from one source, or the three will disagree the first time one of them moves.
 */

export const BRAND = {
  name: 'S&A Recruitment',
  shortName: 'S&A',
  parent: 'Smith & Adams',
  tagline: 'A recruitment agency under the Smith & Adams brand',
  locations: 'Lisbon · New Delhi',
} as const;

/**
 * Candidate assessment fee.
 *
 * Priced in euros and shown in rupees. The rupee figure is a display
 * conversion, not a second price: the charge is one amount, and quoting two
 * that drift apart is how a candidate ends up paying more than the site said.
 *
 * Update `inrPerEur` deliberately. A live FX feed would move the headline price
 * between the moment someone reads it and the moment they pay.
 */
export const ASSESSMENT_FEE = {
  eur: 25,
  inrPerEur: 92,
  /** Recomputed from the two above. Rounded to a price that reads naturally. */
  get inr(): number {
    return Math.round((this.eur * this.inrPerEur) / 100) * 100 - 1;
  },
} as const;

/** Working days from a completed application to an answer. */
export const RESPONSE_DAYS = 15;

/**
 * Fee charged to a selected candidate to complete the process.
 *
 * NOT PUBLISHED. `visible` is false deliberately, and turning it on is a
 * decision to take with legal advice, not a config change:
 *
 *  - EU Directive 2008/104 Art. 6(3) and Portugal's DL 260/2009 prohibit an
 *    employment agency charging a worker for placement.
 *  - India's Emigration Act caps recruitment fees at Rs 20,000 or 45 days of
 *    foreign wages, whichever is lower. EUR 1,000 is roughly Rs 92,000.
 *  - ILO fair recruitment principles: no fees to workers.
 *  - A large fee paid by a migrant worker to obtain a job abroad is the shape
 *    anti-trafficking frameworks treat as a debt bondage indicator.
 *
 * The workable version is the employer paying it, which is what the Portuguese
 * market already does. See docs/commercial-terms.md.
 */
export const PLACEMENT_FEE = {
  eur: 1000,
  visible: false,
  payer: 'candidate' as 'candidate' | 'employer',
} as const;

/**
 * Selection rate shown to candidates.
 *
 * `basis` is not decoration. A rate published to people who are about to pay
 * has to be traceable to something, and "what is this number" is the first
 * question anyone asks. Until a basis is written here, `visible` stays false
 * and the site says nothing about odds rather than saying something unfounded.
 */
export const SELECTION_RATE = {
  percent: 32,
  visible: false,
  basis: '',
} as const;

/** What a selected candidate receives. */
export const PLACEMENT_INCLUDES = [
  'employment_contract',
  'accommodation',
  'meals',
  'legal_support',
] as const;

/** Length of the employment contract offered, in years. */
export const CONTRACT_YEARS = 5;
