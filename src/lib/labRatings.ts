import { supabase } from './supabaseClient';

export type DifficultyFeedback = 'too_easy' | 'just_right' | 'too_hard';

export interface LabRatingSummary {
  avgRating: number;
  ratingCount: number;
  tooEasyCount: number;
  justRightCount: number;
  tooHardCount: number;
}

interface SummaryRow {
  lab_id: string;
  avg_rating: number;
  rating_count: number;
  too_easy_count: number;
  just_right_count: number;
  too_hard_count: number;
}

/** One batch call for the whole catalog, not one call per lab card — mirrors fetchLeaderboard()'s
 *  "single RPC, map client-side" shape. Returns null on any failure (migration not yet run, offline)
 *  so callers can just omit rating badges instead of showing an error. */
export async function fetchLabRatingSummaries(): Promise<Record<string, LabRatingSummary> | null> {
  const { data, error } = await supabase.rpc('lab_rating_summary');
  if (error || !data) return null;
  const out: Record<string, LabRatingSummary> = {};
  for (const r of data as SummaryRow[]) {
    out[r.lab_id] = {
      avgRating: r.avg_rating,
      ratingCount: r.rating_count,
      tooEasyCount: r.too_easy_count,
      justRightCount: r.just_right_count,
      tooHardCount: r.too_hard_count,
    };
  }
  return out;
}

/** The caller's own existing rating for one lab, if any — used to prefill the widget so re-opening
 *  a completed lab shows what you already submitted instead of a blank form. */
export async function fetchMyLabRating(
  userId: string,
  labId: string,
): Promise<{ rating: number; difficultyFeedback: DifficultyFeedback | null } | null> {
  const { data, error } = await supabase
    .from('lab_ratings')
    .select('rating, difficulty_feedback')
    .eq('user_id', userId)
    .eq('lab_id', labId)
    .maybeSingle();
  if (error || !data) return null;
  return { rating: data.rating, difficultyFeedback: data.difficulty_feedback };
}

export async function submitLabRating(
  userId: string,
  labId: string,
  rating: number,
  difficultyFeedback: DifficultyFeedback | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('lab_ratings')
    .upsert(
      { user_id: userId, lab_id: labId, rating, difficulty_feedback: difficultyFeedback, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lab_id' },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
