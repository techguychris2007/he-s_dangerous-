import { supabase } from './supabaseClient';

export interface LearnerProgressRow {
  userId: string;
  email: string;
  fullName: string | null;
  accountCreatedAt: string;
  completedLessons: Record<string, boolean>;
  labFlags: Record<string, string[]>;
  quizScores: Record<string, number>;
  bookmarkedLabs: Record<string, boolean>;
  labCompletedAt: Record<string, number>;
  completedCodeTasks: Record<string, boolean>;
  updatedAt: string;
}

interface RpcRow {
  user_id: string;
  email: string;
  full_name: string | null;
  account_created_at: string;
  completed_lessons: Record<string, boolean>;
  lab_flags: Record<string, string[]>;
  quiz_scores: Record<string, number>;
  bookmarked_labs: Record<string, boolean>;
  lab_completed_at: Record<string, number>;
  completed_code_tasks: Record<string, boolean>;
  updated_at: string;
}

/** Calls the `instructor_dashboard_progress()` RPC (see supabase/migrations/0003_instructor_dashboard.sql).
 *  Returns null on any failure — wrong account, migration not yet run, offline — so the page can show
 *  a clear message instead of a raw Supabase error. The real access control lives server-side in the
 *  function itself; this call would simply fail for anyone who isn't the instructor. */
export async function fetchAllLearnerProgress(): Promise<LearnerProgressRow[] | null> {
  const { data, error } = await supabase.rpc('instructor_dashboard_progress');
  if (error || !data) return null;
  return (data as RpcRow[]).map((r) => ({
    userId: r.user_id,
    email: r.email,
    fullName: r.full_name,
    accountCreatedAt: r.account_created_at,
    completedLessons: r.completed_lessons ?? {},
    labFlags: r.lab_flags ?? {},
    quizScores: r.quiz_scores ?? {},
    bookmarkedLabs: r.bookmarked_labs ?? {},
    labCompletedAt: r.lab_completed_at ?? {},
    completedCodeTasks: r.completed_code_tasks ?? {},
    updatedAt: r.updated_at,
  }));
}
