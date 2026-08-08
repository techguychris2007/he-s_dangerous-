import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Response Envelope

Wrap every route's response in a consistent shape (\`{ data, meta }\` on success, \`{ error }\` on
failure) instead of letting each route invent its own format — a small convention that makes an
entire API predictable to consume.
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

const ENVELOPE_STARTER = `function successEnvelope(data, meta) {
  // TODO: return { data, meta: meta || {} }.
}

function errorEnvelope(code, message) {
  // TODO: return { error: { code, message } }.
}

module.exports = { successEnvelope, errorEnvelope };
`;

const ENVELOPE_SOLUTION = `function successEnvelope(data, meta) {
  return { data, meta: meta || {} };
}

function errorEnvelope(code, message) {
  return { error: { code, message } };
}

module.exports = { successEnvelope, errorEnvelope };
`;

const ROUTES = `const { App } = require('./framework');
const { successEnvelope, errorEnvelope } = require('./envelope');

const USERS = new Map([[1, { id: 1, name: 'Ama' }]]);

const app = new App();

app.route('GET', '/users/:id', function (req, params) {
  const user = USERS.get(Number(params.id));
  if (!user) return [404, errorEnvelope('NOT_FOUND', \`no user with id \${params.id}\`)];
  return [200, successEnvelope(user)];
});

app.route('GET', '/users', function (req, params) {
  const users = Array.from(USERS.values());
  return [200, successEnvelope(users, { count: users.length })];
});

module.exports = { app };
`;

const MAIN = `const { app } = require('./routes');

const [status, body] = app.handle('GET', '/users/1');
console.log('GET /users/1 ->', status, JSON.stringify(body));
`;

const TEST_CODE = `const { app } = require('./routes');
const { successEnvelope, errorEnvelope } = require('./envelope');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('successEnvelope wraps data', successEnvelope({ x: 1 }), { data: { x: 1 }, meta: {} });
check('successEnvelope keeps given meta', successEnvelope([1, 2], { count: 2 }), { data: [1, 2], meta: { count: 2 } });
check('errorEnvelope shape', errorEnvelope('BAD', 'oops'), { error: { code: 'BAD', message: 'oops' } });

let result = app.handle('GET', '/users/1');
check('found-user status', result[0], 200);
check('found-user data', result[1].data.name, 'Ama');

result = app.handle('GET', '/users/999');
check('missing-user status', result[0], 404);
check('missing-user has an error envelope', 'error' in result[1], true);
check('missing-user error code', result[1].error.code, 'NOT_FOUND');

result = app.handle('GET', '/users');
check('list endpoint reports count in meta', result[1].meta.count, 1);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-018',
  title: 'Response Envelope',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'API Design',
  tags: ['api-design', 'conventions'],
  prompt: 'Write two small envelope helpers (success and error), then use them consistently across two routes so every response — found or not — follows the same predictable shape.',
  hints: [
    '`successEnvelope` and `errorEnvelope` are each a one-line object literal — no logic beyond assembling the shape.',
    '`meta || {}` covers both "meta was never passed" (undefined) and "meta was passed as {}" — either way the result is an object, never undefined.',
    'Both routes call one of the two envelope helpers instead of returning a raw object — that consistency is the entire point of the pattern.',
    'The 404 case still returns a normal `[status, body]` pair, just with `errorEnvelope(...)` as the body instead of `successEnvelope(...)`.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('envelope.js', ENVELOPE_STARTER),
    pf('routes.js', ROUTES, { editable: false }),
    pf('main.js', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('envelope.js', ENVELOPE_SOLUTION),
    pf('routes.js', ROUTES, { editable: false }),
    pf('main.js', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Response Envelope', kind: 'node-js', entry: 'main.js', testCode: TEST_CODE }],
};

export default task;
