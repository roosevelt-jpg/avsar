-- 0035: the homepage employer strip.
--
-- Every employer is on it, so a company appears when an admin adds one or
-- when that company is created at signup. Nothing else about the employer
-- is public: the function returns the name and the logo path only. VAT,
-- contacts and vetting stay on the table, behind the existing policies.
--
-- Re-runnable.

alter table employers add column if not exists logo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('employer-logos', 'employer-logos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create or replace function public_employer_marks()
returns table (id uuid, name text, logo_path text)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.name, e.logo_path
  from employers e
  order by e.created_at asc
$$;

revoke all on function public_employer_marks() from public;
grant execute on function public_employer_marks() to anon, authenticated;
