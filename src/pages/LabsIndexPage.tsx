import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LABS, LAB_CATEGORIES, LABS_IN_ROADMAP_ORDER } from '../data/labs';
import { OSINT_LABS } from '../labs/osintScenarios';
import { useProgress } from '../state/progressStore';
import LabCard from '../components/labs/LabCard';
import SiemLabCard from '../components/siem/SiemLabCard';
import { fetchLabRatingSummaries, type LabRatingSummary } from '../lib/labRatings';
import { IconRadar, IconSearch, IconX } from '../components/layout/icons';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const DIFFICULTY_ACTIVE_CLASS: Record<string, string> = {
  Easy: 'bg-[var(--color-success)] border-[var(--color-success)] text-white',
  Medium: 'bg-[var(--color-warn)] border-[var(--color-warn)] text-white',
  Hard: 'bg-[var(--color-danger)] border-[var(--color-danger)] text-white',
};

const PAGE_SIZE = 30;

/** Pre-computed category counts — calculated once at module load, not on every render. */
const CATEGORY_COUNTS = Object.fromEntries(
  LAB_CATEGORIES.map((cat) => [cat, LABS.filter((l) => l.scenario.category === cat).length]),
);

export default function LabsIndexPage() {
  const progress = useProgress();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const initialCategory =
    categoryParam && (LAB_CATEGORIES as readonly string[]).includes(categoryParam) ? categoryParam : 'All';
  const [filter, setFilter] = useState<string>(initialCategory);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ratingSummaries, setRatingSummaries] = useState<Record<string, LabRatingSummary> | null>(null);

  useEffect(() => {
    fetchLabRatingSummaries().then(setRatingSummaries);
  }, []);

  // Debounce search input — avoid re-filtering on every keystroke
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 200);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
  }, []);

  // Reset visible count when filter changes
  const handleSetFilter = useCallback((cat: string) => {
    setFilter(cat);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleSetDifficulty = useCallback((d: string) => {
    setDifficultyFilter(d);
    setVisibleCount(PAGE_SIZE);
  }, []);

  // Reset page when debounced search changes
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
          (!search_ ||
            l.scenario.title.toLowerCase().includes(search_) ||
            l.scenario.category.toLowerCase().includes(search_)),
      ),
    [filter, difficultyFilter, search_],
  );

  /** Only render what's visible — the key to fast initial paint. */
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;
  const isFiltering = filter !== 'All' || difficultyFilter !== 'All' || !!search_;

  // Stats — memoized so they don't recalculate on every render
  const { totalDone, osintDone, overallPct } = useMemo(() => {
    const totalDone = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
    const osintDone = OSINT_LABS.filter((l) => progress.flagCount(l.id) >= l.totalFlags).length;
    const overallPct = Math.round((100 * totalDone) / LABS.length);
    return { totalDone, osintDone, overallPct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.labFlags]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
      <div className="gold-eyebrow mb-1.5 sm:mb-2">// hands-on</div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-heading)] mb-2 sm:mb-3">Lab Catalog</h1>
      <p className="text-sm sm:text-base text-[var(--color-text-dim)] mb-4 leading-relaxed max-w-2xl">
        {LABS.length} fully interactive, guided labs across Linux privilege escalation, network service
        exploitation, web application vulnerabilities, Active Directory, cloud security, SOC &amp; threat
        hunting, digital forensics, and bug bounty methodology — each one a real command-line environment
        with step-by-step instructions, not a video.
      </p>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 max-w-xs h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${overallPct}%` }} />
        </div>
        <span className="text-sm text-[var(--color-accent-dim)] font-semibold shrink-0">
          {totalDone} / {LABS.length} labs completed ({overallPct}%)
        </span>
      </div>

      <div className="relative mb-4 max-w-md">
        <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search labs by name or category&hellip;"
          aria-label="Search labs"
          className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-heading)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-[var(--color-accent)]/60 transition-colors"
        />
        {search && (
          <button
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)]"
          >
            <IconX className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {['All', ...LAB_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => handleSetFilter(cat)}
            aria-pressed={filter === cat}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === cat
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 opacity-70">{CATEGORY_COUNTS[cat] ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-dim)] mr-1">Difficulty</span>
        {['All', ...DIFFICULTIES].map((d) => (
          <button
            key={d}
            onClick={() => handleSetDifficulty(d)}
            aria-pressed={difficultyFilter === d}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              difficultyFilter === d
                ? (DIFFICULTY_ACTIVE_CLASS[d] ?? 'bg-[var(--color-heading)] border-[var(--color-heading)] text-[var(--color-bg)]')
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-text-dim)]">
          <p className="mb-3">
            {search_ ? (
              <>No labs match &ldquo;{search}&rdquo;{filter !== 'All' && <> in {filter}</>}.</>
            ) : (
              <>No labs in the &ldquo;{filter}&rdquo; category{difficultyFilter !== 'All' && <> at {difficultyFilter} difficulty</>}.</>
            )}
          </p>
          {isFiltering && (
            <button
              onClick={() => {
                handleSetFilter('All');
                handleSetDifficulty('All');
                clearSearch();
              }}
              className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((lab) => (
              <LabCard key={lab.slug} lab={lab} variant="catalog" ratingSummary={ratingSummaries?.[lab.scenario.id]} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 transition-colors"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
                <span className="ml-2 opacity-60 text-xs">({filtered.length - visibleCount} remaining)</span>
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-[var(--color-text-dim)]">
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} labs
            {isFiltering && ` matching your filters`}
          </div>
        </>
      )}

      {!isFiltering && (
        <div className="mt-14">
          <div className="flex items-center gap-2 mb-1">
            <IconRadar className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-heading)]">Recon &amp; OSINT Tools</h2>
          </div>
          <p className="text-sm text-[var(--color-text-dim)] mb-2 leading-relaxed max-w-2xl">
            Real reconnaissance tradecraft, run inside simulated Shodan, Maltego, Sherlock, EyeWitness, and
            theHarvester consoles instead of a terminal — the same tools a red team or bug bounty hunter reaches
            for before ever touching the target directly.
          </p>
          <p className="text-sm text-[var(--color-accent-dim)] font-semibold mb-4">
            {osintDone} / {OSINT_LABS.length} labs completed
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {OSINT_LABS.map((lab) => (
              <SiemLabCard key={lab.id} lab={lab} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
