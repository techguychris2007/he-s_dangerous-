import { leagueFor } from '../../data/levels';
import { IconShield } from '../layout/icons';
import './gamification.css';

export function LeagueChip({ points }: { points: number }) {
  const { league } = leagueFor(points);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-black uppercase tracking-[.1em]"
      style={{ color: league.color, borderColor: `color-mix(in srgb, ${league.color} 40%, transparent)`, background: `color-mix(in srgb, ${league.color} 10%, transparent)` }}
    >
      <IconShield className="h-3 w-3" />{league.name}
    </span>
  );
}

/** Your current league and the distance to the next one — the hook that makes the board worth climbing. */
export function LeagueCard({ points }: { points: number }) {
  const { league, next } = leagueFor(points);
  const span = next ? next.min - league.min : 1;
  const into = next ? points - league.min : 1;
  return (
    <section className="premium-card rounded-2xl p-5 mb-6" aria-labelledby="league-title">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ color: league.color, background: `color-mix(in srgb, ${league.color} 14%, transparent)` }} aria-hidden="true">
          <IconShield className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-black uppercase tracking-[.18em] text-[var(--color-text-dim)]">Your league</p>
          <h2 id="league-title" className="text-xl font-black text-[var(--color-heading)]">{league.name} league</h2>
          <p className="text-xs text-[var(--color-text-dim)]">{next ? `${next.min - points} more lab points to reach ${next.name}.` : 'Top league reached. Hold your place.'}</p>
        </div>
        <span className="font-mono text-2xl font-black text-[var(--color-accent-dim)]">{points}<span className="ml-1 text-xs text-[var(--color-text-dim)]">pts</span></span>
      </div>
      <div className="dw-xp-bar mt-4" role="progressbar" aria-label={next ? `Progress to ${next.name} league` : 'League progress'} aria-valuemin={0} aria-valuemax={span} aria-valuenow={into}>
        <span style={{ width: `${Math.round((into / span) * 100)}%` }} />
      </div>
    </section>
  );
}
