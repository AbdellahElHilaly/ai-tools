create schema if not exists private;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  prompt text not null check (char_length(prompt) between 5 and 1200),
  description text not null default '',
  plan jsonb not null default '{"levels":[]}'::jsonb check (jsonb_typeof(plan) = 'object'),
  current_session jsonb not null default '{}'::jsonb check (jsonb_typeof(current_session) = 'object'),
  active_level_index integer not null default 0 check (active_level_index >= 0),
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'archived')),
  is_saved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quizzes_user_updated_idx on public.quizzes (user_id, updated_at desc);

create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quizzes_set_updated_at on public.quizzes;
create trigger quizzes_set_updated_at before update on public.quizzes
for each row execute function private.set_updated_at();

drop trigger if exists ai_daily_usage_set_updated_at on public.ai_daily_usage;
create trigger ai_daily_usage_set_updated_at before update on public.ai_daily_usage
for each row execute function private.set_updated_at();

create or replace function public.consume_ai_quota(target_user uuid, daily_limit integer default 50)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  if target_user is null or daily_limit < 1 or daily_limit > 200 then
    return false;
  end if;

  insert into public.ai_daily_usage (user_id, usage_date, request_count)
  values (target_user, current_date, 1)
  on conflict (user_id, usage_date)
  do update set request_count = public.ai_daily_usage.request_count + 1
  where public.ai_daily_usage.request_count < daily_limit
  returning true into allowed;

  return coalesce(allowed, false);
end;
$$;

alter table public.quizzes enable row level security;
alter table public.ai_daily_usage enable row level security;

revoke all on table public.quizzes from anon, authenticated;
revoke all on table public.ai_daily_usage from anon, authenticated;
grant select, insert, update, delete on table public.quizzes to authenticated;
grant select on table public.ai_daily_usage to authenticated;

drop policy if exists "users_select_own_quizzes" on public.quizzes;
create policy "users_select_own_quizzes" on public.quizzes for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users_insert_own_quizzes" on public.quizzes;
create policy "users_insert_own_quizzes" on public.quizzes for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "users_update_own_quizzes" on public.quizzes;
create policy "users_update_own_quizzes" on public.quizzes for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "users_delete_own_quizzes" on public.quizzes;
create policy "users_delete_own_quizzes" on public.quizzes for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "users_select_own_usage" on public.ai_daily_usage;
create policy "users_select_own_usage" on public.ai_daily_usage for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on function public.consume_ai_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, integer) to service_role;

comment on function public.consume_ai_quota(uuid, integer) is 'Server-only atomic per-user daily AI request quota.';
