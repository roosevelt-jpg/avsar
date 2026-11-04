# QA notes (Phase 4–5)

## Honesty checks

- Mockup vanity metrics (1,200+ placed, 98% satisfaction, invented testimonials) were **not** added to CMS defaults.
- How-it-works keeps the six-step journey and Settings-backed shortlist figures only.
- Public jobs and employer marks hide names matching `Local Demo` (local seed convention).
- Contact page uses Settings placeholders for phones/emails — no mock contact details.

## Visual compare

Canonical PNGs: `design/references/`.

| Route | Reference | Live status |
|---|---|---|
| `/[locale]/jobs/[slug]` | Lisbon Restaurant Service Opportunity.png | Section nav + offer grid + facts rail; sample `restaurant-server-lisbon` published for E2E |
| `/[locale]/signup` | Create Your Portugal Career Profile.png | Hero / journey shell matched; **account flow stays the product’s 2-step signup** (not the mockup’s 4-field wizard) |
| CMS how-it-works / visa / about / contact / why-portugal | matching PNGs (why-portugal: design-system only) | Composition + navy/gold; no invented stats |

Already-live home/jobs/employers/register: token + BrandLogo consistency via shared header.

### Intentional product diffs (not pixel gaps)

- Signup remains account-first (2 steps), not the mockup’s DOB / gender / nationality wizard.
- Marketing palette is Master Spec `#142438` / `#b28a49` (old `#0a088f` / `#c9a54a` removed).
- Short paths `/visa` and `/news` permanently redirect to canonical CMS slugs.

## Ops closed

- Footer / navigation (and related marketing settings) seed into `site_settings` when missing via `scripts/publish-marketing-defaults.ts`.
- Sample Lisbon restaurant job publish: `scripts/publish-sample-job.ts`.

## Release

- Staging first.
- **Production deploy only on explicit owner “push live”.**
