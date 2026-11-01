// Supabase Edge Function (Deno runtime). Deploy with:
//   supabase functions deploy ai-lab-tutor
// Reuses the same GROQ_API_KEY / GEMINI_API_KEY secrets as ai-tutor — set once, shared by both
// functions. See supabase/functions/ai-tutor/index.ts for the secrets-setup instructions.
//
// This is "CyberLab AI": a hint-first coding/lab mentor, distinct from the reading companion.
// It never hands over a working solution outright — it climbs a 5-level hint ladder, asks
// Socratic questions, and only gives a full explanation at the top of that ladder or when
// explicitly asked to just explain a concept (not "solve my lab").

import { answer, cleanHistory, CONCEPT_FORMAT, CORS_HEADERS, isSignedInUser, json, type Turn } from '../_shared/llm.ts';

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
  /** recent real chat turns, so follow-ups like "why?" resolve against the previous answer */
  history?: Turn[];
  /** stream plain-text tokens instead of one JSON body */
  stream?: boolean;
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
  'You are dig, a patient, encouraging cybersecurity and programming instructor embedded in a ' +
  'hands-on learning platform (covering web security, network security, Linux, digital forensics, cloud ' +
  'security, reverse engineering, secure coding, and computer science generally). Your goal is genuine ' +
  'understanding, not answer-dumping — you are teaching *why* something works, not just handing over a ' +
  'working solution. Never shame a beginner for not knowing something. Keep answers focused; do not pad ' +
  'with filler. Format with Markdown where it genuinely improves readability (short headings, **bold** for ' +
  'key terms, bullet lists for enumerated points, `inline code` for identifiers, fenced code blocks for ' +
  'actual code) — never format for its own sake. Accuracy comes first: state only what you are confident ' +
  'is correct, use exact commands, flags and identifiers, base feedback on the learner\'s actual code or ' +
  'terminal output shown below rather than on assumptions, and if you are unsure, say so plainly rather ' +
  'than guessing. Never invent CVE ids, tool options, file contents or citations. If you have real-time ' +
  'search results, ground time-sensitive facts (a recent CVE, a tool\'s current version) in them.\n\n' +
  'Scope: explain any programming, computer-science or security concept the learner asks about, relating ' +
  'it to the current lab or lesson described below when that helps. The lab runs entirely inside this ' +
  'platform\'s own sandboxed browser environment (Pyodide/WASM) against fake, self-contained data. Never ' +
  'give operational guidance for attacking a real system, service, or person outside this sandbox, and ' +
  'redirect any such request back to the lab\'s own scope.';

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
      'Answer the learner\'s specific question. If it asks what a concept is or how it works, explain it ' +
      'freely using the concept format below. If it is really "just solve it for me" in disguise, respond ' +
      'the way you would to a Level 1 hint request instead, and say so gently — invite them to ask for a ' +
      'hint or a concept explanation instead of a direct answer.';
  }
  behaviorInstruction += `\n\n${CONCEPT_FORMAT}`;

  return `${SYSTEM_PROMPT_BASE}\n\n${contextLines.join('\n\n')}\n\n${behaviorInstruction}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    if (!isSignedInUser(req)) return json({ error: 'Sign in to use dig online.' }, 401);

    const body = (await req.json()) as RequestBody;
    if (!body.question || !body.question.trim() || !body.context) return json({ error: 'question and context are required.' }, 400);

    return await answer({
      system: buildSystemPrompt(body),
      question: body.question.slice(0, 4000),
      history: cleanHistory(body.history),
      // hints follow a strict ladder, so keep them deterministic
      temperature: body.mode === 'hint' ? 0.2 : 0.3,
      stream: body.stream === true,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
});
