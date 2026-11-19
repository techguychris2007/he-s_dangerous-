import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Validated Signup

A route that must reject bad input BEFORE doing anything with it — a validation function that
collects every problem (not just the first) and a route that turns those problems into a proper
\`400\` response.
`;

const FRAMEWORK = `class Request {
  constructor(method, path, body) {
    this.method = method;
    this.path = path;
    this.body = body || {};
  }
}

class App {
  constructor() {
    this.routes = [];
  }
  route(method, path, handler) {
    this.routes.push({ method, path, handler });
  }
  handle(method, path, body) {
    const req = new Request(method, path, body);
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const params = matchPath(r.path, path);
      if (params) return r.handler(req, params);
    }
    return [404, { error: 'not found' }];
  }
}

function matchPath(pattern, path) {
  const p = pattern.replace(/^\\/|\\/$/g, '').split('/');
  const a = path.replace(/^\\/|\\/$/g, '').split('/');
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = a[i];
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

module.exports = { App };
`;

const VALIDATION_STARTER = `function validateSignup(body) {
  // TODO: return an array of error strings for problems with body (empty array if it's valid):
  // - 'username is required' if body.username is missing or an empty string.
  // - 'age must be a non-negative integer' if body.age is missing, not an integer, or negative.
  // Check BOTH fields — don't stop at the first problem.
}

module.exports = { validateSignup };
`;

const VALIDATION_SOLUTION = `function validateSignup(body) {
  const errors = [];

  if (!body.username) {
    errors.push('username is required');
  }

  if (!Number.isInteger(body.age) || body.age < 0) {
    errors.push('age must be a non-negative integer');
  }

  return errors;
}

module.exports = { validateSignup };
`;

const ROUTES = `const { App } = require('./framework');
const { validateSignup } = require('./validation');

const app = new App();

app.route('POST', '/signup', function (req, params) {
  const errors = validateSignup(req.body);
  if (errors.length > 0) return [400, { errors }];
  return [201, { username: req.body.username, age: req.body.age }];
});

module.exports = { app };
`;

const MAIN = `const { app } = require('./routes');

const [status, body] = app.handle('POST', '/signup', { username: 'ama', age: 25 });
console.log('valid signup ->', status, JSON.stringify(body));
`;

const TEST_CODE = `const { app } = require('./routes');
const { validateSignup } = require('./validation');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('valid input has no errors', validateSignup({ username: 'ama', age: 25 }), []);
check('missing username', validateSignup({ age: 25 }), ['username is required']);
check('empty username', validateSignup({ username: '', age: 25 }), ['username is required']);
check('negative age', validateSignup({ username: 'ama', age: -1 }), ['age must be a non-negative integer']);
check('non-integer age', validateSignup({ username: 'ama', age: 'old' }), ['age must be a non-negative integer']);

const errors = validateSignup({});
check('both fields missing collects both errors', errors.length, 2);

let result = app.handle('POST', '/signup', { username: 'kofi', age: 30 });
check('valid signup status', result[0], 201);

result = app.handle('POST', '/signup', { username: '' });
check('invalid signup status', result[0], 400);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-005',
  title: 'Validated Signup',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Request Validation',
  tags: ['validation', 'rest'],
  prompt: 'Write a validator that collects every problem with a signup payload (not just the first), and wire it into a route that returns 400 with the full error array.',
  hints: [
    'Build an `errors = []` array and push to it — don\'t `return` on the first problem, or the second field never gets checked.',
    '`if (!body.username)` catches both a missing key (`undefined`) and an empty string in one check.',
    '`Number.isInteger(body.age)` is stricter than `typeof body.age === \'number\'` — it correctly rejects things like `25.5` or the string `"25"`, both of which shouldn\'t count as a valid age here.',
    'The route just needs `if (errors.length > 0) return [400, { errors }];` — the validator already did all the real work.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('validation.js', VALIDATION_STARTER),
    pf('routes.js', ROUTES, { editable: false }),
    pf('main.js', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('validation.js', VALIDATION_SOLUTION),
    pf('routes.js', ROUTES, { editable: false }),
    pf('main.js', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Validated Signup', kind: 'node-js', entry: 'main.js', testCode: TEST_CODE }],
};

export default task;
