import LearningActions from '../components/lesson/LearningActions';
import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { findModule, ROADMAP } from '../data/curriculum';
import { labsForLesson } from '../data/lessonLabs';
import { useProgress } from '../state/progressStore';
import type { ModuleMeta, LessonMeta } from '../types';
import BeginnerGlossary from '../components/lesson/BeginnerGlossary';
import LessonTasks from '../components/lesson/LessonTasks';
import PrerequisitePrimer from '../components/lesson/PrerequisitePrimer';
import LessonLabCard from '../components/lesson/LessonLabCard';
import CodeTaskCard from '../components/code/CodeTaskCard';
import SiemLabCard from '../components/siem/SiemLabCard';
import { SIEM_LABS } from '../labs/siemScenarios';
import { PYTHON_TASKS } from '../labs/pythonTasks';
import CyberLabAI from '../components/labs/CyberLabAI';
import { IconCheck } from '../components/layout/icons';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import { guideForArea } from '../data/characters';
import { LESSON_XP, QUIZ_MAX_XP } from '../data/levels';
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
    try { const size = Number(localStorage.getItem('darkworld.reader.fontSize')); return [17, 19, 21].includes(size) ? size : 17; }
    catch { return 17; }
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
        <LearningActions back={{ href: `/module/${mod.slug}`, label: 'Back to module' }} previous={prev ? `/module/${mod.slug}/lesson/${prev.slug}` : undefined} next={next ? `/module/${mod.slug}/lesson/${next.slug}` : undefined} />
        <div className="reader-progress" role="progressbar" aria-label="Reading progress" aria-valuenow={readingProgress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${readingProgress}%` }} /></div>
        <div className={`reader-layout ${wide ? 'reader-layout-wide' : ''}`}>
          <div className="min-w-0">
            <header className="reader-room">
              <nav aria-label="Breadcrumb" className="reader-room__crumbs">
                <Link to={`/roadmap?track=${track}`}>Roadmap</Link><span aria-hidden="true"> › </span>
                <Link to={`/module/${mod.slug}`}>{mod.title}</Link><span aria-hidden="true"> › </span>
                <span aria-current="page">{lesson.title}</span>
              </nav>
              <div className="reader-room__head">
                <CharacterAvatar id={guideForArea(mod.slug)} size={84} />
                <div className="min-w-0">
                  <h1>{lesson.title}</h1>
                  <p className="reader-room__summary">{lesson.summary}</p>
                  <ul className="reader-room__meta">
                    <li>Lesson {idx + 1} of {mod.lessons.length}</li>
                    <li>~{lesson.minutes} min</li>
                    {labSlugs.length > 0 && <li>{labSlugs.length} practice {labSlugs.length === 1 ? 'lab' : 'labs'}</li>}
                    <li className="reader-room__xp">+{LESSON_XP + (lesson.quiz?.length ? QUIZ_MAX_XP : 0)} XP</li>
                    {complete && <li className="reader-room__done"><IconCheck className="w-3.5 h-3.5" />Completed</li>}
                  </ul>
                </div>
              </div>
              <div className="reader-room__actions">
                <button type="button" onClick={() => jumpTo('lesson-checkpoint')}>{complete ? 'Review checkpoint' : 'Jump to questions'}</button>
                <button type="button" aria-pressed={wide} onClick={() => setWide(current => !current)}>{wide ? 'Show outline' : 'Focus reading'}</button>
                <label>Text size <select aria-label="Lesson text size" value={fontSize} onChange={event => { const size = Number(event.target.value); setFontSize(size); try { localStorage.setItem('darkworld.reader.fontSize', String(size)); } catch { /* Reading remains available without storage. */ } }}><option value={17}>Standard</option><option value={19}>Large</option><option value={21}>Extra large</option></select></label>
              </div>
              <div className="reader-room__progress" role="progressbar" aria-label="Room progress" aria-valuenow={complete ? 100 : readingProgress} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${complete ? 100 : readingProgress}%` }} />
                <b>Room progress: {complete ? 100 : readingProgress}%</b>
              </div>
            </header>
            {lesson.objectives?.length ? <section className="reader-objectives" aria-label="Learning objectives"><h2>What you will be able to do</h2><ul>{lesson.objectives.map(item => <li key={item}>{item}</li>)}</ul></section> : null}
            <details className="reader-mobile-outline"><summary>In this lesson</summary>{tableOfContents}</details>
            <BeginnerGlossary targetRef={contentRef} resetKey={lesson.id} />
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
            <section id="lesson-checkpoint" tabIndex={-1} aria-labelledby="lesson-checkpoint-title" className="reader-questions">
              <h2 id="lesson-checkpoint-title" className="sr-only">Answer the questions below</h2>
              <LessonTasks lesson={lesson} labSlugs={labSlugs} />
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
