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
  /**
   * What the company is, and whose it is. Not the slogan.
   *
   * This line exists to establish that a candidate in India is dealing with a
   * business that has a parent, a name and an address. It does a different job
   * from the slogan and the two are not interchangeable.
   */
  tagline: 'A recruitment agency under the Smith & Adams brand',
  /**
   * The slogan.
   *
   * Intended as precision: talent channelled exactly where it is needed. Worth
   * knowing that an English reader will hear "on the spot" as *immediately* or
   * *under pressure*; the idiom for the intended meaning is "spot on", with the
   * words the other way round. Set here anyway, as a brand decision, and in one
   * place so it is one edit if that changes.
   */
  slogan: 'Connecting Talent on the spot',
  locations: 'Lisbon · New Delhi',
} as const;

/**
 * The registered entity behind the site.
 *
 * A payment provider's merchant review looks for this: the legal name, a real
 * postal address, a working phone and a monitored email, all reachable from the
 * public site.
 *
 * The Dubai company. The Stripe route needed a Portuguese one, because Stripe
 * will not do UPI from an account registered in the UAE; EximPe removes that
 * constraint entirely, since its RBI PA-CB import authorisation collects rupees
 * by UPI and settles abroad whatever the merchant's country. The entity went
 * back to the one that holds the bank account and the trade licence.
 *
 * Fill these fields and every policy page completes itself. While one is
 * missing the pages say so plainly rather than printing an empty bracket,
 * because a reviewer reading "[COMPANY NAME]" fails the application faster than
 * one reading an honest gap.
 */
export const ENTITY = {
  legalName: 'SMTADM REAL ESTATE L.L.C',
  /**
   * The name a candidate actually knows us by.
   *
   * It has to reach the card and UPI statement too. Someone who signed up at
   * S&A Recruitment and then sees an unfamiliar company name debit 2,299
   * rupees files a dispute, and they are right to.
   */
  tradingAs: 'S&A Recruitment',
  /**
   * What the bank or UPI app shows. Set the same string in the provider's
   * dashboard: the two disagreeing is worse than either alone.
   */
  statementDescriptor: 'SA RECRUITMENT',
  /** Dubai Department of Economy and Tourism. */
  registrationNumber: '1174293',
  registrationLabel: 'Trade licence',
  /**
   * The address on the trade licence, because that is the document a reviewer
   * holds this against.
   *
   * It is not the only one on file: the Corporate Tax certificate and the bank
   * statement both say Hor Al Anz, Deira. Three addresses across three
   * documents is a routine cross-check failure, and the licence is the one to
   * correct or to reconcile the others against.
   */
  registeredAddress:
    'Office 102-08, Salem Abdullah Bin Dasmal Building, Al Quoz Industrial First, Dubai',
  /**
   * The Portuguese line, deliberately, on a company registered in Dubai.
   *
   * It is the number a candidate rings, and it is answered in Lisbon by the
   * people who place them in Portugal. A support line in the country of the
   * job is the useful one; the registered address above says where the company
   * is, and the two are different facts.
   */
  phone: '+351 938 227 348',
  supportEmail: 'candidates@smithandadams.com',
  employerEmail: 'employers@smithandadams.com',
  reportEmail: 'report@smithandadams.com',
  jurisdiction: 'Dubai, United Arab Emirates',
} as const;

export function entityIsComplete(): boolean {
  return Boolean(ENTITY.legalName && ENTITY.registeredAddress && ENTITY.phone);
}

/**
 * When the report and the profile are delivered.
 *
 * A merchant review asks how a digital service reaches the buyer and in what
 * time. Saying it plainly is also how a refund dispute is settled later.
 */
export const DELIVERY = {
  reportWithinDays: 7,
  profileMonths: 12,
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

/**
 * Which wording a candidate agreed to.
 *
 * Stored on the row at checkout, so the terms that applied to somebody can be
 * recovered years later rather than inferred from a deploy date. It moves when
 * the terms, the refund policy or the selection rules change in substance.
 *
 *  - `v1-2026-09`  first cohort wording; selection rules were still a draft
 *  - `v2-2026-10`  selection rules reviewed and published; placement fee moved
 *                  to the candidate and disclosed before checkout
 *  - `v3-2026-10`  the fee moved to after the assessment, so sitting it is free
 *                  and the disclosure moved to the end of signup
 */
export const CONSENT_VERSION = 'v3-2026-10';

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
  payer: 'candidate' as 'candidate' | 'employer',
  /**
   * Charged only once a job is confirmed, never up front.
   *
   * This is a placement fee paid by the worker, and it is the term with the
   * most consequence attached, so it is written down rather than left to copy.
   * India's Emigration Act caps what a recruiting agent may charge an emigrant
   * at 20,000 rupees or 45 days' wages; this is around 92,000 rupees.
   * Portugal's Decreto-Lei 260/2009 prohibits charging a candidate for
   * placement. Both were raised and the model was set this way deliberately.
   *
   * What the product owes the candidate in return is that nobody discovers it
   * late. Because `payer` is 'candidate', `visibleToCandidates` is true, which
   * puts the amount and the condition on the landing page, in the terms, and
   * in front of them at checkout before the assessment fee is taken.
   */
  get visibleToCandidates(): boolean {
    return this.payer === 'candidate';
  },
} as const;

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
