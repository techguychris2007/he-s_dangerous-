/** After a deploy, a tab that is still running the previous build asks for page chunks the new build
 *  no longer has, and the page fails with "This page needs a fresh start". Vite reports this as a
 *  `vite:preloadError` event; reloading fetches the current build, which has the chunk.
 *
 *  The reload happens at most once a minute per tab, so a chunk that is genuinely missing (or a
 *  network that keeps failing) shows the error page instead of reloading forever. */
const RELOADED_AT = 'darkworld.staleBuildReloadAt';
const RETRY_AFTER_MS = 60_000;

export function shouldReloadForStaleBuild(lastReloadAt: number | null, now: number): boolean {
  return lastReloadAt === null || now - lastReloadAt > RETRY_AFTER_MS;
}

export function recoverFromStaleBuilds(): void {
  window.addEventListener('vite:preloadError', () => {
    let last: number | null = null;
    try {
      const stored = sessionStorage.getItem(RELOADED_AT);
      last = stored ? Number(stored) : null;
    } catch {
      return; // without storage there is no loop guard, so leave it to the error page
    }
    const now = Date.now();
    if (!shouldReloadForStaleBuild(last, now)) return;
    try { sessionStorage.setItem(RELOADED_AT, String(now)); } catch { return; }
    window.location.reload();
  });
}
