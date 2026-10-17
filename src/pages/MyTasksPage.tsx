import { useMemo, useState } from 'react';
import { LABS, LABS_IN_ROADMAP_ORDER } from '../data/labs';
import { useProgress } from '../state/progressStore';
import LabCard from '../components/labs/LabCard';
import WorkspaceHeader from '../components/common/WorkspaceHeader';

type Filter = 'all' | 'in-progress' | 'not-started' | 'completed';

const PAGE_SIZE = 30;

export default function MyTasksPage() {
  const progress = useProgress();
  const [filter, setFilter] = useState<Filter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);

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

  const filtered = useMemo(() => LABS_IN_ROADMAP_ORDER.filter(lab => {
    const matchesStatus = filter === 'all' || labStatuses.get(lab.scenario.id) === filter;
    const matchesSearch = (lab.scenario.title + ' ' + lab.scenario.category + ' ' + lab.scenario.difficulty).toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesSearch && (!savedOnly || progress.bookmarkedLabs[lab.scenario.id]);
  }), [filter, labStatuses, search, savedOnly, progress.bookmarkedLabs]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const handleSetFilter = (f: Filter) => {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="task-board max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
      <WorkspaceHeader eyebrow="DarkWorld / Practice desk" title="Practice tasks" description="Find a challenge, follow the evidence, and build confidence through hands-on practice. Your saved work and progress are always close by."><strong>{counts.completed} / {counts.all}</strong><span>terminal labs completed</span></WorkspaceHeader>
      <div className="mb-5 flex flex-wrap items-center gap-3"><input type="search" aria-label="Search tasks" placeholder="Search labs, categories, or difficulty…" value={search} onChange={event => {setSearch(event.target.value); setVisibleCount(PAGE_SIZE);}} className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-heading)]" /><button aria-pressed={savedOnly} onClick={() => {setSavedOnly(value => !value);setVisibleCount(PAGE_SIZE);}} className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-heading)]">{savedOnly ? 'Saved labs only ✓' : 'Show saved labs'}</button></div>
      <div className="task-board-filters">
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
        <div className="premium-card rounded-2xl p-10 text-center text-[var(--color-text-dim)]">
          <p>No labs match these filters.</p><button onClick={() => {setSearch('');setSavedOnly(false);handleSetFilter('all');}} className="mt-3 font-semibold text-[var(--color-accent-dim)] underline">Clear all filters</button>
        </div>
      ) : (
        <>
          <div className="task-board-list">
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
