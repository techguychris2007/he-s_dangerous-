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
  pyodide.setStdout({ batched: (msg) => { stdout += msg; } });
  pyodide.setStderr({ batched: (msg) => { stderr += msg; } });
  try {
    await pyodide.runPythonAsync(code);
    return { stdout, stderr, ok: true };
  } catch (err) {
    return { stdout, stderr: stderr + (err instanceof Error ? err.message : String(err)), ok: false };
  }
}
