// Shared upstream-model plumbing for ai-tutor and ai-lab-tutor (Deno runtime). Each function owns its
// own system prompt; this module owns auth, provider routing, timeouts and streaming, so the two can
// never drift apart on the parts that decide how fast and how reliably dig answers.

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Overridable via `supabase secrets set GROQ_MODEL=... GEMINI_MODEL=...` without a code change.
// Providers retire model ids on a schedule (gemini-2.0-flash shut down June 2026, llama-3.1-8b-instant
// August 2026); a retired id fails every request and silently doubles latency through the fallback.
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') ?? 'openai/gpt-oss-120b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Google's moving alias for its current Flash model, so a Flash retirement can't break dig again.
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Fail over quickly instead of letting one slow provider eat the client's whole wait budget.
const FIRST_TOKEN_TIMEOUT_MS = 8000;
const STREAM_TIMEOUT_MS = 45000;
const GEMINI_TIMEOUT_MS = 14000;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'x-dig-model',
};

export interface Citation {
  title: string;
  uri: string;
}

interface AiResult {
  answer: string;
  model: string;
  citations?: Citation[];
}

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

/** These functions deploy with verify_jwt = true, so the gateway has already checked the token's
 *  signature and expiry before this runs. The anon key is a validly signed JWT too, though, so the
 *  role claim must still be checked — a leaked public key alone must not spend the Groq/Gemini quota.
 *  Reading the verified claims locally replaces a full /auth/v1/user round trip on every question. */
export function isSignedInUser(req: Request): boolean {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token?.split('.')[1];
  if (!payload) return false;
  try {
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return claims.role === 'authenticated' && typeof claims.sub === 'string' && (!claims.exp || claims.exp * 1000 > Date.now());
  } catch {
    return false;
  }
}

/** Only the last few real turns, trimmed — enough to resolve "why?" or "show me" follow-ups. */
export function cleanHistory(history: unknown): Turn[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((t): t is Turn => (t?.role === 'user' || t?.role === 'assistant') && typeof t.content === 'string' && !!t.content.trim())
    .slice(-6)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 1500) }));
}

// Live Google Search grounding costs seconds, so it is reserved for questions whose answer can
// actually have changed since the model's training: recent CVEs, versions, releases, news.
const NEEDS_LIVE_SEARCH =
  /\b(latest|newest|recent(ly)?|current(ly)? (version|release|state)|today|this (week|month|year)|news|just (released|announced)|cve-\d{4}-\d+|20(2[5-9]|3\d))\b/i;

async function* groqTokens(system: string, history: Turn[], question: string, temperature: number): AsyncGenerator<string> {
  const abort = new AbortController();
  const firstTokenTimer = setTimeout(() => abort.abort(), FIRST_TOKEN_TIMEOUT_MS);
  const streamTimer = setTimeout(() => abort.abort(), STREAM_TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      signal: abort.signal,
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: question }],
        temperature,
        stream: true,
        // gpt-oss reasons before answering and those tokens share the completion budget: low effort
        // keeps the first visible token fast, and the larger cap stops answers being cut off.
        max_completion_tokens: 1500,
        ...(GROQ_MODEL.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
      }),
    });
    if (!res.ok || !res.body) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        const token = JSON.parse(data).choices?.[0]?.delta?.content;
        if (token) {
          clearTimeout(firstTokenTimer);
          yield token;
        }
      }
    }
  } finally {
    clearTimeout(firstTokenTimer);
    clearTimeout(streamTimer);
  }
}

/** Pulls the first token before committing to a provider, so a provider that errors, stalls or
 *  produces nothing still falls through to the next one instead of sending the client an empty answer. */
async function primed(tokens: AsyncGenerator<string>): Promise<AsyncGenerator<string> | null> {
  const first = await tokens.next();
  if (first.done) return null;
  return (async function* () {
    yield first.value;
    yield* tokens;
  })();
}

function textStream(tokens: AsyncGenerator<string>, model: string): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await tokens.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(value));
      } catch {
        controller.enqueue(encoder.encode('\n\n_(The answer was interrupted. Retry for the rest.)_'));
        controller.close();
      }
    },
    async cancel() {
      await tokens.return(undefined);
    },
  });
  return new Response(body, { headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'X-Dig-Model': model } });
}

/** Gemini, with real Google Search grounding only when the question needs it. When it searches,
 *  groundingMetadata carries the real source chunks used, surfaced as citations — never fabricated. */
async function callGemini(system: string, history: Turn[], question: string, temperature: number, search: boolean): Promise<AiResult> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        ...history.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })),
        { role: 'user', parts: [{ text: question }] },
      ],
      ...(search ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { temperature, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const answer = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!answer) throw new Error('Gemini returned no answer content');

  const chunks = candidate?.groundingMetadata?.groundingChunks as { web?: { uri: string; title: string } }[] | undefined;
  const citations = chunks?.map((c) => (c.web ? { title: c.web.title, uri: c.web.uri } : null)).filter((c): c is Citation => c !== null);
  return { answer, model: GEMINI_MODEL, citations: citations && citations.length > 0 ? citations : undefined };
}

export interface AnswerRequest {
  system: string;
  question: string;
  history: Turn[];
  temperature: number;
  /** stream plain-text tokens as they are generated instead of one JSON body at the end */
  stream: boolean;
}

/** Groq first — it answers in about a second and streams — with Gemini as the fallback. Questions that
 *  depend on current information go to Gemini with live search first instead, since a fast answer
 *  from stale training data is not an accurate one. */
export async function answer({ system, question, history, temperature, stream }: AnswerRequest): Promise<Response> {
  const groq = async () => {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
    const tokens = await primed(groqTokens(system, history, question, temperature));
    if (!tokens) throw new Error('Groq returned no answer content');
    if (stream) return textStream(tokens, GROQ_MODEL);
    let text = '';
    for await (const token of tokens) text += token;
    return json({ answer: text, model: GROQ_MODEL });
  };
  const gemini = (search: boolean) => async () => {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
    return json(await callGemini(system, history, question, temperature, search));
  };

  const attempts = NEEDS_LIVE_SEARCH.test(question) ? [gemini(true), groq] : [groq, gemini(false)];
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
      console.error(err);
    }
  }
  return json({ error: lastError instanceof Error ? lastError.message : String(lastError) }, 502);
}
