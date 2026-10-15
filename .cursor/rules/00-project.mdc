---
description: Project overview and non-negotiable rules for the S&A Recruitment platform
alwaysApply: true
---

India → Portugal recruitment platform, UAE company. Next.js 16 App Router, React 19,
TypeScript strict (noUncheckedIndexedAccess), Tailwind v4 tokens, Supabase (Postgres, RLS,
Auth, Storage), zod. Read AGENTS.md for the full map.

Always:
- Run `npm run typecheck && npm run lint && npm run build` before saying a task is done.
- There is no demo mode. Pages read live data; sample content lives in `supabase/seed/`.
 With no Supabase env vars the root layout shows a setup notice and writes return 503
 `not_configured`.
- Nothing business-specific is hardcoded: company details, prices, hiring rules, cohort,
 email wording, SEO and API keys are edited in the console (Settings) and read through
 `getSiteSettings()` or `src/lib/integrations/runtime.ts`.
- Server components by default; `'use client'` only where there is interaction.
- Identity, roles and prices come from the server, never from the request body.
- Money in integer minor units. Never floats for money.
- Comments explain why, in sentences, above the code.
- Candidate-facing copy: plain, honest, specific. No invented testimonials or guarantees.

Never:
- Use `getAdminSupabase()` (service role) before a permission check, or in client code.
- Put secrets in `NEXT_PUBLIC_*` env vars or in `site_settings`.
- Edit an applied migration. Add a new numbered one.
- Add `dangerouslySetInnerHTML` for user or CMS content.
- Add a UI kit, ORM or state library without being asked.
