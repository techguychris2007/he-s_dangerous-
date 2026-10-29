import { useState } from 'react';
import { IconCheck } from '../layout/icons';
import './room-hero.css';

/** A room's steps as TryHackMe-style task cards: a numbered header that expands to the task's
 *  context, with a way back into the workspace at that step. */
export default function TaskList({ title, tasks, onOpen }: { title: string; tasks: { text: string; done: boolean; detail?: string }[]; onOpen: (index: number) => void }) {
  const firstOpen = tasks.findIndex((t) => !t.done);
  const [open, setOpen] = useState<number | null>(firstOpen >= 0 ? firstOpen : null);
  const doneCount = tasks.filter((t) => t.done).length;
  return (
    <section className="dw-tasks-section" aria-labelledby="room-tasks-title">
      <div className="dw-tasks-head">
        <h2 id="room-tasks-title">{title}</h2>
        <span className="dw-tasks-head__count"><i><b style={{ width: `${tasks.length ? (100 * doneCount) / tasks.length : 0}%` }} /></i>{doneCount}/{tasks.length} done</span>
      </div>
      <ol className="dw-tasks">
        {tasks.map((task, index) => {
          const expanded = open === index;
          return (
            <li key={index} className="dw-task-card" data-done={task.done} data-open={expanded}>
              <button type="button" className="dw-task" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : index)}>
                <span className="dw-task__num">Task {index + 1}</span>
                <span className="dw-task__text">{task.text}</span>
                <span className="dw-task__dot" aria-hidden="true">{task.done && <IconCheck className="w-3 h-3" />}</span>
                {task.done && <span className="sr-only">(reviewed)</span>}
                <span className="dw-task__chev" aria-hidden="true" />
              </button>
              {expanded && (
                <div className="dw-task__body">
                  {task.detail && <p>{task.detail}</p>}
                  <button type="button" className="dw-task__go" onClick={() => onOpen(index)}>{task.done ? 'Review in workspace' : 'Open in workspace'} →</button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
