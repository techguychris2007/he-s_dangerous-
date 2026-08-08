import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Get-Or-Compute Cache

The pattern behind almost every real cache layer: check if a value is already there, return it if
so, otherwise compute it, STORE it, and then return it — so the expensive computation only ever
runs once per key.
`;

const STARTER = `const CACHE = new Map();

function cacheGetOrCompute(key, computeFn) {
  // TODO: if key is already in CACHE, return its cached value WITHOUT calling computeFn.
  // Otherwise call computeFn(), store the result in CACHE, and return it.
}

function cacheInvalidate(key) {
  // TODO: remove key from CACHE if present. Return true if it was removed, false if it wasn't there.
}

module.exports = { cacheGetOrCompute, cacheInvalidate };
`;

const SOLUTION = `const CACHE = new Map();

function cacheGetOrCompute(key, computeFn) {
  if (CACHE.has(key)) {
    return CACHE.get(key);
  }
  const value = computeFn();
  CACHE.set(key, value);
  return value;
}

function cacheInvalidate(key) {
  return CACHE.delete(key);
}

module.exports = { cacheGetOrCompute, cacheInvalidate };
`;

const TEST_CODE = `const { cacheGetOrCompute, cacheInvalidate } = require('./cache');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let calls = 0;
function expensive() {
  calls++;
  return 42;
}

const result1 = cacheGetOrCompute('answer', expensive);
check('first call computes the value', result1, 42);
check('first call actually invoked computeFn', calls, 1);

const result2 = cacheGetOrCompute('answer', expensive);
check('second call returns the cached value', result2, 42);
check('second call did NOT invoke computeFn again', calls, 1);

function other() {
  calls++;
  return 'different';
}

const result3 = cacheGetOrCompute('other-key', other);
check('a different key computes independently', result3, 'different');
check('different key invoked its own computeFn', calls, 2);

check('invalidating an existing key returns true', cacheInvalidate('answer'), true);
check('invalidating a missing key returns false', cacheInvalidate('answer'), false);

const result4 = cacheGetOrCompute('answer', expensive);
check('after invalidation, the value is recomputed', calls, 3);
check('recomputed value is still correct', result4, 42);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-013',
  title: 'Get-Or-Compute Cache',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Caching & Rate Limiting',
  tags: ['caching'],
  prompt: 'Implement the check-then-compute-then-store pattern behind almost every cache, plus an invalidation function to force a key to recompute.',
  hints: [
    '`CACHE.has(key)` is the cache-hit check — return `CACHE.get(key)` immediately without ever calling `computeFn`.',
    'On a miss, call `computeFn()` (note the parentheses — it\'s a zero-argument callable), store the result, then return it.',
    'Two different keys should never interfere — each one independently follows the check-then-compute path the first time it\'s seen.',
    '`CACHE.delete(key)` already returns true/false for "did this key exist" — exactly what `cacheInvalidate` needs to return, no extra bookkeeping.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('cache.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('cache.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Get-Or-Compute Cache', kind: 'node-js', entry: 'cache.js', testCode: TEST_CODE }],
};

export default task;
