-- ============================================================================
-- 0016 - Growth features
--
--   1. WhatsApp opt-in on candidates, captured on the apply form. A timestamp,
--      not a boolean, because Meta asks when consent was given.
--   2. notification_log: every WhatsApp send, attempted or skipped, so support
--      can answer "did they get the message?" without guessing.
--   3. applications.cv_document_id: the CV a candidate attached when applying.
--   4. application_interviews: scheduled interviews, shown to the candidate in
--      IST and Lisbon time.
--   5. candidates.job_alert_sent_at: when the weekly job alert last went out,
--      so a retried cron run cannot send it twice.
--
-- Re-runnable. Nothing here widens a candidate's access beyond their own rows.
-- ============================================================================

alter table candidates add column if not exists whatsapp_opt_in_at timestamptz;
alter table candidates add column if not exists job_alert_sent_at  timestamptz;

-- ------------------------------------------------------------ notification log

create table if not exists notification_log (
  id             bigserial primary key,
  channel        text not null check (channel in ('email', 'whatsapp')),
  template       text not null,
  candidate_id   uuid references candidates (id) on delete set null,
  application_id uuid references applications (id) on delete set null,
  status         text not null check (status in ('sent', 'failed', 'skipped')),
  provider_id    text,
  error          text,
  created_at     timestamptz not null default now()
);

create index if not exists notification_log_candidate_idx on notification_log (candidate_id, created_at desc);

-- Written only through the service role. Staff who can see applications can
-- read it; candidates cannot.
alter table notification_log enable row level security;

drop policy if exists notification_log_staff_read on notification_log;
create policy notification_log_staff_read on notification_log
  for select to authenticated using ((select has_permission('applications.view')));

-- ------------------------------------------------------------ CV on application

alter table applications
  add column if not exists cv_document_id uuid references cv_documents (id) on delete set null;

-- ------------------------------------------------------------ interviews

create table if not exists application_interviews (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references applications (id) on delete cascade,
  starts_at         timestamptz not null,
  duration_minutes  smallint not null default 30 check (duration_minutes between 10 and 240),
  -- The zone the recruiter entered the time in. Display always shows both IST
  -- and Lisbon; this only records what the recruiter meant.
  timezone          text not null default 'Asia/Kolkata' check (timezone in ('Asia/Kolkata', 'Europe/Lisbon')),
  mode              text not null check (mode in ('video', 'phone', 'in_person')),
  link              text check (link is null or length(link) <= 500),
  location          text check (location is null or length(location) <= 300),
  -- Shown to the candidate. Internal remarks go in application_events instead.
  candidate_message text check (candidate_message is null or length(candidate_message) <= 1000),
  status            text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'done')),
  created_by        uuid references auth.users (id),
  created_at        timestamptz not null default now()
);

create index if not exists application_interviews_app_idx on application_interviews (application_id, starts_at);
create index if not exists application_interviews_upcoming_idx on application_interviews (starts_at) where status = 'scheduled';

alter table application_interviews enable row level security;

drop policy if exists application_interviews_self_read on application_interviews;
create policy application_interviews_self_read on application_interviews
  for select to authenticated
  using (
    application_id in (
      select a.id from applications a
      join candidates c on c.id = a.candidate_id
      where c.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists application_interviews_staff_read on application_interviews;
create policy application_interviews_staff_read on application_interviews
  for select to authenticated using ((select has_permission('applications.view')));
