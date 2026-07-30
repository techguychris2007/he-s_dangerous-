import { useRef, useState } from 'react';
import { askAiTutor, type AiTutorMode } from '../../lib/aiTutor';
import type { PdfViewerHandle } from './PdfViewer';
import { IconLightning } from '../layout/icons';

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
  model?: string;
}

interface AiReadingCompanionProps {
  bookTitle: string;
  currentPage: number;
  viewerRef: React.RefObject<PdfViewerHandle | null>;
}

const QUICK_ACTIONS: { mode: AiTutorMode; label: string; question: string }[] = [
  { mode: 'explain', label: 'Explain This Page', question: 'Explain what this page is about.' },
  { mode: 'simplify', label: 'Explain Simpler', question: 'Explain this page in simpler terms, like I\'m new to the topic.' },
  { mode: 'summarize', label: 'Summarize', question: 'Summarize this page.' },
  { mode: 'example', label: 'Give Example', question: 'Give a concrete example that illustrates this page\'s main idea.' },
  { mode: 'takeaways', label: 'Key Takeaways', question: 'What are the key takeaways from this page?' },
];

/** A floating chat bubble that reads whatever page the visitor currently has open and answers
 *  questions about it via a fast hosted model (Groq primary, Gemini fallback) — never a claim of
 *  running its own AI, and never given the whole book, only the real text of the current page. */
export default function AiReadingCompanion({ bookTitle, currentPage, viewerRef }: AiReadingCompanionProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const send = async (question: string, mode: AiTutorMode) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    scrollToBottom();
    try {
      const pageText = (await viewerRef.current?.getPageText(currentPage)) ?? '';
      const result = await askAiTutor({ question, bookTitle, pageNum: currentPage, pageText, mode });
      setMessages((m) => [...m, { role: 'assistant', text: result.answer, model: result.model }]);
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full shadow-lg bg-[var(--color-accent)] text-white font-semibold text-sm hover:brightness-110 transition"
      >
        <IconLightning className="w-4 h-4" />
        Reading Companion
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[380px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100vh-4rem)] rounded-2xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-accent)] text-white">
        <div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <IconLightning className="w-4 h-4" /> Reading Companion
          </div>
          <div className="text-[11px] text-white/80 truncate max-w-[280px]">
            {bookTitle} — page {currentPage}
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none px-1" aria-label="Close">
          &times;
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-[var(--color-text-dim)] leading-relaxed px-1">
            Ask me anything about this page, or use a quick action below. I only read the page you're
            currently on — not the whole book — and I'm not part of this book's original text, just a
            reading aid.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block max-w-[90%] text-left rounded-xl px-3 py-2.5 whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[var(--color-accent)] text-white text-xs leading-relaxed'
                  : m.role === 'error'
                    ? 'bg-[var(--color-danger)]/15 text-[var(--color-danger)] text-xs leading-relaxed'
                    : 'ai-response bg-[var(--color-surface-2)]'
              }`}
            >
              {m.text}
            </div>
            {m.model && <div className="text-[10px] text-[var(--color-text-dim)] mt-0.5">via {m.model}</div>}
          </div>
        ))}
        {loading && <div className="text-xs text-[var(--color-text-dim)] px-1">Thinking&hellip;</div>}
      </div>

      <div className="px-3 py-2 border-t border-[var(--color-border)] flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.mode}
            disabled={loading}
            onClick={() => send(qa.question, qa.mode)}
            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50"
          >
            {qa.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input, 'ask');
        }}
        className="flex items-center gap-2 px-3 py-3 border-t border-[var(--color-border)]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this page…"
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
