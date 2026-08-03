import { Link } from 'react-router-dom';
import { ML_LESSONS, ML_UNITS } from '../data/mlLessons';
import { ML_TASKS } from '../labs/mlTasks';
import { useProgress } from '../state/progressStore';
import Logo from '../components/layout/Logo';
import { IconCheck, IconCode } from '../components/layout/icons';

export default function MlPortalPage() {
  const progress = useProgress();
  const tasksDone = ML_TASKS.filter((t) => progress.isCodeTaskComplete(t.id)).length;
  const liveDemoCount = ML_LESSONS.filter((l) => l.demo).length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* hero */}
      <div
        className="relative overflow-hidden border-b border-[var(--color-border)]"
        style={{ background: 'linear-gradient(180deg, var(--color-navy) 0%, var(--color-navy-dim) 100%)' }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
              <Logo className="w-6 h-6" />
              &larr; Back to DarkWorld
            </Link>
            <span className="pill bg-white/10 text-white/80 border border-white/20">Standalone Portal</span>
          </div>
          <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-3">
            Data Science &amp; Machine Learning
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">ML Portal</h1>
          <p className="text-white/70 max-w-2xl leading-relaxed mb-6">
            A full machine learning curriculum, grounded in the GCI World course and rounded out into 10
            units — from Python and statistics foundations through classical ML, neural networks, NLP, time
            series, and MLOps. Every unit ends in a real, auto-graded Python coding challenge, and two
            lessons run live ML algorithms right in your browser.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{ML_LESSONS.length}</div>
              <div className="text-2xs text-white/60 uppercase tracking-wide">Lessons across {ML_UNITS.length} units</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{tasksDone}/{ML_TASKS.length}</div>
              <div className="text-2xs text-white/60 uppercase tracking-wide">Coding challenges solved</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{liveDemoCount}</div>
              <div className="text-2xs text-white/60 uppercase tracking-wide">Live in-browser demos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        {/* unit jump nav */}
        <div className="flex flex-wrap gap-2 mb-10 sticky top-0 z-10 bg-[var(--color-bg)] py-3 -mx-6 px-6 sm:-mx-8 sm:px-8 border-b border-[var(--color-border)]">
          {ML_UNITS.map((unit) => (
            <a
              key={unit.id}
              href={`#unit-${unit.id}`}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 transition-colors"
            >
              {unit.title}
            </a>
          ))}
        </div>

        {ML_UNITS.map((unit) => {
          const lessons = ML_LESSONS.filter((l) => l.unit === unit.id);
          if (lessons.length === 0) return null;
          return (
            <div key={unit.id} id={`unit-${unit.id}`} className="mb-12 scroll-mt-20">
              <h2 className="text-lg font-bold text-[var(--color-heading)] mb-1">{unit.title}</h2>
              <p className="text-sm text-[var(--color-text-dim)] mb-4 max-w-2xl">{unit.blurb}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => {
                  const hasChallenge = Boolean(lesson.challengeTaskId);
                  const challengeDone = lesson.challengeTaskId ? progress.isCodeTaskComplete(lesson.challengeTaskId) : false;
                  return (
                    <Link
                      key={lesson.id}
                      to={`/ml-lesson/${lesson.id}`}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="text-xs font-mono text-[var(--color-text-dim)]">{lesson.source}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {lesson.demo && (
                            <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-2xs">
                              Live demo
                            </span>
                          )}
                          {challengeDone && <IconCheck className="w-4 h-4 text-[var(--color-success)]" />}
                        </div>
                      </div>
                      <div
                        className="font-semibold text-[var(--color-heading)] text-sm mb-1"
                        dangerouslySetInnerHTML={{ __html: lesson.title }}
                      />
                      {hasChallenge && (
                        <div className="flex items-center gap-1 text-2xs text-[var(--color-text-dim)]">
                          <IconCode className="w-3 h-3" /> Coding challenge included
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
