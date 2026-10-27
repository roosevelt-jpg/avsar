-- A dated next step sits beside the candidate-facing stage.
-- The stage says where the application is. The next step says what a person
-- on the team will do, and on which day, so the morning list can sort by it.
-- assigned_to already exists (0014); this only adds the step.

alter table applications
  add column if not exists next_step text,
  add column if not exists next_step_on date;

alter table applications drop constraint if exists applications_next_step_len;
alter table applications
  add constraint applications_next_step_len
  check (next_step is null or length(next_step) between 1 and 200);

create index if not exists applications_assignee_idx
  on applications (assigned_to)
  where assigned_to is not null;

create index if not exists applications_next_step_idx
  on applications (next_step_on)
  where next_step_on is not null;

create index if not exists applications_submitted_created_idx
  on applications (created_at)
  where status = 'submitted';
