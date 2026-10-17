import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LABS, LAB_CATEGORIES, LABS_IN_ROADMAP_ORDER } from '../data/labs';
import { OSINT_LABS } from '../labs/osintScenarios';
import { useProgress } from '../state/progressStore';
import LabCard from '../components/labs/LabCard';
import SiemLabCard from '../components/siem/SiemLabCard';
import { fetchLabRatingSummaries, type LabRatingSummary } from '../lib/labRatings';
import { IconCheck, IconFlask, IconRadar, IconSearch, IconX } from '../components/layout/icons';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const PAGE_SIZE = 30;

const CATEGORY_COUNTS = Object.fromEntries(
  LAB_CATEGORIES.map((cat) => [cat, LABS.filter((l) => l.scenario.category === cat).length]),
);

const pct = (done: number, total: number) => (total ? Math.round((100 * done) / total) : 0);

export default function LabsIndexPage() {
  const progress = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const initialCategory = categoryParam && (LAB_CATEGORIES as readonly string[]).includes(categoryParam) ? categoryParam : 'All';
  const [filter, setFilter] = useState<string>(initialCategory);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ratingSummaries, setRatingSummaries] = useState<Record<string, LabRatingSummary> | null>(null);

  useEffect(() => { setFilter(initialCategory); setVisibleCount(PAGE_SIZE); }, [initialCategory]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  useEffect(() => {
    fetchLabRatingSummaries().then(setRatingSummaries);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 200);
  }, []);

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch('');
    setDebouncedSearch('');
  }, []);

  const handleSetFilter = useCallback((cat: string) => {
    setFilter(cat);
    setVisibleCount(PAGE_SIZE);
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      if (cat === 'All') next.delete('category');
      else next.set('category', cat);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSetDifficulty = useCallback((d: string) => {
    setDifficultyFilter(d);
    setVisibleCount(PAGE_SIZE);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch]);

  const search_ = debouncedSearch.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      LABS_IN_ROADMAP_ORDER.filter(
        (l) =>
          (filter === 'All' || l.scenario.category === filter) &&
          (difficultyFilter === 'All' || l.scenario.difficulty === difficultyFilter) &&
          (!search_ || l.scenario.title.toLowerCase().includes(search_) || l.scenario.category.toLowerCase().includes(search_)),
      ),
    [filter, difficultyFilter, search_],
  );

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;
  const isFiltering = filter !== 'All' || difficultyFilter !== 'All' || !!search_;

  const { totalDone, osintDone, overallPct } = useMemo(() => {
    const totalDone = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
    const osintDone = OSINT_LABS.filter((l) => progress.flagCount(l.id) >= l.totalFlags).length;
    const overallPct = pct(totalDone, LABS.length);
    return { totalDone, osintDone, overallPct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.labFlags]);

  const visualLabs = useMemo(() => LABS.filter((lab) => lab.scenario.webApplication || lab.scenario.directoryMap), []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_12px_36px_-28px_var(--color-heading)]">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[var(--color-accent)]" />
          <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_330px] lg:p-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[var(--color-accent)]">
                // hands-on operations
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-[-.045em] text-[var(--color-heading)] sm:text-5xl">Lab Catalog</h1>
              <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--color-text-dim)]">
                {LABS.length} guided labs across Linux privilege escalation, network exploitation, web application security, Active Directory, cloud, SOC, forensics, and bug bounty workflows. Each environment combines objectives, an interactive terminal, evidence, and focused hints.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3">
                  <IconFlask className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                  <div><div className="text-xl font-bold tracking-tight text-[var(--color-heading)]">{LABS.length}</div><div className="text-[11px] font-semibold text-[var(--color-text-dim)]">Terminal labs</div></div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3">
                  <IconRadar className="h-4 w-4 shrink-0 text-[var(--color-accent-2)]" />
                  <div><div className="text-xl font-bold tracking-tight text-[var(--color-heading)]">{OSINT_LABS.length}</div><div className="text-[11px] font-semibold text-[var(--color-text-dim)]">OSINT cases</div></div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3">
                  <IconCheck className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
                  <div><div className="text-xl font-bold tracking-tight text-[var(--color-heading)]">{totalDone}<span className="text-sm font-semibold text-[var(--color-text-dim)]"> / {LABS.length}</span></div><div className="text-[11px] font-semibold text-[var(--color-text-dim)]">Completed</div></div>
                </div>
              </div>
            </div>

            <aside className="self-end rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-[var(--color-heading)]">Overall progress</div>
                  <div className="text-xs font-semibold text-[var(--color-text-dim)]">Flags captured across all labs</div>
                </div>
                <div className="text-3xl font-black tracking-[-.05em] text-[var(--color-accent)]">{overallPct}%</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]" role="progressbar" aria-label="Overall lab completion" aria-valuenow={overallPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-[var(--color-accent)] transition-[width]" style={{ width: `${overallPct}%` }} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><div className="font-black text-[var(--color-heading)]">{filtered.length}</div><div className="text-xs font-semibold text-[var(--color-text-dim)]">Visible matches</div></div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><div className="font-black text-[var(--color-heading)]">{osintDone}/{OSINT_LABS.length}</div><div className="text-xs font-semibold text-[var(--color-text-dim)]">OSINT complete</div></div>
              </div>
            </aside>
          </div>
        </section>

        {!search && filter === 'All' && (
          <section aria-label="Interactive visual labs" className="mb-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_10px_32px_-26px_var(--color-heading)] sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[.2em] text-[var(--color-accent)]">See your investigation unfold</p>
                <h2 className="text-2xl font-black tracking-[-.04em] text-[var(--color-heading)]">Website targets & directory attack paths</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-dim)]">Send requests from the terminal, inspect target websites, and follow confirmed access through directory maps.</p>
              </div>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-xs font-black text-[var(--color-text-dim)]">{visualLabs.length} visual labs</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {visualLabs.slice(0, 8).map((lab) => (
                <Link key={lab.slug} to={`/lab/${lab.slug}`} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface)]">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-[var(--color-text-dim)]">{lab.scenario.webApplication ? 'Interactive website' : 'Live directory map'}</p>
                  <span className="text-sm font-black leading-5 text-[var(--color-heading)] group-hover:text-[var(--color-accent)]">{lab.scenario.title} →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-label="Find and filter labs" className="mb-7 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search labs by name or category..."
                aria-label="Search labs"
                className="h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] pl-11 pr-10 text-sm font-semibold text-[var(--color-heading)] outline-none placeholder:font-medium placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)]/60 focus:ring-4 focus:ring-[var(--color-accent)]/10"
              />
              {search && (
                <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-heading)]"><IconX className="h-3.5 w-3.5" /></button>
              )}
            </div>
              <span className="shrink-0 text-sm font-semibold text-[var(--color-text-dim)]" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'lab' : 'labs'}</span>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter labs by category">
                {['All', ...LAB_CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleSetFilter(cat)}
                    aria-pressed={filter === cat}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${filter === cat ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/55 hover:text-[var(--color-heading)]'}`}
                  >
                    {cat}{cat !== 'All' && <span className="ml-1.5 opacity-65">{CATEGORY_COUNTS[cat] ?? 0}</span>}
                  </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3" role="group" aria-label="Filter labs by difficulty">
                <span className="mr-1 text-xs font-semibold text-[var(--color-text-dim)]">Difficulty</span>
                {['All', ...DIFFICULTIES].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSetDifficulty(d)}
                    aria-pressed={difficultyFilter === d}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${difficultyFilter === d ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/55 hover:text-[var(--color-heading)]'}`}
                  >
                    {d}
                  </button>
                ))}
                {isFiltering && <button onClick={() => { handleSetFilter('All'); handleSetDifficulty('All'); clearSearch(); }} className="ml-auto text-xs font-semibold text-[var(--color-accent)] hover:underline">Clear filters</button>}
            </div>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-text-dim)]">
            <p className="mb-3">{search_ ? <>No labs match &ldquo;{search}&rdquo;{filter !== 'All' && <> in {filter}</>}.</> : <>No labs in the &ldquo;{filter}&rdquo; category{difficultyFilter !== 'All' && <> at {difficultyFilter} difficulty</>}.</>}</p>
            {isFiltering && (
              <button onClick={() => { handleSetFilter('All'); handleSetDifficulty('All'); clearSearch(); }} className="text-sm font-black text-[var(--color-accent)] hover:underline">Clear all filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-[-.04em] text-[var(--color-heading)]">Available labs</h2>
                <p className="text-sm font-semibold text-[var(--color-text-dim)]">Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}{isFiltering ? ' matching your filters' : ''}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((lab) => <LabCard key={lab.slug} lab={lab} variant="catalog" ratingSummary={ratingSummaries?.[lab.scenario.id]} />)}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button onClick={() => setVisibleCount((n) => n + PAGE_SIZE)} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-black text-[var(--color-text-dim)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-heading)]">
                  Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more <span className="ml-2 opacity-60 text-xs">({filtered.length - visibleCount} remaining)</span>
                </button>
              </div>
            )}
          </>
        )}

        {!isFiltering && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[var(--color-accent)]"><IconRadar className="h-4 w-4" /> Recon & OSINT tools</div>
                <h2 className="text-2xl font-black tracking-[-.04em] text-[var(--color-heading)]">Investigation cases</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-text-dim)]">Run simulated Shodan, Maltego, Sherlock, EyeWitness, and theHarvester workflows before touching a target directly.</p>
              </div>
              <p className="hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-black text-[var(--color-text-dim)] sm:block">{osintDone}/{OSINT_LABS.length} completed</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {OSINT_LABS.map((lab) => <SiemLabCard key={lab.id} lab={lab} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
