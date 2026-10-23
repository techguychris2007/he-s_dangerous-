import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { LabEntry } from '../../data/labs';
import { useLabProgress, useProgressActions } from '../../state/progressStore';
import { IconBookmark, IconCheck, IconStar, ModuleIcon } from '../layout/icons';
import { DifficultyBars } from '../common/RoomHero';
import { getLabIconKey } from '../../data/labIcon';
import type { LabRatingSummary } from '../../lib/labRatings';
import CharacterAvatar from '../characters/CharacterAvatar';
import { guideForArea } from '../../data/characters';
import { labXpReward } from '../../data/levels';
import '../common/workspace-header.css';
import IsoBlock, { type IsoTone } from './IsoBlock';
import './room-card.css';

const DEFENSIVE = new Set(['SOC', 'Forensics', 'Security+', 'Malware', 'Security Engineering']);
const ANALYSIS = new Set(['Binary Analysis', 'Cloud', 'AI Security']);
/** Card emblem colour family: offensive rooms in the accent, defensive in gold, analysis in accent-2. */
function toneFor(category: string): IsoTone {
  return DEFENSIVE.has(category) ? 'defense' : ANALYSIS.has(category) ? 'analysis' : 'offense';
}

export default memo(function LabCard({
  lab,
  variant = 'catalog',
  ratingSummary,
}: {
  lab: LabEntry;
  variant?: 'catalog' | 'task';
  ratingSummary?: LabRatingSummary;
}) {
  const { flagCount: captured, isBookmarked: bookmarked } = useLabProgress(lab.scenario.id);
  const { toggleBookmark } = useProgressActions();
  const total = Math.max(lab.scenario.totalFlags, 1);
  const done = captured >= total;
  const pct = Math.min(100, Math.round((captured / total) * 100));
  const xpReward = labXpReward(lab.scenario.difficulty, lab.scenario.totalFlags);
  const guide = guideForArea(lab.scenario.category);
  const labUrl = `/lab/${lab.slug}`;
  const techIcon = getLabIconKey(lab);
  const status = done ? 'Complete' : captured > 0 ? 'In progress' : 'Not started';
  const ctaLabel = variant === 'task' ? (done ? 'Review task' : captured > 0 ? 'Continue task' : 'Start task') : done ? 'Review room' : captured > 0 ? 'Continue room' : 'Enter room';
  const minutes = ({ Easy: 20, Medium: 35, Hard: 55 } as Record<string, number>)[lab.scenario.difficulty] ?? 30;

  if (variant === 'task') return <article className="task-lab-row">
    <span className="task-lab-icon" aria-hidden="true"><ModuleIcon icon={techIcon} className="h-5 w-5" /></span>
    <div className="task-lab-content"><div className="task-lab-meta"><span>{lab.scenario.category}</span><span>·</span><span>{lab.scenario.difficulty}</span><span>·</span><span>+{xpReward} XP</span></div><Link to={labUrl} className="task-lab-title">{lab.scenario.title}</Link><p className="line-clamp-2">{lab.scenario.briefing}</p><div className="task-lab-status"><span>{status}</span><span>{Math.min(captured, total)} of {total} flags captured</span>{done && <span className="text-[var(--color-success)]">Completed ✓</span>}</div></div>
    <div className="task-lab-actions"><Link to={labUrl}>{ctaLabel} →</Link><button onClick={() => toggleBookmark(lab.scenario.id)} aria-pressed={bookmarked} aria-label={`${bookmarked ? 'Remove bookmark from' : 'Bookmark'} ${lab.scenario.title}`} className={bookmarked ? 'text-[var(--color-gold-dim)]' : 'text-[var(--color-text-dim)]'}><IconBookmark className="h-4 w-4" filled={bookmarked} /></button></div>
  </article>;

  return (
    <article className="dw-room-card group">
      <div className="dw-room-card__banner">
        <IsoBlock width={58} depth={11} tone={done ? 'done' : captured > 0 ? 'progress' : toneFor(lab.scenario.category)} crest={<ModuleIcon icon={techIcon} />} className="dw-room-card__emblem" />
        <span className="dw-room-card__cat"><ModuleIcon icon={techIcon} className="h-3.5 w-3.5" />{lab.scenario.category}</span>
        {(lab.scenario.webApplication || lab.scenario.directoryMap) && <span className="dw-room-card__tag">{lab.scenario.webApplication ? 'Website' : 'Map'}</span>}
        {done && <span className="dw-room-card__tag dw-room-card__tag--done"><IconCheck className="h-3 w-3" />Complete</span>}
        <button
          onClick={(e) => { e.preventDefault(); toggleBookmark(lab.scenario.id); }}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark this room'}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this room'}
          aria-pressed={bookmarked}
          className="dw-room-card__save"
          data-on={bookmarked}
        >
          <IconBookmark className="h-4 w-4" filled={bookmarked} />
        </button>
      </div>

      <div className="dw-room-card__body">
        <Link to={labUrl} className="dw-room-card__title">{lab.scenario.title}</Link>
        <p className="dw-room-card__brief">{lab.scenario.briefing}</p>
      </div>

      <ul className="dw-room-card__meta">
        <li className="dw-room-card__guide" title={`Guide: ${guide}`}><CharacterAvatar id={guide} size={24} decorative /></li>
        <li><DifficultyBars difficulty={lab.scenario.difficulty} /></li>
        <li>~{minutes} min</li>
        <li>{total} {total === 1 ? 'flag' : 'flags'}</li>
        <li className="dw-room-card__xp">+{xpReward} XP</li>
        {ratingSummary && ratingSummary.ratingCount > 0 && <li className="ml-auto inline-flex items-center gap-1 text-[var(--color-gold-dim)]"><IconStar className="h-3 w-3" filled />{ratingSummary.avgRating.toFixed(1)}</li>}
      </ul>

      {captured > 0 && !done && (
        <div className="dw-room-card__progress" title={`${captured} of ${total} flags`}>
          <span style={{ width: `${pct}%` }} />
        </div>
      )}

      <Link to={labUrl} className="dw-room-card__cta" data-done={done}>
        {done && <IconCheck className="h-4 w-4" />}{ctaLabel} →
      </Link>
    </article>
  );
});
