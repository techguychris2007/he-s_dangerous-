import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SE_TASK_INDEX, SE_TRACKS, seCategoriesFor, type SeTaskMeta } from '../labs/seTasks';
import type { SeLanguage, SeTrack } from '../labs/projectTypes';
import { useProgress } from '../state/progressStore';
import ProjectTaskCard from '../components/code/ProjectTaskCard';
import Logo from '../components/layout/Logo';
import { IconFlask, IconLayers, IconSearch, IconX } from '../components/layout/icons';

const LANGUAGES: SeLanguage[] = ['python', 'javascript', 'cpp'];
const LANGUAGE_LABEL: Record<SeLanguage, string> = { python: 'Python', javascript: 'JavaScript', cpp: 'C++' };
const TRACK_LABEL: Record<SeTrack, string> = { foundations: 'Foundations', backend: 'Backend', fullstack: 'Full-Stack', systems: 'Systems' };
const PAGE_SIZE = 30;

type StatusFilter = 'All' | 'Not started' | 'In progress' | 'Solved';

export default function BuildPortalPage() {
  const progress = useProgress();
  const [language, setLanguage] = useState<SeLanguage>('python');
  const [track, setTrack] = useState<SeTrack>('foundations');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const tracksForLanguage = SE_TRACKS[language];
  // Switching to a language whose tracks don't include the currently-selected one (e.g. C++ has no
  // 'fullstack') needs to land somewhere valid rather than silently showing zero results.
  const effectiveTrack = tracksForLanguage.includes(track) ? track : tracksForLanguage[0];
  const categories = useMemo(() => seCategoriesFor(language, effectiveTrack), [language, effectiveTrack]);

  const totalDone = SE_TASK_INDEX.filter((t) => progress.isCodeTaskComplete(t.id)).length;

  const search_ = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return SE_TASK_INDEX.filter((t) => {
      if (t.language !== language || t.track !== effectiveTrack) return false;
      if (category !== 'All' && t.category !== category) return false;
      if (search_ && !t.title.toLowerCase().includes(search_) && !t.category.toLowerCase().includes(search_) && !t.tags?.some((tag) => tag.includes(search_))) return false;
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
          <div className="flex items-center justify-between flex-wrap gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
              <Logo className="w-6 h-6" />
              &larr; Back to DarkWorld
            </Link>
            <span className="pill bg-white/10 text-white/80 border border-white/20">Standalone Portal</span>
          </div>
          <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-3">
            Software Engineering, Project-Based
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Build Portal</h1>
          <p className="text-white/70 max-w-2xl leading-relaxed mb-6">
            Real, multi-file projects — not isolated katas. A genuine VS Code-caliber editor (Monaco, the
            same engine VS Code itself uses), real file trees, and for frontend work, real rendered-DOM
            tests against a live preview — separate from the Code Portal's single-file security-flavored
            practice tasks.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 min-w-[160px]">
              <div className="text-lg font-bold text-white mb-1.5">{totalDone}/{SE_TASK_INDEX.length}</div>
              <div className="h-1 rounded-full bg-white/15 overflow-hidden mb-1.5">
                <div className="h-full rounded-full bg-[var(--color-success)]" style={{ width: `${SE_TASK_INDEX.length ? (100 * totalDone) / SE_TASK_INDEX.length : 0}%` }} />
              </div>
              <div className="text-2xs text-white/60 uppercase tracking-wide">Projects solved</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">Python · JavaScript · C++</div>
              <div className="text-2xs text-white/60 uppercase tracking-wide">Multi-file, real Monaco editor</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        <div className="flex items-center gap-2 mb-1">
          <IconFlask className="w-4 h-4 text-[var(--color-accent)]" />
          <h2 className="text-lg font-bold text-[var(--color-heading)]">Projects</h2>
        </div>
        <p className="text-sm text-[var(--color-text-dim)] mb-4">
          Each project runs real code in your browser — Python via Pyodide/WebAssembly, JavaScript
          natively (plus a real sandboxed DOM for frontend work), C++ via an in-browser interpreter.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setLanguage(lang);
                setCategory('All');
                resetPaging();
              }}
              aria-pressed={language === lang}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                language === lang
                  ? 'bg-[var(--color-heading)] border-[var(--color-heading)] text-[var(--color-bg)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
              }`}
            >
              {LANGUAGE_LABEL[lang]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {tracksForLanguage.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTrack(t);
                setCategory('All');
                resetPaging();
              }}
              aria-pressed={effectiveTrack === t}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                effectiveTrack === t
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
              }`}
            >
              {TRACK_LABEL[t]}
            </button>
          ))}
          <span className="ml-1 flex items-center text-xs text-[var(--color-text-dim)] font-mono">
            {trackDoneCount}/{trackTotalCount} solved in this track
          </span>
        </div>

        <div className="relative mb-4 max-w-md">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPaging();
            }}
            placeholder="Search projects by name, category, or tag&hellip;"
            aria-label="Search projects"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-heading)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-[var(--color-accent)]/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)]"
            >
              <IconX className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                resetPaging();
              }}
              aria-pressed={category === cat}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                category === cat
                  ? 'bg-[var(--color-gold)] border-[var(--color-gold)] text-black'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-dim)] mr-1">Status</span>
          {(['All', 'Not started', 'In progress', 'Solved'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                resetPaging();
              }}
              aria-pressed={status === s}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                status === s
                  ? 'bg-[var(--color-heading)] border-[var(--color-heading)] text-[var(--color-bg)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-text-dim)] mb-5">
            {search_ ? <>No projects match &ldquo;{search}&rdquo;.</> : 'No projects match this filter yet — more are on the way.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {visible.map((task: SeTaskMeta) => (
                <ProjectTaskCard key={task.id} task={task} />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="flex justify-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <IconLayers className="w-4 h-4" /> Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
