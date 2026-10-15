-- ============================================================================
-- 0023: candidate background for the visa
--
-- Questionnaire 5.4: the owner wants more questions about personal background,
-- visa refusals and experience abroad. These are the facts that decide whether
-- a Portuguese work visa is straightforward, and the legal team needs them for
-- the preliminary review. They are asked on the dashboard, not at signup, so
-- the path to the free assessment stays short.
--
-- Criminal convictions are deliberately not asked: the police clearance
-- certificate covers them, and conviction data has its own stricter regime
-- under GDPR Article 10.
--
-- The candidate writes through the API (service role, after the session
-- check), so there is no insert or update policy for authenticated users.
-- ============================================================================

create table if not exists candidate_backgrounds (
  candidate_id        uuid primary key references candidates (id) on delete cascade,
  visa_refused        boolean,
  visa_refusal_detail text not null default '' check (length(visa_refusal_detail) <= 500),
  worked_abroad       boolean,
  worked_abroad_detail text not null default '' check (length(worked_abroad_detail) <= 500),
  overstay_or_removal boolean,
  overstay_detail     text not null default '' check (length(overstay_detail) <= 500),
  dependants          smallint check (dependants between 0 and 10),
  dependants_detail   text not null default '' check (length(dependants_detail) <= 500),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists candidate_backgrounds_touch on candidate_backgrounds;
create trigger candidate_backgrounds_touch before update on candidate_backgrounds
  for each row execute function touch_updated_at();

alter table candidate_backgrounds enable row level security;

drop policy if exists candidate_backgrounds_self_select on candidate_backgrounds;
create policy candidate_backgrounds_self_select on candidate_backgrounds
  for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

drop policy if exists candidate_backgrounds_staff_select on candidate_backgrounds;
create policy candidate_backgrounds_staff_select on candidate_backgrounds
  for select to authenticated
  using ((select has_permission('applications.view')) or (select has_permission('relocation.manage')));
