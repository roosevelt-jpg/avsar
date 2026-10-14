-- ============================================================================
-- 0014 - RBAC, job postings, applications, and the CMS
--
-- Four additions, each independent of the assessment funnel that already exists:
--
--   1. RBAC. `staff_users.role` used to be 'reviewer' | 'admin'. It now points
--      at a `roles` table, and each role carries a set of permissions. Checks in
--      the app and in RLS are made against permissions, never role names, so a
--      new role is a row rather than a deploy.
--   2. Job postings. Real vacancies with a lifecycle (draft -> published ->
--      closed -> archived), managed by staff, read by anyone once published.
--   3. Applications. A candidate applies to a posting; every status move is an
--      append-only event, and the events marked visible are the candidate's
--      tracker.
--   4. CMS. Pages are lists of typed blocks, with a working draft and a live
--      copy, plus versions, a media library and site settings. The default
--      content for every page lives in code (src/lib/cms/defaults) and is what
--      the site renders until an admin saves a page, so nothing is ever blank.
--
-- Safe to re-run: every statement is guarded.
-- ============================================================================

-- ======================================================================= RBAC

create table if not exists roles (
  key         text primary key check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  name        text not null,
  description text not null default '',
  -- System roles cannot be deleted, and super_admin's permissions cannot be
  -- edited, so nobody can lock the whole organisation out of the console.
  is_system   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists permissions (
  key         text primary key,
  group_name  text not null,
  description text not null
);

create table if not exists role_permissions (
  role_key       text not null references roles (key) on delete cascade,
  permission_key text not null references permissions (key) on delete cascade,
  primary key (role_key, permission_key)
);

insert into permissions (key, group_name, description) values
  ('*',                    'System',       'Every permission, including ones added later'),
  ('dashboard.view',       'General',      'See the console overview'),
  ('jobs.view',            'Jobs',         'See job postings, including drafts'),
  ('jobs.edit',            'Jobs',         'Create and edit job postings'),
  ('jobs.publish',         'Jobs',         'Publish, close and archive job postings'),
  ('applications.view',    'Applications', 'See applications and their history'),
  ('applications.manage',  'Applications', 'Move applications between stages and add notes'),
  ('candidates.view',      'Candidates',   'See candidate profiles and the talent pool'),
  ('candidates.export',    'Candidates',   'Export candidate data'),
  ('cv.review',            'Candidates',   'Review CVs and assessment evidence'),
  ('employers.manage',     'Employers',    'Add employers and their contacts'),
  ('placements.manage',    'Employers',    'Move placement case files'),
  ('cms.view',             'Content',      'See pages in the content editor and preview drafts'),
  ('cms.edit',             'Content',      'Edit page drafts'),
  ('cms.publish',          'Content',      'Publish pages and restore versions'),
  ('media.manage',         'Content',      'Upload and delete images, videos and files'),
  ('settings.manage',      'Content',      'Edit site settings: contact details, navigation, announcement'),
  ('payments.view',        'Finance',      'See payments and receipts'),
  ('payments.refund',      'Finance',      'Mark payments refunded'),
  ('staff.manage',         'Administration','Invite staff, change their role, deactivate them'),
  ('roles.manage',         'Administration','Change which permissions each role has'),
  ('audit.view',           'Administration','Read the audit log')
on conflict (key) do update set group_name = excluded.group_name, description = excluded.description;

insert into roles (key, name, description, is_system) values
  ('super_admin',     'Super admin',     'Everything, including roles and staff. Keep this to one or two people.', true),
  ('admin',           'Admin',           'Runs the platform day to day. Cannot change role permissions.', true),
  ('recruiter',       'Recruiter',       'Owns jobs and moves applications through the pipeline.', true),
  ('reviewer',        'Reviewer',        'Reviews CVs and assessments. Read-only on applications.', true),
  ('content_editor',  'Content editor',  'Edits page drafts and the media library. Cannot publish.', true),
  ('content_manager', 'Content manager', 'Edits and publishes pages, media and site settings.', true),
  ('finance',         'Finance',         'Payments, receipts and refunds.', true),
  ('support',         'Support',         'Read-only across candidates, applications and payments, to answer questions.', true)
on conflict (key) do update set name = excluded.name, description = excluded.description;

-- Default permission sets. Re-running restores system roles to their defaults
-- only where a pairing is missing; it never removes what an admin added.
insert into role_permissions (role_key, permission_key)
select r, p from (values
  ('super_admin', '*'),

  ('admin', 'dashboard.view'), ('admin', 'jobs.view'), ('admin', 'jobs.edit'), ('admin', 'jobs.publish'),
  ('admin', 'applications.view'), ('admin', 'applications.manage'), ('admin', 'candidates.view'),
  ('admin', 'candidates.export'), ('admin', 'cv.review'), ('admin', 'employers.manage'),
  ('admin', 'placements.manage'), ('admin', 'cms.view'), ('admin', 'cms.edit'), ('admin', 'cms.publish'),
  ('admin', 'media.manage'), ('admin', 'settings.manage'), ('admin', 'payments.view'),
  ('admin', 'payments.refund'), ('admin', 'staff.manage'), ('admin', 'audit.view'),

  ('recruiter', 'dashboard.view'), ('recruiter', 'jobs.view'), ('recruiter', 'jobs.edit'),
  ('recruiter', 'jobs.publish'), ('recruiter', 'applications.view'), ('recruiter', 'applications.manage'),
  ('recruiter', 'candidates.view'), ('recruiter', 'cv.review'), ('recruiter', 'employers.manage'),
  ('recruiter', 'placements.manage'),

  ('reviewer', 'dashboard.view'), ('reviewer', 'applications.view'), ('reviewer', 'candidates.view'),
  ('reviewer', 'cv.review'), ('reviewer', 'jobs.view'),

  ('content_editor', 'dashboard.view'), ('content_editor', 'cms.view'), ('content_editor', 'cms.edit'),
  ('content_editor', 'media.manage'), ('content_editor', 'jobs.view'),

  ('content_manager', 'dashboard.view'), ('content_manager', 'cms.view'), ('content_manager', 'cms.edit'),
  ('content_manager', 'cms.publish'), ('content_manager', 'media.manage'),
  ('content_manager', 'settings.manage'), ('content_manager', 'jobs.view'),

  ('finance', 'dashboard.view'), ('finance', 'payments.view'), ('finance', 'payments.refund'),
  ('finance', 'candidates.view'),

  ('support', 'dashboard.view'), ('support', 'jobs.view'), ('support', 'applications.view'),
  ('support', 'candidates.view'), ('support', 'payments.view')
) as defaults (r, p)
on conflict do nothing;

-- staff_users: from a two-value check to a foreign key into roles.
alter table staff_users drop constraint if exists staff_users_role_check;
alter table staff_users add column if not exists full_name  text;
alter table staff_users add column if not exists active     boolean not null default true;
alter table staff_users add column if not exists invited_by uuid references auth.users (id);
alter table staff_users add column if not exists last_seen_at timestamptz;

-- The people who were 'admin' under the two-role model were the owners.
update staff_users set role = 'super_admin' where role = 'admin'
  and not exists (select 1 from staff_users where role = 'super_admin');

alter table staff_users drop constraint if exists staff_users_role_fkey;
alter table staff_users
  add constraint staff_users_role_fkey foreign key (role) references roles (key) on update cascade;

-- Inactive staff are not staff. is_staff() is what every staff RLS policy in
-- 0003 checks, so deactivating someone closes all of them at once.
create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff_users where auth_user_id = auth.uid() and active)
$$;

/**
 * The permission check, for RLS and for the app.
 *
 * STABLE and SECURITY DEFINER so it is evaluated once per statement and can
 * read role_permissions without the caller needing a policy on it.
 */
create or replace function has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from staff_users s
      join role_permissions rp on rp.role_key = s.role
     where s.auth_user_id = auth.uid()
       and s.active
       and (rp.permission_key = p_permission or rp.permission_key = '*')
  )
$$;

/** Every permission the signed-in staff member holds, for the console nav. */
create or replace function my_permissions()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select rp.permission_key
    from staff_users s
    join role_permissions rp on rp.role_key = s.role
   where s.auth_user_id = auth.uid()
     and s.active
$$;

revoke all on function has_permission(text) from public, anon;
revoke all on function my_permissions() from public, anon;
grant execute on function has_permission(text) to authenticated;
grant execute on function my_permissions() to authenticated;

alter table roles            enable row level security;
alter table permissions      enable row level security;
alter table role_permissions enable row level security;

drop policy if exists roles_staff_read on roles;
create policy roles_staff_read on roles for select to authenticated using ((select is_staff()));
drop policy if exists permissions_staff_read on permissions;
create policy permissions_staff_read on permissions for select to authenticated using ((select is_staff()));
drop policy if exists role_permissions_staff_read on role_permissions;
create policy role_permissions_staff_read on role_permissions for select to authenticated using ((select is_staff()));
-- Writes to all three go through the service role, after the app has checked
-- roles.manage. No write policy exists, so RLS denies them to everyone else.

drop policy if exists staff_admin_read on staff_users;
create policy staff_admin_read on staff_users
  for select to authenticated using ((select has_permission('staff.manage')));

-- ================================================================ job postings

do $$ begin
  create type job_status as enum ('draft', 'published', 'closed', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists job_postings (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title              text not null check (length(title) between 3 and 140),
  -- Ties a posting to the assessment bank and to the position images. Text, as
  -- in 0007, because the list changes when the business opens a new role.
  position_slug      text,
  area               text,
  employer_id        uuid references employers (id) on delete set null,
  -- What candidates see. Employers often ask to stay unnamed until interview,
  -- so this is separate from the employer row: "Four-star hotel group, Algarve".
  employer_display   text not null default '',
  city               text not null,
  region             text,
  country            text not null default 'PT',
  employment_type    text not null default 'full_time'
                     check (employment_type in ('full_time', 'part_time', 'seasonal', 'contract')),
  contract_months    smallint check (contract_months is null or contract_months between 1 and 120),
  openings           smallint not null default 1 check (openings between 1 and 500),
  salary_min_eur     integer check (salary_min_eur is null or salary_min_eur >= 0),
  salary_max_eur     integer check (salary_max_eur is null or salary_max_eur >= 0),
  salary_period      text not null default 'month' check (salary_period in ('hour', 'month', 'year')),
  housing            text not null default 'assisted' check (housing in ('provided', 'assisted', 'not_included')),
  meals_included     boolean not null default false,
  visa_sponsored     boolean not null default true,
  relocation_support boolean not null default true,
  min_experience_years smallint not null default 0 check (min_experience_years between 0 and 40),
  min_english        cefr_level,
  languages          text[] not null default '{}',
  summary            text not null default '',
  description        text not null default '',
  responsibilities   text[] not null default '{}',
  requirements       text[] not null default '{}',
  benefits           text[] not null default '{}',
  -- [{ id, label, type: 'text' | 'yesno' | 'select', options?: string[], required: bool }]
  screening_questions jsonb not null default '[]'::jsonb,
  hero_image_url     text,
  status             job_status not null default 'draft',
  featured           boolean not null default false,
  published_at       timestamptz,
  closes_at          timestamptz,
  seo_title          text,
  seo_description    text,
  created_by         uuid references auth.users (id),
  updated_by         uuid references auth.users (id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  search             tsvector generated always as (
    to_tsvector('simple',
      coalesce(title, '') || ' ' || coalesce(city, '') || ' ' || coalesce(region, '') || ' ' ||
      coalesce(employer_display, '') || ' ' || coalesce(summary, ''))
  ) stored,
  check (salary_max_eur is null or salary_min_eur is null or salary_max_eur >= salary_min_eur)
);

create index if not exists job_postings_status_idx   on job_postings (status, published_at desc);
create index if not exists job_postings_position_idx on job_postings (position_slug);
create index if not exists job_postings_search_idx   on job_postings using gin (search);

drop trigger if exists job_postings_touch on job_postings;
create trigger job_postings_touch before update on job_postings
  for each row execute function touch_updated_at();

-- Stamp published_at the first time a posting goes live, server side.
create or replace function stamp_job_published()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

drop trigger if exists job_postings_publish_stamp on job_postings;
create trigger job_postings_publish_stamp before insert or update on job_postings
  for each row execute function stamp_job_published();

alter table job_postings enable row level security;

drop policy if exists jobs_public_read on job_postings;
create policy jobs_public_read on job_postings
  for select to anon, authenticated
  using (status = 'published' and (closes_at is null or closes_at > now()));

drop policy if exists jobs_staff_read on job_postings;
create policy jobs_staff_read on job_postings
  for select to authenticated using ((select has_permission('jobs.view')));

-- ================================================================ applications

do $$ begin
  create type application_status as enum (
    'submitted', 'screening', 'shortlisted', 'interview', 'offer',
    'hired', 'visa_processing', 'relocated', 'rejected', 'withdrawn'
  );
exception when duplicate_object then null; end $$;

create table if not exists applications (
  id                uuid primary key default gen_random_uuid(),
  -- Short, human, quotable on the phone: "APP-7K3Q9D2F".
  reference         text not null unique
                    default ('APP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  job_id            uuid not null references job_postings (id) on delete restrict,
  candidate_id      uuid not null references candidates (id) on delete cascade,
  status            application_status not null default 'submitted',
  cover_note        text check (cover_note is null or length(cover_note) <= 2000),
  answers           jsonb not null default '{}'::jsonb,
  source            text,
  assigned_to       uuid references auth.users (id),
  rating            smallint check (rating is null or rating between 1 and 5),
  status_changed_at timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create index if not exists applications_job_idx       on applications (job_id, status);
create index if not exists applications_candidate_idx on applications (candidate_id, created_at desc);
create index if not exists applications_status_idx    on applications (status, status_changed_at desc);

drop trigger if exists applications_touch on applications;
create trigger applications_touch before update on applications
  for each row execute function touch_updated_at();

-- Append-only. Visible events are the candidate's tracker; the rest are
-- internal notes. No update or delete policy exists.
create table if not exists application_events (
  id                   bigserial primary key,
  application_id       uuid not null references applications (id) on delete cascade,
  from_status          application_status,
  to_status            application_status,
  note                 text,
  visible_to_candidate boolean not null default true,
  actor                uuid references auth.users (id),
  created_at           timestamptz not null default now()
);

create index if not exists application_events_app_idx on application_events (application_id, created_at);

create table if not exists saved_jobs (
  candidate_id uuid not null references candidates (id) on delete cascade,
  job_id       uuid not null references job_postings (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (candidate_id, job_id)
);

alter table applications       enable row level security;
alter table application_events enable row level security;
alter table saved_jobs         enable row level security;

drop policy if exists applications_self_read on applications;
create policy applications_self_read on applications
  for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

drop policy if exists applications_staff_read on applications;
create policy applications_staff_read on applications
  for select to authenticated using ((select has_permission('applications.view')));

drop policy if exists application_events_self_read on application_events;
create policy application_events_self_read on application_events
  for select to authenticated
  using (
    visible_to_candidate
    and application_id in (
      select a.id from applications a
      join candidates c on c.id = a.candidate_id
      where c.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists application_events_staff_read on application_events;
create policy application_events_staff_read on application_events
  for select to authenticated using ((select has_permission('applications.view')));

drop policy if exists saved_jobs_self on saved_jobs;
create policy saved_jobs_self on saved_jobs
  for all to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())))
  with check (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

/**
 * Applying. The only way a candidate creates an application.
 *
 * A function rather than an insert policy so the candidate cannot choose their
 * own status, apply to a draft or closed posting, or apply as somebody else.
 * Idempotent: applying twice returns the first application.
 */
create or replace function apply_to_job(p_job_id uuid, p_cover_note text, p_answers jsonb, p_source text)
returns applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate uuid;
  v_app       applications;
begin
  select id into v_candidate from candidates where auth_user_id = auth.uid();
  if v_candidate is null then
    raise exception 'no_candidate_for_session';
  end if;

  if not exists (
    select 1 from job_postings
     where id = p_job_id
       and status = 'published'
       and (closes_at is null or closes_at > now())
  ) then
    raise exception 'job_not_open';
  end if;

  select * into v_app from applications where job_id = p_job_id and candidate_id = v_candidate;
  if found then
    -- A withdrawn application can be reopened by applying again.
    if v_app.status = 'withdrawn' then
      update applications
         set status = 'submitted', status_changed_at = now(),
             cover_note = coalesce(left(p_cover_note, 2000), cover_note),
             answers = coalesce(p_answers, answers)
       where id = v_app.id
      returning * into v_app;
      insert into application_events (application_id, from_status, to_status, note)
      values (v_app.id, 'withdrawn', 'submitted', 'Application re-submitted');
    end if;
    return v_app;
  end if;

  insert into applications (job_id, candidate_id, cover_note, answers, source)
  values (p_job_id, v_candidate, left(p_cover_note, 2000), coalesce(p_answers, '{}'::jsonb), left(p_source, 80))
  returning * into v_app;

  insert into application_events (application_id, from_status, to_status, note)
  values (v_app.id, null, 'submitted', 'Application received');

  return v_app;
end $$;

/** Withdrawing. Allowed until an offer has been accepted into the visa stage. */
create or replace function withdraw_application(p_application_id uuid)
returns applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app applications;
  v_from application_status;
begin
  select a.status into v_from
    from applications a
    join candidates c on c.id = a.candidate_id
   where a.id = p_application_id and c.auth_user_id = auth.uid();

  if v_from is null then
    raise exception 'application_not_found';
  end if;
  if v_from in ('hired', 'visa_processing', 'relocated', 'rejected', 'withdrawn') then
    raise exception 'application_not_withdrawable';
  end if;

  update applications set status = 'withdrawn', status_changed_at = now()
   where id = p_application_id
  returning * into v_app;

  insert into application_events (application_id, from_status, to_status, note, actor)
  values (p_application_id, v_from, 'withdrawn', 'Withdrawn by candidate', auth.uid());

  return v_app;
end $$;

revoke all on function apply_to_job(uuid, text, jsonb, text) from public, anon;
revoke all on function withdraw_application(uuid) from public, anon;
grant execute on function apply_to_job(uuid, text, jsonb, text) to authenticated;
grant execute on function withdraw_application(uuid) to authenticated;

-- Pipeline counts per posting, for the jobs list in the console.
create or replace view job_pipeline
with (security_invoker = true) as
select
  j.id as job_id,
  count(a.id)                                                    as total,
  count(a.id) filter (where a.status = 'submitted')              as submitted,
  count(a.id) filter (where a.status in ('screening', 'shortlisted', 'interview')) as in_progress,
  count(a.id) filter (where a.status in ('offer', 'hired', 'visa_processing', 'relocated')) as offers,
  max(a.created_at)                                              as last_applied_at
from job_postings j
left join applications a on a.job_id = j.id and a.status <> 'withdrawn'
group by j.id;

-- ======================================================================== CMS

create table if not exists cms_pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  locale          text not null default 'en' check (locale ~ '^[a-z]{2}$'),
  title           text not null,
  -- The working copy. Editors save here; nothing on the public site reads it.
  blocks          jsonb not null default '[]'::jsonb,
  seo             jsonb not null default '{}'::jsonb,
  -- The live copy, written only by a publish.
  published_blocks jsonb,
  published_seo    jsonb,
  published_at    timestamptz,
  published_by    uuid references auth.users (id),
  updated_by      uuid references auth.users (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (slug, locale)
);

drop trigger if exists cms_pages_touch on cms_pages;
create trigger cms_pages_touch before update on cms_pages
  for each row execute function touch_updated_at();

create table if not exists cms_page_versions (
  id         bigserial primary key,
  page_id    uuid not null references cms_pages (id) on delete cascade,
  blocks     jsonb not null,
  seo        jsonb not null default '{}'::jsonb,
  -- 'draft' for a save, 'published' for a publish. Restoring copies into the draft.
  kind       text not null default 'draft' check (kind in ('draft', 'published')),
  note       text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists cms_page_versions_page_idx on cms_page_versions (page_id, created_at desc);

create table if not exists cms_media (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('image', 'video', 'document')),
  storage_path text not null unique,
  url          text not null,
  file_name    text not null,
  mime_type    text not null,
  bytes        integer not null check (bytes >= 0),
  width        integer,
  height       integer,
  alt          text not null default '',
  title        text not null default '',
  tags         text[] not null default '{}',
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

create index if not exists cms_media_kind_idx on cms_media (kind, created_at desc);

-- Public configuration only. NEVER put a secret here: it is readable by anyone.
create table if not exists site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

alter table cms_pages         enable row level security;
alter table cms_page_versions enable row level security;
alter table cms_media         enable row level security;
alter table site_settings     enable row level security;

-- Drafts are not public. The public site reads the view below, which exposes
-- only the published columns of published pages.
drop policy if exists cms_pages_staff_read on cms_pages;
create policy cms_pages_staff_read on cms_pages
  for select to authenticated using ((select has_permission('cms.view')));

drop policy if exists cms_versions_staff_read on cms_page_versions;
create policy cms_versions_staff_read on cms_page_versions
  for select to authenticated using ((select has_permission('cms.view')));

drop policy if exists cms_media_public_read on cms_media;
create policy cms_media_public_read on cms_media
  for select to anon, authenticated using (true);

drop policy if exists site_settings_public_read on site_settings;
create policy site_settings_public_read on site_settings
  for select to anon, authenticated using (true);

-- Owner-rights view (no security_invoker), so anon can read published content
-- without being able to read drafts from the table.
create or replace view cms_public_pages as
select slug, locale, title, published_blocks as blocks, published_seo as seo, published_at
  from cms_pages
 where published_blocks is not null;

grant select on cms_public_pages to anon, authenticated;

-- Storage for the media library. Public read, because these are website
-- images; writes go through the service role after a media.manage check.
insert into storage.buckets (id, name, public, file_size_limit)
values ('cms-media', 'cms-media', true, 104857600)
on conflict (id) do nothing;
