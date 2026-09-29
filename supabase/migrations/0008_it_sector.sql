-- ============================================================================
-- IT joins the sector enum
--
-- `sector` is the key the assessment bank is drawn from, and it had no IT
-- value. A data analyst signing up failed on insert, because sign-up derives
-- sector from the position and wrote a value the type did not have.
--
-- Roles inside IT are told apart by `positions` on the item, not by more enum
-- values: a data analyst and a QA tester share a sector and not a job, and one
-- enum value per role is the churn positions.ts exists to avoid.
-- ============================================================================

-- `add value` cannot run inside a transaction block on older Postgres. The
-- Supabase SQL editor handles it; a migration runner may need it on its own.
alter type sector_slug add value if not exists 'it';
