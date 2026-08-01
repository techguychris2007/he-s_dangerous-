import { supabase } from './supabaseClient';
import type { SyncableProgress } from '../state/progressStore';

interface UserProgressRow {
  completed_lessons: Record<string, boolean>;
  lab_flags: Record<string, string[]>;
  quiz_scores: Record<string, number>;
  bookmarked_labs: Record<string, boolean>;
  lab_completed_at: Record<string, number>;
  completed_code_tasks: Record<string, boolean>;
  leaderboard_opt_in: boolean;
}

/** Fetches the account's remote progress snapshot. Returns null on any failure (offline, table not
 *  yet migrated, RLS denial) — callers treat that as "nothing to merge" rather than an error state. */
export async function pullProgress(userId: string): Promise<Partial<SyncableProgress> | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('completed_lessons, lab_flags, quiz_scores, bookmarked_labs, lab_completed_at, completed_code_tasks, leaderboard_opt_in')
    .eq('user_id', userId)
    .maybeSingle<UserProgressRow>();

  if (error || !data) return null;
  return {
    completedLessons: data.completed_lessons ?? {},
    labFlags: data.lab_flags ?? {},
    quizScores: data.quiz_scores ?? {},
    bookmarkedLabs: data.bookmarked_labs ?? {},
    labCompletedAt: data.lab_completed_at ?? {},
    completedCodeTasks: data.completed_code_tasks ?? {},
    leaderboardOptIn: data.leaderboard_opt_in ?? false,
  };
}

/** Upserts the full local snapshot to the account's row. Returns false on any failure (offline, RLS,
 *  missing table, expired session) without throwing — callers decide whether/how to retry. */
export async function pushProgress(userId: string, progress: SyncableProgress): Promise<boolean> {
  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId,
    completed_lessons: progress.completedLessons,
    lab_flags: progress.labFlags,
    quiz_scores: progress.quizScores,
    bookmarked_labs: progress.bookmarkedLabs,
    lab_completed_at: progress.labCompletedAt,
    completed_code_tasks: progress.completedCodeTasks,
    leaderboard_opt_in: progress.leaderboardOptIn,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

/** Same as pushProgress, but retries a couple of times before giving up. pushProgress's result used
 *  to just be discarded at every call site — fine for a genuinely offline device (the next local
 *  change or the `online` event naturally retries with then-current state), but not for an
 *  auth session whose access token expired mid-use: the browser is still "online" so nothing else
 *  would ever retry it, and if the learner doesn't happen to change anything else before closing the
 *  tab, that push — possibly a just-completed lab — was lost for good with zero signal anything went
 *  wrong. A short delay between attempts gives supabase-js's own background token refresh a real
 *  chance to have completed by the next try. */
export async function pushProgressWithRetry(
  userId: string,
  progress: SyncableProgress,
  retries = 2,
  delayMs = 4000,
): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (await pushProgress(userId, progress)) return true;
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}
