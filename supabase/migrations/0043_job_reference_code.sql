-- 0043: public job listing codes (shown as "Code: 143736" on the board).
-- Assigned from a sequence so every posting gets a stable public reference
-- without staff inventing one. Staff may override the value in the job form.
-- Re-runnable.

create sequence if not exists job_reference_seq start with 140000 increment by 1;

alter table job_postings
  add column if not exists reference_code text;

update job_postings
set reference_code = nextval('job_reference_seq')::text
where reference_code is null or btrim(reference_code) = '';

alter table job_postings
  alter column reference_code set default nextval('job_reference_seq')::text;

create unique index if not exists job_postings_reference_code_uidx
  on job_postings (reference_code);

create or replace function job_assign_reference_code()
returns trigger
language plpgsql
as $$
begin
  if new.reference_code is null or btrim(new.reference_code) = '' then
    new.reference_code := nextval('job_reference_seq')::text;
  else
    new.reference_code := btrim(new.reference_code);
  end if;
  return new;
end;
$$;

drop trigger if exists job_postings_reference_code on job_postings;
create trigger job_postings_reference_code
  before insert or update on job_postings
  for each row execute function job_assign_reference_code();
