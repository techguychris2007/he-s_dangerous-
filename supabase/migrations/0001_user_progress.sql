-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query) for
-- https://rbkqqwmqdzgnpnhkwomg.supabase.co. It creates the single table DarkWorld syncs
-- learner progress into, one row per account, guarded by Row Level Security so a user can
-- only ever read or write their own row (the anon key alone can never bypass this).

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  completed_lessons jsonb not null default '{}'::jsonb,
  lab_flags jsonb not null default '{}'::jsonb,
  quiz_scores jsonb not null default '{}'::jsonb,
  bookmarked_labs jsonb not null default '{}'::jsonb,
  lab_completed_at jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "select own progress" on public.user_progress;
create policy "select own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

drop policy if exists "insert own progress" on public.user_progress;
create policy "insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own progress" on public.user_progress;
create policy "update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
