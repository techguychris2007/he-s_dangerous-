// Supabase Edge Function (Deno runtime). Deploy with:
//   supabase functions deploy ai-lab-tutor
// Reuses the same GROQ_API_KEY / GEMINI_API_KEY secrets as ai-tutor — set once, shared by both
// functions. See supabase/functions/ai-tutor/index.ts for the secrets-setup instructions.
//
// This is "CyberLab AI": a hint-first coding/lab mentor, distinct from the reading companion.
// It never hands over a working solution outright — it climbs a 5-level hint ladder, asks
// Socratic questions, and only gives a full explanation at the top of that ladder or when
// explicitly asked to just explain a concept (not "solve my lab").

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Citation {
  title: string;
  uri: string;
}

interface AiResult {
  answer: string;
  model: string;
  citations?: Citation[];
}

interface RequestBody {
  question: string;
  mode: 'hint' | 'explain' | 'ask';
  /** 1 (small clue) through 5 (full explanation) — only meaningful when mode === 'hint' */
  hintLevel?: number;
  context: {
    kind: 'lab' | 'lesson';
    title: string;
    subtitle?: string;
    /** the lab's prompt/objective text, or the lesson's rendered body text */
    bodyText?: string;
    /** what the learner has actually typed into the editor right now — coding labs only */
    currentCode?: string;
    /** the learner's real recent commands + output from a simulated-terminal lab */
    terminalTranscript?: string;
    /** the static hints (if any) already revealed via the lab's own "Show a hint" button */
    revealedHints?: string[];
  };
}

const HINT_LADDER = [
  '',
  'Level 1 (small clue): point them toward the right area of the problem or code without naming the fix. A single short sentence.',
  'Level 2 (guided observation): ask a Socratic question that gets them to notice the specific thing that\'s wrong or missing — do not name the fix yet.',
  'Level 3 (strong hint): name the concept or technique they need (e.g. "you need to handle the case where the list is empty"), but do not write the code for them.',
  'Level 4 (near-solution): describe the fix in plain English, specifically enough that they could write it themselves, but still do not write the actual code.',
  'Level 5 (full explanation): now you may explain the complete solution and, if it genuinely helps, show a short code snippet — but always explain *why* it works, never just paste code with no reasoning.',
];

const SYSTEM_PROMPT_BASE =
  'You are CyberLab AI, a patient, encouraging cybersecurity and programming instructor embedded in a ' +
  'hands-on learning platform (covering web security, network security, Linux, digital forensics, cloud ' +
  'security, reverse engineering, secure coding, and computer science generally). Your goal is genuine ' +
  'understanding, not answer-dumping — you are teaching *why* something works, not just handing over a ' +
  'working solution. Never shame a beginner for not knowing something. Keep answers focused; do not pad ' +
  'with filler. Format with Markdown where it genuinely improves readability (short headings, **bold** for ' +
  'key terms, bullet lists for enumerated points, `inline code` for identifiers, fenced code blocks for ' +
  'actual code) — never format for its own sake. If you have real-time search results available and the ' +
  'question genuinely depends on current information (a recent CVE, a tool\'s current version/behavior, a ' +
  'changed standard), use them and ground your answer in them; otherwise answer from what you already know ' +
  'without searching.\n\n' +
  'Hard scope limits: only ever discuss the concepts and code relevant to the CURRENT lab or lesson ' +
  'described below, which runs entirely inside this platform\'s own sandboxed browser environment ' +
  '(Pyodide/WASM) against fake, self-contained data. Never give operational guidance for attacking a ' +
  'real system, service, or person outside this sandbox, and redirect any such request back to the ' +
  'lab\'s own scope.';

function buildSystemPrompt(body: RequestBody): string {
  const { context } = body;
  const contextLines: string[] = [];
  if (context.kind === 'lab') {
    contextLines.push(`The learner is currently on a lab titled "${context.title}"${context.subtitle ? ` (${context.subtitle})` : ''}.`);
    if (context.bodyText) contextLines.push(`Lab briefing / objectives:\n"""\n${context.bodyText.slice(0, 3000)}\n"""`);
    if (context.currentCode) contextLines.push(`The learner's current code in the editor, verbatim:\n"""\n${context.currentCode.slice(0, 4000)}\n"""`);
    if (context.terminalTranscript) {
      contextLines.push(
        `The learner's real, recent terminal session in this lab's simulated environment — the exact ` +
          `commands they typed and the exact output they got back, verbatim (oldest first):\n"""\n${context.terminalTranscript.slice(-4000)}\n"""`,
      );
    }
    if (context.revealedHints && context.revealedHints.length > 0) {
      contextLines.push(`Static hints already shown to them by the platform: ${context.revealedHints.join(' | ')}`);
    }
  } else {
    contextLines.push(`The learner is currently reading a lesson titled "${context.title}"${context.subtitle ? ` (${context.subtitle})` : ''}.`);
    if (context.bodyText) contextLines.push(`The lesson's text, verbatim:\n"""\n${context.bodyText.slice(0, 6000)}\n"""`);
  }

  let behaviorInstruction: string;
  if (body.mode === 'hint') {
    const level = Math.min(Math.max(Math.round(body.hintLevel ?? 1), 1), 5);
    behaviorInstruction =
      `The learner asked for a hint. This is hint request #${level} for this problem — follow the hint ` +
      `ladder EXACTLY at this level, no further: ${HINT_LADDER[level]}`;
  } else if (body.mode === 'explain') {
    behaviorInstruction =
      'The learner wants a concept explained. If it is a security vulnerability class, structure your answer ' +
      'as: what it is, why it happens, how it is typically exploited, how it is mitigated, a real-world ' +
      'example, and how it relates to the current lab. Otherwise, structure it as: plain-English explanation, ' +
      'technical explanation, why it matters, a short example, a common mistake, and a one-line key takeaway. ' +
      'This is a concept explanation, not a request to solve the lab for them — you may explain freely here.';
  } else {
    behaviorInstruction =
      'Answer the learner\'s specific question. If it is really "just solve it for me" in disguise, respond ' +
      'the way you would to a Level 1 hint request instead, and say so gently — invite them to ask for a ' +
      'hint or a concept explanation instead of a direct answer.';
  }

  return `${SYSTEM_PROMPT_BASE}\n\n${contextLines.join('\n\n')}\n\n${behaviorInstruction}`;
}

async function callGroq(systemPrompt: string, question: string): Promise<AiResult> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.4,
      max_tokens: 700,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content;
  if (!answer) throw new Error('Groq returned no answer content');
  return { answer, model: GROQ_MODEL };
}

/** Calls Gemini with its real Google Search grounding tool enabled — Gemini itself decides,
 *  per-request, whether the question actually needs a live search or can be answered from its own
 *  knowledge. When it does search, groundingMetadata comes back with the real source chunks it
 *  used, which we surface as citations — never fabricated, always what Google actually returned. */
async function callGemini(systemPrompt: string, question: string): Promise<AiResult> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const answer = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!answer) throw new Error('Gemini returned no answer content');

  const chunks = candidate?.groundingMetadata?.groundingChunks as { web?: { uri: string; title: string } }[] | undefined;
  const citations: Citation[] | undefined = chunks
    ?.map((c) => (c.web ? { title: c.web.title, uri: c.web.uri } : null))
    .filter((c): c is Citation => c !== null);

  return { answer, model: GEMINI_MODEL, citations: citations && citations.length > 0 ? citations : undefined };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
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
    if (!body.question || !body.question.trim() || !body.context) {
      return new Response(JSON.stringify({ error: 'question and context are required.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPrompt(body);
    // Hint requests: speed matters more than search (they're about the learner's own sandboxed
    // lab, never time-sensitive), so try fast Groq first. Explain/ask: accuracy and freshness
    // matter more, so try Gemini-with-search first, falling back to Groq only if Gemini errors.
    const preferGemini = body.mode === 'explain' || body.mode === 'ask';
    let result: AiResult;
    try {
      if (preferGemini) {
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
        result = await callGemini(systemPrompt, body.question);
      } else {
        if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
        result = await callGroq(systemPrompt, body.question);
      }
    } catch (firstErr) {
      if (preferGemini) {
        if (!GROQ_API_KEY) throw firstErr;
        result = await callGroq(systemPrompt, body.question);
      } else {
        if (!GEMINI_API_KEY) throw firstErr;
        result = await callGemini(systemPrompt, body.question);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
