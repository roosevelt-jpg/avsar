-- ============================================================================
-- 0021: the recruitment database is free to join
--
-- The owner's terms (questionnaire 3.3): candidates register and are considered
-- for current and future vacancies free of charge. The paid Professional
-- Assessment and Career Preparation Package is optional, is not required to
-- enter the database, and gives no preferential treatment. Shortlisting depends
-- on the assessment score and the role's requirements, not on payment.
--
-- Until now every employer-facing read required payment_status = 'paid'. Each
-- is redefined here to require a finished assessment (a report row) instead.
-- Nothing employer-facing exposes whether a candidate paid, because that would
-- be the preferential treatment the terms rule out.
--
-- Re-runnable: views and functions are replaced, policies dropped first.
-- ============================================================================

-- ------------------------------------------------------------ talent pool ---

drop view if exists talent_pool;

create view talent_pool
with (security_invoker = true) as
select
  c.id,
  c.full_name,
  c.city_state,
  c.sector,
  c.position,
  c.visible_to_employers,
  r.english_cefr,
  r.english_rank,
  r.english_source,
  (r.english_certified and (r.english_expires_at is null or r.english_expires_at > now()))
    as english_certified,
  r.overall_score,
  case c.years_experience_band
    when 0 then 0 when 1 then 2 when 2 then 4 else 6
  end as years_experience,
  (v.candidate_id is not null) as has_voice_intro
from candidates c
join reports r on r.candidate_id = c.id
left join candidate_voice_intros v on v.candidate_id = c.id
where c.erased_at is null;

-- ------------------------------------------------- employer row access ---

/*
  The policies below ask "has this candidate finished the assessment?". Asked
  as a subquery on reports, it would run reports' own policies, which look at
  candidates again: Postgres refuses that as infinite recursion. A security
  definer function answers it without re-entering row security, and returns
  nothing but a boolean.
*/
create or replace function candidate_has_report(p_candidate uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from reports where candidate_id = p_candidate)
$$;

revoke all on function candidate_has_report(uuid) from public, anon;
grant execute on function candidate_has_report(uuid) to authenticated;

drop policy if exists candidates_employer_select on candidates;
create policy candidates_employer_select on candidates
  for select to authenticated
  using (
    (select current_employer_id()) is not null
    and visible_to_employers
    and erased_at is null
    and candidate_has_report(id)
  );

drop policy if exists voice_employer_select on candidate_voice_intros;
create policy voice_employer_select on candidate_voice_intros
  for select to authenticated
  using (
    (select current_employer_id()) is not null
    and candidate_id in (
      select c.id from candidates c
       where c.visible_to_employers
         and c.erased_at is null
         and candidate_has_report(c.id)
    )
  );

-- ------------------------------------------------------------------ bench ---

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
    and 'passport' = any(docs.kinds)
    and not exists (
      select 1 from applications a where a.candidate_id = c.id
      and a.status in ('hired', 'visa_processing', 'relocated'))
  order by r.overall_score desc
  limit 200
$$;

revoke all on function employer_bench() from public, anon;
grant execute on function employer_bench() to authenticated;
