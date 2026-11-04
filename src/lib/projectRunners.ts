import type { RunResult } from './runResult';
import type { ProjectFile, RunTarget, RunTargetKind } from '../labs/projectTypes';
import { runPythonProject } from './pyodideProjectRunner';
import { runJsProject } from './jsProjectRunner';
import { runCppProject } from './cppProjectRunner';
import { runCSharpProject } from './csharpRunner';
import { runSqlProject } from './sqlRunner';
import { runDomProject } from './domRunner';
import { runTypeScriptProject, runReactProject } from './tsRunner';

type ProjectRunFn = (files: ProjectFile[], target: RunTarget, withTests: boolean) => Promise<RunResult>;

/** One dispatch map for every RunTargetKind, mirroring the existing single-file RUNNERS map in
 *  CodeConsole.tsx. `withTests` selects between a plain "Run" (executes target.entry as-is) and
 *  "Run tests" (executes target.testCode instead) — same two-button model the single-file console
 *  already uses, just per-target instead of per-task. */
export const RUN_TARGET_RUNNERS: Record<RunTargetKind, ProjectRunFn> = {
  python: (files, target, withTests) => runPythonProject(files, target.entry, withTests ? target.testCode : undefined),
  'node-js': (files, target, withTests) => runJsProject(files, target.entry, withTests ? target.testCode : undefined),
  cpp: (files, target, withTests) => runCppProject(files, target.entry, withTests ? target.testCode : undefined),
  csharp: (files, target, withTests) => runCSharpProject(files, target.entry, withTests ? target.testCode : undefined),
  sql: (files, target, withTests) => runSqlProject(files, target.entry, withTests ? target.testCode : undefined),
  typescript: (files, target, withTests) => runTypeScriptProject(files, target.entry, withTests ? target.testCode : undefined),
  // A plain "Run" renders the app in preview mode and reports its console output and type errors.
  react: (files, target, withTests) => runReactProject(files, target, withTests),
  // A plain "Run" on a dom target is a no-op here — DomPreviewPane renders the live page directly
  // from files/target.entry instead of going through this runner, since there's nothing to execute
  // and capture as stdout/stderr for a page with no assertions attached.
  dom: (files, target, withTests) =>
    withTests
      ? runDomProject(files, target)
      : Promise.resolve({ stdout: '(no output — use the preview pane to see this page, or "Run tests" to grade it)', stderr: '', ok: true }),
};
