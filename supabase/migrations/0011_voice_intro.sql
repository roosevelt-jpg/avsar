-- ============================================================================
-- Voice introduction
--
-- Forty-five seconds of the candidate saying who they are and what they have
-- done. It is deliberately **not scored**.
--
-- The English section advertised "speaking" and had none, so the obvious move
-- was to add a spoken item and grade it. That was rejected, for three reasons
-- worth writing down because they will come back.
--
-- Grading a transcript measures vocabulary and grammar, which the written items
-- already measure, and misses pronunciation, fluency and hesitation, which is
-- the whole of what a speaking test is for. Speech recognition has documented
-- higher error rates for Indian-accented English, so an automated speaking
-- score in a recruitment decision would systematically mark down exactly the
-- people this product exists to serve, which is both the Annex III case and
-- simply wrong. And `reports.english_certified` is already a generated column
-- that is never true for the internal bank: this schema has always said our own
-- English number is not a certificate, and adding audio to it would not change
-- that, only make it more expensive to defend.
--
-- So the recording goes to the employer, not to a model. A hotel manager
-- listening to thirty seconds learns more than any letter grade conveys, and
-- judges by their own criteria rather than ours. A real CEFR level, when one is
-- needed, comes from Duolingo or EnglishScore, which `english_source` already
-- anticipates.
-- ============================================================================

create table if not exists candidate_voice_intros (
  candidate_id uuid primary key references candidates (id) on delete cascade,

  storage_path text not null,
  mime_type    text not null,
  /* Recorded by the browser. Used to show the length before playing and to
     reject a clip that is empty or far too long. */
  duration_seconds smallint not null check (duration_seconds between 1 and 120),
  bytes        integer not null,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table candidate_voice_intros enable row level security;

-- Theirs: record it, replace it, delete it.
create policy voice_self_select on candidate_voice_intros
  for select to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

create policy voice_self_write on candidate_voice_intros
  for insert to authenticated
  with check (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

create policy voice_self_update on candidate_voice_intros
  for update to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())))
  with check (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

create policy voice_self_delete on candidate_voice_intros
  for delete to authenticated
  using (candidate_id in (select id from candidates where auth_user_id = (select auth.uid())));

create policy voice_staff_select on candidate_voice_intros
  for select to authenticated
  using ((select is_staff()));

/*
  An employer hears it on the same terms they see anything else: the candidate
  has paid, and has not hidden themselves from employers. The visibility toggle
  on the dashboard therefore silences the recording too, which is what a
  candidate who switches it off expects it to mean.
*/
create policy voice_employer_select on candidate_voice_intros
  for select to authenticated
  using (
    (select current_employer_id()) is not null
    and candidate_id in (
      select id from candidates
       where visible_to_employers
         and payment_status = 'paid'
    )
  );

-- ------------------------------------------------------------------ storage ---

insert into storage.buckets (id, name, public)
values ('voice-intros', 'voice-intros', false)
on conflict (id) do nothing;

/*
  Same rule as the CV bucket: the first path segment is the candidate id, and
  the path is the authorisation boundary. The upload route builds it from the
  session and never from anything the browser sends, because a client that can
  influence the path can write into someone else's folder.
*/
drop policy if exists voice_upload_own on storage.objects;
create policy voice_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'voice-intros'
    and (storage.foldername(name))[1] in (
      select id::text from candidates where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists voice_read_own on storage.objects;
create policy voice_read_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'voice-intros'
    and (storage.foldername(name))[1] in (
      select id::text from candidates where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists voice_delete_own on storage.objects;
create policy voice_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'voice-intros'
    and (storage.foldername(name))[1] in (
      select id::text from candidates where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists voice_read_staff on storage.objects;
create policy voice_read_staff on storage.objects
  for select to authenticated
  using (bucket_id = 'voice-intros' and (select is_staff()));

-- -------------------------------------------------------------- talent pool ---

/*
  Surface it in the search, so an employer can tell at a glance who they can
  hear before clicking. Only whether one exists: the recording itself is served
  by its own route, which re-checks who is asking.

  The view is `security_invoker`, so this exposes nothing the caller could not
  already read.
*/
drop view if exists talent_pool;

create view talent_pool
with (security_invoker = true) as
select
  c.id,
  c.full_name,
  c.city_state,
  c.sector,
  c.position,
  c.visible_to_employers,
  r.english_cefr,
  r.english_rank,
  r.english_source,
  (r.english_certified and (r.english_expires_at is null or r.english_expires_at > now()))
    as english_certified,
  r.overall_score,
  case c.years_experience_band
    when 0 then 0 when 1 then 2 when 2 then 4 else 6
  end as years_experience,
  (v.candidate_id is not null) as has_voice_intro
from candidates c
join reports r on r.candidate_id = c.id
left join candidate_voice_intros v on v.candidate_id = c.id
where c.payment_status = 'paid';
