-- The insights page refreshes when the desks change. Realtime only delivers
-- a row the staff member is already allowed to read. family_links stays out
-- of the publication: each row holds the token hash for a private family page.

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array[
    'reports',
    'application_interviews',
    'conversion_signals',
    'leads',
    'legal_reviews',
    'relocation_documents'
  ] loop
    if to_regclass('public.' || t) is not null
       and not exists (
         select 1 from pg_publication_tables
          where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
       ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
