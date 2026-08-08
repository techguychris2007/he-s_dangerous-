import { getPyodide } from './pyodideRunner';
import type { RunResult } from './runResult';
import type { ProjectFile } from '../labs/projectTypes';

// Every run gets a fresh root directory — necessary but NOT sufficient on its own. Pyodide's
// interpreter is a cached singleton shared across every run this session, so a plain re-run of the
// same entry path would silently execute last run's bytecode for any file the learner edited that
// isn't the entry itself, purely because Python caches modules by NAME in sys.modules, not by path.
// The bootstrap script below also explicitly purges any previously-imported module whose __file__
// lives under /dw/run before each run — skipping that step is the single most likely way this
// runner could grade a learner's OLD code without either of them noticing.
let runCounter = 0;

const BOOTSTRAP = `
import sys as __dw_sys, runpy as __dw_runpy, importlib as __dw_importlib

__dw_dir_list = list(__dw_dirs__)
for __dw_d in __dw_dir_list:
    if __dw_d not in __dw_sys.path:
        __dw_sys.path.insert(0, __dw_d)

for __dw_name, __dw_mod in list(__dw_sys.modules.items()):
    __dw_f = getattr(__dw_mod, '__file__', None)
    if __dw_f and __dw_f.startswith(__dw_base__):
        del __dw_sys.modules[__dw_name]
__dw_importlib.invalidate_caches()

try:
    __dw_runpy.run_path(__dw_entry_path__, run_name='__main__')
finally:
    for __dw_d in __dw_dir_list:
        if __dw_d in __dw_sys.path:
            __dw_sys.path.remove(__dw_d)
`;

function dirname(path: string): string {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i);
}

/** Mounts a project's files into Pyodide's real virtual filesystem, runs one entry point (the
 *  project's own entry for a plain "Run", or an injected __dw_test__.py for "Run tests" — same
 *  role `testCode` plays in the single-file runner, just as a file instead of a concatenated string),
 *  and tears the mount down afterward. `entryPath` and every file path are relative, no leading slash. */
export async function runPythonProject(files: ProjectFile[], entryPath: string, testCode?: string): Promise<RunResult> {
  const pyodide = await getPyodide();
  const root = `/dw/run${++runCounter}`;
  let stdout = '';
  let stderr = '';
  pyodide.setStdout({ batched: (msg) => { stdout += msg + '\n'; } });
  pyodide.setStderr({ batched: (msg) => { stderr += msg + '\n'; } });

  const runFiles = testCode !== undefined ? [...files, { path: '__dw_test__.py', content: testCode }] : files;
  const entry = testCode !== undefined ? '__dw_test__.py' : entryPath;
  const writtenPaths: string[] = [];
  const dirs = new Set<string>([root]);

  try {
    pyodide.FS.mkdirTree(root);
    for (const f of runFiles) {
      const fullPath = `${root}/${f.path}`;
      const dir = dirname(fullPath);
      if (!pyodide.FS.analyzePath(dir).exists) pyodide.FS.mkdirTree(dir);
      dirs.add(dir);
      pyodide.FS.writeFile(fullPath, f.content, { encoding: 'utf8' });
      writtenPaths.push(fullPath);
    }

    // A non-entry file's own `import numpy` etc. still needs the package loaded — Pyodide only scans
    // whatever source string it's given, so every file's content (not just the entry's) has to be
    // scanned or a perfectly valid multi-file import silently raises ModuleNotFoundError.
    await pyodide.loadPackagesFromImports(runFiles.map((f) => f.content).join('\n'));

    // Deliberately the stable /dw prefix shared by every run, not this run's own fresh root — a
    // stale module imported under a PREVIOUS run's root (e.g. /dw/run1/contacts.py) must still be
    // purged even though this run's root is /dw/run2. Scoping the purge to only the current root
    // would never match anything, since the root always increments before every run.
    pyodide.globals.set('__dw_base__', '/dw');
    pyodide.globals.set('__dw_entry_path__', `${root}/${entry}`);
    pyodide.globals.set('__dw_dirs__', [...dirs]);

    await pyodide.runPythonAsync(BOOTSTRAP);
    return { stdout, stderr, ok: true };
  } catch (err) {
    return { stdout, stderr: stderr + (err instanceof Error ? err.message : String(err)), ok: false };
  } finally {
    for (const p of writtenPaths) {
      try { pyodide.FS.unlink(p); } catch { /* best-effort cleanup — a leaked file from a crashed run isn't worth failing over */ }
    }
  }
}
