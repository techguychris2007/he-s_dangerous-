import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ML_LESSONS, ML_MODULES } from '../data/mlLessons';
import { ML_TASKS } from '../labs/mlTasks';
import { useProgress } from '../state/progressStore';
import PortalNavigation from '../components/layout/PortalNavigation';
import { IconCheck, IconCode, IconLightning } from '../components/layout/icons';
import OfflineRuntimeCard from '../components/layout/OfflineRuntimeCard';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import LessonPath, { type PathNode } from '../components/learning/LessonPath';
import IsoBlock from '../components/labs/IsoBlock';
import '../components/labs/catalog.css';
import '../components/learning/ml-portal.css';

const LIVE_DEMO_COUNT = ML_LESSONS.filter((l) => l.demo).length;
/** One crest per module, in curriculum order. */
const MODULE_ICONS = ['python', 'database', 'binary', 'layers', 'lightning', 'radar', 'flag', 'brain', 'brain', 'book', 'refresh', 'cloud', 'engineering'];

export default function MlPortalPage() {
  const progress = useProgress();
  const tasksDone = useMemo(
    () => ML_TASKS.filter((t) => progress.isCodeTaskComplete(t.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress.completedCodeTasks],
  );

  // A lesson counts as cleared once its coding challenge passes; lessons without one count as open.
  const units = useMemo(() => ML_MODULES.map((unit, i) => {
    const lessons = ML_LESSONS.filter((l) => l.unit === unit.id);
    const graded = lessons.filter((l) => l.challengeTaskId);
    const solved = graded.filter((l) => progress.isCodeTaskComplete(l.challengeTaskId!)).length;
    const next = lessons.find((l) => l.challengeTaskId && !progress.isCodeTaskComplete(l.challengeTaskId)) ?? lessons[0];
    return { unit, lessons, graded: graded.length, solved, next, icon: MODULE_ICONS[i % MODULE_ICONS.length] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [progress.completedCodeTasks]);
  const currentIndex = units.findIndex((u) => u.graded > 0 && u.solved < u.graded);

  const nodes: PathNode[] = units.filter((u) => u.lessons.length).map((u, i) => {
    const complete = u.graded > 0 && u.solved === u.graded;
    const current = units.indexOf(u) === currentIndex;
    return {
      id: u.unit.id,
      title: u.unit.title.replace(/^Module \d+ · /, ''),
      to: u.next ? `/ml-lesson/${u.next.id}` : undefined,
      state: complete ? 'done' : current ? 'current' : 'open',
      percent: current && u.graded ? (100 * u.solved) / u.graded : undefined,
      icon: u.icon,
      meta: `Module ${i + 1} · ${u.solved}/${u.graded} challenges`,
    };
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PortalNavigation />
      <div className="portal-masthead relative overflow-hidden border-b border-[var(--color-border)]" style={{ background: 'var(--color-navy)' }}>
        <span className="portal-masthead__crew" aria-hidden="true"><CharacterAvatar id="beacon" size={168} decorative /></span>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-3">Data science &amp; machine learning</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Machine Learning</h1>
          <p className="text-white/70 max-w-2xl leading-relaxed mb-6">
            {ML_MODULES.length} modules from Python and statistics foundations through classical ML, neural networks, NLP,
            time series, MLOps and production system design. Every lesson pairs a concept with a Python challenge, and
            {' '}{LIVE_DEMO_COUNT} lessons run live algorithms in your browser.
          </p>
          <Link to="/library?track=machine-learning" className="inline-flex items-center rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 mb-5">Explore the ML library &rarr;</Link>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3"><div className="text-lg font-bold text-white font-mono">{ML_LESSONS.length}</div><div className="text-2xs text-white/60 uppercase tracking-wide">Lessons</div></div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3"><div className="text-lg font-bold text-white font-mono">{tasksDone}/{ML_TASKS.length}</div><div className="text-2xs text-white/60 uppercase tracking-wide">Python labs solved</div></div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3"><div className="text-lg font-bold text-white font-mono">{LIVE_DEMO_COUNT}</div><div className="text-2xs text-white/60 uppercase tracking-wide">Live demos</div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-10" aria-labelledby="ml-journey">
          <div className="dw-section-head">
            <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">Learning path</p><h2 id="ml-journey">Your ML journey</h2><p className="dw-section-sub">Each tile is a module. Clear its coding challenges to light it up; the glowing tile is your next stop.</p></div>
            <span>{units.reduce((n, u) => n + u.solved, 0)}/{units.reduce((n, u) => n + u.graded, 0)} challenges</span>
          </div>
          <LessonPath eyebrow={`Machine learning track · ${units.filter((u) => u.graded && u.solved === u.graded).length}/${nodes.length} modules cleared`} title="From Python to production ML" guide="beacon" nodes={nodes} />
        </section>

        <OfflineRuntimeCard />

        <nav className="ml-jump" aria-label="Jump to a module">
          {units.filter((u) => u.lessons.length).map((u, i) => (
            <a key={u.unit.id} href={`#module-${u.unit.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`module-${u.unit.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} data-done={u.graded > 0 && u.solved === u.graded}>
              <b>{i + 1}</b>{u.unit.title.replace(/^Module \d+ · /, '')}
            </a>
          ))}
        </nav>

        {units.filter((u) => u.lessons.length).map((u, m) => (
          <section key={u.unit.id} id={`module-${u.unit.id}`} className="ml-module" aria-labelledby={`ml-mod-${u.unit.id}`}>
            <div className="dw-section-head">
              <div className="ml-module__title">
                <IsoBlock width={54} depth={10} tone={u.graded && u.solved === u.graded ? 'done' : m === currentIndex ? 'progress' : 'analysis'} crest={<b className="ml-module__num">{m + 1}</b>} />
                <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">Module {m + 1}</p><h2 id={`ml-mod-${u.unit.id}`}>{u.unit.title.replace(/^Module \d+ · /, '')}</h2><p className="dw-section-sub">{u.unit.blurb}</p></div>
              </div>
              <span>{u.solved}/{u.graded} challenges</span>
            </div>
            <div className="ml-grid">
              {u.lessons.map((lesson, i) => {
                const solved = lesson.challengeTaskId ? progress.isCodeTaskComplete(lesson.challengeTaskId) : false;
                return (
                  <Link key={lesson.id} to={`/ml-lesson/${lesson.id}`} className="ml-card" data-done={solved}>
                    <span className="ml-card__num" aria-hidden="true">{solved ? <IconCheck className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, '0')}</span>
                    <span className="ml-card__body">
                      <small>{lesson.source}</small>
                      <strong dangerouslySetInnerHTML={{ __html: lesson.title }} />
                      <span className="ml-card__tags">
                        {lesson.challengeTaskId && <em data-done={solved}><IconCode className="h-3 w-3" />{solved ? 'Challenge solved' : 'Coding challenge'}</em>}
                        {lesson.demo && <em className="is-demo"><IconLightning className="h-3 w-3" />Live demo</em>}
                      </span>
                    </span>
                    <span className="ml-card__go" aria-hidden="true">→</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
