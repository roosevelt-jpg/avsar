-- ============================================================================
-- Pay after the assessment
--
-- The fee moves from before the assessment to after it. A candidate registers,
-- fills in their profile, sits the assessment, and pays to unlock the report,
-- the career pack and the CV.
--
-- What the fee buys has not changed, only when it is collected. The disclosure
-- moved with it, in the opposite direction: the odds and the EUR 1,000 are now
-- shown at the end of signup, before anyone spends ninety minutes answering,
-- rather than at a checkout that no longer stands between them and the work.
--
-- Two consequences this file has to carry.
--
-- The attempt function required a paid candidate, which is now backwards: an
-- unpaid candidate is exactly who sits the assessment. It still requires a
-- candidate, so the assessment is not open to the internet, and the deadline is
-- still set here rather than by the browser.
--
-- Everything the fee unlocks is gated in the application layer, where the
-- payment status is read per request. The attempt rows themselves are not
-- sensitive: the answers belong to the candidate, and holding their own answers
-- back from them would be an odd thing to do with a service they are about to
-- buy.
-- ============================================================================

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

  /*
    A candidate, not a paid one. The fee is collected after this and the report
    is what it unlocks, so requiring payment here would make the new flow
    impossible rather than secure.
  */
  select id into v_candidate
    from candidates
   where auth_user_id = auth.uid();

  if v_candidate is null then
    raise exception 'no_candidate_for_session';
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

/*
  The constraint from 0010 said a paid candidate always has a complete profile.
  That still holds and is still worth keeping: the profile is filled in before
  the assessment, and the assessment is before the fee, so by the time anyone
  pays the profile has been complete for an hour.
*/

/*
  An employer still only sees people who have paid. The talent pool is the thing
  the fee buys a place in, and an assessment sat without paying does not put
  anybody in front of an employer.

  Stated here because it is now a different sentence from "has been assessed",
  and the two used to be the same.
*/
comment on view talent_pool is
  'Paid candidates with a report. Sitting the assessment is free; appearing here '
  'is what the fee buys, along with the report and the career pack.';
