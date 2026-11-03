# Existing system audit (Master Rebuild Phase 0)

Date: 2026-11-03. Stack stays: Next.js 16 App Router, React 19, Supabase, zod, Tailwind v4. No second CMS.

## Palette conflict

| Source | Navy | Gold |
|---|---|---|
| Live / owner-approved (prior mockup work) | `#0a088f` | `#c9a54a` |
| Master Spec | `#142438` | `#b28a49` |

**Decision for this rebuild:** keep live `#0a088f` / `#c9a54a` unless the owner explicitly switches after Phase 0.

## Public marketing routes

| Route | File | Content |
|---|---|---|
| `/[locale]` | `src/app/[locale]/page.tsx` | CMS `home` (+ defaults) |
| `/[locale]/jobs` | `src/app/[locale]/jobs/page.tsx` | CMS intro + Settings `jobsBoard` + live jobs |
| `/[locale]/jobs/[slug]` | `src/app/[locale]/jobs/[slug]/page.tsx` | Live job + Settings applications |
| `/[locale]/signup` | `src/app/[locale]/signup/page.tsx` | Settings + `SignupFlow` (hardcoded steps) |
| `/[locale]/how-it-works` etc. | `src/app/[locale]/[slug]/page.tsx` | CMS for `CMS_ROUTED_SLUGS` |
| `/employers` | `src/app/employers/page.tsx` | Settings `employerLanding` + live funnel counts |
| `/employers/register` | `src/app/employers/register/page.tsx` | Settings `employerRegistration` → `/api/employer/intake` |

Already redesigned (fidelity pass later): home, jobs, employers, employers/register.

## CMS defaults (`src/lib/cms/defaults/`)

Slugs: `home`, `jobs`, `how-it-works`, `why-portugal`, `visa-and-relocation`, `faq`, `stay-safe`, `for-your-family`, `about`, plus legal (`terms`, `privacy`, `refund-policy`, `selection-rules`, `delivery`, `contact`).

Block types (registry `src/lib/cms/blocks.ts`): hero, trust_bar, stats, live_funnel, steps, features, press_bar, employer_band, split, featured_jobs, job_categories, featured_employers, video, gallery, testimonials, candidate_stories, faq, cta, rich_text, notice, contact_cards, document, contact_form.

Settings read: `getSiteSettings()` in `src/lib/cms/data.ts` merges `site_settings` with `DEFAULT_SETTINGS` (`src/lib/cms/settings.ts`). Marketing keys include `general`, `navigation`, `footer`, `applications`, `seo`, `company`, `pricing`, `hiring`, `conversion`, `employerLanding`, `employerRegistration`, `jobsBoard`, `vsl`.

## RBAC

Pages: `requirePermission`. APIs: `apiPermission`. CMS: `cms.view` / `cms.edit` / `cms.publish`. Settings: `settings.manage`; company/pricing: `company.manage`. Service role only after a check.

## Payments (do not change this cycle)

Rails: eximpe, razorpay, paytm, cashfree, ngenius, stripe, viva, dodo. Checkout: `src/app/api/payments/checkout/route.ts` — amount from settings, identity from session.

## i18n

Locales in `src/lib/i18n/path.ts` (en unprefixed; hi/ar and Indian locales prefixed). Reserved: `admin`, `api`, `auth`, `employers`, `family`, …

## Integrations (names only)

Payments rails above; Resend/SES; WhatsApp Meta; staff alerts; Google Places; Anthropic CV; Turnstile; Upstash; Sentry; cron/site address; staff sign-in. Secrets via Settings › Integrations (encrypted), never `NEXT_PUBLIC_*` / `site_settings`.

## Logo / chrome today

`Wordmark` (`src/components/ui/Wordmark.tsx`) uses a route-dot `BrandMark` SVG + site name from Settings. No `BrandLogo` yet. Marketing shell: `MarketShell` + `.market` tokens in `globals.css`. Shared patterns on employers/register: gold eyebrow rule, `display-serif`, gold CTAs.

## Honesty gaps / rules

- Mockups invent stats (e.g. 1,200+ placed, 98% satisfaction). **Do not ship.** Prefer empty stats, honest copy, or `live_funnel` / real job counts.
- Testimonials block exists; do not invent quotes for the rebuild.
- Demo employers: no exclusion in `listPublishedJobs` today — harden in Phase 4 if a demo flag exists or via seed convention.
- Six-step journey in how-it-works defaults must stay; live funnel thresholds from Settings `hiring`.

## Employer intake (0036)

`employer_intake_submissions` with statuses pending → reviewing → invited | declined | converted. Staff RLS via `has_permission('leads.manage')` or `employers.manage` (text overload). Public write via service role in API after validation/rate-limit.

## Contact

CMS slug `contact` at `/[locale]/contact` (`contact_form` block). Employers page also embeds `ContactForm` at `#contact`.
