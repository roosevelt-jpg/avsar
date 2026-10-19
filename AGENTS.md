# AGENTS.md: working on this codebase

Read this before changing anything. Shorter engineering rules live in
`docs/dev-rules/`; this file is the longer map for people and agents alike.

## What this is

A recruitment platform that places candidates from **India** with employers in
**Portugal**. The recruitment company is in the **UAE**. Three audiences:

| Audience | Where | What they do |
|---|---|---|
| Candidates | `/[locale]/...` (en, hi, ar) | Browse jobs, apply in one step, track applications, take the free assessment (joins the database), optionally buy the career package |
| Staff | `/admin/...` | Jobs, applications, candidates, CMS, media, settings, payments, staff and roles (RBAC) |
| Employers | `/admin` (limited) | Request vacancies, see shortlisted applicants, search the talent pool, shortlists, placements |

## Stack

Next.js 16 (App Router, React 19, server components first) · TypeScript strict
(`noUncheckedIndexedAccess` on) · Tailwind v4 (tokens in `src/app/globals.css`)
· Supabase (Postgres + RLS + Auth + Storage) · zod · Vercel.

No UI kit, no ORM, no state library, no Markdown library. That is deliberate:
keep it that way unless there is a strong reason.

## Commands

```bash
npm install
cp .env.example .env.local     # fill in Supabase and INTEGRATIONS_MASTER_KEY
npm run dev
npm run typecheck && npm run lint && npm run build   # run all three before every commit
```

**No demo mode.** Every page reads live data. To see the product locally,
point it at a Supabase project, run the migrations, then the seeds in
`supabase/seed/` (sample jobs as drafts, the super admins). With no Supabase
env vars the root layout shows a "Setup required" notice naming the missing
variables, and API writes return `503 not_configured`.

**Nothing business-specific in code.** Company and partner details, prices,
VAT, hiring rules, the cohort, email wording, SEO defaults and per-page Open
Graph data are edited in the console under Settings and read through
`getSiteSettings()`; defaults live in `src/lib/company/config.ts` and
`src/lib/cms/settings.ts`. Third-party API keys are entered in Settings ›
Integrations, stored encrypted (AES-256-GCM under `INTEGRATIONS_MASTER_KEY`,
migration 0024) and read server-side through `src/lib/integrations/runtime.ts`,
with the environment variable as fallback. Interface labels stay in code.

## Map

```
src/app/[locale]/page.tsx              Home (CMS page "home")
src/app/[locale]/[slug]/page.tsx       Other CMS pages (about, faq, how-it-works, ...)
src/app/[locale]/jobs/...              Jobs board and job detail (+ JSON-LD JobPosting)
src/app/[locale]/dashboard/...         Candidate dashboard; /applications = tracker
src/app/[locale]/classic/page.tsx      The old hand-built landing, kept for reference (noindex)
src/app/admin/...                      Console. Every page starts with requirePermission()
src/app/api/applications/...           Candidate apply / withdraw
src/app/api/admin/...                  Console APIs. Every handler starts with apiPermission()
src/app/admin/vacancies, /applicants,  Employer portal pages (requireEmployerPortal, not requirePermission)
  /bench
src/app/api/employer/...               Employer APIs. Every handler starts with getSessionEmployer()
src/app/admin/inbox, /privacy,         Leads inbox, data requests, staff bell, relocation queue,
  /notifications, /relocation,         profile-unlock approvals, employer fees, two-factor enrolment
  /unlocks, /fees, /security
src/app/[locale]/dashboard/relocation  Candidate "Your move": visa file, steps, family links, story
src/app/family/[token]                 Public, noindex progress page for a candidate's family (token = credential)
src/app/api/relocation/...             Candidate document uploads, arrival steps, family links, story
src/app/api/cron/...                   Vercel Cron, Bearer CRON_SECRET (reminders, job alerts, relocation, 1-year retention)
src/app/admin/legal-reviews            Preliminary legal review queue: every package buyer is owed one (relocation.manage)
src/app/api/candidate/background       Candidate's own background answers (visa refusals, work abroad, family)

src/lib/rbac/                          permissions.ts (names), server.ts (guards), data.ts
src/lib/cms/                           blocks.ts (registry), sanitize.ts, data.ts, settings.ts,
                                       tokens.ts, defaults/* (pre-filled content for every page)
src/lib/jobs/                          types, zod schema, data access
src/lib/company/                       config.ts (client-safe defaults and money helpers), data.ts
src/lib/integrations/                  catalog.ts (every third-party key), crypto.ts, runtime.ts
src/lib/email/                         templates.ts (editable defaults), compose.ts, mailer
src/app/admin/settings/...             General, Navigation, Search & sharing, Applications, Emails,
                                       Company & pricing, Integrations
src/lib/applications/                  status vocabulary, data access
src/lib/console/analytics.ts           dashboard KPIs, series, funnel, breakdowns (one range, one place)
src/lib/employer/portal.ts             employer portal: guard, vacancy requests, applicants (masked, scored), bench
src/lib/leads/                         contact/import leads: types (client-safe), data, CSV import, phone normalising
src/lib/privacy/                       access log + consent history, export, erase
src/lib/relocation/                    documents.ts (readiness), milestones.ts (plan template), data.ts
src/lib/hiring/                        match.ts (fit score), redact.ts (masking), scorecard.ts, fees.ts, data.ts
src/lib/notifications/staff.ts         the console bell: notifyStaff() by permission; emailStaff() to STAFF_ALERT_EMAILS
src/lib/legal/review.ts                legal review records, delivery, queue
src/lib/candidate/background.ts        background questions: schema, flags for the lawyers, data access
src/lib/security/idempotency.ts        idempotency-key replay for apply, checkout, bulk move, contact, import
src/lib/observability/log.ts           request ids and structured logs
src/lib/stats/                         public funnel (test, above threshold, shortlisted, hired); /api/stats/funnel feeds the live_funnel block
src/lib/cms/video.ts                   YouTube link parsing; VideoPlayer/FilmButton load YouTube only on click
src/lib/payments/                      rail adapters (Network International / N-Genius in AED, EximPe, Cashfree, Razorpay, Stripe, Viva, Dodo)
src/components/cms/                    BlockRenderer + one component per block type
src/components/admin/                  console client components (editors, forms, pickers)
supabase/migrations/                   schema, in order. 0014 = RBAC, jobs, applications, CMS; 0015 = realtime;
                                       0016 = growth; 0017 = employer portal; 0018 = operations
                                       (leads, privacy, bell, idempotency); 0019 = relocation and hiring;
                                        0020 = shorter signup (no English self-rating); 0021 = free database
                                        (talent pool without payment); 0022 = legal review + national ID;
                                        0023 = candidate background; 0024 = admin config
                                        (encrypted integration secrets, company/integrations permissions);
 0025 = public funnel stats (anon-callable aggregate counts only);
 0026 = avatars bucket; 0027 = staff reads tied to permissions, not is_staff()
docs/ops/                              backup/restore, incident runbook, SLOs, secrets inventory
docs/owner-answers.md                  owner questionnaire decisions and open items for the lawyer
supabase/seed/                         sample job drafts, the two super admins (run after the migrations);
                                       local employer login: npm run seed:employer (see seed/local_employer.md);
                                       local applicant login: npm run seed:applicant (see seed/local_applicant.md)
```

## Rules that keep this safe

1. **Permissions, never role names.** Pages: `await requirePermission('jobs.edit', '/admin/...')`.
   APIs: `const guard = await apiPermission('jobs.edit'); if (guard instanceof NextResponse) return guard;`
   RLS uses `has_permission()` for the same names.
2. **Identity from the session only.** Never read a user id, candidate id, role or
   price from a request body.
3. **Service role only after a check.** `getAdminSupabase()` bypasses RLS. Use it
   in a route handler after `apiPermission`, or in a server component after
   `requirePermission`. Never in a client component.
4. **Every console write is audited:** `await audit(userId, 'thing.verb', 'subject:id', detail)`.
5. **CMS content is data, not HTML.** Blocks are sanitised through the registry
   (`sanitizeBlocks`) on save and on read. Rich text is the safe Markdown subset in
   `components/cms/Markdown.tsx`. Never add `dangerouslySetInnerHTML` for CMS text.
6. **Money is integer minor units** (paise / cents). The amount is set server-side.
   The webhook is the source of truth for "paid".
7. **Status changes write history first** (`application_events`, `placement_transitions`),
   then the state.
8. **Migrations are append-only and re-runnable** (`if not exists`, `on conflict do nothing`).
   Never edit an applied migration; add `0015_...sql`.
9. **No secrets in `site_settings` or `NEXT_PUBLIC_*`.** Both are public.
10. **Mobile first, slow networks.** Server components by default, `'use client'`
    only for interaction, native `<details>`/`<dialog>` before JavaScript widgets,
    `next/image` with `sizes`.

## How to...

**Add a CMS block type.** (1) Add a definition to `BLOCKS` in `src/lib/cms/blocks.ts`
(fields + empty). (2) Add a component in `src/components/cms/blocks/`. (3) Add a
`case` in `BlockRenderer.tsx`. The editor form, sanitiser and "Add block" menu
pick it up automatically.

**Add a CMS page.** Add `src/lib/cms/defaults/<page>.ts` with real, finished
content, register it in `defaults/index.ts`, and it is live at `/[locale]/<slug>`
and listed in the console. Add it to the navigation in Site settings if needed.

**Add a permission.** Add it to the `permissions` table in a new migration, to
`PERMISSIONS` and `PERMISSION_GROUPS` in `src/lib/rbac/permissions.ts`, grant it to
roles in the migration, then use it in guards.

**Add a setting.** Extend `SiteSettings` and `DEFAULT_SETTINGS` in
`src/lib/cms/settings.ts`, the zod schema in `src/app/api/admin/settings/route.ts`,
and the form in `src/components/admin/SettingsForm.tsx`.

**Add a job field.** Migration → `Job` type + `jobFromRow` + `jobToRow` in
`src/lib/jobs/types.ts` → `jobInputSchema` → `JobForm` → job detail page.

## Style

Comments explain *why*, in full sentences, above the thing they explain (see any
existing file). Copy is plain, honest and specific: salary, city, what is
included, what it costs. No hype, no invented testimonials, no guaranteed jobs.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
