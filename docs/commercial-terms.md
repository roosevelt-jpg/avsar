# Commercial terms

Everything a meeting can change lives in `src/lib/data/brand.ts`. A number that
appears on the landing page, at checkout and in the FAQ has to come from one
place, or the three disagree the first time one of them moves.

| Term | Value | Where |
|---|---|---|
| Assessment fee | €25, shown as ₹2,299 | `ASSESSMENT_FEE` |
| Answer within | 15 days | `RESPONSE_DAYS` |
| Contract length | 5 years | `CONTRACT_YEARS` |
| Placement fee | €1,000 | `PLACEMENT_FEE`, **not published** |
| Selection rate | 32% | `SELECTION_RATE`, **not published** |

The rupee figure is a display conversion of a euro price, not a second price.
`inrPerEur` is updated deliberately rather than from a live feed, because a
headline price that moves between reading it and paying it is how someone ends
up charged more than the site said.

## Two terms are switched off, and why

### The €1,000 placement fee

`PLACEMENT_FEE.visible` is false. Turning it on is a decision to take with
counsel, not a config change.

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

**The version that works is the employer paying it.** Portuguese employers in
these sectors already pay placement fees, the amount is in the normal range for
a fully relocated hire, and it removes every item above. `PLACEMENT_FEE.payer`
exists so the switch is one word.

### The 32% selection rate

`SELECTION_RATE.visible` is false until `basis` says where the number came from.

The platform has placed nobody, so it has no rate of its own. If the figure
comes from Smith & Adams' own recruitment history, what it measures has to be
written down: hires per application, per interview, or per shortlist, over what
period and in which sectors. Those produce very different numbers from the same
business.

The meeting notes say both "32%" and "30 in every 100", which are different
claims. Whichever is right, it goes in one place.

This matters more than it looks. A published rate is what induces someone to
pay, and an unfounded one is the difference between charging for an assessment
and taking money under false pretences. It is also the first question a
regulator or a journalist asks.

## Positions and areas

The meeting gave four areas and ten positions that do not map onto them: welders
and logistics belong to neither food and beverage nor IT. `positions.ts` has
five areas rather than four, with a trades and logistics group, because the
alternative was filing a welder under property management.

Candidates pick a **position**. It is what they call themselves, what an
employer searches for, and what decides which assessment they take. Areas are
navigation.

IT has no assessment bank yet. A data analyst currently receives hospitality
items, which is wrong and has to be fixed before that position is advertised.
