-- ============================================================================
-- 0019 - Relocation and hiring
--
-- Candidate side, from offer to first shift:
--   1. relocation_documents: the visa file, one row per uploaded document,
--      verified or rejected by staff, with expiry. A new upload of the same
--      kind supersedes the old one rather than deleting it.
--   2. relocation_milestones: the steps from contract to first day in
--      Portugal (visa, flight, NIF, NISS, bank, SNS, AIMA), per hired
--      application, each with a due date and a blocker note.
--   3. family_links: a read-only progress page a candidate can share with
--      family. Only a hash of the token is stored.
--   4. success_stories: written by placed candidates, published only after a
--      member of staff approves them. Read publicly through column grants, so
--      who wrote a story is never exposed, only what they chose to show.
--
-- Employer side:
--   5. interview_scorecards: a structured result for each interview.
--   6. employer_fees: the placement fee, recorded once per hire and billed to
--      the employer. Never to the candidate.
--   7. profile_unlock_requests: employers see initials until staff release a
--      candidate's identity to them.
--   8. bench_holds: an employer holds a travel-ready candidate for 72 hours.
--   9. employer_applicants() is replaced: names are masked until released,
--      and it returns the facts the match score and readiness need.
--
-- Permissions: relocation.manage, fees.manage. Re-runnable.
-- ============================================================================

insert into permissions (key, group_name, description) values
  ('relocation.manage', 'Candidates', 'Verify relocation documents, run relocation plans, moderate stories, release identities'),
  ('fees.manage',       'Finance',    'Record employer placement fees as invoiced, paid or waived')
on conflict (key) do nothing;

insert into role_permissions (role_key, permission_key)
select r, p from (values
  ('admin', 'relocation.manage'), ('admin', 'fees.manage'),
  ('recruiter', 'relocation.manage'),
  ('finance', 'fees.manage')
) as v(r, p)
where exists (select 1 from roles where key = v.r)
on conflict do nothing;

-- ------------------------------------------------------------ documents

insert into storage.buckets (id, name, public, file_size_limit)
values ('relocation-docs', 'relocation-docs', false, 10485760)
on conflict (id) do nothing;
-- No storage policies: every read and write goes through a route handler that
-- checks the session or a permission, and signs a one-minute URL.

create table if not exists relocation_documents (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references candidates (id) on delete cascade,
  kind          text not null check (kind in (
                  'passport', 'police_clearance', 'medical', 'contract', 'accommodation',
                  'insurance', 'photo', 'qualification', 'bank_statement', 'other')),
  storage_path  text not null unique,
  file_name     text not null check (length(file_name) <= 200),
  mime_type     text not null,
  byte_size     integer not null check (byte_size > 0),
  status        text not null default 'uploaded' check (status in ('uploaded', 'verified', 'rejected')),
  expires_on    date,
  reject_reason text check (reject_reason is null or length(reject_reason) <= 500),
  reviewed_by   uuid references auth.users (id) on delete set null,
  reviewed_at   timestamptz,
  superseded_at timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists relocation_documents_candidate_idx
  on relocation_documents (candidate_id, kind) where superseded_at is null;
create index if not exists relocation_documents_queue_idx
  on relocation_documents (created_at) where status = 'uploaded' and superseded_at is null;

-- ------------------------------------------------------------ milestones

create table if not exists relocation_milestones (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications (id) on delete cascade,
  candidate_id   uuid not null references candidates (id) on delete cascade,
  key            text not null check (length(key) <= 40),
  position       smallint not null,
  status         text not null default 'pending'
                 check (status in ('pending', 'in_progress', 'blocked', 'done', 'skipped')),
  due_on         date,
  blocker        text check (blocker is null or length(blocker) <= 500),
  done_at        timestamptz,
  updated_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (application_id, key)
);

create index if not exists relocation_milestones_candidate_idx on relocation_milestones (candidate_id, position);
create index if not exists relocation_milestones_due_idx
  on relocation_milestones (due_on) where status in ('pending', 'in_progress', 'blocked');

drop trigger if exists relocation_milestones_touch on relocation_milestones;
create trigger relocation_milestones_touch before update on relocation_milestones
  for each row execute function touch_updated_at();

-- ------------------------------------------------------------ family links

create table if not exists family_links (
  id             uuid primary key default gen_random_uuid(),
  candidate_id   uuid not null references candidates (id) on delete cascade,
  -- sha256 of the token in the URL. The token itself is shown once.
  token_hash     text not null unique,
  label          text not null check (length(label) between 1 and 60),
  created_at     timestamptz not null default now(),
  revoked_at     timestamptz,
  last_viewed_at timestamptz,
  view_count     integer not null default 0
);

create index if not exists family_links_candidate_idx on family_links (candidate_id);

-- ------------------------------------------------------------ stories

create table if not exists success_stories (
  id             uuid primary key default gen_random_uuid(),
  candidate_id   uuid not null references candidates (id) on delete cascade,
  application_id uuid references applications (id) on delete set null,
  display_name   text not null check (length(display_name) between 1 and 60),
  role_label     text not null check (length(role_label) between 1 and 80),
  city_label     text check (city_label is null or length(city_label) <= 80),
  quote          text not null check (length(quote) between 20 and 600),
  status         text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'withdrawn')),
  reviewed_by    uuid references auth.users (id) on delete set null,
  reviewed_at    timestamptz,
  published_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists success_stories_published_idx on success_stories (published_at desc) where status = 'approved';

-- ------------------------------------------------------------ scorecards

create table if not exists interview_scorecards (
  id             uuid primary key default gen_random_uuid(),
  interview_id   uuid not null references application_interviews (id) on delete cascade,
  application_id uuid not null references applications (id) on delete cascade,
  -- [{ "label": "English", "score": 4 }, ...], 1 to 12 criteria scored 1-5.
  criteria       jsonb not null check (jsonb_typeof(criteria) = 'array'),
  recommendation text not null check (recommendation in ('advance', 'hold', 'reject')),
  summary        text check (summary is null or length(summary) <= 2000),
  author         uuid references auth.users (id) on delete set null,
  author_kind    text not null check (author_kind in ('staff', 'employer')),
  created_at     timestamptz not null default now(),
  unique (interview_id, author)
);

create index if not exists interview_scorecards_app_idx on interview_scorecards (application_id);

-- ------------------------------------------------------------ employer fees

create table if not exists employer_fees (
  id             uuid primary key default gen_random_uuid(),
  employer_id    uuid not null references employers (id) on delete restrict,
  application_id uuid not null unique references applications (id) on delete restrict,
  amount_minor   integer not null check (amount_minor >= 0),
  currency       text not null default 'EUR' check (currency in ('EUR')),
  status         text not null default 'pending' check (status in ('pending', 'invoiced', 'paid', 'waived')),
  invoice_ref    text check (invoice_ref is null or length(invoice_ref) <= 60),
  note           text check (note is null or length(note) <= 500),
  invoiced_at    timestamptz,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists employer_fees_status_idx on employer_fees (status, created_at desc);

drop trigger if exists employer_fees_touch on employer_fees;
create trigger employer_fees_touch before update on employer_fees
  for each row execute function touch_updated_at();

-- ------------------------------------------------------------ identity unlock

create table if not exists profile_unlock_requests (
  id             uuid primary key default gen_random_uuid(),
  employer_id    uuid not null references employers (id) on delete cascade,
  candidate_id   uuid not null references candidates (id) on delete cascade,
  application_id uuid references applications (id) on delete set null,
  requested_by   uuid references auth.users (id) on delete set null,
  reason         text not null check (length(reason) between 5 and 500),
  status         text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  decided_by     uuid references auth.users (id) on delete set null,
  decided_at     timestamptz,
  created_at     timestamptz not null default now()
);

create unique index if not exists profile_unlock_open_idx
  on profile_unlock_requests (employer_id, candidate_id) where status in ('pending', 'approved');

-- ------------------------------------------------------------ bench holds

create table if not exists bench_holds (
  id           uuid primary key default gen_random_uuid(),
  employer_id  uuid not null references employers (id) on delete cascade,
  candidate_id uuid not null references candidates (id) on delete cascade,
  held_by      uuid references auth.users (id) on delete set null,
  expires_at   timestamptz not null,
  released_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists bench_holds_active_idx on bench_holds (candidate_id, expires_at) where released_at is null;

-- ------------------------------------------------------------ RLS

alter table relocation_documents    enable row level security;
alter table relocation_milestones   enable row level security;
alter table family_links            enable row level security;
alter table success_stories         enable row level security;
alter table interview_scorecards    enable row level security;
alter table employer_fees           enable row level security;
alter table profile_unlock_requests enable row level security;
alter table bench_holds             enable row level security;

-- The candidate's own rows.
drop policy if exists relocation_documents_self_read on relocation_documents;
create policy relocation_documents_self_read on relocation_documents for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));
drop policy if exists relocation_milestones_self_read on relocation_milestones;
create policy relocation_milestones_self_read on relocation_milestones for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));
drop policy if exists family_links_self_read on family_links;
create policy family_links_self_read on family_links for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));
drop policy if exists success_stories_self_read on success_stories;
create policy success_stories_self_read on success_stories for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

-- Staff.
drop policy if exists relocation_documents_staff_read on relocation_documents;
create policy relocation_documents_staff_read on relocation_documents for select to authenticated
  using ((select has_permission('relocation.manage')));
drop policy if exists relocation_milestones_staff_read on relocation_milestones;
create policy relocation_milestones_staff_read on relocation_milestones for select to authenticated
  using ((select has_permission('applications.view')));
drop policy if exists success_stories_staff_read on success_stories;
create policy success_stories_staff_read on success_stories for select to authenticated
  using ((select has_permission('relocation.manage')));
drop policy if exists interview_scorecards_staff_read on interview_scorecards;
create policy interview_scorecards_staff_read on interview_scorecards for select to authenticated
  using ((select has_permission('applications.view')));
drop policy if exists employer_fees_staff_read on employer_fees;
create policy employer_fees_staff_read on employer_fees for select to authenticated
  using ((select has_permission('payments.view')));
drop policy if exists profile_unlock_staff_read on profile_unlock_requests;
create policy profile_unlock_staff_read on profile_unlock_requests for select to authenticated
  using ((select has_permission('candidates.view')));
drop policy if exists bench_holds_staff_read on bench_holds;
create policy bench_holds_staff_read on bench_holds for select to authenticated
  using ((select has_permission('candidates.view')));

-- Employers: their own.
drop policy if exists interview_scorecards_employer_read on interview_scorecards;
create policy interview_scorecards_employer_read on interview_scorecards for select to authenticated
  using (application_id in (
    select a.id from applications a join job_postings j on j.id = a.job_id
    where j.employer_id = (select current_employer_id())));
drop policy if exists employer_fees_employer_read on employer_fees;
create policy employer_fees_employer_read on employer_fees for select to authenticated
  using (employer_id = (select current_employer_id()));
drop policy if exists profile_unlock_employer_read on profile_unlock_requests;
create policy profile_unlock_employer_read on profile_unlock_requests for select to authenticated
  using (employer_id = (select current_employer_id()));
drop policy if exists bench_holds_employer_read on bench_holds;
create policy bench_holds_employer_read on bench_holds for select to authenticated
  using (employer_id = (select current_employer_id()));

-- Published stories are public, through these columns only.
drop policy if exists success_stories_public_read on success_stories;
create policy success_stories_public_read on success_stories for select to anon
  using (status = 'approved');
revoke select on success_stories from anon;
grant select (id, display_name, role_label, city_label, quote, published_at, status) on success_stories to anon;

-- ------------------------------------------------------------ employer views

/*
 * Masks a full name to a first name and an initial: "Arjun N.". What an
 * employer sees until staff release the identity, so a candidate cannot be
 * found and approached around the platform before the employer is committed.
 */
create or replace function masked_name(full_name text)
returns text language sql immutable as $$
  select case
    when full_name is null or btrim(full_name) = '' then 'Candidate'
    when position(' ' in btrim(full_name)) = 0 then btrim(full_name)
    else split_part(btrim(full_name), ' ', 1) || ' ' ||
         upper(left(regexp_replace(btrim(full_name), '^.*\s', ''), 1)) || '.'
  end
$$;

drop function if exists employer_applicants();
create function employer_applicants()
returns table (
  application_id     uuid,
  reference          text,
  status             application_status,
  status_changed_at  timestamptz,
  job_id             uuid,
  job_title          text,
  job_city           text,
  candidate_name     text,
  identity_released  boolean,
  candidate_position text,
  candidate_city     text,
  experience_band    smallint,
  english_cefr       text,
  overall_score      smallint,
  verified_documents text[],
  next_interview_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id, a.reference, a.status, a.status_changed_at,
    j.id, j.title, j.city,
    case when u.id is not null then c.full_name else masked_name(c.full_name) end,
    u.id is not null,
    c.position, c.city_state, c.years_experience_band,
    r.english_cefr::text, r.overall_score,
    coalesce((
      select array_agg(distinct d.kind) from relocation_documents d
      where d.candidate_id = c.id and d.status = 'verified' and d.superseded_at is null
        and (d.expires_on is null or d.expires_on >= current_date)
    ), '{}'),
    (
      select min(i.starts_at) from application_interviews i
      where i.application_id = a.id and i.status = 'scheduled' and i.starts_at > now()
    )
  from applications a
  join job_postings j on j.id = a.job_id
  join candidates c on c.id = a.candidate_id
  left join reports r on r.candidate_id = c.id
  left join profile_unlock_requests u
    on u.employer_id = j.employer_id and u.candidate_id = c.id and u.status = 'approved'
  where current_employer_id() is not null
    and j.employer_id = current_employer_id()
    and a.status in ('shortlisted', 'interview', 'offer', 'hired', 'visa_processing', 'relocated')
  order by a.status_changed_at desc
  limit 500
$$;

revoke all on function employer_applicants() from public, anon;
grant execute on function employer_applicants() to authenticated;

/*
 * The bench: visible, assessed candidates with at least a verified passport,
 * for employers who need people quickly. Readiness is scored in the app from
 * verified_documents; this only narrows the pool and masks names.
 */
create or replace function employer_bench()
returns table (
  candidate_id       uuid,
  candidate_name     text,
  candidate_position text,
  candidate_city     text,
  english_cefr       text,
  overall_score      smallint,
  years_experience   smallint,
  verified_documents text[],
  held_until         timestamptz,
  held_by_me         boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, masked_name(c.full_name), c.position, c.city_state,
    r.english_cefr::text, r.overall_score,
    (case c.years_experience_band when 0 then 0 when 1 then 2 when 2 then 4 else 6 end)::smallint,
    docs.kinds,
    h.expires_at,
    coalesce(h.employer_id = current_employer_id(), false)
  from candidates c
  join reports r on r.candidate_id = c.id
  cross join lateral (
    select coalesce(array_agg(distinct d.kind), '{}') as kinds from relocation_documents d
    where d.candidate_id = c.id and d.status = 'verified' and d.superseded_at is null
      and (d.expires_on is null or d.expires_on >= current_date)
  ) docs
  left join lateral (
    select b.expires_at, b.employer_id from bench_holds b
    where b.candidate_id = c.id and b.released_at is null and b.expires_at > now()
    order by b.expires_at desc limit 1
  ) h on true
  where current_employer_id() is not null
    and c.visible_to_employers
    and c.erased_at is null
    and c.payment_status = 'paid'
    and 'passport' = any(docs.kinds)
    and not exists (
      select 1 from applications a where a.candidate_id = c.id
      and a.status in ('hired', 'visa_processing', 'relocated'))
  order by r.overall_score desc
  limit 200
$$;

revoke all on function employer_bench() from public, anon;
grant execute on function employer_bench() to authenticated;
