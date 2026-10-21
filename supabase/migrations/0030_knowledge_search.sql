-- ============================================================================
-- 0030: find a company note when the question has extra words.
--
-- plainto_tsquery requires every word. "What is the refund window for the
-- package" then misses a note that only says "refund". This matches any
-- word of four characters or more, and the application still refuses to
-- answer when more than one note fits equally well.
--
-- Re-runnable. Requires 0029.
-- ============================================================================

create or replace function search_public_knowledge(query text)
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
  order by ts_rank(c.search, tsq.q) desc
  limit 8;
$$;
