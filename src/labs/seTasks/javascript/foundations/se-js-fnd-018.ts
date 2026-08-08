import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Custom Assertions

Build a tiny assertion toolkit — the same kind of thing every test framework (including this
platform's own test runner) is built on top of. \`assertEqual\` and \`assertTrue\` throw an \`Error\`
with a useful message on failure; \`assertThrows\` checks that a callable throws at all.
`;

const STARTER = `function assertEqual(actual, expected, message = '') {
  // TODO: throw new Error(\`expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\` +
  // (message ? ": " + message : "")) if actual and expected aren't deeply equal (compare their
  // JSON.stringify output). Do nothing if they match.
}

function assertTrue(value, message = '') {
  // TODO: throw new Error("expected truthy value" + (message ? ": " + message : "")) if value is
  // falsy. Do nothing if it's truthy.
}

function assertThrows(fn, ...args) {
  // TODO: call fn(...args). Throw new Error("expected a function to throw") if it does NOT throw.
  // If it does throw, swallow the error (return undefined) instead of letting it propagate.
}

module.exports = { assertEqual, assertTrue, assertThrows };
`;

const SOLUTION = `function assertEqual(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    const suffix = message ? \`: \${message}\` : '';
    throw new Error(\`expected \${JSON.stringify(expected)}, got \${JSON.stringify(actual)}\${suffix}\`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    const suffix = message ? \`: \${message}\` : '';
    throw new Error(\`expected truthy value\${suffix}\`);
  }
}

function assertThrows(fn, ...args) {
  try {
    fn(...args);
  } catch (e) {
    return undefined;
  }
  throw new Error('expected a function to throw');
}

module.exports = { assertEqual, assertTrue, assertThrows };
`;

const TEST_CODE = `const { assertEqual, assertTrue, assertThrows } = require('./asserts');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let ok1 = true;
try {
  assertEqual(2 + 2, 4);
} catch (e) {
  ok1 = false;
}
check('assertEqual passes silently when equal', ok1, true);

let raised = false;
try {
  assertEqual(2 + 2, 5);
} catch (e) {
  raised = true;
  check('assertEqual error mentions both values', e.message.includes('5') && e.message.includes('4'), true);
}
check('assertEqual throws when unequal', raised, true);

let ok2 = true;
try {
  assertTrue(1 === 1);
} catch (e) {
  ok2 = false;
}
check('assertTrue passes silently for truthy', ok2, true);

raised = false;
try {
  assertTrue(false, 'should have been true');
} catch (e) {
  raised = true;
  check('assertTrue includes custom message', e.message.includes('should have been true'), true);
}
check('assertTrue throws for falsy', raised, true);

check('assertThrows swallows a thrown error', assertThrows(() => { throw new Error('boom'); }), undefined);

raised = false;
try {
  assertThrows(() => 42);
} catch (e) {
  raised = true;
}
check('assertThrows fails when fn does not throw', raised, true);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-018',
  title: 'Custom Assertions',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Testing & Debugging',
  tags: ['testing', 'errors'],
  prompt: 'Build a minimal assertion toolkit from scratch: assertEqual, assertTrue, and assertThrows — the same primitives real test frameworks are built on.',
  hints: [
    '`assertEqual` and `assertTrue` share a shape: check the condition, and if it fails, build a message string and `throw new Error(message)`.',
    'Build the optional suffix once: `const suffix = message ? `: ${message}` : \'\';`, then include it at the end of the template literal.',
    'In `assertThrows`, put the call in a `try`/`catch (e)` — if the catch fires, `fn` threw as expected, so just `return undefined`.',
    'If `fn(...args)` runs to completion without throwing, execution falls through past the try/catch entirely — that\'s exactly where the final `throw new Error(...)` belongs, unindented, after the try block.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('asserts.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('asserts.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Custom Assertions', kind: 'node-js', entry: 'asserts.js', testCode: TEST_CODE }],
};

export default task;
