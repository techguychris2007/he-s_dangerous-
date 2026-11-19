import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Pagination

Slice a big array into pages, and return enough metadata (current page, total pages, total items)
for a client to build "Next"/"Previous" controls — the shape almost every real list endpoint
returns instead of dumping everything at once.
`;

const STARTER = `function paginate(items, page, pageSize) {
  // TODO: return { items: [...], page, pageSize, totalItems: N, totalPages: N }. \`page\` is
  // 1-indexed (page 1 is the first page). \`items\` for an out-of-range page (too high, or <= 0)
  // should be an empty array, but totalItems/totalPages should still be correct. totalPages should
  // be 0 if items is empty, otherwise at least 1 (round UP — 7 items at pageSize 3 is 3 pages, not 2).
}

module.exports = { paginate };
`;

const SOLUTION = `function paginate(items, page, pageSize) {
  const totalItems = items.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;

  let pageItems;
  if (page < 1) {
    pageItems = [];
  } else {
    const start = (page - 1) * pageSize;
    pageItems = items.slice(start, start + pageSize);
  }

  return { items: pageItems, page, pageSize, totalItems, totalPages };
}

module.exports = { paginate };
`;

const TEST_CODE = `const { paginate } = require('./pagination');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const items = [1, 2, 3, 4, 5, 6, 7];

const page1 = paginate(items, 1, 3);
check('page 1 has the first 3 items', page1.items, [1, 2, 3]);
check('totalItems is correct', page1.totalItems, 7);
check('totalPages rounds up', page1.totalPages, 3);

const page3 = paginate(items, 3, 3);
check('last page has the remainder', page3.items, [7]);

const page99 = paginate(items, 99, 3);
check('out-of-range page has no items', page99.items, []);
check('out-of-range page still reports correct totals', page99.totalPages, 3);

const page0 = paginate(items, 0, 3);
check('page 0 has no items', page0.items, []);

const empty = paginate([], 1, 10);
check('empty array has no items', empty.items, []);
check('empty array has 0 totalPages', empty.totalPages, 0);

const exact = paginate([0, 1, 2, 3, 4, 5], 2, 3);
check('exact multiple divides evenly', exact.totalPages, 2);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-017',
  title: 'Pagination',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'API Design',
  tags: ['pagination', 'api-design'],
  prompt: 'Slice an array into 1-indexed pages and return the metadata (total items, total pages) a client needs to build pagination controls.',
  hints: [
    '`Math.ceil(totalItems / pageSize)` rounds UP — 7 items at pageSize 3 needs 3 pages, not `Math.floor(7 / 3) = 2`.',
    'The empty-array case needs its own branch: `totalItems > 0 ? Math.ceil(...) : 0` — worth being explicit rather than relying on `Math.ceil(0 / pageSize)` happening to also be 0.',
    '`start = (page - 1) * pageSize` converts a 1-indexed page number into a 0-indexed slice start — page 1 starts at index 0, page 2 at index `pageSize`, and so on.',
    '`Array.prototype.slice` already handles an out-of-range start gracefully (`[1,2,3].slice(100, 103)` just returns `[]`) — but `page < 1` still needs an explicit check, since a negative or zero page would slice from the wrong end.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('pagination.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('pagination.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Pagination', kind: 'node-js', entry: 'pagination.js', testCode: TEST_CODE }],
};

export default task;
