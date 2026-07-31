import { Link } from 'react-router-dom';
import { MODULES } from '../data/curriculum';
import { LABS } from '../data/labs';
import { useProgress } from '../state/progressStore';
import { IconCheck } from '../components/layout/icons';
import StatCard from '../components/common/StatCard';

export default function ProgressPage() {
  const progress = useProgress();

  const allLessons = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleSlug: m.slug, moduleTitle: m.title })));
  const completedLessons = allLessons.filter((l) => progress.isLessonComplete(l.id));
  const totalLessons = allLessons.length;

  const labsDone = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
  const totalFlags = LABS.reduce((n, l) => n + l.scenario.totalFlags, 0);
  const capturedFlags = LABS.reduce((n, l) => n + progress.flagCount(l.scenario.id), 0);

  const scorePct = Math.round(
    (100 * (completedLessons.length + labsDone)) / Math.max(1, totalLessons + LABS.length),
  );

  const circumference = 2 * Math.PI * 54;
  const dash = (scorePct / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// your progress</div>
      <h1 className="text-3xl font-extrabold text-[var(--color-heading)] mb-8">Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="var(--color-accent)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold text-[var(--color-heading)]">{scorePct}%</div>
              <div className="text-xs text-[var(--color-text-dim)]">Overall</div>
            </div>
          </div>
        </div>
        <StatCard label="Lessons completed" value={`${completedLessons.length} / ${totalLessons}`} />
        <StatCard label="Lab flags captured" value={`${capturedFlags} / ${totalFlags}`} />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)] font-semibold text-[var(--color-heading)] text-sm">
          Lesson activity
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {allLessons.map((lesson) => {
            const done = progress.isLessonComplete(lesson.id);
            return (
              <Link
                key={lesson.id}
                to={`/module/${lesson.moduleSlug}/lesson/${lesson.slug}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--color-heading)] truncate">{lesson.title}</div>
                  <div className="text-xs text-[var(--color-text-dim)]">{lesson.moduleTitle}</div>
                </div>
                <span
                  className={`pill shrink-0 ${
                    done ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                  }`}
                >
                  {done ? <span className="flex items-center gap-1"><IconCheck className="w-3 h-3" /> Done</span> : 'Not started'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
