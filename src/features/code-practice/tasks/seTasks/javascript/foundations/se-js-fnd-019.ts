import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Sorting Small Data

Implement two textbook algorithms by hand instead of calling \`.sort()\`/\`.indexOf()\` — the point is
the mechanics (comparing and swapping, halving a search range), not the built-in.
`;

const STARTER = `function bubbleSort(arr) {
  // TODO: return a NEW array containing arr's elements in ascending order, using the bubble sort
  // algorithm (repeatedly swap adjacent out-of-order pairs). Do not mutate arr; do not call
  // .sort() or .toSorted().
}

function binarySearch(sortedArr, target) {
  // TODO: return the index of target in sortedArr (which is already sorted ascending), or -1 if
  // it isn't present. Do not call .indexOf() or .includes().
}

module.exports = { bubbleSort, binarySearch };
`;

const SOLUTION = `function bubbleSort(arr) {
  const result = [...arr];
  const n = result.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (result[j] > result[j + 1]) {
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
      }
    }
  }
  return result;
}

function binarySearch(sortedArr, target) {
  let low = 0;
  let high = sortedArr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (sortedArr[mid] === target) {
      return mid;
    } else if (sortedArr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1;
}

module.exports = { bubbleSort, binarySearch };
`;

const TEST_CODE = `const { bubbleSort, binarySearch } = require('./algorithms');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const original = [5, 2, 8, 1, 9, 3];
const sortedCopy = bubbleSort(original);
check('bubbleSort produces ascending order', sortedCopy, [1, 2, 3, 5, 8, 9]);
check('bubbleSort does not mutate the input', original, [5, 2, 8, 1, 9, 3]);
check('bubbleSort on already-sorted input', bubbleSort([1, 2, 3]), [1, 2, 3]);
check('bubbleSort on empty array', bubbleSort([]), []);
check('bubbleSort on single element', bubbleSort([7]), [7]);

const data = [1, 3, 5, 7, 9, 11];
check('binarySearch finds first element', binarySearch(data, 1), 0);
check('binarySearch finds last element', binarySearch(data, 11), 5);
check('binarySearch finds middle element', binarySearch(data, 7), 3);
check('binarySearch returns -1 when absent', binarySearch(data, 4), -1);
check('binarySearch on empty array', binarySearch([], 1), -1);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-019',
  title: 'Sorting Small Data',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Algorithms in Practice',
  tags: ['sorting', 'searching', 'algorithms'],
  prompt: 'Implement bubble sort and binary search by hand — the classic pair for understanding comparison-based algorithms.',
  hints: [
    'Copy first: `const result = [...arr];` so the original is never touched, then sort `result` in place.',
    'Bubble sort is two nested loops: the outer one runs `n` passes, the inner one compares `result[j]` and `result[j + 1]`, swapping them with array destructuring `[result[j], result[j+1]] = [result[j+1], result[j]]` when out of order.',
    'Binary search keeps a `low`/`high` window and a `while (low <= high)` loop — compute `mid = Math.floor((low + high) / 2)` each iteration.',
    'If `sortedArr[mid] < target`, the answer must be to the right, so `low = mid + 1`; otherwise `high = mid - 1`. Falling out of the loop (never returning) means it\'s absent — return -1 there.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('algorithms.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('algorithms.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Sorting Small Data', kind: 'node-js', entry: 'algorithms.js', testCode: TEST_CODE }],
};

export default task;
