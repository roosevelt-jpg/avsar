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
   * Precision: talent channelled exactly where it is needed. It was briefly
   * "on the spot", which an English reader hears as *immediately* or *under
   * pressure*; "spot on" is the idiom that carries the intended meaning.
   *
   * No full stop. A slogan under a logo is a name, not a sentence.
   */
  slogan: 'Connecting Talent, Spot On',
  locations: 'Lisbon · New Delhi',
} as const;

/**
 * The registered entity behind the site.
 *
 * A payment provider's merchant review looks for this: the legal name, a real
 * postal address, a working phone and a monitored email, all reachable from the
 * public site.
 *
 * The Portuguese company, because that is the one that holds the Viva.com
 * merchant account and therefore the one that actually takes the money. Viva
 * passports an EU licence and onboards merchants registered in the EEA or the
 * UK, so the Dubai company cannot be the seller on this rail whatever the site
 * says.
 *
 * It is the legal entity behind the Smith & Adams brand, which is why the
 * footer can name both without either being a fiction. The jobs are still in
 * Dubai and the support line is still a UAE number; what moved is who the
 * contract for the assessment is with.
 *
 * Fill these fields and every policy page completes itself. While one is
 * missing the pages say so plainly rather than printing an empty bracket,
 * because a reviewer reading "[COMPANY NAME]" fails the application faster than
 * one reading an honest gap.
 */
export const ENTITY = {
  legalName: 'BENEFIT DISCOVERY, LDA',
  /**
   * The name a candidate actually knows us by.
   *
   * It has to reach the card and UPI statement too. Someone who signed up at
   * S&A Recruitment and then sees an unfamiliar company name debit the fee
   * files a dispute, and they are right to.
   */
  tradingAs: 'S&A Recruitment',
  /**
   * What the bank shows.
   *
   * Viva settles to BENEFIT DISCOVERY and that is the name the statement
   * carries, so this says the same rather than the brand the candidate signed
   * up under. The gap between the two is real and cannot be wished away in a
   * constant: the fix is that the site says, before the candidate pays, which
   * name they will see. Check the descriptor Viva actually sends and set this
   * to match it, because the two disagreeing is worse than either alone.
   */
  statementDescriptor: 'BENEFIT DISCOVERY',
  /** Registo Comercial. The NIPC is also the VAT number, prefixed PT. */
  registrationNumber: '517818817',
  registrationLabel: 'NIPC',
  /** The registered office on the certidão permanente. */
  registeredAddress: 'Avenida da Liberdade 69, 4.º A, 1250-140 Lisboa, Portugal',
  /**
   * The Portuguese line, answered in Lisbon by the people who place them.
   *
   * It went to a UAE number for the week the jobs were in Dubai, and comes back
   * with them. A support line in the country of the job is the useful one, and
   * it is a different fact from the registered address above: the company and
   * the work happen to be in the same country again, which is convenient rather
   * than required.
   */
  phone: '+351 938 227 348',
  supportEmail: 'candidates@smithandadams.com',
  employerEmail: 'employers@smithandadams.com',
  reportEmail: 'report@smithandadams.com',
  jurisdiction: 'Lisbon, Portugal',
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
 * Candidate assessment fee, in euros.
 *
 * One price, one currency, everywhere. It was quoted in rupees when the product
 * pointed at India and in dirhams when it pointed at the UAE; it is quoted in
 * euros now because the company that takes the money is Portuguese and settles
 * in euros, and a site that quotes one currency while the charge arrives in
 * another is how somebody ends up paying more than they were told.
 */
export const ASSESSMENT_FEE = {
  eur: 25,
} as const;

/**
 * Indicative conversions. For display only. Never charged.
 *
 * A candidate in Kochi reads "EUR 25" and has no feel for what it costs them.
 * Showing roughly what it is in their own money removes that, and that is the
 * only job these do.
 *
 * The rupee is the one that appears beside the price in the copy, because the
 * candidates are Indian; the rest exist for the currency picker at checkout.
 * It is a display conversion and not a second price: quoting two numbers that
 * drift apart is how a candidate ends up paying more than the site said.
 *
 * Charging in the candidate's currency was considered and rejected. The dial
 * code in the signup form is the country of the phone, not of the card and not
 * of the residence, so it is the wrong signal to pick a currency from; the Viva
 * account settles in euros, so anything else means either per-currency
 * acceptance or dynamic conversion, and dynamic conversion gives the candidate a
 * worse rate than their own bank; and ten source markets would mean ten prices
 * drifting apart with the exchange rate. The candidate's bank converts, which is
 * normal, visible, and theirs.
 *
 * Hardcoded and rounded on purpose. A live feed would move the figure between
 * the moment somebody reads it and the moment they pay, which is the thing this
 * exists to avoid, and a figure to the cent would read as a promise rather than
 * an estimate. Update when one has drifted far enough to mislead.
 *
 * Last reviewed 12 October 2026.
 */
export const INDICATIVE_RATES = {
  INR: 95,
  PHP: 65,
  NPR: 152,
  BDT: 128,
  PKR: 305,
  LKR: 345,
  AED: 4.1,
  EGP: 54,
  KES: 148,
  NGN: 1750,
  USD: 1.1,
  GBP: 0.85,
} as const;

export type IndicativeCurrency = keyof typeof INDICATIVE_RATES;

/**
 * Rounds hard, because the number is an estimate and should read as one.
 *
 * 25 EUR at 95 rupees is 2,375; this says "about 2,400". Somebody who sees a
 * round number understands they are being given a ballpark. Somebody who sees
 * 2,375 and is charged the euro equivalent of 2,412 thinks they were misled.
 */
export function indicativeAmount(currency: IndicativeCurrency): number {
  const raw = ASSESSMENT_FEE.eur * INDICATIVE_RATES[currency];
  if (raw >= 1000) return Math.round(raw / 100) * 100;
  if (raw >= 100) return Math.round(raw / 10) * 10;
  return Math.round(raw);
}

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
 *  - `v4-2026-10`  the placement fee withheld from the site, so the sentence
 *                  about it left the consent somebody is asked to tick
 *  - `v5-2026-10`  the placement fee disclosed again and stated to be invoiced
 *                  separately; seller moved to the Portuguese entity and the
 *                  price quoted in euros
 */
export const CONSENT_VERSION = 'v5-2026-10';

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
  /**
   * Disclosed again, on the owner's decision, 12 October 2026.
   *
   * It was withheld from 7 October, which held the checkout shut: the
   * assessment fee is what induces payment, and taking it from somebody who has
   * not been told that €1,000 follows is a misleading omission, so
   * `/api/payments/checkout` refused outright rather than let the hidden state
   * quietly become one where money changes hands.
   *
   * The fee is now invoiced separately rather than taken through the site. That
   * changes which rail carries it and nothing about who owes it, so it stays
   * `payer: 'candidate'` and stays disclosed. Moving the charge off the site
   * removes it from the payment provider's view; it does not remove it from the
   * candidate's, and the candidate is the one the disclosure is for.
   */
  disclosed: true,

  get visibleToCandidates(): boolean {
    return this.payer === 'candidate' && this.disclosed;
  },
} as const;

/**
 * True when the product is charging for something it has not disclosed.
 *
 * Read by the checkout, which refuses, and by the consent text, which drops
 * the sentence it can no longer honestly make somebody agree to.
 */
export const PLACEMENT_FEE_UNDISCLOSED =
  PLACEMENT_FEE.payer === 'candidate' && !PLACEMENT_FEE.disclosed;

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

/** The currency the copy quotes beside the euro, because that is the market. */
export const PRIMARY_INDICATIVE: IndicativeCurrency = 'INR';

/**
 * "about ₹2,400". The hedge is part of the string and not optional.
 *
 * Without it the figure reads as a second price, and the first time the rupee
 * drifts somebody arrives at their bank statement with a number the site did
 * not show them.
 */
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

export function formatIndicative(currency: IndicativeCurrency = PRIMARY_INDICATIVE): string {
  return `${CURRENCY_SYMBOLS[currency]}${indicativeAmount(currency).toLocaleString('en-US')}`;
}
