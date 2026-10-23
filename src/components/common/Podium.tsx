import type { LeaderboardEntry } from '../../lib/leaderboard';
import { IconCrown } from '../layout/icons';
import { LeagueChip } from './LeagueChip';
import { OperatorAvatar } from '../characters/CharacterAvatar';
import { cyberHandle } from '../../data/handles';
import './gamification.css';

/** Medal tones use platform tokens only: gold for the champion, neutral and muted gold for #2/#3. */
const PLACES = [
  { place: 2, tone: 'var(--color-text-dim)', label: '2nd' },
  { place: 1, tone: 'var(--color-gold)', label: 'Champion' },
  { place: 3, tone: 'var(--color-gold-dim)', label: '3rd' },
] as const;

/** The top three on a stage, champion raised in the middle. */
export default function Podium({ top, youId }: { top: LeaderboardEntry[]; youId?: string }) {
  return (
    <ol className="dw-podium" aria-label="Top three learners">
      {PLACES.map(({ place, tone, label }) => {
        const entry = top[place - 1];
        if (!entry) return null;
        const name = entry.displayName || cyberHandle(entry.userId);
        return (
          <li key={entry.userId} className="dw-podium__spot" data-place={place} style={{ '--tone': tone } as React.CSSProperties}>
            <span className="dw-podium__medal" aria-hidden="true">{place === 1 ? <IconCrown className="w-4 h-4" /> : place}</span>
            <span className="dw-podium__avatar" aria-hidden="true"><OperatorAvatar seed={entry.userId} size={place === 1 ? 72 : 56} /></span>
            <span className="dw-podium__name">{name}{entry.userId === youId && <span className="text-[var(--color-accent)]"> (you)</span>}</span>
            <span className="dw-podium__points">{entry.points.toLocaleString()} pts</span>
            <LeagueChip points={entry.points} />
            <span className="dw-podium__label"><span className="sr-only">Place {place}: </span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
