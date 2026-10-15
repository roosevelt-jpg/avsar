-- ============================================================================
-- 0022: preliminary legal review, and a national ID document
--
-- The owner's package (questionnaire 3.3) includes a preliminary legal due
-- diligence report: the legal team reviews the documents the candidate has
-- provided and sets out the immigration requirements for Portugal, what is
-- missing and what needs further assessment. Every buyer is owed one, so it is
-- a record with a state, not a note in an inbox.
--
-- The candidate reads it only once delivered. Drafts are staff-only.
--
-- Questionnaire 5.5: collect an ID or passport at assessment time, so the
-- document vault accepts a national ID card for candidates without a passport.
-- ============================================================================

create table if not exists legal_reviews (
  candidate_id      uuid primary key references candidates (id) on delete cascade,
  status            text not null default 'draft' check (status in ('draft', 'delivered')),
  summary           text not null default '' check (length(summary) <= 4000),
  requirements      text not null default '' check (length(requirements) <= 4000),
  missing_documents text not null default '' check (length(missing_documents) <= 4000),
  issues            text not null default '' check (length(issues) <= 4000),
  reviewed_by       uuid references auth.users (id),
  delivered_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists legal_reviews_touch on legal_reviews;
create trigger legal_reviews_touch before update on legal_reviews
  for each row execute function touch_updated_at();

alter table legal_reviews enable row level security;

drop policy if exists legal_reviews_self_select on legal_reviews;
create policy legal_reviews_self_select on legal_reviews
  for select to authenticated
  using (
    status = 'delivered'
    and candidate_id in (select id from candidates where auth_user_id = (select auth.uid()))
  );

drop policy if exists legal_reviews_staff_select on legal_reviews;
create policy legal_reviews_staff_select on legal_reviews
  for select to authenticated
  using ((select has_permission('relocation.manage')));

-- ---------------------------------------------------------- national ID ---

alter table relocation_documents drop constraint if exists relocation_documents_kind_check;
alter table relocation_documents add constraint relocation_documents_kind_check
  check (kind in (
    'passport', 'national_id', 'police_clearance', 'medical', 'contract', 'accommodation',
    'insurance', 'photo', 'qualification', 'bank_statement', 'other'));
