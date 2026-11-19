import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Fix The Bugs

Not a blank-slate task — \`calculator.js\` already "works" (it runs without crashing) but gets several
answers wrong. Read the comments, figure out which behavior is actually intended, and fix each bug.
This is what real debugging looks like far more often than a stack trace does.
`;

const STARTER = `function average(numbers) {
  // Should return the arithmetic mean of numbers.
  return Math.floor(numbers.reduce((a, b) => a + b, 0) / numbers.length); // BUG: truncates the result
}

function isEven(n) {
  // Should return true if n is even.
  return n % 2 === 1; // BUG: this checks for ODD, not even
}

function clamp(value, low, high) {
  // Should return value, restricted to the range [low, high].
  if (value < low) return high; // BUG: should clamp DOWN to low, not jump to high
  if (value > high) return low; // BUG: should clamp UP to high, not jump to low
  return value;
}

function lastN(items, n) {
  // Should return the last n items of the array, in their original order.
  return items.slice(0, n); // BUG: this takes the FIRST n items, not the last n
}

module.exports = { average, isEven, clamp, lastN };
`;

const SOLUTION = `function average(numbers) {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function isEven(n) {
  return n % 2 === 0;
}

function clamp(value, low, high) {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

function lastN(items, n) {
  if (n === 0) return [];
  return items.slice(-n);
}

module.exports = { average, isEven, clamp, lastN };
`;

const TEST_CODE = `const { average, isEven, clamp, lastN } = require('./calculator');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('average with a fractional result', average([1, 2]), 1.5);
check('average of three numbers', average([10, 20, 30]), 20);

check('isEven on an even number', isEven(4), true);
check('isEven on an odd number', isEven(7), false);
check('isEven on zero', isEven(0), true);

check('clamp below range goes to low', clamp(-5, 0, 10), 0);
check('clamp above range goes to high', clamp(15, 0, 10), 10);
check('clamp inside range is unchanged', clamp(5, 0, 10), 5);

check('lastN of a 5-item array', lastN([1, 2, 3, 4, 5], 2), [4, 5]);
check('lastN with n=0 is empty', lastN([1, 2, 3], 0), []);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-017',
  title: 'Fix The Bugs',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Testing & Debugging',
  tags: ['debugging', 'reading-code'],
  prompt: "Four small functions in calculator.js each have exactly one bug, marked with a `// BUG:` comment describing what's wrong. Fix all four so their intended behavior (described in the comment above each) becomes true.",
  hints: [
    '`Math.floor` truncates — `average` should return the plain division result to keep the fractional part.',
    '`isEven` has its comparison backwards: `n % 2 === 0` means even, `=== 1` means odd.',
    "`clamp`'s two branches are swapped — going below `low` should clamp TO `low`, not jump to `high`.",
    '`items.slice(0, n)` is the first n items; `items.slice(-n)` is the last n — but `items.slice(-0)` is the WHOLE array (negative zero is still zero), so `n === 0` needs its own explicit case returning `[]`.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('calculator.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('calculator.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Fix The Bugs', kind: 'node-js', entry: 'calculator.js', testCode: TEST_CODE }],
};

export default task;
