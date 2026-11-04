/** Runs compiled (non-DOM) TypeScript in a throwaway Worker: loads the Vitest-compatible test kit,
 *  evaluates the CommonJS bundle, then either runs the registered tests or waits for the program's
 *  output to go quiet. tsRunner.ts terminates this worker on timeout, which is the only reliable way
 *  to stop an infinite loop. */

interface ExecRequest {
  base: string;
  code: string;
  mode: 'test' | 'run';
  prelude: string[];
  preludePassed: number;
  preludeTotal: number;
  projectFiles: Record<string, string>;
}

const QUIET_MS = 700;
const MAX_RUN_MS = 4000;

self.onmessage = async (e: MessageEvent<ExecRequest>) => {
  const { base, code, mode, prelude, preludePassed, preludeTotal, projectFiles } = e.data;
  (globalThis as unknown as { __dw_project_files__: Record<string, string> }).__dw_project_files__ = projectFiles;
  const out: string[] = [];
  let lastOutput = Date.now();
  const show = (a: unknown) => {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return `${a.name}: ${a.message}`;
    try { return JSON.stringify(a); } catch { return String(a); }
  };
  const log = (...args: unknown[]) => { out.push(args.map(show).join(' ')); lastOutput = Date.now(); };
  globalThis.console = { ...console, log, info: log, warn: log, error: log, debug: log } as Console;
  self.addEventListener('unhandledrejection', (ev) => {
    const reason = (ev as PromiseRejectionEvent).reason;
    log(`[unhandled rejection] ${reason instanceof Error ? reason.message : String(reason)}`);
  });

  try {
    const kit = await fetch(new URL('ts-runtime/testkit.js', base)).then((r) => r.text());
    (0, eval)(kit);
  } catch (error) {
    self.postMessage({ stdout: '', stderr: `Could not load the test kit: ${error instanceof Error ? error.message : String(error)}`, ok: false });
    return;
  }

  let loadError: string | null = null;
  try {
    new Function(code)();
  } catch (error) {
    loadError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  if (mode === 'run') {
    // Let async work (awaited timers, promises) finish: stop once output has been quiet for a moment.
    const started = Date.now();
    while (!loadError && Date.now() - started < MAX_RUN_MS && Date.now() - lastOutput < QUIET_MS) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!loadError) await new Promise((r) => setTimeout(r, 50));
    self.postMessage({ stdout: [...prelude, ...out].join('\n'), stderr: loadError ?? '', ok: !loadError });
    return;
  }

  const lines = [...prelude];
  if (loadError) {
    lines.push(...out, `[FAIL] Test file failed to load: ${loadError}`, `__RESULT__ ${preludePassed}/${preludeTotal + 1}`);
    self.postMessage({ stdout: lines.join('\n'), stderr: '', ok: true });
    return;
  }
  const runTests = (globalThis as unknown as { __dw_runTests: (report: (l: string) => void) => Promise<{ passed: number; total: number }> }).__dw_runTests;
  const r = await runTests((line) => out.push(line));
  lines.push(...out);
  let total = preludeTotal + r.total;
  if (r.total === 0) { lines.push('[FAIL] No tests ran'); total += 1; }
  lines.push(`__RESULT__ ${preludePassed + r.passed}/${total}`);
  self.postMessage({ stdout: lines.join('\n'), stderr: '', ok: true });
};
