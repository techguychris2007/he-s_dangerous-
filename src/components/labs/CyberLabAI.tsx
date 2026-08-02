import { useRef, useState } from 'react';
import { askCyberLabAi, type CyberLabAiContext, type Citation } from '../../lib/aiTutor';
import MarkdownText from '../common/MarkdownText';
import { IconLightning, IconExternal } from '../layout/icons';

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
  model?: string;
  citations?: Citation[];
}

interface CyberLabAIProps {
  /** called fresh every time a message is sent, so hint/currentCode context is always up to date
   *  (currentCode in particular changes on every keystroke and shouldn't trigger re-renders here) */
  getContext: () => CyberLabAiContext;
}

/** CBAI: the hint-first coding/lab mentor. Renders as a real docked panel (not a floating overlay)
 *  when open, so it takes its own space in the page's flex layout instead of covering the editor
 *  or terminal beside it — the browser's own layout engine finds the space, rather than any
 *  hand-rolled positioning math. Shares its context shape with the reading companion but with
 *  lab-specific behavior: a 5-level hint ladder instead of free explanation on demand, since handing
 *  over a working solution defeats the point of a graded lab. */
export default function CyberLabAI({ getContext }: CyberLabAIProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const send = async (question: string, mode: 'hint' | 'explain' | 'ask', hintLevelForRequest?: number) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    scrollToBottom();
    try {
      const result = await askCyberLabAi({ question, mode, hintLevel: hintLevelForRequest, context: getContext() });
      setMessages((m) => [...m, { role: 'assistant', text: result.answer, model: result.model, citations: result.citations }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'error', text: err instanceof Error ? err.message : 'Something went wrong — try again.' },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const requestNextHint = () => {
    const nextLevel = Math.min(hintLevel + 1, 5);
    setHintLevel(nextLevel);
    send(`Give me hint level ${nextLevel}.`, 'hint', nextLevel);
  };

  const isLab = getContext().kind === 'lab';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full shadow-lg bg-[var(--color-accent)] text-white font-semibold text-sm hover:brightness-110 transition"
      >
        <IconLightning className="w-4 h-4" />
        CyberLab AI
      </button>
    );
  }

  return (
    <div className="w-full sm:w-[380px] shrink-0 h-full max-h-full border-l border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] text-white shrink-0">
        <div className="min-w-0">
          <div className="text-sm font-bold flex items-center gap-1.5">
            <IconLightning className="w-4 h-4" /> CyberLab AI
          </div>
          <div className="text-2xs text-white/80 truncate">
            {isLab ? 'Hint-first lab mentor' : 'Concept explainer'} — {getContext().title}
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none px-1 shrink-0" aria-label="Close">
          &times;
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-[var(--color-text-dim)] leading-relaxed px-1">
            {isLab
              ? 'Stuck? Ask for a hint — I\'ll never just hand you the answer. I climb a hint ladder, one small step at a time, so you actually learn the fix.'
              : 'Ask me anything about this lesson — I\'ll explain it plainly, then technically, with a real example.'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block max-w-[95%] text-left rounded-xl px-3 py-2.5 ${
                m.role === 'user'
                  ? 'bg-[var(--color-accent)] text-white text-xs leading-relaxed whitespace-pre-wrap'
                  : m.role === 'error'
                    ? 'bg-[var(--color-danger)]/15 text-[var(--color-danger)] text-xs leading-relaxed whitespace-pre-wrap'
                    : 'ai-response bg-[var(--color-surface-2)]'
              }`}
            >
              {m.role === 'assistant' ? <MarkdownText text={m.text} /> : m.text}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border)]/50 flex flex-wrap gap-1.5">
                  {m.citations.map((c, ci) => (
                    <a
                      key={ci}
                      href={c.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={c.title}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-2xs font-semibold hover:bg-[var(--color-accent)]/20"
                    >
                      {ci + 1} <IconExternal className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            {m.model && <div className="text-2xs text-[var(--color-text-dim)] mt-0.5">via {m.model}</div>}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] px-1">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce" />
            </span>
            Thinking&hellip;
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-[var(--color-border)] flex flex-wrap gap-1.5 shrink-0">
        {isLab ? (
          <>
            <button
              disabled={loading || hintLevel >= 5}
              onClick={requestNextHint}
              className="px-2 py-1 rounded-md text-2xs font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50"
            >
              {hintLevel === 0 ? 'Get a Hint' : hintLevel >= 5 ? 'No more hints' : `Next Hint (${hintLevel + 1}/5)`}
            </button>
            <button
              disabled={loading}
              onClick={() => send('Explain the concept this lab is testing.', 'explain')}
              className="px-2 py-1 rounded-md text-2xs font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50"
            >
              Explain Concept
            </button>
            <button
              disabled={loading}
              onClick={() => send('Explain the error or unexpected output I\'m seeing.', 'ask')}
              className="px-2 py-1 rounded-md text-2xs font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50"
            >
              Explain Error
            </button>
          </>
        ) : (
          <>
            <button
              disabled={loading}
              onClick={() => send('Explain this lesson.', 'explain')}
              className="px-2 py-1 rounded-md text-2xs font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50"
            >
              Explain This Lesson
            </button>
            <button
              disabled={loading}
              onClick={() => send('Explain this lesson in simpler terms, with an analogy.', 'ask')}
              className="px-2 py-1 rounded-md text-2xs font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50"
            >
              Explain Simpler
            </button>
          </>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input, 'ask');
        }}
        className="flex items-center gap-2 px-3 py-3 border-t border-[var(--color-border)] shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLab ? 'Ask about this lab…' : 'Ask about this lesson…'}
          disabled={loading}
          className="flex-1 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
