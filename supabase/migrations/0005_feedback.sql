-- Run this once in the Supabase SQL editor, after 0001-0004. Adds a real feedback inbox: the
-- platform previously had no way for a learner to report a bug or suggest something back to the
-- team at all (HelpFaqPage was a dead end past its own FAQ list) — this closes that gap.
--
-- Same RLS shape as user_progress: a learner can insert and read only their own submissions.
-- There is deliberately no update/delete policy — feedback is an append-only log, matching how a
-- real support inbox works (you can't edit a ticket after filing it, only file a follow-up).

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('bug', 'suggestion', 'content', 'other')),
  message text not null check (char_length(trim(message)) > 0 and char_length(message) <= 4000),
  page_path text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "insert own feedback" on public.feedback;
create policy "insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "select own feedback" on public.feedback;
create policy "select own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

create index if not exists feedback_user_id_created_at_idx on public.feedback (user_id, created_at desc);
