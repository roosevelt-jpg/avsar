-- ============================================================================
-- 0017 - Employer portal
--
--   1. Vacancy requests. An employer describes a vacancy; it arrives as a draft
--      job_postings row linked to their employer, and staff edit and publish
--      it. requested_at marks the row as having come from an employer, and
--      request_note keeps what they wrote, unedited, next to the job.
--   2. Employers read their own postings, any status, so they can follow a
--      request from "with our team" to live.
--   3. employer_applicants(): the applicants an employer may see. Only
--      applications to their own postings, and only once a recruiter has
--      shortlisted them. A function rather than a policy on applications and
--      candidates, so the columns are fixed here: no phone, no email, no
--      assessment scores, whatever the candidates table grows later.
--
-- Re-runnable.
-- ============================================================================

alter table job_postings add column if not exists requested_at timestamptz;
alter table job_postings add column if not exists requested_by uuid references auth.users (id) on delete set null;
alter table job_postings add column if not exists request_note text;

do $$ begin
  alter table job_postings add constraint job_postings_request_note_len
    check (request_note is null or length(request_note) <= 2000);
exception when duplicate_object then null; end $$;

create index if not exists job_postings_requested_idx
  on job_postings (employer_id, requested_at desc) where requested_at is not null;

-- ------------------------------------------------------------ own postings

drop policy if exists jobs_employer_read on job_postings;
create policy jobs_employer_read on job_postings
  for select to authenticated
  using (employer_id is not null and employer_id = (select current_employer_id()));

-- ------------------------------------------------------------ applicants

create or replace function employer_applicants()
returns table (
  application_id    uuid,
  reference         text,
  status            application_status,
  status_changed_at timestamptz,
  job_id            uuid,
  job_title         text,
  job_city          text,
  candidate_name    text,
  candidate_position text,
  candidate_city    text,
  experience_band   smallint,
  next_interview_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id, a.reference, a.status, a.status_changed_at,
    j.id, j.title, j.city,
    c.full_name, c.position, c.city_state, c.years_experience_band,
    (
      select min(i.starts_at) from application_interviews i
      where i.application_id = a.id and i.status = 'scheduled' and i.starts_at > now()
    )
  from applications a
  join job_postings j on j.id = a.job_id
  join candidates c on c.id = a.candidate_id
  where current_employer_id() is not null
    and j.employer_id = current_employer_id()
    and a.status in ('shortlisted', 'interview', 'offer', 'hired', 'visa_processing', 'relocated')
  order by a.status_changed_at desc
  limit 500
$$;

revoke all on function employer_applicants() from public, anon;
grant execute on function employer_applicants() to authenticated;
