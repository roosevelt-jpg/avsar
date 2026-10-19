-- ============================================================================
-- 0018 - Operations
--
--   1. leads + lead_events: one inbox for people who have not applied yet.
--      Messages from the contact form, privacy requests, and rows imported
--      from a partner agency's spreadsheet. Replies and notes are events,
--      append-only, so the history of a conversation cannot be rewritten.
--   2. data_access_log: who opened which candidate's personal data, and why.
--      Written on CV downloads, application views, exports and erasures.
--   3. candidates.erased_at: set when a candidate's personal data has been
--      erased on request. The row stays so payments and placements still add
--      up; what identified the person does not. consent_events: the history
--      of every consent given or withdrawn.
--   4. idempotency_keys: the first response to a request carrying an
--      Idempotency-Key header, so a retry on a flaky connection replays it
--      instead of applying twice.
--   5. staff_notifications + staff_notification_seen: the console bell. Each
--      notification names the permission needed to see it.
--   6. Permissions: leads.manage, privacy.manage.
--
-- Re-runnable. Every table is written through the service role only.
-- ============================================================================

-- ------------------------------------------------------------ permissions

insert into permissions (key, group_name, description) values
  ('leads.manage',   'Candidates', 'Read and answer the inbox: contact messages, imported leads, privacy requests'),
  ('privacy.manage', 'Administration', 'Export or erase a person''s data and read the personal-data access log')
on conflict (key) do nothing;

insert into role_permissions (role_key, permission_key)
select r, p from (values
  ('admin', 'leads.manage'), ('admin', 'privacy.manage'),
  ('recruiter', 'leads.manage'),
  ('support', 'leads.manage')
) as v(r, p)
where exists (select 1 from roles where key = v.r)
on conflict do nothing;

-- ------------------------------------------------------------ leads

create table if not exists leads (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('contact', 'import', 'privacy')),
  status       text not null default 'new' check (status in ('new', 'open', 'replied', 'closed')),
  topic        text not null default 'other'
               check (topic in ('candidate', 'employer', 'scam_report', 'privacy', 'other')),
  full_name    text not null check (length(full_name) between 1 and 120),
  email        text check (email is null or length(email) <= 254),
  -- E.164, e.g. +919812345678. Normalised before insert.
  phone        text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  whatsapp_ok  boolean not null default false,
  message      text check (message is null or length(message) <= 4000),
  position     text check (position is null or length(position) <= 120),
  city         text check (city is null or length(city) <= 120),
  -- Employers asking for people before they have an account.
  company      text check (company is null or length(company) <= 160),
  openings     int check (openings is null or openings between 1 and 500),
  -- Where it came from: 'contact_form', the imported file's name, 'dashboard'.
  source       text check (source is null or length(source) <= 200),
  locale       text,
  candidate_id uuid references candidates (id) on delete set null,
  assigned_to  uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists leads_status_idx on leads (status, created_at desc);
create index if not exists leads_phone_idx  on leads (phone) where phone is not null;
create index if not exists leads_email_idx  on leads (lower(email)) where email is not null;

drop trigger if exists leads_touch on leads;
create trigger leads_touch before update on leads
  for each row execute function touch_updated_at();

create table if not exists lead_events (
  id          bigserial primary key,
  lead_id     uuid not null references leads (id) on delete cascade,
  kind        text not null check (kind in ('note', 'email', 'whatsapp', 'status')),
  body        text check (body is null or length(body) <= 4000),
  from_status text,
  to_status   text,
  actor       uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists lead_events_lead_idx on lead_events (lead_id, created_at);

alter table leads       enable row level security;
alter table lead_events enable row level security;

drop policy if exists leads_staff_read on leads;
create policy leads_staff_read on leads
  for select to authenticated using ((select has_permission('leads.manage')));

drop policy if exists lead_events_staff_read on lead_events;
create policy lead_events_staff_read on lead_events
  for select to authenticated using ((select has_permission('leads.manage')));

-- ------------------------------------------------------------ personal data

alter table candidates add column if not exists erased_at timestamptz;

create table if not exists data_access_log (
  id           bigserial primary key,
  actor        uuid references auth.users (id) on delete set null,
  candidate_id uuid references candidates (id) on delete set null,
  -- 'cv.download', 'application.view', 'candidate.export', 'candidate.erase', ...
  action       text not null,
  detail       jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists data_access_log_candidate_idx on data_access_log (candidate_id, created_at desc);
create index if not exists data_access_log_time_idx      on data_access_log (created_at desc);

alter table data_access_log enable row level security;

drop policy if exists data_access_log_privacy_read on data_access_log;
create policy data_access_log_privacy_read on data_access_log
  for select to authenticated using ((select has_permission('privacy.manage')));

-- Every consent given or withdrawn, append-only. The columns on candidates
-- say what holds now; this says when it changed and what the person was shown,
-- which is what GDPR and India's DPDP Act ask a controller to be able to prove.
create table if not exists consent_events (
  id           bigserial primary key,
  candidate_id uuid not null references candidates (id) on delete cascade,
  -- 'selection_odds', 'whatsapp', 'family_link', 'story', ...
  consent      text not null check (length(consent) <= 40),
  granted      boolean not null,
  version      text,
  source       text check (source is null or length(source) <= 60),
  created_at   timestamptz not null default now()
);

create index if not exists consent_events_candidate_idx on consent_events (candidate_id, created_at desc);

alter table consent_events enable row level security;

drop policy if exists consent_events_self_read on consent_events;
create policy consent_events_self_read on consent_events
  for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

drop policy if exists consent_events_privacy_read on consent_events;
create policy consent_events_privacy_read on consent_events
  for select to authenticated using ((select has_permission('privacy.manage')));

-- ------------------------------------------------------------ idempotency

create table if not exists idempotency_keys (
  scope       text not null,
  key         text not null check (length(key) between 8 and 100),
  -- The user id, or a hash of the IP for anonymous requests. A key replayed
  -- by someone else is refused rather than handed another person's response.
  actor       text not null,
  status_code smallint,
  response    jsonb,
  created_at  timestamptz not null default now(),
  primary key (scope, key)
);

create index if not exists idempotency_keys_created_idx on idempotency_keys (created_at);

alter table idempotency_keys enable row level security;

-- ------------------------------------------------------------ staff notifications

create table if not exists staff_notifications (
  id         bigserial primary key,
  permission text not null references permissions (key) on delete cascade,
  kind       text not null,
  title      text not null check (length(title) <= 200),
  body       text check (body is null or length(body) <= 1000),
  href       text check (href is null or href ~ '^/admin'),
  created_at timestamptz not null default now()
);

create index if not exists staff_notifications_time_idx on staff_notifications (created_at desc);

create table if not exists staff_notification_seen (
  user_id uuid primary key references auth.users (id) on delete cascade,
  seen_at timestamptz not null default now()
);

alter table staff_notifications     enable row level security;
alter table staff_notification_seen enable row level security;

drop policy if exists staff_notifications_read on staff_notifications;
create policy staff_notifications_read on staff_notifications
  for select to authenticated using ((select has_permission(permission)));

drop policy if exists staff_notification_seen_self on staff_notification_seen;
create policy staff_notification_seen_self on staff_notification_seen
  for select to authenticated using (user_id = (select auth.uid()));
