/** Runs a learner's JavaScript inside a dedicated Worker — isolated from the page (no DOM access,
 *  can't touch app state) and killable if it hangs. console.log/error are captured instead of
 *  going to the real devtools console. */
import type { RunResult } from './runResult';

self.onmessage = (e: MessageEvent<{ code: string }>) => {
  const { code } = e.data;
  let stdout = '';
  const log = (...args: unknown[]) => {
    stdout += args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n';
  };
  globalThis.console = { ...console, log, error: log, warn: log, info: log } as Console;

  let result: RunResult;
  try {
    const fn = new Function(code);
    fn();
    result = { stdout, stderr: '', ok: true };
  } catch (err) {
    result = { stdout, stderr: err instanceof Error ? `${err.name}: ${err.message}` : String(err), ok: false };
  }
  (self as unknown as Worker).postMessage(result);
};
