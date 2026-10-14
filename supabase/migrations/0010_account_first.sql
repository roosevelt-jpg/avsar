-- ============================================================================
-- Account first
--
-- The account is now created at the first step of the application, with a
-- password, and the session starts there. Profile and payment happen while
-- signed in.
--
-- Two consequences for this table.
--
-- First, a candidate row now exists before the profile is filled in, so the
-- four profile columns have to accept null. They are guarded by a constraint
-- instead: a candidate who has paid always has a complete profile. That is the
-- invariant every downstream query already assumes, now stated once here rather
-- than hoped for in a dozen places.
--
-- Second, the people who register and stop are worth something. They are not
-- junk rows to be swept away; they are the top of the funnel. So they are
-- counted and reminded, and only deleted when the reminders have run out.
-- ============================================================================

-- ------------------------------------------------- profile becomes optional ---

alter table candidates alter column sector                drop not null;
alter table candidates alter column years_experience_band drop not null;
alter table candidates alter column english_self_rating   drop not null;
alter table candidates alter column city_state            drop not null;

alter table candidates
  add column if not exists profile_completed_at timestamptz;

-- Backfill: everyone who exists today filled the whole form in one sitting.
update candidates
   set profile_completed_at = coalesce(profile_completed_at, created_at)
 where sector is not null
   and city_state is not null;

/*
  The invariant, at the database rather than in the application.

  Nothing downstream, not the scoring, not the cohort percentiles, not the
  employer search, has a sensible answer for a paid candidate with no sector.
  Rather than add a null check to each of them, make the state impossible.
*/
alter table candidates drop constraint if exists candidates_paid_profile_complete;
alter table candidates add constraint candidates_paid_profile_complete
  check (
    payment_status <> 'paid'
    or (
      sector is not null
      and years_experience_band is not null
      and english_self_rating is not null
      and city_state is not null
    )
  );

-- ---------------------------------------------------- proving the address ---

/*
  Our own verification stamp, not Supabase's.

  Supabase's "Confirm email" setting is all or nothing: with it on, `signUp`
  returns no session and the candidate is stranded until an email arrives in
  the right browser, which is the failure this design exists to avoid. So it is
  off, Supabase auto-confirms, and `auth.users.email_confirmed_at` stops meaning
  anything. This column is what actually records that someone proved the
  address, by following a link we sent to it.

  Nothing in the funnel waits on it. The report does: the report is delivered
  to this address, and sending it to an address nobody proved is the harm.
*/
alter table candidates
  add column if not exists email_verified_at timestamptz;

-- Everyone who signed in by emailed code already proved their address.
update candidates c
   set email_verified_at = u.email_confirmed_at
  from auth.users u
 where c.auth_user_id = u.id
   and c.email_verified_at is null
   and u.email_confirmed_at is not null;

-- ------------------------------------------------------------- the reminders ---

/*
  Someone who opened an account and stopped is a lead, not litter.

  Counted so the reminders cannot run away: three at most, and the count is on
  the row rather than in a job's memory, so a retried job cannot send a fourth.
  `unsubscribed_at` is honoured before anything is sent.
*/
alter table candidates
  add column if not exists reminder_count   smallint not null default 0,
  add column if not exists last_reminder_at timestamptz,
  add column if not exists unsubscribed_at  timestamptz;

/*
  The working set for the reminder job and for the funnel view: registered,
  never paid. Partial, because the paid rows are the large majority and are
  never of interest here.
*/
create index if not exists candidates_unpaid_idx
  on candidates (created_at)
  where payment_status <> 'paid';

/*
  The funnel, in the vocabulary the business already uses.

  `mql` is someone who opened an account. `sql` is someone who paid to be
  assessed: they have put money down, which is a stronger qualification signal
  than anything a form can collect.
*/
create or replace view candidate_lifecycle
with (security_invoker = true)
as
select
  c.id,
  c.cohort_id,
  c.full_name,
  c.email,
  c.phone,
  c.position,
  c.locale,
  c.created_at,
  c.profile_completed_at,
  c.email_verified_at,
  c.payment_status,
  c.reminder_count,
  c.last_reminder_at,
  c.unsubscribed_at,
  case
    when c.payment_status = 'paid'          then 'sql'
    when c.profile_completed_at is not null then 'mql_profiled'
    else                                         'mql_registered'
  end as lifecycle_stage
from candidates c;

comment on view candidate_lifecycle is
  'Signup funnel by stage. security_invoker, so the caller''s RLS applies: '
  'staff see every row, a candidate sees only their own.';
