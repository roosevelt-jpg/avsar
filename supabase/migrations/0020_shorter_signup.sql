-- ============================================================================
-- 0020: shorter signup
--
-- Signup no longer asks candidates to rate their own spoken English. The
-- assessment measures it, and every question between landing and starting the
-- test loses candidates. The paid-profile invariant from 0010 required the
-- self-rating, so it is redefined without it. Sector, experience and city are
-- still required before anyone can be paid: scoring and employer search use
-- them.
-- ============================================================================

alter table candidates drop constraint if exists candidates_paid_profile_complete;
alter table candidates add constraint candidates_paid_profile_complete
  check (
    payment_status <> 'paid'
    or (
      sector is not null
      and years_experience_band is not null
      and city_state is not null
    )
  );
