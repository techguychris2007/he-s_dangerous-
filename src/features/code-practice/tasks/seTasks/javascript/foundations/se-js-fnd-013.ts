import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Custom Range Iterator

Implement JavaScript's iterator protocol by hand: an object with a \`[Symbol.iterator]\` method
returning \`{next()}\` — the exact protocol \`for...of\` and the spread operator are built on.
`;

const STARTER = `class Countdown {
  /** Counts down from \`start\` to 1 (inclusive), one number per iteration. */
  constructor(start) {
    // TODO: store start; you'll also need to track the current count somewhere
  }

  [Symbol.iterator]() {
    // TODO: return an object with a next() method. next() should return {value, done}: an object
    // like {value: <number>, done: false} for each number in the countdown, then
    // {value: undefined, done: true} once you've gone past 1.
  }
}

module.exports = { Countdown };
`;

const SOLUTION = `class Countdown {
  constructor(start) {
    this.start = start;
  }

  [Symbol.iterator]() {
    let current = this.start;
    return {
      next() {
        if (current < 1) {
          return { value: undefined, done: true };
        }
        const value = current;
        current -= 1;
        return { value, done: false };
      },
    };
  }
}

module.exports = { Countdown };
`;

const TEST_CODE = `const { Countdown } = require('./countdown');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('collects with spread', [...new Countdown(5)], [5, 4, 3, 2, 1]);
check('collects from 1', [...new Countdown(1)], [1]);
check('collects from 0 is empty', [...new Countdown(0)], []);

let sum = 0;
for (const n of new Countdown(3)) {
  sum += n;
}
check('for-of sums to 6', sum, 6);

const it = new Countdown(2)[Symbol.iterator]();
check('first next()', it.next(), { value: 2, done: false });
check('second next()', it.next(), { value: 1, done: false });
check('exhausted iterator reports done', it.next(), { value: undefined, done: true });

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-013',
  title: 'Custom Range Iterator',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Iterators/Generators/Async',
  tags: ['iterators', 'symbol-iterator'],
  prompt: 'Implement the iterator protocol by hand — a `[Symbol.iterator]` method returning a `{next()}` object — so a plain class works with for-of and the spread operator.',
  hints: [
    '`[Symbol.iterator]()` is a computed method name — it\'s already written in the starter, just fill in its body.',
    'Keep the current count in a variable captured by the closure (e.g. `let current = this.start;`) inside `[Symbol.iterator]()`, not on `this` — that way two separate iterations over the same Countdown don\'t interfere with each other.',
    'Each call to `next()` returns `{value, done}` — check `if (current < 1)` FIRST and return `{value: undefined, done: true}` before computing anything.',
    'Otherwise: save the current value, decrement, and return `{value, done: false}` with the SAVED value — decrementing before saving would skip the starting number.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('countdown.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('countdown.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Custom Range Iterator', kind: 'node-js', entry: 'countdown.js', testCode: TEST_CODE }],
};

export default task;
