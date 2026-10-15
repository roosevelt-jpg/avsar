-- 0025: the live selection funnel shown on public pages.
--
-- Four counts and nothing else, so anyone may call it: no row, name or id
-- leaves the database. Counted from what happened, never typed in:
--   completed    candidates with a finished assessment (a report)
--   qualified    of those, a score above the shortlist threshold
--   shortlisted  of those, put forward to an employer at least once
--   hired        of those, hired at least once
--
-- Shortlisted and hired read the status history as well as the current
-- status, so a candidate shortlisted and later not chosen still counts as
-- shortlisted. Each stage is a subset of the one before, so the funnel never
-- widens. The threshold is passed in because it lives in site_settings,
-- which the caller has already read.
--
-- Re-runnable.

create or replace function public_funnel_stats(p_min_score smallint)
returns table (completed bigint, qualified bigint, shortlisted bigint, hired bigint)
language sql
stable
security definer
set search_path = public
as $$
  with assessed as (
    select r.candidate_id, r.overall_score from reports r
  ),
  reached as (
    select a.candidate_id, a.status::text as status from applications a
    union
    select a.candidate_id, e.to_status::text from application_events e
    join applications a on a.id = e.application_id
    where e.to_status is not null
  ),
  qualified as (
    select candidate_id from assessed where overall_score > p_min_score
  )
  select
    (select count(*) from assessed),
    (select count(*) from qualified),
    (select count(distinct q.candidate_id) from qualified q join reached r on r.candidate_id = q.candidate_id
      where r.status in ('shortlisted', 'interview', 'offer', 'hired', 'visa_processing', 'relocated')),
    (select count(distinct q.candidate_id) from qualified q join reached r on r.candidate_id = q.candidate_id
      where r.status in ('hired', 'visa_processing', 'relocated'))
$$;

revoke all on function public_funnel_stats(smallint) from public;
grant execute on function public_funnel_stats(smallint) to anon, authenticated;
