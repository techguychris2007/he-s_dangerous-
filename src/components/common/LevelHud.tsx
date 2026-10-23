import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../../state/progressStore';
import { useXpModule } from '../../state/useXp';
import { computeStreak } from '../../data/streak';
import { levelInfo } from '../../data/levels';
import { IconLightning } from '../layout/icons';
import './gamification.css';

/** Always-visible level, rank and streak in the TopBar — the "you are here" of the progression system.
 *  XP scoring loads lazily (useXpModule), so the level shows a placeholder for the first moment. */
export default function LevelHud() {
  const progress = useProgress();
  const xp = useXpModule();
  const info = useMemo(() => (xp ? levelInfo(xp.computeXp(progress).total) : null), [xp, progress]);
  const streak = useMemo(() => computeStreak(progress.activityDates), [progress.activityDates]);

  if (!info) {
    return (
      <Link to="/profile" className="dw-level-hud premium-card" aria-label="Open profile. Loading your level.">
        <span className="dw-level-hud__badge" aria-hidden="true">·</span>
        <span className="dw-level-hud__streak" data-cold={streak.current === 0} aria-hidden="true"><IconLightning />{streak.current}</span>
      </Link>
    );
  }

  const toNext = info.levelSpan - info.intoLevel;
  return (
    <Link
      to="/profile"
      className="dw-level-hud premium-card"
      aria-label={`Level ${info.level}, rank ${info.rank.title}. ${toNext} XP to level ${info.level + 1}. ${streak.current} day streak. Open profile.`}
      title={`${info.xp.toLocaleString()} XP · ${toNext} XP to level ${info.level + 1}`}
    >
      <span className="dw-level-hud__badge" aria-hidden="true">{info.level}</span>
      <span className="dw-level-hud__meta" aria-hidden="true">
        <span className="dw-level-hud__rank block"><b>{info.rank.code}</b>{info.rank.title}</span>
        <span className="dw-xp-bar block"><span style={{ width: `${Math.round(info.fraction * 100)}%` }} /></span>
      </span>
      <span className="dw-level-hud__streak" data-cold={streak.current === 0} aria-hidden="true">
        <IconLightning />{streak.current}
      </span>
    </Link>
  );
}
