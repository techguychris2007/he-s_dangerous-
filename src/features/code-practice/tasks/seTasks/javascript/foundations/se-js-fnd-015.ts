import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Higher-Order Functions

Functions that take other functions as arguments — the core move behind \`.map()\`/\`.filter()\`/
\`.sort(compareFn)\` and most of JS's functional toolkit.
`;

const STARTER = `function applyDiscount(prices, discountFn) {
  // TODO: return a new array with discountFn(price) applied to every price in prices.
}

function filterValid(records, predicate) {
  // TODO: return a new array containing only the records for which predicate(record) is truthy.
}

function applyAll(value, functions) {
  // TODO: apply each function in functions to value in order, each one feeding into the next.
  // applyAll(2, [f, g]) means g(f(2)). Return the final result.
}

module.exports = { applyDiscount, filterValid, applyAll };
`;

const SOLUTION = `function applyDiscount(prices, discountFn) {
  return prices.map(discountFn);
}

function filterValid(records, predicate) {
  return records.filter(predicate);
}

function applyAll(value, functions) {
  return functions.reduce((result, fn) => fn(result), value);
}

module.exports = { applyDiscount, filterValid, applyAll };
`;

const TEST_CODE = `const { applyDiscount, filterValid, applyAll } = require('./hof');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('halve every price', applyDiscount([10, 20, 30], (p) => p / 2), [5, 10, 15]);
check('applyDiscount preserves order', applyDiscount([1, 2], (p) => p + 100), [101, 102]);

const records = [{ name: 'a', age: 30 }, { name: 'b', age: -1 }, { name: 'c', age: 25 }];
const valid = filterValid(records, (r) => r.age >= 0);
check('filterValid keeps only valid ages', valid.map((r) => r.name), ['a', 'c']);
check('filterValid with all-false predicate', filterValid(records, (r) => r.age > 1000), []);

const double = (x) => x * 2;
const addTen = (x) => x + 10;
check('applyAll chains left to right', applyAll(3, [double, addTen]), 16);
check('applyAll with single function', applyAll(5, [double]), 10);
check('applyAll with no functions returns input unchanged', applyAll(7, []), 7);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-015',
  title: 'Higher-Order Functions',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Functional Patterns',
  tags: ['functions', 'arrow-functions', 'array-methods'],
  prompt: 'Write three functions that take a function as an argument and apply it — the building blocks .map()/.filter() are made of.',
  hints: [
    '`prices.map(discountFn)` is the whole body of `applyDiscount` — `.map()` already does exactly this.',
    '`records.filter(predicate)` is the same idea for `filterValid`.',
    '`functions.reduce((result, fn) => fn(result), value)` threads the accumulator through each function in turn — each one\'s output feeds the next one\'s input.',
    'An empty `functions` array should leave `applyAll` returning `value` unchanged — `.reduce()` with a seed value just returns that seed when the array is empty, so this falls out for free.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('hof.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('hof.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Higher-Order Functions', kind: 'node-js', entry: 'hof.js', testCode: TEST_CODE }],
};

export default task;
