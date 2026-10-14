---
description: Supabase schema, migrations and RLS
globs: supabase/**,src/lib/supabase/**
---

- Migrations are numbered, append-only and re-runnable: `create ... if not exists`,
  `on conflict do nothing`, `drop policy if exists` before `create policy`.
- Enable RLS on every new table. Wrap `auth.uid()` as `(select auth.uid())` in policies.
- Staff access in RLS: `(select has_permission('x.y'))`. Candidate access: rows whose
  candidate has `auth_user_id = (select auth.uid())`.
- State changes candidates must not control go through `security definer` functions
  (`apply_to_job`, `withdraw_application`, `start_assessment_attempt`), with
  `revoke all ... from public, anon; grant execute ... to authenticated`.
- History tables (`application_events`, `placement_transitions`, `audit_log`) are
  append-only: no update or delete policy.
- Public read of partial data goes through a view (see `cms_public_pages`).
