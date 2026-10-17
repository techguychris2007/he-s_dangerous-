import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { findModule, ROADMAP } from '../data/curriculum';
import { labsForLesson } from '../data/lessonLabs';
import { useProgress } from '../state/progressStore';
import type { ModuleMeta, LessonMeta } from '../types';
import Quiz from '../components/lesson/Quiz';
import PrerequisitePrimer from '../components/lesson/PrerequisitePrimer';
import LessonLabCard from '../components/lesson/LessonLabCard';
import CodeTaskCard from '../components/code/CodeTaskCard';
import SiemLabCard from '../components/siem/SiemLabCard';
import { SIEM_LABS } from '../labs/siemScenarios';
import { PYTHON_TASKS } from '../labs/pythonTasks';
import CyberLabAI from '../components/labs/CyberLabAI';
import { IconCheck } from '../components/layout/icons';
import '../components/lesson/lesson-reader.css';

type Heading = { id: string; title: string; level: number };

export default function LessonPage() {
  const { moduleSlug, lessonSlug } = useParams();
  const mod = findModule(moduleSlug);
  const lesson = mod?.lessons.find(item => item.slug === lessonSlug);
  if (!mod || !lesson) return <Navigate to="/roadmap" replace />;
  return <LessonReader key={lesson.id} mod={mod} lesson={lesson} />;
}

function LessonReader({ mod, lesson }: { mod: ModuleMeta; lesson: LessonMeta }) {
  const progress = useProgress();
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeading, setActiveHeading] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [wide, setWide] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    try { const size = Number(localStorage.getItem('darkworld.reader.fontSize')); return [16, 18, 20].includes(size) ? size : 16; }
    catch { return 16; }
  });
  const idx = mod.lessons.indexOf(lesson);
  const prev = mod.lessons[idx - 1];
  const next = mod.lessons[idx + 1];
  const complete = progress.isLessonComplete(lesson.id);
  const completedInModule = mod.lessons.filter(item => progress.isLessonComplete(item.id)).length;
  const track = ROADMAP.find(stage => stage.moduleSlug === mod.slug)?.track ?? 'security';
  const labSlugs = labsForLesson(lesson.id);
  const practiceBreakdown = useMemo(() => {
    let siem = 0;
    let code = 0;
    let terminal = 0;
    for (const slug of labSlugs) {
      if (SIEM_LABS.some(lab => lab.id === slug)) siem++;
      else if (PYTHON_TASKS.some(task => task.id === slug)) code++;
      else terminal++;
    }
    return { siem, code, terminal };
  }, [labSlugs]);
  const { Content } = lesson;

  useEffect(() => {
    let nodes: HTMLElement[] = [];
    const collectHeadings = () => {
      nodes = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('h2, h3') ?? []);
      const sections = nodes.map((node, index) => {
        if (!node.id) node.id = `${lesson.id}-toc-${index + 1}`;
        node.tabIndex = -1;
        return { id: node.id, title: node.textContent ?? '', level: Number(node.tagName.slice(1)) };
      });
      setHeadings(previous => JSON.stringify(previous) === JSON.stringify(sections) ? previous : sections);
      setActiveHeading(previous => sections.some(section => section.id === previous) ? previous : sections[0]?.id ?? '');
    };
    collectHeadings();
    const scroller = scrollRef.current;
    if (!scroller) return;
    const update = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      setReadingProgress(max > 0 ? Math.min(100, Math.round(scroller.scrollTop / max * 100)) : 100);
      const top = scroller.getBoundingClientRect().top;
      const current = nodes.filter(node => node.getBoundingClientRect().top <= top + 160).at(-1);
      if (current) setActiveHeading(current.id);
    };
    scroller.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    if (contentRef.current) resize.observe(contentRef.current);
    const mutations = new MutationObserver(() => { collectHeadings(); update(); });
    if (contentRef.current) mutations.observe(contentRef.current, { childList: true, subtree: true, characterData: true });
    return () => { scroller.removeEventListener('scroll', update); resize.disconnect(); mutations.disconnect(); };
  }, [lesson.id]);

  function jumpTo(id: string) {
    const heading = document.getElementById(id);
    heading?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    heading?.focus({ preventScroll: true });
  }

  const tableOfContents = <nav aria-label="Lesson sections" className="reader-toc">
    {headings.map(heading => <button key={heading.id} type="button" onClick={() => jumpTo(heading.id)} aria-current={activeHeading === heading.id ? 'location' : undefined} className={heading.level === 3 ? 'reader-toc-subsection' : ''}>{heading.title}</button>)}
    {labSlugs.length > 0 && <button onClick={() => jumpTo('lesson-practice')}>Practice labs · {labSlugs.length}</button>}
    <button onClick={() => jumpTo('lesson-checkpoint')}>Knowledge checkpoint</button>
  </nav>;

  return (
    <div className="h-full flex flex-col lg:flex-row min-w-0">
      <div ref={scrollRef} className="lesson-reader flex-1 min-w-0 overflow-y-auto" style={{ '--reader-size': `${fontSize}px` } as CSSProperties}>
        <div className="reader-progress" role="progressbar" aria-label="Reading progress" aria-valuenow={readingProgress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${readingProgress}%` }} /></div>
        <div className={`reader-layout ${wide ? 'reader-layout-wide' : ''}`}>
          <div className="min-w-0">
            <header className="reader-header">
              <Link to={`/module/${mod.slug}`} className="reader-back">← {mod.title}</Link>
              <div className="reader-eyebrow">DarkWorld Academy <span aria-hidden="true">/</span> Lesson {String(idx + 1).padStart(2, '0')}</div>
              <h1>{lesson.title}</h1>
              <p className="reader-summary">{lesson.summary}</p>
              <div className="reader-meta"><span>{lesson.minutes} min study</span><span>{labSlugs.length} practice {labSlugs.length === 1 ? 'lab' : 'labs'}</span><span>{complete ? 'Completed' : 'In progress'}</span></div>
              {lesson.objectives?.length ? <div className="reader-briefing">
                {lesson.objectives?.length ? <div className="reader-briefing-card"><span>You will be able to</span><ul>{lesson.objectives.map(item => <li key={item}>{item}</li>)}</ul></div> : null}
              </div> : null}
              <div className="reader-controls">
                <label>Text size <select aria-label="Lesson text size" value={fontSize} onChange={event => { const size = Number(event.target.value); setFontSize(size); try { localStorage.setItem('darkworld.reader.fontSize', String(size)); } catch { /* Reading remains available without storage. */ } }}><option value={16}>Standard</option><option value={18}>Large</option><option value={20}>Extra large</option></select></label>
                <button aria-pressed={wide} onClick={() => setWide(current => !current)}>{wide ? 'Show outline' : 'Focus reading'}</button>
              </div>
            </header>
            <details className="reader-mobile-outline"><summary>In this lesson</summary>{tableOfContents}</details>
            <div ref={contentRef} className="lesson-body">
              <PrerequisitePrimer moduleSlug={mod.slug} prerequisite={lesson.prerequisite} />
              <Suspense fallback={<p role="status">Loading lesson content…</p>}><Content /></Suspense>
            </div>
            {labSlugs.length > 0 && <section id="lesson-practice" tabIndex={-1} className="reader-practice">
              <p className="reader-eyebrow">Learn by doing</p><h2>Put the lesson into practice</h2>
              <p className="reader-summary">Work through the scenario, collect evidence, and explain what your observations prove.</p>
              <div className="mb-4 flex flex-wrap gap-2" aria-label="Practice formats in this lesson">
                {practiceBreakdown.terminal > 0 && <span className="pill bg-[var(--color-accent)]/10 text-[var(--color-accent-dim)]">{practiceBreakdown.terminal} terminal {practiceBreakdown.terminal === 1 ? 'lab' : 'labs'}</span>}
                {practiceBreakdown.siem > 0 && <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{practiceBreakdown.siem} SIEM {practiceBreakdown.siem === 1 ? 'case' : 'cases'}</span>}
                {practiceBreakdown.code > 0 && <span className="pill bg-[var(--color-gold-soft)] text-[var(--color-gold-dim)]">{practiceBreakdown.code} code {practiceBreakdown.code === 1 ? 'task' : 'tasks'}</span>}
              </div>
              {labSlugs.map(slug => {
                const siem = SIEM_LABS.find(lab => lab.id === slug);
                if (siem) return <div className="my-4" key={slug}><SiemLabCard lab={siem} /></div>;
                const codeTask = PYTHON_TASKS.find(task => task.id === slug);
                if (codeTask) return <div className="my-4" key={slug}><CodeTaskCard task={codeTask} /></div>;
                return <LessonLabCard key={slug} labSlug={slug} />;
              })}
            </section>}
            <section id="lesson-checkpoint" tabIndex={-1} aria-label="Knowledge checkpoint">
              {lesson.quiz?.length ? <Quiz questions={lesson.quiz} onComplete={score => { const ratio = score / lesson.quiz!.length; progress.recordQuizScore(lesson.id, Math.round(ratio * 100)); if (ratio >= 0.7) progress.completeLesson(lesson.id); }} /> : <button onClick={() => progress.completeLesson(lesson.id)} disabled={complete} className="reader-complete"><IconCheck className="w-4 h-4" />{complete ? 'Lesson completed' : 'Mark lesson complete'}</button>}
            </section>
            <nav aria-label="Previous and next lessons" className="reader-pagination">
              {prev ? <Link to={`/module/${mod.slug}/lesson/${prev.slug}`}><span>Previous lesson</span>{prev.title}</Link> : <Link to={`/module/${mod.slug}`}><span>Back to module</span>{mod.title}</Link>}
              {next ? <Link to={`/module/${mod.slug}/lesson/${next.slug}`}><span>Next lesson →</span>{next.title}</Link> : <Link to={`/roadmap?track=${track}`}><span>Continue your path →</span>Explore the roadmap</Link>}
            </nav>
          </div>
          {!wide && <aside className="reader-outline"><div className="reader-outline-inner"><p className="reader-eyebrow">In this lesson</p>{tableOfContents}<div className="reader-module-progress"><span>{completedInModule} of {mod.lessons.length} lessons complete</span><progress value={completedInModule} max={mod.lessons.length} /><Link to={`/module/${mod.slug}`}>View module →</Link></div></div></aside>}
        </div>
      </div>
      <CyberLabAI key={lesson.id} getContext={() => ({ kind: 'lesson', title: lesson.title, subtitle: mod.title, bodyText: contentRef.current?.innerText ?? '' })} />
    </div>
  );
}
