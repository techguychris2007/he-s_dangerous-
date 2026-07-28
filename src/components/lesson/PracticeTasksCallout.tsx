import { Link } from 'react-router-dom';
import { IconCode } from '../layout/icons';

interface TaskRef {
  id: string;
  title: string;
}

/** Drops a "go practice this now" box at the end of a Code Portal lesson, linking straight into the
 *  matching CodeTaskPage entries instead of leaving the concept purely theoretical. */
export default function PracticeTasksCallout({ tasks }: { tasks: TaskRef[] }) {
  return (
    <div className="my-5 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4">
      <div className="flex items-center gap-2 text-xs font-bold tracking-wide mb-2.5 text-[var(--color-accent-dim)]">
        <IconCode className="w-3.5 h-3.5" /> PRACTICE THIS NOW
      </div>
      <div className="flex flex-col gap-1.5">
        {tasks.map((t) => (
          <Link
            key={t.id}
            to={`/code-task/${t.id}`}
            className="text-sm font-semibold text-[var(--color-heading)] hover:text-[var(--color-accent-dim)] transition-colors"
          >
            {t.title} &rarr;
          </Link>
        ))}
      </div>
    </div>
  );
}
