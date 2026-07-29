import type { RunResult } from './runResult';

export type { RunResult };

const HARD_TIMEOUT_MS = 5000;

/** Runs JavaScript source in a fresh Worker and resolves with captured console output — never
 *  throws. Plain JS has no cooperative timeout like JSCPP's `maxTimeout`, so an infinite loop is
 *  only ever stopped by this hard timeout terminating the worker outright. */
export function runJs(code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./jsWorker.ts', import.meta.url), { type: 'module' });
    let settled = false;

    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ stdout: '', stderr: 'Timed out (possible infinite loop).', ok: false });
    }, HARD_TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent<RunResult>) => finish(e.data);
    worker.onerror = (e) => {
      finish({ stdout: '', stderr: e.message || 'Worker error', ok: false });
    };

    worker.postMessage({ code });
  });
}
