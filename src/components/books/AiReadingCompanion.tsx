import { useRef, useState } from 'react';
import { askAiTutor, type AiTutorMode } from '../../lib/aiTutor';
import AiChatWindow, { type ChatMessage } from '../common/AiChatWindow';
import type { PdfViewerHandle } from './PdfViewer';
import { IconLightning } from '../layout/icons';

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

  const send = async (question: string, mode: AiTutorMode) => {
    if (!question.trim() || loading) return;
    lastRequest.current = { question, mode };
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const pageText = (await viewerRef.current?.getPageText(currentPage)) ?? '';
      const result = await askAiTutor({ question, bookTitle, pageNum: currentPage, pageText, mode });
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
    if (r) send(r.question, r.mode);
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
    <div className="fixed bottom-5 right-5 z-40 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-4rem)] rounded-2xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-hidden">
      <AiChatWindow
        title="Reading Companion"
        subtitle={`${bookTitle} — page ${currentPage}`}
        emptyState="Ask me anything about this page, or use a quick action below. I only read the page you're currently on — not the whole book — and I'm not part of this book's original text, just a reading aid."
        messages={messages}
        loading={loading}
        quickActions={QUICK_ACTIONS.map((qa) => ({
          key: qa.mode,
          label: qa.label,
          onClick: () => send(qa.question, qa.mode),
        }))}
        input={input}
        onInputChange={setInput}
        onSubmit={(question) => send(question, 'ask')}
        onRetry={retry}
        onClose={() => setOpen(false)}
        placeholder="Ask about this page…"
      />
    </div>
  );
}
