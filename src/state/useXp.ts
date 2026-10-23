import { useEffect, useState } from 'react';
import type * as XpModule from '../data/xp';

let cached: typeof XpModule | null = null;
let pending: Promise<typeof XpModule> | null = null;

/** Lazily loads src/data/xp.ts for always-mounted shell components (TopBar HUD, XP toasts). xp.ts needs
 *  the whole lab catalog to score flags, and a static import from the shell would pull that catalog into
 *  the main bundle — the same reason useLabsData exists. Returns null until the chunk arrives. */
export function useXpModule(): typeof XpModule | null {
  const [mod, setMod] = useState<typeof XpModule | null>(cached);
  useEffect(() => {
    if (cached) return;
    let alive = true;
    pending ??= import('../data/xp').then((m) => (cached = m));
    pending.then((m) => { if (alive) setMod(m); }).catch(() => { pending = null; });
    return () => { alive = false; };
  }, []);
  return mod;
}
