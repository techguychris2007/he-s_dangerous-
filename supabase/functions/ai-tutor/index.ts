// Supabase Edge Function (Deno runtime). Deploy with:
//   supabase functions deploy ai-tutor
// Secrets are configured server-side only, never committed and never shipped to the browser:
//   supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...
//
// This function is the only place that ever holds the real Groq/Gemini API keys. The frontend
// calls it over fetch (streaming), authenticated with the caller's own
// Supabase session — an anonymous caller with no valid session is rejected before either
// upstream API is touched, so a leaked function URL alone can't be used to burn through the
// account's API quota.

import { answer, cleanHistory, CORS_HEADERS, isSignedInUser, json, type Turn } from '../_shared/llm.ts';

type Mode = 'explain' | 'simplify' | 'summarize' | 'example' | 'takeaways' | 'ask';

interface RequestBody {
  question: string;
  bookTitle?: string;
  pageNum?: number;
  pageText?: string;
  /** which quick-action button (if any) triggered this — shapes the system prompt */
  mode?: Mode;
  /** recent real chat turns, so follow-ups like "why?" resolve against the previous answer */
  history?: Turn[];
  /** stream plain-text tokens instead of one JSON body */
  stream?: boolean;
}

const MODE_INSTRUCTION: Record<Mode, string> = {
  explain: 'Explain the concept the user is asking about clearly and directly.',
  simplify:
    'The user found this too hard to follow. Re-explain it much more simply: shorter sentences, ' +
    'a concrete real-world analogy, and no unnecessary jargon.',
  summarize: 'Summarize the given page in a few sentences: the main point and any key terms introduced.',
  example: 'Give one concrete, real-world-relevant worked example that illustrates the concept being discussed.',
  takeaways: 'List the 3-5 most important takeaways from this page as short bullet points.',
  ask: 'Answer the user\'s specific question.',
};

function buildSystemPrompt(body: RequestBody): string {
  const modeInstruction = MODE_INSTRUCTION[body.mode ?? 'ask'];
  const contextBlock =
    body.bookTitle || body.pageText
      ? `\n\nThe reader is currently on page ${body.pageNum ?? '?'} of "${body.bookTitle ?? 'this book'}". ` +
        `Here is the real text of that page, verbatim — use it as your primary source, and only fall back ` +
        `to your general knowledge if the answer genuinely isn't on this page, and say when you do:\n"""\n${(body.pageText ?? '').slice(0, 6000)}\n"""`
      : '';
  return (
    'You are dig, a patient, precise technical tutor embedded in a cybersecurity and programming learning ' +
    'platform, helping a student understand what they are currently reading. ' +
    modeInstruction +
    ' Keep answers focused and reasonably short by default (a few short paragraphs at most) — the student ' +
    'can always ask a follow-up or click "Explain Deeper" if they want more. Never pad the answer with ' +
    'filler. Format with Markdown where it genuinely improves readability (short headings, **bold** for key ' +
    'terms, bullet lists, `inline code` for identifiers, fenced code blocks for actual code) — never format ' +
    'for its own sake. Accuracy comes first: state only what you are confident is correct, use exact ' +
    'technical terms, commands and flags, and if you are unsure or the page does not support a claim, say ' +
    'so plainly rather than guessing. Never invent book content, page numbers, CVE ids, tool options or ' +
    'citations. If you have real-time search results, ground time-sensitive facts in them.' +
    contextBlock
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    if (!isSignedInUser(req)) return json({ error: 'Sign in to use dig online.' }, 401);

    const body = (await req.json()) as RequestBody;
    if (!body.question || !body.question.trim()) return json({ error: 'question is required.' }, 400);

    return await answer({
      system: buildSystemPrompt(body),
      question: body.question.slice(0, 4000),
      history: cleanHistory(body.history),
      temperature: 0.3,
      stream: body.stream === true,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
});
