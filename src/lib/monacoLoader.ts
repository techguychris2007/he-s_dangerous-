import { loader } from '@monaco-editor/react';

// Same CDN, same pinned version, used by both the Code Portal's CodeEditor and the Build Portal's
// MonacoProjectEditor — centralized here so loader.config() is only ever called once (calling it
// again after loader.init() has already started is a no-op the library warns about, harmless but
// noisy) and so both portals can share one preload entry point below.
//
// Not bundled deliberately: Monaco's core + language workers is ~5MB, and bundling it would force
// every visitor's PWA install to download it, including everyone who never opens either portal.
// Loaded from jsDelivr instead, and cached after first use — see vite.config.ts's
// `monaco-editor-runtime` runtimeCaching rule — so it only ever costs real time on that first load.
const VS_PATH = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs';

let configured = false;
function configureOnce(): void {
  if (configured) return;
  configured = true;
  loader.config({ paths: { vs: VS_PATH } });
}

// Applied the moment this module is first imported — by either editor component, or by a portal's
// list page calling preloadMonaco() below — so every import path guarantees config happens before
// any <Editor> mounts, without every caller needing to remember to call configureOnce() itself.
configureOnce();

/** Starts fetching/initializing Monaco in the background, before any <Editor> actually mounts. Call
 *  this as early as possible — e.g. when a portal's task-list page mounts, well before the learner
 *  clicks into a specific task — so that "first load" cost (see above) is paid while they're still
 *  browsing the list instead of starting only once they open a task and are staring at a loading
 *  editor. loader.init() returns the same shared promise on every call, so calling this from both
 *  portals' list pages, or calling it here and then mounting <Editor> later, never triggers a second
 *  fetch. Safe to call and forget — errors (e.g. fully offline on a first-ever visit) are left for the
 *  editor's own loading/error UI to surface, not this function's problem. */
export function preloadMonaco(): void {
  configureOnce();
  void loader.init().catch(() => {
    // Swallowed deliberately: a failed preload just means the editor's own <Editor loading=.../>
    // state (and loader.init() rejection there) handles it when the learner actually opens a task.
  });
}
