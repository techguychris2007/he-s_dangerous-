// Every TypeScript/React task (Code Portal tasks and Build Portal projects) must pass all of its
// checks with the reference solution and fail at least one with the starter code. Uses the same
// pipeline as the browser: src/lib/tsCompile.ts (strict type check + transpile) with the type file
// system and test kits from public/ts-runtime (built by tools/ts-runtime/build.cjs).
//   - 'typescript' targets and plain TS tasks run in a Node VM with the worker test kit;
//   - 'react' targets and React tasks run in headless Chrome or Edge (--dump-dom), skipped with a
//     notice when neither browser is installed.
// Usage: node scripts/check-ts-tasks.cjs [taskOrProjectId ...]
// MUTATE='path|||old|||new;;;…' applies text replacements to the solution files (mutation checks).
require('./register-typescript.cjs');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');
const { compileTypeScript, typeCheckReport, isTsSource, jsPathFor } = require('../src/lib/tsCompile.ts');
const { bundleCommonJs } = require('../src/lib/jsModuleBundler.ts');
const { buildReactDocument, REACT_SANDBOX } = require('../src/lib/reactHarness.ts');
const { TS_TASKS } = require('../src/labs/typescriptTasks/index.ts');
const { DEVOPS_TASKS } = require('../src/labs/devopsTasks/index.ts');
const { languageForPath } = require('../src/labs/projectTypes.ts');

const root = path.join(__dirname, '..');
const runtimeDir = path.join(root, 'public', 'ts-runtime');
const RESULT_RE = /^__RESULT__ (\d+)\/(\d+)$/;
const only = new Set(process.argv.slice(2));

if (!fs.existsSync(path.join(runtimeDir, 'types.json'))) {
  console.error('public/ts-runtime is missing — run: node tools/ts-runtime/build.cjs');
  process.exit(1);
}
const typeFs = JSON.parse(fs.readFileSync(path.join(runtimeDir, 'types.json'), 'utf8'));
const workerKit = fs.readFileSync(path.join(runtimeDir, 'testkit.js'), 'utf8');
const reactKit = fs.readFileSync(path.join(runtimeDir, 'react-kit.js'), 'utf8');

const browser = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => fs.existsSync(p));

function lastLine(text) {
  return text.trim().split('\n').pop()?.trim() ?? '';
}

function prepare(files, entry, testCode, jsx) {
  const sources = files.filter((f) => isTsSource(f.path) || f.path.endsWith('.d.ts')).map(({ path: p, content }) => ({ path: p, content }));
  const dir = entry.includes('/') ? entry.slice(0, entry.lastIndexOf('/') + 1) : '';
  const testPath = `${dir}grader.test.${jsx ? 'tsx' : 'ts'}`;
  sources.push({ path: testPath, content: testCode });
  const result = compileTypeScript(ts, typeFs, sources);
  const report = typeCheckReport(result.diagnostics);
  const modules = [
    ...files.filter((f) => f.language === 'javascript'),
    ...result.outputs.map((o) => ({ path: o.path, content: o.content, language: 'javascript', editable: false })),
  ];
  // Same rule as src/lib/tsRunner.ts: when the learner writes no TypeScript (a Dockerfile, a
  // workflow), the grader's own type check is not one of their checks unless it fails.
  const learnerTs = files.some((f) => f.editable && isTsSource(f.path));
  const countPrelude = learnerTs || !report.ok;
  return {
    bundle: bundleCommonJs(modules, jsPathFor(testPath)),
    report: countPrelude ? report : { ok: true, lines: [] },
    countPrelude,
    projectFiles: Object.fromEntries(files.map((f) => [f.path, f.content])),
    styles: files.filter((f) => f.language === 'css').map((f) => f.content),
  };
}

/** Node VM run of a non-DOM TypeScript bundle with the worker test kit. */
async function runInVm(p) {
  const out = [];
  const log = (...args) => out.push(args.map((a) => (typeof a === 'string' ? a : a instanceof Error ? `${a.name}: ${a.message}` : JSON.stringify(a))).join(' '));
  const context = vm.createContext({
    console: { log, info: log, warn: log, error: log, debug: log },
    setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, structuredClone,
    URL, URLSearchParams, AbortController, AbortSignal, TextEncoder, TextDecoder, Headers, Request, Response,
    crypto: globalThis.crypto, atob, btoa, performance,
    __dw_project_files__: p.projectFiles,
  });
  vm.runInContext(workerKit, context, { filename: 'testkit.js' });
  const lines = [...p.report.lines];
  const passedPrelude = p.countPrelude && p.report.ok ? 1 : 0;
  const preludeTotal = p.countPrelude ? 1 : 0;
  try {
    vm.runInContext(p.bundle, context, { filename: 'bundle.js', timeout: 10000 });
  } catch (e) {
    lines.push(...out, `[FAIL] Test file failed to load: ${e && e.message}`, `__RESULT__ ${passedPrelude}/${preludeTotal + 1}`);
    return lines.join('\n');
  }
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timed out after 20 s')), 20000));
  const r = await Promise.race([context.__dw_runTests((l) => out.push(l)), timeout]);
  lines.push(...out);
  let total = preludeTotal + r.total;
  if (r.total === 0) { lines.push('[FAIL] No tests ran'); total += 1; }
  lines.push(`__RESULT__ ${passedPrelude + r.passed}/${total}`);
  return lines.join('\n');
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dw-ts-check-'));
let docCounter = 0;

/** Headless Chrome run of a React grading document; the harness writes its result into #__dw_result. */
function runInBrowser(p) {
  const html = buildReactDocument({
    kitScript: reactKit, bundle: p.bundle, styles: p.styles, mode: 'test', nonce: 'check',
    preludeLines: p.report.lines, preludePassed: p.report.ok ? 1 : 0, preludeTotal: 1,
  });
  const id = ++docCounter;
  const file = path.join(tmp, `doc-${id}.html`);
  // Run inside the same sandboxed srcdoc frame the app uses, so sandbox rules (form submission,
  // storage, origin) match production; the frame posts its result to this outer page.
  const escaped = html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  fs.writeFileSync(file, `<!doctype html><html><body><pre id="__dw_result" hidden></pre>
<script>window.addEventListener('message', function (e) { if (e.data && e.data.__dw === 'result') document.getElementById('__dw_result').textContent = e.data.stdout; });</script>
<iframe sandbox="${REACT_SANDBOX}" style="width:1024px;height:768px" srcdoc="${escaped}"></iframe></body></html>`);
  const profile = path.join(tmp, `profile-${id}`);
  return new Promise((resolve) => {
    // Sandboxed frames normally get their own process, where --virtual-time-budget does not reach;
    // keep them in-process so the dump waits for the tests to finish.
    const child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`,
      '--disable-features=IsolateSandboxedIframes', '--disable-site-isolation-trials',
      '--virtual-time-budget=30000', '--dump-dom', pathToFileURL(file).href], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d; });
    const kill = setTimeout(() => child.kill(), 90000);
    child.on('close', () => {
      clearTimeout(kill);
      const m = /<pre id="__dw_result" hidden="">([\s\S]+?)<\/pre>/.exec(stdout);
      const text = m ? m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&') : `NO RESULT (browser output: ${stdout.slice(-400)})`;
      resolve(text);
    });
  });
}

function mutate(files) {
  if (!process.env.MUTATE) return files;
  const edits = process.env.MUTATE.split(';;;').filter(Boolean).map((e) => e.split('|||'));
  return files.map((f) => {
    let content = f.content;
    for (const [p, from, to] of edits) {
      if (p !== f.path) continue;
      if (!content.includes(from)) throw new Error(`MUTATE: "${from}" not found in ${p}`);
      content = content.replace(from, to);
    }
    return { ...f, content };
  });
}

function summary(stdout) {
  const m = lastLine(stdout).match(RESULT_RE);
  return m ? { passed: Number(m[1]), total: Number(m[2]) } : null;
}

async function main() {
  const jobs = [];
  for (const task of TS_TASKS) {
    if (only.size && !only.has(task.id)) continue;
    const react = /@testing-library\/react/.test(task.testCode) || /from\s+['"]react['"]/.test(task.solution);
    const file = (code) => [{ path: react ? 'solution.tsx' : 'solution.ts', content: code, language: 'typescript', editable: true }];
    jobs.push({ id: task.id, react, solution: () => prepare(file(task.solution), 'solution.ts', task.testCode, react), starter: () => prepare(file(task.starterCode), 'solution.ts', task.testCode, react) });
  }
  for (const task of DEVOPS_TASKS) {
    if (only.size && !only.has(task.id)) continue;
    if (!task.fileName) throw new Error(`${task.id}: config tasks need a fileName`);
    const file = (code) => [{ path: task.fileName, content: code, language: languageForPath(task.fileName), editable: true }];
    jobs.push({ id: task.id, react: false, solution: () => prepare(file(task.solution), 'solution.ts', task.testCode, false), starter: () => prepare(file(task.starterCode), 'solution.ts', task.testCode, false) });
  }
  // TypeScript/React targets live in TypeScript projects and also in C# projects (Month 5's config
  // graders); check-csharp-tasks.cjs runs those projects' C# and SQL targets.
  const projectRoots = ['typescript', 'csharp'].map((d) => path.join(root, 'src', 'labs', 'seTasks', d));
  const projectFiles = projectRoots.flatMap((dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.ts')).map((f) => path.join(dir, f)) : []));
  let projects = 0;
  for (const file of projectFiles) {
    const project = require(file).default;
    if (project.id !== path.basename(file, '.ts')) throw new Error(`${file}: id must match the file name (the lazy loader relies on it)`);
    if (only.size && !only.has(project.id)) continue;
    const tsTargets = project.targets.filter((t) => t.kind === 'typescript' || t.kind === 'react');
    if (!tsTargets.length) continue;
    projects++;
    for (const target of tsTargets) {
      const react = target.kind === 'react';
      jobs.push({ id: `${project.id} [${target.id}]`, react, solution: () => prepare(mutate(project.solutionFiles), target.entry, target.testCode, react), starter: () => prepare(project.files, target.entry, target.testCode, react) });
    }
  }

  const failures = [];
  let checks = 0;
  let skipped = 0;
  const queue = [...jobs];
  const workers = Array.from({ length: 4 }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      if (job.react && !browser) { skipped++; continue; }
      const exec = job.react ? runInBrowser : runInVm;
      const solved = await exec(job.solution());
      const s = summary(solved);
      if (process.env.MUTATE) {
        // Mutation run: a mutant SHOULD fail. Report what caught it.
        const caught = solved.split('\n').filter((l) => l.startsWith('[FAIL]'));
        console.log(`${job.id}: mutant ${s && s.passed === s.total ? 'SURVIVED' : 'caught'} (${s ? `${s.passed}/${s.total}` : 'no result'})${caught.length ? `\n  ${caught.join('\n  ')}` : ''}`);
        continue;
      }
      if (!s || s.passed !== s.total) { failures.push(`${job.id}: reference solution does not pass every check\n${solved}`); continue; }
      const started = await exec(job.starter());
      const st = summary(started);
      if (!st) { failures.push(`${job.id}: starter run reported no result\n${started}`); continue; }
      if (st.passed >= st.total) { failures.push(`${job.id}: starter already passes every check`); continue; }
      checks += s.total;
      if (only.size) console.log(`${job.id}: solution ${s.passed}/${s.total}, starter ${st.passed}/${st.total}`);
      if (process.env.SHOW) console.log(`--- ${job.id} starter output ---\n${started}\n`);
    }
  });
  await Promise.all(workers);
  fs.rmSync(tmp, { recursive: true, force: true });

  if (failures.length) {
    console.error(failures.join('\n\n'));
    process.exit(1);
  }
  if (process.env.MUTATE) return;
  console.log(`TypeScript tasks: ${TS_TASKS.length} TypeScript + ${DEVOPS_TASKS.length} config tasks, ${projects} projects, ${checks} checks pass with the reference solutions and fail on the starters${skipped ? ` (${skipped} React jobs skipped: no Chrome or Edge found)` : ''}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
