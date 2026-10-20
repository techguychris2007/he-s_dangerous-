import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { findModule } from '../data/curriculum';
import { PYTHON_TASKS, PYTHON_TASK_CATEGORIES } from '../labs/pythonTasks';
import { CPP_TASKS, CPP_TASK_CATEGORIES } from '../labs/cppTasks';
import { JS_TASKS, JS_TASK_CATEGORIES } from '../labs/jsTasks';
import { SECURITY_TASKS, SECURITY_TASK_CATEGORIES } from '../labs/securityTasks';
import type { CodeLanguage } from '../labs/codeTypes';
import { useProgress } from '../state/progressStore';
import CodeTaskCard from '../components/code/CodeTaskCard';
import PortalNavigation from '../components/layout/PortalNavigation';
import { IconArrowRight, IconBook, IconCheck, IconCode, IconFlask, IconLightning, IconSearch, IconX } from '../components/layout/icons';
import { booksInTrack } from '../data/books';
import OfflineRuntimeCard from '../components/layout/OfflineRuntimeCard';

const CODE_MODULE_SLUGS = [
  'code-python-fundamentals',
  'code-python-oop',
  'code-python-advanced',
  'code-python-practice',
  'programming-algorithms',
  'programming-engineering',
];

const ALL_TASKS = [...PYTHON_TASKS, ...CPP_TASKS, ...JS_TASKS, ...SECURITY_TASKS];

const LANGUAGE_TABS: { value: CodeLanguage | 'All'; label: string }[] = [
  { value: 'All', label: 'All languages' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'javascript', label: 'JavaScript' },
];

const CATEGORIES_BY_LANGUAGE: Record<CodeLanguage, readonly string[]> = {
  python: [...PYTHON_TASK_CATEGORIES, ...SECURITY_TASK_CATEGORIES],
  cpp: CPP_TASK_CATEGORIES,
  javascript: JS_TASK_CATEGORIES,
};

const percent = (value: number, total: number) => (total ? Math.round((100 * value) / total) : 0);

export default function CodePortalPage() {
  const progress = useProgress();
  const [languageFilter, setLanguageFilter] = useState<CodeLanguage | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Keep the task catalog responsive first, then fetch and initialize the editor package after
    // its first paint. The task editor shares this initialized Monaco instance when opened.
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void import('../lib/monacoLoader').then(({ preloadMonaco }) => preloadMonaco()).catch(() => {});
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  const codeModules = useMemo(
    () => CODE_MODULE_SLUGS.map((slug) => findModule(slug)).filter((m): m is NonNullable<typeof m> => Boolean(m)),
    [],
  );
  const totalLessons = useMemo(() => codeModules.reduce((sum, m) => sum + m.lessons.length, 0), [codeModules]);
  const lessonsDone = useMemo(
    () => codeModules.reduce((sum, m) => sum + m.lessons.filter((l) => progress.isLessonComplete(l.id)).length, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [codeModules, progress.completedLessons],
  );

  const tasksDone = useMemo(
    () => ALL_TASKS.filter((t) => progress.isCodeTaskComplete(t.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress.completedCodeTasks],
  );
  const languageStats = useMemo(
    () =>
      LANGUAGE_TABS.filter((tab): tab is { value: CodeLanguage; label: string } => tab.value !== 'All').map((tab) => {
        const tasks = ALL_TASKS.filter((task) => task.language === tab.value);
        const solved = tasks.filter((task) => progress.isCodeTaskComplete(task.id)).length;
        return { ...tab, total: tasks.length, solved };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress.completedCodeTasks],
  );

  const categoriesForLanguage = useMemo(() => {
    if (languageFilter === 'All') return Array.from(new Set(ALL_TASKS.map((t) => t.category)));
    return CATEGORIES_BY_LANGUAGE[languageFilter];
  }, [languageFilter]);

  const search_ = search.trim().toLowerCase();
  const filteredTasks = useMemo(
    () =>
      ALL_TASKS.filter((t) => {
        if (languageFilter !== 'All' && t.language !== languageFilter) return false;
        if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
        if (search_ && !t.title.toLowerCase().includes(search_) && !t.category.toLowerCase().includes(search_)) return false;
        return true;
      }),
    [languageFilter, categoryFilter, search_],
  );

  const lessonPercent = percent(lessonsDone, totalLessons);
  const taskPercent = percent(tasksDone, ALL_TASKS.length);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <PortalNavigation />
      <section className="portal-masthead relative overflow-hidden border-b border-white/10 bg-[var(--color-navy)] text-white">

        <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[var(--color-gold-dim)]">
                Programming for cybersecurity
              </div>
              <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-[-.05em] text-white sm:text-6xl lg:text-7xl">
                Code Portal
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                A focused coding environment for security learners: structured Python lessons, browser-run practice tasks, instant tests, and a professional library in one clean workflow.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#practice-tasks" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-accent-dim)]">
                  Start practice <IconArrowRight className="h-4 w-4" />
                </a>
                <Link to="/library?track=programming" className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 bg-white/[.04] px-5 text-sm font-semibold text-white transition-colors hover:bg-white/[.09]">
                  Open library <IconBook className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/[.045] p-4">
              <div className="p-1">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10">
                      <IconLightning className="h-5 w-5 text-[var(--color-accent-dim)]" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Learning progress</div>
                      <div className="text-xs font-medium text-white/65">Your live coding progress</div>
                    </div>
                  </div>
                  <div className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/75">{taskPercent}%</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-black/10 p-3.5">
                    <div className="text-xl font-bold tracking-tight text-white">{lessonsDone}/{totalLessons}</div>
                    <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${lessonPercent}%` }} /></div>
                    <div className="mt-2 text-[10px] font-semibold uppercase tracking-[.1em] text-white/60">Lessons complete</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/10 p-3.5">
                    <div className="text-xl font-bold tracking-tight text-white">{tasksDone}/{ALL_TASKS.length}</div>
                    <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[var(--color-accent-2)]" style={{ width: `${taskPercent}%` }} /></div>
                    <div className="mt-2 text-[10px] font-semibold uppercase tracking-[.1em] text-white/60">Tasks solved</div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {languageStats.map((stat) => {
                    const active = languageFilter === stat.value;
                    return (
                      <button
                        key={stat.value}
                        onClick={() => {
                          setLanguageFilter(stat.value);
                          setCategoryFilter('All');
                        }}
                        aria-pressed={active}
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-left transition-colors ${active ? 'border-[var(--color-accent)]/45 bg-[var(--color-accent)]/10' : 'border-white/10 bg-white/[.025] hover:bg-white/[.06]'}`}
                      >
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{stat.label}</span>
                          <span className="font-medium text-white/65">{stat.solved}/{stat.total}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--color-surface-2)]" style={{ width: `${percent(stat.solved, stat.total)}%` }} /></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:py-14">
        <OfflineRuntimeCard />
          <Link to="/library?track=programming" className="group mb-10 grid gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"><IconBook className="h-5 w-5" /></div>
          <div>
            <div className="text-lg font-black tracking-[-.03em] text-[var(--color-heading)]">Curated programming library</div>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--color-text-dim)]">
              {booksInTrack('programming').length} complete, legally free programming books. Read cached PDFs inside DarkWorld and use official-source links when a title cannot be embedded.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-black text-[var(--color-accent)] group-hover:translate-x-1">Open Library <IconArrowRight className="h-4 w-4" /></span>
        </Link>

        <section className="mb-12">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[var(--color-accent)]"><IconCode className="h-4 w-4" /> Guided curriculum</div>
              <h2 className="text-2xl font-black tracking-[-.04em] text-[var(--color-heading)] sm:text-3xl">Python curriculum — {codeModules.length} modules</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-dim)]">From fundamentals to OOP and advanced Python. Each lesson connects to runnable practice tasks, so learners read, write, test, and repeat.</p>
            </div>
            <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black text-[var(--color-text-dim)]">{lessonPercent}% lesson progress</div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {codeModules.map((mod, index) => {
              const doneCount = mod.lessons.filter((lesson) => progress.isLessonComplete(lesson.id)).length;
              return (
                <div key={mod.slug} className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]/45 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-surface-2)] text-sm font-bold text-[var(--color-accent)]">{String(index + 1).padStart(2, '0')}</div>
                    <span className="text-xs font-bold text-[var(--color-text-dim)]">{doneCount}/{mod.lessons.length} done</span>
                  </div>
                  <Link to={`/module/${mod.slug}`} className="text-base font-black tracking-[-.03em] text-[var(--color-heading)] hover:text-[var(--color-accent)]">{mod.title}</Link>
                  <div className="mt-4 space-y-2">
                    {mod.lessons.map((lesson) => {
                      const done = progress.isLessonComplete(lesson.id);
                      return (
                        <Link key={lesson.id} to={`/module/${mod.slug}/lesson/${lesson.slug}`} className="flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/55">
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] ${done ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]'}`}>{done ? <IconCheck className="h-3.5 w-3.5" /> : lesson.minutes}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--color-heading)]">{lesson.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="practice-tasks">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[var(--color-accent)]"><IconFlask className="h-4 w-4" /> Practice catalog</div>
              <h2 className="text-2xl font-black tracking-[-.04em] text-[var(--color-heading)] sm:text-3xl">Build skill through graded exercises</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-dim)]">Write the function yourself, run the tests, study the result, and improve the solution. Filters stay visible and task cards surface difficulty, language, and status.</p>
            </div>
            <div className="text-sm font-bold text-[var(--color-text-dim)]">Showing <span className="text-[var(--color-heading)]">{filteredTasks.length}</span> of {ALL_TASKS.length}</div>
          </div>

          <div className="mb-7 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks or categories..."
                  aria-label="Search practice tasks"
                  className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pl-11 pr-10 text-sm font-semibold text-[var(--color-heading)] outline-none placeholder:font-medium placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)]/60 focus:ring-4 focus:ring-[var(--color-accent)]/10"
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]"><IconX className="h-3.5 w-3.5" /></button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by programming language">
                  {LANGUAGE_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setLanguageFilter(tab.value);
                        setCategoryFilter('All');
                      }}
                      aria-pressed={languageFilter === tab.value}
                      className={`rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${languageFilter === tab.value ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-heading)]'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by task category">
                  {['All', ...categoriesForLanguage].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      aria-pressed={categoryFilter === cat}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${categoryFilter === cat ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-heading)]'}`}
                    >
                      {cat}
                      {cat !== 'All' && <span className="ml-1.5 opacity-65">{ALL_TASKS.filter((t) => (languageFilter === 'All' || t.language === languageFilter) && t.category === cat).length}</span>}
                    </button>
                  ))}
                </div>
                {(languageFilter !== 'All' || categoryFilter !== 'All' || search_) && <button onClick={() => { setLanguageFilter('All'); setCategoryFilter('All'); setSearch(''); }} className="self-start text-xs font-semibold text-[var(--color-accent)] hover:underline">Clear filters</button>}
              </div>
            </div>
          </div>

          {filteredTasks.length === 0 && (
            <div className="mb-6 rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-text-dim)]">
              {search_ ? <>No tasks match &ldquo;{search}&rdquo;.</> : 'No tasks match this filter.'}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => <CodeTaskCard key={task.id} task={task} />)}
          </div>
        </section>
      </main>
    </div>
  );
}
