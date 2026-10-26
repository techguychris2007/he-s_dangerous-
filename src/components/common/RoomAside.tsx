import { Link } from 'react-router-dom';
import type { CharacterId } from '../../data/characters';
import { CHARACTERS } from '../../data/characters';
import CharacterAvatar from '../characters/CharacterAvatar';
import { DifficultyBars, type RoomHeroProps } from './RoomHero';
import './room-hero.css';

export interface RoomAsideProps {
  difficulty: RoomHeroProps['difficulty'];
  minutes: number;
  xp: number;
  facts: { label: string; value: string }[];
  /** "What you'll learn / cover" — chapter or objective titles. */
  outcomes: string[];
  outcomesTitle?: string;
  guide: CharacterId;
  /** Where "back" returns to. */
  backTo: string;
  backLabel: string;
  /** 0–100 room completion, drawn as a ring at the top of the rail. */
  percent?: number;
  progressLabel?: string;
}

/** The right-hand details rail on a room overview — mirrors KC7/TryHackMe's room sidebar and fills the
 *  width that a single centred column would leave blank. */
export default function RoomAside({ difficulty, minutes, xp, facts, outcomes, outcomesTitle = "What you'll cover", guide, backTo, backLabel, percent, progressLabel = 'Room progress' }: RoomAsideProps) {
  const character = CHARACTERS[guide];
  return (
    <aside className="dw-room-aside" aria-label="Room details">
      {percent !== undefined && (
        <section className="dw-room-aside__card dw-room-aside__ring">
          <span className="dw-ring" style={{ '--p': Math.max(0, Math.min(100, Math.round(percent))) } as React.CSSProperties} role="img" aria-label={`${progressLabel}: ${Math.round(percent)}%`}><b>{Math.round(percent)}%</b></span>
          <div>
            <h2>{progressLabel}</h2>
            <p>{percent >= 100 ? 'Complete. Every proof verified.' : percent > 0 ? 'Keep going — your progress is saved.' : 'Not started yet. Open the workspace to begin.'}</p>
          </div>
        </section>
      )}
      <section className="dw-room-aside__card">
        <h2>Details</h2>
        <dl className="dw-room-aside__facts">
          <div><dt>Difficulty</dt><dd><DifficultyBars difficulty={difficulty} /></dd></div>
          <div><dt>Time</dt><dd>~{minutes} min</dd></div>
          <div><dt>Reward</dt><dd className="dw-room-aside__xp">+{xp.toLocaleString()} XP</dd></div>
          {facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
      </section>

      {outcomes.length > 0 && (
        <section className="dw-room-aside__card">
          <h2>{outcomesTitle}</h2>
          <ol className="dw-room-aside__outcomes">
            {outcomes.map((o, i) => <li key={i}><span aria-hidden="true">{i + 1}</span>{o}</li>)}
          </ol>
        </section>
      )}

      <section className="dw-room-aside__card dw-room-aside__guide">
        <CharacterAvatar id={guide} size={44} decorative />
        <div>
          <p className="dw-room-aside__guide-name">{character.name}</p>
          <p className="dw-room-aside__guide-role">{character.role}</p>
          <p className="dw-room-aside__guide-bio">{character.bio}</p>
        </div>
      </section>

      <Link to={backTo} className="dw-room-aside__back">← {backLabel}</Link>
    </aside>
  );
}
