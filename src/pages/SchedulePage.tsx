import { Link } from 'react-router-dom';
import { MODULES } from '../data/curriculum';
import { useProgress } from '../state/progressStore';
import { IconCheck } from '../components/layout/icons';
import WorkspaceHeader from '../components/common/WorkspaceHeader';

export default function SchedulePage() {
  const progress = useProgress();

  const moduleProgress = (mod: (typeof MODULES)[number]) => {
    const done = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
    return { done, total: mod.lessons.length };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <WorkspaceHeader eyebrow="Suggested pacing" title="Schedule" guide="cipher" description={<>There's no enrollment deadline here, so instead of fake due dates, this is a realistic one-module- per-week pace — {MODULES.length} weeks to cover the entire curriculum if you go in order. Go faster or slower; your actual progress below is what matters, not the calendar.</>} />

      <div className="flex flex-col gap-2">
        {MODULES.map((mod, i) => {
          const { done, total } = moduleProgress(mod);
          const complete = done === total;
          return (
            <Link
              key={mod.id}
              to={`/module/${mod.slug}`}
              className="premium-card rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--color-accent)]/50 hover:shadow-sm transition-all"
            >
              <span
                className={`w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  complete ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'
                }`}
              >
                {complete ? <IconCheck className="w-4 h-4" /> : `W${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--color-heading)] text-sm truncate">{mod.title}</div>
                <div className="text-xs text-[var(--color-text-dim)] truncate">{mod.subtitle}</div>
              </div>
              <div className="text-xs font-mono text-[var(--color-text-dim)] shrink-0">
                {done}/{total}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
