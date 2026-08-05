-- Run this once in the Supabase SQL editor, after 0001-0005. Adds real per-lab ratings: a 1-5 star
-- score plus an optional "was the difficulty label accurate" signal, the same kind of community
-- quality signal TryHackMe-style platforms surface per room and this platform previously had no
-- equivalent of at all.
--
-- One row per (user, lab) — a re-rating overwrites the previous one (upsert), it doesn't accumulate
-- duplicates. RLS: a learner can insert/update only their own row. Reading individual rows is scoped
-- to your own (so nobody's identity is exposed alongside their rating); the public-facing aggregate
-- (average + count per lab, no user identity attached at all) is served by lab_rating_summary()
-- below, the same SECURITY DEFINER aggregate-RPC shape leaderboard_entries() already established.

create table if not exists public.lab_ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  lab_id text not null,
  rating smallint not null check (rating between 1 and 5),
  difficulty_feedback text check (difficulty_feedback in ('too_easy', 'just_right', 'too_hard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lab_id)
);

alter table public.lab_ratings enable row level security;

drop policy if exists "select own lab rating" on public.lab_ratings;
create policy "select own lab rating"
  on public.lab_ratings for select
  using (auth.uid() = user_id);

drop policy if exists "insert own lab rating" on public.lab_ratings;
create policy "insert own lab rating"
  on public.lab_ratings for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own lab rating" on public.lab_ratings;
create policy "update own lab rating"
  on public.lab_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists lab_ratings_lab_id_idx on public.lab_ratings (lab_id);

-- Public aggregate only — never returns user_id or any per-user row, so every learner can safely
-- call this regardless of whose ratings are behind the numbers.
create or replace function public.lab_rating_summary()
returns table (
  lab_id text,
  avg_rating numeric,
  rating_count bigint,
  too_easy_count bigint,
  just_right_count bigint,
  too_hard_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
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
$$;

revoke all on function public.lab_rating_summary() from public;
grant execute on function public.lab_rating_summary() to authenticated;
