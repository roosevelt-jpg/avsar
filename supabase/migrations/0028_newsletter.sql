-- ============================================================================
-- 0028: email sign-ups from the site footer.
--
-- One row per address. Written only by /api/subscribe with the service role,
-- after a rate limit, so there is no insert policy. Staff with the CRM
-- permission (leads.manage) can read the list. Unsubscribing sets
-- unsubscribed_at rather than deleting, so a later sign-up is a deliberate
-- re-subscribe and the history of consent is kept.
--
-- last_alert_sent_at is stamped by the weekly job-alerts cron after a digest
-- is accepted by the mailer, so a retried run cannot double-send.
--
-- Re-runnable.
-- ============================================================================

create table if not exists newsletter_subscribers (
  id                uuid primary key default gen_random_uuid(),
  -- Stored lowercased by the API, so a plain unique constraint is enough and
  -- is what the upsert needs to find the existing row.
  email             text not null unique check (length(email) between 3 and 254 and email = lower(email)),
  locale            text check (locale is null or length(locale) <= 8),
  source            text check (source is null or length(source) <= 60),
  subscribed_at     timestamptz not null default now(),
  unsubscribed_at   timestamptz,
  last_alert_sent_at timestamptz
);

-- If an earlier copy of this migration created the table without the stamp,
-- add it without failing a re-run.
alter table newsletter_subscribers add column if not exists last_alert_sent_at timestamptz;

alter table newsletter_subscribers enable row level security;

drop policy if exists newsletter_staff_select on newsletter_subscribers;
create policy newsletter_staff_select on newsletter_subscribers
  for select to authenticated using ((select has_permission('leads.manage')));
