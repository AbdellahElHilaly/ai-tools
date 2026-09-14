create table if not exists public.groq_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  vault_secret_id uuid not null unique,
  key_hint text not null check (char_length(key_hint) between 4 and 24),
  status text not null default 'untested' check (status in ('untested', 'valid', 'invalid')),
  last_tested_at timestamptz,
  last_test_message text check (last_test_message is null or char_length(last_test_message) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists groq_api_keys_user_updated_idx
  on public.groq_api_keys (user_id, updated_at desc);

drop trigger if exists groq_api_keys_set_updated_at on public.groq_api_keys;
create trigger groq_api_keys_set_updated_at before update on public.groq_api_keys
for each row execute function private.set_updated_at();

alter table public.groq_api_keys enable row level security;

-- Key metadata and Vault references are server-only. The frontend talks to the
-- authenticated manage-groq-keys Edge Function and never queries this table.
revoke all on table public.groq_api_keys from public, anon, authenticated;

create or replace function public.save_groq_api_key(
  target_user uuid,
  target_label text,
  target_key text,
  target_hint text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_key_id uuid := gen_random_uuid();
  next_secret_id uuid;
begin
  if target_user is null
    or char_length(trim(target_label)) not between 1 and 40
    or char_length(target_key) not between 20 and 240
    or left(target_key, 4) <> 'gsk_'
    or char_length(target_hint) not between 4 and 24 then
    raise exception 'invalid_groq_key_input';
  end if;

  if (select count(*) from public.groq_api_keys where user_id = target_user) >= 10 then
    raise exception 'groq_key_limit_reached';
  end if;

  select vault.create_secret(
    target_key,
    'groq_' || replace(target_user::text, '-', '') || '_' || replace(next_key_id::text, '-', ''),
    'Groq API key owned by AI Tools user ' || target_user::text
  ) into next_secret_id;

  insert into public.groq_api_keys (id, user_id, label, vault_secret_id, key_hint)
  values (next_key_id, target_user, trim(target_label), next_secret_id, target_hint);

  return next_key_id;
end;
$$;

create or replace function public.read_groq_api_key(target_user uuid, target_key_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select secrets.decrypted_secret
  from public.groq_api_keys as keys
  join vault.decrypted_secrets as secrets on secrets.id = keys.vault_secret_id
  where keys.user_id = target_user and keys.id = target_key_id
  limit 1;
$$;

create or replace function public.read_available_groq_api_keys(target_user uuid)
returns table (key_id uuid, api_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select keys.id, secrets.decrypted_secret
  from public.groq_api_keys as keys
  join vault.decrypted_secrets as secrets on secrets.id = keys.vault_secret_id
  where keys.user_id = target_user and keys.status <> 'invalid'
  order by
    case keys.status when 'valid' then 0 else 1 end,
    keys.last_tested_at desc nulls last,
    keys.updated_at desc
  limit 10;
$$;

create or replace function public.set_groq_api_key_test_result(
  target_user uuid,
  target_key_id uuid,
  target_status text,
  target_message text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_status not in ('valid', 'invalid') then
    return false;
  end if;

  update public.groq_api_keys
  set status = target_status,
      last_tested_at = now(),
      last_test_message = left(target_message, 160)
  where user_id = target_user and id = target_key_id;

  return found;
end;
$$;

create or replace function public.delete_groq_api_key(target_user uuid, target_key_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_id uuid;
begin
  delete from public.groq_api_keys
  where user_id = target_user and id = target_key_id
  returning vault_secret_id into secret_id;

  if secret_id is null then
    return false;
  end if;

  delete from vault.secrets where id = secret_id;
  return true;
end;
$$;

revoke all on function public.save_groq_api_key(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.read_groq_api_key(uuid, uuid) from public, anon, authenticated;
revoke all on function public.read_available_groq_api_keys(uuid) from public, anon, authenticated;
revoke all on function public.set_groq_api_key_test_result(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.delete_groq_api_key(uuid, uuid) from public, anon, authenticated;

grant execute on function public.save_groq_api_key(uuid, text, text, text) to service_role;
grant execute on function public.read_groq_api_key(uuid, uuid) to service_role;
grant execute on function public.read_available_groq_api_keys(uuid) to service_role;
grant execute on function public.set_groq_api_key_test_result(uuid, uuid, text, text) to service_role;
grant execute on function public.delete_groq_api_key(uuid, uuid) to service_role;

comment on table public.groq_api_keys is 'Server-only metadata for per-user Groq keys encrypted in Supabase Vault.';
comment on function public.read_groq_api_key(uuid, uuid) is 'Server-only: decrypts one user-owned Groq key for the Edge Function.';
comment on function public.read_available_groq_api_keys(uuid) is 'Server-only: returns usable user Groq keys in failover order.';
