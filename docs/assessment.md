# Assessment

## What it measures, and what it does not

Four sections: sector skills, work experience, English, and a profile section
that is recorded but not scored.

The bank holds 75 items across six sectors. That is enough to order candidates
roughly and to give a report that says something. It is **not** a calibrated
instrument, and nothing in the product should imply otherwise.

What is missing before a score can carry weight:

- **Calibration.** Difficulty and discrimination per item come from watching
  real responses. Until then, every item counts the same, which is wrong: a
  question nearly everyone gets right carries no information.
- **Review by people who do the work.** The items are split into one file per
  sector precisely so a hospitality supervisor can read the hospitality file and
  say whether the questions are fair. Nobody can usefully review one list of a
  hundred.
- **Proctoring.** The test is unsupervised. Someone can sit it for someone else.

## Scoring is scoped to the sector

`score(answers, sector)` only considers items the candidate could have been
shown. This matters now the bank spans six trades: without it, a housekeeper is
marked against scaffolding questions they were never asked and every score
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
