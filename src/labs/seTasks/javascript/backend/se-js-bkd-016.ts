import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Retry Logic

Real background jobs fail sometimes — a flaky network call, a momentary lock conflict. Wrap a
function so it retries on failure up to a limit, only giving up (and re-throwing) once every
attempt has been exhausted.
`;

const STARTER = `function runWithRetries(fn, maxAttempts) {
  // TODO: call fn() (no arguments). If it throws, try again, up to maxAttempts total attempts.
  // Return the first successful result. If EVERY attempt throws, let the LAST error propagate
  // (don't swallow it).
}

module.exports = { runWithRetries };
`;

const SOLUTION = `function runWithRetries(fn, maxAttempts) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return fn();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

module.exports = { runWithRetries };
`;

const TEST_CODE = `const { runWithRetries } = require('./retry');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

function alwaysWorks() {
  return 'ok';
}

check('succeeding function returns its result', runWithRetries(alwaysWorks, 3), 'ok');

let attempts = 0;
function failsTwiceThenWorks() {
  attempts++;
  if (attempts < 3) throw new Error('not yet');
  return 'eventually ok';
}

check('retries until it succeeds', runWithRetries(failsTwiceThenWorks, 5), 'eventually ok');
check('took exactly 3 attempts', attempts, 3);

function alwaysFails() {
  throw new Error('nope');
}

let raised = false;
try {
  runWithRetries(alwaysFails, 3);
} catch (e) {
  raised = true;
  check('re-raises the actual error message', e.message, 'nope');
}
check('exhausting all retries re-throws', raised, true);

let callCount = 0;
function countingFailure() {
  callCount++;
  throw new Error('boom');
}

try {
  runWithRetries(countingFailure, 4);
} catch (e) {
  // expected
}
check('makes exactly maxAttempts attempts before giving up', callCount, 4);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-016',
  title: 'Retry Logic',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Background Jobs',
  tags: ['retries', 'error-handling'],
  prompt: 'Wrap a function call so it retries on failure up to a limit, returning the first successful result, or re-throwing the last error once every attempt has failed.',
  hints: [
    '`for (let attempt = 0; attempt < maxAttempts; attempt++)` gives you exactly `maxAttempts` tries.',
    '`try { return fn(); } catch (e) { lastError = e; }` inside the loop — a successful call returns immediately (exiting the loop early); a failure just records the error and lets the loop continue.',
    'Track the most recent error in a variable declared outside the loop (`let lastError;` before it starts) so it survives past the loop.',
    'After the loop finishes (meaning every attempt failed), `throw lastError;` — this line is only reached if `fn()` never once returned successfully.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('retry.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('retry.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Retry Logic', kind: 'node-js', entry: 'retry.js', testCode: TEST_CODE }],
};

export default task;
