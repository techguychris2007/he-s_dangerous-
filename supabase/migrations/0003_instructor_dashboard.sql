-- Run this once in the Supabase SQL editor, after 0001 and 0002. Adds a single RPC function that
-- lets exactly one hardcoded instructor account read every learner's progress, joined with their
-- email/display name from auth.users, for the Instructor Dashboard page.
--
-- Deliberately NOT done by loosening the user_progress RLS policies (that would risk any future
-- policy mistake leaking every learner's progress to every other learner). Instead this is a
-- SECURITY DEFINER function: it runs with elevated privileges (so it CAN read auth.users, which
-- regular authenticated clients cannot), but the very first thing it does is check the caller's own
-- auth.uid() against the instructor's email and raises an exception for anyone else — so calling it
-- as a non-instructor returns nothing, no matter what.
--
-- If the instructor account ever changes, update the email string below and re-run this file.

create or replace function public.instructor_dashboard_progress()
returns table (
  user_id uuid,
  email text,
  full_name text,
  account_created_at timestamptz,
  completed_lessons jsonb,
  lab_flags jsonb,
  quiz_scores jsonb,
  bookmarked_labs jsonb,
  lab_completed_at jsonb,
  completed_code_tasks jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select u.email from auth.users u where u.id = auth.uid()) is distinct from 'techguychris2007@gmail.com' then
    raise exception 'not authorized';
  end if;

  return query
    select
      up.user_id,
      u.email,
      u.raw_user_meta_data ->> 'full_name' as full_name,
      u.created_at as account_created_at,
      up.completed_lessons,
      up.lab_flags,
      up.quiz_scores,
      up.bookmarked_labs,
      up.lab_completed_at,
      up.completed_code_tasks,
      up.updated_at
    from public.user_progress up
    join auth.users u on u.id = up.user_id;
end;
$$;

revoke all on function public.instructor_dashboard_progress() from public;
grant execute on function public.instructor_dashboard_progress() to authenticated;
