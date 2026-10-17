import { useEffect, useState } from 'react';
import type * as LabsModule from '../data/labs';

let cached: typeof LabsModule | null = null;
let pending: Promise<typeof LabsModule> | null = null;
const RETRY_EVENT = 'darkworld:retry-labs';

export function retryLabsData() {
  window.dispatchEvent(new Event(RETRY_EVENT));
}

/** Lazily loads src/data/labs.ts — which statically imports every scenario pack (100+ files, ~2.5MB
 *  of scenario content: network topologies, filesystem trees, objectives, hints, full solutions) —
 *  via dynamic import() instead of a static one.
 *
 *  Why this exists: Sidebar, TopBar, and Companion are part of the always-mounted app shell (rendered
 *  on every route, not behind any lazy route boundary), and each only needs a handful of scalar fields
 *  off LabEntry (id, title, totalFlags) for nav badges/breadcrumbs/toasts — never the heavy scenario
 *  bodies. A static `import { LABS } from '../../data/labs'` in any of them still pulls the ENTIRE
 *  module graph into the eagerly-evaluated shell bundle, because bundlers split by module boundary,
 *  not by which fields of an object are actually read at runtime. Routing the import through here
 *  instead moves that whole module graph into its own async chunk, so the shell's own bundle stays
 *  small and fast to parse/evaluate, and the labs chunk loads in parallel rather than blocking it.
 *
 *  Multiple callers share one underlying fetch — the `pending` promise (and the module system's own
 *  cache) dedupe concurrent import() calls to the same specifier, so mounting Sidebar + TopBar +
 *  Companion together triggers exactly one network fetch, not three. */
export function useLabsData(): typeof LabsModule | null {
  const [mod, setMod] = useState<typeof LabsModule | null>(cached);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (cached) { setMod(cached); return; }
      if (!pending) pending = import('../data/labs');
      pending.then(m => {
        cached = m;
        if (!cancelled) setMod(m);
      }).catch(() => { pending = null; });
    };
    load();
    window.addEventListener('online', load);
    window.addEventListener(RETRY_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener('online', load);
      window.removeEventListener(RETRY_EVENT, load);
    };
  }, []);
  return mod;
}
