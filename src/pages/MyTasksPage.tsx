import { useState } from 'react';
import { LABS, LABS_IN_ROADMAP_ORDER } from '../data/labs';
import { useProgress } from '../state/progressStore';
import LabCard from '../components/labs/LabCard';

type Filter = 'all' | 'in-progress' | 'not-started' | 'completed';

export default function MyTasksPage() {
  const progress = useProgress();
  const [filter, setFilter] = useState<Filter>('all');

  const statusOf = (labId: string, totalFlags: number) => {
    const captured = progress.flagCount(labId);
    if (captured >= totalFlags) return 'completed';
    if (captured > 0) return 'in-progress';
    return 'not-started';
  };

  const filtered =
    filter === 'all' ? LABS_IN_ROADMAP_ORDER : LABS_IN_ROADMAP_ORDER.filter((l) => statusOf(l.scenario.id, l.scenario.totalFlags) === filter);

  const counts = {
    all: LABS.length,
    'in-progress': LABS.filter((l) => statusOf(l.scenario.id, l.scenario.totalFlags) === 'in-progress').length,
    'not-started': LABS.filter((l) => statusOf(l.scenario.id, l.scenario.totalFlags) === 'not-started').length,
    completed: LABS.filter((l) => statusOf(l.scenario.id, l.scenario.totalFlags) === 'completed').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-14">
      <div className="text-[var(--color-accent)] font-mono text-sm mb-2">// assigned to you</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3">My Tasks</h1>
      <p className="text-[var(--color-text-dim)] mb-8 leading-relaxed max-w-2xl">
        Every lab in the curriculum, tracked as a task with your real progress. Nothing here is graded by
        anyone else — the percentage is exactly how many flags you have captured in your own browser.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {([
          ['all', 'All'],
          ['not-started', 'Not started'],
          ['in-progress', 'In progress'],
          ['completed', 'Completed'],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((lab) => (
            <LabCard key={lab.slug} lab={lab} variant="task" />
          ))}
        </div>
      )}
    </div>
  );
}
