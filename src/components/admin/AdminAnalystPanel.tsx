import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import MarkdownText from '../common/MarkdownText';
import type { AdminData } from '../../lib/adminDashboard';
import { buildAnalystSnapshot, type AnalystSnapshot } from '../../lib/adminAnalystSnapshot';
import { streamAnalyst, FULL_ANALYSIS_PROMPT, type AnalystTurn } from '../../lib/adminAnalyst';
import { IconBrain, IconCopy, IconRefresh } from '../layout/icons';

const QUICK_QUESTIONS = [
  'Why are learners dropping off, and where exactly?',
  'What are people learning this week, and what does that say about why they came?',
  'What separates learners who stay from those who leave?',
  'Which labs or modules need fixing first?',
  'What content should we build next?',
  'What should we start measuring that we do not today?',
];

const buttonPrimary = 'inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]';
const buttonQuiet = 'inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]';

export default function AdminAnalystPanel({ data }: { data: AdminData }) {
  const [turns, setTurns] = useState<AnalystTurn[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [frozen, setFrozen] = useState<{ snapshot: AnalystSnapshot; at: Date } | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // What would be sent if a new conversation started now (shown in the "What Claude sees" panel).
  const preview = useMemo(() => buildAnalystSnapshot(data), [data]);
  const snapshot = frozen?.snapshot ?? preview;
  const snapshotText = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);
  const busy = streaming !== null;
  const staleData = frozen && data.loadedAt > frozen.at;

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const base = frozen ?? { snapshot: preview, at: data.loadedAt };
    if (!frozen) setFrozen(base);
    const next: AnalystTurn[] = [...turns, { role: 'user', content: q }];
    setTurns(next);
    setDraft('');
    setError(null);
    setStreaming('');
    const controller = new AbortController();
    abortRef.current = controller;
    let partial = '';
    try {
      const answer = await streamAnalyst(base.snapshot, next, (text) => { partial = text; setStreaming(text); }, controller.signal);
      setTurns([...next, { role: 'assistant', content: answer.text, model: answer.model }]);
    } catch (e) {
      if (partial.trim()) {
        setTurns([...next, { role: 'assistant', content: partial + (controller.signal.aborted ? '\n\n_(Stopped.)_' : '\n\n_(Connection lost before the analysis finished.)_') }]);
      } else {
        setTurns(turns);
        setDraft(q);
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'The analyst request failed.');
      }
    } finally {
      setStreaming(null);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setTurns([]);
    setFrozen(null);
    setError(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void ask(draft); }
  }

  async function copyConversation() {
    const text = turns.map((t) => (t.role === 'user' ? `> ${t.content}` : t.content)).join('\n\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  }

  const started = turns.length > 0 || busy;

  return (
    <div className="grid gap-4">
      <section className="premium-card rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-navy)] text-[var(--color-gold)]"><IconBrain className="w-5 h-5" /></span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--color-heading)]">AI analyst</h2>
              <p className="text-sm text-[var(--color-text-dim)] max-w-2xl">
                Reads the dashboard's numbers like a product analyst: who is learning, what they are learning now and why, where they drop off, and what to fix first.
                It runs only when you ask, on Claude Opus 5.5 when an Anthropic key is set and on Gemini otherwise.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {started && <button type="button" className={buttonQuiet} onClick={copyConversation} disabled={!turns.length}><IconCopy className="w-3.5 h-3.5" />{copied ? 'Copied' : 'Copy'}</button>}
            {started && <button type="button" className={buttonQuiet} onClick={reset}><IconRefresh className="w-3.5 h-3.5" />New analysis</button>}
          </div>
        </div>

        {!started && (
          <div className="mt-5">
            <button type="button" className={buttonPrimary} onClick={() => void ask(FULL_ANALYSIS_PROMPT)}>
              <IconBrain className="w-4 h-4" />Run full analysis
            </button>
            <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-dim)]">Or ask about one thing</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} type="button" onClick={() => void ask(q)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-heading)] text-left">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-[var(--color-text-dim)]">
          Sends aggregated numbers and learner feedback with emails and phone numbers removed. No names, emails or account IDs leave DarkWorld.
          Visitor analytics are not connected, so it only sees people who signed up.
        </p>
      </section>

      {staleData && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-gold-dim)] px-4 py-2.5 text-sm">
          <span>Newer data has arrived since this analysis started ({frozen.at.toLocaleTimeString()}).</span>
          <button type="button" className={buttonQuiet} onClick={reset} disabled={busy}>Start a fresh analysis</button>
        </div>
      )}

      {started && (
        <div className="grid gap-4" aria-live="polite" aria-busy={busy}>
          {turns.map((turn, i) => turn.role === 'user' ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[var(--color-accent-dim)] px-4 py-2.5 text-sm text-[var(--color-heading)]">
              {turn.content === FULL_ANALYSIS_PROMPT ? 'Run the full analysis' : turn.content}
            </div>
          ) : (
            <article key={i} className="premium-card rounded-2xl p-5 text-sm leading-relaxed text-[var(--color-text)] break-words">
              <MarkdownText text={turn.content} />
              {turn.model && <p className="mt-4 text-[11px] font-mono text-[var(--color-text-dim)]">Answered by {turn.model}</p>}
            </article>
          ))}
          {busy && (
            <article className="premium-card rounded-2xl p-5 text-sm leading-relaxed text-[var(--color-text)] break-words">
              {streaming ? <MarkdownText text={streaming} /> : (
                <p className="flex items-center gap-2 text-[var(--color-text-dim)]">
                  <span aria-hidden="true" className="h-3 w-3 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin motion-reduce:animate-none" />
                  Analysing {snapshot.accounts.registered} learners' data…
                </p>
              )}
              <button type="button" className={`${buttonQuiet} mt-4`} onClick={() => abortRef.current?.abort()}>Stop</button>
            </article>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-[var(--color-danger)] px-4 py-3 text-sm text-[var(--color-heading)]">{error}</div>
      )}

      {started && (
        <form onSubmit={submit} className="premium-card rounded-2xl p-3 flex gap-2 items-end">
          <label htmlFor="analyst-question" className="sr-only">Ask a follow-up question</label>
          <textarea
            id="analyst-question"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask a follow-up, e.g. “Why is the web track losing people after lesson 3?”"
            className="flex-1 resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          />
          <button type="submit" className={buttonPrimary} disabled={busy || !draft.trim()}>Ask</button>
        </form>
      )}

      <details className="premium-card rounded-2xl p-5">
        <summary className="cursor-pointer text-sm font-bold text-[var(--color-heading)]">
          What the analyst sees <span className="font-normal text-[var(--color-text-dim)]">· about {Math.max(1, Math.round(JSON.stringify(snapshot).length / 4 / 1000))}k tokens{frozen ? `, frozen at ${frozen.at.toLocaleTimeString()}` : ''}</span>
        </summary>
        <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg bg-[var(--color-surface-2)] p-3 text-xs font-mono text-[var(--color-text)]">{snapshotText}</pre>
      </details>
    </div>
  );
}
