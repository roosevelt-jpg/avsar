-- ============================================================================
-- Item calibration
--
-- Until now every item counted the same. That is wrong in a way that matters:
-- a question almost everyone answers correctly separates nobody, and a question
-- the strongest candidates get wrong is either miskeyed or measuring something
-- other than the trade. Weighting them equally lets both quietly degrade the
-- score, and there is no way to see it happening.
--
-- Two statistics, both standard, both computed from real responses:
--
--   p_value         proportion who answered correctly. Near 1 or near 0 means
--                   the item carries almost no information.
--   discrimination  point-biserial correlation between getting this item right
--                   and the candidate's score on the rest of the section. A
--                   good item is positive and above about 0.2. **Negative means
--                   the better candidates are getting it wrong**, which in
--                   practice almost always means the answer key is wrong.
--
-- Nothing here changes a score on its own. The scorer reads these only once an
-- item has enough responses to mean anything, and the thresholds live in
-- TypeScript beside the scorer rather than in this table, so changing them is a
-- code review rather than a silent update.
--
-- Computed in the application and written here with the service role, rather
-- than as a view. Point-biserial needs each candidate's score on the rest of
-- the section, which is a correlated subquery per item per candidate; doing it
-- in one pass in the application is both clearer and cheaper, and it runs on a
-- schedule rather than on every read.
-- ============================================================================

create table if not exists item_stats (
  item_id text primary key,
  /* How many scored responses this is based on. Below the floor in
     `calibration.ts` the row exists but is not used for weighting. */
  n_responses integer not null default 0,
  p_value numeric(5, 4),
  discrimination numeric(5, 4),
  computed_at timestamptz not null default now()
);

comment on table item_stats is
  'Per-item difficulty and discrimination, recomputed from real responses. Written only by the service role.';

alter table item_stats enable row level security;

/* Staff can read them, because a broken item is something a human has to look
   at and decide about. Nobody writes through the API: the recompute runs with
   the service role, which bypasses RLS, so there is deliberately no write
   policy here at all. */
create policy item_stats_staff_read on item_stats
  for select to authenticated using ((select is_staff()));
