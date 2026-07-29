/** Runs inside a dedicated Worker so a student's infinite loop or runaway recursion can only hang
 *  this worker thread (killable via terminate()) and never the page itself. JSCPP is a pure-JS,
 *  simplified C++ interpreter — no compiler, no network fetch, bundled with the app. */
import JSCPP from 'JSCPP';
import type { RunResult } from './runResult';

const MAX_TIMEOUT_MS = 5000;

self.onmessage = (e: MessageEvent<{ code: string }>) => {
  const { code } = e.data;
  let stdout = '';
  let result: RunResult;
  try {
    JSCPP.run(code, '', {
      stdio: { write: (s) => { stdout += s; } },
      unsigned_overflow: 'error',
      maxTimeout: MAX_TIMEOUT_MS,
    });
    result = { stdout, stderr: '', ok: true };
  } catch (err) {
    result = { stdout, stderr: err instanceof Error ? err.message : String(err), ok: false };
  }
  (self as unknown as Worker).postMessage(result);
};
