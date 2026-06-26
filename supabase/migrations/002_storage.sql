-- ============================================================================
-- Feynman Challenge — Storage: audio recordings
-- Private bucket `recordings`. Files live at: {user_id}/{challenge_id}/{uuid}.{ext}
-- RLS on storage.objects restricts each user to their own top-level folder.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

-- INSERT: user may upload only into their own {user_id}/ prefix.
drop policy if exists "Users can upload own recordings" on storage.objects;
create policy "Users can upload own recordings"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- SELECT: user may read only their own recordings.
drop policy if exists "Users can read own recordings" on storage.objects;
create policy "Users can read own recordings"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- DELETE: user may delete only their own recordings (used for cleanup/decay).
drop policy if exists "Users can delete own recordings" on storage.objects;
create policy "Users can delete own recordings"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
