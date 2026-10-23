import { useCallback, useEffect, useState } from 'react';
import { useProgressSelector } from './progressStore';
import { cyberHandle } from '../data/handles';

const ROLL_KEY = (seed: string) => `darkworld.handle.roll.${seed}`;
const SEEN_KEY = (seed: string) => `darkworld.handle.seen.${seed}`;
const EVENT = 'darkworld:handle';

function readRoll(seed: string): number {
  try { return Number(localStorage.getItem(ROLL_KEY(seed))) || 0; } catch { return 0; }
}

/** The learner's cyber name and avatar seed. Seeded by the account id (falling back to the display
 *  name), so it matches across devices; rerolling stores a small offset on this device only. */
export function useHandle(): { seed: string; handle: string; reroll: () => void; seen: boolean; markSeen: () => void } {
  const userId = useProgressSelector((s) => s.lastUserId);
  const name = useProgressSelector((s) => s.learnerName);
  const seed = userId ?? (name?.trim() || 'guest');
  const [roll, setRoll] = useState(() => readRoll(seed));
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem(SEEN_KEY(seed)) === '1'; } catch { return true; } });

  useEffect(() => {
    const sync = () => {
      setRoll(readRoll(seed));
      try { setSeen(localStorage.getItem(SEEN_KEY(seed)) === '1'); } catch { setSeen(true); }
    };
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [seed]);

  const reroll = useCallback(() => {
    const next = readRoll(seed) + 1;
    try { localStorage.setItem(ROLL_KEY(seed), String(next)); } catch { /* falls back to in-memory */ }
    setRoll(next);
    window.dispatchEvent(new Event(EVENT));
  }, [seed]);

  const markSeen = useCallback(() => {
    try { localStorage.setItem(SEEN_KEY(seed), '1'); } catch { /* shown again next time; harmless */ }
    setSeen(true);
    window.dispatchEvent(new Event(EVENT));
  }, [seed]);

  return { seed, handle: cyberHandle(seed, roll), reroll, seen, markSeen };
}
