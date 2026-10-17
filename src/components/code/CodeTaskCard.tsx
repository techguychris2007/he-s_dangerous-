import { Link } from 'react-router-dom';
import type { CodeTask } from '../../labs/codeTypes';
import { useProgress } from '../../state/progressStore';
import { IconCheck, IconCode } from '../layout/icons';

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-700 border-amber-500/25',
  Hard: 'bg-rose-500/10 text-rose-600 border-rose-500/25',
};

const LANGUAGE_LABEL: Record<string, string> = {
  python: 'Python',
  cpp: 'C++',
  javascript: 'JavaScript',
};

const LANGUAGE_MARK: Record<string, string> = {
  python: 'PY',
  cpp: 'C++',
  javascript: 'JS',
};

export default function CodeTaskCard({ task }: { task: CodeTask }) {
  const progress = useProgress();
  const done = progress.isCodeTaskComplete(task.id);
  const url = `/code-task/${task.id}`;

  return (
    <article className="group relative h-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_2px_8px_-5px_var(--color-heading)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/50 hover:shadow-[0_10px_24px_-16px_var(--color-accent)]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-[var(--color-accent)] opacity-70 transition-opacity group-hover:opacity-100" />
      <div className="flex h-full flex-col p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] font-mono text-xs font-bold text-[var(--color-accent)]">
              {LANGUAGE_MARK[task.language]}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[.1em] text-[var(--color-text-dim)]">{LANGUAGE_LABEL[task.language]}</div>
              <div className="mt-1 truncate text-xs font-semibold text-[var(--color-accent)]">{task.category}</div>
            </div>
          </div>
          {done ? (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-success)] text-white">
              <IconCheck className="h-4 w-4" />
            </span>
          ) : (
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${DIFFICULTY_CLASS[task.difficulty]}`}>{task.difficulty}</span>
          )}
        </div>

        <Link to={url} className="block text-[17px] font-bold leading-snug tracking-[-.02em] text-[var(--color-heading)] transition-colors group-hover:text-[var(--color-accent)]">
          {task.title}
        </Link>

        <p className="mt-2.5 line-clamp-3 min-h-[4.25rem] text-[13px] leading-[1.65] text-[var(--color-text-dim)]">{task.prompt}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <span className="text-xs font-semibold text-[var(--color-text-dim)]">{done ? 'Completed' : 'Auto-graded lab'}</span>
          <Link to={url} className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-accent)] px-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
            <IconCode className="h-3.5 w-3.5" /> {done ? 'Review' : 'Start'}
          </Link>
        </div>
      </div>
    </article>
  );
}
