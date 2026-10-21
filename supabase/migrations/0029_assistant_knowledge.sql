-- ============================================================================
-- 0029: company notes the public assistant is allowed to answer from.
--
-- Staff write the notes. The website and WhatsApp reply only from the
-- published public notes plus the site settings (price, hours, phone).
-- Staff-only notes are for the legal-review draft and are not searchable
-- by visitors. Messages are kept so a repeat question has the conversation,
-- and so a privacy erasure can delete a WhatsApp thread by phone number.
--
-- Re-runnable.
-- ============================================================================

create table if not exists knowledge_documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(title) between 1 and 200),
  body        text not null check (length(body) between 1 and 100000),
  audience    text not null default 'public' check (audience in ('public', 'staff')),
  published   boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

create table if not exists knowledge_chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references knowledge_documents (id) on delete cascade,
  ordinal      int not null check (ordinal >= 0),
  content      text not null check (length(content) between 1 and 4000),
  search       tsvector generated always as (to_tsvector('simple', content)) stored,
  unique (document_id, ordinal)
);

create index if not exists knowledge_chunks_search on knowledge_chunks using gin (search);

create table if not exists assistant_messages (
  id           uuid primary key default gen_random_uuid(),
  channel      text not null check (channel in ('web', 'whatsapp')),
  thread_key   text not null check (length(thread_key) between 8 and 80),
  role         text not null check (role in ('user', 'assistant')),
  body         text not null check (length(body) between 1 and 4000),
  sources      text[] not null default '{}',
  external_id  text,
  created_at   timestamptz not null default now()
);

create unique index if not exists assistant_messages_external_idx
  on assistant_messages (external_id) where external_id is not null;

create index if not exists assistant_messages_thread_idx
  on assistant_messages (thread_key, created_at);

alter table knowledge_documents enable row level security;
alter table knowledge_chunks enable row level security;
alter table assistant_messages enable row level security;

drop policy if exists knowledge_documents_staff on knowledge_documents;
create policy knowledge_documents_staff on knowledge_documents
  for all to authenticated
  using ((select has_permission('cms.edit')))
  with check ((select has_permission('cms.edit')));

drop policy if exists knowledge_chunks_staff on knowledge_chunks;
create policy knowledge_chunks_staff on knowledge_chunks
  for all to authenticated
  using ((select has_permission('cms.edit')))
  with check ((select has_permission('cms.edit')));

drop policy if exists assistant_messages_staff_read on assistant_messages;
create policy assistant_messages_staff_read on assistant_messages
  for select to authenticated
  using ((select has_permission('cms.view')));

-- Visitors never read the tables directly. This returns only published public
-- notes, ranked by the words in the question, and nothing else.
create or replace function search_public_knowledge(query text)
returns table (title text, content text)
language sql
stable
security definer
set search_path = public
as $$
  select d.title, c.content
  from knowledge_chunks c
  join knowledge_documents d on d.id = c.document_id
  where d.published
    and d.audience = 'public'
    and c.search @@ plainto_tsquery('simple', left(coalesce(query, ''), 300))
  order by ts_rank(c.search, plainto_tsquery('simple', left(coalesce(query, ''), 300))) desc
  limit 6;
$$;

revoke all on function search_public_knowledge(text) from public;
grant execute on function search_public_knowledge(text) to anon, authenticated;
