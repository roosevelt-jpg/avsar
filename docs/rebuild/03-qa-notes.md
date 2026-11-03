# QA notes (Phase 4–5)

## Honesty checks

- Mockup vanity metrics (1,200+ placed, 98% satisfaction, invented testimonials) were **not** added to CMS defaults.
- How-it-works keeps the six-step journey and Settings-backed shortlist figures only.
- Public jobs and employer marks hide names matching `Local Demo` (local seed convention).
- Contact page uses Settings placeholders for phones/emails — no mock contact details.

## Visual compare

Canonical PNGs: `design/references/`. Priority routes after this cycle:

| Route | Reference |
|---|---|
| `/[locale]/jobs/[slug]` | Lisbon Restaurant Service Opportunity.png |
| `/[locale]/signup` | Create Your Portugal Career Profile.png |
| CMS how-it-works / visa / about / contact / why-portugal | matching PNGs (why-portugal: design-system only) |

Already-live home/jobs/employers/register: token + BrandLogo consistency via shared header.

## Release

- Staging first.
- **Production deploy only on explicit owner “push live”.**
