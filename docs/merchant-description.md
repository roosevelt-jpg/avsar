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

A UAE acquirer reads it with one more thing in mind. Federal Decree-Law 33/2021
article 6 prohibits charging a worker for recruitment, so a UAE merchant in this
category describing a candidate-paid placement fee is describing something the
law of its own jurisdiction forbids.

So the description does not argue. It states what is delivered, when, for how
much, what is refundable, and what the candidate pays later. The second fee is
the one that decides this: an acquirer that learns about a €1,000 charge from a
chargeback rather than from the application treats everything else as
misrepresented too.

## Short description

> Online skills assessment and career documentation for people anywhere in the
> world seeking work in the United Arab Emirates. Candidates pay AED 99 for an
> assessment of their trade skills, experience and English, a written skills
> report, a rewritten CV and interview preparation, and a profile shown to
> vetted employers for 12 months. Employment is not guaranteed.

## Full description

> S&A Recruitment is an online skills assessment and career documentation
> service operated under the Smith & Adams brand, for candidates worldwide
> seeking work with employers in the United Arab Emirates.
>
> **What the candidate buys.** A single payment of AED 99, inclusive of 5%
> VAT, charged after the assessment is completed, for: an online assessment of trade skills, work experience and English;
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
> condition of being considered, and never a condition of an interview.
>
> **This paragraph is currently false on the site.** `PLACEMENT_FEE.disclosed`
> is `false`, so the amount appears nowhere: not on the landing page, not in the
> terms, and not above the consent checkbox. Do not paste the paragraph above
> into an application until that is put back, or until `payer` moves to
> `employer` and the paragraph is replaced by the one that says the candidate
> pays nothing for placement. See `docs/commercial-terms.md`.
>
> **Refunds.** Full refund, including the VAT component, at any time before the
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
> **Customers.** Adults anywhere in the world applying for work in the UAE in
> hospitality, construction, logistics, services and IT. No goods are shipped.
> Nothing is sold to minors.

## The fields that trip people up

| Field | Answer |
|---|---|
| MCC | 7361, Employment Agencies and Temporary Help Services |
| Average transaction | AED 99 |
| Maximum transaction | AED 99. One price, no tiers |
| Delivery timeframe | Immediate access; report within 7 days |
| Physical goods | None |
| Subscription or recurring | No. One payment per cohort application |
| Trading name on statement | `SA RECRUITMENT` |
| Customer service email | `candidates@smithandadams.com` |
| Customer service phone | the UAE number in `ENTITY.phone` |

## The company, for the KYC forms

| Field | Value |
|---|---|
| Legal name | SMTADM REAL ESTATE L.L.C |
| Legal form | Limited Liability Company |
| Trade licence | 1174293, Dubai Department of Economy and Tourism, to 18 Apr 2027 |
| Commercial register | 1962728 |
| Chamber membership | 456046, Dubai Chamber of Commerce |
| UAE Tax Registration Number | 104201008000001 |
| Registered office | Office 102-08, Salem Abdullah Bin Dasmal Building, Al Quoz Industrial First, Dubai |
| Share capital | AED 300,000 |
| Financial year | 1 January to 31 December |
| Binding | Either Managing Director, singly or jointly (MOA Art. 10) |
| Settlement account | Mashreq, AED, in the company name |

Muhammad Adam Ismail and Muhammad Furkan Ismail hold 50% each, both Portuguese
nationals, both Managing Directors able to act alone. Both belong in the
beneficial-owner declaration: an aggregator holds settlement until every owner
above 25% has cleared verification, which is the commonest reason an account
sits unactivated.

The passport numbers in the 2023 MOA are superseded; both were renewed in 2026.
A resolution citing an old number against a passport copy showing the new one is
a cross-check failure.

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

## Two mismatches a reviewer will find

**The licensed activity does not cover recruitment.** The trade licence carries
one activity, Real Estate Buying & Selling Brokerage. This is the same mismatch
that stopped the Cashfree application, and nothing written here fixes it. See
docs/commercial-terms.md.

**Three addresses across three documents.** The trade licence says Al Quoz
Industrial First; the Corporate Tax certificate and the bank statement both say
Hor Al Anz, Deira. Cross-checking addresses is routine, and three versions
invite a question. Decide which is current and reconcile the others.
