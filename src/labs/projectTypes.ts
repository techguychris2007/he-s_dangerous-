import type { CodeDifficulty } from './codeTypes';

/** The Build Portal's three languages — deliberately narrower than a general-purpose IDE would
 *  support, matching exactly what the three project runners (Pyodide, the CommonJS bundler + Worker,
 *  JSCPP) can actually execute. */
export type SeLanguage = 'python' | 'javascript' | 'cpp';

/** Python/JS get all three; C++ has no realistic frontend/full-stack story (see cppProjectRunner.ts's
 *  header comment for why), so it uses 'systems' instead of 'fullstack'. */
export type SeTrack = 'foundations' | 'backend' | 'fullstack' | 'systems';

/** What a file's contents actually are, independent of which SeLanguage the task belongs to — a
 *  full-stack Python task still has .html/.css/.js files for its frontend half. Drives both Monaco's
 *  per-model language mode and (for html/css/js) the DOM runner's file-type routing. */
export type FileLanguage =
  | 'python' | 'javascript' | 'typescript' | 'html' | 'css'
  | 'json' | 'cpp' | 'markdown' | 'sql' | 'plaintext';

export interface ProjectFile {
  /** POSIX-style, no leading slash — e.g. 'backend/models.py', 'index.html'. Must be unique within
   *  a task's files[]/solutionFiles[] (same paths, different contents). */
  path: string;
  content: string;
  language: FileLanguage;
  /** false = a fixed/given file (e.g. a data fixture) the learner can read but never needs to edit;
   *  the file tree still shows it, Monaco just opens it read-only. */
  editable: boolean;
}

/** Which runtime a RunTarget executes against. Distinct from SeLanguage because one 'fullstack' task
 *  needs two targets of two different kinds (its backend half runs as 'python'/'node-js', its frontend
 *  half runs as 'dom') — the task's language is really "what the learner is principally writing," not
 *  "what single engine grades it." */
export type RunTargetKind = 'python' | 'node-js' | 'dom' | 'cpp';

export interface RunTarget {
  /** stable within the task, e.g. 'backend' | 'frontend' | 'main' — shown as the Run-tests button label
   *  suffix and used to key per-target result state. */
  id: string;
  label: string;
  kind: RunTargetKind;
  /** path into files[]/solutionFiles[] this target's plain "Run" (no tests) executes. */
  entry: string;
  /** appended/injected at run time exactly like CodeTask.testCode — never rendered as a file, never
   *  editable. Same [PASS]/[FAIL] + __RESULT__ N/M convention every existing runner already produces. */
  testCode: string;
  /** dom targets only: extra settle time (ms) after the document reaches 'complete' before assertions
   *  run, for tasks whose init code schedules a timer/microtask. Defaults applied by domRunner.ts. */
  settleMs?: number;
  /** dom targets only: stubs window.fetch(url) with these fixed responses, standing in for the
   *  companion backend target this frontend can't actually reach over a real socket. Keyed by the
   *  exact URL string the learner's code is expected to fetch. */
  fetchFixtures?: Record<string, unknown>;
}

export interface ProjectTask {
  id: string;
  title: string;
  difficulty: CodeDifficulty;
  language: SeLanguage;
  track: SeTrack;
  /** groups tasks within a language+track's catalog, e.g. "Language Core", "HTTP & Routing" */
  category: string;
  tags?: string[];
  /** the problem statement — what the project does and why it's built the way it's built */
  prompt: string;
  hints: string[];
  /** pre-filled starter project — TODOs/stubs, matching editable: true files */
  files: ProjectFile[];
  /** a complete, working reference implementation of every file — graded by SeVerifyPage, never run
   *  automatically, revealed to the learner on demand exactly like CodeTask.solution. */
  solutionFiles: ProjectFile[];
  /** 1 target for foundations/backend/systems tasks, 2 (one 'python'|'node-js', one 'dom') for
   *  fullstack tasks. completeCodeTask() only fires once every target reports __RESULT__ N/N. */
  targets: RunTarget[];
}

const EXTENSION_LANGUAGE: Record<string, FileLanguage> = {
  py: 'python',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  html: 'html', htm: 'html',
  css: 'css',
  json: 'json',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', h: 'cpp', hpp: 'cpp',
  md: 'markdown',
  sql: 'sql',
};

/** Infers a file's language from its extension, so task authoring can omit `language` on most files.
 *  Falls back to 'plaintext' for anything unrecognized rather than guessing wrong. */
export function languageForPath(path: string): FileLanguage {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_LANGUAGE[ext] ?? 'plaintext';
}

/** Authoring helper — build a ProjectFile with `language` inferred from `path` unless overridden. */
export function pf(path: string, content: string, opts?: { editable?: boolean; language?: FileLanguage }): ProjectFile {
  return {
    path,
    content,
    editable: opts?.editable ?? true,
    language: opts?.language ?? languageForPath(path),
  };
}
