import { Link } from 'react-router-dom';
import type { SeTaskMeta } from '../../labs/seTasks/taskIndex';
import { useProgress } from '../../state/progressStore';
import { IconCheck, IconLayers } from '../layout/icons';

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30',
  Medium: 'bg-[var(--color-warn)]/15 text-[var(--color-warn)] border border-[var(--color-warn)]/30',
  Hard: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30',
};

const LANGUAGE_LABEL: Record<string, string> = { python: 'Python', cpp: 'C++', javascript: 'JavaScript' };
const TRACK_LABEL: Record<string, string> = { foundations: 'Foundations', backend: 'Backend', fullstack: 'Full-Stack', systems: 'Systems' };

/** Renders straight off SeTaskMeta (catalog-page metadata) — never triggers the task's own lazy import,
 *  so a grid of these never loads more than the one task a learner actually opens. */
export default function ProjectTaskCard({ task }: { task: SeTaskMeta }) {
  const progress = useProgress();
  const done = progress.isCodeTaskComplete(task.id);
  const url = `/build-task/${task.id}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_2px_8px_-5px_var(--color-heading)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/50 hover:shadow-[0_10px_24px_-16px_var(--color-accent)]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-[var(--color-accent)] opacity-70 transition-opacity group-hover:opacity-100" />
      <div className="flex h-full flex-col p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] font-mono text-xs font-bold text-[var(--color-accent)]"><IconLayers className="h-4 w-4" /></div>
            <div className="min-w-0"><div className="text-[11px] font-semibold uppercase tracking-[.1em] text-[var(--color-text-dim)]">{LANGUAGE_LABEL[task.language]} · {TRACK_LABEL[task.track]}</div><div className="mt-1 truncate text-xs font-semibold text-[var(--color-accent)]">{task.category}</div></div>
          </div>
          {done ? <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-success)] text-white"><IconCheck className="h-4 w-4" /></span> : <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${DIFFICULTY_CLASS[task.difficulty]}`}>{task.difficulty}</span>}
        </div>

        <Link to={url} className="block text-[17px] font-bold leading-snug tracking-[-.02em] text-[var(--color-heading)] transition-colors group-hover:text-[var(--color-accent)]">{task.title}</Link>
        <p className="mt-2.5 line-clamp-3 min-h-[4.25rem] text-[13px] leading-[1.65] text-[var(--color-text-dim)]">{task.summary}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-dim)]"><IconLayers className="h-3.5 w-3.5" /> {task.fileCount} files</span>
          <Link to={url} className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-accent)] px-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">{done ? 'Review project' : 'Start project'} <span aria-hidden>→</span></Link>
        </div>
      </div>
    </article>
  );
}
