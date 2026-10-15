-- ============================================================================
-- 0027: staff read candidate data by permission, not by being staff.
--
-- The policies from 0003-0013 let any active staff member read every
-- candidate, their CV, report, voice introduction and career pack. Since 0014
-- staff have roles: a content editor or a finance clerk opening the database
-- directly could still read all of it, even though the console hid the pages.
-- Each read is now tied to the permission the console already checks:
--   candidate records, CVs, reports, voice, career packs -> candidates.view
--   assessment item statistics                           -> cv.review
--   placements and their history                         -> placements.manage
--   shortlists (all employers')                          -> candidates.view
-- Super admins hold '*', so has_permission() is true for them everywhere.
--
-- Re-runnable: each policy is dropped before it is created.
-- ============================================================================

drop policy if exists candidates_staff_select on candidates;
create policy candidates_staff_select on candidates
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists reports_staff_select on reports;
create policy reports_staff_select on reports
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists cv_documents_staff_select on cv_documents;
create policy cv_documents_staff_select on cv_documents
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists cv_assessments_staff_select on cv_assessments;
create policy cv_assessments_staff_select on cv_assessments
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists cv_decisions_staff_select on cv_review_decisions;
create policy cv_decisions_staff_select on cv_review_decisions
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists profiles_staff_select on candidate_profiles;
create policy profiles_staff_select on candidate_profiles
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists experiences_staff_select on candidate_experiences;
create policy experiences_staff_select on candidate_experiences
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists education_staff_select on candidate_education;
create policy education_staff_select on candidate_education
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists voice_staff_select on candidate_voice_intros;
create policy voice_staff_select on candidate_voice_intros
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists career_packs_staff_select on career_packs;
create policy career_packs_staff_select on career_packs
  for select to authenticated using ((select has_permission('candidates.view')));

drop policy if exists item_stats_staff_read on item_stats;
create policy item_stats_staff_read on item_stats
  for select to authenticated using ((select has_permission('cv.review')));

-- Files in storage follow the same rule as the rows that point at them.
drop policy if exists cv_read_staff on storage.objects;
create policy cv_read_staff on storage.objects
  for select to authenticated
  using (bucket_id = 'cvs' and (select has_permission('candidates.view')));

drop policy if exists voice_read_staff on storage.objects;
create policy voice_read_staff on storage.objects
  for select to authenticated
  using (bucket_id = 'voice-intros' and (select has_permission('candidates.view')));

-- Placements and shortlists had no staff policy, so the console pages showed
-- staff nothing. Opened to the permissions that own them.
drop policy if exists placements_staff_select on placements;
create policy placements_staff_select on placements
  for select to authenticated using ((select has_permission('placements.manage')));

drop policy if exists transitions_staff_select on placement_transitions;
create policy transitions_staff_select on placement_transitions
  for select to authenticated using ((select has_permission('placements.manage')));

-- Employer names appear beside placements and shortlists.
drop policy if exists employers_staff_select on employers;
create policy employers_staff_select on employers
  for select to authenticated
  using ((select has_permission('placements.manage')) or (select has_permission('employers.manage')) or (select has_permission('candidates.view')));

drop policy if exists shortlist_staff_select on shortlist_entries;
create policy shortlist_staff_select on shortlist_entries
  for select to authenticated using ((select has_permission('candidates.view')));
