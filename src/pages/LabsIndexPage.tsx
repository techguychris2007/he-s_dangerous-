import { useEffect, useMemo, useState } from 'react';
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

export default function LabsIndexPage() {
  const progress = useProgress();
  const [searchParams] = useSearchParams();
  // Deep-linkable via ?category=<name> (e.g. from the Dashboard's skills breakdown) — falls back to
  // "All" for a bad/missing param instead of silently showing an empty catalog.
  const categoryParam = searchParams.get('category');
  const initialCategory = categoryParam && (LAB_CATEGORIES as readonly string[]).includes(categoryParam) ? categoryParam : 'All';
  const [filter, setFilter] = useState<string>(initialCategory);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  // One batch call for the whole catalog rather than one per card — null (migration not run yet,
  // offline) just means every card renders with no rating badge, never an error.
  const [ratingSummaries, setRatingSummaries] = useState<Record<string, LabRatingSummary> | null>(null);
  useEffect(() => {
    fetchLabRatingSummaries().then(setRatingSummaries);
  }, []);

  const totalDone = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
  const osintDone = OSINT_LABS.filter((l) => progress.flagCount(l.id) >= l.totalFlags).length;
  const overallPct = Math.round((100 * totalDone) / LABS.length);

  const search_ = search.trim().toLowerCase();
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
  const isFiltering = filter !== 'All' || difficultyFilter !== 'All' || !!search_;

  return (
    <div className="max-w-5xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// hands-on</div>
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-heading)] mb-3">Lab Catalog</h1>
      <p className="text-[var(--color-text-dim)] mb-4 leading-relaxed max-w-2xl">
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search labs by name or category&hellip;"
          aria-label="Search labs"
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
        {['All', ...LAB_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            aria-pressed={filter === cat}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === cat
                ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 opacity-70">{LABS.filter((l) => l.scenario.category === cat).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-dim)] mr-1">Difficulty</span>
        {['All', ...DIFFICULTIES].map((d) => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(d)}
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
          {search_ ? (
            <>No labs match &ldquo;{search}&rdquo;{filter !== 'All' && <> in {filter}</>}.</>
          ) : (
            <>No labs in the &ldquo;{filter}&rdquo; category{difficultyFilter !== 'All' && <> at {difficultyFilter} difficulty</>}.</>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((lab) => (
            <LabCard key={lab.slug} lab={lab} variant="catalog" ratingSummary={ratingSummaries?.[lab.scenario.id]} />
          ))}
        </div>
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
