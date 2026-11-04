-- ============================================================================
-- 0040: News & Insights editions staff compose and send to footer subscribers.
--
-- Each row is one letter. Sending stamps sent_at and the counts; the public
-- page lists rows with status = 'sent'. Writes go through the service role
-- after leads.manage. Anon can only read published editions (title, body,
-- dates) — never draft text or send counts.
--
-- Re-runnable.
-- ============================================================================

create table if not exists newsletters (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(title) between 1 and 200),
  body         text not null check (length(body) between 1 and 8000),
  status       text not null default 'draft'
                 check (status in ('draft', 'sent')),
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz,
  sent_count   integer not null default 0 check (sent_count >= 0),
  fail_count   integer not null default 0 check (fail_count >= 0)
);

create index if not exists newsletters_sent_at_idx
  on newsletters (sent_at desc)
  where status = 'sent';

alter table newsletters enable row level security;

drop policy if exists newsletters_public_select on newsletters;
create policy newsletters_public_select on newsletters
  for select to anon, authenticated
  using (status = 'sent');

drop policy if exists newsletters_staff_select on newsletters;
create policy newsletters_staff_select on newsletters
  for select to authenticated
  using ((select has_permission('leads.manage')));

drop policy if exists newsletters_staff_insert on newsletters;
create policy newsletters_staff_insert on newsletters
  for insert to authenticated
  with check ((select has_permission('leads.manage')));

drop policy if exists newsletters_staff_update on newsletters;
create policy newsletters_staff_update on newsletters
  for update to authenticated
  using ((select has_permission('leads.manage')))
  with check ((select has_permission('leads.manage')));
