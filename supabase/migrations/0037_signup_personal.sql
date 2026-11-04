-- ============================================================================
-- 0037: optional personal fields shown on the candidate registration mockup
--
-- Date of birth, gender, nationality and willingness to relocate appear on the
-- signup Personal Details step. They stay nullable so older accounts and the
-- short path to the free assessment still work. Nothing here is required for
-- the assessment itself.
-- ============================================================================

alter table candidates add column if not exists date_of_birth date;
alter table candidates add column if not exists gender text
  check (gender is null or gender in ('male', 'female', 'other'));
alter table candidates add column if not exists nationality text
  check (nationality is null or length(nationality) between 2 and 80);
alter table candidates add column if not exists willing_to_relocate boolean;
