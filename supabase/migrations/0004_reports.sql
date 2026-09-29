-- ============================================================================
-- Report percentiles
--
-- A percentile is a statement about everyone else, so it can only be computed
-- once a report exists and it goes stale as later candidates are scored. Two
-- functions: one for the candidate who has just finished, one to re-rank the
-- whole cohort in a single pass when it closes.
--
-- Both are service-role only. A candidate writing their own standing is exactly
-- the thing the split between `reports` (no write policy) and this file exists
-- to prevent.
-- ============================================================================

/**
 * Percentile for one candidate: the share of the cohort scoring at or below
 * them, subtracted from 100. Lower is better, matching "top 12%" on the
 * dashboard.
 */
create or replace function refresh_candidate_percentile(p_candidate_id uuid)
returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cohort  text;
  v_score   smallint;
  v_total   integer;
  v_at_or_below integer;
  v_percentile  smallint;
begin
  select c.cohort_id, r.overall_score
    into v_cohort, v_score
    from candidates c
    join reports r on r.candidate_id = c.id
   where c.id = p_candidate_id;

  if v_cohort is null then
    return null;
  end if;

  select count(*),
         count(*) filter (where r.overall_score <= v_score)
    into v_total, v_at_or_below
    from reports r
    join candidates c on c.id = r.candidate_id
   where c.cohort_id = v_cohort;

  -- A cohort of one is not a ranking. Say top 100%, not top 0%.
  if v_total = 0 then
    return null;
  end if;

  v_percentile := greatest(1, 100 - ((v_at_or_below::numeric / v_total) * 100)::smallint);

  update reports set percentile = v_percentile where candidate_id = p_candidate_id;

  return v_percentile;
end;
$$;

/** Re-ranks a whole cohort in one pass. Run at cohort close. */
create or replace function refresh_cohort_percentiles(p_cohort_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  with ranked as (
    select r.candidate_id,
           greatest(
             1,
             (100 - (percent_rank() over (order by r.overall_score) * 100))::smallint
           ) as pct
      from reports r
      join candidates c on c.id = r.candidate_id
     where c.cohort_id = p_cohort_id
  )
  update reports r
     set percentile = ranked.pct
    from ranked
   where r.candidate_id = ranked.candidate_id;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

revoke all on function refresh_candidate_percentile(uuid) from public, anon, authenticated;
revoke all on function refresh_cohort_percentiles(text) from public, anon, authenticated;

-- Reports are read by their owner and by staff, and written only by the service
-- role. 0001 gave `reports` select policies and no write policy, which is what
-- keeps a candidate from authoring their own score; this is a reminder, not a
-- change.
