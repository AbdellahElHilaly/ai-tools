create table if not exists public.smith_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  brief text not null default '' check (char_length(brief) <= 500),
  header_prompt text not null check (char_length(trim(header_prompt)) between 10 and 8000),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 500),
  allowed_languages text[] not null default array['en']::text[] check (cardinality(allowed_languages) between 1 and 8),
  preferred_language text not null default 'en' check (char_length(preferred_language) between 2 and 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (preferred_language = any(allowed_languages))
);

create table if not exists public.smith_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.smith_characters(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(trim(title)) between 1 and 120),
  language text not null check (char_length(language) between 2 and 16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.smith_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.smith_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(trim(content)) between 1 and 20000),
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists smith_characters_user_updated_idx on public.smith_characters (user_id, updated_at desc);
create index if not exists smith_sessions_user_updated_idx on public.smith_sessions (user_id, updated_at desc);
create index if not exists smith_sessions_character_idx on public.smith_sessions (character_id, updated_at desc);
create index if not exists smith_messages_session_created_idx on public.smith_messages (session_id, created_at asc);

drop trigger if exists smith_characters_set_updated_at on public.smith_characters;
create trigger smith_characters_set_updated_at before update on public.smith_characters
for each row execute function private.set_updated_at();
drop trigger if exists smith_sessions_set_updated_at on public.smith_sessions;
create trigger smith_sessions_set_updated_at before update on public.smith_sessions
for each row execute function private.set_updated_at();
drop trigger if exists smith_messages_set_updated_at on public.smith_messages;
create trigger smith_messages_set_updated_at before update on public.smith_messages
for each row execute function private.set_updated_at();

alter table public.smith_characters enable row level security;
alter table public.smith_sessions enable row level security;
alter table public.smith_messages enable row level security;

revoke all on table public.smith_characters from anon, authenticated;
revoke all on table public.smith_sessions from anon, authenticated;
revoke all on table public.smith_messages from anon, authenticated;
grant select, insert, update, delete on table public.smith_characters to authenticated;
grant select, insert, update, delete on table public.smith_sessions to authenticated;
grant select, insert, update, delete on table public.smith_messages to authenticated;

create policy "users_manage_own_smith_characters" on public.smith_characters for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "users_manage_own_smith_sessions" on public.smith_sessions for all to authenticated
using (
  (select auth.uid()) = user_id and exists (
    select 1 from public.smith_characters character
    where character.id = character_id and character.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.smith_characters character
    where character.id = character_id and character.user_id = (select auth.uid())
  )
);

create policy "users_manage_own_smith_messages" on public.smith_messages for all to authenticated
using (
  (select auth.uid()) = user_id and exists (
    select 1 from public.smith_sessions session
    where session.id = session_id and session.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.smith_sessions session
    where session.id = session_id and session.user_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('smith-character-avatars', 'smith-character-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "public_read_smith_character_avatars" on storage.objects for select to public
using (bucket_id = 'smith-character-avatars');
create policy "users_upload_own_smith_character_avatars" on storage.objects for insert to authenticated
with check (bucket_id = 'smith-character-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users_update_own_smith_character_avatars" on storage.objects for update to authenticated
using (bucket_id = 'smith-character-avatars' and owner_id = (select auth.uid())::text)
with check (bucket_id = 'smith-character-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users_delete_own_smith_character_avatars" on storage.objects for delete to authenticated
using (bucket_id = 'smith-character-avatars' and owner_id = (select auth.uid())::text);

comment on table public.smith_characters is 'User-owned AI personas for the Smith module.';
comment on table public.smith_sessions is 'Chat sessions bound to one Smith character and language.';
comment on table public.smith_messages is 'Editable user and assistant messages in Smith sessions.';