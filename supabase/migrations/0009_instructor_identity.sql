-- Apply after 0008. Only the confirmed account below may access staff progress data.
-- Trusted app metadata cannot be written by auth.updateUser()/ordinary learners.
-- If the account does not exist yet, create and confirm it, then re-run this migration.
-- The owner must refresh their session/sign in again after application.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) ||
  jsonb_build_object('darkworld_username', 'chrisb', 'darkworld_role', 'instructor')
where lower(email) = 'techguychris2007@gmail.com'
  and email_confirmed_at is not null
  and coalesce(is_anonymous, false) = false;

create or replace function public.instructor_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and lower(u.email) = 'techguychris2007@gmail.com'
      and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false
      and u.raw_app_meta_data ->> 'darkworld_username' = 'chrisb'
      and u.raw_app_meta_data ->> 'darkworld_role' in ('admin', 'instructor')
  );
$$;

revoke all on function public.instructor_access() from public, anon;
grant execute on function public.instructor_access() to authenticated;

create or replace function public.instructor_dashboard_progress()
returns table (
  user_id uuid, email text, full_name text, account_created_at timestamptz,
  completed_lessons jsonb, lab_flags jsonb, quiz_scores jsonb,
  bookmarked_labs jsonb, lab_completed_at jsonb, completed_code_tasks jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.instructor_access() then
    raise exception 'Instructor access is restricted to the designated account.' using errcode = '42501';
  end if;
  return query
    select up.user_id, u.email, u.raw_user_meta_data ->> 'full_name', u.created_at,
      up.completed_lessons, up.lab_flags, up.quiz_scores, up.bookmarked_labs,
      up.lab_completed_at, up.completed_code_tasks, up.updated_at
    from public.user_progress up
    join auth.users u on u.id = up.user_id
    order by up.updated_at desc;
end;
$$;

revoke all on function public.instructor_dashboard_progress() from public, anon;
grant execute on function public.instructor_dashboard_progress() to authenticated;
