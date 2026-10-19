# Roadmap: next tasks

In priority order. Each item includes a ready-to-use task brief.
`AGENTS.md` and `docs/dev-rules/` hold the conventions.

## 0. Make it build (do this first)

> Run `npm install`, then `npm run typecheck`, `npm run lint` and `npm run build`.
> Fix every error without changing behaviour. The newest code is in src/lib/cms,
> src/lib/rbac, src/lib/jobs, src/lib/applications, src/components/cms,
> src/components/admin, src/app/admin and src/app/[locale]/jobs. Report what you changed.

## 1. Tests for the parts that protect people

> Add Vitest (unit) and Playwright (e2e). Unit-test: `sanitizeBlocks` (every
> default page in src/lib/cms/defaults round-trips unchanged; javascript: URLs
> are removed), `applyTokens`, `localHref`, `formatSalary`, `grants`. E2E in demo
> mode: home renders, jobs filter works, job page shows the apply form, the
> console dashboard renders, the CMS editor adds/moves/removes a block. Add
> `npm test` and `npm run e2e` scripts and a GitHub Actions workflow that runs
> typecheck, lint, unit tests and build on every PR.

## 2. WhatsApp notifications

> Candidates in India live on WhatsApp. Add a WhatsApp Business (Cloud API)
> sender beside src/lib/email, behind the same "configured or no-op" pattern.
> Send approved templates for: application received, stage changed (with the
> candidate-facing text from STATUS_META), interview scheduled. Add a per-candidate
> opt-in flag (migration 0015) captured on the apply form. Log every send.

## 3. Saved jobs and job alerts

> The `saved_jobs` table exists (0014). Add a save/unsave heart on JobCard and the
> job page for signed-in candidates (POST/DELETE /api/jobs/saved), a "Saved"
> section on the dashboard, and a weekly cron (vercel.json) that emails candidates
> new jobs matching their `position`. Respect `unsubscribed_at`.

## 4. CV upload on the apply form

> Let candidates attach a CV (PDF/DOCX, 5 MB) while applying, reusing the existing
> /api/cv/upload flow. Show it in /admin/applications/[id] with a download link
> (signed URL, staff only, `candidates.view`).

## 5. Interview scheduling

> Add `application_interviews` (migration): application_id, starts_at, timezone,
> mode (video/phone/in person), link, notes, created_by. A form on the application
> page creates one, moves the application to `interview`, and emails the candidate
> the time in IST and in Lisbon time. Show upcoming interviews on the candidate
> tracker and on the console dashboard.

## 6. Hindi and Arabic content

> For every page in src/lib/cms/defaults, produce Hindi translations and save them
> as `hi` drafts through the console API (not in code), for a native speaker to
> review and publish. Also translate the job page and apply panel UI strings via
> src/lib/i18n/dictionary.ts.

## 7. Bulk actions and exports in the console

> On /admin/applications add row selection with bulk "move to stage" and "export
> CSV" (permission `candidates.export`, audited). On /admin/jobs add duplicate-job.

## 8. Employer portal for job requests

> Let employer users (employer_users) submit vacancy requests from /admin that
> arrive as draft job postings linked to their employer, for a recruiter to
> review and publish. Employers see applicants only after a recruiter shortlists
> them (existing shortlist_entries), never the raw pipeline.

## 9. Analytics

> The console dashboard already shows applications, funnel and payments live.
> Add the top of the funnel: privacy-friendly page analytics (Plausible or Vercel
> Analytics) and server-side events for job viewed, apply started, apply completed,
> payment started. Store events in a `site_events` table (migration) and add
> "Job page views" and "Apply conversion" cards to src/lib/console/analytics.ts.
> When applications exceed ~50k per quarter, move the aggregation in
> getAnalytics() into a Postgres function returning the same shape.

## 10. Rate limiting and abuse

> Add rate limiting (Upstash Redis or Vercel KV) to /api/auth/register,
> /api/applications and /api/admin/cms/media/sign, keyed by IP and session.
> Add Cloudflare Turnstile to the one-step apply form for anonymous visitors.
