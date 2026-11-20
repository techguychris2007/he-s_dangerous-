import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Function Wrappers

JS doesn't have Python's \`@decorator\` syntax, but the underlying pattern — a function that takes a
function and returns a new, enhanced function — works exactly the same way. Write a call counter and
a memoizing cache, both as plain higher-order functions.
`;

const STARTER = `function countCalls(fn) {
  // TODO: return a new function that increments a counter every time it's called, then calls
  // through to fn and returns its result. Attach the counter to the returned function itself as
  // wrapper.calls (starts at 0).
}

function memoize(fn) {
  // TODO: return a new function that caches fn's results by argument, so repeated calls with the
  // same argument return the cached value instead of recomputing. Assume fn only ever takes a
  // single argument.
}

module.exports = { countCalls, memoize };
`;

const SOLUTION = `function countCalls(fn) {
  function wrapper(...args) {
    wrapper.calls += 1;
    return fn(...args);
  }
  wrapper.calls = 0;
  return wrapper;
}

function memoize(fn) {
  const cache = new Map();
  return function wrapper(arg) {
    if (!cache.has(arg)) {
      cache.set(arg, fn(arg));
    }
    return cache.get(arg);
  };
}

module.exports = { countCalls, memoize };
`;

const TEST_CODE = `const { countCalls, memoize } = require('./wrappers');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const addOne = countCalls((x) => x + 1);
check('wrapped function still works', addOne(5), 6);
check('calls starts having recorded 1 call', addOne.calls, 1);
addOne(10);
addOne(20);
check('calls accumulates across calls', addOne.calls, 3);

const callsMade = [];
const slowSquare = memoize((x) => {
  callsMade.push(x);
  return x * x;
});

check('memoized function computes correctly', slowSquare(4), 16);
check('memoized function computes correctly again', slowSquare(5), 25);
check('repeat call returns cached (correct) value', slowSquare(4), 16);
check('repeat call did not recompute', callsMade, [4, 5]);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-016',
  title: 'Function Wrappers',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'foundations',
  category: 'Functional Patterns',
  tags: ['closures', 'higher-order-functions'],
  prompt: 'Implement a call-counter and a memoizing cache as plain functions-that-return-functions — the pattern behind decorators in any language.',
  hints: [
    'A wrapper is a function that takes a function and returns a new function — define an inner `function wrapper(...args) {...}` and `return wrapper`.',
    'Attach the counter to the wrapper itself: `wrapper.calls = 0` right after defining it (but before returning it), then `wrapper.calls += 1` as the first line inside `wrapper`.',
    "`memoize`'s cache lives in the enclosing scope (a closure, e.g. `const cache = new Map()`), not inside `wrapper` — that's what lets it persist between calls.",
    'Check `if (!cache.has(arg))` before computing — only call the real (slow) function on a cache miss, and always return `cache.get(arg)` either way.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('wrappers.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('wrappers.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Function Wrappers', kind: 'node-js', entry: 'wrappers.js', testCode: TEST_CODE }],
};

export default task;
