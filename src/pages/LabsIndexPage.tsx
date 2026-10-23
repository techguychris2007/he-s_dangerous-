import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LABS, LAB_CATEGORIES, LABS_IN_ROADMAP_ORDER } from '../data/labs';
import { OSINT_LABS } from '../labs/osintScenarios';
import { useProgress } from '../state/progressStore';
import LabCard from '../components/labs/LabCard';
import SiemLabCard from '../components/siem/SiemLabCard';
import { fetchLabRatingSummaries, type LabRatingSummary } from '../lib/labRatings';
import { IconRadar, IconSearch, IconX, ModuleIcon } from '../components/layout/icons';
import RoomWorld, { type District } from '../components/labs/RoomWorld';
import IsoBlock from '../components/labs/IsoBlock';
import CharacterAvatar from '../components/characters/CharacterAvatar';
import { CHARACTERS, guideForArea } from '../data/characters';
import { categoryIconKey } from '../data/labIcon';
import { DifficultyBars } from '../components/common/RoomHero';
import type { Difficulty } from '../data/rooms';
import '../components/labs/catalog.css';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const STATUSES = ['All', 'Not started', 'In progress', 'Completed'] as const;
type Status = (typeof STATUSES)[number];

function matchesStatus(status: Status, captured: number, total: number) {
  if (status === 'Completed') return captured >= total;
  if (status === 'In progress') return captured > 0 && captured < total;
  if (status === 'Not started') return captured === 0;
  return true;
}
const PAGE_SIZE = 30;

const pct = (done: number, total: number) => (total ? Math.round((100 * done) / total) : 0);

export default function LabsIndexPage() {
  const progress = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const initialCategory = categoryParam && (LAB_CATEGORIES as readonly string[]).includes(categoryParam) ? categoryParam : 'All';
  const [filter, setFilter] = useState<string>(initialCategory);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<Status>('All');
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
          matchesStatus(statusFilter, progress.flagCount(l.scenario.id), l.scenario.totalFlags) &&
          (!search_ || l.scenario.title.toLowerCase().includes(search_) || l.scenario.category.toLowerCase().includes(search_)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, difficultyFilter, statusFilter, search_, progress.labFlags],
  );

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;
  const isFiltering = filter !== 'All' || difficultyFilter !== 'All' || statusFilter !== 'All' || !!search_;

  const { totalDone, osintDone, overallPct } = useMemo(() => {
    const totalDone = LABS.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
    const osintDone = OSINT_LABS.filter((l) => progress.flagCount(l.id) >= l.totalFlags).length;
    const overallPct = pct(totalDone, LABS.length);
    return { totalDone, osintDone, overallPct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.labFlags]);

  const visualLabs = useMemo(() => LABS.filter((lab) => lab.scenario.webApplication || lab.scenario.directoryMap), []);

  const districts = useMemo<District[]>(() => LAB_CATEGORIES.map((category) => {
    const rooms = LABS.filter((l) => l.scenario.category === category);
    return {
      category,
      total: rooms.length,
      done: rooms.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length,
      started: rooms.filter((l) => progress.flagCount(l.scenario.id) > 0).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [progress.labFlags]);

  const intel = useMemo(() => {
    const rooms = filter === 'All' ? LABS : LABS.filter((l) => l.scenario.category === filter);
    const split: Record<string, number> = Object.fromEntries(DIFFICULTIES.map((d) => [d, rooms.filter((l) => l.scenario.difficulty === d).length]));
    const done = rooms.filter((l) => progress.flagCount(l.scenario.id) >= l.scenario.totalFlags).length;
    return { rooms: rooms.length, done, split, pct: pct(done, rooms.length) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, progress.labFlags]);
  const guide = guideForArea(filter === 'All' ? 'offensive' : filter);
  const clearAll = () => { handleSetFilter('All'); handleSetDifficulty('All'); setStatusFilter('All'); clearSearch(); };
  const scrollToRooms = () => document.getElementById('room-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="dw-catalog">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="dw-catalog-hero" aria-labelledby="rooms-title">
          <div className="dw-catalog-hero__head">
            <div>
              <p className="dw-catalog-eyebrow">Hands-on rooms</p>
              <h1 id="rooms-title">Rooms</h1>
              <p className="dw-catalog-lede">{LABS.length} guided rooms across Linux, networks, web, Active Directory, cloud, SOC, forensics and more. Pick a district on the map, clear its rooms, and light it up.</p>
            </div>
            <dl className="dw-catalog-stats">
              <div><dt>Rooms</dt><dd>{LABS.length}</dd></div>
              <div><dt>Cleared</dt><dd>{totalDone}</dd></div>
              <div><dt>OSINT cases</dt><dd>{osintDone}/{OSINT_LABS.length}</dd></div>
              <div className="dw-catalog-stats__progress"><dt>World progress</dt><dd>{overallPct}%</dd><span role="progressbar" aria-label="Overall room completion" aria-valuenow={overallPct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${overallPct}%` }} /></span></div>
            </dl>
          </div>

          <div className="dw-catalog-hero__world">
            <RoomWorld districts={districts} selected={filter} onSelect={handleSetFilter} />
            <aside className="dw-district-intel" aria-live="polite">
              <p className="dw-catalog-eyebrow">District intel</p>
              <div className="dw-district-intel__head">
                <IsoBlock width={72} depth={14} tone={intel.rooms > 0 && intel.done >= intel.rooms ? 'done' : 'progress'} crest={<ModuleIcon icon={filter === 'All' ? 'flag' : categoryIconKey(filter)} />} />
                <div><h2>{filter === 'All' ? 'Whole world' : filter}</h2><p>{intel.rooms} rooms · {intel.done} cleared</p></div>
              </div>
              <div className="dw-district-intel__bar"><i style={{ width: `${intel.pct}%` }} /></div>
              <ul className="dw-district-intel__split">
                {DIFFICULTIES.map((d) => <li key={d}><DifficultyBars difficulty={d as Difficulty} /><b>{intel.split[d]}</b></li>)}
              </ul>
              <div className="dw-district-intel__guide">
                <CharacterAvatar id={guide} size={44} decorative />
                <p><strong>{CHARACTERS[guide].name}</strong>{filter === 'All' ? 'Choose a district on the map to focus the catalog.' : `${intel.rooms - intel.done} rooms left to clear in ${filter}.`}</p>
              </div>
              <div className="dw-district-intel__actions">
                <button type="button" onClick={scrollToRooms}>Browse rooms ↓</button>
                {filter !== 'All' && <button type="button" className="is-quiet" onClick={() => handleSetFilter('All')}>Show all</button>}
              </div>
            </aside>
          </div>
        </section>

        <section aria-label="Find and filter rooms" className="dw-catalog-toolbar">
          <div className="dw-catalog-search">
            <IconSearch className="h-4 w-4" />
            <input type="text" value={search} onChange={handleSearchChange} placeholder="Search rooms by name or category…" aria-label="Search rooms" />
            {search && <button onClick={clearSearch} aria-label="Clear search"><IconX className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="dw-segment" role="group" aria-label="Filter by difficulty">
            {['All', ...DIFFICULTIES].map((d) => <button key={d} onClick={() => handleSetDifficulty(d)} aria-pressed={difficultyFilter === d}>{d}</button>)}
          </div>
          <div className="dw-segment" role="group" aria-label="Filter by status">
            {STATUSES.map((st) => <button key={st} onClick={() => { setStatusFilter(st); setVisibleCount(PAGE_SIZE); }} aria-pressed={statusFilter === st}>{st}</button>)}
          </div>
          <span className="dw-catalog-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'room' : 'rooms'}</span>
          {isFiltering && <button className="dw-catalog-clear" onClick={clearAll}>Clear filters</button>}
        </section>

        {!isFiltering && (
          <section aria-labelledby="featured-title" className="dw-featured">
            <div className="dw-section-head"><div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">Featured</p><h2 id="featured-title">Live targets & attack maps</h2></div><span>{visualLabs.length} visual rooms</span></div>
            <div className="dw-featured__row">
              {visualLabs.slice(0, 4).map((lab) => (
                <Link key={lab.slug} to={`/lab/${lab.slug}`} className="dw-featured__card">
                  <IsoBlock width={64} depth={12} tone={progress.flagCount(lab.scenario.id) >= lab.scenario.totalFlags ? 'done' : 'offense'} crest={<ModuleIcon icon={lab.scenario.webApplication ? 'web' : 'crown'} />} />
                  <span><small>{lab.scenario.webApplication ? 'Interactive website' : 'Live directory map'}</small><strong>{lab.scenario.title}</strong></span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div id="room-results" className="dw-section-head">
          <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">{filter === 'All' ? 'All districts' : filter}</p><h2>Rooms</h2></div>
          <span>Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="dw-catalog-empty">
            <CharacterAvatar id={guide} size={56} decorative />
            <p>{search_ ? <>No rooms match &ldquo;{search}&rdquo;{filter !== 'All' && <> in {filter}</>}.</> : <>No rooms match these filters.</>}</p>
            {isFiltering && <button onClick={clearAll}>Clear all filters</button>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((lab) => <LabCard key={lab.slug} lab={lab} variant="catalog" ratingSummary={ratingSummaries?.[lab.scenario.id]} />)}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button onClick={() => setVisibleCount((n) => n + PAGE_SIZE)} className="dw-catalog-more">
                  Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more <span>({filtered.length - visibleCount} remaining)</span>
                </button>
              </div>
            )}
          </>
        )}

        {!isFiltering && (
          <section className="mt-16">
            <div className="dw-section-head">
              <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink"><IconRadar className="mr-1 inline h-4 w-4" />Recon & OSINT tools</p><h2>Investigation cases</h2><p className="dw-section-sub">Run simulated Shodan, Maltego, Sherlock, EyeWitness and theHarvester workflows before touching a target directly.</p></div>
              <span>{osintDone}/{OSINT_LABS.length} completed</span>
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
