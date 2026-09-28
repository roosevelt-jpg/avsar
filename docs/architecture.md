# Architecture

## Two systems, not one

| | Talent graph | Mobility case file |
|---|---|---|
| Volume | 20,000+ per cohort | single digits per cohort |
| Value per row | ₹1,999 | €15,000-25,000 |
| Data | Indian candidates | EU placement dossier |
| Law | DPDP Act 2023 | GDPR |
| Region | Indian (ap-south) | EU (eu-west) |
| Tables | `candidates`, `assessment_*`, `reports`, `payments` | `placements`, `placement_transitions`, `documents` |

They are separated by schema today and should be separated by Postgres instance
before real candidate data arrives. The bridge between them is an explicit
promotion of a candidate into a placement, with the consent and the transfer
basis recorded at that moment. Nothing crosses by accident.

Why it matters: the compliance profiles are incompatible, the write patterns are
opposite, and the case file is the defensible IP. It must not be hostage to the
traffic on the assessment side.

## Routes

```
/[locale]                      candidate landing, Direction A
/[locale]/b                    candidate landing, Direction B (isolated tokens)
/[locale]/signup               3 steps + success, order summary aside
/[locale]/assessment           sectioned runner, server timer, autosave
/[locale]/dashboard            report, cohort timeline, visibility switch
/[locale]/pricing              3 plans + FAQ accordion
/[locale]/selection-rules      the odds disclosure, linked from everywhere
/[locale]/refund-policy
/[locale]/privacy
/[locale]/contact              includes the off-platform fee report channel
/employers                     employer landing, blue accent
/admin                         talent-pool search, filters in the URL
```

API: `/api/signup`, `/api/payments/webhook`, `/api/assessment/answer`,
`/api/candidate/visibility`, `/api/shortlist`, `/api/talent/search`.

## Decisions worth knowing

**i18n is a typed dictionary, not a library.** The handoff suggested
`next-intl`. A plain typed dictionary under `src/lib/i18n/` was used instead:
the handoff also requires the prototype's `T` object verbatim, the surface is
small, and this way a missing key is a type error rather than a runtime fallback.
Adding Tamil, Telugu, Malayalam or Punjabi means adding a key to `locales` and a
block to `dictionary.ts`.

**The answer key never reaches the browser.** `ITEM_BANK` is server-only and
every path to the client goes through `toClientItem`, which strips `correct` and
`axis`. Scoring runs server-side.

**The assessment timer is server state.** `expires_at` on the attempt is
authoritative; the countdown in the browser is display only. A clock change or a
paused tab buys no extra time.

**Item order is seeded by attempt id.** Resume-after-disconnect is required, and
a reshuffle on reload would break it.

**Answers save per answer, not per section.** Most candidates are on mobile data.
RLS refuses writes once the attempt is submitted or expired, so a late request
cannot rewrite a score.

**Search runs in Postgres.** Filtering, sorting and pagination are pushed down,
so a pool of 20,000 is never pulled into a request to be sorted in JavaScript.
`visible_to_employers` is enforced in the query and in RLS: a candidate who hid
their profile must not appear, and the FAQ promises that.

**Query parsing is deterministic, not an LLM.** `src/lib/assessment/query-parser.ts`
extracts sector, CEFR level, years, headcount and location with rules. It costs
nothing, never invents a filter, and is testable. What it understood is shown
back to the recruiter so they can correct it. An LLM can be layered in front
later for the queries it misses.

**Fonts are self-hosted via `next/font`.** Removing a render-blocking
third-party stylesheet round trip matters more than usual on Indian mobile data.
First Load JS is ~102-109 kB.

**Direction B is a separate route with scoped tokens.** `[data-variant="b"]`
keeps the two directions' CSS apart so they can be shown side by side. Build A
unless the owner picks B; if they pick B, apply its tokens to A's screen
structures rather than extending `/b`.

## Compliance built into the schema

These are not decoration. If the fee model is ever challenged, they are the
evidence:

- `candidates.consent_selection_odds_at` and `consent_version` store the odds
  disclosure consent rather than merely validating it.
- `cohorts.cohort_size` and `selected_per_cohort` hold the disclosed odds in one
  place, so the number on the landing page and the number in the rules cannot
  drift apart.
- `candidates.referral_source` and `referral_agent_id` trace every acquisition
  channel, so an intermediary charging candidates off-platform can be found.
- `fee_reports` is anonymous by design: no `candidate_id`, because a candidate
  afraid of an agent will not file a report that identifies them.
- `audit_log` and `placement_transitions` are append-only.

## What is not built yet

- Auth. Supabase Auth is wired into the clients and RLS is written against
  `auth.uid()`, but there is no sign-in flow. Candidate sign-in should be
  WhatsApp or SMS OTP on the mobile number, which also verifies it.
- Identity verification and duplicate detection. `phone_hash` and
  `passport_hash` columns exist; no provider is integrated.
- The English test. See `docs/payments.md` for why the score should come from a
  recognised provider rather than the local item bank.
- The speaking section: needs audio capture and upload.
- Report PDF generation.
- Proctoring.
- The mobility case file UI. The tables exist; there are no screens.
