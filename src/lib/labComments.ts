import { supabase } from './supabaseClient';

export interface LabComment {
  id: string;
  userId: string;
  displayName: string;
  message: string;
  createdAt: string;
}

interface RpcRow {
  id: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
}

/** Calls lab_comments_for_lab() (see supabase/migrations/0008_lab_comments.sql) — one lab's full
 *  thread, oldest first. Returns null on failure (migration not yet run, offline) so the caller can
 *  hide the whole section instead of showing a raw error. */
export async function fetchLabComments(labId: string): Promise<LabComment[] | null> {
  const { data, error } = await supabase.rpc('lab_comments_for_lab', { p_lab_id: labId });
  if (error || !data) return null;
  return (data as RpcRow[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    displayName: r.display_name,
    message: r.message,
    createdAt: r.created_at,
  }));
}

export async function postLabComment(
  userId: string,
  labId: string,
  message: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: 'Comment cannot be empty.' };
  const { error } = await supabase.from('lab_comments').insert({ user_id: userId, lab_id: labId, message: trimmed });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteLabComment(commentId: string): Promise<boolean> {
  const { error } = await supabase.from('lab_comments').delete().eq('id', commentId);
  return !error;
}
