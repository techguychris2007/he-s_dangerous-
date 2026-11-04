import type { RunResult } from './runResult';
import { languageForPath, type ProjectFile, type RunTarget } from '../labs/projectTypes';
import { bundleCommonJs } from './jsModuleBundler';
import { buildReactDocument, REACT_SANDBOX } from './reactHarness';
import { isTsSource, jsPathFor, typeCheckReport, formatDiagnostic, type TsCompileResult, type TsSource } from './tsCompile';

export type { RunResult };

/** First use downloads the compiler (~1 MB compressed) and type libraries; later compiles take
 *  tens of milliseconds. */
const LOAD_TIMEOUT_MS = 120_000;
const COMPILE_TIMEOUT_MS = 20_000;
const EXEC_TIMEOUT_MS = 10_000;
const REACT_TIMEOUT_MS = 20_000;

/** Test files are mounted beside the target's entry under this name, so the tests' relative
 *  imports ('./api', './App') resolve exactly as they would in a real project. */
export const GRADER_TEST_BASENAME = 'grader.test';

interface CompileReply { id: number; ready?: boolean; result?: TsCompileResult; error?: string }

let worker: Worker | null = null;
let ready = false;
let nextId = 1;
const pending = new Map<number, (reply: CompileReply) => void>();

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./tsWorker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<CompileReply>) => {
    pending.get(e.data.id)?.(e.data);
    pending.delete(e.data.id);
  };
  worker.onerror = (e) => {
    for (const [id, resolve] of pending) resolve({ id, error: e.message || 'The TypeScript compiler stopped unexpectedly.' });
    pending.clear();
    worker?.terminate();
    worker = null;
    ready = false;
  };
  return worker;
}

function send(sources: TsSource[] | undefined, timeoutMs: number): Promise<CompileReply> {
  const id = nextId++;
  const target = ensureWorker();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ id, error: sources ? 'The type check took too long.' : 'The TypeScript compiler took too long to load. Check your connection and try again.' });
    }, timeoutMs);
    pending.set(id, (reply) => { clearTimeout(timer); resolve(reply); });
    target.postMessage({ id, base: document.baseURI, sources });
  });
}

export function isTypeScriptReady(): boolean {
  return ready;
}

/** Starts loading the compiler ahead of the first run (e.g. when a TypeScript task opens). */
export async function preloadTypeScript(): Promise<void> {
  if (ready) return;
  const reply = await send(undefined, LOAD_TIMEOUT_MS);
  ready = Boolean(reply.ready);
}

export async function compileSources(sources: TsSource[]): Promise<TsCompileResult> {
  const reply = await send(sources, ready ? COMPILE_TIMEOUT_MS : LOAD_TIMEOUT_MS + COMPILE_TIMEOUT_MS);
  if (reply.error || !reply.result) throw new Error(reply.error ?? 'The TypeScript compiler returned no result.');
  ready = true;
  return reply.result;
}

let kitText: Promise<string> | null = null;
function reactKit(): Promise<string> {
  kitText ??= fetch(new URL('ts-runtime/react-kit.js', document.baseURI)).then((r) => {
    if (!r.ok) throw new Error(`Could not load the React runtime (HTTP ${r.status}).`);
    return r.text();
  });
  kitText.catch(() => { kitText = null; });
  return kitText;
}

function dirOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i + 1);
}

function toModules(result: TsCompileResult, files: ProjectFile[]): ProjectFile[] {
  const plainJs = files.filter((f) => f.language === 'javascript');
  return [...plainJs, ...result.outputs.map((o) => ({ path: o.path, content: o.content, language: 'javascript' as const, editable: false }))];
}

interface Prepared {
  modules: ProjectFile[];
  entry: string;
  prelude: string[];
  preludePassed: number;
  preludeTotal: number;
  /** every project file by path — configuration graders read Dockerfiles, YAML and .tf through dw:project */
  projectFiles: Record<string, string>;
}

async function prepare(files: ProjectFile[], entryPath: string, testCode: string | undefined, jsx: boolean): Promise<Prepared> {
  const sources: TsSource[] = files.filter((f) => isTsSource(f.path) || f.path.endsWith('.d.ts')).map(({ path, content }) => ({ path, content }));
  let entry = entryPath;
  if (testCode !== undefined) {
    entry = `${dirOf(entryPath)}${GRADER_TEST_BASENAME}.${jsx ? 'tsx' : 'ts'}`;
    sources.push({ path: entry, content: testCode });
  }
  const result = await compileSources(sources);
  const report = typeCheckReport(result.diagnostics);
  const prelude = testCode !== undefined
    ? report.lines
    : result.diagnostics.length ? [`Type errors (the code still ran, but fix these):`, ...result.diagnostics.slice(0, 12).map((d) => `  ${formatDiagnostic(d)}`), ''] : [];
  const projectFiles = Object.fromEntries(files.map((f) => [f.path, f.content]));
  const modules = toModules(result, files);
  // Configuration work (a Dockerfile, a workflow): the only TypeScript is the grader's, so its type
  // check is not one of the learner's checks — unless it fails, which must never pass silently.
  if (testCode !== undefined && report.ok && !learnerWritesTypeScript(files)) {
    return { modules, entry: jsPathFor(entry), prelude: [], preludePassed: 0, preludeTotal: 0, projectFiles };
  }
  return { modules, entry: jsPathFor(entry), prelude, preludePassed: report.ok ? 1 : 0, preludeTotal: 1, projectFiles };
}

export const learnerWritesTypeScript = (files: ProjectFile[]) => files.some((f) => f.editable && isTsSource(f.path));

/** "Run" for a configuration file: show what the parser made of it. */
function inspectorFor(fileName: string): string {
  const name = JSON.stringify(fileName);
  return [
    "import { readFile, parseYaml, parseDockerfile, parseHcl, parseShell } from 'dw:project';",
    `const name = ${name};`,
    'const text = readFile(name);',
    "const base = name.split('/').pop() ?? name;",
    "if (base.startsWith('Dockerfile')) {",
    '  const d = parseDockerfile(text);',
    "  if (d.errors.length) console.log('Problems:\\n  ' + d.errors.join('\\n  '));",
    "  console.log(d.instructions.length + ' instructions in ' + d.stages.length + ' stage(s)');",
    "  for (const s of d.stages) console.log('  stage ' + (s.name ?? s.index) + ': FROM ' + s.image.ref + ' — ' + s.instructions.map((i) => i.instruction).join(', '));",
    "} else if (base.endsWith('.yml') || base.endsWith('.yaml')) {",
    '  const y = parseYaml(text);',
    "  console.log(y.ok ? 'Valid YAML. As data:\\n' + JSON.stringify(y.value, null, 2) : 'YAML error: ' + y.error);",
    "} else if (base.endsWith('.tf')) {",
    '  const h = parseHcl(text);',
    "  console.log(h.ok ? 'Valid HCL. Blocks:\\n  ' + h.value.blocks.map((b) => [b.type, ...b.labels].join(' ')).join('\\n  ') : 'HCL error: ' + h.error);",
    "} else if (base.endsWith('.sh')) {",
    "  for (const c of parseShell(text)) console.log('line ' + c.line + ': ' + c.argv.join(' '));",
    '} else {',
    '  console.log(text);',
    '}',
  ].join('\n');
}

/** Single-file configuration tasks (CodeLanguage 'config'): the learner's file under its real name,
 *  graded by a TypeScript test module that reads it through dw:project. */
export function runConfigSnippet(fileName: string, code: string, testCode: string | null): Promise<RunResult> {
  const files: ProjectFile[] = [
    { path: fileName, content: code, language: languageForPath(fileName), editable: true },
    { path: '__inspect__.ts', content: inspectorFor(fileName), language: 'typescript', editable: false },
  ];
  return runTypeScriptProject(files, '__inspect__.ts', testCode ?? undefined);
}

function execInWorker(code: string, mode: 'test' | 'run', p: Prepared): Promise<RunResult> {
  return new Promise((resolve) => {
    const exec = new Worker(new URL('./tsExecWorker.ts', import.meta.url), { type: 'module' });
    const finish = (r: RunResult) => { clearTimeout(timer); exec.terminate(); resolve(r); };
    const timer = setTimeout(() => finish({ stdout: p.prelude.join('\n'), stderr: `Timed out after ${EXEC_TIMEOUT_MS / 1000} seconds (possible infinite loop, or a promise that never settles).`, ok: false }), EXEC_TIMEOUT_MS);
    exec.onmessage = (e: MessageEvent<RunResult>) => finish(e.data);
    exec.onerror = (e) => finish({ stdout: '', stderr: e.message || 'The program crashed.', ok: false });
    exec.postMessage({ base: document.baseURI, code, mode, prelude: p.prelude, preludePassed: p.preludePassed, preludeTotal: p.preludeTotal, projectFiles: p.projectFiles });
  });
}

/** 'typescript' targets: Node-style TypeScript (no DOM). "Run" executes the entry file; "Run tests"
 *  type-checks the project together with the hidden test file and runs its Vitest-style tests. */
export async function runTypeScriptProject(files: ProjectFile[], entryPath: string, testCode?: string): Promise<RunResult> {
  try {
    const p = await prepare(files, entryPath, testCode, false);
    return execInWorker(bundleCommonJs(p.modules, p.entry), testCode !== undefined ? 'test' : 'run', p);
  } catch (error) {
    return { stdout: '', stderr: error instanceof Error ? error.message : String(error), ok: false };
  }
}

/** Builds the page a React target renders: compiled modules + the React kit, ready for an iframe. */
export async function buildReactPage(files: ProjectFile[], entryPath: string, testCode: string | undefined, nonce: string): Promise<{ html: string; prepared: Prepared }> {
  const [p, kit] = await Promise.all([prepare(files, entryPath, testCode, true), reactKit()]);
  const html = buildReactDocument({
    kitScript: kit,
    bundle: bundleCommonJs(p.modules, p.entry),
    styles: files.filter((f) => f.language === 'css').map((f) => f.content),
    mode: testCode !== undefined ? 'test' : 'preview',
    nonce,
    preludeLines: p.prelude,
    preludePassed: p.preludePassed,
    preludeTotal: p.preludeTotal,
  });
  return { html, prepared: p };
}

/** 'react' targets. Sandboxed like domRunner.ts — never `allow-same-origin`, so the frame is
 *  opaque-origin and cannot reach this app's storage or session — plus `allow-forms` so form submit
 *  events fire (the document's CSP form-action 'none' stops any real submission). */
export async function runReactProject(files: ProjectFile[], target: RunTarget, withTests: boolean): Promise<RunResult> {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let page: { html: string; prepared: Prepared };
  try {
    page = await buildReactPage(files, target.entry, withTests ? target.testCode : undefined, nonce);
  } catch (error) {
    return { stdout: '', stderr: error instanceof Error ? error.message : String(error), ok: false };
  }
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', REACT_SANDBOX); // never add allow-same-origin
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    Object.assign(iframe.style, { position: 'fixed', top: '-10000px', left: '-10000px', width: '1024px', height: '768px', border: '0' });
    let settled = false;
    const finish = (r: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      iframe.remove();
      resolve(r);
    };
    const timer = setTimeout(() => finish({ stdout: page.prepared.prelude.join('\n'), stderr: `Timed out after ${REACT_TIMEOUT_MS / 1000} seconds (possible infinite render loop, or a test waiting for something that never appears).`, ok: false }), REACT_TIMEOUT_MS);
    function onMessage(e: MessageEvent) {
      const data = e.data as { __dw?: string; nonce?: string; stdout?: string; ok?: boolean; crash?: string | null } | null;
      if (!data || data.__dw !== 'result' || data.nonce !== nonce || e.source !== iframe.contentWindow) return;
      finish({ stdout: data.stdout ?? '', stderr: withTests ? '' : data.crash ?? '', ok: !!data.ok });
    }
    window.addEventListener('message', onMessage);
    iframe.srcdoc = page.html;
    document.body.appendChild(iframe);
  });
}

/** Single-file Code Portal tasks: the learner's module is solution.ts(x) and the task's tests are a
 *  separate module importing from './solution'. Tests that use Testing Library run in the React
 *  frame; everything else runs in a Worker. */
/** A single-file task is a React task when its tests use Testing Library or its code imports React. */
export function isReactSnippet(code: string, testCode: string | null): boolean {
  return (testCode !== null && /@testing-library\/react/.test(testCode)) || /from\s+['"]react['"]/.test(code);
}

export function runTypeScriptSnippet(code: string, testCode: string | null): Promise<RunResult> {
  const react = isReactSnippet(code, testCode);
  const file: ProjectFile = { path: react ? 'solution.tsx' : 'solution.ts', content: code, language: 'typescript', editable: true };
  if (react) {
    const target: RunTarget = { id: 'main', label: 'Tests', kind: 'react', entry: file.path, testCode: testCode ?? '' };
    return runReactProject([file], target, testCode !== null);
  }
  return runTypeScriptProject([file], file.path, testCode ?? undefined);
}
