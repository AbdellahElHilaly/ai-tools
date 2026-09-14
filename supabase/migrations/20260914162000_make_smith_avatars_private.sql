update storage.buckets
set public = false
where id = 'smith-character-avatars';

drop policy if exists "public_read_smith_character_avatars" on storage.objects;
create policy "users_read_own_smith_character_avatars"
on storage.objects for select to authenticated
using (
  bucket_id = 'smith-character-avatars'
  and owner_id = (select auth.uid())::text
);\n