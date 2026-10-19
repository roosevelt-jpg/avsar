-- ============================================================================
-- English provenance on the report
--
-- The internal item bank measures workplace comprehension. It is not a language
-- qualification: uncalibrated items, no speaking component, unsupervised.
--
-- These columns exist so a certified result and an in-house estimate are never
-- stored, shown or searched as if they were the same thing. Without them the
-- only honest options are to hide the level entirely or to overstate it.
-- ============================================================================

do $$ begin
  create type english_source as enum ('internal', 'duolingo', 'englishscore', 'versant');
exception when duplicate_object then null; end $$;

alter table reports
  add column if not exists english_source english_source not null default 'internal',
  add column if not exists english_raw_score smallint,
  add column if not exists english_certificate_ref text,
  add column if not exists english_issued_at timestamptz,
  add column if not exists english_expires_at timestamptz;

-- True only when a third party stands behind the number. Generated rather than
-- set by application code, so it cannot drift from the source.
alter table reports
  add column if not exists english_certified boolean
  generated always as (english_source <> 'internal') stored;

comment on column reports.english_certified is
  'Whether a recognised provider issued this level. Never true for the internal bank.';

-- Employers filter on English level. A certificate that has expired must stop
-- counting as one, so the view reports both the level and its standing.
drop view if exists talent_pool;

create view talent_pool
with (security_invoker = true) as
select
  c.id,
  c.full_name,
  c.city_state,
  c.sector,
  c.visible_to_employers,
  r.english_cefr,
  r.english_rank,
  r.english_source,
  (r.english_certified and (r.english_expires_at is null or r.english_expires_at > now()))
    as english_certified,
  r.overall_score,
  case c.years_experience_band
    when 0 then 0 when 1 then 2 when 2 then 4 else 6
  end as years_experience
from candidates c
join reports r on r.candidate_id = c.id
where c.payment_status = 'paid';
