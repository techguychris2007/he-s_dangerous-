/** Loads real CPython-in-WebAssembly (Pyodide) from a CDN the first time a learner runs Python code,
 *  then reuses the same in-memory interpreter for every subsequent run this session. Deliberately NOT
 *  bundled/precached with the rest of the app — it's a ~10-20MB runtime, and the whole point of the
 *  PWA's offline story is that everything else stays instant and small. Running Python code requires
 *  being online the first time; the browser's own HTTP cache (plus a runtime-caching rule in
 *  vite.config.ts) keeps it usable offline after that. */

const PYODIDE_VERSION = '314.0.3';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
  /** Scans source for `import x` statements and loads any matching Pyodide packages (numpy, pandas,
   *  ...) that aren't already installed. Unlike CPython, Pyodide does NOT do this automatically on
   *  `import` — every package needs an explicit load first, or the import raises ModuleNotFoundError. */
  loadPackagesFromImports: (code: string) => Promise<void>;
  /** The interpreter's global namespace, exposed so JS can hand it a Python value (here: the
   *  learner's source as a real Python str) without going through string interpolation/escaping. */
  globals: { set: (name: string, value: unknown) => void };
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

let pyodidePromise: Promise<PyodideInterface> | null = null;
let booted = false;

/** Whether the Python runtime has already finished loading this session — lets the UI show a
 *  "downloading the runtime, first run only" message just once instead of on every run. */
export function isPyodideBooted(): boolean {
  return booted;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-pyodide-loader="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.dataset.pyodideLoader = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the Python runtime — check your internet connection and try again.'));
    document.head.appendChild(script);
  });
}

/** Resolves once Pyodide is loaded and ready; the same promise is returned to every caller so the
 *  ~10-20MB runtime is only ever fetched and initialized once per page session. */
export function getPyodide(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${PYODIDE_BASE}pyodide.js`);
      if (!window.loadPyodide) throw new Error('Python runtime failed to initialize.');
      const instance = await window.loadPyodide({ indexURL: PYODIDE_BASE });
      booted = true;
      return instance;
    })();
  }
  return pyodidePromise;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  /** false if the code raised an uncaught exception (stderr will contain the traceback either way) */
  ok: boolean;
}

/** Runs Python source and captures everything printed to stdout/stderr — never throws; a failure
 *  (bad code, import of something unsupported in the sandbox, etc.) comes back as `ok: false` with
 *  the error text in `stderr` so the caller can render it inline instead of crashing the page. */
export async function runPython(code: string): Promise<RunResult> {
  const pyodide = await getPyodide();
  let stdout = '';
  let stderr = '';
  // Pyodide's "batched" callback delivers one complete line per call with the trailing newline
  // already stripped — without adding it back, consecutive print()s run together with no separator
  // at all (e.g. "expected False__RESULT__ 0/9"), which also broke the Code Portal's own last-line
  // result-line detection, not just readability.
  pyodide.setStdout({ batched: (msg) => { stdout += msg + '\n'; } });
  pyodide.setStderr({ batched: (msg) => { stderr += msg + '\n'; } });
  try {
    await pyodide.loadPackagesFromImports(code);
    await pyodide.runPythonAsync(code);
    return { stdout, stderr, ok: true };
  } catch (err) {
    return { stdout, stderr: stderr + (err instanceof Error ? err.message : String(err)), ok: false };
  }
}

export interface TraceStep {
  /** 1-based source line about to execute (matches the learner's own editor line numbers). */
  line: number;
  /** Local variables visible at this point, already repr()'d Python-side (truncated if huge). */
  locals: Record<string, string>;
}

export interface TracedRunResult extends RunResult {
  steps: TraceStep[];
  /** True if tracing stopped early because the step cap was hit (almost always an infinite loop),
   *  as opposed to the code simply finishing or raising a normal exception. */
  stepLimitHit: boolean;
}

const TRACE_STEP_LIMIT = 3000;

/** Installs a real `sys.settrace` line tracer scoped to only the learner's own compiled module
 *  (co_filename == "<usercode>") — library/stdlib internals never get traced, but calls into the
 *  learner's own functions do, since those share the same compiled filename. Every 'line' event
 *  snapshots the current line number and a repr() of each local, capped at TRACE_STEP_LIMIT steps
 *  so a genuine infinite loop can't hang the tab. */
const TRACE_HARNESS = `
import sys as __sys__, json as __json__

__trace_steps__ = []
__step_limit_hit__ = [False]

def __tracer__(frame, event, arg):
    if frame.f_code.co_filename != "<usercode>":
        return None
    if event == 'line':
        if len(__trace_steps__) >= ${TRACE_STEP_LIMIT}:
            __step_limit_hit__[0] = True
            __sys__.settrace(None)
            raise RuntimeError("Step limit (${TRACE_STEP_LIMIT}) reached — this usually means an infinite loop. Trace stopped early.")
        snap = {}
        for k, v in list(frame.f_locals.items()):
            if k.startswith('__'):
                continue
            try:
                r = repr(v)
            except Exception:
                r = '<unrepresentable>'
            if len(r) > 200:
                r = r[:200] + '…'
            snap[k] = r
        __trace_steps__.append({'line': frame.f_lineno, 'locals': snap})
    return __tracer__

__sys__.settrace(__tracer__)
try:
    exec(compile(__user_code__, "<usercode>", "exec"), {'__name__': '__main__'})
finally:
    __sys__.settrace(None)

__json__.dumps({'steps': __trace_steps__, 'stepLimitHit': __step_limit_hit__[0]})
`;

/** Same execution model as runPython, but also returns a full line-by-line trace of the run: every
 *  line the interpreter actually executed, with a snapshot of local variables at that point — real
 *  CPython trace data, not a simulated re-interpretation of the source. Used by the Code Portal's
 *  step-through debugger view. */
export async function runPythonTraced(code: string): Promise<TracedRunResult> {
  const pyodide = await getPyodide();
  let stdout = '';
  let stderr = '';
  // Pyodide's "batched" callback delivers one complete line per call with the trailing newline
  // already stripped — without adding it back, consecutive print()s run together with no separator
  // at all (e.g. "expected False__RESULT__ 0/9"), which also broke the Code Portal's own last-line
  // result-line detection, not just readability.
  pyodide.setStdout({ batched: (msg) => { stdout += msg + '\n'; } });
  pyodide.setStderr({ batched: (msg) => { stderr += msg + '\n'; } });
  pyodide.globals.set('__user_code__', code);
  try {
    await pyodide.loadPackagesFromImports(code);
    const raw = await pyodide.runPythonAsync(TRACE_HARNESS);
    const parsed = JSON.parse(raw as string) as { steps: TraceStep[]; stepLimitHit: boolean };
    return { stdout, stderr, ok: true, steps: parsed.steps, stepLimitHit: parsed.stepLimitHit };
  } catch (err) {
    // The exec() raised (a real bug in the learner's code, or our own step-limit guard above) —
    // __trace_steps__ still lives in the interpreter's globals, so pull out whatever was captured
    // before the failure instead of throwing away a partial trace that's exactly what a debugger
    // is for: showing the learner where things went wrong.
    let steps: TraceStep[] = [];
    let stepLimitHit = false;
    try {
      const raw = await pyodide.runPythonAsync("__json__.dumps({'steps': __trace_steps__, 'stepLimitHit': __step_limit_hit__[0]})");
      const parsed = JSON.parse(raw as string) as { steps: TraceStep[]; stepLimitHit: boolean };
      steps = parsed.steps;
      stepLimitHit = parsed.stepLimitHit;
    } catch {
      // Nothing usable was captured (e.g. a syntax error before tracing even started) — steps stays empty.
    }
    return { stdout, stderr: stderr + (err instanceof Error ? err.message : String(err)), ok: false, steps, stepLimitHit };
  }
}
