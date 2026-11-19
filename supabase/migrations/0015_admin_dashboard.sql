-- Apply after 0014. Read-only data for the Admin Dashboard (src/pages/AdminDashboardPage.tsx).
--
-- Same pattern as the instructor dashboard (0009/0010): no RLS policy is loosened. Each function is
-- SECURITY DEFINER so it can read auth.users and every learner's rows, and the first thing it does
-- is call admin_access(), which raises for anyone who is not one of the admin accounts below. The
-- app's route gate (src/lib/adminConfig.ts) only hides the page; this file is what protects the data.
--
-- Admins are fixed by confirmed email address. To change them, edit admin_access() and
-- src/lib/adminConfig.ts together, then re-run this file. Nothing here writes data.

create or replace function public.admin_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and lower(u.email) in ('techguychris2007@gmail.com', 'adjeibenedict010@gmail.com')
      and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false
      and (u.banned_until is null or u.banned_until <= now())
  );
$$;

revoke all on function public.admin_access() from public, anon;
grant execute on function public.admin_access() to authenticated;

-- Every account (including ones that never synced progress), with its progress when it has any.
create or replace function public.admin_accounts()
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed boolean,
  is_anonymous boolean,
  is_banned boolean,
  plan text,
  plan_ends_at timestamptz,
  completed_lessons jsonb,
  lab_flags jsonb,
  quiz_scores jsonb,
  lab_completed_at jsonb,
  completed_code_tasks jsonb,
  activity_dates jsonb,
  leaderboard_opt_in boolean,
  progress_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.admin_access() then
    raise exception 'Admin access is restricted to designated accounts.' using errcode = '42501';
  end if;
  return query
    select
      u.id,
      u.email::text,
      u.raw_user_meta_data ->> 'full_name',
      u.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at is not null,
      coalesce(u.is_anonymous, false),
      u.banned_until is not null and u.banned_until > now(),
      case when e.current_period_end > now() then e.plan end,
      e.current_period_end,
      coalesce(up.completed_lessons, '{}'::jsonb),
      coalesce(up.lab_flags, '{}'::jsonb),
      coalesce(up.quiz_scores, '{}'::jsonb),
      coalesce(up.lab_completed_at, '{}'::jsonb),
      coalesce(up.completed_code_tasks, '{}'::jsonb),
      coalesce(up.activity_dates, '[]'::jsonb),
      coalesce(up.leaderboard_opt_in, false),
      up.updated_at
    from auth.users u
    left join public.user_progress up on up.user_id = u.id
    left join public.billing_entitlements e on e.user_id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_accounts() from public, anon;
grant execute on function public.admin_accounts() to authenticated;

create or replace function public.admin_feedback(p_limit integer default 200)
returns table (
  id uuid,
  user_id uuid,
  email text,
  category text,
  message text,
  page_path text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.admin_access() then
    raise exception 'Admin access is restricted to designated accounts.' using errcode = '42501';
  end if;
  return query
    select f.id, f.user_id, u.email::text, f.category, f.message, f.page_path, f.created_at
    from public.feedback f
    left join auth.users u on u.id = f.user_id
    order by f.created_at desc
    limit least(greatest(coalesce(p_limit, 200), 1), 1000);
end;
$$;

revoke all on function public.admin_feedback(integer) from public, anon;
grant execute on function public.admin_feedback(integer) to authenticated;

create or replace function public.admin_lab_comments(p_limit integer default 200)
returns table (
  id uuid,
  user_id uuid,
  email text,
  lab_id text,
  message text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.admin_access() then
    raise exception 'Admin access is restricted to designated accounts.' using errcode = '42501';
  end if;
  return query
    select c.id, c.user_id, u.email::text, c.lab_id, c.message, c.created_at
    from public.lab_comments c
    left join auth.users u on u.id = c.user_id
    order by c.created_at desc
    limit least(greatest(coalesce(p_limit, 200), 1), 1000);
end;
$$;

revoke all on function public.admin_lab_comments(integer) from public, anon;
grant execute on function public.admin_lab_comments(integer) to authenticated;

-- Per-lab ratings. lab_rating_summary() (0011) already returns this to any registered learner;
-- this copy sits behind the admin check so the dashboard depends only on admin functions.
create or replace function public.admin_lab_ratings()
returns table (
  lab_id text,
  avg_rating numeric,
  rating_count bigint,
  too_easy_count bigint,
  just_right_count bigint,
  too_hard_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.admin_access() then
    raise exception 'Admin access is restricted to designated accounts.' using errcode = '42501';
  end if;
  return query
    select
      lr.lab_id,
      round(avg(lr.rating)::numeric, 2),
      count(*),
      count(*) filter (where lr.difficulty_feedback = 'too_easy'),
      count(*) filter (where lr.difficulty_feedback = 'just_right'),
      count(*) filter (where lr.difficulty_feedback = 'too_hard')
    from public.lab_ratings lr
    group by lr.lab_id;
end;
$$;

revoke all on function public.admin_lab_ratings() from public, anon;
grant execute on function public.admin_lab_ratings() to authenticated;
