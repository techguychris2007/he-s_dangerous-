import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '../state/progressStore';
import { useAuth } from '../state/authStore';
import { fetchLeaderboard, computeLabPoints, type LeaderboardEntry } from '../lib/leaderboard';
import { LABS } from '../data/labs';
import { IconTrophy, IconFlag, IconCrown, IconUser } from '../components/layout/icons';

/** Rank-specific ring/badge treatment for the top 3 — everyone else gets the same plain numbered
 *  badge as before. Colors reuse the existing gold-accent tokens for #1 (this app's one established
 *  "premium" accent) plus two neutral metallic tones for #2/#3 rather than inventing new design
 *  tokens for a one-page feature. */
const RANK_STYLE: Record<number, { ring: string; badge: string; row: string }> = {
  1: {
    ring: 'ring-2 ring-[var(--color-gold)] ring-offset-2 ring-offset-[var(--color-bg)]',
    badge: 'bg-[var(--color-gold)] text-[#241a08]',
    row: 'border-[var(--color-gold)]/50 bg-[var(--color-gold-soft)]',
  },
  2: {
    ring: 'ring-2 ring-[#b8c0d0] ring-offset-2 ring-offset-[var(--color-bg)]',
    badge: 'bg-[#b8c0d0] text-[#1a1f2e]',
    row: 'border-[#b8c0d0]/40 bg-[var(--color-surface)]',
  },
  3: {
    ring: 'ring-2 ring-[#c88a5a] ring-offset-2 ring-offset-[var(--color-bg)]',
    badge: 'bg-[#c88a5a] text-[#2b1608]',
    row: 'border-[#c88a5a]/40 bg-[var(--color-surface)]',
  },
};

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 mb-6" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-4 animate-pulse">
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
  const initial = (progress.learnerName ?? '?').trim().charAt(0).toUpperCase();

  useEffect(() => {
    fetchLeaderboard().then(setEntries);
  }, []);

  const { labsCompleted, points } = useMemo(() => computeLabPoints(progress.labFlags), [progress.labFlags]);

  // Your own row always uses live local state (fresher than whatever was last synced), overriding
  // whatever the RPC returned for you if you're already in it.
  const ranked = useMemo(() => {
    if (!entries) return [];
    const withoutYou = entries.filter((e) => e.userId !== auth.user?.id);
    const you: LeaderboardEntry | null =
      progress.leaderboardOptIn && auth.user
        ? { userId: auth.user.id, displayName: progress.learnerName ?? 'You', labsCompleted, points }
        : null;
    const merged = you ? [...withoutYou, you] : withoutYou;
    return merged.sort((a, b) => b.points - a.points);
  }, [entries, auth.user, progress.leaderboardOptIn, progress.learnerName, labsCompleted, points]);

  const yourRank = ranked.findIndex((e) => e.userId === auth.user?.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
      <div className="gold-eyebrow mb-1.5 sm:mb-2">// where you stand</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2 sm:mb-3 flex items-center gap-2.5 sm:gap-3">
        <IconTrophy className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-accent)] shrink-0" /> Leaderboard
      </h1>
      <p className="text-xs sm:text-sm text-[var(--color-text-dim)] leading-relaxed mb-6 max-w-xl">
        Ranked by lab points — every captured flag counts, weighted by difficulty. Entirely opt-in: your
        name and score only ever appear here if you turn it on below.
      </p>

      <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-8 cursor-pointer hover:border-[var(--color-accent)]/40 transition-colors">
        <input
          type="checkbox"
          checked={progress.leaderboardOptIn}
          onChange={(e) => progress.setLeaderboardOptIn(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span className="text-sm text-[var(--color-text)] leading-relaxed">
          <span className="font-semibold text-[var(--color-heading)]">Show me on the leaderboard.</span>{' '}
          Off by default — any other learner on this platform only ever sees your name and score here
          if you turn this on. Your progress stays private otherwise.
        </span>
      </label>

      {progress.leaderboardOptIn && yourRank >= 0 && (
        <div className="rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-4 py-3 mb-6 flex items-center gap-2.5 text-sm">
          <IconUser className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
          <span className="text-[var(--color-text)]">
            You're currently <span className="font-bold text-[var(--color-heading)]">#{yourRank + 1}</span> of{' '}
            {ranked.length} ranked learner{ranked.length === 1 ? '' : 's'}.
          </span>
        </div>
      )}

      {entries === undefined && <LoadingSkeleton />}

      {entries === null && (
        <>
          <div className="rounded-xl border border-[var(--color-warn)]/40 bg-[var(--color-warn)]/5 p-4 mb-6 text-sm text-[var(--color-text)] leading-relaxed">
            Live leaderboard is unavailable right now (offline, or this Supabase project hasn't run the
            leaderboard migration yet) — showing just your own progress.
          </div>
          <YouCard initial={initial} name={progress.learnerName} labsCompleted={labsCompleted} points={points} />
        </>
      )}

      {entries !== undefined && entries !== null && (
        <>
          {ranked.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 mb-6 flex flex-col items-center text-center gap-2">
              <span className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-1">
                <IconTrophy className="w-6 h-6 text-[var(--color-accent)]" />
              </span>
              <div className="font-bold text-[var(--color-heading)]">No one's opted in yet</div>
              <p className="text-sm text-[var(--color-text-dim)] max-w-sm">
                Flip on "Show me on the leaderboard" above and you'll be the very first name here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-6">
              {ranked.map((e, i) => {
                const isYou = e.userId === auth.user?.id;
                const rank = i + 1;
                const medal = RANK_STYLE[rank];
                return (
                  <div
                    key={e.userId}
                    className={`rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                      medal ? medal.row : isYou ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm shrink-0 ${
                        medal ? medal.badge : 'bg-[var(--color-accent)]/15 text-[var(--color-accent-dim)]'
                      }`}
                    >
                      {rank === 1 ? <IconCrown className="w-4 h-4" /> : rank}
                    </span>
                    <span
                      className={`w-11 h-11 rounded-full bg-[var(--color-accent)] text-white text-base font-bold flex items-center justify-center shrink-0 ${medal?.ring ?? ''}`}
                    >
                      {e.displayName.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[var(--color-heading)] truncate">
                        {e.displayName}
                        {isYou && <span className="ml-2 text-xs font-semibold text-[var(--color-accent)]">(you)</span>}
                      </div>
                      <div className="text-xs text-[var(--color-text-dim)] flex items-center gap-1.5">
                        <IconFlag className="w-3 h-3" /> {e.labsCompleted}/{LABS.length} labs completed
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-extrabold text-[var(--color-accent-dim)] font-mono">{e.points}</div>
                      <div className="text-2xs text-[var(--color-text-dim)]">pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!progress.leaderboardOptIn && (
            <>
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-dim)] mb-2">
                Your progress (not shown to others)
              </div>
              <YouCard initial={initial} name={progress.learnerName} labsCompleted={labsCompleted} points={points} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function YouCard({ initial, name, labsCompleted, points }: { initial: string; name: string | null; labsCompleted: number; points: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex items-center gap-5">
      <span className="w-14 h-14 rounded-full bg-[var(--color-accent)] text-white text-xl font-bold flex items-center justify-center shrink-0">
        {initial}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[var(--color-heading)] truncate">{name}</div>
        <div className="text-xs text-[var(--color-text-dim)] flex items-center gap-1.5">
          <IconFlag className="w-3 h-3" /> {labsCompleted}/{LABS.length} labs completed
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-2xl font-extrabold text-[var(--color-accent-dim)] font-mono">{points}</div>
      </div>
    </div>
  );
}
