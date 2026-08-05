-- Run this once in the Supabase SQL editor, after 0001-0007. Adds real per-lab discussion threads —
-- the actual "community" gap from the TryHackMe/OverTheWire comparison: ratings say HOW GOOD a lab
-- is, but nothing lets one learner help another stuck on the same step. This is a flat comment list
-- per lab (no threading/replies — deliberately simple, matching the scope of what's actually needed
-- here), not a general-purpose forum.
--
-- Privacy model, distinct from every other table so far: feedback and lab_ratings are private to
-- the submitter (select policy scoped to auth.uid()). Comments are the opposite by design — the
-- point is other learners reading them — so any authenticated user can read any lab's comments, but
-- can only insert/delete their own. Same auth.users-join-for-a-display-name shape as
-- leaderboard_entries(), so email is never exposed, only a display name.

create table if not exists public.lab_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lab_id text not null,
  message text not null check (char_length(trim(message)) > 0 and char_length(message) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.lab_comments enable row level security;

drop policy if exists "read all lab comments" on public.lab_comments;
create policy "read all lab comments"
  on public.lab_comments for select
  to authenticated
  using (true);

drop policy if exists "insert own lab comment" on public.lab_comments;
create policy "insert own lab comment"
  on public.lab_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "delete own lab comment" on public.lab_comments;
create policy "delete own lab comment"
  on public.lab_comments for delete
  using (auth.uid() = user_id);

create index if not exists lab_comments_lab_id_created_at_idx on public.lab_comments (lab_id, created_at desc);

-- SECURITY DEFINER purely to resolve a display name from auth.users (regular authenticated clients
-- cannot query auth.users at all) — access control is still the RLS policy above, this function
-- just adds the one join a plain `select * from lab_comments` couldn't do on its own.
create or replace function public.lab_comments_for_lab(p_lab_id text)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  message text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
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
$$;

revoke all on function public.lab_comments_for_lab(text) from public;
grant execute on function public.lab_comments_for_lab(text) to authenticated;
