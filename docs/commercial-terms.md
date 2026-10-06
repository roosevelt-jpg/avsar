# Commercial terms

Everything a meeting can change lives in `src/lib/data/brand.ts`. A number that
appears on the landing page, at checkout and in the FAQ has to come from one
place, or the three disagree the first time one of them moves.

| Term | Value | Where |
|---|---|---|
| Assessment fee | €25, shown as ₹2,299 | `ASSESSMENT_FEE` |
| Answer within | 15 days | `RESPONSE_DAYS` |
| Contract length | 5 years | `CONTRACT_YEARS` |
| Placement fee | €1,000, paid by the employer | `PLACEMENT_FEE` |
| Selection rate | 32% of candidates **presented to an employer** | `SELECTION_FUNNEL` |

The rupee figure is a display conversion of a euro price, not a second price.
`inrPerEur` is updated deliberately rather than from a live feed, because a
headline price that moves between reading it and paying it is how someone ends
up charged more than the site said.

## Two terms are switched off, and why

### The €1,000 placement fee: the employer pays it

`PLACEMENT_FEE.payer` is `employer`. That resolves everything below, and
switching it back to `candidate` re-opens all of it.

- **EU.** Directive 2008/104 Art. 6(3) and Portugal's DL 260/2009 prohibit an
  employment agency charging a worker for placement.
- **India.** The Emigration Act caps recruitment fees at ₹20,000 **or** 45 days
  of foreign wages, whichever is lower. €1,000 is roughly ₹92,000, four to five
  times over.
- **ILO.** Fair recruitment principles: no fees to workers, full stop.
- **Anti-trafficking.** A large fee paid by a migrant worker to obtain a job
  abroad is the shape these frameworks treat as a debt bondage indicator. That
  is a reputational exposure, not only a legal one, and it attaches to the
  Smith & Adams name rather than to a standalone brand.

Portuguese employers in these sectors already pay placement fees, €1,000 is in
the normal range for a fully relocated hire, and the payer can afford it without
borrowing. Same money, different payer, none of the objections.

It also buys the strongest claim the product has. In a market where most
candidates have been charged by an agent at some point, **"you never pay us for
the job itself"** is worth more than any feature. That line is derived from
`payer` rather than written into copy, so it can never outlive the setting that
makes it true.

### The 32% figure

Published, with its base attached.

32% is a **submission-to-hire rate**: the share of candidates presented to an
employer who receive an offer. That is the standard agency measure, it sits in
the normal 20-35% band, and it is a number a recruitment business can stand
behind.

It is **not** the share of applicants who are hired. The difference is a factor
of eight, and stated bare "32%" reads as "I have a 32% chance", which is false
and is the kind of false that induces payment.

So the number is never rendered alone. `rateLine` carries the base in the same
sentence, and the funnel is published beside it:

| Per 100 who complete the assessment | |
|---|---|
| Complete the assessment | 100 |
| Reach an assessment call | 25 |
| Presented to an employer | 12 |
| Hired | 4 |

32% of 12 is roughly 4, so the two figures describe the same funnel. The
applicant-level rate is derived from the stages rather than written down, so it
cannot contradict them.

Publishing the drop-off is the point, not a concession. A candidate who reads
"4 in 100" and applies anyway has made an informed decision, and that is the
difference between selling an assessment and selling a lottery ticket. It is
also the answer when someone asks where 32% came from.

**Verify before launch.** The stage figures are the shape of the claim, not a
measurement: this platform has placed nobody. They have to be reconciled with
Smith & Adams' own placement records, and `basis` updated to say over what
period and in which sectors.

## What the fee buys, and why that matters

The €25 buys three things, and the third is the one that carries the argument:

1. The assessment.
2. The skills report.
3. **The career pack**: a CV rewritten from the candidate's own experience,
   interview preparation for the role they applied to, and a development plan.

The third has value with any employer, anywhere, whether or not this platform
ever places them. That is what makes the fee a payment for a product rather than
a payment for access to a selection process, and the distinction is the one the
recruitment-fee rules turn on.

It only holds while the pack is genuinely portable and genuinely useful. If it
ever becomes a thin wrapper around "apply with us", the argument goes with it.

### The placement fee

€1,000, **paid by the candidate**, and only once the job is confirmed and the
contract signed. Changed from employer-paid on 1 October 2026.

The objections were stated before the change and are recorded here rather than
removed. India's Emigration Act caps what a recruiting agent may charge an
emigrant at ₹20,000 or 45 days' wages; €1,000 is around ₹92,000. Portugal's
Decreto-Lei 260/2009 prohibits charging a candidate for placement. Both were
raised and the model was set this way deliberately.

What the product does in consequence is make it impossible to discover late.
`PLACEMENT_FEE.payer` drives `visibleToCandidates`, which puts the amount and
the condition on the landing page, in the terms, and above the consent box at
checkout, before the assessment fee is taken. The claim that used to sit on the
landing page, "you never pay us for the job itself", is derived from the same
constant and disappeared with it, so it cannot outlive the setting that made it
true.

### CV formats

Three, designed here rather than adapted from templates found online: CV designs
are someone's copyrighted work, and claims that a given template "performs" are
marketing rather than evidence.

| Format | For |
|---|---|
| Standard | One column, parses cleanly anywhere. The default. |
| Europass | The EU format, built for cross-border mobility. What a Portuguese employer and an immigration file expect from an applicant arriving from abroad. |
| Professional | Sidebar for skills and languages. Suits IT and supervisory roles. |

There is deliberately no "creative" option. These CVs go to Portuguese
employers in hospitality, trades and services, and some end up in a visa file.
Columns that interleave when parsed, text inside graphics and non-standard
section headings all read worse to the recruitment software many of these
employers run, and add nothing for the person reading it afterwards. Even the
Professional sidebar holds lists only, so a parser reading the page in order
still gets a sensible document.

The advice is translated into the candidate's language; the CV is not. It goes
to a Portuguese employer and stays in English.

### The rule inside the generator

`coach.ts` forbids adding any experience, qualification or achievement not in
the source, and every rewritten bullet carries a `basedOn` field naming the
phrase it came from. `unsupportedBullets()` then checks that mechanically rather
than trusting the instruction, and anything it flags is stored on the record.

This is not pedantry. A CV that claims something the candidate cannot support in
an interview costs them the job, and in a visa application it can cost them far
more than that.

## Positions and areas

The meeting gave four areas and ten positions that do not map onto them: welders
and logistics belong to neither food and beverage nor IT. `positions.ts` has
five areas rather than four, with a trades and logistics group, because the
alternative was filing a welder under property management.

Candidates pick a **position**. It is what they call themselves, what an
employer searches for, and what decides which assessment they take. Areas are
navigation.

IT has its own bank. A data analyst and a QA tester share the sector and not the
job, so items inside it are scoped with `positions` rather than by adding an
enum value per role. Both get four shared IT items and six of their own.


## When the fee is collected

After the assessment, from 6 October 2026. It used to be before.

A candidate registers, completes their profile and sits the assessment for
nothing. The fee buys the skills report, the career pack and twelve months in
the talent pool, and it is asked for on the dashboard once there is a report to
unlock. Their score is on the screen above that panel whether they pay or not:
what is behind the wall is the documents they take away and the place employers
search, and the copy says so rather than implying the score itself is withheld.

Two things had to move with it.

**The disclosure went the other way.** The odds and the EUR 1,000 were shown at
checkout, which used to be before the assessment and is now after it. Left
there, a candidate would have learned the terms only after ninety minutes of
answering. They are now shown at the end of signup, above the consent box, and
the consent is still what records that they were shown.

**The refund policy was rewritten.** "Full refund before you start the
assessment, none after" described a world where payment came first, and became
self-contradictory the moment it did not. It now says: the fee is payable after
the assessment, nothing is refundable once the report, the CV or the interview
preparation has been downloaded, and a full refund within fourteen days if the
fee was paid and nothing downloaded.

`CONSENT_VERSION` moved to `v3-2026-10`, so which wording a candidate agreed to
stays recoverable.

### What this trades away

Said once, because it was raised before the decision and the decision stands.

A fee charged at the end filters nobody: the assessment is served, scored and
stored for everyone who arrives, and the cost of doing that is paid before any
of them decide. And a candidate who has answered for ninety minutes and then
meets a wall between themselves and their own result will experience that
differently from one who paid at the door.

Both are mitigated rather than solved. The disclosure moved early so nobody is
surprised, and the score is shown free so the wall stands in front of the
documents rather than in front of the result.
