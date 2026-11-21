import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '../state/progressStore';
import { useAuth } from '../../account/state/authStore';
import { fetchLeaderboard, computeLabPoints, type LeaderboardEntry } from '../lib/leaderboard';
import { LABS } from '../../labs/data/labs';
import { LEAGUES, leagueFor } from '../data/levels';
import { IconUser, IconSearch, IconRefresh } from '../../../shared/components/layout/icons';
import { LeagueChip } from '../components/LeagueChip';
import CharacterSays from '../../../shared/characters/CharacterSays';
import './leaderboard.css';
import WorkspaceHeader from '../../../shared/components/WorkspaceHeader';
import { OperatorAvatar } from '../../../shared/characters/CharacterAvatar';
import { useHandle } from '../../account/state/useHandle';
import { cyberHandle } from '../../../shared/characters/handles';

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
    <div className="lb-board lb-board--ghost" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="lb-ghost" />)}
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

  const stats = useMemo(() => {
    if (ranked.length === 0) return null;
    const totalLabs = ranked.reduce((s, e) => s + e.labsCompleted, 0);
    const pts = ranked.map((e) => e.points).sort((a, b) => a - b);
    const mid = Math.floor(pts.length / 2);
    const median = pts.length % 2 ? pts[mid] : Math.round((pts[mid - 1] + pts[mid]) / 2);
    const perLeague = LEAGUES.map((l) => ({ league: l, count: ranked.filter((e) => leagueFor(e.points).league.name === l.name).length }));
    return { totalLabs, median, perLeague };
  }, [ranked]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked.filter(
      (e) => (!q || nameOf(e).toLowerCase().includes(q)) && (!leagueFilter || leagueFor(e.points).league.name === leagueFilter),
    );
  }, [ranked, query, leagueFilter]);

  const shown = filtered.slice(0, visible);
  const yourListIndex = filtered.findIndex((e) => e.userId === youId);

  useEffect(() => setVisible(PAGE_SIZE), [query, leagueFilter]);

  const jumpToYou = () => {
    if (yourListIndex >= visible) setVisible(yourListIndex + 1);
    requestAnimationFrame(() => youRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  return (
    <div className="lb max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <WorkspaceHeader
        title="Leaderboard"
        guide="vex"
        description={<>Lab points from every fully cleared lab: Easy 10, Medium 20, Hard 30. Only learners who opt in appear here.</>}
      />

      <div className="lb-top">
        <StandingPanel
          seed={handleSeed}
          name={handle}
          points={points}
          labsCompleted={labsCompleted}
          optedIn={progress.leaderboardOptIn}
          you={you}
          neighbours={yourIndex >= 0 ? ranked.slice(Math.max(0, yourIndex - 2), yourIndex + 3) : []}
          youId={youId}
          total={ranked.length}
          online={entries !== null && entries !== undefined}
          onJump={yourListIndex >= 0 ? jumpToYou : undefined}
          perLeague={stats?.perLeague ?? null}
        />
        <div className="lb-side">
          <OptInSwitch checked={progress.leaderboardOptIn} onChange={progress.setLeaderboardOptIn} />
          {stats && (
            <dl className="lb-stats">
              <div><dt>Learners</dt><dd>{ranked.length.toLocaleString()}</dd></div>
              <div><dt>Labs cleared</dt><dd>{stats.totalLabs.toLocaleString()}</dd></div>
              <div><dt>Median points</dt><dd>{stats.median.toLocaleString()}</dd></div>
            </dl>
          )}
        </div>
      </div>

      {entries === undefined && <LoadingSkeleton />}

      {entries === null && (
        <div className="lb-notice">
          <span>The live leaderboard is unavailable right now (offline, or the leaderboard migration hasn't run on this Supabase project). Your own standing above is still accurate.</span>
          <button type="button" onClick={load} disabled={refreshing} className="lb-btn">
            <IconRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Try again
          </button>
        </div>
      )}

      {entries && ranked.length === 0 && (
        <div className="lb-empty">
          <h2>No one has opted in yet</h2>
          <p>Turn on "Show me on the leaderboard" above and you'll be the first name here.</p>
          <CharacterSays id="wraith" size={44} className="text-left">An empty board. I'll take first place, then.</CharacterSays>
        </div>
      )}

      {entries && ranked.length > 0 && stats && (
        <section aria-labelledby="board-title" className="lb-board">
          <div className="lb-board__head">
            <h2 id="board-title">Standings</h2>
            <label className="lb-search">
              <span className="sr-only">Search learners</span>
              <IconSearch className="lb-search__icon" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search learners" />
            </label>
            <button
              type="button"
              onClick={load}
              disabled={refreshing}
              aria-label="Refresh leaderboard"
              title={updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : undefined}
              className="lb-btn"
            >
              <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          <div className="lb-filters" role="group" aria-label="Filter by league">
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

          {filtered.length === 0 ? (
            <p className="lb-none">No learners match that search.</p>
          ) : (
            <>
              <div className="lb-cols" aria-hidden="true"><span>Rank</span><span>Learner</span><span>Labs</span><span>Points</span></div>
              <ol className="lb-rows" aria-label="Ranked learners">
                {shown.map((e) => {
                  const isYou = e.userId === youId;
                  const fullIndex = ranked.indexOf(e);
                  const above = fullIndex > 0 ? ranked[fullIndex - 1] : null;
                  const gap = above ? above.points - e.points : 0;
                  return (
                    <li key={e.userId} ref={isYou ? youRowRef : undefined} aria-current={isYou ? 'true' : undefined} className="lb-row" data-you={isYou || undefined}>
                      <span className="lb-rank" data-place={e.rank <= 3 ? e.rank : undefined}>{e.rank}</span>
                      <span className="lb-who">
                        <OperatorAvatar seed={e.userId} size={36} className="shrink-0" />
                        <span className="lb-who__text">
                          <strong>{nameOf(e)}{isYou && <em> (you)</em>}</strong>
                          <LeagueChip points={e.points} />
                        </span>
                      </span>
                      <span className="lb-labs">{e.labsCompleted}<small> of {LABS.length}</small></span>
                      <span className="lb-points">
                        <b>{e.points.toLocaleString()}</b>
                        <small>{gap > 0 ? `${gap.toLocaleString()} behind #${above!.rank}` : above ? 'Tied' : 'Leader'}</small>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          {filtered.length > visible && (
            <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="lb-more">
              Show {Math.min(PAGE_SIZE, filtered.length - visible)} more of {filtered.length - visible}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

/** Your position: rank and league, the league track to the top, and the learners just above and below
 *  you. A local board motivates more than a global one: the next person to pass is always in reach. */
function StandingPanel({
  seed, name, points, labsCompleted, optedIn, you, neighbours, youId, total, online, onJump, perLeague,
}: {
  seed: string; name: string | null; points: number; labsCompleted: number; optedIn: boolean;
  you: RankedEntry | null; neighbours: RankedEntry[]; youId?: string; total: number; online: boolean;
  onJump?: () => void; perLeague: { league: (typeof LEAGUES)[number]; count: number }[] | null;
}) {
  const { league, next } = leagueFor(points);
  const topPercent = you && total > 1 ? Math.max(1, Math.ceil((you.rank / total) * 100)) : null;
  const ahead = you ? [...neighbours].reverse().find((e) => e.points > you.points) : undefined;

  return (
    <section className="lb-standing" aria-labelledby="standing-title">
      <div className="lb-standing__id">
        <OperatorAvatar seed={seed} size={56} />
        <div className="min-w-0 flex-1">
          <h2 id="standing-title">{name || 'Learner'}</h2>
          <p><span style={{ color: league.color }}>{league.name} league</span> · {points.toLocaleString()} points · {labsCompleted} of {LABS.length} labs</p>
        </div>
        {you && (
          <div className="lb-standing__rank">
            <b>#{you.rank}</b>
            <span>of {total}{topPercent !== null && <> · top {topPercent}%</>}</span>
          </div>
        )}
      </div>

      <div className="lb-track" role="img" aria-label={next ? `${league.name} league, ${next.min - points} points to ${next.name}` : `${league.name} league, the top league`}>
        {LEAGUES.map((l, i) => {
          const end = LEAGUES[i + 1]?.min;
          const fill = points >= (end ?? Infinity) ? 1 : points < l.min ? 0 : end ? (points - l.min) / (end - l.min) : 1;
          const count = perLeague?.find((p) => p.league.name === l.name)?.count;
          return (
            <div key={l.name} className="lb-track__step" data-current={l.name === league.name || undefined} title={count !== undefined ? `${count} learner${count === 1 ? '' : 's'}` : undefined}>
              <i style={{ '--fill': `${Math.round(fill * 100)}%`, '--league': l.color } as React.CSSProperties} />
              <span>{l.name}</span>
              <small>{l.min.toLocaleString()}</small>
            </div>
          );
        })}
      </div>
      <p className="lb-standing__goal">
        {next ? <><b>{(next.min - points).toLocaleString()} points</b> to {next.name}. A Hard lab is 30.</> : <>You're in the top league. Hold your place.</>}
      </p>

      {you && neighbours.length > 1 && (
        <div className="lb-near">
          <h3>Around you</h3>
          <ol>
            {neighbours.map((e) => {
              const isYou = e.userId === youId;
              const diff = e.points - you.points;
              return (
                <li key={e.userId} data-you={isYou || undefined}>
                  <span className="lb-near__rank">{e.rank}</span>
                  <span className="lb-near__name">{isYou ? 'You' : nameOf(e)}</span>
                  <span className="lb-near__pts">{e.points.toLocaleString()}</span>
                  <span className="lb-near__diff">{isYou ? '' : diff > 0 ? `+${diff.toLocaleString()}` : diff < 0 ? `−${(-diff).toLocaleString()}` : 'Tied'}</span>
                </li>
              );
            })}
          </ol>
          <p>{ahead ? <>Pass {nameOf(ahead)} with {(ahead.points - you.points + 1).toLocaleString()} more points.</> : you.rank === 1 ? 'You lead the board.' : 'You share the place above.'}</p>
        </div>
      )}

      {!you && (
        <p className="lb-standing__note">
          <IconUser className="w-3.5 h-3.5 shrink-0" />
          {!optedIn ? 'Private. Opt in to see where you place.' : online ? 'Sign in to appear on the board.' : 'Your rank shows once the live board is reachable.'}
        </p>
      )}

      {onJump && <button type="button" onClick={onJump} className="lb-link">Find me in the standings</button>}
    </section>
  );
}

function OptInSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="lb-optin">
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

function FilterChip({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-heading)]'
          : 'border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'
      }`}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />}
      {label}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}
