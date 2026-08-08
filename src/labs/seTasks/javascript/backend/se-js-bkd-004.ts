import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Auth Middleware

A second middleware, this time one that can SHORT-CIRCUIT: if the request isn't authorized, the
wrapped handler never runs at all, and the middleware returns its own \`401\` response instead.
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

const MIDDLEWARE_STARTER = `const VALID_TOKEN = 'secret123';

function requireAuth(handler) {
  // TODO: return a new function(req, params) that checks req.body.token. If it doesn't equal
  // VALID_TOKEN, return [401, { error: 'unauthorized' }] WITHOUT calling handler. Otherwise call
  // handler(req, params) and return its result.
}

module.exports = { requireAuth };
`;

const MIDDLEWARE_SOLUTION = `const VALID_TOKEN = 'secret123';

function requireAuth(handler) {
  return function (req, params) {
    if (req.body.token !== VALID_TOKEN) {
      return [401, { error: 'unauthorized' }];
    }
    return handler(req, params);
  };
}

module.exports = { requireAuth };
`;

const ROUTES = `const { App } = require('./framework');
const { requireAuth } = require('./middleware');

const app = new App();

app.route('POST', '/secret', requireAuth(function (req, params) {
  return [200, { secret: 'the cake is a lie' }];
}));

module.exports = { app };
`;

const MAIN = `const { app } = require('./routes');

let [status, body] = app.handle('POST', '/secret', { token: 'secret123' });
console.log('authorized ->', status, JSON.stringify(body));
[status, body] = app.handle('POST', '/secret', { token: 'wrong' });
console.log('unauthorized ->', status, JSON.stringify(body));
`;

const TEST_CODE = `const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let result = app.handle('POST', '/secret', { token: 'secret123' });
check('correct token status', result[0], 200);
check('correct token returns the secret', result[1].secret, 'the cake is a lie');

result = app.handle('POST', '/secret', { token: 'wrong' });
check('wrong token status', result[0], 401);
check('wrong token error body', result[1], { error: 'unauthorized' });

result = app.handle('POST', '/secret', {});
check('missing token status', result[0], 401);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-004',
  title: 'Auth Middleware',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Middleware',
  tags: ['middleware', 'auth'],
  prompt: 'Write a middleware wrapper that rejects unauthorized requests with a 401 before the wrapped handler ever runs.',
  hints: [
    'Same wrapper shape as any middleware — the difference is a check at the top that can return early instead of always calling through.',
    "Check `if (req.body.token !== VALID_TOKEN)` and return the 401 pair immediately — the key part is NOT calling `handler` in that branch.",
    'Only reach `return handler(req, params);` in the success path, after the check passes.',
    "A request with no token at all still works — `req.body.token` is `undefined`, which is never `=== VALID_TOKEN`, so it's correctly rejected without any special-casing.",
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
  targets: [{ id: 'main', label: 'Auth Middleware', kind: 'node-js', entry: 'main.js', testCode: TEST_CODE }],
};

export default task;
