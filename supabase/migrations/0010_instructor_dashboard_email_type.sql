-- Fix the RPC result contract: auth.users.email is varchar(255), while the RPC returns text.
-- Preserve the existing instructor authorization, grants and learner progress data.

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
    select up.user_id, u.email::text, u.raw_user_meta_data ->> 'full_name', u.created_at,
      up.completed_lessons, up.lab_flags, up.quiz_scores, up.bookmarked_labs,
      up.lab_completed_at, up.completed_code_tasks, up.updated_at
    from public.user_progress up
    join auth.users u on u.id = up.user_id
    order by up.updated_at desc;
end;
$$;

revoke all on function public.instructor_dashboard_progress() from public, anon;
grant execute on function public.instructor_dashboard_progress() to authenticated;
