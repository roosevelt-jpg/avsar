-- ============================================================================
-- Authentication and staff access
--
-- Also closes a hole left by 0001. The `attempts_self_all` policy let a
-- candidate insert their own assessment attempt, which means setting their own
-- `expires_at`. The whole point of a server-side timer is that the candidate
-- cannot do that, so attempts are now created only through a security-definer
-- function that sets the deadline itself.
-- ============================================================================

-- ------------------------------------------------------------ staff users ---
-- Staff are a row here, not a flag in user metadata: metadata is editable by
-- the user it belongs to, and these are the people who decide whether a
-- candidate advances.
create table if not exists staff_users (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  role         text not null default 'reviewer' check (role in ('reviewer', 'admin')),
  created_at   timestamptz not null default now()
);

alter table staff_users enable row level security;

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from staff_users where auth_user_id = auth.uid())
$$;

-- A staff member can see their own row, and nothing else in this table. Managing
-- staff happens through the service role.
create policy staff_self_select on staff_users
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

-- ------------------------------------------- link candidate to auth user ---
-- The candidate row is created at sign-up, before any auth account exists,
-- because payment comes first. When they later sign in, the OTP proves they
-- control that address, so matching on email is sound. Case-insensitive,
-- because people capitalise inconsistently.
create or replace function link_candidate_to_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;
  end if;

  update candidates
     set auth_user_id = new.id
   where auth_user_id is null
     and lower(email) = lower(new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function link_candidate_to_auth_user();

-- Covers candidates who already had an auth account before this migration ran.
update candidates c
   set auth_user_id = u.id
  from auth.users u
 where c.auth_user_id is null
   and lower(c.email) = lower(u.email);

-- ------------------------------------------------- assessment attempts ---
-- Replace the blanket policy. Read only; creation and submission go through the
-- functions below, so neither the deadline nor the submission time is client
-- controlled.
drop policy if exists attempts_self_all on assessment_attempts;

create policy attempts_self_select on assessment_attempts
  for select to authenticated
  using (
    candidate_id in (select id from candidates where auth_user_id = (select auth.uid()))
  );

-- Minutes allowed for one section. A constant, deliberately not a parameter:
-- a parameter is a client-supplied deadline.
create or replace function assessment_minutes()
returns integer
language sql
immutable
as $$ select 90 $$;

/**
 * Starts or resumes a section. Idempotent: calling it again returns the
 * existing attempt, which is what makes resume-after-disconnect work.
 */
create or replace function start_assessment_attempt(p_section text)
returns assessment_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate uuid;
  v_attempt   assessment_attempts;
begin
  if p_section not in ('skills', 'experience', 'english', 'profile') then
    raise exception 'unknown_section';
  end if;

  select id into v_candidate
    from candidates
   where auth_user_id = auth.uid()
     and payment_status = 'paid';

  if v_candidate is null then
    raise exception 'no_paid_candidate_for_session';
  end if;

  select * into v_attempt
    from assessment_attempts
   where candidate_id = v_candidate
     and section = p_section;

  if found then
    return v_attempt;
  end if;

  insert into assessment_attempts (candidate_id, section, expires_at)
  values (v_candidate, p_section, now() + make_interval(mins => assessment_minutes()))
  returning * into v_attempt;

  return v_attempt;
end;
$$;

/** Submits a section. The timestamp is the server's, not the client's. */
create or replace function submit_assessment_attempt(p_attempt_id uuid)
returns assessment_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt assessment_attempts;
begin
  update assessment_attempts a
     set submitted_at = now(),
         status = case when a.expires_at < now() then 'expired'::attempt_status
                       else 'submitted'::attempt_status end
   where a.id = p_attempt_id
     and a.submitted_at is null
     and a.candidate_id in (select id from candidates where auth_user_id = auth.uid())
  returning * into v_attempt;

  if not found then
    raise exception 'attempt_not_open';
  end if;

  return v_attempt;
end;
$$;

revoke all on function start_assessment_attempt(text) from public, anon;
revoke all on function submit_assessment_attempt(uuid) from public, anon;
grant execute on function start_assessment_attempt(text) to authenticated;
grant execute on function submit_assessment_attempt(uuid) to authenticated;

-- ------------------------------------------------------- staff read access ---
-- Staff review candidates and CV assessments through the normal client, so they
-- need explicit policies. Employers still get none of this.
create policy candidates_staff_select on candidates
  for select to authenticated
  using ((select is_staff()));

create policy reports_staff_select on reports
  for select to authenticated
  using ((select is_staff()));

create policy cv_documents_staff_select on cv_documents
  for select to authenticated
  using ((select is_staff()));

create policy cv_assessments_staff_select on cv_assessments
  for select to authenticated
  using ((select is_staff()));

create policy cv_decisions_staff_select on cv_review_decisions
  for select to authenticated
  using ((select is_staff()));

-- Tighten the insert policy from 0002: being signed in was enough, which would
-- have let any authenticated user record a decision on any candidate.
drop policy if exists cv_decisions_insert_staff on cv_review_decisions;

create policy cv_decisions_insert_staff on cv_review_decisions
  for insert to authenticated
  with check (reviewer = (select auth.uid()) and (select is_staff()));

-- cv_protected_attributes still has no policy, so it stays service-role only.
-- Staff review the redacted profile; the identity the CV carried is not part of
-- that job.
