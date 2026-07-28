-- Run this once in the Supabase SQL editor, after 0001_user_progress.sql. Adds the column the new
-- Code Portal (Python/C++/JS practice tasks) needs to sync task-completion state — safe to run even
-- if you've already been using the app for a while, since it only adds a column with a default.

alter table public.user_progress
  add column if not exists completed_code_tasks jsonb not null default '{}'::jsonb;
