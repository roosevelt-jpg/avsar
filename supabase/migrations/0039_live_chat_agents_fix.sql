-- ============================================================================
-- One paste for a broken partial 0039 run. Creates tables + search function +
-- grants + realtime. Safe to re-run.
-- ============================================================================

create table if not exists chat_agents (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z][a-z0-9-]{1,40}$'),
  display_name    text not null check (length(display_name) between 1 and 80),
  title           text not null default '' check (length(title) <= 120),
  department      text not null default '' check (length(department) <= 80),
  avatar_path     text not null default '' check (length(avatar_path) <= 500),
  system_focus    text not null default '' check (length(system_focus) <= 2000),
  knowledge_tags  text[] not null default '{}',
  sort_order      int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists chat_threads (
  id                uuid primary key default gen_random_uuid(),
  public_key        text not null unique check (length(public_key) between 8 and 80),
  channel           text not null default 'web' check (channel in ('web', 'whatsapp')),
  agent_id          uuid references chat_agents (id) on delete set null,
  assignee_user_id  uuid,
  mode              text not null default 'ai' check (mode in ('ai', 'human', 'closed')),
  visitor_label     text not null default '' check (length(visitor_label) <= 200),
  intake            jsonb not null default '{}'::jsonb,
  needs_human       boolean not null default false,
  last_message_at   timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists chat_threads_needs_human_idx
  on chat_threads (needs_human, last_message_at desc)
  where needs_human = true;

create index if not exists chat_threads_assignee_idx
  on chat_threads (assignee_user_id, last_message_at desc);

create table if not exists staff_presence (
  user_id       uuid primary key,
  online        boolean not null default false,
  display_name  text not null default '' check (length(display_name) <= 120),
  avatar_url    text not null default '' check (length(avatar_url) <= 500),
  last_seen_at  timestamptz not null default now()
);

alter table knowledge_documents
  add column if not exists tags text[] not null default '{}';

alter table assistant_messages
  add column if not exists thread_id uuid references chat_threads (id) on delete set null;

alter table assistant_messages
  add column if not exists agent_id uuid references chat_agents (id) on delete set null;

alter table assistant_messages
  add column if not exists sender_user_id uuid;

do $$
begin
  alter table assistant_messages drop constraint if exists assistant_messages_role_check;
exception when undefined_object then null;
end $$;

alter table assistant_messages
  drop constraint if exists assistant_messages_role_check;

alter table assistant_messages
  add constraint assistant_messages_role_check
  check (role in ('user', 'assistant', 'staff'));

create index if not exists assistant_messages_thread_id_idx
  on assistant_messages (thread_id, created_at);

alter table chat_agents enable row level security;
alter table chat_threads enable row level security;
alter table staff_presence enable row level security;

drop policy if exists chat_agents_staff on chat_agents;
create policy chat_agents_staff on chat_agents
  for all to authenticated
  using ((select has_permission('leads.manage')) or (select has_permission('cms.edit')))
  with check ((select has_permission('leads.manage')) or (select has_permission('cms.edit')));

drop policy if exists chat_agents_public_read on chat_agents;
create policy chat_agents_public_read on chat_agents
  for select to anon, authenticated
  using (active = true);

drop policy if exists chat_threads_staff on chat_threads;
create policy chat_threads_staff on chat_threads
  for all to authenticated
  using ((select has_permission('leads.manage')))
  with check ((select has_permission('leads.manage')));

drop policy if exists staff_presence_staff on staff_presence;
create policy staff_presence_staff on staff_presence
  for all to authenticated
  using ((select is_staff()))
  with check ((select is_staff()));

drop policy if exists staff_presence_public_read on staff_presence;
create policy staff_presence_public_read on staff_presence
  for select to anon, authenticated
  using (online = true and last_seen_at > now() - interval '3 minutes');

insert into chat_agents (slug, display_name, title, department, avatar_path, system_focus, knowledge_tags, sort_order)
values
  (
    'jobs',
    'Mira',
    'Jobs specialist',
    'Jobs',
    '/photos/brand/hero-workers.jpg',
    'Help with open roles, sectors, how to apply, the free skills test, and what employers look for. Gather the visitor''s preferred role, city, and years of experience when missing.',
    array['jobs', 'careers', 'application'],
    10
  ),
  (
    'visa',
    'Arjun',
    'Visa & relocation',
    'Visa',
    '/photos/brand/journey-tram.jpg',
    'Help with visa documents, relocation steps, timelines we publish, and family questions. Never promise a visa outcome. Gather nationality, passport status, and family travelling when missing.',
    array['visa', 'relocation', 'documents'],
    20
  ),
  (
    'payments',
    'Sara',
    'Package & payments',
    'Payments',
    '/photos/brand/employer-handshake.jpg',
    'Explain optional paid reports and what is free. Payment happens only on the website. Never ask for card details or bank transfers in chat. Gather which product they mean when unclear.',
    array['payments', 'pricing', 'package'],
    30
  ),
  (
    'general',
    'Sam',
    'Concierge',
    'General',
    '/photos/brand/hero-hospitality.jpg',
    'General questions about the company, hours, WhatsApp, and how the process works. Route specialised questions toward Jobs, Visa, or Payments when useful. Gather name and preferred contact when missing.',
    array['general', 'company', 'faq'],
    40
  )
on conflict (slug) do nothing;

drop function if exists search_public_knowledge(text);
drop function if exists search_public_knowledge(text, text[]);

create function search_public_knowledge(query text, tag_filter text[] default null)
returns table (title text, content text)
language sql
stable
security definer
set search_path = public
as $$
  with lex as (
    select m[1] as word
    from regexp_matches(
      to_tsvector('simple', left(coalesce(query, ''), 300))::text,
      '''([^'']+)''',
      'g'
    ) as m
    where char_length(m[1]) >= 4
  ),
  tsq as (
    select case
      when (select string_agg(distinct word, ' | ') from lex) is null then null::tsquery
      else to_tsquery('simple', (select string_agg(distinct word, ' | ') from lex))
    end as q
  )
  select d.title, c.content
  from knowledge_chunks c
  join knowledge_documents d on d.id = c.document_id
  cross join tsq
  where d.published
    and d.audience = 'public'
    and tsq.q is not null
    and c.search @@ tsq.q
    and (
      tag_filter is null
      or cardinality(tag_filter) = 0
      or d.tags && tag_filter
      or cardinality(coalesce(d.tags, '{}'::text[])) = 0
    )
  order by
    case
      when tag_filter is not null and cardinality(tag_filter) > 0 and d.tags && tag_filter then 0
      else 1
    end,
    ts_rank(c.search, tsq.q) desc
  limit 6;
$$;

revoke all on function search_public_knowledge(text, text[]) from public;
grant execute on function search_public_knowledge(text, text[]) to anon, authenticated;

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['chat_threads', 'assistant_messages', 'staff_presence']
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

select slug, display_name from chat_agents order by sort_order;
select * from search_public_knowledge('refund package');
