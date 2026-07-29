import { Link } from 'react-router-dom';
import type { CodeTask } from '../../labs/codeTypes';
import { useProgress } from '../../state/progressStore';
import { IconCheck, IconCode } from '../layout/icons';

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30',
  Medium: 'bg-[var(--color-warn)]/15 text-[var(--color-warn)] border border-[var(--color-warn)]/30',
  Hard: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30',
};

const LANGUAGE_LABEL: Record<string, string> = {
  python: 'Python',
  cpp: 'C++',
  javascript: 'JavaScript',
};

export default function CodeTaskCard({ task }: { task: CodeTask }) {
  const progress = useProgress();
  const done = progress.isCodeTaskComplete(task.id);
  const url = `/code-task/${task.id}`;

  return (
    <div className="group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-8px_var(--color-accent)] transition-all duration-200 flex flex-col">
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
            {LANGUAGE_LABEL[task.language]}
          </span>
          <span className={`pill ${DIFFICULTY_CLASS[task.difficulty]}`}>{task.difficulty}</span>
          <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{task.category}</span>
          {done && (
            <span className="ml-auto w-6 h-6 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center shrink-0">
              <IconCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        <Link to={url} className="font-semibold text-[var(--color-heading)] text-sm mb-1.5 hover:text-[var(--color-accent-dim)] transition-colors">
          {task.title}
        </Link>

        <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-3 line-clamp-2">{task.prompt}</p>

        <div className="mt-auto">
          <Link
            to={url}
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-semibold text-sm text-center hover:brightness-110 transition flex items-center justify-center gap-1.5"
          >
            <IconCode className="w-3.5 h-3.5" /> {done ? 'Review task' : 'Start task'} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
