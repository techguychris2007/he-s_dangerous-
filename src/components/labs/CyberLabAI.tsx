import { useEffect, useRef, useState } from 'react';
import { askCyberLabAi, type CyberLabAiContext, type CyberLabAiMode } from '../../lib/aiTutor';
import AiChatWindow, { type ChatMessage } from '../common/AiChatWindow';
import { withoutStreaming } from '../common/chatStreaming';
import './cyberlab-ai.css';
import DigAvatar from '../characters/DigAvatar';

interface CyberLabAIProps {
  presentation?: 'dock' | 'floating';
  /** the site-wide general assistant: large launcher, no lab/lesson quick actions */
  floatingLauncher?: boolean;
  /** a small corner launcher that keeps the page's own lab/lesson behaviour — for editor and terminal
   *  workspaces, where a docked rail would take width away from the code */
  compactLauncher?: boolean;
  /** called fresh every time a message is sent, so hint/currentCode context is always up to date
   *  (currentCode in particular changes on every keystroke and shouldn't trigger re-renders here) */
  getContext: () => CyberLabAiContext;
}

interface PendingRequest {
  question: string;
  mode: CyberLabAiMode;
  hintLevel?: number;
  source?: 'library';
}

/** CBAI: the hint-first coding/lab mentor. Renders as a real docked panel — both collapsed (a slim
 *  launcher rail/bar) and open (the full chat panel) — so it always takes its own space in the
 *  page's flex layout instead of floating on top of the editor or terminal beside it and covering
 *  whatever the learner just typed; the browser's own layout engine finds the space, rather than
 *  any hand-rolled positioning math. Shares its context shape with the reading companion but with
 *  lab-specific behavior: a 5-level hint ladder instead of free explanation on demand, since handing
 *  over a working solution defeats the point of a graded lab. */
export default function CyberLabAI({ getContext, presentation = 'dock', floatingLauncher = false, compactLauncher = false }: CyberLabAIProps) {
  const floatingButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const lastRequest = useRef<PendingRequest | null>(null);

  useEffect(() => {
    // Offline answers need the local reading model; start loading it while the learner types.
    if (open && !navigator.onLine) void import('../../lib/offlineLibrary').then(m => m.warmLibraryReader());
  }, [open]);

  useEffect(() => {
    const research = (event: Event) => {
      const question = (event as CustomEvent<unknown>).detail;
      if (typeof question !== 'string') return;
      if (question.trim()) setInput(question);
      setOpen(true);
    };
    window.addEventListener('darkworld:research-term', research);
    return () => window.removeEventListener('darkworld:research-term', research);
  }, []);

  const send = async (question: string, mode: CyberLabAiMode, hintLevelForRequest?: number, source?: 'library') => {
    if (!question.trim() || loading) return;
    lastRequest.current = { question, mode, hintLevel: hintLevelForRequest, source };
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    const showProgress = (text: string) => setMessages((m) => [...withoutStreaming(m), { role: 'assistant', text, streaming: true }]);
    try {
      const result = await askCyberLabAi({ question, mode, hintLevel: hintLevelForRequest, source, history: messages.filter(m => m.role !== 'error').slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.text })), context: getContext() }, showProgress);
      setMessages((m) => [...withoutStreaming(m), { role: 'assistant', text: result.answer, model: result.model, citations: result.citations }]);
    } catch (err) {
      setMessages((m) => [
        ...withoutStreaming(m),
        { role: 'error', text: err instanceof Error ? err.message : 'Something went wrong — try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    const r = lastRequest.current;
    if (r) send(r.question, r.mode, r.hintLevel, r.source);
  };

  const requestNextHint = (source?: 'library') => {
    if (!navigator.onLine || source === 'library') {
      void send(`Find reference material about ${getContext().title}.`, 'ask', undefined, 'library');
      return;
    }
    const nextLevel = Math.min(hintLevel + 1, 5);
    setHintLevel(nextLevel);
    send(`Give me hint level ${nextLevel}.`, 'hint', nextLevel, source);
  };

  const context = getContext();
  const isLab = context.kind === 'lab';

  if (!open) {
    if (presentation === 'floating') {
      if (floatingLauncher) return <button ref={floatingButton} type="button" className="dig-floating-launcher" onClick={() => setOpen(true)} aria-label="Ask dig, your learning assistant"><DigAvatar size={54}/><span><strong>dig</strong><small>Ask a question</small></span></button>;
      if (compactLauncher) return <button ref={floatingButton} type="button" className="dig-floating-launcher is-compact" onClick={() => setOpen(true)} aria-label="Ask dig about this lab" title="Ask dig"><DigAvatar size={44}/></button>;
      return null;
    }
    // In-flow docked launcher, not a `fixed` overlay — a floating pill sitting on top of the
    // terminal/editor beside it would cover whatever the learner just typed on the line it lands
    // on. Sizing itself into the same flex row/column the open panel already docks into (see
    // below) reserves its own space instead, so it can never sit on top of terminal output.
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask dig"
        title="Ask dig"
        className="shrink-0 flex items-center justify-center gap-2 w-full h-11 lg:h-full lg:w-[112px] lg:flex-col border-t lg:border-t-0 lg:border-l border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)] transition-colors"
      >
        <DigAvatar size={55} />
        <span className="text-xs font-semibold text-center px-2">Ask dig</span>
      </button>
    );
  }

  return (
    <>
      <div aria-hidden className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden" onClick={() => setOpen(false)} />
      <div className={presentation === 'floating' ? 'fixed bottom-5 right-5 z-50 w-[400px] max-w-[calc(100vw-2.5rem)] h-[650px] max-h-[calc(100dvh-110px)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-hidden shadow-2xl' : 'fixed inset-x-0 bottom-0 z-50 h-[82vh] rounded-t-2xl border-t lg:border-t-0 lg:border-l border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-hidden shadow-2xl lg:relative lg:inset-auto lg:z-auto lg:h-full lg:w-[380px] lg:rounded-none lg:shadow-none shrink-0'}>
        <AiChatWindow
          title="dig"
          subtitle={floatingLauncher ? 'Your learning and library assistant' : `${isLab ? 'Hint-first lab mentor' : 'Concept explainer'} — ${context.title}`}
          emptyState={
            floatingLauncher ? 'Ask a question about cybersecurity, coding or your prepared books.' : isLab
              ? "Stuck? Ask for a hint — I'll never just hand you the answer. I climb a hint ladder, one small step at a time, so you actually learn the fix."
              : "Ask about this lesson. I’ll answer directly; you can ask for more detail when you need it."
          }
          messages={messages}
          loading={loading}
          quickActions={
            floatingLauncher ? [] : isLab
              ? [
                  {
                    key: 'hint',
                    label: hintLevel === 0 ? 'Get a Hint' : hintLevel >= 5 ? 'No more hints' : `Next Hint (${hintLevel + 1}/5)`,
                    onClick: requestNextHint,
                    disabled: hintLevel >= 5,
                  },
                  { key: 'explain', label: 'Explain Concept', onClick: source => send('Explain the concept this lab is testing.', 'explain', undefined, source) },
                  { key: 'error', label: 'Explain Error', onClick: source => send("Explain the error or unexpected output I'm seeing.", 'ask', undefined, source) },
                ]
              : [
                  { key: 'explain', label: 'Explain This Lesson', onClick: source => send('Explain this lesson.', 'explain', undefined, source) },
                  {
                    key: 'simpler',
                    label: 'Explain Simpler',
                    onClick: source => send('Explain this lesson in simpler terms, with an analogy.', 'ask', undefined, source),
                  },
                ]
          }
          input={input}
          onInputChange={setInput}
          onSubmit={(question, source) => send(question, 'ask', undefined, source)}
          onRetry={retry}
          onClose={() => { setOpen(false); if (floatingLauncher || compactLauncher) requestAnimationFrame(() => floatingButton.current?.focus()); }}
          placeholder={floatingLauncher ? 'Ask dig a question…' : isLab ? 'Ask about this lab…' : 'Ask about this lesson…'}
        />
      </div>
    </>
  );
}
