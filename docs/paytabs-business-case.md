# PayTabs merchant application

Written to be pasted into their form. Every figure comes from
`src/lib/data/brand.ts` and `src/lib/data/cohort.ts`; if one changes there,
change it here in the same commit.

Read `docs/merchant-description.md` first. It explains why this category is
read carefully and what a risk team is looking for. The short version: an
acquirer that learns a material fact from a chargeback rather than from the
application treats everything else in the application as misrepresented too.

---

## One-paragraph summary

> S&A Recruitment is an online skills assessment and career documentation
> service operated by SMTADM REAL ESTATE L.L.C, Dubai, under the Smith & Adams
> brand. Candidates anywhere in the world pay a single fee of AED 99, inclusive
> of 5% VAT, for an assessment of their trade skills, work experience and
> English, a written skills report, a rewritten CV with interview preparation,
> and a profile shown to vetted employers in the UAE for 12 months. The service
> is delivered entirely online. Employment is not guaranteed and the fee does
> not buy a job, an interview or a visa.

## The business

Smith & Adams operates hospitality, property management and renovation
businesses. S&A Recruitment is the group's platform for finding and assessing
the operational staff those businesses and their partners hire: chefs, food and
beverage service, cleaners, property managers, drivers, logistics, construction
workers, electricians, plumbers, welders, and two IT roles.

Candidates apply from anywhere. The jobs are in the United Arab Emirates.

## What is sold, and when it is charged

One product, one price, one charge.

| | |
|---|---|
| Price | **AED 99**, inclusive of 5% VAT (net AED 94.29, VAT AED 4.71) |
| Frequency | One payment per application. No subscription, no recurring billing |
| Charged | **After** the candidate completes the assessment, never before |
| Currency presented | AED |

Registering, completing a profile and sitting the assessment are all free. The
fee is asked for only once the candidate has finished and can see what the
assessment found. It unlocks the documents and the talent-pool listing.

What the fee buys:

1. A written skills report, scored by section, within 7 days
2. A rewritten CV in three formats, with interview preparation and a
   development plan
3. A profile visible to vetted employers for 12 months

All three are delivered whatever the outcome of any application. The candidate
keeps the report and the CV and may use them with any employer anywhere.

## What is not sold

The payment does not buy a job, an interview, a visa, or a place in any cohort.
Selection is not guaranteed. This is stated on the landing page, in the terms
the candidate accepts before paying, and on a dedicated selection-rules page
linked from both.

## Delivery

Entirely digital, through the candidate's account on the platform. Nothing is
shipped and there are no delivery charges.

| | |
|---|---|
| Report | Within 7 days of completing the assessment |
| Career pack | On request, within minutes |
| Talent-pool profile | Immediately, for 12 months |
| Answer on the application | Within 15 working days |

## Refunds and disputes

- Full refund at any time **before** the candidate starts the assessment.
  Nothing has been delivered at that point.
- No refund once the assessment is started, because the service is being
  delivered from that moment.
- Full refund if a cohort is cancelled before assessments begin, or if the
  report is late and the delay is ours.
- Requests answered within 2 working days; approved refunds issued within 7.

The refund policy is a public page, linked from the footer of every page and
from the checkout consent.

## Customers

Adults applying for operational work in the UAE, from anywhere in the world.
The platform is published in English, Hindi and Arabic. Nothing is sold to
minors. No goods are shipped.

## Scope of this account

The AED 99 assessment fee is the **only** payment flow we would route through
PayTabs.

## Form fields

| Field | Answer |
|---|---|
| MCC | 7361, Employment Agencies and Temporary Help Services |
| Average transaction | AED 99 |
| Maximum transaction | AED 99 |
| Physical goods | None |
| Subscription or recurring | No |
| Delivery timeframe | Immediate access; report within 7 days |
| Trading name on statement | `SA RECRUITMENT` |
| Website | `https://recruitment.smithandadams.com` |
| Terms | `/en/terms` |
| Refund policy | `/en/refund-policy` |
| Service delivery | `/en/delivery` |
| Privacy | `/en/privacy` |
| Selection rules | `/en/selection-rules` |
| Customer service email | `candidates@smithandadams.com` |
| Customer service phone | `+971 58 568 0441` |

## The company

| Field | Value |
|---|---|
| Legal name | SMTADM REAL ESTATE L.L.C |
| Legal form | Limited Liability Company |
| Trade licence | 1174293, Dubai Department of Economy and Tourism, to 18 Apr 2027 |
| Commercial register | 1962728 |
| Registered address | Office 102-08, Salem Abdullah Bin Dasmal Building, Al Quoz Industrial First, Dubai |
| Trading as | S&A Recruitment |
| Group | Smith & Adams |

## Volumes

**Fill these in before submitting.** Do not guess high: an acquirer sets limits
from the forecast and a number that never arrives is worse than a modest one
that does.

| Field | Answer |
|---|---|
| Expected monthly transactions | _to be completed_ |
| Expected monthly volume | _to be completed_ |
| Launch date | _to be completed_ |
| Peak month expectation | _to be completed_ |

## Before this is submitted

Two things in the product have to be settled first, and both are visible to
anybody who opens the site.

**The checkout currently refuses every request.** `PLACEMENT_FEE.disclosed` is
`false`, and `/api/payments/checkout` returns 503 while it is. If PayTabs test
the flow, which acquirers in this category usually do, they will find a dead
checkout.

**The placement fee has to be decided.** `PLACEMENT_FEE.payer` is `candidate`
and the amount is €1,000, payable after a job is confirmed. It is currently
withheld from the site. This application cannot describe it as disclosed,
because it is not, and it cannot omit it if asked, because that is the omission
this whole document exists to avoid. See `docs/commercial-terms.md`.

Moving it to the employer closes both: the checkout opens, the application
becomes simple to write, and the UAE prohibition on charging a worker for
placement stops applying.
