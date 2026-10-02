# What to write on a payment provider's application

Copy from here rather than rewriting each time. A description that differs
between providers, or between the application and the site, is the thing a risk
team finds during a dispute, and finding it is what ends an account.

Every figure below is the one in `src/lib/data/brand.ts`. If a number changes
there, change it here in the same commit.

## Why this needs care

Recruitment for migrant workers is a flagged category at every acquirer, for a
reason: charging a job seeker up front is the shape of a common fraud. The
application is read by someone looking for that shape.

So the description does not argue. It states what is delivered, when, for how
much, what is refundable, and what the candidate pays later. The second fee is
the one that decides this: an acquirer that learns about a €1,000 charge from a
chargeback rather than from the application treats everything else as
misrepresented too.

## Short description

> Online skills assessment and career documentation for people in India seeking
> work in Portugal. Candidates pay ₹2,299 (about €25) for an assessment of their
> trade skills, experience and English, a written skills report, a rewritten CV
> and interview preparation, and a profile shown to vetted employers for 12
> months. Employment is not guaranteed.

## Full description

> S&A Recruitment is a recruitment agency operating under the Smith & Adams
> brand, placing candidates from India in jobs with employers in Portugal.
>
> **What the candidate buys.** A single payment of ₹2,299, inclusive of 18%
> GST, for: an online assessment of trade skills, work experience and English;
> a written skills report delivered within 7 days; a career pack containing a
> rewritten CV in three formats, interview preparation and a development plan;
> and a profile visible to vetted employers for 12 months. These are delivered
> whatever the outcome of any application, and the candidate keeps the report
> and the CV and may use them with any employer anywhere.
>
> **What is not sold.** The payment does not buy a job, an interview, a visa, or
> a place in any cohort. Selection is not guaranteed and this is stated on the
> landing page, at checkout, and in the terms the candidate accepts before
> paying.
>
> **The second fee, disclosed up front.** If a candidate is placed, a placement
> fee of €1,000 becomes payable, and only after their job is confirmed and their
> employment contract is signed. It is never payable in advance, never a
> condition of being considered, and never a condition of an interview. The
> amount and that condition appear on the landing page, in the terms, and
> directly above the consent checkbox at checkout, before the ₹2,299 is taken.
>
> **Refunds.** Full refund, including the GST component, at any time before the
> candidate starts the assessment. No refund after it is started, because the
> service is being delivered at that point. Full refund if a cohort is cancelled
> before assessments begin, or if a delay is ours. Requests are answered within
> 2 working days and approved refunds issued within 7.
>
> **Delivery.** Entirely digital, through the candidate's account on the
> platform. The skills report within 7 days of completing the assessment, an
> answer on the application within 15 working days, and the talent-pool profile
> for 12 months.
>
> **Customers.** Adults in India applying for work in hospitality, construction,
> logistics, services and IT. No goods are shipped. Nothing is sold to minors.

## The fields that trip people up

| Field | Answer |
|---|---|
| MCC | 7361, Employment Agencies and Temporary Help Services |
| Average transaction | ₹2,299 |
| Maximum transaction | ₹2,499 after early registration closes |
| Delivery timeframe | Immediate access; report within 7 days |
| Physical goods | None |
| Subscription or recurring | No. One payment per cohort application |
| Trading name on statement | `SA RECRUITMENT` |
| Customer service email | `candidates@smithandadams.com` |
| Customer service phone | the Portuguese number in `ENTITY.phone` |

## Links a reviewer will open

Give these rather than waiting to be asked. A reviewer who has to hunt for a
refund policy assumes there is not one.

- Terms: `/en/terms`
- Refund policy: `/en/refund-policy`
- Service delivery: `/en/delivery`
- Selection rules, including the published rate and the funnel under it:
  `/en/selection-rules`
- Privacy: `/en/privacy`
- Contact: `/en/contact`

## The mismatch to resolve before applying

Neither registered entity's licensed activity covers recruitment.

SMTADM Real Estate L.L.C is licensed for Real Estate Buying & Selling
Brokerage. Benefit Discovery, Lda has an objecto covering construction,
business consultancy and support services to companies, with CAE 43350,
building finishing.

A reviewer comparing this description with the trade licence or the certidão
will see it. It is the same mismatch that stopped the Cashfree application.
Deciding it is not a drafting problem and nothing written here fixes it: see
docs/commercial-terms.md.
