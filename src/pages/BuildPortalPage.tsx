import { useEffect, useMemo, useState } from 'react';
import { SE_TASK_INDEX, SE_TRACKS, seCategoriesFor, type SeTaskMeta } from '../labs/seTasks';
import type { SeLanguage, SeTrack } from '../labs/projectTypes';
import { useProgress } from '../state/progressStore';
import ProjectTaskCard from '../components/code/ProjectTaskCard';
import PortalNavigation from '../components/layout/PortalNavigation';
import { IconArrowRight, IconSearch, IconX } from '../components/layout/icons';
import PortalHero, { type PortalStation } from '../components/layout/PortalHero';
import '../components/labs/catalog.css';
import { preloadMonaco } from '../lib/monacoLoader';
import OfflineRuntimeCard from '../components/layout/OfflineRuntimeCard';

const LANGUAGES: SeLanguage[] = ['python', 'javascript', 'cpp'];
const LANGUAGE_LABEL: Record<SeLanguage, string> = { python: 'Python', javascript: 'JavaScript', cpp: 'C++' };
const TRACK_LABEL: Record<SeTrack, string> = { foundations: 'Foundations', backend: 'Backend', fullstack: 'Full-Stack', systems: 'Systems' };
const TRACK_ICON: Record<SeTrack, string> = { foundations: 'code', backend: 'database', fullstack: 'web', systems: 'chip' };
const PAGE_SIZE = 30;
const CHIP_LIMIT = 12;

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
  const [allCategories, setAllCategories] = useState(false);

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
  const isFiltering = category !== 'All' || status !== 'All' || !!search_;
  const languageDone = SE_TASK_INDEX.filter((t) => t.language === language && progress.isCodeTaskComplete(t.id)).length;
  const languageTotal = SE_TASK_INDEX.filter((t) => t.language === language).length;
  const stations: PortalStation[] = tracksForLanguage.map((t) => {
    const inTrack = SE_TASK_INDEX.filter((task) => task.language === language && task.track === t);
    return {
      id: t,
      label: TRACK_LABEL[t],
      sub: `${inTrack.filter((task) => progress.isCodeTaskComplete(task.id)).length}/${inTrack.length} shipped`,
      icon: TRACK_ICON[t],
      done: inTrack.filter((task) => progress.isCodeTaskComplete(task.id)).length,
      total: inTrack.length,
      active: effectiveTrack === t,
      onSelect: () => {
        setTrack(t);
        setCategory('All');
        resetPaging();
        document.getElementById('build-projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    };
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PortalNavigation />
      <PortalHero
        eyebrow="Software engineering practice"
        title="Build Portal"
        description={<>Ship complete multi-file projects in a VS Code-style workspace: read the given framework, edit the files that are yours, and turn every automated check green. Pick a track on the board to start.</>}
        actions={<a href="#build-projects" className="is-primary">Browse projects <IconArrowRight className="h-4 w-4" /></a>}
        stats={[
          { label: 'Projects shipped', value: <>{totalDone}<small> / {SE_TASK_INDEX.length}</small></> },
          { label: `${LANGUAGE_LABEL[language]} track`, value: <>{languageDone}<small> / {languageTotal}</small></> },
          { label: 'Overall', value: `${totalPercent}%` },
        ]}
        stations={stations}
        guide="cipher"
        guideLine={totalDone ? 'Every green check is a commit you could defend in review. Keep shipping.' : 'Start in Foundations, then take on Backend. Real files, real tests.'}
        boardLabel={`${LANGUAGE_LABEL[language]} tracks`}
      />

      <main id="build-projects" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10" style={{ scrollMarginTop: '1rem' }}>
        <OfflineRuntimeCard />

        <section aria-label="Find and filter projects" className="dw-catalog-toolbar">
          <div className="dw-catalog-search">
            <IconSearch className="h-4 w-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); resetPaging(); }} placeholder="Search projects, skills or categories…" aria-label="Search projects" />
            {search && <button onClick={() => { setSearch(''); resetPaging(); }} aria-label="Clear search"><IconX className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="dw-segment" role="group" aria-label="Filter by language">
            {LANGUAGES.map((lang) => <button key={lang} onClick={() => { setLanguage(lang); setCategory('All'); resetPaging(); }} aria-pressed={language === lang}>{LANGUAGE_LABEL[lang]}</button>)}
          </div>
          <div className="dw-segment" role="group" aria-label="Filter by track">
            {tracksForLanguage.map((t) => <button key={t} onClick={() => { setTrack(t); setCategory('All'); resetPaging(); }} aria-pressed={effectiveTrack === t}>{TRACK_LABEL[t]}</button>)}
          </div>
          <div className="dw-segment" role="group" aria-label="Filter by progress status">
            {(['All', 'Not started', 'In progress', 'Solved'] as StatusFilter[]).map((s) => <button key={s} onClick={() => { setStatus(s); resetPaging(); }} aria-pressed={status === s}>{s}</button>)}
          </div>
          <span className="dw-catalog-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}</span>
          {isFiltering && <button className="dw-catalog-clear" onClick={() => { setCategory('All'); setStatus('All'); setSearch(''); resetPaging(); }}>Clear filters</button>}
        </section>

        <div className="dw-chipset" role="group" aria-label="Filter by category">
          {['All', ...categories].filter((cat, i) => allCategories || i < CHIP_LIMIT || cat === category).map((cat) => {
            const inCat = SE_TASK_INDEX.filter((task) => task.language === language && task.track === effectiveTrack && (cat === 'All' || task.category === cat));
            const catDone = inCat.filter((task) => progress.isCodeTaskComplete(task.id)).length;
            return (
              <button key={cat} onClick={() => { setCategory(cat); resetPaging(); }} aria-pressed={category === cat} data-done={inCat.length > 0 && catDone === inCat.length}>
                {cat}<small>{catDone}/{inCat.length}</small>
              </button>
            );
          })}
          {categories.length + 1 > CHIP_LIMIT && (
            <button type="button" className="is-more" onClick={() => setAllCategories((v) => !v)} aria-expanded={allCategories}>
              {allCategories ? 'Fewer categories' : `+${categories.length + 1 - CHIP_LIMIT} more`}
            </button>
          )}
        </div>

        <div className="dw-section-head">
          <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">{LANGUAGE_LABEL[language]} · {TRACK_LABEL[effectiveTrack]}</p><h2>{category === 'All' ? 'Projects' : category}</h2></div>
          <span>{trackDoneCount}/{trackTotalCount} shipped in this track</span>
        </div>

        {filtered.length === 0 ? (
          <div className="dw-catalog-empty">
            {search_ ? <>No projects match &ldquo;{search}&rdquo;.</> : 'No projects match this filter yet — more are on the way.'}
            {isFiltering && <button onClick={() => { setCategory('All'); setStatus('All'); setSearch(''); resetPaging(); }}>Clear filters</button>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((task: SeTaskMeta) => (
                <ProjectTaskCard key={task.id} task={task} />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="mt-6 flex justify-center">
                <button className="dw-catalog-more" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Show more projects<span>{Math.min(PAGE_SIZE, filtered.length - visibleCount)} of {filtered.length - visibleCount} remaining</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
