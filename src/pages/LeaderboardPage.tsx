import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '../state/progressStore';
import { useAuth } from '../state/authStore';
import { fetchLeaderboard, computeLabPoints, type LeaderboardEntry } from '../lib/leaderboard';
import { LABS } from '../data/labs';
import { IconTrophy, IconFlag } from '../components/layout/icons';

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

  return (
    <div className="max-w-3xl mx-auto px-8 py-14">
      <div className="gold-eyebrow mb-2">// where you stand</div>
      <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-3 flex items-center gap-3">
        <IconTrophy className="w-7 h-7 text-[var(--color-accent)]" /> Leaderboard
      </h1>

      <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-8 cursor-pointer">
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

      {entries === undefined && <div className="text-sm text-[var(--color-text-dim)]">Loading&hellip;</div>}

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
            <div className="text-sm text-[var(--color-text-dim)] mb-6">
              Nobody has opted in yet — be the first to show up here.
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-6">
              {ranked.map((e, i) => {
                const isYou = e.userId === auth.user?.id;
                return (
                  <div
                    key={e.userId}
                    className={`rounded-xl border p-4 flex items-center gap-4 ${
                      isYou ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent-dim)] font-bold flex items-center justify-center text-sm shrink-0">
                      {i + 1}
                    </span>
                    <span className="w-11 h-11 rounded-full bg-[var(--color-accent)] text-white text-base font-bold flex items-center justify-center shrink-0">
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
                      <div className="text-[11px] text-[var(--color-text-dim)]">pts</div>
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
