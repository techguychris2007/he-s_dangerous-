import { LABS } from '../data/labs';
import { useProgress } from '../state/progressStore';
import { IconTrophy, IconFlag } from '../components/layout/icons';

const POINTS: Record<string, number> = { Easy: 10, Medium: 20, Hard: 30 };

export default function LeaderboardPage() {
  const progress = useProgress();
  const initial = (progress.learnerName ?? '?').trim().charAt(0).toUpperCase();

  const labsCompleted = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
  const points = LABS.reduce((sum, l) => {
    const done = progress.flagCount(l.scenario.id) >= l.scenario.totalFlags;
    return sum + (done ? POINTS[l.scenario.difficulty] ?? 10 : 0);
  }, 0);
  const maxPoints = LABS.reduce((sum, l) => sum + (POINTS[l.scenario.difficulty] ?? 10), 0);

  return (
    <div className="max-w-3xl mx-auto px-8 py-14">
      <div className="text-[var(--color-accent)] font-mono text-sm mb-2">// where you stand</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3 flex items-center gap-3">
        <IconTrophy className="w-7 h-7 text-[var(--color-accent)]" /> Leaderboard
      </h1>

      <div className="rounded-xl border border-[var(--color-warn)]/40 bg-[var(--color-warn)]/5 p-4 mb-8 text-sm text-[var(--color-text)] leading-relaxed">
        HackerHub runs entirely in your own browser — there is no server tracking other learners, so a real
        ranked leaderboard against other people isn't something this platform can honestly show you. What
        you get instead is your own score, tracked exactly the way a leaderboard entry would be.
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex items-center gap-5">
        <span className="w-8 h-8 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent-dim)] font-bold flex items-center justify-center text-sm shrink-0">
          1
        </span>
        <span className="w-14 h-14 rounded-full bg-[var(--color-accent)] text-white text-xl font-bold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[var(--color-heading)] truncate">{progress.learnerName}</div>
          <div className="text-xs text-[var(--color-text-dim)] flex items-center gap-1.5">
            <IconFlag className="w-3 h-3" /> {labsCompleted}/{LABS.length} labs completed
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold text-[var(--color-accent-dim)] font-mono">{points}</div>
          <div className="text-[11px] text-[var(--color-text-dim)]">/ {maxPoints} pts</div>
        </div>
      </div>
    </div>
  );
}
