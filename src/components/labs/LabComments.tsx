import { useEffect, useState } from 'react';
import { useAuth } from '../../state/authStore';
import { fetchLabComments, postLabComment, deleteLabComment, type LabComment } from '../../lib/labComments';
import { IconMessage, IconX } from '../layout/icons';

/** A flat discussion thread per lab — deliberately not a general forum, just "other learners stuck on
 *  the same step can help each other," reached from every lab page regardless of completion status
 *  (unlike the rating widget, which only makes sense once you're done). Any authenticated learner can
 *  read every comment on a lab; only the author can delete their own. */
export default function LabComments({ labId }: { labId: string }) {
  const auth = useAuth();
  const [comments, setComments] = useState<LabComment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchLabComments(labId)
      .then(setComments)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user || posting || !message.trim()) return;
    setPosting(true);
    setError(null);
    const result = await postLabComment(auth.user.id, labId, message);
    setPosting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage('');
    load();
  };

  const remove = async (id: string) => {
    if (!comments) return;
    setComments(comments.filter((c) => c.id !== id));
    const ok = await deleteLabComment(id);
    if (!ok) load();
  };

  if (!auth.user) return null;

  return (
    <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-3">
        <IconMessage className="w-4 h-4 text-[var(--color-accent)]" />
        <h2 className="text-sm font-bold text-[var(--color-heading)] uppercase tracking-wide">
          Discussion{comments && comments.length > 0 ? ` (${comments.length})` : ''}
        </h2>
      </div>

      <form onSubmit={submit} className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Stuck, or have a tip for the next person? Ask or share here — no flag spoilers."
          rows={2}
          maxLength={2000}
          className="w-full text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text)] resize-none leading-relaxed focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] outline-none"
        />
        {error && <div className="text-2xs text-[var(--color-danger)] mt-1">{error}</div>}
        <button
          type="submit"
          disabled={posting || !message.trim()}
          className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {posting ? 'Posting…' : 'Post comment'}
        </button>
      </form>

      {loading ? (
        <div className="text-xs text-[var(--color-text-dim)]">Loading discussion…</div>
      ) : !comments ? (
        <div className="text-xs text-[var(--color-text-dim)]">Discussion isn't available right now.</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-[var(--color-text-dim)]">No comments yet — be the first.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 group">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-[var(--color-heading)]">{c.displayName}</span>
                <span className="flex items-center gap-2">
                  <span className="text-2xs text-[var(--color-text-dim)]">{new Date(c.createdAt).toLocaleDateString()}</span>
                  {c.userId === auth.user?.id && (
                    <button
                      onClick={() => remove(c.id)}
                      aria-label="Delete comment"
                      title="Delete your comment"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-[var(--color-text-dim)] hover:text-[var(--color-danger)]"
                    >
                      <IconX className="w-3 h-3" />
                    </button>
                  )}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{c.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
