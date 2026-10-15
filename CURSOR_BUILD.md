# CURSOR_BUILD.md: production build specification

**Product:** S&A Recruitment, a recruitment platform placing talent from **India** with employers in **Portugal**, operated by a recruitment company based in the **UAE**.
**Audience for this document:** Cursor's agent (and any developer) taking the codebase to production.
**How to use it:** work through Part 4 phase by phase, in order. Each task has acceptance criteria; a task is done only when they all pass and `npm run typecheck && npm run lint && npm run build` succeeds. Read `AGENTS.md` and `.cursor/rules/` first: they hold the conventions this document assumes.

---

## Part 1: What we are building

### 1.1 Goals

1. A talent in India lands on the site and can **apply to a real job in under five minutes, from a phone, on mobile data**, without creating an account first in a separate flow.
2. Every talent has **their own dashboard**: log in, see open positions, apply, and track each application stage by stage.
3. Talents can **pay by UPI** (plus RuPay, Indian cards and net banking) even though the company is in the UAE.
4. **Multiple admin users** with **role-based access control (RBAC)**: each staff member sees and does only what their role allows.
5. The website is a **full CMS**: admins manage text, images, videos, navigation and settings. **Every page ships pre-filled** with finished content tailored to Indian candidates moving to Portugal; admins can keep it or edit it.
6. A **live analytics dashboard** for staff with stats cards and charts that update in real time.
7. **Modern, premium, trustworthy** design that works on a 360px phone and reads correctly in English, Hindi and Arabic (RTL).

### 1.2 Non-goals for v1

- Native mobile apps (the site is mobile-first; a PWA manifest exists).
- Employer self-service job posting (employers request vacancies; staff publish them; see Phase 6).
- Automated visa filing with government systems.

### 1.3 Users and roles

| User | Where | Can |
|---|---|---|
| Visitor | `/[locale]/...` | Read pages, browse jobs, apply (creates account in the same form) |
| Candidate (talent) | `/[locale]/dashboard`, `/[locale]/dashboard/applications`, `/[locale]/profile`, `/[locale]/assessment` | Track applications, withdraw, take the assessment, pay, manage profile and visibility |
| Employer contact | `/admin` (limited) | Search talent pool, shortlists, placements |
| Staff | `/admin/...` | Per role (below) |

Staff roles shipped (editable in the console; checks are by **permission**, never role name):

| Role | Purpose |
|---|---|
| `super_admin` | Everything, including roles. Keep to one or two people. |
| `admin` | Day-to-day running; cannot change role permissions or mint super admins |
| `recruiter` | Jobs, application pipeline, employers, placements |
| `reviewer` | CV and assessment review; read-only applications |
| `content_editor` | Page drafts and media; cannot publish |
| `content_manager` | Edit and publish pages, media, site settings |
| `finance` | Payments and refunds |
| `support` | Read-only to answer candidate questions |

Permissions: `dashboard.view, jobs.view, jobs.edit, jobs.publish, applications.view, applications.manage, candidates.view, candidates.export, cv.review, employers.manage, placements.manage, cms.view, cms.edit, cms.publish, media.manage, settings.manage, payments.view, payments.refund, staff.manage, roles.manage, audit.view` (plus `*` for super admin).

---

## Part 2: Current state of the repository

The repository is **not a blank slate**. Most of v1 is written. Your job is to make it build, verify it, close the gaps listed in Part 4, and ship.

### 2.1 Stack

- **Next.js 16** App Router, React 19, server components first. Middleware lives in `src/proxy.ts` (Next 16 naming).
- **TypeScript strict** with `noUncheckedIndexedAccess`.
- **Tailwind v4**; design tokens in `src/app/globals.css` (`paper, canvas, surface, ink, ink-2, muted, line, accent` terracotta, `employer` blue, `success`). Fonts via `next/font` (Schibsted Grotesk, JetBrains Mono, Noto Devanagari, Noto Arabic).
- **Supabase**: Postgres + RLS, Auth (email + password), Storage.
- **zod** for validation. No UI kit, ORM, state library or Markdown library, by design.
- **Vercel** hosting, Vercel Cron (`vercel.json`).
- Email via **Resend** or **Amazon SES** (no-op logger when unconfigured).
- Payments: adapters for **EximPe** (recommended), Cashfree, Razorpay, Stripe, Viva, Dodo behind one interface.

### 2.2 What already exists

| Area | Location | State |
|---|---|---|
| Candidate signup, profile, assessment (server-timed), report PDF, career pack, voice intro | `src/app/[locale]/...`, `src/lib/assessment`, `src/lib/cv` | Built, in production previously |
| Payment rails + webhook + return handler | `src/lib/payments/*`, `src/app/api/payments/*` | Built |
| Talent search, shortlists, CV queue, employers, placements, cohorts | `src/app/admin/*` (older screens) | Built, now permission-guarded |
| **RBAC** (roles, permissions, `has_permission()`, guards, staff + roles screens) | `supabase/migrations/0014_rbac_jobs_cms.sql`, `src/lib/rbac/*`, `/admin/staff`, `/admin/roles` | **Written, not yet run** |
| **Jobs** (postings, board, detail with JSON-LD, admin CRUD) | `src/lib/jobs/*`, `src/app/[locale]/jobs/*`, `/admin/jobs` | **Written, not yet run** |
| **Applications** (one-step apply, tracker, withdraw, admin pipeline, emails) | `src/lib/applications/*`, `src/app/api/applications/*`, `/[locale]/dashboard/applications`, `/admin/applications` | **Written, not yet run** |
| **CMS** (block registry, 16 block types, defaults for 8 pages, editor, versions, preview, media library, site settings) | `src/lib/cms/*`, `src/components/cms/*`, `src/components/admin/cms/*`, `/admin/cms`, `/admin/settings` | **Written, not yet run** |
| **Live analytics dashboard** | `src/lib/console/analytics.ts`, `src/components/admin/analytics/*`, `/admin/dashboard`, migration `0015_console_realtime.sql` | **Written, not yet run** |
| Docs | `AGENTS.md`, `.cursor/rules/*.mdc`, `docs/v2-platform.md`, `docs/ROADMAP.md`, `docs/payments.md` | Current |

**Important:** the v2 code was type-checked against stubbed library types and every new page was server-rendered in demo mode, but it was **never compiled with the real dependencies** (`npm install` was unavailable where it was written). Expect a small number of real type or lint errors in Phase 0.

### 2.3 Demo mode (must keep working)

With no Supabase env vars, every page renders with sample jobs, sample applications and default CMS content; the console is open as a demo super admin; every write returns `503 { error: 'demo_mode' }`. Never break this; it is how design and QA review without infrastructure.

### 2.4 Repository map

```
src/app/[locale]/page.tsx                 Home (CMS page "home")
src/app/[locale]/[slug]/page.tsx          CMS pages: how-it-works, why-portugal, visa-and-relocation, faq, stay-safe, about
src/app/[locale]/jobs/page.tsx            Jobs board (GET-form filters, pagination)
src/app/[locale]/jobs/[slug]/page.tsx     Job detail + ApplyPanel + JSON-LD JobPosting
src/app/[locale]/dashboard/page.tsx       Candidate overview (applications summary + assessment report)
src/app/[locale]/dashboard/applications   Application tracker
src/app/[locale]/classic/page.tsx         Old hand-built landing (noindex; delete after sign-off)
src/app/admin/dashboard                   Live analytics
src/app/admin/{jobs,applications,cms,settings,staff,roles,payments,audit,forbidden}
src/app/api/applications                  POST apply; /[id]/withdraw
src/app/api/admin/{jobs,applications,cms,settings,staff,roles,payments}
src/lib/rbac          permissions.ts (names, client-safe) · server.ts (guards) · data.ts
src/lib/cms           blocks.ts (registry) · sanitize.ts · data.ts · settings.ts · tokens.ts · media.ts · defaults/*
src/lib/jobs          types.ts · schema.ts (zod) · data.ts · sample.ts · admin.ts
src/lib/applications  status.ts · data.ts
src/lib/console       analytics.ts
src/components/cms    BlockRenderer, primitives, Markdown, blocks/*
src/components/admin  MediaPicker, upload, SettingsForm, StaffManager, RoleMatrix, ApplicationActions, jobs/JobForm, cms/*, analytics/*
supabase/migrations   0001 … 0015 (append-only)
supabase/seed         jobs_sample.sql (drafts), bootstrap_super_admin.sql
```

---

## Part 3: Specification

### 3.1 Candidate experience

**Home (`/[locale]`)** rendered from CMS page `home`. Default blocks: hero with film and stats strip → trust bar (verified employers, UPI on this site only, legal contracts, visa support) → open jobs (live) → six-step journey → job categories with photos → "what a job includes" → features for Indian candidates → intro film → FAQ → call to action.

**Jobs board (`/[locale]/jobs`)**
- Search box (Postgres full-text, `websearch` syntax), role select (grouped by area), city select, Search button. Plain GET form: works without JavaScript, URLs are shareable on WhatsApp.
- Cards: image (job image or position photo), location, title, employer label, summary (2 lines), salary chip, housing chip, openings, "Featured" and "Visa support" badges.
- Featured first, then newest. 12 per page, numbered pagination. Clear empty state with "Create my profile".

**Job detail (`/[locale]/jobs/[slug]`)**
- Hero image, location, title, employer label, summary; 8 key facts (salary, location, contract, housing/meals, experience, English, visa, openings); description (safe Markdown); responsibilities, requirements, benefits; "Free to apply. No placement fee." trust box; similar jobs.
- Sticky **ApplyPanel** (right on desktop, inline on mobile):
  - Visitor: full name, email, mobile with country code (default India), password (≥8), screening questions, optional note, consent checkbox → **one submit**: `POST /api/auth/register` then `POST /api/applications`. Handles `account_exists` (link to sign in with `next`), `phone_taken`, validation messages.
  - Candidate: screening questions + note → Apply. Already applied → shows status and "Track my application".
  - Staff/employer: told to use the console.
  - Closed job: "Applications closed".
- Emits `application/ld+json` `JobPosting` (Google for Jobs).

**Candidate dashboard**
- `/[locale]/dashboard`: "My applications" card with stats strip (Applied, In progress, Interviews, Offers, last update) and up to 4 rows; then the existing assessment report, journey, career pack, visibility toggle.
- `/[locale]/dashboard/applications`: one tracker card per application: reference, job, 7-step progress bar (Applied → Review → Shortlist → Interview → Offer → Visa → Arrived), plain-language "What this means", history timeline (candidate-visible events and recruiter messages), withdraw (two-step confirm). Closed/withdrawn collapsed. "Jobs you might like".

**Application stages** (`src/lib/applications/status.ts`): `submitted, screening, shortlisted, interview, offer, hired, visa_processing, relocated, rejected, withdrawn`. Each has a recruiter label and a candidate title/body. Candidates may withdraw until `hired`.

**Notifications:** email on "Application received" and on every stage change a recruiter marks visible (`src/lib/email/application.ts`). WhatsApp is Phase 5.

**CMS content pages:** how-it-works, why-portugal, visa-and-relocation, faq, stay-safe, about; plus `jobs` (intro/outro text around the live listing). All pre-filled; see `src/lib/cms/defaults/`.

**Languages:** `en`, `hi`, `ar` (RTL). UI strings in `src/lib/i18n/dictionary.ts`. CMS pages fall back to English until a translation is published.

### 3.2 CMS

- A page = ordered **blocks** `{ id, type, hidden?, data }`. Block types: `hero, trust_bar, stats, steps, features, split, featured_jobs, job_categories, video, gallery, testimonials, faq, cta, rich_text, notice, contact_cards`.
- **Registry** `src/lib/cms/blocks.ts` defines each type's fields once; it drives the editor form, the sanitiser and the "Add block" menu.
- **Storage:** `cms_pages` (draft `blocks`/`seo`; live `published_blocks`/`published_seo`), unique `(slug, locale)`. `cms_page_versions` on every save/publish. Public reads only through view `cms_public_pages`.
- **Resolution:** published in visitor locale → published English → defaults in code. Pages are never empty.
- **Editor** (`/admin/cms/[slug]?locale=`): collapsible block forms, reorder, hide/show, add, remove; title; SEO (title, description, share image, noindex); save draft (`cms.edit`); save and publish / unpublish / reset to default / restore version (`cms.publish`); preview at `/admin/cms/preview` (never public); placeholder reference.
- **Placeholders:** `{{fee_inr}} {{response_days}} {{contract_years}} {{hire_rate}} {{funnel_call}} {{funnel_presented}} {{support_phone}} {{support_email}} {{whatsapp}} {{whatsapp_digits}} {{brand}}`, resolved at render. Numbers decided in code must use these.
- **Media library** (`/admin/cms/media`): drag-and-drop; browser uploads **directly to Supabase Storage** via a signed upload URL (`/api/admin/cms/media/sign`), then records the row (`POST /api/admin/cms/media`). JPG/PNG/WebP/AVIF/GIF ≤15 MB, MP4/WebM ≤100 MB, PDF ≤20 MB; **no SVG**. Alt text, copy URL, delete. Built-in repo images listed read-only. Picker available in every image/video field and in the job form.
- **Site settings** (`/admin/settings`): contact (phone, WhatsApp, email, address, hours, socials), announcement bar, navigation (en/hi/ar labels), header button, footer blurb, application rules (`allowQuickApply`, `requirePaidAssessment`, which needs `jobs.publish`), default SEO. Public table: **no secrets**.
- **Security:** no raw HTML anywhere. Rich text = safe Markdown subset (`components/cms/Markdown.tsx`). URLs pass `safeUrl()` (relative, `#`, http(s), mailto, tel).
- Publishing calls `revalidatePath('/', 'layout')`.

### 3.3 Admin console

All pages under `AdminShell` (sidebar filtered by permission; mobile menu). Every page starts with `requirePermission(...)`; every API with `apiPermission(...)` + `demoWriteRefusal(...)`; every write calls `audit(...)`.

| Screen | Key behaviour |
|---|---|
| `/admin/dashboard` | Live analytics (3.4) |
| `/admin/jobs` | Status filter chips; table with salary, applications, new, updated |
| `/admin/jobs/new`, `/admin/jobs/[id]` | JobForm: title → auto slug; role; employer (internal) + employer label (public); city/region/country; contract type/length; salary min/max/period; housing; meals/visa/relocation; experience; English; languages; summary; description; responsibilities/requirements/benefits (one per line); screening questions (yes/no, text, choice; required flag; max 10); image; featured; closing date; SEO. Save draft (`jobs.edit`); publish/close/archive (`jobs.publish`). Delete only if no applications. |
| `/admin/applications` | Stage chips with counts; job filter; name/email search; paginated table (candidate, job, stage, assessment, rating, dates) |
| `/admin/applications/[id]` | Candidate details (WhatsApp link), answers, note, full history incl. internal notes; actions: move stage (shows candidate-facing text), message, visible-to-candidate toggle, email toggle, internal note, 1–5 rating |
| `/admin/cms`, `/admin/cms/[slug]`, `/admin/cms/media`, `/admin/settings` | 3.2 |
| `/admin/payments` | Status filter, totals by currency, table, CSV export (formula-injection safe, audited) |
| `/admin/staff` | Invite (account created confirmed, password-set email), change role, deactivate. Cannot change self; cannot remove last active super admin; granting super admin needs `roles.manage` |
| `/admin/roles` | Permission matrix per role; super admin fixed; create/delete custom roles |
| `/admin/audit` | Last 300 entries, filter by action/subject |
| `/admin/forbidden` | Names the missing permission |
| Older screens | `/admin` talent search, shortlists, CV queue, review, cohorts, employers, placements |

### 3.4 Live analytics (`/admin/dashboard`)

- Range selector **7 / 30 / 90 days** scopes everything.
- **Right now:** waiting for review (highlighted when >0), in interview, offers out, live jobs.
- **KPI cards** (value, change vs previous equal period with arrow + sign + colour = good/bad, sparkline): Applications, New candidates, Assessments paid, Revenue, Shortlist rate (pts), Median time to first response (falling = good).
- **Daily activity chart** (one metric at a time, single axis, crosshair, keyboard arrows, table view).
- **Hiring funnel** (cumulative by furthest stage, step conversion %).
- **Breakdowns:** most applied-for jobs, applications by role, applicants by Indian state, payment methods (UPI/card/net banking).
- **Latest activity** list.
- **Realtime:** Supabase Realtime on `applications`, `candidates`, `payments`, `job_postings` → debounced `router.refresh()`; fallback 60s polling; pauses when tab hidden. Migration 0015 adds publication + staff read policy on `payments`.
- Cards are filtered by the viewer's permissions.
- Charts use one hue (`--color-employer`, validated ≥3:1 on white); text never in series colour.

### 3.5 Payments (UAE company, UPI)

- Production: `PAYMENT_PROVIDER=eximpe`, `NEXT_PUBLIC_CHARGE_CURRENCY=INR`. EximPe holds an RBI **PA-CB import** authorisation: collects INR by UPI/RuPay/net banking from Indian consumers and settles to a foreign company. Cashfree is the drop-in alternative.
- Price: `ASSESSMENT_FEE.inr = 2400` (₹2,400) when INR; `eur = 25` otherwise. Amount always server-side via `chargeAmountMinor()`; minor units everywhere; adapters convert (EximPe takes rupees).
- Checkout refuses if `RAIL_CURRENCIES[provider]` lacks `CHARGE_CURRENCY`.
- Webhook `/api/payments/webhook` is the source of truth; signature + 5-minute freshness verified (EximPe V2 header). Browser return is convenience only.
- What is paid for: the optional assessment report/career pack. **Applying is free. Candidates never pay placement fees** (`PLACEMENT_FEE.payer = 'employer'`).
- `ENTITY` in `src/lib/data/brand.ts` must exactly match the merchant of record (see Part 6).

### 3.6 Data model (migrations 0014–0015)

`roles`, `permissions`, `role_permissions`; `staff_users` (+ `full_name, active, invited_by, last_seen_at`, FK to roles); functions `is_staff()`, `has_permission(text)`, `my_permissions()`.
`job_postings` (status enum `draft|published|closed|archived`, salary, housing, visa, screening_questions jsonb, generated tsvector `search`, triggers for `updated_at` and `published_at`); public RLS only for published and not past `closes_at`.
`applications` (reference `APP-XXXXXXXX`, status enum, unique `(job_id, candidate_id)`), `application_events` (append-only), `saved_jobs`; functions `apply_to_job(...)`, `withdraw_application(...)` (security definer); view `job_pipeline`.
`cms_pages`, `cms_page_versions`, `cms_media`, `site_settings`, view `cms_public_pages`, bucket `cms-media`.
0015: `payments_staff_read` policy, realtime publication, date indexes.

### 3.7 Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | LCP < 2.5s on a mid-range Android over 4G (Lighthouse mobile ≥ 85 for home, jobs, job detail). Server components by default; `next/image` with `sizes`; fonts self-hosted |
| Accessibility | WCAG 2.2 AA: labels on every input, visible focus, `aria-current` on nav, colour never the only signal, RTL correct with logical properties (`ps/pe`, `start/end`) |
| Security | RLS on every table; service role only after permission checks; zod on every body; no secrets in `NEXT_PUBLIC_*` or `site_settings`; no `dangerouslySetInnerHTML` for content (only JSON-LD, escaped); CSV formula-injection guard; audit log on every console write |
| Privacy | India DPDP Act: consent stored, visibility toggle respected in talent search; GDPR when data reaches Portuguese employers |
| SEO | Per-page metadata from CMS; sitemap includes CMS pages and live jobs; robots blocked until `ALLOW_INDEXING=true`; JobPosting JSON-LD |
| Reliability | Webhook idempotent; history written before state; emails never break a request |
| Browsers | Last 2 versions of Chrome/Safari/Firefox/Edge; Android Chrome 100+; iOS Safari 16+ |

---

## Part 4: Build plan (do in order)

### Phase 0: Make it build (blocking)

**0.1 Install and compile.** `npm install`; `npm run typecheck`; `npm run lint`; `npm run build`. Fix every error **without changing behaviour**. Likely spots: zod inference in `src/app/api/admin/settings/route.ts` (indexing `schemas[key]`), Supabase row typing in `src/lib/*/data.ts`, React event types in `src/components/admin/analytics/TrendChart.tsx`, the `react-hooks` lint rules in client components.
*Accept:* all three commands pass with zero errors; `npm run dev` with an empty `.env.local` renders `/en`, `/en/jobs`, `/en/jobs/line-cook-algarve`, `/en/dashboard/applications`, `/admin/dashboard`, `/admin/cms/home`.

**0.2 Visual QA in demo mode.** Open every route in 2.4 at 360px, 768px and 1440px, and in `/ar`. Fix overflow, clipped labels, broken RTL, contrast.
*Accept:* no horizontal page scroll at 360px; Arabic layout mirrors; no console errors or hydration warnings.

### Phase 1: Infrastructure

**1.1 Supabase project** (region `ap-south-1` for candidate data). Run migrations `0001` → `0015` in order. Run `supabase/seed/bootstrap_super_admin.sql` with the owner's email. Optionally `supabase/seed/jobs_sample.sql` (drafts).
Auth settings: email+password on; "Confirm email" off (the app does its own verification stamp); Site URL and redirect `https://<domain>/auth/callback`; leaked-password protection on; SMTP via Resend.
*Accept:* super admin signs in at `/en/signin` and lands on `/admin/dashboard` showing "Super admin".

**1.2 Environment** (Vercel, all environments): fill from `.env.example`. Minimum for production: Supabase keys, `IDENTITY_HASH_SALT`, `SITE_ORIGIN`, `PAYMENT_PROVIDER=eximpe`, `NEXT_PUBLIC_CHARGE_CURRENCY=INR`, `EXIMPE_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`. Leave `ALLOW_SIMULATED_PAYMENTS` empty.
*Accept:* `scripts/push-env.sh` (or the Vercel dashboard) shows every variable; deploy succeeds.

**1.3 Realtime** enabled for the project.
*Accept:* applying in one browser updates `/admin/dashboard` in another within 5 seconds, with the badge reading "Live".

### Phase 2: End-to-end verification against a real database

For each flow, write it down as a manual test, run it, fix what fails:

1. Staff invites a recruiter and a content editor; each sees only their screens; direct URL to a forbidden screen lands on `/admin/forbidden`; API calls return 403.
2. Recruiter creates a job with two screening questions, publishes it; it appears on `/en/jobs` and in the sitemap.
3. Visitor applies from the job page with the one-step form; account is created; application appears in the tracker and in `/admin/applications`; "Application received" email arrives.
4. Recruiter moves the application to Interview with a visible message; candidate's tracker shows it and an email arrives; an internal note stays invisible to the candidate.
5. Candidate withdraws, then re-applies; history shows both.
6. Content editor edits the home hero and saves (not live); content manager publishes (live); restore an older version; reset to default.
7. Upload a 50 MB MP4 and a JPG in the media library; use both in a page; delete the JPG.
8. Edit Site settings (WhatsApp number, announcement, nav); header, footer and `{{whatsapp}}` placeholders update.
9. EximPe sandbox: complete the assessment, pay ₹2,400 by UPI; webhook marks the candidate paid; payment shows in `/admin/payments` and dashboard revenue.
10. Deactivate a staff member; their next request is refused.

*Accept:* all ten pass; each console write appears in `/admin/audit`.

### Phase 3: Automated tests and CI

- **Vitest** unit tests: `sanitizeBlocks` (every default page round-trips unchanged; `javascript:` and `//` URLs removed), `applyTokens`, `localHref`, `formatSalary`, `slugify`, `grants`, `aggregate()` in `src/lib/console/analytics.ts` (empty previous period → `previous: null`), status helpers.
- **Playwright** e2e in demo mode: home renders; jobs filter; job page shows apply form; candidate tracker renders; console dashboard renders; CMS editor add/move/remove block (client-side only).
- **GitHub Actions**: typecheck, lint, unit, build on every PR; e2e on main.
*Accept:* `npm test` and `npm run e2e` pass locally and in CI.

### Phase 4: Hardening

- Rate limiting (Upstash Redis or Vercel KV) on `/api/auth/register`, `/api/applications`, `/api/admin/cms/media/sign`, `/api/auth/request-code`.
- Cloudflare Turnstile on the one-step apply form for anonymous visitors.
- Security headers in `next.config.ts`: CSP (allow EximPe SDK host and its SRI-pinned script, Supabase, YouTube-nocookie frames), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Error monitoring (Sentry) and uptime check on `/en` and `/api/payments/webhook` (GET).
- Supabase daily backups + point-in-time recovery; staging project.
*Accept:* securityheaders.com grade A; 20 rapid apply submissions from one IP are throttled; errors appear in Sentry.

### Phase 5: Growth features (from `docs/ROADMAP.md`, prompts ready to paste)

1. WhatsApp Business notifications (opt-in on the apply form).
2. Saved jobs + weekly job alerts (table `saved_jobs` already exists).
3. CV upload on the apply form.
4. Interview scheduling (`application_interviews`), times shown in IST and Lisbon time.
5. Hindi translations of every CMS page as drafts for native review.
6. Bulk actions and CSV export in applications (`candidates.export`).

### Phase 6: Employer portal (optional for launch)

Employers submit vacancy requests that arrive as draft jobs linked to their employer; they see applicants only after a recruiter shortlists them.

### Phase 7: Launch

Run Part 5 and Part 6 checklists. Set `ALLOW_INDEXING=true` only when payments work in production. Submit the sitemap to Google Search Console. Delete `/[locale]/classic` once the CMS home is signed off.

---

## Part 5: Production go-live checklist

- [ ] Phases 0–4 accepted
- [ ] Migrations 0001–0015 applied in production; super admin bootstrapped; sample jobs either deleted or matched to real vacancies before publishing
- [ ] Every CMS page reviewed by the business; real phone, WhatsApp, email and address in Site settings
- [ ] At least five real, verified job postings published
- [ ] EximPe production keys; webhook registered and IP-whitelisted; one real ₹2,400 UPI payment completed and refunded
- [ ] Resend domain verified (SPF, DKIM, DMARC); test emails land in Gmail inbox, not spam
- [ ] Legal pages (`/terms`, `/privacy`, `/refund-policy`, `/selection-rules`, `/delivery`, `/contact`) reviewed by counsel and match the seller entity
- [ ] Lighthouse mobile ≥ 85 on home, jobs, job detail; WCAG spot-check with a screen reader
- [ ] Backups verified by a restore to staging
- [ ] `ALLOW_INDEXING=true`; sitemap submitted
- [ ] Staff trained: recruiters (pipeline), content team (CMS), finance (payments export)

---

## Part 6: Business and legal blockers (not code, but they block launch)

1. **Indian recruiting licence.** Recruiting Indian citizens for jobs abroad requires a Recruiting Agent registered under the Emigration Act 1983 (eMigrate) with a bank guarantee. A UAE company cannot hold it: use an Indian entity or a registered Indian partner. The "Stay safe" page tells candidates to verify agents on emigrate.gov.in, so the registration number must be shown on About and in the footer.
2. **Seller of record.** `ENTITY` in `src/lib/data/brand.ts` names a Portuguese company (from the Viva setup). If the UAE company collects through EximPe, replace with the UAE company's exact legal name, trade licence number and registered address; footer, receipts and legal pages follow automatically.
3. **Indian GST (OIDAR).** A foreign supplier of online services to Indian consumers may owe 18% IGST. `VAT_RATE` is 0. Confirm with an accountant before the first rupee payment.
4. **Charging candidates.** Keep "Require a paid assessment before applying" **off** unless counsel approves. Portuguese law (DL 260/2009) prohibits agencies charging workers for placement; the platform already bills placement to employers.
5. **Data protection.** DPDP Act (India) and GDPR (Portugal); data processing agreements with Supabase, Resend, EximPe; privacy policy updated for jobs and applications.
6. **Content honesty.** Testimonials only with written permission; no guaranteed jobs; published odds (`SELECTION_FUNNEL` in brand.ts) reconciled with real placement records.

---

## Part 7: Conventions (summary; full version in `AGENTS.md`)

- Check **permissions, never role names**. Page: `requirePermission(p, returnTo)`. API: `apiPermission(p)` → `demoWriteRefusal(guard)` → zod → write → `audit(...)`.
- Identity, roles and prices come from the session/server, never the body.
- `getAdminSupabase()` only after a permission check; never in client code.
- Money in integer minor units.
- History before state (`application_events`, `placement_transitions`).
- Migrations append-only and re-runnable; new work goes in `0016_*.sql` onwards.
- CMS: new block = registry entry + component + renderer case. New page = defaults file + register in `defaults/index.ts`.
- Server components by default; `'use client'` only for interaction; native `<details>`/`<dialog>` first.
- Comments explain *why*, in full sentences. Candidate copy is plain, specific and honest.
- Before finishing any task: `npm run typecheck && npm run lint && npm run build`.

---

## Part 8: First prompt to paste into Cursor

> Read `CURSOR_BUILD.md`, `AGENTS.md` and every file in `.cursor/rules/`. Then do Phase 0, task 0.1: run `npm install`, `npm run typecheck`, `npm run lint` and `npm run build`, and fix every error without changing behaviour. Keep demo mode working. When all three pass, run `npm run dev` with an empty `.env.local`, open the routes listed in 0.1's acceptance criteria, and report what you changed and anything that looks wrong. Do not start Phase 1 until I confirm.
