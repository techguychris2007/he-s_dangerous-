import { supabase } from './supabaseClient';

export type FeedbackCategory = 'bug' | 'suggestion' | 'content' | 'other';

export interface FeedbackEntry {
  id: string;
  category: FeedbackCategory;
  message: string;
  pagePath: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  category: FeedbackCategory;
  message: string;
  page_path: string | null;
  created_at: string;
}

/** Inserts one feedback row scoped to the caller (see supabase/migrations/0005_feedback.sql) —
 *  RLS rejects any insert where user_id doesn't match the caller's own auth.uid(), so there's no
 *  way to submit feedback as someone else even if userId were tampered with client-side. */
export async function submitFeedback(
  userId: string,
  category: FeedbackCategory,
  message: string,
  pagePath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: 'Feedback message cannot be empty.' };
  const { error } = await supabase
    .from('feedback')
    .insert({ user_id: userId, category, message: trimmed, page_path: pagePath });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Returns the caller's own past submissions, most recent first. Returns null on failure
 *  (migration not yet run, offline) so the page can hide the history section instead of erroring. */
export async function fetchMyFeedback(): Promise<FeedbackEntry[] | null> {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, category, message, page_path, created_at')
    .order('created_at', { ascending: false });
  if (error || !data) return null;
  return (data as Row[]).map((r) => ({
    id: r.id,
    category: r.category,
    message: r.message,
    pagePath: r.page_path,
    createdAt: r.created_at,
  }));
}
