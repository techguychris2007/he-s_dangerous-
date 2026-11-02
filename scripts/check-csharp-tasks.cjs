// Every C# task (Code Portal tasks and Build Portal projects) must pass all of its checks with the
// reference solution and fail at least one with the starter code. Runs the exact compiler bundle the
// browser uses (public/csharp-runtime, built by tools/csharp-runner/build.ps1) under Node.
require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { CSHARP_TASKS } = require('../src/labs/csharpTasks/index.ts');

const RESULT_RE = /^__RESULT__ (\d+)\/(\d+)$/;
const TEST_MAIN = 'TestRunner';

function lastLine(text) {
  return text.trim().split('\n').pop()?.trim() ?? '';
}

async function boot() {
  const dotnetJs = path.join(__dirname, '..', 'public', 'csharp-runtime', '_framework', 'dotnet.js');
  const { dotnet } = await import(pathToFileURL(dotnetJs).href);
  const runtime = await dotnet.create();
  const exports = await runtime.getAssemblyExports(runtime.getConfig().mainAssemblyName);
  return async (files, mainType) => JSON.parse(await exports.Runner.RunAsync(JSON.stringify({ files, mainType, stdin: '' })));
}

function describe(response) {
  if (!response.compiled) return response.diagnostics.filter(d => d.severity === 'error').map(d => `${d.path}(${d.line},${d.column}): ${d.id} ${d.message}`).join('\n');
  return `${response.stdout}\n${response.stderr}`.trim();
}

async function main() {
  const run = await boot();
  const SQL = await require('sql.js')();
  const { runSqlTarget } = require('../src/lib/sqlHarness.ts');
  let checks = 0;
  const failures = [];
  for (const task of CSHARP_TASKS) {
    const files = (code) => [{ path: 'Solution.cs', content: `${code}\n\n${task.testCode}` }];

    const solved = await run(files(task.solution), TEST_MAIN);
    const solvedMatch = solved.compiled && lastLine(solved.stdout).match(RESULT_RE);
    if (!solvedMatch || solvedMatch[1] !== solvedMatch[2] || solvedMatch[2] === '0') {
      failures.push(`${task.id}: reference solution does not pass all checks\n${describe(solved)}`);
      continue;
    }

    const starter = await run(files(task.starterCode), TEST_MAIN);
    assert.ok(starter.compiled, `${task.id}: starter code must compile so learners see failing checks\n${describe(starter)}`);
    const starterMatch = lastLine(starter.stdout).match(RESULT_RE);
    assert.ok(starterMatch, `${task.id}: starter run did not report a result\n${describe(starter)}`);
    assert.ok(Number(starterMatch[1]) < Number(starterMatch[2]), `${task.id}: starter code already passes every check`);
    checks += Number(solvedMatch[2]);
  }
  // Build Portal projects: "Run tests" compiles every .cs file except the entry plus the hidden
  // Tests.cs (the same rule as runCSharpProject); "Run" must also build and run the demo program.
  const projectDir = path.join(__dirname, '..', 'src', 'labs', 'seTasks', 'csharp');
  const projectFiles = fs.existsSync(projectDir) ? fs.readdirSync(projectDir, { recursive: true }).filter(f => f.endsWith('.ts')) : [];
  let projects = 0;
  for (const file of projectFiles) {
    const project = require(path.join(projectDir, file)).default;
    assert.equal(project.id, path.basename(file, '.ts'), `${file}: id must match file name (the lazy loader relies on it)`);
    for (const target of project.targets) {
      if (target.kind === 'sql') {
        const sqlFiles = (files) => files.filter(f => f.path.endsWith('.sql')).map(({ path: p, content }) => ({ path: p, content }));
        const solvedSql = runSqlTarget(SQL, sqlFiles(project.solutionFiles), target.entry, target.testCode);
        const sqlMatch = lastLine(solvedSql.stdout).match(RESULT_RE);
        if (!sqlMatch || sqlMatch[1] !== sqlMatch[2]) { failures.push(`${project.id} [${target.id}]: reference SQL does not pass all checks
${solvedSql.stdout}
${solvedSql.stderr}`); continue; }
        const starterSql = runSqlTarget(SQL, sqlFiles(project.files), target.entry, target.testCode);
        const starterSqlMatch = lastLine(starterSql.stdout).match(RESULT_RE);
        assert.ok(starterSqlMatch && Number(starterSqlMatch[1]) < Number(starterSqlMatch[2]), `${project.id} [${target.id}]: starter SQL must report failing checks
${starterSql.stdout}${starterSql.stderr}`);
        const demoSql = runSqlTarget(SQL, sqlFiles(project.solutionFiles), target.entry);
        assert.ok(demoSql.ok, `${project.id} [${target.id}]: running the entry file failed
${demoSql.stderr}`);
        checks += Number(sqlMatch[2]);
        continue;
      }
      const sources = (files) => files.filter(f => f.path.endsWith('.cs') && f.path !== target.entry).map(({ path: p, content }) => ({ path: p, content }));
      const solved = await run([...sources(project.solutionFiles), { path: 'Tests.cs', content: target.testCode }], TEST_MAIN);
      const solvedMatch = solved.compiled && lastLine(solved.stdout).match(RESULT_RE);
      if (!solvedMatch || solvedMatch[1] !== solvedMatch[2]) { failures.push(`${project.id}: reference files do not pass all checks
${describe(solved)}`); continue; }
      const starter = await run([...sources(project.files), { path: 'Tests.cs', content: target.testCode }], TEST_MAIN);
      assert.ok(starter.compiled, `${project.id}: starter files must compile
${describe(starter)}`);
      const starterMatch = lastLine(starter.stdout).match(RESULT_RE);
      assert.ok(starterMatch && Number(starterMatch[1]) < Number(starterMatch[2]), `${project.id}: starter must report failing checks
${describe(starter)}`);
      if (target.kind !== 'csharp') continue;
      const demo = await run(project.solutionFiles.filter(f => f.path.endsWith('.cs')).map(({ path: p, content }) => ({ path: p, content })), null);
      assert.ok(demo.compiled && demo.ok, `${project.id}: the demo program must build and run with the reference files
${describe(demo)}`);
      checks += Number(solvedMatch[2]);
    }
    projects++;
  }
  if (failures.length) {
    console.error(failures.join('\n\n'));
    process.exit(1);
  }
  console.log(`C# tasks: ${CSHARP_TASKS.length} tasks and ${projects} build projects, ${checks} checks pass with the reference solutions and fail on the starters.`);
  process.exit(0);
}

main().catch((error) => { console.error(error); process.exit(1); });
