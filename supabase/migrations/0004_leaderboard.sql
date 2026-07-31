-- Run this once in the Supabase SQL editor, after 0001-0003. Adds the opt-in flag + read RPC that
-- power a real cross-learner leaderboard (the old LeaderboardPage claimed this wasn't possible,
-- which was true before this account had any cross-user infrastructure — it isn't true anymore).
--
-- Consent model: a learner's row is only ever visible to other learners via leaderboard_entries()
-- if they've explicitly flipped leaderboard_opt_in to true from their own Profile/Leaderboard page.
-- Default is false, so nobody appears until they choose to.

alter table public.user_progress
  add column if not exists leaderboard_opt_in boolean not null default false;

-- SECURITY DEFINER so it can read auth.users for a display name (regular authenticated clients
-- cannot query auth.users at all), but unlike instructor_dashboard_progress() this one is meant to
-- be callable by every learner — access control here is the leaderboard_opt_in filter itself, not a
-- caller-identity check. Only user_id, a display name, and the two jsonb fields actually needed to
-- compute "labs completed" / "points" are returned — never email, quiz scores, bookmarks, or any of
-- the Code Portal learning-signal fields.
create or replace function public.leaderboard_entries()
returns table (
  user_id uuid,
  display_name text,
  lab_flags jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      up.user_id,
      coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)) as display_name,
      up.lab_flags
    from public.user_progress up
    join auth.users u on u.id = up.user_id
    where up.leaderboard_opt_in = true;
end;
$$;

revoke all on function public.leaderboard_entries() from public;
grant execute on function public.leaderboard_entries() to authenticated;
