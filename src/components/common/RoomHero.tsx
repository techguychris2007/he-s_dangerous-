import { forwardRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CharacterId } from '../../data/characters';
import CharacterAvatar from '../characters/CharacterAvatar';
import IsoBlock, { type IsoTone } from '../labs/IsoBlock';
import { IconBookmark, IconCopy, ModuleIcon } from '../layout/icons';
import './room-hero.css';

import type { Difficulty } from '../../data/rooms';

const BARS: Record<Difficulty, number> = { Easy: 1, Medium: 2, Hard: 3 };

export function DifficultyBars({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="dw-diff" data-level={difficulty} title={difficulty}>
      <span aria-hidden="true">{[1, 2, 3].map((n) => <i key={n} data-on={n <= BARS[difficulty]} />)}</span>
      {difficulty}
    </span>
  );
}

export interface RoomHeroProps {
  guide: CharacterId;
  crumbs: { label: string; to?: string }[];
  title: string;
  summary: string;
  difficulty: Difficulty;
  minutes: number;
  /** Extra meta chips after time — e.g. "4 flags", "12,014 records". */
  facts: string[];
  xp: number;
  /** 0–100 */
  percent: number;
  progressLabel: string;
  saved?: boolean;
  onToggleSave?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  /** ModuleIcon key for the room emblem; without it the guide's portrait is shown. */
  icon?: string;
  tone?: IsoTone;
  children?: ReactNode;
}

/** The room banner shared by offensive labs and SOC cases: who guides you, what it costs, what it pays,
 *  how far you are — then one button in. Always dark, like a briefing screen, in either theme. */
const RoomHero = forwardRef<HTMLButtonElement, RoomHeroProps>(function RoomHero(
  { guide, crumbs, title, summary, difficulty, minutes, facts, xp, percent, progressLabel, saved, onToggleSave, primaryLabel, onPrimary, icon, tone = 'offense', children },
  primaryRef,
) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* Clipboard can be blocked; the address bar still has the link. */ }
  };
  const pct = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <section className="dw-room-hero" aria-labelledby="room-hero-title">
      <div className="dw-room-hero__inner">
        <nav aria-label="Breadcrumb" className="dw-room-hero__crumbs">
          {crumbs.map((c, i) => (
            <span key={c.label}>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
              {i < crumbs.length - 1 && <span aria-hidden="true"> › </span>}
            </span>
          ))}
        </nav>
        <div className="dw-room-hero__head">
          {icon ? (
            <span className="dw-room-hero__emblem" aria-hidden="true">
              <IsoBlock width={112} depth={18} tone={pct >= 100 ? 'done' : tone} glow={pct > 0 && pct < 100} crest={<ModuleIcon icon={icon} />} />
            </span>
          ) : <CharacterAvatar id={guide} size={72} />}
          <div className="min-w-0">
            <h1 id="room-hero-title">{title}</h1>
            <p className="dw-room-hero__summary">{summary}</p>
            <ul className="dw-room-hero__meta">
              <li><DifficultyBars difficulty={difficulty} /></li>
              <li>~{minutes} min</li>
              {facts.map((f) => <li key={f}>{f}</li>)}
              <li className="dw-room-hero__xp">+{xp.toLocaleString()} XP</li>
              {icon && <li className="dw-room-hero__guide"><CharacterAvatar id={guide} size={22} decorative />Guide</li>}
            </ul>
          </div>
        </div>
        <div className="dw-room-hero__actions">
          <button ref={primaryRef} type="button" className="dw-room-hero__primary" onClick={onPrimary}>{primaryLabel} →</button>
          {onToggleSave && (
            <button type="button" onClick={onToggleSave} aria-pressed={saved}>
              <IconBookmark className="w-4 h-4" filled={saved} />{saved ? 'Saved' : 'Save room'}
            </button>
          )}
          <button type="button" onClick={() => void copyLink()}><IconCopy className="w-4 h-4" />{copied ? 'Link copied' : 'Copy link'}</button>
          <span role="status" className="sr-only">{copied ? 'Room link copied' : ''}</span>
        </div>
        {children}
      </div>
      <div className="dw-room-hero__progress">
        <b>{progressLabel}</b>
        <div className="dw-room-hero__track" role="progressbar" aria-label={progressLabel} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <b>{pct}%</b>
      </div>
    </section>
  );
});

export default RoomHero;
