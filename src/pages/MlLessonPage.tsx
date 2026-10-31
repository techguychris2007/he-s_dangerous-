import LearningActions from '../components/lesson/LearningActions';
import CyberLabAI from '../components/labs/CyberLabAI';
import BeginnerGlossary from '../components/lesson/BeginnerGlossary';
import PrerequisitePrimer from '../components/lesson/PrerequisitePrimer';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { ML_LESSONS, findMlLesson } from '../data/mlLessons';
import { ML_TASKS } from '../labs/mlTasks';
import { useProgress } from '../state/progressStore';
import LinearRegressionDemo from '../components/ml/LinearRegressionDemo';
import KMeansDemo from '../components/ml/KMeansDemo';
import { IconCheck, IconExternal } from '../components/layout/icons';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import CodeTaskCard from '../components/code/CodeTaskCard';
import { codeTaskXp } from '../data/xp';
import '../components/lesson/lesson-reader.css';

export default function MlLessonPage() {
  const { lessonId } = useParams();
  const progress = useProgress();
  const lesson = lessonId ? findMlLesson(lessonId) : undefined;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (!lesson) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTop = 0;
    setActiveSection('');
    const update = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      setReadingProgress(max > 0 ? Math.min(100, Math.round((scroller.scrollTop / max) * 100)) : 100);
      const top = scroller.getBoundingClientRect().top;
      const nodes = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('h2') ?? []);
      const current = nodes.filter(node => node.getBoundingClientRect().top <= top + 150).at(-1);
      setActiveSection(current?.id ?? '');
    };
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    return () => scroller.removeEventListener('scroll', update);
  }, [lesson]);

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  if (!lesson) return <Navigate to="/ml-portal" replace />;
  const challenge = lesson.challengeTaskId ? ML_TASKS.find(task => task.id === lesson.challengeTaskId) : undefined;
  const challengeDone = challenge ? progress.isCodeTaskComplete(challenge.id) : false;
  const index = ML_LESSONS.findIndex(item => item.id === lesson.id);
  const prev = index > 0 ? ML_LESSONS[index - 1] : undefined;
  const next = index < ML_LESSONS.length - 1 ? ML_LESSONS[index + 1] : undefined;
  const sections = lesson.sections.map((section, sectionIndex) => ({ ...section, id: `${lesson.id}-section-${sectionIndex + 1}` }));
  const moduleLessons = ML_LESSONS.filter(item => item.unit === lesson.unit);
  const modulePosition = moduleLessons.findIndex(item => item.id === lesson.id) + 1;

  return (
    <div className="h-full flex flex-col lg:flex-row min-w-0"><div ref={scrollRef} className="lesson-reader ml-reader flex-1 min-w-0 h-full overflow-y-auto">
      <LearningActions back={{ href: '/ml-portal', label: 'ML learning' }} previous={prev ? `/ml-lesson/${prev.id}` : undefined} next={next ? `/ml-lesson/${next.id}` : undefined} />
      <div className="reader-progress" role="progressbar" aria-label="Reading progress" aria-valuenow={readingProgress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${readingProgress}%` }} /></div>
      <div className="reader-layout">
        <main className="min-w-0">
          <header className="reader-room">
            <nav aria-label="Breadcrumb" className="reader-room__crumbs">
              <Link to="/ml-portal">ML Portal</Link><span aria-hidden="true"> › </span>
              <span>{lesson.source}</span><span aria-hidden="true"> › </span>
              <span aria-current="page" dangerouslySetInnerHTML={{ __html: lesson.title }} />
            </nav>
            <div className="reader-room__head">
              <CharacterAvatar id="beacon" size={84} />
              <div className="min-w-0">
                <h1 dangerouslySetInnerHTML={{ __html: lesson.title }} />
                <p className="reader-room__summary">Study the idea, follow practical code walkthroughs, and connect each modeling choice to its real effect.</p>
                <ul className="reader-room__meta">
                  <li>Lesson {String(index + 1).padStart(2, '0')} of {ML_LESSONS.length}</li>
                  <li>Module lesson {modulePosition} of {moduleLessons.length}</li>
                  <li>{challenge ? 'Python lab included' : 'Concept lesson'}</li>
                  {challenge && <li className="reader-room__xp">+{codeTaskXp(0, false)} XP</li>}
                  {challengeDone && <li className="reader-room__done"><IconCheck className="w-3.5 h-3.5" />Lab solved</li>}
                </ul>
              </div>
            </div>
            <div className="reader-room__actions">
              {challenge && <button type="button" onClick={() => jumpTo('ml-python-lab')}>{challengeDone ? 'Review the lab' : 'Jump to the lab'}</button>}
              <Link to="/ml-portal" className="reader-room__link">Back to the roadmap</Link>
            </div>
            <div className="reader-room__progress" role="progressbar" aria-label="Reading progress" aria-valuenow={readingProgress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${readingProgress}%` }} />
              <b>Room progress: {readingProgress}%</b>
            </div>
          </header>

          <details className="reader-mobile-outline"><summary>In this lesson</summary><nav className="reader-toc">{sections.map(section => <button key={section.id} type="button" onClick={() => jumpTo(section.id)}>{section.heading}</button>)}{challenge && <button type="button" onClick={() => jumpTo('ml-python-lab')}>Python lab</button>}</nav></details>

          <BeginnerGlossary targetRef={contentRef} resetKey={lesson.id} domains={['ml']} />
          <article ref={contentRef} className="lesson-body ml-lesson-body">
            <PrerequisitePrimer moduleSlug={lesson.unit === 'python-ml-engineering' ? 'python' : lesson.unit === 'sql-ml-data-work' ? 'database-security' : lesson.unit === 'foundations' ? 'ml-foundations' : lesson.unit === 'model-evaluation' || lesson.unit === 'time-series' ? 'ml-evaluation' : lesson.unit === 'data-handling' || lesson.unit === 'mlops' ? 'ml-data' : 'ml-models'} />
            {sections.map((section) => (
              <section key={section.id} className="ml-lesson-section">
                <h2 id={section.id} dangerouslySetInnerHTML={{ __html: section.heading }} />
                <div className="prose-hh" dangerouslySetInnerHTML={{ __html: section.body }} />
              </section>
            ))}
          </article>

          {lesson.demo === 'linear-regression' && <div className="ml-demo-shell"><LinearRegressionDemo /></div>}
          {lesson.demo === 'kmeans' && <div className="ml-demo-shell"><KMeansDemo /></div>}

          {challenge && (
            <section id="ml-python-lab" className="reader-practice ml-practice-panel" tabIndex={-1}>
              <p className="reader-eyebrow">Learn by coding</p>
              <h2>Python lab for this concept</h2>
              <p className="reader-summary">Implement the concept in Python, check your results with the tests, and use any failing cases to understand the assumptions behind your code.</p>
              <CodeTaskCard task={challenge} />
            </section>
          )}

          {lesson.resources && lesson.resources.length > 0 && (
            <section className="ml-resource-panel">
              <p className="reader-eyebrow">Go deeper</p>
              <h2>Real resources for this module</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {lesson.resources.map((r) => (
                  <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="ml-resource">
                    <span className="ml-resource__kind">{r.kind}</span>
                    <strong>{r.title}<IconExternal className="h-3 w-3 shrink-0" /></strong>
                    <p>{r.note}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          <nav aria-label="Previous and next lessons" className="reader-pagination">
            {prev ? <Link to={`/ml-lesson/${prev.id}`}><span>Previous lesson</span><span dangerouslySetInnerHTML={{ __html: prev.title }} /></Link> : <Link to="/ml-portal"><span>Back to roadmap</span>Machine Learning Roadmap</Link>}
            {next ? <Link to={`/ml-lesson/${next.id}`}><span>Next lesson →</span><span dangerouslySetInnerHTML={{ __html: next.title }} /></Link> : <Link to="/ml-portal"><span>Continue your path →</span>Review the full ML roadmap</Link>}
          </nav>
        </main>

        <aside className="reader-outline">
          <div className="reader-outline-inner">
            <p className="reader-eyebrow">In this lesson</p>
            <nav className="reader-toc">{sections.map(section => <button key={section.id} type="button" onClick={() => jumpTo(section.id)} aria-current={activeSection === section.id ? 'location' : undefined}>{section.heading}</button>)}{challenge && <button type="button" onClick={() => jumpTo('ml-python-lab')}>Python lab</button>}</nav>
          </div>
        </aside>
      </div>
    </div>
      <CyberLabAI key={lesson.id} getContext={() => ({ kind: 'lesson', title: lesson.title.replace(/<[^>]*>/g, ''), subtitle: 'Machine learning', bodyText: contentRef.current?.innerText ?? '' })} />
    </div>
  );
}
