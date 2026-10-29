import { useId, useState } from 'react';
import { IconCheck } from '../layout/icons';
import './room-hero.css';

/** A room's steps as TryHackMe-style task cards: a numbered header that expands to the task's
 *  context, with a way back into the workspace at that step. */
export default function TaskList({ title, tasks, onOpen }: { title: string; tasks: { text: string; done: boolean; detail?: string; status?: 'complete' | 'reviewed' }[]; onOpen: (index: number) => void }) {
  const id = useId();
  const firstOpen = tasks.findIndex((t) => !t.done);
  const [open, setOpen] = useState<number | null>(firstOpen >= 0 ? firstOpen : null);
  const doneCount = tasks.filter((t) => t.done).length;
  return (
    <section className="dw-tasks-section dw-mission-plan" aria-labelledby={`${id}-title`}>
      <div className="dw-tasks-head">
        <div><p className="dw-plan-eyebrow">Your investigation workflow</p><h2 id={`${id}-title`}>{title}</h2></div>
        <div className="dw-plan-progress"><span>{doneCount} of {tasks.length} {tasks.every(task => task.status === 'complete') && tasks.length ? 'complete' : 'reviewed'}</span><div role="progressbar" aria-label="Mission stages reviewed" aria-valuemin={0} aria-valuemax={tasks.length || 1} aria-valuenow={doneCount}><span style={{ width: `${tasks.length ? (100 * doneCount) / tasks.length : 0}%` }} /></div></div>
      </div>
      <p className="dw-plan-intro">Understand the purpose of each stage, then apply it in the workspace. Reviewing a stage records your reading; lab completion is verified through its required evidence.</p>
      <ol className="dw-tasks">
        {tasks.map((task, index) => {
          const expanded = open === index;
          return (
            <li key={index} className="dw-task-card" data-done={task.done} data-open={expanded}>
              <button type="button" id={`${id}-stage-${index}`} className="dw-task" aria-expanded={expanded} aria-controls={`${id}-panel-${index}`} onClick={() => setOpen(expanded ? null : index)}>
                <span className="dw-task__num">{String(index + 1).padStart(2, '0')}</span>
                <span className="dw-task__text">{task.text}</span>
                <span className="dw-plan-status" data-done={task.done}>{task.done && <IconCheck className="w-3 h-3" aria-hidden="true" />}{task.done ? task.status === 'reviewed' ? 'Reviewed' : 'Complete' : 'To review'}</span>
                <span className="dw-task__chev" aria-hidden="true" />
              </button>
                <div className="dw-task__body" id={`${id}-panel-${index}`} aria-labelledby={`${id}-stage-${index}`} hidden={!expanded}>
                  <div><span className="dw-plan-reason">Why this stage matters</span><p>{task.detail || 'Use this stage to collect the evidence needed for the mission. Check the result before moving to the next step.'}</p></div>
                  <button type="button" className="dw-task__go" onClick={() => onOpen(index)}>{task.done ? 'Review this stage' : 'Open this stage'} <span aria-hidden="true">↗</span></button>
                </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
