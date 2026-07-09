import { LABS } from '../data/labs';
import { MODULES } from '../data/curriculum';
import { useProgress } from '../state/progressStore';
import { IconUser, IconFlag, IconCheck, IconBookmark } from '../components/layout/icons';

const POINTS: Record<string, number> = { Easy: 10, Medium: 20, Hard: 30 };

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3">
      <span className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div>
        <div className="text-xl font-extrabold text-[var(--color-heading)] leading-none mb-1">{value}</div>
        <div className="text-xs text-[var(--color-text-dim)]">{label}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const progress = useProgress();
  const initial = (progress.learnerName ?? '?').trim().charAt(0).toUpperCase();

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = Object.values(progress.completedLessons).filter(Boolean).length;
  const labsCompleted = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
  const totalFlags = LABS.reduce((sum, l) => sum + progress.flagCount(l.scenario.id), 0);
  const bookmarked = Object.values(progress.bookmarkedLabs).filter(Boolean).length;
  const quizzesTaken = Object.keys(progress.quizScores).length;
  const avgQuizScore = quizzesTaken
    ? Math.round(Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / quizzesTaken)
    : 0;
  const points = LABS.reduce((sum, l) => {
    const done = progress.flagCount(l.scenario.id) >= l.scenario.totalFlags;
    return sum + (done ? POINTS[l.scenario.difficulty] ?? 10 : 0);
  }, 0);

  return (
    <div className="max-w-3xl mx-auto px-8 py-14">
      <div className="text-[var(--color-accent)] font-mono text-sm mb-2">// your progress</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-8">Profile</h1>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex items-center gap-4 mb-8">
        <span className="w-16 h-16 rounded-full bg-[var(--color-navy)] text-white text-2xl font-bold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="text-lg font-bold text-[var(--color-heading)] truncate">{progress.learnerName}</div>
          <div className="text-sm text-[var(--color-text-dim)]">Cybersecurity &middot; Offensive Security track</div>
          <div className="text-xs text-[var(--color-accent-dim)] font-mono font-bold mt-1">{points} pts earned</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Lessons completed" value={`${completedLessons}/${totalLessons}`} icon={<IconCheck className="w-5 h-5" />} />
        <StatCard label="Labs completed" value={`${labsCompleted}/${LABS.length}`} icon={<IconFlag className="w-5 h-5" />} />
        <StatCard label="Total flags captured" value={totalFlags} icon={<IconFlag className="w-5 h-5" />} />
        <StatCard label="Bookmarked labs" value={bookmarked} icon={<IconBookmark className="w-5 h-5" />} />
        <StatCard label="Quizzes taken" value={quizzesTaken} icon={<IconUser className="w-5 h-5" />} />
        <StatCard label="Average quiz score" value={`${avgQuizScore}%`} icon={<IconUser className="w-5 h-5" />} />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-dim)] leading-relaxed">
        Your name and every stat above lives only in this browser's local storage — there is no account, no
        server, and no way for anyone else to see this profile. Clearing your browser data resets it
        completely.
      </div>
    </div>
  );
}
