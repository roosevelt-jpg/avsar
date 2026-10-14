# AGENTS.md: working on this codebase

Read this before changing anything. Cursor loads the rules in `.cursor/rules/`
automatically; this file is the longer version for people and agents alike.

## What this is

A recruitment platform that places candidates from **India** with employers in
**Portugal**. The recruitment company is in the **UAE**. Three audiences:

| Audience | Where | What they do |
|---|---|---|
| Candidates | `/[locale]/...` (en, hi, ar) | Browse jobs, apply in one step, track applications, take the assessment, pay by UPI |
| Staff | `/admin/...` | Jobs, applications, candidates, CMS, media, settings, payments, staff and roles (RBAC) |
| Employers | `/admin` (limited) | Search the talent pool, shortlists, placements |

## Stack

Next.js 16 (App Router, React 19, server components first) · TypeScript strict
(`noUncheckedIndexedAccess` on) · Tailwind v4 (tokens in `src/app/globals.css`)
· Supabase (Postgres + RLS + Auth + Storage) · zod · Vercel.

No UI kit, no ORM, no state library, no Markdown library. That is deliberate:
keep it that way unless there is a strong reason.

## Commands

```bash
npm install
cp .env.example .env.local     # everything blank = demo mode, fully clickable
npm run dev
npm run typecheck && npm run lint && npm run build   # run all three before every commit
```

**Demo mode.** With no Supabase env vars, every page renders with sample data
and default content, the console is open as a demo super admin, and every write
returns `503 demo_mode`. Never remove this: it is how designers and reviewers
see the product without infrastructure.

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

src/lib/rbac/                          permissions.ts (names), server.ts (guards), data.ts
src/lib/cms/                           blocks.ts (registry), sanitize.ts, data.ts, settings.ts,
                                       tokens.ts, defaults/* (pre-filled content for every page)
src/lib/jobs/                          types, zod schema, data access, sample jobs
src/lib/applications/                  status vocabulary, data access
src/lib/console/analytics.ts           dashboard KPIs, series, funnel, breakdowns (one range, one place)
src/lib/payments/                      rail adapters (EximPe, Cashfree, Razorpay, Stripe, Viva, Dodo)
src/components/cms/                    BlockRenderer + one component per block type
src/components/admin/                  console client components (editors, forms, pickers)
supabase/migrations/                   schema, in order. 0014 = RBAC, jobs, applications, CMS; 0015 = realtime
supabase/seed/                         optional: sample job drafts, first super admin
```

## Rules that keep this safe

1. **Permissions, never role names.** Pages: `await requirePermission('jobs.edit', '/admin/...')`.
   APIs: `const guard = await apiPermission('jobs.edit'); if (guard instanceof NextResponse) return guard;`
   then `demoWriteRefusal(guard)` before any write. RLS uses `has_permission()` for the same names.
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
