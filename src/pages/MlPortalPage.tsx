import { Link } from 'react-router-dom';
import { ML_LESSONS } from '../data/mlLessons';
import Logo from '../components/layout/Logo';
import { IconChart, IconFlask } from '../components/layout/icons';

const GROUPS = ['Foundations', 'Machine Learning', 'Data Engineering'];

export default function MlPortalPage() {
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
            A self-paced walkthrough of the GCI World data science curriculum — Python basics through
            supervised and unsupervised learning — with two lessons that run real machine learning
            algorithms live in your browser: ordinary least squares regression and k-means clustering.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{ML_LESSONS.length}</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wide">Lessons</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">2</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wide">Live interactive demos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        {GROUPS.map((group) => {
          const lessons = ML_LESSONS.filter((l) => l.group === group);
          if (lessons.length === 0) return null;
          return (
            <div key={group} className="mb-10">
              <div className="flex items-center gap-2 mb-1">
                {group === 'Machine Learning' ? (
                  <IconFlask className="w-4 h-4 text-[var(--color-accent)]" />
                ) : (
                  <IconChart className="w-4 h-4 text-[var(--color-accent)]" />
                )}
                <h2 className="text-lg font-bold text-[var(--color-heading)]">{group}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                {lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    to={`/ml-lesson/${lesson.id}`}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono text-[var(--color-text-dim)]">{lesson.source}</span>
                      {lesson.demo && (
                        <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-[10px]">
                          Live demo
                        </span>
                      )}
                    </div>
                    <div
                      className="font-semibold text-[var(--color-heading)] text-sm"
                      dangerouslySetInnerHTML={{ __html: lesson.title }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
