-- ============================================================================
-- 0041: personal AI assistants per staff member.
--
-- Admins can mark a teammate as a personal assistant and attach their WhatsApp
-- number. Visitors see those people in the chat desk; the AI answers in their
-- name, then escalates the thread to that assignee when a human is needed.
-- Re-runnable.
-- ============================================================================

alter table staff_users
  add column if not exists whatsapp text not null default ''
    check (length(whatsapp) <= 20);

alter table staff_users
  add column if not exists personal_assistant boolean not null default false;

create index if not exists staff_users_personal_assistant_idx
  on staff_users (personal_assistant, active)
  where personal_assistant = true and active = true;

-- Public-safe list for the floating chat desk (name + WhatsApp only).
drop function if exists list_personal_assistants();
create function list_personal_assistants()
returns table (
  user_id uuid,
  display_name text,
  title text,
  whatsapp text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.auth_user_id,
    coalesce(nullif(trim(s.full_name), ''), split_part(s.email, '@', 1)),
    coalesce(nullif(trim(r.name), ''), 'Recruiter'),
    s.whatsapp,
    coalesce(p.avatar_url, '')
  from staff_users s
  left join roles r on r.key = s.role
  left join staff_presence p on p.user_id = s.auth_user_id
  where s.active = true
    and s.personal_assistant = true
  order by coalesce(nullif(trim(s.full_name), ''), s.email);
$$;

revoke all on function list_personal_assistants() from public;
grant execute on function list_personal_assistants() to anon, authenticated;
