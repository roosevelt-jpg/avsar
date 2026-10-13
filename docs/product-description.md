# Product description, for payment onboarding

Written for a merchant-of-record or acquirer risk review. Every claim below is
checked against the live site and the code: the entity is `ENTITY` in
`src/lib/data/brand.ts`, the fee is `ASSESSMENT_FEE`, the delivery windows are
`DELIVERY`, and the placement-fee payer is `PLACEMENT_FEE.payer`.

**Keep it that way.** If any of those change and this file does not, the
application says one thing and the site says another, which is the single most
common reason a merchant review fails.

---

## Full version

S&A Recruitment is an online skills assessment and career documentation
service, sold and delivered entirely over the internet by BENEFIT DISCOVERY,
LDA (NIPC 517818817), a company registered at Avenida da Liberdade 69, 4.º A,
1250-140 Lisboa, Portugal, trading as S&A Recruitment under the Smith & Adams
brand.

Candidates, most of them in India, pay a single fee of EUR 25 and receive four
digital deliverables:

- a scored skills report, as a PDF, covering their trade skills, their work
  experience and their English;
- a rewritten CV in three formats, built from their own experience;
- interview preparation and a personal development plan;
- a profile listed in our talent pool, visible to vetted employers for 12
  months.

The assessment takes twenty to thirty minutes, is taken online from a phone,
and is free to sit. The fee is charged only afterwards, and only if the
candidate wants the documents and the listing. Everything is delivered to the
candidate's account within 7 days. Nothing is shipped and there is no physical
component.

The fee buys the assessment and the documents. It does not buy a job, an
interview, a visa, or any promise of one, and paying it places no candidate
ahead of another. This is stated on the landing page, in the terms, and in a
consent checkbox the candidate must tick before paying.

**Candidates are never charged for placement.** Where a candidate is
subsequently hired by an employer we introduce, our placement fee is invoiced
to that employer, not to the worker. No fee of any kind is charged to a
candidate beyond the EUR 25 assessment fee.

Refunds: the fee is refunded in full, on request within 14 days, where nothing
has been downloaded. Once a report or a CV has been downloaded the digital
goods have been delivered in full and the fee is not refundable. Both are
stated before payment.

---

## Short version, for a field with a character limit

An online skills assessment and career documentation service, delivered
entirely over the internet by BENEFIT DISCOVERY, LDA (Lisbon, Portugal),
trading as S&A Recruitment. Candidates pay EUR 25 once and receive a scored
skills report as a PDF, a rewritten CV in three formats, interview
preparation, and a talent-pool listing visible to vetted employers for 12
months, all delivered to their account within 7 days. The assessment is free
to sit; the fee is charged only afterwards and only if they want the
documents. The fee does not buy a job, an interview or a visa, and this is
stated before payment. Candidates are never charged for placement: where
someone is hired, our fee is invoiced to the employer.

---

## Why each paragraph is there

A reviewer is checking five things, and the order above answers them in the
order they ask.

**Is this a digital product?** First sentence, and again in "nothing is
shipped". Merchants of record sell digital goods; an application that reads as
a service business gets routed somewhere it will not be approved.

**Is this an employment service?** Those are excluded in most merchant-of-record
terms. The honest answer is that what is sold is an assessment and a set of
documents, which is why the deliverables are itemised before anything else is
said.

**What could become a chargeback?** A buyer who believes they bought a job and
did not get one. The explicit denial, and the note that it is on the landing
page and in a tickbox, is what makes that dispute unwinnable against us.

**Who bears the cost of placement?** The employer. This is the line that
separates this from the model two Indian aggregators declined, and it should
never be softened to save space.

**When is it delivered and what is refundable?** Seven days, and the
download-based refund rule, both stated before payment.
