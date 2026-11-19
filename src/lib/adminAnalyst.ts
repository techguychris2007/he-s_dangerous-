import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';
import type { AnalystSnapshot } from './adminAnalystSnapshot';

/** Calls the admin-analyst edge function (supabase/functions/admin-analyst) and streams Claude's
 *  analysis back. The function re-checks admin_access() server-side before calling Anthropic. */

export interface AnalystTurn { role: 'user' | 'assistant'; content: string }

export const ANALYST_MODEL_LABEL = 'Claude Opus 5.5';

export const FULL_ANALYSIS_PROMPT =
  'Give me the full analysis of DarkWorld Academy from this data: who is learning, what they are learning right now and why, why learners stay, where and why they drop off, content health, ranked recommendations, and data gaps.';

export async function streamAnalyst(
  snapshot: AnalystSnapshot,
  messages: AnalystTurn[],
  onText: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in again to use the analyst.');

  const response = await fetch(`${supabaseUrl}/functions/v1/admin-analyst`, {
    method: 'POST',
    signal,
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshot, messages }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { error?: string } | null;
    if (response.status === 404) throw new Error('The analyst function is not deployed yet (admin-analyst).');
    throw new Error(detail?.error || `The analyst request failed (${response.status}).`);
  }

  let text = '';
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    text += value;
    onText(text);
  }
  if (!text.trim()) throw new Error('The analyst returned an empty response. Try again.');
  return text;
}
