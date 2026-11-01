import { supabase, supabaseAnonKey, supabaseUrl } from './supabaseClient';
import type { LibraryTurn, LibraryQuestionContext } from './libraryQuestion';

export type AiTutorMode = 'explain' | 'simplify' | 'summarize' | 'example' | 'takeaways' | 'ask';

export interface AskAiTutorParams {
  history?: LibraryTurn[];
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

/** Called with the full answer so far each time more of it streams in. */
export type OnAnswerProgress = (answerSoFar: string) => void;

/** Calls the ai-tutor Supabase Edge Function — the only place the real Groq/Gemini API keys live.
 *  Requires an authenticated session; throws with a readable message on any failure (missing
 *  session, both upstream APIs down, network error) so the UI can show it inline. */
export async function askAiTutor(params: AskAiTutorParams, onProgress?: OnAnswerProgress): Promise<AskAiTutorResult> {
  const { source, ...body } = params;
  return assistance('ai-tutor', body, params.question, params.bookTitle, source, { history: params.history, text: params.pageText, page: params.pageNum }, onProgress);
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
  history?: LibraryTurn[];
  source?: 'library';
  question: string;
  mode: CyberLabAiMode;
  hintLevel?: number;
  context: CyberLabAiContext;
}

/** Calls the ai-lab-tutor Edge Function — "CyberLab AI," the hint-first coding/lab mentor. Shares
 *  the same Groq/Gemini secrets as ai-tutor but runs its own hint-ladder system prompt server-side. */
export async function askCyberLabAi(params: AskCyberLabAiParams, onProgress?: OnAnswerProgress): Promise<AskAiTutorResult> {
  const { source, ...body } = params;
  return assistance('ai-lab-tutor', body, params.question, params.context.title, source, { history: params.history }, onProgress);
}

/** How long to wait for the first byte. Once tokens are flowing the server bounds generation itself. */
const FIRST_BYTE_TIMEOUT_MS = 20000;

async function assistance(endpoint: string, body: object, question: string, title?: string, source?: 'library', context?: LibraryQuestionContext, onProgress?: OnAnswerProgress): Promise<AskAiTutorResult> {
  const local = async () => (await import('./offlineLibrary')).searchSavedLibrary(question, title, context);
  if (source === 'library' || !navigator.onLine) return local();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to use online AI. You can still select “Answer from my books” for prepared books.');
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), FIRST_BYTE_TIMEOUT_MS);
  let streamed = '';
  try {
    // Plain fetch rather than supabase.functions.invoke, which buffers the whole body: streaming lets
    // the first words appear about a second after asking instead of after the full answer is written.
    const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      signal: abort.signal,
      headers: { Authorization: `Bearer ${session.access_token}`, apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true }),
    });
    clearTimeout(timer);
    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) throw new Error('Sign in again to use online AI. You can still select “Answer from my books” for prepared books.');
      if (status < 500 && status !== 429) {
        const detail = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(detail?.error || 'The online AI request was not accepted.');
      }
      return { ...await local(), model: 'Library search · online service unavailable' };
    }
    if (response.headers.get('Content-Type')?.includes('application/json')) {
      const data = await response.json() as AskAiTutorResult;
      if (!data?.answer) throw new Error('The AI tutor returned an empty response. Please retry.');
      return { ...data, sourceMode: 'online' };
    }
    const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      streamed += value;
      onProgress?.(streamed);
    }
    if (!streamed.trim()) throw new Error('The AI tutor returned an empty response. Please retry.');
    return { answer: streamed, model: response.headers.get('X-Dig-Model') ?? 'dig', sourceMode: 'online' };
  } catch (error) {
    // A connection lost mid-answer keeps what already arrived rather than swapping in a different answer.
    if (streamed.trim()) return { answer: `${streamed}

_(Connection lost before the answer finished. Retry for the rest.)_`, model: 'dig', sourceMode: 'online' };
    if (abort.signal.aborted || !navigator.onLine || error instanceof TypeError) return { ...await local(), model: 'Library search · connection unavailable' };
    throw error;
  } finally { clearTimeout(timer); }
}
