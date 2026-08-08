import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Request Metrics

Wrap every route call to record what real production systems watch first: how many requests came
in, how many failed, and split out per status code — the numbers behind a real uptime/error-rate
dashboard, collected here with nothing more than an object and a wrapper function.
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

const METRICS_STARTER = `const METRICS = { total: 0, byStatus: {} };

function trackMetrics(handler) {
  // TODO: return a new function(req, params) that calls handler(req, params), then:
  // - increments METRICS.total by 1
  // - increments METRICS.byStatus[status] by 1 (starting from 0 if this status hasn't been seen
  //   yet), where status is the first element of the [status, body] array handler returned
  // ...and finally returns handler's original [status, body] result unchanged.
}

function errorRate() {
  // TODO: return the fraction of tracked requests whose status was >= 400, as a number between 0
  // and 1. Return 0 if no requests have been tracked yet (avoid dividing by zero).
}

module.exports = { METRICS, trackMetrics, errorRate };
`;

const METRICS_SOLUTION = `const METRICS = { total: 0, byStatus: {} };

function trackMetrics(handler) {
  return function (req, params) {
    const result = handler(req, params);
    const status = result[0];
    METRICS.total += 1;
    METRICS.byStatus[status] = (METRICS.byStatus[status] || 0) + 1;
    return result;
  };
}

function errorRate() {
  if (METRICS.total === 0) return 0;
  const errors = Object.entries(METRICS.byStatus)
    .filter(([status]) => Number(status) >= 400)
    .reduce((sum, [, count]) => sum + count, 0);
  return errors / METRICS.total;
}

module.exports = { METRICS, trackMetrics, errorRate };
`;

const ROUTES = `const { App } = require('./framework');
const { trackMetrics } = require('./metrics');

const app = new App();

app.route('GET', '/items/:id', trackMetrics(function (req, params) {
  if (params.id === '1') return [200, { id: 1, name: 'Widget' }];
  return [404, { error: 'not found' }];
}));

module.exports = { app };
`;

const MAIN = `const { app } = require('./routes');
const { METRICS, errorRate } = require('./metrics');

app.handle('GET', '/items/1');
app.handle('GET', '/items/999');
console.log('METRICS:', JSON.stringify(METRICS));
console.log('errorRate:', errorRate());
`;

const TEST_CODE = `const { app } = require('./routes');
const { METRICS, errorRate } = require('./metrics');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('errorRate with no requests yet', errorRate(), 0);

app.handle('GET', '/items/1');
check('total increments after one request', METRICS.total, 1);
check('byStatus tracks the 200', METRICS.byStatus[200], 1);
check('error rate is 0 with only successes', errorRate(), 0);

app.handle('GET', '/items/999');
app.handle('GET', '/items/999');
check('total increments across multiple requests', METRICS.total, 3);
check('byStatus tracks the 404s separately', METRICS.byStatus[404], 2);

const rate = errorRate();
check('error rate reflects 2 errors out of 3', Math.abs(rate - 2 / 3) < 0.001, true);

const result = app.handle('GET', '/items/1');
check('the wrapped handler still returns its normal result', result, [200, { id: 1, name: 'Widget' }]);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-019',
  title: 'Request Metrics',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Observability',
  tags: ['observability', 'middleware'],
  prompt: 'Wrap a handler to record total requests and a per-status-code breakdown, then compute an error rate from those counts — the numbers a real dashboard is built on.',
  hints: [
    'Call `handler(req, params)` first and keep its result — you need the status code out of it before you can record anything.',
    '`result[0]` is the status code, since handlers return `[status, body]` pairs.',
    '`METRICS.byStatus[status] = (METRICS.byStatus[status] || 0) + 1` is the same "increment or start at zero" pattern as any other frequency counter — note that object keys are always strings, so `status` gets coerced automatically.',
    'Guard `errorRate` against dividing by zero — check `if (METRICS.total === 0) return 0;` before computing anything.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('metrics.js', METRICS_STARTER),
    pf('routes.js', ROUTES, { editable: false }),
    pf('main.js', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('metrics.js', METRICS_SOLUTION),
    pf('routes.js', ROUTES, { editable: false }),
    pf('main.js', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Request Metrics', kind: 'node-js', entry: 'main.js', testCode: TEST_CODE }],
};

export default task;
