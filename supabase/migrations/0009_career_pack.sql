-- ============================================================================
-- Career pack
--
-- The part of the fee with value independent of any placement: an improved CV,
-- interview preparation and a development plan the candidate keeps and can use
-- with any employer anywhere.
--
-- Generated once and stored, not on every view. Each generation is a model pass
-- over the whole profile, and at cohort scale re-running it on page load would
-- be the single largest cost in the product.
-- ============================================================================

create table if not exists career_packs (
  candidate_id uuid primary key references candidates (id) on delete cascade,

  strengths    jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  interview    jsonb not null default '{}'::jsonb,
  improved_cv  jsonb not null default '{}'::jsonb,

  -- The advice in the candidate's own language. The CV stays English because
  -- it goes to a Portuguese employer; guidance about their own career does not,
  -- and this is the part they act on.
  translated   jsonb,

  -- Bullets whose stated source could not be found in the candidate's own
  -- material. The prompt forbids invention; this records where the check
  -- disagreed, so a person can look before the candidate takes it to an
  -- interview.
  unsupported_lines jsonb not null default '[]'::jsonb,

  model          text not null,
  prompt_version text not null,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,

  generated_at timestamptz not null default now(),
  -- Regenerations are counted, not unlimited: each one costs a model pass.
  generation_count smallint not null default 1
);

alter table career_packs enable row level security;

-- Theirs to read. Written only by the service role, because generating one
-- spends money and a client must not be able to trigger that at will.
create policy career_packs_self_select on career_packs
  for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

create policy career_packs_staff_select on career_packs
  for select to authenticated
  using ((select is_staff()));
