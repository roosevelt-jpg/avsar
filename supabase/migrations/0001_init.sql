-- ============================================================================
-- Avsar - initial schema
--
-- Two concerns live here that must not be confused:
--   1. The talent graph: high volume, low value per row, Indian data.
--   2. The mobility case file: low volume, high value, EU data.
-- They are separated by schema now and should be separated by Postgres
-- instance (Indian region vs EU region) before real candidate data arrives.
--
-- Every policy wraps auth.uid() in (select ...) so Postgres evaluates it once
-- per query instead of once per row.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------- enums ---
create type payment_status as enum ('pending', 'created', 'paid', 'failed', 'refunded', 'simulated');
create type attempt_status as enum ('in_progress', 'submitted', 'expired', 'voided');
create type sector_slug as enum (
  'hospitality', 'property-management', 'cleaning', 'drivers', 'maintenance', 'construction'
);
create type cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- ---------------------------------------------------------------- cohorts ---
create table cohorts (
  id            text primary key,
  name          text not null,
  corridor      text not null default 'India → Portugal',
  opens_at      date not null,
  closes_at     date not null,
  review_until  date not null,
  announce_at   date not null,
  -- Disclosed on the landing page, at checkout and in the FAQ. Held here so the
  -- number shown to candidates and the number in the rules cannot drift apart.
  cohort_size          integer not null,
  selected_per_cohort  integer not null default 1,
  selected_candidate_id uuid,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------- candidates ---
create table candidates (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users (id) on delete set null,
  cohort_id     text not null references cohorts (id),

  full_name     text not null,
  phone         text not null,
  -- Salted hash, for duplicate detection and the fraud dashboard without
  -- dragging the raw number through every query.
  phone_hash    text not null,
  email         text not null,
  has_passport  boolean not null default false,
  passport_hash text,

  sector                sector_slug not null,
  years_experience_band smallint not null check (years_experience_band between 0 and 3),
  english_self_rating   smallint not null check (english_self_rating between 0 and 2),
  city_state            text not null,
  locale                text not null default 'en',

  payment_status        payment_status not null default 'pending',
  visible_to_employers  boolean not null default true,

  -- The odds disclosure consent. Stored, not merely validated: this record is
  -- the evidence that the ~1-in-N disclosure was shown and accepted.
  consent_selection_odds_at timestamptz,
  consent_version           text,

  -- Where this candidate came from. Populated for every acquisition channel so
  -- an intermediary charging candidates off-platform can be traced.
  referral_source   text,
  referral_agent_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (phone_hash, cohort_id)
);

create index candidates_cohort_idx  on candidates (cohort_id);
create index candidates_sector_idx  on candidates (sector) where visible_to_employers;
create index candidates_payment_idx on candidates (payment_status);

-- ---------------------------------------------------------------- payments ---
create table payments (
  id                  uuid primary key default gen_random_uuid(),
  candidate_id        uuid not null references candidates (id) on delete cascade,
  cohort_id           text not null references cohorts (id),
  provider            text not null,
  provider_order_id   text not null unique,
  provider_payment_id text,
  amount_paise        integer not null check (amount_paise > 0),
  net_paise           integer not null,
  gst_paise           integer not null,
  -- The candidate's stated preference. The provider decides what it can charge.
  method_hint         text,
  status              payment_status not null default 'created',
  receipt_no          text not null unique,
  paid_at             timestamptz,
  refunded_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index payments_candidate_idx on payments (candidate_id);
create index payments_status_idx    on payments (status);

-- ------------------------------------------------------------- assessments ---
create table assessment_attempts (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates (id) on delete cascade,
  section      text not null,
  started_at   timestamptz not null default now(),
  -- The authoritative deadline. The browser's countdown is display only.
  expires_at   timestamptz not null,
  submitted_at timestamptz,
  status       attempt_status not null default 'in_progress',
  -- Kept for the fraud review: device and network fingerprint at start.
  fingerprint  jsonb,
  unique (candidate_id, section)
);

create table assessment_answers (
  attempt_id   uuid not null references assessment_attempts (id) on delete cascade,
  item_id      text not null,
  option_index smallint not null,
  answered_at  timestamptz not null default now(),
  primary key (attempt_id, item_id)
);

create table reports (
  candidate_id    uuid primary key references candidates (id) on delete cascade,
  overall_score   smallint not null check (overall_score between 0 and 100),
  english_cefr    cefr_level not null,
  -- Denormalised so the talent-pool view can filter on it without a join.
  english_rank    smallint not null,
  skills_score    smallint not null,
  experience_score smallint not null,
  percentile      smallint,
  breakdown       jsonb not null default '[]'::jsonb,
  pdf_path        text,
  generated_at    timestamptz not null default now()
);

-- --------------------------------------------------------------- employers ---
create table employers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  country      text not null default 'PT',
  vat_number   text,
  vetted_at    timestamptz,
  created_at   timestamptz not null default now()
);

create table employer_users (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  employer_id  uuid not null references employers (id) on delete cascade,
  role         text not null default 'recruiter'
);

create table shortlist_entries (
  employer_id  uuid not null references employers (id) on delete cascade,
  candidate_id uuid not null references candidates (id) on delete cascade,
  note         text,
  created_at   timestamptz not null default now(),
  primary key (employer_id, candidate_id)
);

-- ------------------------------------------------------- mobility case file ---
-- The low-volume, high-value side. Each row is a legal dossier with deadlines.
create table placements (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references candidates (id),
  employer_id   uuid not null references employers (id),
  role          text not null,
  salary_eur    numeric(10, 2),
  housing_included boolean not null default false,
  -- Explicit state machine. Every move is recorded in placement_transitions.
  state         text not null default 'shortlisted',
  sla_due_at    timestamptz,
  created_at    timestamptz not null default now()
);

create table placement_transitions (
  id           bigserial primary key,
  placement_id uuid not null references placements (id) on delete cascade,
  from_state   text,
  to_state     text not null,
  actor        uuid references auth.users (id),
  evidence     jsonb,
  occurred_at  timestamptz not null default now()
);

-- Append-only: history is the point, so no update or delete policy exists.
create table audit_log (
  id         bigserial primary key,
  actor      uuid references auth.users (id),
  action     text not null,
  subject    text not null,
  detail     jsonb,
  at         timestamptz not null default now()
);

-- Candidates report anyone charging them off-platform. Anonymous by design:
-- there is no candidate_id, because a candidate afraid of an agent will not
-- file a report that identifies them.
create table fee_reports (
  id          bigserial primary key,
  cohort_id   text references cohorts (id),
  description text not null,
  amount_inr  integer,
  contact     text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------- talent pool view ---
-- What employers search. Contact details are deliberately absent: they are
-- released only when a candidate accepts an interview invitation.
create view talent_pool
with (security_invoker = true) as
select
  c.id,
  c.full_name,
  c.city_state,
  c.sector,
  c.visible_to_employers,
  r.english_cefr,
  r.english_rank,
  r.overall_score,
  case c.years_experience_band
    when 0 then 0 when 1 then 2 when 2 then 4 else 6
  end as years_experience
from candidates c
join reports r on r.candidate_id = c.id
where c.payment_status = 'paid';

-- ============================================================================
-- Row level security
-- ============================================================================
alter table candidates          enable row level security;
alter table payments            enable row level security;
alter table assessment_attempts enable row level security;
alter table assessment_answers  enable row level security;
alter table reports             enable row level security;
alter table employers           enable row level security;
alter table employer_users      enable row level security;
alter table shortlist_entries   enable row level security;
alter table placements          enable row level security;
alter table placement_transitions enable row level security;
alter table fee_reports         enable row level security;
alter table audit_log           enable row level security;

-- Helper: the employer the current user belongs to. STABLE so it is evaluated
-- once per statement rather than once per row.
create or replace function current_employer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employer_id from employer_users where auth_user_id = auth.uid()
$$;

-- --- candidates -------------------------------------------------------------
create policy candidates_self_select on candidates
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy candidates_self_update on candidates
  for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

-- Employers see only paid, visible candidates, and only through the view.
create policy candidates_employer_select on candidates
  for select to authenticated
  using (
    (select current_employer_id()) is not null
    and visible_to_employers
    and payment_status = 'paid'
  );

-- --- payments ---------------------------------------------------------------
create policy payments_self_select on payments
  for select to authenticated
  using (
    candidate_id in (select id from candidates where auth_user_id = (select auth.uid()))
  );

-- --- assessment -------------------------------------------------------------
create policy attempts_self_all on assessment_attempts
  for all to authenticated
  using (
    candidate_id in (select id from candidates where auth_user_id = (select auth.uid()))
  )
  with check (
    candidate_id in (select id from candidates where auth_user_id = (select auth.uid()))
  );

-- Answers are writable only while the attempt is open and unexpired, so a late
-- request cannot rewrite a submitted score.
create policy answers_self_select on assessment_answers
  for select to authenticated
  using (
    attempt_id in (
      select a.id from assessment_attempts a
      join candidates c on c.id = a.candidate_id
      where c.auth_user_id = (select auth.uid())
    )
  );

create policy answers_self_write on assessment_answers
  for insert to authenticated
  with check (
    attempt_id in (
      select a.id from assessment_attempts a
      join candidates c on c.id = a.candidate_id
      where c.auth_user_id = (select auth.uid())
        and a.submitted_at is null
        and a.expires_at > now()
    )
  );

create policy answers_self_update on assessment_answers
  for update to authenticated
  using (
    attempt_id in (
      select a.id from assessment_attempts a
      join candidates c on c.id = a.candidate_id
      where c.auth_user_id = (select auth.uid())
        and a.submitted_at is null
        and a.expires_at > now()
    )
  );

-- --- reports ----------------------------------------------------------------
create policy reports_self_select on reports
  for select to authenticated
  using (
    candidate_id in (select id from candidates where auth_user_id = (select auth.uid()))
  );

create policy reports_employer_select on reports
  for select to authenticated
  using ((select current_employer_id()) is not null);

-- --- employers and shortlists ----------------------------------------------
create policy employers_own_select on employers
  for select to authenticated
  using (id = (select current_employer_id()));

create policy employer_users_self_select on employer_users
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

-- The employer is taken from the session, never from the request body.
create policy shortlist_own_all on shortlist_entries
  for all to authenticated
  using (employer_id = (select current_employer_id()))
  with check (employer_id = (select current_employer_id()));

-- --- placements -------------------------------------------------------------
create policy placements_employer_select on placements
  for select to authenticated
  using (employer_id = (select current_employer_id()));

create policy placements_candidate_select on placements
  for select to authenticated
  using (
    candidate_id in (select id from candidates where auth_user_id = (select auth.uid()))
  );

create policy transitions_read on placement_transitions
  for select to authenticated
  using (
    placement_id in (
      select id from placements where employer_id = (select current_employer_id())
    )
  );

-- --- fee reports ------------------------------------------------------------
-- Anyone can file one, including a candidate who is not signed in. Nobody can
-- read them back through the API; only staff, through the service role.
create policy fee_reports_insert on fee_reports
  for insert to anon, authenticated
  with check (true);

-- audit_log and reads of fee_reports are service-role only: no policy grants
-- either, so RLS denies them to every other role.

-- ---------------------------------------------------------------- triggers ---
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger candidates_touch
  before update on candidates
  for each row execute function touch_updated_at();

-- Shortlist default: the employer column is filled from the session so the
-- client never supplies it.
create or replace function set_shortlist_employer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.employer_id is null then
    new.employer_id := current_employer_id();
  end if;
  return new;
end;
$$;

alter table shortlist_entries alter column employer_id drop not null;

create trigger shortlist_set_employer
  before insert on shortlist_entries
  for each row execute function set_shortlist_employer();

-- ------------------------------------------------------------------- seed ---
insert into cohorts (id, name, opens_at, closes_at, review_until, announce_at, cohort_size)
values ('cohort-01', 'Cohort 01', '2026-09-01', '2026-11-30', '2026-12-15', '2027-01-15', 20000)
on conflict (id) do nothing;
