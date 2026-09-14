alter table public.quizzes
add column if not exists progress_by_level jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quizzes_progress_by_level_object'
      and conrelid = 'public.quizzes'::regclass
  ) then
    alter table public.quizzes
    add constraint quizzes_progress_by_level_object
    check (jsonb_typeof(progress_by_level) = 'object');
  end if;
end $$;

update public.quizzes
set progress_by_level = jsonb_build_object(current_session->>'levelId', current_session)
where current_session ? 'levelId'
  and current_session->>'levelId' <> ''
  and progress_by_level = '{}'::jsonb;

create or replace function public.refund_ai_quota(target_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_daily_usage
  set request_count = greatest(request_count - 1, 0)
  where user_id = target_user
    and usage_date = current_date;
$$;

revoke all on function public.refund_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.refund_ai_quota(uuid) to service_role;

comment on function public.refund_ai_quota(uuid) is 'Server-only rollback for a reserved AI quota when the provider request fails.';
