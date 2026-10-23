import { Link } from 'react-router-dom';
import type { SeTaskMeta } from '../../labs/seTasks/taskIndex';
import { useProgress } from '../../state/progressStore';
import IsoBlock from '../labs/IsoBlock';
import { IconCheck, IconLayers, ModuleIcon } from '../layout/icons';
import { codeTaskXp } from '../../data/xp';
import './practice-card.css';

const LANGUAGE_LABEL: Record<string, string> = { python: 'Python', cpp: 'C++', javascript: 'JavaScript' };
const TRACK_LABEL: Record<string, string> = { foundations: 'Foundations', backend: 'Backend', fullstack: 'Full-Stack', systems: 'Systems' };
const TRACK_ICON: Record<string, string> = { foundations: 'code', backend: 'database', fullstack: 'web', systems: 'chip' };

/** Renders straight off SeTaskMeta (catalog-page metadata) — never triggers the task's own lazy import,
 *  so a grid of these never loads more than the one task a learner actually opens. */
export default function ProjectTaskCard({ task }: { task: SeTaskMeta }) {
  const progress = useProgress();
  const done = progress.isCodeTaskComplete(task.id);
  const started = (progress.codeTaskAttempts[task.id] ?? 0) > 0;
  const url = `/build-task/${task.id}`;

  return (
    <article className="dw-pcard" data-state={done ? 'done' : started ? 'started' : 'new'}>
      <div className="dw-pcard__banner">
        <IsoBlock width={56} depth={11} tone={done ? 'done' : started ? 'progress' : 'analysis'} crest={<ModuleIcon icon={TRACK_ICON[task.track] ?? 'code'} />} className="dw-pcard__emblem" />
        <div className="dw-pcard__kicker">
          <small>{LANGUAGE_LABEL[task.language]} · {TRACK_LABEL[task.track]}</small>
          <span>{task.category}</span>
        </div>
        {done ? <span className="dw-pcard__done" title="Solved"><IconCheck className="h-4 w-4" /></span> : <span className="dw-pcard__level" data-level={task.difficulty}>{task.difficulty}</span>}
      </div>
      <div className="dw-pcard__body">
        <h3><Link to={url}>{task.title}</Link></h3>
        <p>{task.summary}</p>
      </div>
      <footer className="dw-pcard__foot">
        <span><IconLayers className="h-3.5 w-3.5" />{task.fileCount} files</span>
        <span className="dw-pcard__xp">+{codeTaskXp(0, false)} XP</span>
        <Link to={url} className="dw-pcard__cta">{done ? 'Review' : started ? 'Continue' : 'Start project'} <span aria-hidden>→</span></Link>
      </footer>
    </article>
  );
}
