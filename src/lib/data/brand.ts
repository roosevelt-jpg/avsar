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
  payer: 'employer' as 'candidate' | 'employer',
  /**
   * Published to employers, never to candidates.
   *
   * With the employer paying, every objection above disappears: the fee is in
   * the normal range for a fully relocated hire in these sectors, it is paid by
   * someone who can pay it without borrowing, and none of the prohibitions
   * apply. Same money, different payer.
   *
   * Setting `payer` back to 'candidate' re-opens all of it. Read
   * docs/commercial-terms.md before doing that.
   */
  get visibleToCandidates(): boolean {
    return this.payer === 'candidate';
  },
} as const;

/**
 * "You never pay us for the job itself."
 *
 * True only while the employer pays, so it is derived rather than written into
 * copy. In a market where most candidates have been charged by an agent at some
 * point, this is the strongest claim the product has, and it must never appear
 * on a page while the opposite is configured.
 */
export const CANDIDATE_PAYS_NO_PLACEMENT_FEE = PLACEMENT_FEE.payer === 'employer';

/**
 * The selection funnel.
 *
 * 32% is a submission-to-hire rate: the share of candidates **presented to an
 * employer** who receive an offer. That is the standard agency metric and sits
 * in the normal 20-35% band, which is why it is a number Smith & Adams can
 * stand behind.
 *
 * It is not the share of applicants who are hired, and the difference is a
 * factor of eight. Stated bare, "32%" reads as "I have a 32% chance", which
 * would be false and is the kind of false that induces payment.
 *
 * So the number is never rendered on its own. `rateLine` in the dictionary
 * carries the base in the same sentence, and the funnel below is published
 * alongside it so a reader can do the arithmetic themselves.
 *
 * VERIFY BEFORE LAUNCH. These stage figures are the shape of the claim, not a
 * measurement: this platform has placed nobody. They have to be reconciled with
 * Smith & Adams' own placement records, and `basis` updated to say over what
 * period and in which sectors.
 */
export const SELECTION_FUNNEL = {
  /** Per 100 candidates who complete the assessment. */
  perHundredApplicants: {
    completeAssessment: 100,
    reachAssessmentCall: 25,
    presentedToEmployer: 12,
    hired: 4,
  },
  /** Submission-to-hire. 32% of those presented, not of those who apply. */
  presentedToHirePercent: 32,
  visible: true,
  basis:
    'Share of candidates presented to an employer who receive an offer. To be reconciled with Smith & Adams placement records before launch: period and sectors to be stated here.',
} as const;

/** The applicant-level rate, derived so it can never contradict the funnel. */
export function applicantHireRate(): number {
  const f = SELECTION_FUNNEL.perHundredApplicants;
  return Math.round((f.hired / f.completeAssessment) * 100);
}

/** What a selected candidate receives. */
export const PLACEMENT_INCLUDES = [
  'employment_contract',
  'accommodation',
  'meals',
  'legal_support',
] as const;

/** Length of the employment contract offered, in years. */
export const CONTRACT_YEARS = 5;
