import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Generator Pipeline

\`function*\`/\`yield\` generators instead of hand-rolled iterator objects — the idiomatic way to
produce a lazy sequence in JS. Chain two small generators together to build a pipeline.

(This track sticks to synchronous generators rather than real \`async\`/\`await\` — the sandboxed
Worker this code runs in captures output the instant your script's top-level code finishes running,
before any pending microtask/timer continuation gets a chance to execute, so a genuinely-asynchronous
result would silently go missing. Generators have the same "produce values lazily" spirit without
that trap.)
`;

const STARTER = `function* evenNumbers(n) {
  // TODO: yield every even number from 0 up to (and including, if even) n.
}

function* squares(iterable) {
  // TODO: yield the square of every value in iterable, in order.
}

function firstN(iterable, n) {
  // TODO: return an array of the first n values pulled from iterable (which may be infinite —
  // don't spread it into an array first).
}

module.exports = { evenNumbers, squares, firstN };
`;

const SOLUTION = `function* evenNumbers(n) {
  for (let i = 0; i <= n; i += 2) {
    yield i;
  }
}

function* squares(iterable) {
  for (const value of iterable) {
    yield value ** 2;
  }
}

function firstN(iterable, n) {
  const result = [];
  for (const value of iterable) {
    if (result.length >= n) break;
    result.push(value);
  }
  return result;
}

module.exports = { evenNumbers, squares, firstN };
`;

const TEST_CODE = `const { evenNumbers, squares, firstN } = require('./pipeline');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('even numbers up to 10', [...evenNumbers(10)], [0, 2, 4, 6, 8, 10]);
check('even numbers up to 9 (odd bound)', [...evenNumbers(9)], [0, 2, 4, 6, 8]);
check('evenNumbers is a generator', typeof evenNumbers(4).next === 'function', true);

check('squares of an array', [...squares([1, 2, 3, 4])], [1, 4, 9, 16]);
check('squares chained onto evenNumbers', [...squares(evenNumbers(4))], [0, 4, 16]);

function* naturals() {
  let n = 0;
  while (true) {
    yield n;
    n += 1;
  }
}

check('firstN pulls from an infinite generator', firstN(naturals(), 5), [0, 1, 2, 3, 4]);
check('firstN chained with squares on infinite gen', firstN(squares(naturals()), 4), [0, 1, 4, 9]);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-014',
  title: 'Generator Pipeline',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Iterators/Generators/Async',
  tags: ['generators', 'yield', 'laziness'],
  prompt: 'Write two `function*` generators and a consumer that can pull a finite number of values out of a potentially infinite one.',
  hints: [
    '`evenNumbers` is a one-line loop: `for (let i = 0; i <= n; i += 2) yield i;`.',
    "`squares` doesn't care where its input comes from — `for (const value of iterable) yield value ** 2;` works whether `iterable` is an array or another generator.",
    "The whole point of `firstN` is that it must NOT spread `iterable` into an array — that would hang forever on an infinite generator. Use `for...of` and `break` once you have enough.",
    "Check `if (result.length >= n) break;` BEFORE pushing, so you stop at exactly `n` items, not `n + 1`.",
  ],
  files: [pf('README.md', README, { editable: false }), pf('pipeline.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('pipeline.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Generator Pipeline', kind: 'node-js', entry: 'pipeline.js', testCode: TEST_CODE }],
};

export default task;
