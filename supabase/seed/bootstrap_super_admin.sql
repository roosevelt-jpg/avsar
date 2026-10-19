-- ============================================================================
-- Make the first super admin. Run ONCE, by hand, in the Supabase SQL editor,
-- after migration 0014 and after that person has signed up or been created in
-- Authentication -> Users.
--
-- The owner named two super admins and no other staff (questionnaire 6.1 and
-- 6.2). Anyone added later is invited from /admin/staff with a narrower role.
-- An address with no account yet is skipped; run this again once they have
-- signed up.
-- ============================================================================

insert into staff_users (auth_user_id, email, full_name, role, active)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', email), 'super_admin', true
  from auth.users
 where lower(email) in ('furkan@smithandadams.com', 'abilio.diz@smithandadams.com')
on conflict (auth_user_id) do update
  set role = 'super_admin', active = true;
