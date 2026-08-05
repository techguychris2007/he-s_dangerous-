import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../state/authStore';
import { submitFeedback, fetchMyFeedback, type FeedbackCategory, type FeedbackEntry } from '../lib/feedback';
import { IconMail, IconCheck } from '../components/layout/icons';

const CATEGORIES: { value: FeedbackCategory; label: string; hint: string }[] = [
  { value: 'bug', label: 'Bug report', hint: 'Something broke, looked wrong, or a lab/lesson didn\'t behave as described.' },
  { value: 'content', label: 'Content issue', hint: 'A lesson, lab briefing, or flag is inaccurate, unclear, or out of date.' },
  { value: 'suggestion', label: 'Suggestion', hint: 'An idea for a new lab, feature, or improvement to how something works.' },
  { value: 'other', label: 'Other', hint: 'Anything that doesn\'t fit the categories above.' },
];

const CATEGORY_LABEL: Record<FeedbackCategory, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])) as Record<FeedbackCategory, string>;

export default function FeedbackPage() {
  const auth = useAuth();
  const location = useLocation();
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [history, setHistory] = useState<FeedbackEntry[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = () => {
    setHistoryLoading(true);
    fetchMyFeedback()
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadHistory();
    // Intentionally runs once on mount only — resubmitting refreshes the list explicitly below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user || submitting) return;
    setSubmitting(true);
    setError(null);
    setJustSubmitted(false);
    const result = await submitFeedback(auth.user.id, category, message, location.pathname);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage('');
    setJustSubmitted(true);
    loadHistory();
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// tell us what's not working</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3 flex items-center gap-3">
        <IconMail className="w-7 h-7 text-[var(--color-accent)]" /> Feedback
      </h1>
      <p className="text-[var(--color-text-dim)] mb-8 leading-relaxed max-w-2xl">
        Found a bug, spotted something wrong in a lesson or lab, or have an idea? This goes straight into a
        real inbox tied to your account — not a mailto link that might go nowhere.
      </p>

      <form onSubmit={submit} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              title={c.hint}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors text-left ${
                category === c.value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-heading)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={CATEGORIES.find((c) => c.value === category)?.hint}
          rows={5}
          maxLength={4000}
          required
          className="w-full text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[var(--color-text)] resize-none leading-relaxed focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] outline-none"
        />
        <div className="flex items-center justify-between mt-1 mb-4">
          <span className="text-2xs text-[var(--color-text-dim)]">
            Sent as your account — page: <code className="text-[var(--color-accent-2)]">{location.pathname}</code>
          </span>
          <span className="text-2xs text-[var(--color-text-dim)]">{message.length}/4000</span>
        </div>

        {error && (
          <div className="text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-lg px-3 py-2 mb-4 leading-relaxed">
            {error}
          </div>
        )}
        {justSubmitted && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg px-3 py-2 mb-4">
            <IconCheck className="w-3.5 h-3.5 shrink-0" /> Sent — thanks, this is now in the inbox.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Sending…' : 'Send feedback'}
        </button>
      </form>

      <h2 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wide mb-3">Your submissions</h2>
      {historyLoading ? (
        <div className="text-sm text-[var(--color-text-dim)]">Loading…</div>
      ) : !history ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-dim)]">
          Couldn't load your submission history right now — your feedback above still sends fine either way.
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-dim)]">
          Nothing submitted yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((h) => (
            <div key={h.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{CATEGORY_LABEL[h.category]}</span>
                {h.pagePath && <span className="text-2xs text-[var(--color-text-dim)] font-mono">{h.pagePath}</span>}
                <span className="text-2xs text-[var(--color-text-dim)] ml-auto">{new Date(h.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{h.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
