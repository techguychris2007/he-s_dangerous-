import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SE_TASK_INDEX, SE_TRACKS, seCategoriesFor, type SeTaskMeta } from '../labs/seTasks';
import type { SeLanguage, SeTrack } from '../labs/projectTypes';
import { useProgress } from '../state/progressStore';
import ProjectTaskCard from '../components/code/ProjectTaskCard';
import Logo from '../components/layout/Logo';
import { IconArrowRight, IconCode, IconFlask, IconLayers, IconLightning, IconSearch, IconX } from '../components/layout/icons';
import { preloadMonaco } from '../lib/monacoLoader';
import OfflineRuntimeCard from '../components/layout/OfflineRuntimeCard';

const LANGUAGES: SeLanguage[] = ['python', 'javascript', 'cpp'];
const LANGUAGE_LABEL: Record<SeLanguage, string> = { python: 'Python', javascript: 'JavaScript', cpp: 'C++' };
const TRACK_LABEL: Record<SeTrack, string> = { foundations: 'Foundations', backend: 'Backend', fullstack: 'Full-Stack', systems: 'Systems' };
const PAGE_SIZE = 30;

type StatusFilter = 'All' | 'Not started' | 'In progress' | 'Solved';

export default function BuildPortalPage() {
  const progress = useProgress();
  const [language, setLanguage] = useState<SeLanguage>('python');
  // Start on the backend track so the newly added software-engineering and agentic-AI projects are
  // immediately visible when learners open the portal. Foundations remain one click away.
  const [track, setTrack] = useState<SeTrack>('backend');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    preloadMonaco();
  }, []);

  const tracksForLanguage = SE_TRACKS[language];
  // Switching to a language whose tracks don't include the currently-selected one (e.g. C++ has no
  // 'fullstack') needs to land somewhere valid rather than silently showing zero results.
  const effectiveTrack = tracksForLanguage.includes(track) ? track : tracksForLanguage[0];
  const categories = useMemo(() => seCategoriesFor(language, effectiveTrack), [language, effectiveTrack]);

  const totalDone = SE_TASK_INDEX.filter((t) => progress.isCodeTaskComplete(t.id)).length;
  const totalPercent = SE_TASK_INDEX.length ? Math.round((totalDone / SE_TASK_INDEX.length) * 100) : 0;

  const search_ = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return SE_TASK_INDEX.filter((t) => {
      if (t.language !== language || t.track !== effectiveTrack) return false;
      if (category !== 'All' && t.category !== category) return false;
      if (search_ && !t.title.toLowerCase().includes(search_) && !t.summary.toLowerCase().includes(search_) && !t.category.toLowerCase().includes(search_) && !t.tags?.some((tag) => tag.includes(search_))) return false;
      if (status !== 'All') {
        const attempts = progress.codeTaskAttempts[t.id] ?? 0;
        const done = progress.isCodeTaskComplete(t.id);
        if (status === 'Solved' && !done) return false;
        if (status === 'In progress' && (done || attempts === 0)) return false;
        if (status === 'Not started' && (done || attempts > 0)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, effectiveTrack, category, status, search_, progress.codeTaskAttempts, progress.completedCodeTasks]);

  const visible = filtered.slice(0, visibleCount);
  const trackDoneCount = SE_TASK_INDEX.filter((t) => t.language === language && t.track === effectiveTrack && progress.isCodeTaskComplete(t.id)).length;
  const trackTotalCount = SE_TASK_INDEX.filter((t) => t.language === language && t.track === effectiveTrack).length;

  const resetPaging = () => setVisibleCount(PAGE_SIZE);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <section className="portal-masthead relative overflow-hidden border-b border-white/10 bg-[var(--color-navy)] text-white">
        <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8 lg:py-10">
          <nav className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="group inline-flex items-center gap-3 text-sm font-bold text-white/75 transition-colors hover:text-white">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[.06] group-hover:border-white/25"><Logo className="h-5 w-5" /></span>
              <span>&larr; Back to DarkWorld</span>
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-white/75">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" /> Multi-file browser IDE
            </div>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[var(--color-gold-dim)]"><IconCode className="h-4 w-4" /> Software engineering practice</div>
              <h1 className="text-5xl font-bold leading-tight tracking-[-.05em] text-white sm:text-6xl">Build Portal</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Build complete software projects in a VS Code-powered workspace. Work across real files, run tests, inspect results, and develop engineering habits through practical Python, JavaScript, and C++ assignments.
              </p>
              <a href="#build-projects" className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-accent-dim)]">
                Browse projects <IconArrowRight className="h-4 w-4" />
              </a>
            </div>

            <aside className="rounded-xl border border-white/15 bg-white/[.045] p-4" aria-label="Build Portal progress">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10"><IconLightning className="h-5 w-5 text-[var(--color-accent-dim)]" /></div>
                <div><div className="text-base font-bold text-white">Project progress</div><div className="text-xs text-white/65">Your engineering practice</div></div>
                <span className="ml-auto rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/80">{totalPercent}%</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/10 p-3.5">
                <div className="flex items-baseline justify-between"><span className="text-2xl font-bold tracking-tight text-white">{totalDone}<span className="text-base text-white/50"> / {SE_TASK_INDEX.length}</span></span><span className="text-[10px] font-semibold uppercase tracking-[.1em] text-white/60">Projects solved</span></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${totalPercent}%` }} /></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => <div key={lang} className="rounded-lg border border-white/10 bg-white/[.025] px-3 py-2.5"><div className="text-xs font-semibold text-white">{LANGUAGE_LABEL[lang]}</div><div className="mt-1 text-[10px] text-white/55">{SE_TASK_INDEX.filter((task) => task.language === lang).length} projects</div></div>)}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <main id="build-projects" className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:py-12">
        <OfflineRuntimeCard />
        <section className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--color-accent)]"><IconFlask className="h-4 w-4" /> Project catalog</div><h2 className="text-2xl font-bold tracking-[-.04em] text-[var(--color-heading)] sm:text-3xl">Build, test, and ship</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-dim)]">Choose a language and track, then work through practical multi-file assignments with automated checks.</p></div>
          <div className="text-sm font-semibold text-[var(--color-text-dim)]">Showing <span className="text-[var(--color-heading)]">{filtered.length}</span> of {trackTotalCount} projects</div>
        </section>

        <section className="mb-7 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5" aria-label="Filter build projects">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); resetPaging(); }} placeholder="Search projects, skills, or categories..." aria-label="Search projects" className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] pl-11 pr-10 text-sm font-medium text-[var(--color-heading)] outline-none placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)]/60 focus:ring-4 focus:ring-[var(--color-accent)]/10" />
            {search && <button onClick={() => { setSearch(''); resetPaging(); }} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]"><IconX className="h-3.5 w-3.5" /></button>}
          </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by language">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setCategory('All');
                resetPaging();
              }}
              aria-pressed={language === lang}
              className={`rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                language === lang
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-heading)]'
              }`}
            >
              {LANGUAGE_LABEL[lang]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by track">
          {tracksForLanguage.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTrack(t);
                setCategory('All');
                resetPaging();
              }}
              aria-pressed={effectiveTrack === t}
              className={`rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                effectiveTrack === t
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-heading)]'
              }`}
            >
              {TRACK_LABEL[t]}
            </button>
          ))}
          <span className="ml-auto flex items-center text-xs font-semibold text-[var(--color-text-dim)]">{trackDoneCount} / {trackTotalCount} solved</span>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                resetPaging();
              }}
              aria-pressed={category === cat}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                category === cat
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-heading)]'
              }`}
            >
              {cat}
              {cat !== 'All' && <span className="ml-1.5 opacity-65">{SE_TASK_INDEX.filter((task) => task.language === language && task.track === effectiveTrack && task.category === cat).length}</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4" role="group" aria-label="Filter by progress status">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--color-text-dim)]">Progress</span>
          {(['All', 'Not started', 'In progress', 'Solved'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                resetPaging();
              }}
              aria-pressed={status === s}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                status === s
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/45 hover:text-[var(--color-heading)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {(category !== 'All' || status !== 'All' || search_) && (
          <button onClick={() => { setCategory('All'); setStatus('All'); setSearch(''); resetPaging(); }} className="self-start text-xs font-semibold text-[var(--color-accent)] hover:underline">Clear filters</button>
        )}
        </div>
        </section>

        {filtered.length === 0 ? (
          <div className="mb-6 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-text-dim)]">
            {search_ ? <>No projects match &ldquo;{search}&rdquo;.</> : 'No projects match this filter yet — more are on the way.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((task: SeTaskMeta) => (
                <ProjectTaskCard key={task.id} task={task} />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="flex justify-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-dim)] transition-colors hover:border-[var(--color-accent)]/45 hover:text-[var(--color-heading)]"
                >
                  <IconLayers className="w-4 h-4" /> Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
