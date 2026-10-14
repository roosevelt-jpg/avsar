-- ============================================================================
-- 0015 - Live console dashboard
--
-- The dashboard subscribes to Supabase Realtime so its numbers move as
-- candidates apply and pay. Realtime delivers a change only to subscribers
-- whose RLS lets them read the row, so:
--
--   1. staff with payments.view get a read policy on payments (they had none:
--      the console read payments through the service role only), and
--   2. the four tables are added to the supabase_realtime publication.
--
-- Candidates keep seeing only their own rows; nothing here widens their access.
-- Re-runnable.
-- ============================================================================

drop policy if exists payments_staff_read on payments;
create policy payments_staff_read on payments
  for select to authenticated using ((select has_permission('payments.view')));

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['applications', 'candidates', 'payments', 'job_postings'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Speeds up the dashboard's date-range reads.
create index if not exists candidates_created_idx on candidates (created_at);
create index if not exists payments_paid_at_idx on payments (paid_at) where status = 'paid';
create index if not exists applications_created_idx on applications (created_at);
