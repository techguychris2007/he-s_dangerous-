import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROADMAP, findModule } from '../../data/curriculum';
import { DEFENSIVE_MILESTONES } from '../../data/defensiveCurriculum';
import { useProgress } from '../../state/progressStore';
import type { RoadmapTrack } from '../../types';
import type { CharacterId } from '../../data/characters';
import CharacterAvatar from '../characters/CharacterAvatar';
import ProgressRing from '../common/ProgressRing';
import { IconCheck, ModuleIcon } from '../layout/icons';
import './roadmap-tree.css';

/** Track tone = one platform token per career path, used for icon tiles, connectors and badges. */
const BRANCHES: { track: RoadmapTrack; title: string; blurb: string; tone: string; guide: CharacterId }[] = [
  { track: 'security', title: 'Offensive security', blurb: 'Test systems and prove what is exploitable, from recon to a full engagement.', tone: 'var(--color-accent)', guide: 'vex' },
  { track: 'defensive', title: 'Defensive security', blurb: 'Triage alerts, investigate incidents and lead the response.', tone: 'var(--color-gold)', guide: 'sentinel' },
  { track: 'programming', title: 'Programming', blurb: 'Write the tools you use and read the code you attack.', tone: 'var(--color-accent-2)', guide: 'cipher' },
  { track: 'software', title: 'Software engineering', blurb: 'Design, test, ship and run software that survives real users and real teams.', tone: 'var(--color-accent-dim)', guide: 'cipher' },
  { track: 'ml', title: 'Machine learning', blurb: 'Understand data and models — and how they fail.', tone: 'var(--color-success)', guide: 'byte' },
];
const COLLAPSED = 8;

type Stage = (typeof ROADMAP)[number];

function useStageStatus() {
  const progress = useProgress();
  return (stage: Stage) => {
    const mod = findModule(stage.moduleSlug);
    const total = mod?.lessons.length ?? 0;
    const done = mod?.lessons.filter((lesson) => progress.isLessonComplete(lesson.id)).length ?? 0;
    return { mod, total, done, complete: total > 0 && done === total };
  };
}

function StageCard({ stage, tone, upNext }: { stage: Stage; tone: string; upNext: boolean }) {
  const status = useStageStatus()(stage);
  const { mod, total, done, complete } = status;
  return (
    <Link to={stage.href ?? `/module/${stage.moduleSlug}`} className="rm-card" data-next={upNext} data-complete={complete} style={{ '--tone': tone } as React.CSSProperties}>
      <span className="rm-card__tile" aria-hidden="true"><ModuleIcon icon={mod?.icon ?? 'route'} className="h-5 w-5" /></span>
      <span className="rm-card__body">
        <span className="rm-card__title">{stage.title}</span>
        <span className="rm-card__meta">
          {upNext && <span className="rm-chip">Up next</span>}
          {total ? `${total} lessons` : 'Portal'}
        </span>
      </span>
      {complete ? <span className="rm-card__done" aria-label="Completed"><IconCheck className="h-4 w-4" /></span>
        : done > 0 ? <ProgressRing value={(100 * done) / total} size={36} stroke={3} label={`${stage.title}: ${done} of ${total} lessons`} /> : null}
    </Link>
  );
}

function MilestoneBadge({ title, achieved, tone }: { title: string; achieved: boolean; tone: string }) {
  return (
    <div className="rm-milestone" data-achieved={achieved} style={{ '--tone': tone } as React.CSSProperties}>
      <svg viewBox="0 0 40 46" className="rm-milestone__shield" aria-hidden="true">
        <path d="M20 2 37 8v15c0 11-7.5 18-17 21C10.5 41 3 34 3 23V8z" />
        <path d="M13 23l5 5 9-10" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rm-milestone__tick" />
      </svg>
      <span><span className="rm-milestone__title">{title}</span><span className="rm-milestone__label">{achieved ? 'Milestone earned' : 'Career milestone'}</span></span>
    </div>
  );
}

function Branch({ branch, onOpen }: { branch: (typeof BRANCHES)[number]; onOpen: (track: RoadmapTrack) => void }) {
  const stages = ROADMAP.filter((s) => s.track === branch.track);
  const status = useStageStatus();
  const [expanded, setExpanded] = useState(false);
  const nextIndex = stages.findIndex((s) => { const st = status(s); return st.total > 0 && !st.complete; });
  const visible = expanded ? stages : stages.slice(0, Math.max(COLLAPSED, nextIndex + 1));
  const completeCount = stages.filter((s) => status(s).complete).length;
  return (
    <section className="rm-branch" style={{ '--tone': branch.tone } as React.CSSProperties} aria-labelledby={`rm-${branch.track}`}>
      <header className="rm-branch__head">
        <CharacterAvatar id={branch.guide} size={48} decorative />
        <div className="min-w-0">
          <h3 id={`rm-${branch.track}`}>{branch.title}</h3>
          <p>{branch.blurb}</p>
          <button type="button" onClick={() => onOpen(branch.track)} className="rm-branch__open">{completeCount}/{stages.length} modules · View path →</button>
        </div>
      </header>
      <ol className="rm-branch__list">
        {visible.map((stage, i) => {
          const milestone = branch.track === 'defensive' ? DEFENSIVE_MILESTONES.find((m) => m.moduleSlug === stage.moduleSlug) : undefined;
          return (
            <li key={stage.title}>
              <StageCard stage={stage} tone={branch.tone} upNext={i === nextIndex} />
              {milestone && <MilestoneBadge title={milestone.title} tone={branch.tone} achieved={status(stage).complete} />}
            </li>
          );
        })}
      </ol>
      {stages.length > visible.length || expanded ? (
        <button type="button" className="rm-branch__more" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? 'Show fewer modules' : `Show all ${stages.length} modules`}
        </button>
      ) : null}
    </section>
  );
}

/** TryHackMe-style roadmap: a trunk of foundations that branches into four careers, with progress on
 *  every module and a guide at the head of each branch. */
export default function RoadmapTree({ onOpen }: { onOpen: (track: RoadmapTrack) => void }) {
  const status = useStageStatus();
  const pre = ROADMAP.filter((s) => s.track === 'presecurity');
  const preDone = pre.filter((s) => status(s).complete).length;
  const preNext = pre.findIndex((s) => { const st = status(s); return st.total > 0 && !st.complete; });
  return (
    <div className="rm-tree">
      <div className="rm-node">
        <h3>Computer and security foundations</h3>
        <p>How computers, networks and the web work — and how to practise safely in a lab.</p>
      </div>
      <div className="rm-trunk" style={{ '--tone': 'var(--color-success)' } as React.CSSProperties}>
        <header className="rm-trunk__head">
          <CharacterAvatar id="byte" size={40} decorative />
          <span><b>Pre-security</b> · {preDone}/{pre.length} modules</span>
          <button type="button" onClick={() => onOpen('presecurity')} className="rm-branch__open">View path →</button>
        </header>
        <ol className="rm-trunk__list">
          {pre.map((stage, i) => <li key={stage.title}><StageCard stage={stage} tone="var(--color-success)" upNext={i === preNext} /></li>)}
        </ol>
      </div>
      <div className="rm-node">
        <h3>Choose your career path</h3>
        <p>Every path is open. Most learners start with the one their crew leads — you can follow more than one.</p>
      </div>
      <div className="rm-split" aria-hidden="true" />
      <div className="rm-branches">
        {BRANCHES.map((branch) => <Branch key={branch.track} branch={branch} onOpen={onOpen} />)}
      </div>
      <div className="rm-end">
        <div className="rm-end__beam" aria-hidden="true" />
        <img src={`${import.meta.env.BASE_URL}characters/sentinel-full.webp`} alt="" width={140} height={210} loading="lazy" decoding="async" className="rm-end__figure" />
        <div className="rm-node">
          <h3>What’s next?</h3>
          <p>Hundreds of hands-on labs and the Season 1 investigations are waiting in Practice.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link to="/labs" className="dw-button">Explore labs</Link>
            <Link to="/soc-portal" className="dw-button">Season 1 cases</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
