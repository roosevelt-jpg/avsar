-- ============================================================================
-- 0038: optional expected start date for the job-detail Key Facts strip
--
-- The Lisbon Restaurant Service Opportunity mockup shows "Expected Start Date"
-- beside the deadline and openings. Nullable so existing postings stay valid.
-- ============================================================================

alter table job_postings add column if not exists expected_start_on date;
