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
import { IconArrowRight, IconBook, IconSearch, IconX } from '../components/layout/icons';
import PortalHero, { type PortalStation } from '../components/layout/PortalHero';
import LessonPath from '../components/learning/LessonPath';
import '../components/labs/catalog.css';
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

const LANGUAGE_ICON: Record<CodeLanguage, string> = { python: 'python', cpp: 'chip', javascript: 'code' };
const STATUSES = ['All', 'Not started', 'In progress', 'Solved'] as const;
const PAGE_SIZE = 24;
const CHIP_LIMIT = 12;

const percent = (value: number, total: number) => (total ? Math.round((100 * value) / total) : 0);

export default function CodePortalPage() {
  const progress = useProgress();
  const [languageFilter, setLanguageFilter] = useState<CodeLanguage | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [allCategories, setAllCategories] = useState(false);

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
  const isFiltering = languageFilter !== 'All' || categoryFilter !== 'All' || statusFilter !== 'All' || !!search_;
  const shownTasks = filteredTasks.filter((t) => {
    if (statusFilter === 'All') return true;
    const done = progress.isCodeTaskComplete(t.id);
    const attempts = progress.codeTaskAttempts[t.id] ?? 0;
    if (statusFilter === 'Solved') return done;
    if (statusFilter === 'In progress') return !done && attempts > 0;
    return !done && attempts === 0;
  });
  const visibleTasks = shownTasks.slice(0, visibleCount);
  const clearAll = () => { setLanguageFilter('All'); setCategoryFilter('All'); setStatusFilter('All'); setSearch(''); setVisibleCount(PAGE_SIZE); };
  const stations: PortalStation[] = languageStats.map((stat) => ({
    id: stat.value,
    label: stat.label,
    sub: `${stat.solved}/${stat.total} solved`,
    icon: LANGUAGE_ICON[stat.value],
    done: stat.solved,
    total: stat.total,
    active: languageFilter === stat.value,
    onSelect: () => {
      setLanguageFilter((current) => (current === stat.value ? 'All' : stat.value));
      setCategoryFilter('All');
      setVisibleCount(PAGE_SIZE);
      document.getElementById('practice-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  }));
  const currentModule = codeModules.findIndex((m) => m.lessons.some((l) => !progress.isLessonComplete(l.id)));

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <PortalNavigation />
      <PortalHero
        eyebrow="Programming for cybersecurity"
        title="Code Portal"
        description={<>Structured Python lessons, browser-run practice tasks with instant tests, and a professional library in one workflow. Pick a language on the board to filter the practice catalogue.</>}
        actions={
          <>
            <a href="#practice-tasks" className="is-primary">Start practice <IconArrowRight className="h-4 w-4" /></a>
            <Link to="/library?track=programming"><IconBook className="h-4 w-4" />Open library</Link>
          </>
        }
        stats={[
          { label: 'Lessons complete', value: <>{lessonsDone}<small> / {totalLessons}</small></> },
          { label: 'Tasks solved', value: <>{tasksDone}<small> / {ALL_TASKS.length}</small></> },
          { label: 'Overall', value: `${taskPercent}%` },
        ]}
        stations={stations}
        guide="cipher"
        guideLine={tasksDone ? 'Tests are red? Good. That’s where learning starts — keep the streak going.' : 'Start with Python Fundamentals. Every lesson has a task waiting for you.'}
        boardLabel="Languages"
      />

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <OfflineRuntimeCard />
        <Link to="/library?track=programming" className="dw-libcard">
          <span className="dw-libcard__icon"><IconBook className="h-5 w-5" /></span>
          <span>
            <strong>Curated programming library</strong>
            <small>{booksInTrack('programming').length} complete, legally free programming books. Read cached PDFs inside DarkWorld and use official-source links when a title cannot be embedded.</small>
          </span>
          <b>Open library <IconArrowRight className="h-4 w-4" /></b>
        </Link>

        <section className="mb-12" aria-labelledby="code-curriculum">
          <div className="dw-section-head">
            <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">Guided curriculum</p><h2 id="code-curriculum">Python path — {codeModules.length} modules</h2><p className="dw-section-sub">From fundamentals to OOP and advanced Python. Each module lights up as you clear its lessons, and every lesson links to runnable practice tasks.</p></div>
            <span>{lessonsDone}/{totalLessons} lessons · {lessonPercent}%</span>
          </div>
          <LessonPath
            eyebrow={`Programming track · ${codeModules.filter((m) => m.lessons.every((l) => progress.isLessonComplete(l.id))).length}/${codeModules.length} modules cleared`}
            title="Code curriculum"
            guide="cipher"
            nodes={codeModules.map((mod, i) => {
              const doneCount = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
              const complete = mod.lessons.length > 0 && doneCount === mod.lessons.length;
              return {
                id: mod.slug,
                title: mod.title,
                to: `/module/${mod.slug}`,
                state: complete ? 'done' : currentModule === i ? 'current' : 'open',
                percent: currentModule === i && mod.lessons.length ? (100 * doneCount) / mod.lessons.length : undefined,
                icon: mod.icon,
                meta: `Module ${i + 1} · ${doneCount}/${mod.lessons.length} lessons`,
              };
            })}
          />
        </section>

        <section id="practice-tasks" style={{ scrollMarginTop: '1rem' }}>
          <div className="dw-section-head">
            <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">Practice catalogue</p><h2>Graded exercises</h2><p className="dw-section-sub">Write the function yourself, run the tests, read each failing check and improve the solution.</p></div>
            <span>{tasksDone}/{ALL_TASKS.length} solved</span>
          </div>

          <section aria-label="Find and filter tasks" className="dw-catalog-toolbar">
            <div className="dw-catalog-search">
              <IconSearch className="h-4 w-4" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search tasks or categories…" aria-label="Search practice tasks" />
              {search && <button onClick={() => setSearch('')} aria-label="Clear search"><IconX className="h-3.5 w-3.5" /></button>}
            </div>
            <div className="dw-segment" role="group" aria-label="Filter by programming language">
              {LANGUAGE_TABS.map((tab) => <button key={tab.value} onClick={() => { setLanguageFilter(tab.value); setCategoryFilter('All'); setVisibleCount(PAGE_SIZE); }} aria-pressed={languageFilter === tab.value}>{tab.label}</button>)}
            </div>
            <div className="dw-segment" role="group" aria-label="Filter by progress status">
              {STATUSES.map((s) => <button key={s} onClick={() => { setStatusFilter(s); setVisibleCount(PAGE_SIZE); }} aria-pressed={statusFilter === s}>{s}</button>)}
            </div>
            <span className="dw-catalog-count" aria-live="polite">{shownTasks.length} {shownTasks.length === 1 ? 'task' : 'tasks'}</span>
            {isFiltering && <button className="dw-catalog-clear" onClick={clearAll}>Clear filters</button>}
          </section>

          <div className="dw-chipset" role="group" aria-label="Filter by task category">
            {['All', ...categoriesForLanguage].filter((cat, i) => allCategories || i < CHIP_LIMIT || cat === categoryFilter).map((cat) => {
              const inCat = ALL_TASKS.filter((t) => (languageFilter === 'All' || t.language === languageFilter) && (cat === 'All' || t.category === cat));
              const catDone = inCat.filter((t) => progress.isCodeTaskComplete(t.id)).length;
              return (
                <button key={cat} onClick={() => { setCategoryFilter(cat); setVisibleCount(PAGE_SIZE); }} aria-pressed={categoryFilter === cat} data-done={inCat.length > 0 && catDone === inCat.length}>
                  {cat}<small>{catDone}/{inCat.length}</small>
                </button>
              );
            })}
            {categoriesForLanguage.length + 1 > CHIP_LIMIT && (
              <button type="button" className="is-more" onClick={() => setAllCategories((v) => !v)} aria-expanded={allCategories}>
                {allCategories ? 'Fewer categories' : `+${categoriesForLanguage.length + 1 - CHIP_LIMIT} more`}
              </button>
            )}
          </div>

          {shownTasks.length === 0 ? (
            <div className="dw-catalog-empty">
              {search_ ? <>No tasks match &ldquo;{search}&rdquo;.</> : 'No tasks match this filter.'}
              {isFiltering && <button onClick={clearAll}>Clear filters</button>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleTasks.map((task) => <CodeTaskCard key={task.id} task={task} />)}
              </div>
              {visibleCount < shownTasks.length && (
                <div className="mt-6 flex justify-center">
                  <button className="dw-catalog-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                    Show more tasks<span>{Math.min(PAGE_SIZE, shownTasks.length - visibleCount)} of {shownTasks.length - visibleCount} remaining</span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
