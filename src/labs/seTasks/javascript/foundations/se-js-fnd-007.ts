import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Safe Divider

Two small functions that turn thrown errors into ordinary return values instead of letting them
propagate — \`try\`/\`catch\` as a control-flow tool, not just a crash handler.
`;

const STARTER = `function safeDivide(a, b) {
  // TODO: return a / b, or null if b is 0 (instead of returning Infinity/NaN)
}

function parseIntOrDefault(text, fallback) {
  // TODO: try to parse \`text\` as an integer with parseInt. Return \`fallback\` if the result is NaN.
}

module.exports = { safeDivide, parseIntOrDefault };
`;

const SOLUTION = `function safeDivide(a, b) {
  if (b === 0) return null;
  return a / b;
}

function parseIntOrDefault(text, fallback) {
  const parsed = parseInt(text, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

module.exports = { safeDivide, parseIntOrDefault };
`;

const TEST_CODE = `const { safeDivide, parseIntOrDefault } = require('./safe_math');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('normal division', safeDivide(10, 2), 5);
check('division by zero', safeDivide(10, 0), null);
check('negative division', safeDivide(-9, 3), -3);
check('valid int string', parseIntOrDefault('42', 0), 42);
check('invalid int string', parseIntOrDefault('abc', 0), 0);
check('empty string', parseIntOrDefault('', -1), -1);
check('negative int string', parseIntOrDefault('-7', 0), -7);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-007',
  title: 'Safe Divider',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Errors & Robustness',
  tags: ['error-handling', 'validation'],
  prompt: "Wrap two operations that can naturally fail (division by zero, int parsing) so they return a fallback value instead of NaN/Infinity.",
  hints: [
    "JS doesn't throw on `10 / 0` (it returns `Infinity`) — so check `if (b === 0) return null;` explicitly before dividing, rather than reaching for try/catch.",
    "`parseInt('abc', 10)` returns `NaN`, not an error — `Number.isNaN(parsed)` is how you detect that (plain `===` comparison never works for NaN).",
    "Always pass a radix to `parseInt` (`parseInt(text, 10)`) — without one, a string starting with '0' can be parsed in an unexpected base.",
    "`parseIntOrDefault('', -1)` should hit the NaN branch too — `parseInt('', 10)` is `NaN`, same as an invalid string.",
  ],
  files: [pf('README.md', README, { editable: false }), pf('safe_math.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('safe_math.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Safe Divider', kind: 'node-js', entry: 'safe_math.js', testCode: TEST_CODE }],
};

export default task;
