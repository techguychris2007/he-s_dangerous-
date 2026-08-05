import { useEffect, useState } from 'react';
import { useAuth } from '../../state/authStore';
import { submitLabRating, fetchMyLabRating, type DifficultyFeedback } from '../../lib/labRatings';
import StarRating from '../common/StarRating';
import { IconCheck } from '../layout/icons';

const DIFFICULTY_OPTIONS: { value: DifficultyFeedback; label: string }[] = [
  { value: 'too_easy', label: 'Too easy' },
  { value: 'just_right', label: 'Just right' },
  { value: 'too_hard', label: 'Too hard' },
];

/** Shown once a lab is fully complete — a quick "how was this" signal (star rating + whether the
 *  difficulty label matched reality) that feeds `lab_rating_summary()` and, from there, the average
 *  shown on the lab's own card in the catalog. Prefills from any existing rating so reopening a
 *  completed lab shows what was already submitted instead of a blank form. */
export default function LabRatingWidget({ labId }: { labId: string }) {
  const auth = useAuth();
  const [rating, setRating] = useState(0);
  const [difficultyFeedback, setDifficultyFeedback] = useState<DifficultyFeedback | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!auth.user) return;
    setLoaded(false);
    fetchMyLabRating(auth.user.id, labId).then((existing) => {
      if (existing) {
        setRating(existing.rating);
        setDifficultyFeedback(existing.difficultyFeedback);
      }
      setLoaded(true);
    });
  }, [auth.user, labId]);

  const save = async (nextRating: number, nextDifficulty: DifficultyFeedback | null) => {
    if (!auth.user || saving) return;
    setSaving(true);
    setSaved(false);
    const result = await submitLabRating(auth.user.id, labId, nextRating, nextDifficulty);
    setSaving(false);
    if (result.ok) setSaved(true);
  };

  if (!auth.user || !loaded) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-6">
      <div className="text-sm font-semibold text-[var(--color-heading)] mb-2.5">Rate this lab</div>
      <div className="flex items-center gap-3 mb-3">
        <StarRating
          value={rating}
          size="w-5 h-5"
          onChange={(next) => {
            setRating(next);
            save(next, difficultyFeedback);
          }}
        />
        {saved && !saving && (
          <span className="flex items-center gap-1 text-2xs text-[var(--color-success)] font-semibold">
            <IconCheck className="w-3 h-3" /> Saved
          </span>
        )}
      </div>
      {rating > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                const next = difficultyFeedback === opt.value ? null : opt.value;
                setDifficultyFeedback(next);
                save(rating, next);
              }}
              aria-pressed={difficultyFeedback === opt.value}
              className={`px-2.5 py-1 rounded-full text-2xs font-semibold border transition-colors ${
                difficultyFeedback === opt.value
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
