import { Link } from 'react-router-dom';
import { IconArrowRight, IconCheck } from '../layout/icons';
import './module-syllabus.css';

export interface SyllabusLesson {
  id: string;
  title: string;
  summary: string;
  to: string;
  minutes: number;
  objectives: number;
  labs: number;
  state: 'done' | 'current' | 'open';
}

const STATE_LABEL: Record<SyllabusLesson['state'], string> = { done: 'Completed', current: 'Up next', open: 'Not started' };

/** A module's lessons as a numbered course outline: what each lesson covers, how long it takes,
 *  how much practice it carries and where the learner stands. */
export default function ModuleSyllabus({ title, lessons, totalMinutes }: { title: string; lessons: SyllabusLesson[]; totalMinutes: number }) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return (
    <section className="syllabus" aria-labelledby="syllabus-title">
      <header className="syllabus__head">
        <div>
          <p className="syllabus__kicker">Course outline</p>
          <h2 id="syllabus-title">{title}</h2>
        </div>
        <p className="syllabus__totals">{lessons.length} lessons · {hours ? `${hours} h ` : ''}{minutes ? `${minutes} min` : ''}</p>
      </header>
      <ol className="syllabus__list">
        {lessons.map((lesson, index) => (
          <li key={lesson.id} className={`syllabus__item is-${lesson.state}`}>
            <Link to={lesson.to} className="syllabus__link">
              <span className="syllabus__num" aria-hidden="true">{lesson.state === 'done' ? <IconCheck className="h-4 w-4" /> : String(index + 1).padStart(2, '0')}</span>
              <span className="syllabus__body">
                <strong>{lesson.title}</strong>
                <span className="syllabus__summary">{lesson.summary}</span>
                <span className="syllabus__meta">
                  <span>{lesson.minutes} min</span>
                  {lesson.objectives > 0 && <span>{lesson.objectives} learning outcomes</span>}
                  {lesson.labs > 0 && <span>{lesson.labs} practice {lesson.labs === 1 ? 'lab' : 'labs'}</span>}
                </span>
              </span>
              <span className="syllabus__state">{STATE_LABEL[lesson.state]}</span>
              <IconArrowRight className="syllabus__go h-4 w-4" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
