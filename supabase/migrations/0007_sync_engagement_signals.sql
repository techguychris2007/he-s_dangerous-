-- Run this once in the Supabase SQL editor, after 0001-0006. Promotes the last device-local-only
-- progress signals — activity streak dates and Code Portal attempt/hint/solution-reveal counters —
-- to real synced columns, so a learner's streak, achievements, and Code Portal stats follow their
-- account to any device instead of resetting on every new browser. Safe to run on an existing table:
-- it only adds columns with defaults.

alter table public.user_progress
  add column if not exists activity_dates jsonb not null default '[]'::jsonb,
  add column if not exists code_task_attempts jsonb not null default '{}'::jsonb,
  add column if not exists code_task_hints_used jsonb not null default '{}'::jsonb,
  add column if not exists code_task_solution_revealed jsonb not null default '{}'::jsonb;
