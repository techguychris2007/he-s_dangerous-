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
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <IconLightning className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-extrabold tracking-tight text-[var(--color-heading)]">{title}</div>
            <div className="mt-0.5 truncate text-xs text-[var(--color-text-dim)]">{subtitle}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-lg leading-none text-[var(--color-text-dim)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]"
        >
          &times;
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--color-bg)]/35 px-3 py-4">
        {messages.length === 0 && (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6 text-center shadow-sm">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
            >
              <IconLightning className="h-5 w-5" />
            </span>
            <p className="max-w-[26rem] text-sm leading-6 text-[var(--color-text-dim)]">{emptyState}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`group flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && (
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-2xs font-bold ${m.role === 'error' ? 'bg-[var(--color-danger)] text-white' : 'border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'}`}
              >
                {m.role === 'error' ? '!' : 'AI'}
              </span>
            )}
            <div className="max-w-[85%] min-w-0">
              <div
                className={`inline-block max-w-full rounded-2xl px-4 py-3 text-left shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[var(--color-accent)] text-sm leading-6 text-white whitespace-pre-wrap'
                    : m.role === 'error'
                      ? 'border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/10 text-sm leading-6 text-[var(--color-danger)] whitespace-pre-wrap'
                      : 'ai-response border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
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
                <div className="mt-1 flex items-center gap-2.5 px-1">
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 text-2xs font-bold text-[var(--color-accent)]"
            >
              AI
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-dim)] shadow-sm">
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
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
          {quickActions.map((qa) => (
            <button
              key={qa.key}
              disabled={loading || qa.disabled}
              onClick={qa.onClick}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-bold text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-heading)] disabled:cursor-not-allowed disabled:opacity-50"
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
        className="flex shrink-0 items-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3"
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
          className="flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm leading-6 text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 disabled:opacity-50"
          style={{ minHeight: '2.25rem', maxHeight: TEXTAREA_MAX_PX }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
