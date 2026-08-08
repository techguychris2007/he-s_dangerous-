import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Logging Middleware

Middleware, in its simplest form: a function that wraps a route handler to add behavior around it
(here, recording every call) without the handler itself knowing anything happened — the same
"function that takes a function and returns a function" shape as any other wrapper, applied to a
web handler instead of an arbitrary function.
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

const MIDDLEWARE_STARTER = `const LOG = [];

function withLogging(handler) {
  // TODO: return a new function(req, params) that, before calling handler(req, params), pushes
  // \`\${req.method} \${req.path}\` onto LOG. Then calls handler and returns its result unchanged.
}

module.exports = { withLogging, LOG };
`;

const MIDDLEWARE_SOLUTION = `const LOG = [];

function withLogging(handler) {
  return function (req, params) {
    LOG.push(\`\${req.method} \${req.path}\`);
    return handler(req, params);
  };
}

module.exports = { withLogging, LOG };
`;

const ROUTES = `const { App } = require('./framework');
const { withLogging } = require('./middleware');

const app = new App();

app.route('GET', '/ping', withLogging(function (req, params) {
  return [200, { pong: true }];
}));

module.exports = { app };
`;

const MAIN = `const { app } = require('./routes');
const { LOG } = require('./middleware');

app.handle('GET', '/ping');
console.log('LOG:', LOG);
`;

const TEST_CODE = `const { app } = require('./routes');
const { LOG } = require('./middleware');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('log starts empty', LOG.length, 0);

let result = app.handle('GET', '/ping');
check('wrapped handler still responds correctly', result, [200, { pong: true }]);
check('logs the request after one call', LOG, ['GET /ping']);

app.handle('GET', '/ping');
check('logs accumulate across calls', LOG, ['GET /ping', 'GET /ping']);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-003',
  title: 'Logging Middleware',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Middleware',
  tags: ['middleware', 'closures'],
  prompt: 'Write a middleware wrapper that logs every request that passes through a wrapped handler, without changing what the handler itself returns.',
  hints: [
    '`withLogging` takes a handler and returns a NEW function with the same `(req, params)` signature — that returned function is what gets registered with `app.route`.',
    'Log BEFORE calling through: `LOG.push(...)`, then `return handler(req, params);`.',
    'Template literals make the log line easy: `` `${req.method} ${req.path}` ``.',
    '`app.route(\'GET\', \'/ping\', withLogging(function (req, params) {...}))` — the wrapping happens once, at registration time, not on every request.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('middleware.js', MIDDLEWARE_STARTER),
    pf('routes.js', ROUTES, { editable: false }),
    pf('main.js', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('middleware.js', MIDDLEWARE_SOLUTION),
    pf('routes.js', ROUTES, { editable: false }),
    pf('main.js', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Logging Middleware', kind: 'node-js', entry: 'main.js', testCode: TEST_CODE }],
};

export default task;
