import { useRef, useState } from 'react';
import { askCyberLabAi, type CyberLabAiContext, type CyberLabAiMode } from '../../lib/aiTutor';
import AiChatWindow, { type ChatMessage } from '../common/AiChatWindow';
import { IconLightning } from '../layout/icons';

interface CyberLabAIProps {
  /** called fresh every time a message is sent, so hint/currentCode context is always up to date
   *  (currentCode in particular changes on every keystroke and shouldn't trigger re-renders here) */
  getContext: () => CyberLabAiContext;
}

interface PendingRequest {
  question: string;
  mode: CyberLabAiMode;
  hintLevel?: number;
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
  const lastRequest = useRef<PendingRequest | null>(null);

  const send = async (question: string, mode: CyberLabAiMode, hintLevelForRequest?: number) => {
    if (!question.trim() || loading) return;
    lastRequest.current = { question, mode, hintLevel: hintLevelForRequest };
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
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
    }
  };

  const retry = () => {
    const r = lastRequest.current;
    if (r) send(r.question, r.mode, r.hintLevel);
  };

  const requestNextHint = () => {
    const nextLevel = Math.min(hintLevel + 1, 5);
    setHintLevel(nextLevel);
    send(`Give me hint level ${nextLevel}.`, 'hint', nextLevel);
  };

  const context = getContext();
  const isLab = context.kind === 'lab';

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
      <AiChatWindow
        title="CyberLab AI"
        subtitle={`${isLab ? 'Hint-first lab mentor' : 'Concept explainer'} — ${context.title}`}
        emptyState={
          isLab
            ? "Stuck? Ask for a hint — I'll never just hand you the answer. I climb a hint ladder, one small step at a time, so you actually learn the fix."
            : "Ask me anything about this lesson — I'll explain it plainly, then technically, with a real example."
        }
        messages={messages}
        loading={loading}
        quickActions={
          isLab
            ? [
                {
                  key: 'hint',
                  label: hintLevel === 0 ? 'Get a Hint' : hintLevel >= 5 ? 'No more hints' : `Next Hint (${hintLevel + 1}/5)`,
                  onClick: requestNextHint,
                  disabled: hintLevel >= 5,
                },
                { key: 'explain', label: 'Explain Concept', onClick: () => send('Explain the concept this lab is testing.', 'explain') },
                { key: 'error', label: 'Explain Error', onClick: () => send("Explain the error or unexpected output I'm seeing.", 'ask') },
              ]
            : [
                { key: 'explain', label: 'Explain This Lesson', onClick: () => send('Explain this lesson.', 'explain') },
                {
                  key: 'simpler',
                  label: 'Explain Simpler',
                  onClick: () => send('Explain this lesson in simpler terms, with an analogy.', 'ask'),
                },
              ]
        }
        input={input}
        onInputChange={setInput}
        onSubmit={(question) => send(question, 'ask')}
        onRetry={retry}
        onClose={() => setOpen(false)}
        placeholder={isLab ? 'Ask about this lab…' : 'Ask about this lesson…'}
      />
    </div>
  );
}
