import { useState } from 'react';
import { Link } from 'react-router-dom';
import { findModule } from '../data/curriculum';
import { PYTHON_TASKS, PYTHON_TASK_CATEGORIES } from '../labs/pythonTasks';
import { useProgress } from '../state/progressStore';
import CodeTaskCard from '../components/code/CodeTaskCard';
import Logo from '../components/layout/Logo';
import { IconCheck, IconCode, IconFlask } from '../components/layout/icons';

const CODE_MODULE_SLUGS = ['code-python-fundamentals', 'code-python-oop', 'code-python-advanced'];

export default function CodePortalPage() {
  const progress = useProgress();
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const codeModules = CODE_MODULE_SLUGS.map((slug) => findModule(slug)).filter((m): m is NonNullable<typeof m> => Boolean(m));
  const totalLessons = codeModules.reduce((sum, m) => sum + m.lessons.length, 0);
  const lessonsDone = codeModules.reduce((sum, m) => sum + m.lessons.filter((l) => progress.isLessonComplete(l.id)).length, 0);

  const tasksDone = PYTHON_TASKS.filter((t) => progress.isCodeTaskComplete(t.id)).length;
  const filteredTasks = categoryFilter === 'All' ? PYTHON_TASKS : PYTHON_TASKS.filter((t) => t.category === categoryFilter);

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
            Programming for Cybersecurity
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Code Portal</h1>
          <p className="text-white/70 max-w-2xl leading-relaxed mb-6">
            A structured programming curriculum — fundamentals through advanced OOP — with real Python
            running live in your browser (via Pyodide/WebAssembly) for every one of the {PYTHON_TASKS.length}{' '}
            practice tasks below. Write real code, click Run, get real test feedback. Starting with Python;
            C++ and JavaScript tracks are next.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{lessonsDone}/{totalLessons}</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wide">Lessons complete</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{tasksDone}/{PYTHON_TASKS.length}</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wide">Tasks solved</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">Python</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wide">Live in-browser (C++/JS next)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        {/* lessons */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <IconCode className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-heading)]">Python Curriculum — 3 Modules</h2>
          </div>
          <p className="text-sm text-[var(--color-text-dim)] mb-4">
            From zero to advanced: fundamentals, full OOP, then decorators/generators/concurrency — each
            lesson links straight into runnable practice tasks below.
          </p>
          {codeModules.map((mod) => (
            <div key={mod.slug} className="mb-6">
              <Link to={`/module/${mod.slug}`} className="font-semibold text-[var(--color-heading)] text-sm hover:text-[var(--color-accent-dim)] transition-colors">
                {mod.title} &rarr;
              </Link>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {mod.lessons.map((lesson) => {
                  const done = progress.isLessonComplete(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      to={`/module/${mod.slug}/lesson/${lesson.slug}`}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-[var(--color-text-dim)]">{lesson.minutes} min read</span>
                        {done && <IconCheck className="w-4 h-4 text-[var(--color-success)]" />}
                      </div>
                      <div className="font-semibold text-[var(--color-heading)] text-sm mb-1">{lesson.title}</div>
                      <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{lesson.summary}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* task catalog */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IconFlask className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-heading)]">Python Practice Tasks</h2>
          </div>
          <p className="text-sm text-[var(--color-text-dim)] mb-4">
            Each task runs real Python in your browser and grades itself — write the function, click "Run
            tests," get an instant PASS/FAIL report.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {['All', ...PYTHON_TASK_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
                }`}
              >
                {cat}
                {cat !== 'All' && (
                  <span className="ml-1.5 opacity-70">{PYTHON_TASKS.filter((t) => t.category === cat).length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => (
              <CodeTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
