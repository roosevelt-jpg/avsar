-- ============================================================================
-- 0042: candidate-owned chat threads for the dashboard Messages page.
--
-- The HTML-44 pack gives every candidate a Messages workspace. Threads already
-- exist for the public desk; this migration lets a signed-in candidate own a
-- thread and read/write their own messages without opening staff RLS.
-- Re-runnable.
-- ============================================================================

alter table chat_threads
  add column if not exists candidate_id uuid references candidates (id) on delete set null;

create index if not exists chat_threads_candidate_idx
  on chat_threads (candidate_id, last_message_at desc)
  where candidate_id is not null;

-- Candidates read their own threads.
drop policy if exists chat_threads_candidate_select on chat_threads;
create policy chat_threads_candidate_select on chat_threads
  for select to authenticated
  using (
    candidate_id is not null
    and candidate_id = (select id from candidates where user_id = auth.uid() limit 1)
  );

-- Candidates open a new thread for themselves (web channel only).
drop policy if exists chat_threads_candidate_insert on chat_threads;
create policy chat_threads_candidate_insert on chat_threads
  for insert to authenticated
  with check (
    candidate_id = (select id from candidates where user_id = auth.uid() limit 1)
    and channel = 'web'
  );

-- Candidates read messages on threads they own.
drop policy if exists assistant_messages_candidate_select on assistant_messages;
create policy assistant_messages_candidate_select on assistant_messages
  for select to authenticated
  using (
    thread_id is not null
    and exists (
      select 1 from chat_threads t
      where t.id = assistant_messages.thread_id
        and t.candidate_id = (select id from candidates where user_id = auth.uid() limit 1)
    )
  );

-- Candidates post as the user role on their own threads.
drop policy if exists assistant_messages_candidate_insert on assistant_messages;
create policy assistant_messages_candidate_insert on assistant_messages
  for insert to authenticated
  with check (
    role = 'user'
    and thread_id is not null
    and exists (
      select 1 from chat_threads t
      where t.id = assistant_messages.thread_id
        and t.candidate_id = (select id from candidates where user_id = auth.uid() limit 1)
    )
  );
