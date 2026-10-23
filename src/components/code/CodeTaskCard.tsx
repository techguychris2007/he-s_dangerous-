import { Link } from 'react-router-dom';
import type { CodeTask } from '../../labs/codeTypes';
import { useProgress } from '../../state/progressStore';
import IsoBlock from '../labs/IsoBlock';
import { IconCheck, IconCode, ModuleIcon } from '../layout/icons';
import { codeTaskXp } from '../../data/xp';
import './practice-card.css';

const LANGUAGE_LABEL: Record<string, string> = {
  python: 'Python',
  cpp: 'C++',
  javascript: 'JavaScript',
};

function iconFor(task: CodeTask): string {
  if (task.category.startsWith('Security:')) return 'shield';
  if (task.category.startsWith('ML:')) return 'brain';
  if (task.category === 'Software Engineering') return 'engineering';
  return task.language === 'python' ? 'python' : task.language === 'cpp' ? 'chip' : 'code';
}

export default function CodeTaskCard({ task }: { task: CodeTask }) {
  const progress = useProgress();
  const done = progress.isCodeTaskComplete(task.id);
  const started = (progress.codeTaskAttempts[task.id] ?? 0) > 0;
  const url = `/code-task/${task.id}`;

  return (
    <article className="dw-pcard" data-state={done ? 'done' : started ? 'started' : 'new'}>
      <div className="dw-pcard__banner">
        <IsoBlock width={56} depth={11} tone={done ? 'done' : started ? 'progress' : task.category.startsWith('Security:') ? 'defense' : 'analysis'} crest={<ModuleIcon icon={iconFor(task)} />} className="dw-pcard__emblem" />
        <div className="dw-pcard__kicker">
          <small>{LANGUAGE_LABEL[task.language]}</small>
          <span>{task.category}</span>
        </div>
        {done ? <span className="dw-pcard__done" title="Solved"><IconCheck className="h-4 w-4" /></span> : <span className="dw-pcard__level" data-level={task.difficulty}>{task.difficulty}</span>}
      </div>
      <div className="dw-pcard__body">
        <h3><Link to={url}>{task.title}</Link></h3>
        <p>{task.prompt}</p>
      </div>
      <footer className="dw-pcard__foot">
        <span><IconCode className="h-3.5 w-3.5" />Auto-graded</span>
        <span className="dw-pcard__xp">+{codeTaskXp(0, false)} XP</span>
        <Link to={url} className="dw-pcard__cta">{done ? 'Review' : started ? 'Continue' : 'Solve'} <span aria-hidden>→</span></Link>
      </footer>
    </article>
  );
}
