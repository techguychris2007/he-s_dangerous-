import { useMemo } from 'react';
import { useProgress } from '../../state/progressStore';
import { computeXp } from '../../data/xp';
import { levelInfo, rankForLevel, RANK_STEP } from '../../data/levels';
import './gamification.css';

const BREAKDOWN_LABELS = [
  ['lessons', 'Lessons'],
  ['quizzes', 'Quizzes'],
  ['flags', 'Flags'],
  ['labClears', 'Lab clears'],
  ['codeTasks', 'Code tasks'],
  ['achievements', 'Achievements'],
  ['dailyOps', 'Daily Ops'],
  ['weeklyChests', 'Weekly chests'],
] as const;

/** One rung per rank: the level each rank is awarded at. */
const LADDER = Array.from({ length: 13 }, (_, i) => ({ level: i * RANK_STEP + 1, rank: rankForLevel(i * RANK_STEP + 1) }));

export default function RankCard() {
  const progress = useProgress();
  const breakdown = useMemo(() => computeXp(progress), [progress]);
  const info = levelInfo(breakdown.total);
  const toNext = info.levelSpan - info.intoLevel;

  return (
    <section aria-labelledby="rank-card-title" className="premium-card rounded-3xl p-6 mb-8 space-y-5">
      <div className="dw-rank-card__head">
        <div className="dw-rank-card__emblem" aria-hidden="true">{info.rank.code}</div>
        <div className="min-w-0 flex-1">
          <div className="gold-eyebrow mb-1">// rank</div>
          <h2 id="rank-card-title" className="text-2xl font-black tracking-[-0.03em] text-[var(--color-heading)]">{info.rank.title}</h2>
          <p className="text-sm text-[var(--color-text-dim)]">
            Level {info.level} · <span className="font-mono font-bold text-[var(--color-gold-dim)]">{info.xp.toLocaleString()} XP</span>
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-[var(--color-text-dim)] mb-1.5">
          <span>{info.intoLevel} / {info.levelSpan} XP</span>
          <span>{toNext} XP to level {info.level + 1}</span>
        </div>
        <div className="dw-xp-bar" role="progressbar" aria-label={`Progress to level ${info.level + 1}`} aria-valuemin={0} aria-valuemax={info.levelSpan} aria-valuenow={info.intoLevel}>
          <span style={{ width: `${Math.round(info.fraction * 100)}%` }} />
        </div>
        {info.nextRank && (
          <p className="mt-2 text-xs text-[var(--color-text-dim)]">
            Next promotion: <span className="font-mono font-bold">{info.nextRank.code}</span> {info.nextRank.title} at level {info.nextRankLevel}.
          </p>
        )}
      </div>

      <dl className="dw-rank-card__breakdown">
        {BREAKDOWN_LABELS.map(([key, label]) => (
          <div key={key}><dt>{label}</dt><dd>{breakdown[key].toLocaleString()}</dd></div>
        ))}
      </dl>

      <ol className="dw-rank-ladder" aria-label="Rank ladder">
        {LADDER.map(({ level, rank }) => (
          <li key={rank.code} data-state={rank.code === info.rank.code ? 'current' : level <= info.level ? 'earned' : 'locked'} aria-current={rank.code === info.rank.code ? 'step' : undefined}>
            <b>{rank.code}</b>{rank.title}
          </li>
        ))}
      </ol>
    </section>
  );
}
