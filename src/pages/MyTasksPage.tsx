import { useMemo, useState } from 'react';
import { LABS, LABS_IN_ROADMAP_ORDER } from '../data/labs';
import { useProgress } from '../state/progressStore';
import LabCard from '../components/labs/LabCard';

type Filter = 'all' | 'in-progress' | 'not-started' | 'completed';

const PAGE_SIZE = 30;

export default function MyTasksPage() {
  const progress = useProgress();
  const [filter, setFilter] = useState<Filter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Compute status for each lab — memoized on labFlags so it doesn't redo on unrelated state changes
  const labStatuses = useMemo(() => {
    const map = new Map<string, 'completed' | 'in-progress' | 'not-started'>();
    for (const lab of LABS) {
      const captured = progress.flagCount(lab.scenario.id);
      if (captured >= lab.scenario.totalFlags) map.set(lab.scenario.id, 'completed');
      else if (captured > 0) map.set(lab.scenario.id, 'in-progress');
      else map.set(lab.scenario.id, 'not-started');
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.labFlags]);

  const counts = useMemo(
    () => ({
      all: LABS.length,
      'in-progress': 0,
      'not-started': 0,
      completed: 0,
      ...Object.fromEntries(
        (['in-progress', 'not-started', 'completed'] as const).map((s) => [
          s,
          LABS.filter((l) => labStatuses.get(l.scenario.id) === s).length,
        ]),
      ),
    }),
    [labStatuses],
  );

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? LABS_IN_ROADMAP_ORDER
        : LABS_IN_ROADMAP_ORDER.filter((l) => labStatuses.get(l.scenario.id) === filter),
    [filter, labStatuses],
  );

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const handleSetFilter = (f: Filter) => {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
      <div className="gold-eyebrow mb-1.5 sm:mb-2">// assigned to you</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2 sm:mb-3">My Tasks</h1>
      <p className="text-sm sm:text-base text-[var(--color-text-dim)] mb-6 sm:mb-8 leading-relaxed max-w-2xl">
        Every lab in the curriculum, tracked as a task with your real progress. Nothing here is graded by
        anyone else — the percentage is exactly how many flags you have captured in your own browser.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {(
          [
            ['all', 'All'],
            ['not-started', 'Not started'],
            ['in-progress', 'In progress'],
            ['completed', 'Completed'],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleSetFilter(key)}
            aria-pressed={filter === key}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === key
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-70">{counts[key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-[var(--color-text-dim)]">
          Nothing in this list yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((lab) => (
              <LabCard key={lab.slug} lab={lab} variant="task" />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 transition-colors"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
                <span className="ml-2 opacity-60 text-xs">({filtered.length - visibleCount} remaining)</span>
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-[var(--color-text-dim)]">
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} tasks
          </div>
        </>
      )}
    </div>
  );
}
