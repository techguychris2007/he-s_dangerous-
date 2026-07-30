// Supabase Edge Function (Deno runtime). Deploy with:
//   supabase functions deploy ai-tutor
// Secrets are configured server-side only, never committed and never shipped to the browser:
//   supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...
//
// This function is the only place that ever holds the real Groq/Gemini API keys. The frontend
// calls it via supabase.functions.invoke('ai-tutor', ...), authenticated with the caller's own
// Supabase session — an anonymous caller with no valid session is rejected before either
// upstream API is touched, so a leaked function URL alone can't be used to burn through the
// account's API quota.

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Groq's fastest model — an 8B model on their LPU hardware, typically responding in well under a
// second for an answer this size. Speed here matters more than raw capability: this is a reading
// companion answering questions about one page of text, not a research assistant.
const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Gemini Flash is Google's low-latency tier — used only if Groq errors out or times out.
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  question: string;
  bookTitle?: string;
  pageNum?: number;
  pageText?: string;
  /** which quick-action button (if any) triggered this — shapes the system prompt */
  mode?: 'explain' | 'simplify' | 'summarize' | 'example' | 'takeaways' | 'ask';
}

const MODE_INSTRUCTION: Record<NonNullable<RequestBody['mode']>, string> = {
  explain: 'Explain the concept the user is asking about clearly and directly.',
  simplify:
    'The user found this too hard to follow. Re-explain it much more simply: shorter sentences, ' +
    'a concrete real-world analogy, and no unnecessary jargon.',
  summarize: 'Summarize the given page in a few sentences: the main point and any key terms introduced.',
  example: 'Give one concrete, concrete worked example that illustrates the concept being discussed.',
  takeaways: 'List the 3-5 most important takeaways from this page as short bullet points.',
  ask: 'Answer the user\'s specific question.',
};

function buildSystemPrompt(body: RequestBody): string {
  const modeInstruction = MODE_INSTRUCTION[body.mode ?? 'ask'];
  const contextBlock =
    body.bookTitle || body.pageText
      ? `\n\nThe reader is currently on page ${body.pageNum ?? '?'} of "${body.bookTitle ?? 'this book'}". ` +
        `Here is the real text of that page, verbatim — use it as your primary source, and only fall back ` +
        `to your general knowledge if the answer genuinely isn't on this page:\n"""\n${(body.pageText ?? '').slice(0, 6000)}\n"""`
      : '';
  return (
    'You are a patient, precise technical tutor embedded in a cybersecurity and programming learning ' +
    'platform, helping a student understand what they are currently reading. ' +
    modeInstruction +
    ' Keep answers focused and reasonably short by default (a few short paragraphs at most) — the student ' +
    'can always ask a follow-up or click "Explain Deeper" if they want more. Never pad the answer with ' +
    'filler. Use Markdown for structure (short paragraphs, bullet points, `inline code`) where it helps ' +
    'readability, not for its own sake.' +
    contextBlock
  );
}

async function callGroq(systemPrompt: string, question: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.3,
      max_tokens: 700,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content;
  if (!answer) throw new Error('Groq returned no answer content');
  return answer;
}

async function callGemini(systemPrompt: string, question: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!answer) throw new Error('Gemini returned no answer content');
  return answer;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    // Reject anonymous callers before touching either upstream API — a leaked function URL alone
    // must not be usable to spend this project's Groq/Gemini quota.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ error: 'Missing authentication.' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'Invalid session.' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body.question || !body.question.trim()) {
      return new Response(JSON.stringify({ error: 'question is required.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPrompt(body);
    let answer: string;
    let model: string;
    try {
      if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
      answer = await callGroq(systemPrompt, body.question);
      model = GROQ_MODEL;
    } catch (groqErr) {
      if (!GEMINI_API_KEY) throw groqErr;
      answer = await callGemini(systemPrompt, body.question);
      model = GEMINI_MODEL;
    }

    return new Response(JSON.stringify({ answer, model }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
