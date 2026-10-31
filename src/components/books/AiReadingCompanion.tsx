import { useEffect, useRef, useState } from 'react';
import { askAiTutor, type AiTutorMode } from '../../lib/aiTutor';
import AiChatWindow, { type ChatMessage } from '../common/AiChatWindow';
import type { PdfViewerHandle } from './PdfViewer';
import DigAvatar from '../characters/DigAvatar';

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

interface PendingRequest {
  question: string;
  mode: AiTutorMode;
  source?: 'library';
}

/** A floating chat bubble that reads whatever page the visitor currently has open and answers
 *  questions about it via a fast hosted model (Groq primary, or Gemini with real Google Search
 *  grounding when the question needs current information) — never a claim of running its own AI,
 *  and never given the whole book, only the real text of the current page. */
export default function AiReadingCompanion({ bookTitle, currentPage, viewerRef }: AiReadingCompanionProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const lastRequest = useRef<PendingRequest | null>(null);

  useEffect(() => {
    const research = (event: Event) => {
      const question = (event as CustomEvent<unknown>).detail;
      if (typeof question !== 'string') return;
      if (question.trim()) setInput(question.replaceAll('this lesson', 'this book page'));
      setOpen(true);
    };
    window.addEventListener('darkworld:research-term', research);
    return () => window.removeEventListener('darkworld:research-term', research);
  }, []);

  const send = async (question: string, mode: AiTutorMode, source?: 'library') => {
    if (!question.trim() || loading) return;
    lastRequest.current = { question, mode, source };
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const pageText = (await viewerRef.current?.getPageText(currentPage)) ?? '';
      const result = await askAiTutor({ question, bookTitle, pageNum: currentPage, pageText, mode, source });
      setMessages((m) => [...m, { role: 'assistant', text: result.answer, model: result.model, citations: result.citations }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'error', text: err instanceof Error ? err.message : 'Something went wrong — try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    const r = lastRequest.current;
    if (r) send(r.question, r.mode, r.source);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full shadow-lg bg-[var(--color-accent)] text-white font-semibold text-sm hover:brightness-110 transition"
      >
        <DigAvatar size={38} />
        Ask dig
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-4rem)] rounded-2xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-hidden">
      <AiChatWindow
        title="dig"
        subtitle={currentPage > 0 ? `${bookTitle} — page ${currentPage}` : `Library research — ${bookTitle}`}
        emptyState={currentPage > 0 ? 'Ask about this page. Online AI receives its text; saved-library search uses your prepared books and shows cited passages.' : 'Ask about this topic. The external resource’s full text is not available to dig. Saved-library search uses books you have prepared on this device.'}
        messages={messages}
        loading={loading}
        quickActions={(currentPage > 0 ? QUICK_ACTIONS : []).map((qa) => ({
          key: qa.mode,
          label: qa.label,
          onClick: source => send(qa.question, qa.mode, source),
        }))}
        input={input}
        onInputChange={setInput}
        onSubmit={(question, source) => send(question, 'ask', source)}
        onRetry={retry}
        onClose={() => setOpen(false)}
        placeholder="Ask about this page…"
      />
    </div>
  );
}
