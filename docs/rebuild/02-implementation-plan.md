# Implementation plan (Master Rebuild)

## Reuse vs add

| Area | Action |
|---|---|
| Stack (Next/Supabase/zod/Tailwind) | Reuse |
| CMS (`cms_pages` + blocks + Settings) | Extend defaults/copy/chrome; no parallel `cms_sections` |
| Auth / payments / assessments | No contract changes |
| Design tokens | Align ivory/serif/gold CTA; keep `#0a088f` / `#c9a54a` |
| Brand mark | Add SVG `BrandLogo` (S&A / RECRUITMENT / SMITH & ADAMS + gold rule); wire through `Wordmark` |
| Home / jobs / employers / register | Fidelity + token consistency only |
| Job detail, signup, how-it-works, why-portugal, visa, about, contact | Phase 3 redesign against `design/references/` |
| Migrations | Additive only (0036 already for intake). No payment schema churn |

## Phase order

0. Audit + references (this doc + `01-…`, `design/references/`) — **stop for palette/priority confirm** (plan gate; proceed with live palette).
1. Tokens + BrandLogo + shared marketing chrome.
2. CMS/Settings gaps only if a page cannot be expressed with existing blocks (prefer defaults edits).
3. Remaining pages in priority order (job detail → signup → how-it-works → why-portugal → visa → about → contact).
4. Live data honesty (no mock stats; optional demo-employer exclusion).
5. `typecheck` / `lint` / `build`; visual compare to references.
6. Staging; **production only on explicit “push live”**.

## Risks

- Overwriting honest CMS defaults with mockup vanity metrics.
- Breaking signup/checkout by reshaping `SignupFlow` beyond chrome.
- Large PNGs in `design/references/` bloating the repo — keep one canonical folder; do not duplicate into `public/`.
- Header nav mismatch if Settings navigation is not updated to match mockup labels (edit via console, not hardcode business copy).

## Rollback

- Revert UI commits; CMS defaults fall back when DB drafts reset.
- Do not roll back applied migrations; add a follow-up migration if intake must be disabled.
- Feature flags: none required; pages are Settings/CMS driven.

## Acceptance

- Mockups mapped; Phase 0 docs present.
- BrandLogo SVG in headers (not a screenshot).
- Remaining marketing pages match mockup composition (hero budget, navy/gold, display-serif accents) without fake stats/testimonials.
- Job board still live; empty states honest.
- `npm run typecheck && npm run lint && npm run build` green.
- No production deploy without owner approval.
