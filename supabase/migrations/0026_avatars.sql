-- ============================================================================
-- 0026: profile images for console users (staff and employers).
--
-- The image URL lives in the Supabase Auth user's metadata (avatar_url), so no
-- table changes. Files are written only by /api/account/avatar with the
-- service role, after it has read the user from the session; there are no
-- insert policies for anyone else. The bucket is public because a face in a
-- header is not sensitive and signed URLs would expire mid-session.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
