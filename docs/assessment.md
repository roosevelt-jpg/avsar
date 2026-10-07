# Assessment

## What it measures, and what it does not

Four sections: sector skills, work experience, English, and a profile section
that is recorded but not scored.

The bank is scoped to the **position**, not only to the sector. That matters
because the sector buckets put unrelated jobs together: chef and food and
beverage service both sat in "hospitality", electrician and plumber both in
"maintenance", welder and construction worker both in "construction", driver
and logistics both in "drivers". Eight of the twelve positions shared a bank
with a different job, and hospitality was the worst of them: its twelve items
were hotel housekeeping, so a candidate applying to cook was asked the order to
service an occupied guest room.

Each position now draws its own set through the `positions` field on an item,
plus whatever its sector genuinely shares. Every position sees between eight
and sixteen items across three to eight report axes.

Most items are job knowledge rather than work samples or personality. That is
deliberate and it is what an unsupervised online test can do: on the revised
meta-analytic estimates in Sackett, Zhang, Berry and Lievens (2022), which
corrected a long-standing overcorrection for range restriction, job-knowledge
tests predict job performance at .40 and work samples at .33, with structured
interviews highest at .42. The structured interview in this product is the
assessment call, not this test.

## Calibration

Every item used to count the same, which is wrong in a way that matters: a
question almost everyone answers correctly separates nobody, and a question the
strongest candidates get wrong is either miskeyed or measuring something other
than the trade.

`/api/assessment/calibrate` walks every submitted attempt and writes two
standard statistics per item to `item_stats`:

- **p-value**, the proportion answering correctly.
- **discrimination**, the point-biserial correlation between getting the item
  right and scoring well on *the rest of the section*. Against the rest and not
  the total, because an item correlated with a total that includes itself is
  correlated with itself, which inflates every figure and the weakest items most.

Above about 0.2 is a working item. **Negative means the stronger candidates are
getting it wrong**, which in practice almost always means the key is wrong, and
that is a scoring error affecting everyone who has sat it. `/admin/items` lists
those first, with the reason, because nothing else surfaces it.

The scorer weights by discrimination once an item has `MIN_RESPONSES` answers,
clamped to [0.25, 1.25] so calibration adjusts the balance without any one item
dominating or vanishing. Below the floor every item weighs 1, which is what the
test did before. A miskeyed item is floored rather than dropped: dropping it
silently would hide the problem instead of surfacing it.

The thresholds live in `calibration.ts`, not in the database, so changing how a
score is computed is a code review rather than an UPDATE somebody runs.

## Still not a calibrated instrument

The machinery is in place; the data is not. Until real cohorts have sat these
items, every weight is 1 and a score remains a rough ordering rather than a
measurement. Nothing in the product should imply otherwise.

What is missing before a score can carry weight:

- **Calibration.** Difficulty and discrimination per item come from watching
  real responses. Until then, every item counts the same, which is wrong: a
  question nearly everyone gets right carries no information.
- **Review by people who do the work.** The items are split into one file per
  trade precisely so a head chef can read the kitchen set and say whether the
  questions are fair. Nobody can usefully review one list of a hundred. None of
  these sets has had that review yet.
- **One language.** Every item is written in English, including the trade
  questions. A skilled cook with weak English scores badly on the skills section
  for a reason that has nothing to do with cooking, which is the opposite of
  what a separate English section is for. Translating the skills items is the
  single largest validity improvement still available.
- **Proctoring.** The test is unsupervised. Someone can sit it for someone else.
  Option order is now shuffled per attempt, which stops an answer key travelling
  as "it is always B", but it does nothing about impersonation.

## Scoring is scoped to the sector

`score(answers, sector)` only considers items the candidate could have been
shown. This matters now the bank spans twelve positions: without it, a cleaner
is marked against scaffolding questions they were never asked and every score
collapses.

An unanswered scorable item counts as wrong. Skipping is a choice, and scoring
only what was attempted would reward selective guessing.

## Two kinds of item

**Keyed.** There is a right answer. `correct` holds its index. Scores 100 or 0.

**Ordinal.** `scale: true`. The options run from least to most and the answer
scores by its position. "How many people did you supervise?" has no right
answer, but a candidate who managed a team is not equivalent to one who worked
alone.

Every item in the experience section is ordinal. Before that existed, the whole
section scored zero for every candidate, because no item in it had a `correct`,
and it dragged 20% of the overall down with it.

Anything else is unscored: recorded, shown to a reviewer, but not counted.

## Weights

| Section | Weight |
|---|---|
| Skills | 0.40 |
| English | 0.40 |
| Experience | 0.20 |
| Profile | 0 |

In `scoring.ts`, one place, so changing them is a decision rather than an edit
scattered across the codebase. They are a starting position, not a finding: the
right weights come from which sections predict a placement that lasts, and that
needs placements first.

## The English section is not a qualification

See `docs/english-assessment.md`. The short version: the internal bank measures
whether someone can follow written workplace English, there is no speaking
component, and `reports.english_certified` exists so that an in-house estimate
and a certified result are never stored or shown as the same thing.

## Rescoring after a change

Changing the bank, the weights or the scoring rules makes existing reports
incomparable with new ones, and a percentile computed across a mixture of both
means nothing.

```bash
npx tsx scripts/rescore.mts          # show what would change
npx tsx scripts/rescore.mts --write  # apply, then re-rank every cohort touched
```

It recomputes from the answers on record, so it is safe to run repeatedly.

## Adding items

One file per sector in `src/lib/assessment/bank/`. An item needs `correct` to be
scored; leave it off for questions that record something about the candidate
rather than test them, like which licence categories they hold.

`axis` is what appears on the report breakdown. Keep the set small: five or six
axes a person can act on beats twenty they cannot.


## Spoken English

There isn't any, in the assessment. The English section is reading and grammar,
and the description says so.

A spoken item was considered and rejected. Grading a transcript measures
vocabulary and grammar, which the written items already measure, and misses
pronunciation, fluency and hesitation, which is the whole of what a speaking
test is for. Grading the audio directly means a model that hears it, a cost per
candidate on top of the career pack, and a number that `reports.english_certified`
would still refuse to call a certificate, because that column is generated as
`english_source <> 'internal'` and always has been.

The decisive objection is bias. Speech recognition has documented higher error
rates for Indian-accented English. An automated speaking score feeding a
recruitment decision would mark down exactly the people this product exists to
serve, which is the Annex III case and also simply the wrong thing to build.

So there is a **voice introduction** instead: forty-five seconds, on the
profile, next to the CV, not scored and labelled as not scored. Employers listen
and judge by their own criteria. A hotel manager hearing someone speak learns
more in half a minute than a letter grade conveys.

A real CEFR level, when one is needed, comes from Duolingo or EnglishScore.
`english_source` has anticipated that from the start.


## How long it takes

Counted, not estimated. The item bank serves this many questions per sector:

| Sector | Questions |
|---|---|
| Hospitality | 35 |
| IT | 39 |
| Cleaning, construction, drivers, maintenance, property management | 31 |

Four sections, 31 to 39 multiple-choice questions, plus a forty-five second
voice introduction on the profile. At thirty to forty seconds a question
including the reading, that is **twenty to thirty minutes**, and that is what
the copy now says.

The ninety minutes in `assessment_minutes()` is **per section** and is a ceiling
for somebody who loses their connection or is interrupted, not a duration. The
copy claimed sixty to ninety minutes for a long time, which was roughly three
times the truth.

It mattered more after the fee moved to the end. Somebody who pays up front and
then finds the exam short shrugs; somebody who finishes in eighteen minutes and
is immediately asked for 2,299 rupees is in a worse frame of mind than one who
has just sat a ninety-minute paper. Overstating the length was buying goodwill
the product had not earned and would have spent at exactly the wrong moment.

### If the length should go up

The bank holds 68 skills items in total but only 8 reach most sectors, because
the rest are hospitality-specific or IT-specific. Serving more to each sector is
a matter of writing items for those sectors rather than of changing any code.
