import type { RunResult } from './runResult';
import type { ProjectFile } from '../labs/projectTypes';

const HARD_TIMEOUT_MS = 15_000;

/** Runs a SQL project target in a fresh Worker (fresh database every run) and never throws. */
export function runSqlProject(files: ProjectFile[], entry: string, testCode?: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./sqlWorker.ts', import.meta.url), { type: 'module' });
    let settled = false;
    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };
    const timer = setTimeout(() => finish({ stdout: '', stderr: 'Timed out after 15 seconds.', ok: false }), HARD_TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<RunResult>) => finish(e.data);
    worker.onerror = (e) => finish({ stdout: '', stderr: e.message || 'SQL worker error', ok: false });
    worker.postMessage({
      files: files.filter(f => f.path.endsWith('.sql')).map(({ path, content }) => ({ path, content })),
      entry,
      testCode,
    });
  });
}
