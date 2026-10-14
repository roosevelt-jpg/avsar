-- ============================================================================
-- Positions
--
-- Candidates now apply to a position, not a sector. Twelve positions across
-- five areas, and several share an assessment bank: a plumber and an
-- electrician both answer maintenance items.
--
-- `position` is text rather than an enum. The list will change every time the
-- business opens a new role, and an enum turns that into a migration and a
-- deploy. `sector` stays as the enum it was, because it is what the item bank
-- is keyed on and that set changes rarely.
-- ============================================================================

alter table candidates
  add column if not exists position text;

create index if not exists candidates_position_idx on candidates (position);

-- Backfill from the sector chosen under the old model, so existing candidates
-- keep a coherent record rather than a null nobody can interpret later.
update candidates set position = case sector
  when 'hospitality' then 'chef'
  when 'property-management' then 'property-manager'
  when 'cleaning' then 'cleaner'
  when 'drivers' then 'driver'
  when 'maintenance' then 'electrician'
  when 'construction' then 'construction-worker'
  else null
end
where position is null;

comment on column candidates.position is
  'Position applied for. See src/lib/data/positions.ts; sector remains the assessment bank key.';

-- The talent pool shows the position, because that is what an employer
-- searches for. An employer looking for a welder is not helped by "construction".
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
  end as years_experience
from candidates c
join reports r on r.candidate_id = c.id
where c.payment_status = 'paid';
