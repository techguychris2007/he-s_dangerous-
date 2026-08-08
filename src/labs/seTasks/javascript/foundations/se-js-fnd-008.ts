import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Input Validator

Two validation styles, both common in real code: one that *throws* on the first problem
(\`validateAge\`, \`validateEmail\`), and one that *collects every* problem instead of stopping at the
first (\`validateAll\`).
`;

const STARTER = `function validateAge(age) {
  // TODO: throw new Error("age must be between 0 and 150") if age < 0 or age > 150. Otherwise return age.
}

function validateEmail(email) {
  // TODO: throw new Error("invalid email") if '@' is not in email. Otherwise return email.
}

function validateAll(record) {
  // TODO: record is {age, email}. Try both validators; instead of letting errors propagate, catch
  // them and return an array of their error messages (empty array if both are valid).
}

module.exports = { validateAge, validateEmail, validateAll };
`;

const SOLUTION = `function validateAge(age) {
  if (age < 0 || age > 150) {
    throw new Error('age must be between 0 and 150');
  }
  return age;
}

function validateEmail(email) {
  if (!email.includes('@')) {
    throw new Error('invalid email');
  }
  return email;
}

function validateAll(record) {
  const errors = [];
  try {
    validateAge(record.age);
  } catch (e) {
    errors.push(e.message);
  }
  try {
    validateEmail(record.email);
  } catch (e) {
    errors.push(e.message);
  }
  return errors;
}

module.exports = { validateAge, validateEmail, validateAll };
`;

const TEST_CODE = `const { validateAge, validateEmail, validateAll } = require('./validator');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('valid age passes through', validateAge(30), 30);

let raised = false;
try {
  validateAge(-1);
} catch (e) {
  raised = true;
  check('negative age error message', e.message, 'age must be between 0 and 150');
}
check('negative age throws', raised, true);

raised = false;
try {
  validateAge(200);
} catch (e) {
  raised = true;
}
check('too-large age throws', raised, true);

check('valid email passes through', validateEmail('a@b.com'), 'a@b.com');

raised = false;
try {
  validateEmail('not-an-email');
} catch (e) {
  raised = true;
}
check('invalid email throws', raised, true);

check('validateAll with both valid', validateAll({ age: 25, email: 'x@y.com' }), []);
const errors = validateAll({ age: -5, email: 'bad' });
check('validateAll collects both errors', errors.length, 2);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-008',
  title: 'Input Validator',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Errors & Robustness',
  tags: ['error-handling', 'validation'],
  prompt: 'Write two throw-on-failure validators, then a third function that runs both and collects their errors instead of crashing on the first one.',
  hints: [
    '`throw new Error("age must be between 0 and 150")` — the exact message matters, tests check it with `e.message`.',
    'Guard both bounds in one condition: `if (age < 0 || age > 150)`.',
    '`!email.includes(\'@\')` is the whole check for `validateEmail`.',
    'In `validateAll`, wrap each individual validator call in its own `try`/`catch (e)` block so one failure doesn\'t stop the other from being checked — push `e.message` onto the errors array in each catch.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('validator.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('validator.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Input Validator', kind: 'node-js', entry: 'validator.js', testCode: TEST_CODE }],
};

export default task;
