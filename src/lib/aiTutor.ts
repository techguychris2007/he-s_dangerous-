import { supabase } from './supabaseClient';

export type AiTutorMode = 'explain' | 'simplify' | 'summarize' | 'example' | 'takeaways' | 'ask';

export interface AskAiTutorParams {
  question: string;
  bookTitle?: string;
  pageNum?: number;
  pageText?: string;
  mode?: AiTutorMode;
}

/** A real source Gemini's Google Search grounding actually cited — never fabricated client-side.
 *  Absent entirely unless the model genuinely searched and Google returned grounding chunks. */
export interface Citation {
  title: string;
  uri: string;
}

export interface AskAiTutorResult {
  answer: string;
  /** which model actually answered — Groq's fast model normally, Gemini only if Groq was
   *  unavailable or the request needed live web search, so the UI can be transparent either way. */
  model: string;
  /** present only when the answer was grounded in a real Google Search the model performed */
  citations?: Citation[];
}

/** Calls the ai-tutor Supabase Edge Function — the only place the real Groq/Gemini API keys live.
 *  Requires an authenticated session; throws with a readable message on any failure (missing
 *  session, both upstream APIs down, network error) so the UI can show it inline. */
export async function askAiTutor(params: AskAiTutorParams): Promise<AskAiTutorResult> {
  const { data, error } = await supabase.functions.invoke<AskAiTutorResult>('ai-tutor', { body: params });
  if (error) throw new Error(error.message || 'The AI tutor is unavailable right now.');
  if (!data) throw new Error('The AI tutor returned an empty response.');
  return data;
}

export type CyberLabAiMode = 'hint' | 'explain' | 'ask';

export interface CyberLabAiContext {
  kind: 'lab' | 'lesson';
  title: string;
  subtitle?: string;
  bodyText?: string;
  currentCode?: string;
  /** for terminal-simulation labs: the recent commands the learner actually typed and the
   *  simulated output they got back, so the AI can explain *their* session, not a generic one */
  terminalTranscript?: string;
  revealedHints?: string[];
}

export interface AskCyberLabAiParams {
  question: string;
  mode: CyberLabAiMode;
  hintLevel?: number;
  context: CyberLabAiContext;
}

/** Calls the ai-lab-tutor Edge Function — "CyberLab AI," the hint-first coding/lab mentor. Shares
 *  the same Groq/Gemini secrets as ai-tutor but runs its own hint-ladder system prompt server-side. */
export async function askCyberLabAi(params: AskCyberLabAiParams): Promise<AskAiTutorResult> {
  const { data, error } = await supabase.functions.invoke<AskAiTutorResult>('ai-lab-tutor', { body: params });
  if (error) throw new Error(error.message || 'CyberLab AI is unavailable right now.');
  if (!data) throw new Error('CyberLab AI returned an empty response.');
  return data;
}
