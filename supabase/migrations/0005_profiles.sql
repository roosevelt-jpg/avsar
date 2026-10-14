-- ============================================================================
-- Candidate profile: CV upload and manual entry
--
-- Field set follows what applicant tracking systems ask for (SmartRecruiters,
-- Greenhouse, Workable), plus what this corridor needs and they do not:
-- passport status, relocation readiness, notice period.
--
-- Experience and education are their own tables rather than JSON on the
-- profile, because employers will want to filter on years in a sector and on
-- qualifications, and that is a query, not a document.
-- ============================================================================

-- Guarded: Postgres has no `create type if not exists`, and a migration that
-- fails halfway must be safe to run again.
do $$ begin
  create type profile_source as enum ('manual', 'cv_import', 'mixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type availability_band as enum ('immediate', 'one_month', 'three_months', 'six_months');
exception when duplicate_object then null; end $$;

create table if not exists candidate_profiles (
  candidate_id uuid primary key references candidates (id) on delete cascade,

  headline     text,
  summary      text,

  -- Contact and location beyond what sign-up captured.
  country      text not null default 'IN',
  linkedin_url text,

  skills       text[] not null default '{}',
  /* [{ language, level }] where level is a CEFR band or 'native'. Self-declared:
     the assessment is what produces a measured English level. */
  languages    jsonb not null default '[]'::jsonb,

  availability availability_band,
  notice_period_days smallint check (notice_period_days between 0 and 365),
  relocation_ready boolean not null default true,
  -- Stored as a band, not a number: an exact figure invites anchoring and is
  -- meaningless across currencies.
  salary_expectation_band text,

  -- Which parts the candidate wrote and which came out of a parsed CV.
  source       profile_source not null default 'manual',
  completed_at timestamptz,
  updated_at   timestamptz not null default now()
);

create table if not exists candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates (id) on delete cascade,
  employer text not null,
  title    text not null,
  location text,
  -- Month precision. A candidate rarely remembers the day, and pretending to
  -- day precision invites a date picker that refuses their honest answer.
  start_month date,
  end_month   date,
  is_current  boolean not null default false,
  description text,
  sector      sector_slug,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists candidate_experiences_candidate_idx on candidate_experiences (candidate_id);

create table if not exists candidate_education (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates (id) on delete cascade,
  institution text not null,
  qualification text not null,
  field text,
  start_year smallint,
  end_year   smallint,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists candidate_education_candidate_idx on candidate_education (candidate_id);

-- ============================================================================
-- Row level security
-- ============================================================================
alter table candidate_profiles    enable row level security;
alter table candidate_experiences enable row level security;
alter table candidate_education   enable row level security;

drop policy if exists profiles_self_all on candidate_profiles;
create policy profiles_self_all on candidate_profiles
  for all to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())))
  with check (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

drop policy if exists experiences_self_all on candidate_experiences;
create policy experiences_self_all on candidate_experiences
  for all to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())))
  with check (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

drop policy if exists education_self_all on candidate_education;
create policy education_self_all on candidate_education
  for all to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())))
  with check (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

drop policy if exists profiles_staff_select on candidate_profiles;
create policy profiles_staff_select on candidate_profiles
  for select to authenticated using ((select is_staff()));
drop policy if exists experiences_staff_select on candidate_experiences;
create policy experiences_staff_select on candidate_experiences
  for select to authenticated using ((select is_staff()));
drop policy if exists education_staff_select on candidate_education;
create policy education_staff_select on candidate_education
  for select to authenticated using ((select is_staff()));

-- Employers see the profile through the talent pool, not the raw tables: what
-- they get is name, city, sector, English and score, and contact details only
-- after an interview is accepted.

drop trigger if exists candidate_profiles_touch on candidate_profiles;
create trigger candidate_profiles_touch
  before update on candidate_profiles
  for each row execute function touch_updated_at();

-- ============================================================================
-- CV storage
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- A candidate writes and reads only inside a folder named after their own
-- candidate id. The path is the authorisation boundary, so the upload code has
-- to build it from the session and never from anything the browser sends.
drop policy if exists cv_upload_own on storage.objects;
create policy cv_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] in (
      select id::text from candidates where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists cv_read_own on storage.objects;
create policy cv_read_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] in (
      select id::text from candidates where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists cv_update_own on storage.objects;
create policy cv_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] in (
      select id::text from candidates where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists cv_read_staff on storage.objects;
create policy cv_read_staff on storage.objects
  for select to authenticated
  using (bucket_id = 'cvs' and (select is_staff()));
