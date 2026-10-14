-- ============================================================================
-- Make the first super admin. Run ONCE, by hand, in the Supabase SQL editor,
-- after migration 0014 and after that person has signed up or been created in
-- Authentication -> Users.
--
-- Replace the email. Everyone after this is invited from /admin/staff.
-- ============================================================================

insert into staff_users (auth_user_id, email, full_name, role, active)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', email), 'super_admin', true
  from auth.users
 where lower(email) = lower('owner@your-company.com')
on conflict (auth_user_id) do update
  set role = 'super_admin', active = true;
