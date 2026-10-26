import { Link } from 'react-router-dom';
import type { Achievement } from '../../data/achievements';
import AchievementMark from './AchievementMark';
import { IconArrowRight, IconCheck, IconLock } from '../layout/icons';

interface AchievementShelfProps {
  achievements: Achievement[];
  total: number;
}

/** Compact milestone shelf shared by the learner dashboard and progress page. */
export default function AchievementShelf({ achievements, total }: AchievementShelfProps) {
  const percent = total ? Math.round((achievements.length / total) * 100) : 0;

  return (
    <section className="dw-shelf mb-10 overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_2px_10px_-8px_var(--color-heading)]">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
        <div>
          <p className="mb-1 text-2xs font-bold uppercase tracking-[.16em] text-[var(--color-accent-dim)]">Learning record</p>
          <h2 className="text-base font-bold tracking-[-.02em] text-[var(--color-heading)]">Achievements</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 font-mono text-xs font-semibold text-[var(--color-text-dim)]">
            {achievements.length.toString().padStart(2, '0')} <span className="text-[var(--color-text-dim)]/60">/</span> {total.toString().padStart(2, '0')} awarded
          </span>
          <Link to="/profile" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-dim)]">
            Full record <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <div className="h-1 bg-[var(--color-surface-2)]" aria-label={`${percent}% of achievements awarded`}>
        <div className="h-full rounded-r-full bg-[var(--color-accent)] transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>

      {achievements.length === 0 ? (
        <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
          <div className="flex gap-2" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-dim)]">
                <IconLock className="h-4 w-4" />
              </span>
            ))}
          </div>
          <p className="min-w-0 flex-1 text-sm leading-6 text-[var(--color-text-dim)]">
            <b className="font-semibold text-[var(--color-heading)]">No badges yet.</b> Complete a lesson or capture a lab flag to earn your first achievement.
          </p>
          <Link to="/labs" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 text-xs font-bold text-white hover:brightness-110">
            Find a room <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-flow-col auto-cols-[minmax(230px,1fr)] gap-3 overflow-x-auto px-4 py-4 sm:px-5">
          {achievements.map((achievement) => (
            <article key={achievement.id} title={achievement.description} className="flex min-h-[88px] items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3.5 transition-colors hover:border-[var(--color-accent)]/35">
              <AchievementMark icon={achievement.icon} unlocked size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold leading-5 text-[var(--color-heading)]">{achievement.title}</h3>
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-text-dim)]">{achievement.description}</p>
                <p className="mt-2 text-2xs font-black uppercase tracking-[.14em] text-[var(--color-accent)]">Awarded</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
