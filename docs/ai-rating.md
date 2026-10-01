# AI-assisted CV rating

## What this is, and what it is not

The pipeline produces a **suggested** score with its evidence attached. It does
not decide anything. A candidate's status changes only when a row lands in
`cv_review_decisions`, attributed to a named person.

That is not caution for its own sake. Under the EU AI Act, a system used to
evaluate candidates in recruitment is **high risk** (Annex III), and under GDPR
Article 22 a decision producing legal or similarly significant effects on a
person cannot be taken by an automated system alone. Placing someone in Portugal
is exactly such an effect. Build it any other way and the feature is a liability
rather than an asset.

## The two passes, and why they are separate

```
CV (PDF)
  │
  ├─► pass 1  extract.ts     sees the whole document, including identity
  │                          returns structure, no judgement, no scores
  │
  ├─► redact.ts              allowlist projection (NOT a denylist)
  │
  ├─► pass 2  rate.ts        sees only the allowlisted profile
  │                          scores against the sector rubric, with evidence
  │
  └─► redact.ts              CV versus what the candidate said at sign-up
```

Separating them is what makes bias control possible at all. Only pass 1 sees a
name, and its output is a factual record a human can check against the original
document.

`toRatingInput()` in `redact.ts` is an **allowlist**. If someone adds a field to
the extraction schema next month, it does not silently start reaching the rating
model. That has to be a deliberate edit.

### What is withheld from the rating pass

Name, contact details, date of birth, stated age, stated gender, marital status,
religion or caste, nationality, and whether the document carried a photograph.
Indian CVs routinely volunteer several of these without being asked, which is
precisely why they are extracted and then excluded rather than ignored.

### What is kept, and the honest limit

Employer names, job titles, dates, responsibilities, skills, languages,
qualifications, certifications and institutions are kept. They are the substance
of the assessment, and institution names in particular are needed for a
qualification to be verifiable at all.

**Redaction does not solve bias.** Employer and institution names in India still
correlate with region, language group and sometimes religion. Removing them would
destroy the signal the rating exists to measure. The mitigation is not more
redaction, it is watching outcomes: see `cv_outcome_monitor` below.

## Controls, and where each one lives in the code

| Control | Where |
|---|---|
| Identity never reaches the rating pass | `redact.ts` allowlist; `cv_protected_attributes` is a separate table with no RLS policy |
| Every score carries evidence | `criterionScoreSchema.evidence` is required; the UI says "unsupported" when it is empty |
| Absence of evidence is not negative evidence | Stated explicitly in the `rate.ts` system prompt |
| Weights are ours, not the model's | `weightedOverall()` recomputes the score from `rubric.ts` |
| Human decides | `cv_review_decisions`, reviewer taken from the session |
| Reason mandatory on override | Zod refine in the route **and** a check constraint in the table |
| Decision stays explainable | `model`, `prompt_version`, `rubric_version`, `document_hash` on every row |
| Candidate can see the reasoning | RLS policy `cv_assessments_self` |
| Generous review gate | `needsReview()` errs towards a human look |
| Outcome monitoring | `cv_outcome_monitor` view |

## Why the review gate is deliberately generous

`needsReview()` returns true on any of: the model flagged it, a discrepancy above
`info`, a document that was not fully legible, any low-confidence criterion, or
any criterion with no evidence.

That will route a lot of cases to a human. The asymmetry is the point: a reviewer
glancing at a case that did not need it costs minutes, and a threshold quietly
discarding a good candidate costs that person a year of their life.

## Employers never see the AI score

No RLS policy grants an employer access to `cv_assessments`. The rating is an
internal triage aid. Handing a raw model score to a client employer as if it were
an objective measure of a person would be both misleading and indefensible.

## The discrepancy check is the most immediately useful part

Comparing the CV against the self-reported profile from sign-up catches the thing
that actually goes wrong at this volume: a CV claiming nine years against a
self-reported "1 to 3". Not necessarily dishonesty, often a filled-in-wrong form,
but always worth a human look.

Name comparison is deliberately loose. Transliteration from Indian languages
varies a great deal (Mohammed / Muhammad / Mohd) and name order is inconsistent,
so an exact match would raise a serious flag on most honest applications.

## Cost

At cohort scale this is the largest variable cost in the product. The extraction
pass carries the document and dominates; the rating pass runs on small JSON.

- Default model: `claude-opus-5`, set by `CV_MODEL`, recorded on every assessment.
- `src/lib/cv/batch.ts` uses the Batches API for extraction: **half price**,
  asynchronous, most batches finish within an hour.
- The system prompt is cached on both passes (`cache_control: ephemeral`), which
  matters because it is identical across every CV in a cohort.

Before committing to a cohort, price it: take a representative sample of 50 real
CVs through the single path, read the actual `input_tokens` and `output_tokens`
off `cv_assessments`, and multiply. Do not estimate from page counts; scanned CVs
cost far more than text ones. `CV_MODEL` exists so that number is a decision you
make with data rather than one baked into the code.

## Still to do before this runs on real candidates

- **Calibration.** Take 100 CVs, have two recruiters score them independently
  against the rubric, and compare with the model. Without that, the numbers are
  plausible rather than validated.
- **Bias baseline.** Query `cv_outcome_monitor` grouped by state and sector as
  soon as there is volume. A gap in advance rates that the rubric does not
  explain is the signal to stop and look.
- **AI Act technical documentation.** This file is the start of it, not the whole
  of it. A conformity assessment needs a risk management file, a data governance
  description, and logging evidence.
- **Candidate-facing transparency.** The privacy page says automated scoring
  happens and a human decides. That wording needs legal review alongside the rest.
- **Retention.** How long an assessment and its extracted profile are kept, and
  what happens to them when a candidate withdraws consent.


## Career pack, measured

First real runs, 1 October 2026, on a demo candidate with two roles and a
completed assessment.

| | Input tokens | Output tokens | Wall clock |
|---|---|---|---|
| English only | 855 | 3,086 | 45s |
| With Hindi translation | 874 | 6,179 | 84s |

The translation roughly doubles output tokens and wall clock, because the
strengths, improvements and interview guidance are produced twice. Worth
knowing before a cohort: this is a per-candidate cost and it is the largest
variable one in the product.

`unsupported_lines` came back empty on both runs. Every bullet's `basedOn`
pointed at a phrase that was actually in the candidate's profile, which is what
the rule in the prompt exists to produce.

### The cap that threw away a generation

The first real call failed after 51 seconds. The model returned five strengths;
the schema capped the array at four; `messages.parse()` threw, and the whole
generation, already paid for, was discarded with a 500.

The caps are now tolerances rather than targets. The schema allows a couple
more than the pages use, the prompt states the number wanted, and `trimPack`
cuts the result to length. A model returning one item too many is not a reason
to charge a candidate for nothing.
