import { IconCheck } from '../layout/icons';
import './room-hero.css';

/** A room's steps as numbered task rows, each one a way back into the workspace at that step. */
export default function TaskList({ title, tasks, onOpen }: { title: string; tasks: { text: string; done: boolean }[]; onOpen: (index: number) => void }) {
  return (
    <section className="dw-tasks-section" aria-labelledby="room-tasks-title">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="room-tasks-title" className="text-lg font-black tracking-[-0.02em] text-[var(--color-heading)]">{title}</h2>
        <span className="text-xs text-[var(--color-text-dim)]">{tasks.filter((t) => t.done).length}/{tasks.length} done</span>
      </div>
      <ol className="dw-tasks">
        {tasks.map((task, index) => (
          <li key={index}>
            <button type="button" className="dw-task" data-done={task.done} onClick={() => onOpen(index)}>
              <span className="dw-task__num">Task {index + 1}</span>
              <span className="dw-task__dot" aria-hidden="true">{task.done && <IconCheck className="w-3 h-3" />}</span>
              <span className="dw-task__text">{task.text}</span>
              <span className="dw-task__go" aria-hidden="true">Open →</span>
              {task.done && <span className="sr-only">(reviewed)</span>}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
