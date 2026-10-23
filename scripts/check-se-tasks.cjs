// Software Engineering track: every coding task must be gradeable. The reference solution has to pass
// all of its checks under a real Python interpreter, and the untouched starter code must not, so a
// learner can never "pass" by submitting the template. Skips (with a notice) when Python is absent.
require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { SE_TASKS } = require('../src/labs/pythonTasks/softwareEngineering/index.ts');
const { parseTestResult } = require('../src/lib/testResult.ts');

const python = ['python', 'python3', 'py'].find((cmd) => spawnSync(cmd, ['--version']).status === 0);
if (!python) {
  console.log('Software Engineering tasks: Python not found, execution checks skipped.');
  process.exit(0);
}

const run = (code) => {
  const result = spawnSync(python, ['-I', '-'], { input: code, encoding: 'utf8', timeout: 30000 });
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
};

const ids = new Set();
let checks = 0;
for (const task of SE_TASKS) {
  assert.ok(!ids.has(task.id), `duplicate task id ${task.id}`);
  ids.add(task.id);
  assert.equal(task.category, 'Software Engineering', `${task.id} category`);
  assert.ok(task.hints.length >= 2, `${task.id} needs progressive hints`);

  const solved = run(`${task.solution}\n${task.testCode}`);
  const pass = parseTestResult(solved);
  assert.ok(pass && pass.total > 0 && pass.passed === pass.total, `${task.id} reference solution must pass every check:\n${solved}`);

  const starter = run(`${task.starterCode}\n${task.testCode}`);
  const start = parseTestResult(starter);
  assert.ok(!start || start.passed < start.total, `${task.id} starter code must not pass:\n${starter}`);
  checks += pass.total;
}
console.log(`Software Engineering tasks: ${SE_TASKS.length} tasks, ${checks} checks pass with the reference solutions and fail on the starters.`);
