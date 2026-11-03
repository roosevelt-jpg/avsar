-- ============================================================================
-- 0036 - Employer registration intake
--
-- Multi-step /employers/register submissions before an employer account
-- exists. Staff read them in the inbox via a linked leads row; the full
-- packet lives here so company size, industry and hiring notes are not
-- stuffed into the free-text message. Public writes go through the
-- service role in the API only (same pattern as leads).
--
-- Re-runnable.
-- ============================================================================

create table if not exists employer_intake_submissions (
  id                 uuid primary key default gen_random_uuid(),
  status             text not null default 'pending'
                     check (status in ('pending', 'reviewing', 'invited', 'declined', 'converted')),
  company_name       text not null check (length(company_name) between 1 and 160),
  industry           text check (industry is null or length(industry) <= 120),
  country            text check (country is null or length(country) <= 80),
  city               text check (city is null or length(city) <= 120),
  website            text check (website is null or length(website) <= 300),
  company_size       text check (company_size is null or length(company_size) <= 80),
  contact_full_name  text not null check (length(contact_full_name) between 1 and 120),
  contact_job_title  text check (contact_job_title is null or length(contact_job_title) <= 120),
  contact_email      text not null check (length(contact_email) between 3 and 254),
  contact_phone      text check (contact_phone is null or contact_phone ~ '^\+[1-9][0-9]{6,14}$'),
  whatsapp_ok        boolean not null default false,
  role_title         text check (role_title is null or length(role_title) <= 160),
  openings           int check (openings is null or openings between 1 and 500),
  role_city          text check (role_city is null or length(role_city) <= 120),
  employment_type    text check (employment_type is null or length(employment_type) <= 40),
  timeline           text check (timeline is null or length(timeline) <= 120),
  notes              text check (notes is null or length(notes) <= 4000),
  locale             text,
  lead_id            uuid references leads (id) on delete set null,
  employer_id        uuid references employers (id) on delete set null,
  converted_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists employer_intake_status_idx
  on employer_intake_submissions (status, created_at desc);

create index if not exists employer_intake_email_idx
  on employer_intake_submissions (lower(contact_email));

drop trigger if exists employer_intake_touch on employer_intake_submissions;
create trigger employer_intake_touch before update on employer_intake_submissions
  for each row execute function touch_updated_at();

alter table employer_intake_submissions enable row level security;

drop policy if exists employer_intake_staff_read on employer_intake_submissions;
create policy employer_intake_staff_read on employer_intake_submissions
  for select to authenticated
  using (
    (select has_permission('leads.manage'))
    or (select has_permission('employers.manage'))
  );
