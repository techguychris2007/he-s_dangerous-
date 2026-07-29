import type { RunResult } from './runResult';

export type { RunResult };

const HARD_TIMEOUT_MS = 8000; // backstop above the worker's own 5s cooperative maxTimeout

/** Runs C++ source in a fresh Worker (via JSCPP) and resolves with captured stdout/stderr —
 *  never throws. A fresh worker per run keeps state from one run leaking into the next; the
 *  hard timeout guards against the rare case where the interpreter's own maxTimeout doesn't
 *  catch a runaway (e.g. stuck outside the interpreter loop). */
export function runCpp(code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./cppWorker.ts', import.meta.url), { type: 'module' });
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
