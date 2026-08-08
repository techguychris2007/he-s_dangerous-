import { runJs } from './jsRunner';
import { bundleCommonJs } from './jsModuleBundler';
import type { RunResult } from './runResult';
import type { ProjectFile } from '../labs/projectTypes';

/** Backend/Node-flavored multi-file JS: bundle to one CommonJS-registry script, hand it to the
 *  existing, completely unchanged `runJs()` (still a Worker running `new Function(code)`, still no
 *  DOM — that's the deliberate difference from the 'dom' target kind in domRunner.ts). */
export async function runJsProject(files: ProjectFile[], entryPath: string, testCode?: string): Promise<RunResult> {
  let entry = entryPath;
  let runFiles = files;
  if (testCode !== undefined) {
    // The injected test file's require('./routes') is resolved relative to ITS OWN directory (see
    // __dw_resolve__ in jsModuleBundler.ts) — placing it at a flat root path broke every fullstack
    // task whose entry lives under a subdirectory (e.g. backend/routes.js), since './routes' from
    // the root doesn't reach backend/routes.js. Mounting the test file alongside the real entry,
    // in the same directory, keeps relative requires correct regardless of nesting depth.
    const lastSlash = entryPath.lastIndexOf('/');
    const dir = lastSlash === -1 ? '' : entryPath.slice(0, lastSlash + 1);
    entry = `${dir}__dw_test__.js`;
    runFiles = [...files, { path: entry, content: testCode, language: 'javascript' as const, editable: false }];
  }
  const bundled = bundleCommonJs(runFiles, entry);
  return runJs(bundled);
}
