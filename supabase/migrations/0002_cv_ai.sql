-- ============================================================================
-- AI-assisted CV assessment
--
-- Design constraint that shapes every table here: under the EU AI Act, a system
-- used to evaluate candidates in recruitment is high risk, and under GDPR Art.22
-- a decision with significant effect on a person cannot be taken by an automated
-- system alone. So:
--
--   * cv_assessments holds a SUGGESTION. It is never a decision.
--   * cv_review_decisions holds the decision, made by a person, with a reason
--     that is mandatory whenever they depart from the suggestion.
--   * every assessment records model, prompt version and rubric version, so a
--     decision taken today stays explainable after the model behind it changes.
--   * a candidate is entitled to the reasoning, so evidence is stored per
--     criterion and is not optional.
-- ============================================================================

-- Guarded: a failed earlier run may already have created these. Postgres has no
-- `create type if not exists`, so the exception block is the idiomatic form.
do $$ begin
  create type cv_review_outcome as enum ('advance', 'hold', 'reject', 'needs_more_info');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cv_processing_state as enum ('uploaded', 'extracting', 'rating', 'ready', 'failed');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------- documents ---
create table cv_documents (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references candidates (id) on delete cascade,
  storage_path  text not null,
  mime_type     text not null,
  byte_size     integer not null,
  -- sha256 of the file. Ties an assessment to exact bytes, and catches the same
  -- CV submitted under several identities.
  document_hash text not null,
  state         cv_processing_state not null default 'uploaded',
  failure_reason text,
  uploaded_at   timestamptz not null default now()
);

create index cv_documents_candidate_idx on cv_documents (candidate_id);
create index cv_documents_hash_idx      on cv_documents (document_hash);
create index cv_documents_state_idx     on cv_documents (state);

-- ----------------------------------------------------------- assessments ---
create table cv_assessments (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references cv_documents (id) on delete cascade,
  candidate_id    uuid not null references candidates (id) on delete cascade,
  sector          sector_slug not null,

  -- Recomputed from the criterion scores and the rubric weights on our side,
  -- not taken from the model's own overall figure.
  suggested_score smallint not null check (suggested_score between 0 and 100),
  role_fit        text not null,

  -- Per-criterion scores, each with its evidence quotes and confidence. This is
  -- what a reviewer reads, and what a candidate is entitled to see.
  criteria        jsonb not null default '[]'::jsonb,
  strengths       jsonb not null default '[]'::jsonb,
  concerns        jsonb not null default '[]'::jsonb,

  -- Extracted structure, minus the protected attributes, which are stored
  -- separately below so they are never joined into a rating query by accident.
  profile         jsonb not null default '{}'::jsonb,

  -- CV against what the candidate said at sign-up.
  discrepancies   jsonb not null default '[]'::jsonb,

  -- The gate. True means a person must look before any triage on the score.
  requires_review boolean not null default true,
  attention_reasons jsonb not null default '[]'::jsonb,

  -- Audit trail. Not optional: this is the technical record the AI Act expects.
  model           text not null,
  prompt_version  text not null,
  rubric_version  text not null,
  input_tokens    integer not null default 0,
  output_tokens   integer not null default 0,

  created_at      timestamptz not null default now()
);

create index cv_assessments_candidate_idx on cv_assessments (candidate_id);
create index cv_assessments_score_idx     on cv_assessments (suggested_score desc);
create index cv_assessments_review_idx    on cv_assessments (requires_review) where requires_review;

-- Identity found in the CV, kept apart from the assessment row on purpose: the
-- rating pass never receives it, and separating the storage makes it hard to
-- reintroduce it into a scoring query by accident.
create table cv_protected_attributes (
  assessment_id uuid primary key references cv_assessments (id) on delete cascade,
  attributes    jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------- decisions ---
create table cv_review_decisions (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references cv_assessments (id) on delete cascade,
  reviewer       uuid not null references auth.users (id),
  outcome        cv_review_outcome not null,

  -- The reviewer's own score. Divergence from suggested_score is the signal that
  -- tells us the rubric is wrong, so it is worth capturing every time.
  reviewer_score smallint check (reviewer_score between 0 and 100),
  agreed_with_ai boolean not null,

  -- Mandatory when the reviewer departs from the suggestion. Enforced below.
  reason         text,

  decided_at     timestamptz not null default now(),

  constraint reason_required_on_override
    check (agreed_with_ai or (reason is not null and length(btrim(reason)) >= 10))
);

create index cv_decisions_assessment_idx on cv_review_decisions (assessment_id);
create index cv_decisions_reviewer_idx   on cv_review_decisions (reviewer);

-- ----------------------------------------------------- bias monitoring ---
-- Redaction cannot remove everything that correlates with a protected group:
-- employer and institution names still carry regional signal. The mitigation is
-- to watch outcomes, not to redact harder. This view is the input to that.
--
-- Deliberately aggregate-only, and staff-only via the service role.
create view cv_outcome_monitor
with (security_invoker = true) as
select
  a.sector,
  a.rubric_version,
  a.model,
  c.city_state,
  count(*)                                      as assessed,
  round(avg(a.suggested_score), 1)              as avg_suggested,
  round(avg(d.reviewer_score), 1)               as avg_reviewer,
  count(*) filter (where d.agreed_with_ai is false) as overrides,
  count(*) filter (where d.outcome = 'advance')  as advanced
from cv_assessments a
join candidates c on c.id = a.candidate_id
left join cv_review_decisions d on d.assessment_id = a.id
group by a.sector, a.rubric_version, a.model, c.city_state;

-- ============================================================================
-- Row level security
-- ============================================================================
alter table cv_documents            enable row level security;
alter table cv_assessments          enable row level security;
alter table cv_protected_attributes enable row level security;
alter table cv_review_decisions     enable row level security;

-- A candidate can see their own document and their own assessment, including the
-- reasoning. That is their right, not a courtesy.
create policy cv_documents_self on cv_documents
  for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

create policy cv_assessments_self on cv_assessments
  for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

create policy cv_decisions_self on cv_review_decisions
  for select to authenticated
  using (
    assessment_id in (
      select a.id from cv_assessments a
      join candidates c on c.id = a.candidate_id
      where c.auth_user_id = (select auth.uid())
    )
  );

-- Staff review through the service role. No policy grants employers access to
-- an assessment: the AI rating is an internal triage aid, and handing a raw
-- model score to a client employer would be both misleading and indefensible.
create policy cv_decisions_insert_staff on cv_review_decisions
  for insert to authenticated
  with check (reviewer = (select auth.uid()));

-- cv_protected_attributes has no policy at all, so RLS denies every role except
-- the service role. Nothing in the request path should ever read it.
