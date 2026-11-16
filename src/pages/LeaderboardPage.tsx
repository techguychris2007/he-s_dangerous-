import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '../state/progressStore';
import { useAuth } from '../state/authStore';
import { fetchLeaderboard, computeLabPoints, type LeaderboardEntry } from '../lib/leaderboard';
import { LABS } from '../data/labs';
import { LEAGUES, leagueFor } from '../data/levels';
import { IconFlag, IconCrown, IconUser, IconSearch, IconRefresh, IconShield, IconArrowRight, IconTrophy } from '../components/layout/icons';
import { LeagueChip } from '../components/common/LeagueChip';
import CharacterSays from '../components/characters/CharacterSays';
import Podium from '../components/common/Podium';
import WorkspaceHeader from '../components/common/WorkspaceHeader';
import { OperatorAvatar } from '../components/characters/CharacterAvatar';
import { useHandle } from '../state/useHandle';
import { cyberHandle } from '../data/handles';

const PAGE_SIZE = 25;

interface RankedEntry extends LeaderboardEntry {
  /** Competition rank: learners on the same points and labs share a place (1, 2, 2, 4…). */
  rank: number;
}

/** Points first, labs cleared as the tiebreak, then name so the order is stable between loads. */
function rankEntries(entries: LeaderboardEntry[]): RankedEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b.points - a.points || b.labsCompleted - a.labsCompleted || (a.displayName || '').localeCompare(b.displayName || ''),
  );
  const out: RankedEntry[] = [];
  sorted.forEach((e, i) => {
    const prev = out[i - 1];
    const tied = prev && prev.points === e.points && prev.labsCompleted === e.labsCompleted;
    out.push({ ...e, rank: tied ? prev.rank : i + 1 });
  });
  return out;
}

const nameOf = (e: LeaderboardEntry) => e.displayName || cyberHandle(e.userId);

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 mb-6" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="premium-card rounded-2xl p-4 flex items-center gap-4 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] shrink-0" />
          <div className="w-11 h-11 rounded-full bg-[var(--color-surface-2)] shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="h-3.5 w-32 rounded bg-[var(--color-surface-2)]" />
            <div className="h-2.5 w-24 rounded bg-[var(--color-surface-2)]" />
          </div>
          <div className="w-10 h-6 rounded bg-[var(--color-surface-2)] shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const progress = useProgress();
  const auth = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [query, setQuery] = useState('');
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const youRowRef = useRef<HTMLLIElement | null>(null);

  const { seed: handleSeed, handle } = useHandle();

  const load = useCallback(async () => {
    setRefreshing(true);
    const result = await fetchLeaderboard();
    setEntries(result);
    setUpdatedAt(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { labsCompleted, points } = useMemo(() => computeLabPoints(progress.labFlags), [progress.labFlags]);
  const youId = auth.user?.id;

  // Your own row always uses live local state (fresher than whatever was last synced), overriding
  // whatever the RPC returned for you if you're already in it.
  const ranked = useMemo(() => {
    if (!entries) return [];
    const withoutYou = entries.filter((e) => e.userId !== youId);
    const you: LeaderboardEntry | null =
      progress.leaderboardOptIn && youId
        ? { userId: youId, displayName: progress.learnerName || handle || 'You', labsCompleted, points }
        : null;
    return rankEntries(you ? [...withoutYou, you] : withoutYou);
  }, [entries, youId, progress.leaderboardOptIn, progress.learnerName, handle, labsCompleted, points]);

  const yourIndex = ranked.findIndex((e) => e.userId === youId);
  const you = yourIndex >= 0 ? ranked[yourIndex] : null;
  const leaderPoints = ranked[0]?.points ?? 0;

  const stats = useMemo(() => {
    if (ranked.length === 0) return null;
    const totalLabs = ranked.reduce((s, e) => s + e.labsCompleted, 0);
    const pts = ranked.map((e) => e.points).sort((a, b) => a - b);
    const mid = Math.floor(pts.length / 2);
    const median = pts.length % 2 ? pts[mid] : Math.round((pts[mid - 1] + pts[mid]) / 2);
    const perLeague = LEAGUES.map((l) => ({ league: l, count: ranked.filter((e) => leagueFor(e.points).league.name === l.name).length }));
    return { totalLabs, median, perLeague };
  }, [ranked]);

  const filtering = query.trim() !== '' || leagueFilter !== null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked.filter(
      (e) => (!q || nameOf(e).toLowerCase().includes(q)) && (!leagueFilter || leagueFor(e.points).league.name === leagueFilter),
    );
  }, [ranked, query, leagueFilter]);

  // The podium covers the top three on the unfiltered board, so the list picks up from #4 there.
  const showPodium = !filtering && ranked.length >= 3;
  const listEntries = showPodium ? filtered.slice(3) : filtered;
  const shown = listEntries.slice(0, visible);
  const yourListIndex = listEntries.findIndex((e) => e.userId === youId);

  useEffect(() => setVisible(PAGE_SIZE), [query, leagueFilter]);

  const jumpToYou = () => {
    if (yourListIndex >= visible) setVisible(yourListIndex + 1);
    requestAnimationFrame(() => youRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <WorkspaceHeader
        eyebrow="Community"
        title="Leaderboard"
        guide="vex"
        description={<>Ranked by lab points — every fully cleared lab counts, weighted by difficulty (Easy 10 · Medium 20 · Hard 30). Entirely opt-in: your name and score only appear here if you turn it on.</>}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] mb-6">
        <StandingCard
          seed={handleSeed}
          name={handle}
          points={points}
          labsCompleted={labsCompleted}
          optedIn={progress.leaderboardOptIn}
          you={you}
          ahead={yourIndex > 0 ? ranked.slice(0, yourIndex).reverse().find((e) => e.points > (you?.points ?? 0)) ?? null : null}
          behind={yourIndex >= 0 ? ranked.slice(yourIndex + 1).find((e) => e.points < (you?.points ?? 0)) ?? null : null}
          total={ranked.length}
          online={entries !== null && entries !== undefined}
          onJump={yourListIndex >= 0 ? jumpToYou : undefined}
        />
        <div className="flex flex-col gap-4">
          <OptInSwitch checked={progress.leaderboardOptIn} onChange={progress.setLeaderboardOptIn} />
          {stats && (
            <dl className="grid grid-cols-3 gap-2">
              <Stat label="Operators" value={ranked.length.toLocaleString()} />
              <Stat label="Labs cleared" value={stats.totalLabs.toLocaleString()} />
              <Stat label="Median pts" value={stats.median.toLocaleString()} />
            </dl>
          )}
        </div>
      </div>

      {entries === undefined && <LoadingSkeleton />}

      {entries === null && (
        <div className="rounded-xl border border-[var(--color-warn)]/40 bg-[var(--color-warn)]/5 p-4 mb-6 text-sm text-[var(--color-text)] leading-relaxed flex items-start gap-3 flex-wrap">
          <span className="flex-1 min-w-[14rem]">
            The live leaderboard is unavailable right now (offline, or the leaderboard migration hasn't run on this
            Supabase project). Your own standing above is still accurate.
          </span>
          <button type="button" onClick={load} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50">
            <IconRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Try again
          </button>
        </div>
      )}

      {entries && ranked.length === 0 && (
        <div className="premium-card rounded-2xl border-dashed bg-[var(--color-surface)] p-8 mb-6 flex flex-col items-center text-center gap-3">
          <div className="font-bold text-[var(--color-heading)]">No one's opted in yet</div>
          <p className="text-sm text-[var(--color-text-dim)] max-w-sm">
            Turn on "Show me on the leaderboard" above and you'll be the very first name here.
          </p>
          <CharacterSays id="wraith" size={44} className="text-left">An empty board. I'll take first place, then.</CharacterSays>
        </div>
      )}

      {entries && ranked.length > 0 && stats && (
        <>
          {showPodium && <Podium top={ranked.slice(0, 3)} youId={youId} />}

          <section aria-labelledby="board-title" className="premium-card rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <h2 id="board-title" className="text-lg font-black text-[var(--color-heading)] flex items-center gap-2 mr-auto">
                <IconTrophy className="w-5 h-5 text-[var(--color-gold)]" /> Standings
              </h2>
              <label className="relative flex-1 min-w-[12rem] max-w-xs">
                <span className="sr-only">Search operators</span>
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-dim)] pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search operators"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </label>
              <button
                type="button"
                onClick={load}
                disabled={refreshing}
                aria-label="Refresh leaderboard"
                title={updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50 disabled:opacity-50"
              >
                <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap mb-4" role="group" aria-label="Filter by league">
              <FilterChip active={leagueFilter === null} onClick={() => setLeagueFilter(null)} label="All" count={ranked.length} />
              {stats.perLeague.filter((p) => p.count > 0).map(({ league, count }) => (
                <FilterChip
                  key={league.name}
                  active={leagueFilter === league.name}
                  onClick={() => setLeagueFilter(leagueFilter === league.name ? null : league.name)}
                  label={league.name}
                  count={count}
                  color={league.color}
                />
              ))}
            </div>

            {listEntries.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-text-dim)]">
                {filtering ? 'No operators match that search.' : 'Only the podium so far — the list starts at #4.'}
              </p>
            ) : (
              <ol className="flex flex-col gap-2" aria-label="Ranked operators">
                {shown.map((e) => {
                  const isYou = e.userId === youId;
                  const fullIndex = ranked.indexOf(e);
                  const above = fullIndex > 0 ? ranked[fullIndex - 1] : null;
                  const gap = above ? above.points - e.points : 0;
                  const share = leaderPoints > 0 ? Math.max(2, Math.round((e.points / leaderPoints) * 100)) : 0;
                  return (
                    <li
                      key={e.userId}
                      ref={isYou ? youRowRef : undefined}
                      aria-current={isYou ? 'true' : undefined}
                      className={`rounded-xl border p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-colors ${
                        isYou
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                          : e.rank === 1
                            ? 'border-[var(--color-gold)]/50 bg-[var(--color-gold-soft)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30'
                      }`}
                    >
                      <span
                        className={`w-9 shrink-0 text-center font-mono font-black ${
                          e.rank === 1 ? 'text-[var(--color-gold)]' : e.rank <= 3 ? 'text-[var(--color-heading)]' : 'text-[var(--color-text-dim)]'
                        }`}
                      >
                        {e.rank === 1 ? <IconCrown className="w-5 h-5 mx-auto" /> : `#${e.rank}`}
                      </span>
                      <OperatorAvatar seed={e.userId} size={40} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[var(--color-heading)] truncate">
                          {nameOf(e)}
                          {isYou && <span className="ml-2 text-xs font-semibold text-[var(--color-accent)]">(you)</span>}
                        </div>
                        <div className="text-xs text-[var(--color-text-dim)] flex items-center gap-1.5 flex-wrap mt-0.5">
                          <LeagueChip points={e.points} />
                          <span className="inline-flex items-center gap-1">
                            <IconFlag className="w-3 h-3" /> {e.labsCompleted}/{LABS.length} labs
                          </span>
                        </div>
                        <div className="dw-xp-bar mt-2 max-w-sm" aria-hidden="true">
                          <span style={{ width: `${share}%`, background: isYou ? undefined : 'var(--color-text-dim)', opacity: isYou ? 1 : 0.45 }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg sm:text-xl font-extrabold text-[var(--color-accent-dim)] font-mono leading-none">{e.points.toLocaleString()}</div>
                        <div className="text-2xs text-[var(--color-text-dim)] mt-1">
                          {gap > 0 ? <>−{gap} to #{above!.rank}</> : above ? 'tied' : 'pts'}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {listEntries.length > visible && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="mt-4 w-full rounded-xl border border-dashed border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50"
              >
                Show {Math.min(PAGE_SIZE, listEntries.length - visible)} more of {listEntries.length - visible} remaining
              </button>
            )}
          </section>

          <LeagueLadder perLeague={stats.perLeague} yourPoints={points} />
        </>
      )}
    </div>
  );
}

/** Your position on the board: league, rank, percentile and who you're chasing / holding off. */
function StandingCard({
  seed, name, points, labsCompleted, optedIn, you, ahead, behind, total, online, onJump,
}: {
  seed: string; name: string | null; points: number; labsCompleted: number; optedIn: boolean;
  you: RankedEntry | null; ahead: RankedEntry | null; behind: RankedEntry | null; total: number; online: boolean;
  onJump?: () => void;
}) {
  const { league, next } = leagueFor(points);
  const span = next ? next.min - league.min : 1;
  const into = next ? points - league.min : 1;
  const topPercent = you && total > 1 ? Math.max(1, Math.ceil((you.rank / total) * 100)) : null;

  return (
    <section className="premium-card rounded-2xl p-5" aria-labelledby="standing-title">
      <div className="flex items-center gap-4">
        <span className="relative shrink-0">
          <OperatorAvatar seed={seed} size={60} />
          <span
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--color-surface)]"
            style={{ color: league.color, background: `color-mix(in srgb, ${league.color} 22%, var(--color-surface))` }}
            aria-hidden="true"
          >
            <IconShield className="h-3.5 w-3.5" />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-black uppercase tracking-[.18em] text-[var(--color-text-dim)]">Your standing</p>
          <h2 id="standing-title" className="text-xl font-black text-[var(--color-heading)] truncate">{name || 'Learner'}</h2>
          <p className="text-xs text-[var(--color-text-dim)] flex items-center gap-1.5 flex-wrap">
            <span style={{ color: league.color }} className="font-bold">{league.name} league</span>
            <span aria-hidden="true">·</span>
            <IconFlag className="w-3 h-3" /> {labsCompleted}/{LABS.length} labs
          </p>
        </div>
        <div className="text-right shrink-0">
          {you ? (
            <>
              <div className="font-mono text-3xl font-black text-[var(--color-heading)] leading-none">#{you.rank}</div>
              <div className="text-2xs text-[var(--color-text-dim)] mt-1">
                of {total}{topPercent !== null && <> · top {topPercent}%</>}
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-3xl font-black text-[var(--color-accent-dim)] leading-none">{points}</div>
              <div className="text-2xs text-[var(--color-text-dim)] mt-1">pts</div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-[var(--color-text-dim)] mb-1.5">
          <span className="font-mono">{points} pts</span>
          <span>{next ? `${next.min - points} to ${next.name}` : 'Top league reached'}</span>
        </div>
        <div className="dw-xp-bar" role="progressbar" aria-label={next ? `Progress to ${next.name} league` : 'League progress'} aria-valuemin={0} aria-valuemax={span} aria-valuenow={into}>
          <span style={{ width: `${Math.round((into / span) * 100)}%` }} />
        </div>
      </div>

      {you && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-[var(--color-surface-2)]/60 px-3 py-2">
            <div className="text-[var(--color-text-dim)]">Next to pass</div>
            <div className="font-semibold text-[var(--color-heading)] truncate">
              {ahead ? <>{nameOf(ahead)} <span className="font-mono text-[var(--color-accent-dim)]">+{ahead.points - you.points + 1}</span></> : you.rank === 1 ? 'You lead the board' : '—'}
            </div>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-2)]/60 px-3 py-2">
            <div className="text-[var(--color-text-dim)]">Lead over next</div>
            <div className="font-semibold text-[var(--color-heading)] truncate">
              {behind ? <>{nameOf(behind)} <span className="font-mono text-[var(--color-accent-dim)]">{you.points - behind.points}</span></> : 'No one behind yet'}
            </div>
          </div>
        </div>
      )}

      {!you && (
        <p className="mt-4 text-xs text-[var(--color-text-dim)] flex items-center gap-1.5">
          <IconUser className="w-3.5 h-3.5 shrink-0" />
          {!optedIn
            ? 'Private — opt in to see where you place among other operators.'
            : online
              ? 'Sign in to appear on the board.'
              : 'Your rank shows once the live board is reachable.'}
        </p>
      )}

      {onJump && (
        <button type="button" onClick={onJump} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline">
          Jump to my row <IconArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </section>
  );
}

function OptInSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="premium-card rounded-2xl p-4 flex items-start gap-3 cursor-pointer hover:border-[var(--color-accent)]/40 transition-colors">
      <span className="min-w-0 flex-1 text-sm leading-relaxed">
        <span className="block font-semibold text-[var(--color-heading)]">Show me on the leaderboard</span>
        <span className="block text-xs text-[var(--color-text-dim)]">
          Off by default. Other learners only see your call sign and score when this is on.
        </span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] transition-colors peer-checked:bg-[var(--color-accent)] peer-checked:border-[var(--color-accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-accent)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg)] after:absolute after:top-0.5 after:left-0.5 after:h-4.5 after:w-4.5 after:rounded-full after:bg-[var(--color-heading)] after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-[var(--color-surface)]"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card rounded-xl px-3 py-2.5">
      <dt className="text-2xs font-bold uppercase tracking-wide text-[var(--color-text-dim)] truncate">{label}</dt>
      <dd className="font-mono text-lg font-black text-[var(--color-heading)]">{value}</dd>
    </div>
  );
}

function FilterChip({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-heading)]'
          : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'
      }`}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />}
      {label}
      <span className="font-mono opacity-70">{count}</span>
    </button>
  );
}

/** Every league with its threshold and how many operators sit in it, so the climb is visible. */
function LeagueLadder({ perLeague, yourPoints }: { perLeague: { league: (typeof LEAGUES)[number]; count: number }[]; yourPoints: number }) {
  const current = leagueFor(yourPoints).league.name;
  return (
    <section aria-labelledby="ladder-title" className="mb-6">
      <h2 id="ladder-title" className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-dim)] mb-2">League ladder</h2>
      <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {perLeague.map(({ league, count }) => {
          const isCurrent = league.name === current;
          const reached = yourPoints >= league.min;
          return (
            <li
              key={league.name}
              aria-current={isCurrent ? 'step' : undefined}
              className={`rounded-xl border p-3 ${isCurrent ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'} ${reached ? '' : 'opacity-60'}`}
            >
              <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: league.color }}>
                <IconShield className="w-4 h-4" /> {league.name}
              </div>
              <div className="text-2xs text-[var(--color-text-dim)] mt-1 font-mono">{league.min.toLocaleString()}+ pts</div>
              <div className="text-xs text-[var(--color-text)] mt-1">
                {count} operator{count === 1 ? '' : 's'}{isCurrent && <span className="text-[var(--color-accent)] font-semibold"> · you</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
