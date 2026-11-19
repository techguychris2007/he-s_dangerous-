import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';
import type { AnalystSnapshot } from './adminAnalystSnapshot';

/** Calls the admin-analyst edge function (supabase/functions/admin-analyst) and streams the
 *  analysis back. The function re-checks admin_access() server-side, then uses Claude when an
 *  Anthropic key is configured and Gemini otherwise. */

export interface AnalystTurn { role: 'user' | 'assistant'; content: string; model?: string }

/** Human-readable name for the model id the function reports in X-Analyst-Model. */
export function modelLabel(id: string | null): string {
  if (!id) return 'the analyst';
  if (id === 'claude-opus-5-5') return 'Claude Opus 5.5';
  if (id.startsWith('gemini')) return `Gemini (${id})`;
  return id;
}

export const FULL_ANALYSIS_PROMPT =
  'Give me the full analysis of DarkWorld Academy from this data: who is learning, what they are learning right now and why, why learners stay, where and why they drop off, content health, ranked recommendations, and data gaps.';

export async function streamAnalyst(
  snapshot: AnalystSnapshot,
  messages: AnalystTurn[],
  onText: (textSoFar: string) => void,
  signal?: AbortSignal,
): Promise<{ text: string; model: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in again to use the analyst.');

  const response = await fetch(`${supabaseUrl}/functions/v1/admin-analyst`, {
    method: 'POST',
    signal,
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ snapshot, messages: messages.map(({ role, content }) => ({ role, content })) }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { error?: string } | null;
    if (response.status === 404) throw new Error('The analyst function is not deployed yet (admin-analyst).');
    throw new Error(detail?.error || `The analyst request failed (${response.status}).`);
  }

  // The stream carries control lines starting with \u0000: "model:<id>" and "error:<message>".
  let raw = '';
  let model = modelLabel(null);
  let text = '';
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    raw += value;
    const failures: string[] = [];
    text = raw
      // oxlint-disable-next-line no-control-regex -- \u0000 marks the function's control lines
      .replace(/\u0000(model|error):([^\n]*)\n/g, (_m, kind: string, body: string) => {
        if (kind === 'model') model = modelLabel(body);
        else failures.push(body);
        return '';
      })
      // oxlint-disable-next-line no-control-regex -- drop a control line that is still arriving
      .replace(/\u0000[^\n]*$/, '');
    if (failures.length) throw new Error(failures[0]);
    onText(text);
  }
  if (!text.trim()) throw new Error('The analyst returned an empty response. Try again.');
  return { text, model };
}
