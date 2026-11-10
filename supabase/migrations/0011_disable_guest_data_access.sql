-- Registered accounts only. Preserve existing own-row policies and all account/progress records.
create or replace function public.registered_user_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.users u where u.id = auth.uid()
    and coalesce(u.is_anonymous, false) = false
    and (u.banned_until is null or u.banned_until <= now()));
$$;
revoke all on function public.registered_user_access() from public, anon;
grant execute on function public.registered_user_access() to authenticated;

drop policy if exists "registered accounts only" on public.user_progress;
create policy "registered accounts only" on public.user_progress as restrictive for all to authenticated
using ((select public.registered_user_access()))
with check ((select public.registered_user_access()));

drop policy if exists "registered accounts only" on public.feedback;
create policy "registered accounts only" on public.feedback as restrictive for all to authenticated
using ((select public.registered_user_access()))
with check ((select public.registered_user_access()));

drop policy if exists "registered accounts only" on public.lab_ratings;
create policy "registered accounts only" on public.lab_ratings as restrictive for all to authenticated
using ((select public.registered_user_access()))
with check ((select public.registered_user_access()));

drop policy if exists "registered accounts only" on public.lab_comments;
create policy "registered accounts only" on public.lab_comments as restrictive for all to authenticated
using ((select public.registered_user_access()))
with check ((select public.registered_user_access()));

CREATE OR REPLACE FUNCTION public.lab_comments_for_lab(p_lab_id text)
 RETURNS TABLE(id uuid, user_id uuid, display_name text, message text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.registered_user_access() then
    raise exception 'Sign in with a registered account.' using errcode = '42501';
  end if;
  return query
    select
      lc.id,
      lc.user_id,
      coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)) as display_name,
      lc.message,
      lc.created_at
    from public.lab_comments lc
    join auth.users u on u.id = lc.user_id
    where lc.lab_id = p_lab_id
    order by lc.created_at asc;
end;
$function$
;
revoke all on function public.lab_comments_for_lab(text) from public, anon;
grant execute on function public.lab_comments_for_lab(text) to authenticated;

CREATE OR REPLACE FUNCTION public.lab_rating_summary()
 RETURNS TABLE(lab_id text, avg_rating numeric, rating_count bigint, too_easy_count bigint, just_right_count bigint, too_hard_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.registered_user_access() then
    raise exception 'Sign in with a registered account.' using errcode = '42501';
  end if;
  return query
    select
      lr.lab_id,
      round(avg(lr.rating)::numeric, 2) as avg_rating,
      count(*) as rating_count,
      count(*) filter (where lr.difficulty_feedback = 'too_easy') as too_easy_count,
      count(*) filter (where lr.difficulty_feedback = 'just_right') as just_right_count,
      count(*) filter (where lr.difficulty_feedback = 'too_hard') as too_hard_count
    from public.lab_ratings lr
    group by lr.lab_id;
end;
$function$
;
revoke all on function public.lab_rating_summary() from public, anon;
grant execute on function public.lab_rating_summary() to authenticated;

CREATE OR REPLACE FUNCTION public.leaderboard_entries()
 RETURNS TABLE(user_id uuid, display_name text, lab_flags jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.registered_user_access() then
    raise exception 'Sign in with a registered account.' using errcode = '42501';
  end if;
  return query
    select
      up.user_id,
      coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)) as display_name,
      up.lab_flags
    from public.user_progress up
    join auth.users u on u.id = up.user_id
    where up.leaderboard_opt_in = true;
end;
$function$
;
revoke all on function public.leaderboard_entries() from public, anon;
grant execute on function public.leaderboard_entries() to authenticated;

