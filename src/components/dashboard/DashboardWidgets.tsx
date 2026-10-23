import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../../state/progressStore';
import { useCrew } from '../../state/useCrew';
import { computeStreak, MAX_FREEZES } from '../../data/streak';
import { computeXp } from '../../data/xp';
import { labXpReward, levelInfo } from '../../data/levels';
import { DAILY_OP_BONUS, dailyOpFor, localDate } from '../../data/dailyOp';
import { WEEKLY_CHEST_XP, currentMissions, missionsComplete } from '../../data/weekly';
import { CHARACTERS, CREWS, CREW_MEMBERS, guideForArea, type CharacterId } from '../../data/characters';
import CharacterAvatar, { OperatorAvatar } from '../characters/CharacterAvatar';
import { useHandle } from '../../state/useHandle';
import { DifficultyBars } from '../common/RoomHero';
import { IconArrowRight, IconChest, IconLightning, IconStar, IconTrophy, ModuleIcon } from '../layout/icons';
import IsoBlock from '../labs/IsoBlock';
import '../common/gamification.css';
import './dashboard.css';

export interface ContinueTarget {
  title: string;
  detail: string;
  to: string;
  label: string;
  /** 0–100 completion of the room or module being resumed. */
  percent: number;
  guide: CharacterId;
  /** ModuleIcon key for the mission block. */
  icon?: string;
  /** Short kind label, e.g. "Room" or "Lesson". */
  kind?: string;
}

/** Who you are and where you stand: rank, level progress and the three numbers worth checking daily. */
/** Operator banner. The dashboard greets the learner; the profile page passes `heading` (the bare
 *  handle) and `children` for its own actions under the rank line. */
export function ProfileHeader({ name, badges, badgeTotal, heading, children }: { name: string | null; badges: number; badgeTotal: number; heading?: string; children?: React.ReactNode }) {
  const progress = useProgress();
  const info = useMemo(() => levelInfo(computeXp(progress).total), [progress]);
  const streak = useMemo(() => computeStreak(progress.activityDates), [progress.activityDates]);
  const { seed, handle } = useHandle();
  const realName = (name ?? '').trim();
  const toNext = info.levelSpan - info.intoLevel;
  return (
    <section className="dw-profile" aria-labelledby="dw-profile-title">
      <span className="dw-profile__id">
        <OperatorAvatar seed={seed} size={68} label={`${handle} operator avatar`} />
        <span className="dw-profile__emblem" aria-hidden="true">{info.rank.code}</span>
      </span>
      <div className="dw-profile__who">
        <h1 id="dw-profile-title">{heading ?? `Welcome back, ${handle}`}</h1>
        <p>{info.rank.title} · Level {info.level}{realName ? ` · ${realName}` : ''}</p>
        <div className="dw-profile__level">
          <div className="dw-xp-bar" role="progressbar" aria-label={`Progress to level ${info.level + 1}`} aria-valuemin={0} aria-valuemax={info.levelSpan} aria-valuenow={info.intoLevel}>
            <span style={{ width: `${Math.round(info.fraction * 100)}%` }} />
          </div>
          <span>{toNext.toLocaleString()} XP to level {info.level + 1}</span>
        </div>
        {children}
      </div>
      <dl className="dw-profile__stats">
        <div><dt>Day streak</dt><dd><IconLightning className="w-4 h-4 text-[var(--color-gold)]" />{streak.current}</dd></div>
        <div><dt>Total XP</dt><dd><IconStar className="w-4 h-4 text-[var(--chrome-highlight)]" />{info.xp.toLocaleString()}</dd></div>
        <div><dt>Badges</dt><dd><IconTrophy className="w-4 h-4 text-[var(--color-gold)]" />{badges}<small>/{badgeTotal}</small></dd></div>
      </dl>
    </section>
  );
}

export function ContinueCard({ next }: { next: ContinueTarget }) {
  const pct = Math.round(next.percent);
  return (
    <section className="dw-mission" aria-labelledby="dw-continue-title">
      <div className="dw-mission__art" aria-hidden="true">
        <IsoBlock width={132} depth={22} tone={pct > 0 ? 'progress' : 'idle'} glow crest={<ModuleIcon icon={next.icon ?? 'route'} />} />
      </div>
      <div className="dw-mission__body">
        <p className="dw-mission__label"><span />Pick up where you left off{next.kind ? ` · ${next.kind}` : ''}</p>
        <h2 id="dw-continue-title">{next.title}</h2>
        <p className="dw-mission__detail">{next.detail}</p>
        <div className="dw-mission__progress">
          <div className="dw-xp-bar" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
          <b>{pct}%</b>
        </div>
        <div className="dw-mission__actions">
          <Link to={next.to} className="dw-button dw-button--primary">{next.label}<IconArrowRight className="w-4 h-4" /></Link>
          <span className="dw-mission__guide"><CharacterAvatar id={next.guide} size={32} decorative />{CHARACTERS[next.guide].name} is your guide</span>
        </div>
      </div>
    </section>
  );
}

function useTimeToMidnight(): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const minutes = Math.max(0, Math.round((midnight.getTime() - now) / 60_000));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/** Today's featured lab — one for everyone, a bonus for clearing it before midnight. */
export function DailyOpCard() {
  const { labFlags, labCompletedAt } = useProgress();
  const today = localDate();
  const op = useMemo(() => dailyOpFor(today), [today]);
  const left = useTimeToMidnight();
  const captured = labFlags[op.scenario.id]?.length ?? 0;
  const clearedAt = labCompletedAt[op.scenario.id];
  const clearedToday = clearedAt !== undefined && localDate(new Date(clearedAt)) === today;
  const clearedBefore = clearedAt !== undefined && !clearedToday;

  return (
    <section className="dw-card" aria-labelledby="dw-daily-title">
      <div className="flex items-center justify-between gap-2">
        <p className="dw-card__label">Daily Op</p>
        <span className="dw-card__meta">{clearedToday ? 'Cleared today' : `Resets in ${left}`}</span>
      </div>
      <div className="flex items-start gap-3">
        <CharacterAvatar id={guideForArea(op.scenario.category)} size={44} decorative />
        <div className="min-w-0">
          <h2 id="dw-daily-title" className="dw-card__title">{op.scenario.title}</h2>
          <p className="dw-card__meta flex flex-wrap items-center gap-x-3 gap-y-1">
            <DifficultyBars difficulty={op.scenario.difficulty} />
            <span>{op.scenario.category}</span>
          </p>
        </div>
      </div>
      <p className="dw-card__note">
        {clearedToday
          ? `Bonus banked: +${DAILY_OP_BONUS} XP.`
          : clearedBefore
            ? 'Already cleared on an earlier day — no daily bonus.'
            : <><b>+{labXpReward(op.scenario.difficulty, op.scenario.totalFlags) + DAILY_OP_BONUS} XP</b> if you clear it today, including a {DAILY_OP_BONUS} XP daily bonus.</>}
      </p>
      <Link to={'/lab/' + op.slug} className="dw-button">{clearedToday ? 'Review' : captured > 0 ? 'Continue' : 'Start Daily Op'}<IconArrowRight className="w-4 h-4" /></Link>
    </section>
  );
}

/** This week at a glance: which days counted, the three missions, and the chest they unlock. */
export function WeekCard() {
  const { activityDates, labCompletedAt } = useProgress();
  const streak = useMemo(() => computeStreak(activityDates), [activityDates]);
  const { week, missions } = useMemo(() => currentMissions({ activityDates, labCompletedAt }), [activityDates, labCompletedAt]);
  const complete = missionsComplete(missions);
  const days = useMemo(() => {
    const active = new Set(activityDates);
    const frozen = new Set(streak.frozenDates);
    const today = localDate();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(week + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const key = localDate(d);
      return { key, day: d.toLocaleDateString(undefined, { weekday: 'narrow' }), full: d.toLocaleDateString(undefined, { weekday: 'long' }), state: active.has(key) ? 'active' : frozen.has(key) ? 'frozen' : key > today ? 'future' : 'missed', today: key === today };
    });
  }, [activityDates, streak.frozenDates, week]);

  return (
    <section className="dw-card" aria-labelledby="dw-week-title">
      <div className="flex items-center justify-between gap-2">
        <p id="dw-week-title" className="dw-card__label">Your week</p>
        <span className="dw-card__meta" title="Every 7 active days in a row earns a freeze that covers one missed day.">{streak.freezes}/{MAX_FREEZES} streak freezes</span>
      </div>
      <ol className="dw-week" aria-label="Activity this week">
        {days.map((d) => (
          <li key={d.key} data-state={d.state} data-today={d.today} aria-label={`${d.full}: ${d.state === 'frozen' ? 'covered by a streak freeze' : d.state}`}>
            <span aria-hidden="true" />{d.day}
          </li>
        ))}
      </ol>
      <ul className="dw-missions">
        {missions.map((m) => (
          <li key={m.id} data-done={m.current >= m.target}>
            <span>{m.label}</span>
            <span className="font-mono">{Math.min(m.current, m.target)}/{m.target}</span>
          </li>
        ))}
      </ul>
      <p className="dw-card__note flex items-center gap-2">
        <IconChest className="w-4 h-4 shrink-0" />
        {complete ? `Chest opened: +${WEEKLY_CHEST_XP} XP banked this week.` : `Complete all three for +${WEEKLY_CHEST_XP} XP.`}
      </p>
    </section>
  );
}

/** Choose a side once. Hidden after the choice; the Profile page is where it can be changed. */
export function CrewPicker({ always = false }: { always?: boolean }) {
  const [crew, setCrew] = useCrew();
  if (crew && !always) return null;
  const sides = ['bastion', 'breach'] as const;
  return (
    <section className="dw-card" aria-labelledby="dw-crew-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="dw-crew-title" className="dw-card__title">{crew ? 'Your crew' : 'Choose your side'}</h2>
        <p className="dw-card__meta">Your crew guides and celebrates with you. Every path stays open.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {sides.map((side) => (
          <button key={side} type="button" onClick={() => setCrew(side)} aria-pressed={crew === side} className="dw-crew-option">
            <span className="flex gap-1.5" aria-hidden="true">
              {CREW_MEMBERS[side].map((id) => <CharacterAvatar key={id} id={id} size={36} decorative />)}
            </span>
            <span className="dw-crew-option__name">{CREWS[side].name}<small>{CREWS[side].side}</small></span>
            <span className="dw-crew-option__blurb">{CREWS[side].blurb}</span>
            <span className="dw-crew-option__members">{CREW_MEMBERS[side].map((id) => CHARACTERS[id].name).join(' · ')}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
