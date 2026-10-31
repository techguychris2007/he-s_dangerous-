import { supabase } from './supabaseClient';

export type AiTutorMode = 'explain' | 'simplify' | 'summarize' | 'example' | 'takeaways' | 'ask';

export interface AskAiTutorParams {
  source?: 'library';
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
  library?: { bookId: string; title: string; page: number; text: string };
}

export interface AskAiTutorResult {
  sourceMode?: 'online' | 'library';
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
  const { source, ...body } = params;
  return assistance('ai-tutor', body, params.question, params.bookTitle, source);
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
  source?: 'library';
  question: string;
  mode: CyberLabAiMode;
  hintLevel?: number;
  context: CyberLabAiContext;
}

/** Calls the ai-lab-tutor Edge Function — "CyberLab AI," the hint-first coding/lab mentor. Shares
 *  the same Groq/Gemini secrets as ai-tutor but runs its own hint-ladder system prompt server-side. */
export async function askCyberLabAi(params: AskCyberLabAiParams): Promise<AskAiTutorResult> {
  const { source, ...body } = params;
  return assistance('ai-lab-tutor', body, params.question, params.context.title, source);
}

async function assistance(endpoint: string, body: object, question: string, title?: string, source?: 'library'): Promise<AskAiTutorResult> {
  const local = async () => (await import('./offlineLibrary')).searchSavedLibrary(question, title);
  if (source === 'library' || !navigator.onLine) return local();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 15000);
  try {
    const { data, error } = await supabase.functions.invoke<AskAiTutorResult>(endpoint, { body, signal: abort.signal });
    if (error) {
      const status = error.context instanceof Response ? error.context.status : undefined;
      if (status === 401 || status === 403) throw new Error('Sign in again to use online AI. You can still select “Search saved library” for prepared books.');
      if (status && status < 500 && status !== 429) throw new Error(error.message || 'The online AI request was not accepted.');
      clearTimeout(timer);
      return { ...await local(), model: 'Library search · online service unavailable' };
    }
    if (!data?.answer) throw new Error('The AI tutor returned an empty response. Please retry.');
    return { ...data, sourceMode: 'online' };
  } catch (error) {
    if (abort.signal.aborted || !navigator.onLine || error instanceof TypeError) return { ...await local(), model: 'Library search · connection unavailable' };
    throw error;
  } finally { clearTimeout(timer); }
}
