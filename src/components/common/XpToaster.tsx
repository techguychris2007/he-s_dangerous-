import { useEffect, useMemo, useRef, useState } from 'react';
import { getLastChangeSource, useProgress } from '../../state/progressStore';
import { useCrew } from '../../state/useCrew';
import { useXpModule } from '../../state/useXp';
import { levelInfo, type LevelInfo } from '../../data/levels';
import { CHARACTERS, guideForArea, pickLine, type CharacterId } from '../../data/characters';
import CharacterSays from '../characters/CharacterSays';
import './gamification.css';

type Toast =
  | { id: number; kind: 'xp'; gained: number }
  | { id: number; kind: 'level'; gained: number; level: LevelInfo; rankUp: boolean; host: CharacterId }
  | { id: number; kind: 'room'; gained: number; title: string; guide: CharacterId };

const DURATION: Record<Toast['kind'], number> = { xp: 3500, level: 7000, room: 7000 };

/** Watches total XP and celebrates every gain the learner earned themselves — a "+25 XP" chip for a
 *  flag, a room-complete card from that lab's guide, a promotion card from the learner's crew lead.
 *  Progress that arrives from cloud sync or an account switch moves the baseline silently (see
 *  getLastChangeSource). */
export default function XpToaster() {
  const progress = useProgress();
  const [crew] = useCrew();
  const scoring = useXpModule();
  const xp = useMemo(() => (scoring ? scoring.computeXp(progress).total : null), [scoring, progress]);
  const baseline = useRef<{ xp: number; user: string | null; cleared: Set<string> } | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Scoring arrives lazily; until it does there is nothing to compare, and its arrival only sets the baseline.
    if (xp === null || !scoring) return;
    const before = baseline.current;
    const cleared = new Set(Object.keys(progress.labCompletedAt));
    baseline.current = { xp, user: progress.lastUserId, cleared };
    if (!before || before.user !== progress.lastUserId || getLastChangeSource() !== 'local' || xp <= before.xp) return;

    const gained = xp - before.xp;
    const previous = levelInfo(before.xp);
    const current = levelInfo(xp);
    const newlyCleared = [...cleared].find((id) => !before.cleared.has(id));
    const lab = newlyCleared ? scoring.findLab(newlyCleared) : undefined;
    const id = nextId.current++;

    const toast: Toast = current.level > previous.level
      ? { id, kind: 'level', gained, level: current, rankUp: current.rank.code !== previous.rank.code, host: crew === 'breach' ? 'vex' : 'sentinel' }
      : lab
        ? { id, kind: 'room', gained, title: lab.scenario.title, guide: guideForArea(lab.scenario.category) }
        : { id, kind: 'xp', gained };

    setToasts((list) => [...list.slice(-2), toast]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setToasts((list) => list.filter((t) => t.id !== toast.id));
    }, DURATION[toast.kind]);
    timers.current.add(timer);
  }, [xp, scoring, progress.lastUserId, progress.labCompletedAt, crew]);

  useEffect(() => {
    const pending = timers.current;
    return () => { for (const timer of pending) clearTimeout(timer); };
  }, []);

  return (
    <div className="dw-xp-toasts" role="status" aria-live="polite">
      {toasts.map((t) => {
        if (t.kind === 'xp') {
          return (
            <div key={t.id} className="dw-xp-toast">
              <span className="dw-xp-toast__amount">+{t.gained} XP</span>
              <span className="dw-xp-toast__label">earned</span>
            </div>
          );
        }
        const host = t.kind === 'level' ? t.host : t.guide;
        return (
          <div key={t.id} className="dw-xp-toast dw-xp-toast--level">
            <span className="dw-xp-toast__eyebrow">
              {t.kind === 'room' ? 'Room complete' : t.rankUp ? 'Promotion' : 'Level up'} · +{t.gained} XP
            </span>
            <span className="dw-xp-toast__title">
              {t.kind === 'room' ? t.title : t.rankUp ? <><b>{t.level.rank.code}</b>{t.level.rank.title}</> : `Level ${t.level.level}`}
            </span>
            <CharacterSays id={host} size={44} className="mt-1">
              {pickLine(t.kind === 'room' ? CHARACTERS[host].lines.labClear : CHARACTERS[host].lines.levelUp, t.id)}
            </CharacterSays>
          </div>
        );
      })}
    </div>
  );
}
