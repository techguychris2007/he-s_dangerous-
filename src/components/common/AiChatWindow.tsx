import { useEffect, useRef, useState } from 'react';
import MarkdownText from './MarkdownText';
import { IconLightning, IconExternal, IconCopy, IconCheck, IconRefresh } from '../layout/icons';
import type { Citation } from '../../lib/aiTutor';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
  model?: string;
  citations?: Citation[];
}

export interface QuickAction {
  key: string;
  label: string;
  onClick: () => void;
  /** an extra condition beyond the shared `loading` flag (e.g. "hint ladder exhausted") */
  disabled?: boolean;
}

interface AiChatWindowProps {
  title: string;
  subtitle: string;
  emptyState: string;
  messages: ChatMessage[];
  loading: boolean;
  quickActions: QuickAction[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (question: string) => void;
  /** re-sends whatever the last user question was — the caller tracks that, since it already
   *  knows the mode/hint-level that question needs, which this shared shell doesn't. */
  onRetry: () => void;
  onClose: () => void;
  placeholder: string;
}

const TEXTAREA_MAX_PX = 112;

/** Shared chat shell for both AI companions on the platform (CyberLab AI's lab/lesson mentor and the
 *  book reader's Reading Companion) — same header/message-list/quick-actions/composer chrome and the
 *  same UX niceties (autofocus, Escape-to-close, autosizing input, copy/retry) in one place, so the two
 *  callers only own their domain logic (what question to send, in what mode) and never drift apart
 *  visually. Deliberately fills whatever box the caller positions it in (floating bubble vs docked
 *  side panel) rather than owning its own placement. */
export default function AiChatWindow({
  title,
  subtitle,
  emptyState,
  messages,
  loading,
  quickActions,
  input,
  onInputChange,
  onSubmit,
  onRetry,
  onClose,
  placeholder,
}: AiChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, [messages.length, loading]);

  const submitCurrent = () => {
    if (!input.trim() || loading) return;
    onSubmit(input);
  };

  const copy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((c) => (c === index ? null : c)), 1500);
    });
  };

  const autosize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  };

  return (
    <div
      className="flex flex-col h-full min-h-0"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] text-white shrink-0">
        <div className="min-w-0">
          <div className="text-sm font-bold flex items-center gap-1.5">
            <IconLightning className="w-4 h-4" /> {title}
          </div>
          <div className="text-2xs text-white/80 truncate">{subtitle}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-white/80 hover:text-white text-lg leading-none px-1 shrink-0"
        >
          &times;
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-2 px-4 py-6">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))' }}
            >
              <IconLightning className="w-4 h-4" />
            </span>
            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed max-w-[26rem]">{emptyState}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`group flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && (
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-2xs font-bold"
                style={{
                  background:
                    m.role === 'error' ? 'var(--color-danger)' : 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
                }}
              >
                {m.role === 'error' ? '!' : 'AI'}
              </span>
            )}
            <div className="max-w-[85%] min-w-0">
              <div
                className={`inline-block max-w-full text-left rounded-xl px-3 py-2.5 ${
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
              {(m.model || m.role === 'assistant' || m.role === 'error') && (
                <div className="flex items-center gap-2.5 mt-0.5 px-0.5">
                  {m.model && <span className="text-2xs text-[var(--color-text-dim)]">via {m.model}</span>}
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => copy(m.text, i)}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-2xs text-[var(--color-text-dim)] hover:text-[var(--color-heading)] flex items-center gap-1"
                    >
                      {copiedIndex === i ? (
                        <>
                          <IconCheck className="w-2.5 h-2.5" /> Copied
                        </>
                      ) : (
                        <>
                          <IconCopy className="w-2.5 h-2.5" /> Copy
                        </>
                      )}
                    </button>
                  )}
                  {m.role === 'error' && (
                    <button
                      onClick={onRetry}
                      className="text-2xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
                    >
                      <IconRefresh className="w-2.5 h-2.5" /> Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-2xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))' }}
            >
              AI
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)] rounded-xl bg-[var(--color-surface-2)] px-3 py-2.5">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce" />
              </span>
              Thinking&hellip;
            </div>
          </div>
        )}
      </div>

      {quickActions.length > 0 && (
        <div className="px-3 py-2 border-t border-[var(--color-border)] flex flex-wrap gap-1.5 shrink-0">
          {quickActions.map((qa) => (
            <button
              key={qa.key}
              disabled={loading || qa.disabled}
              onClick={qa.onClick}
              className="px-2 py-1 rounded-md text-2xs font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {qa.label}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitCurrent();
        }}
        className="flex items-end gap-2 px-3 py-3 border-t border-[var(--color-border)] shrink-0"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            onInputChange(e.target.value);
            autosize(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submitCurrent();
            }
          }}
          placeholder={placeholder}
          disabled={loading}
          rows={1}
          className="flex-1 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] disabled:opacity-50 resize-none leading-snug"
          style={{ minHeight: '2.25rem', maxHeight: TEXTAREA_MAX_PX }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
