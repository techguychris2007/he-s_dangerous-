import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Task API

The JavaScript twin of the Python backend task: a tiny hand-rolled router (\`framework.js\`, given) and a
task-list API built on it, in the CommonJS shape real Node backends use (\`require\`/\`module.exports\`,
not ESM \`import\`).
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

const MODELS_STARTER = `const TASKS = new Map();
let nextId = 1;

function createTask(title) {
  // TODO: build { id: nextId, title, done: false }, store it in TASKS keyed by id, increment nextId, return it
}

function listTasks() {
  // TODO: return every task in TASKS as an array, in insertion order
}

function deleteTask(id) {
  // TODO: remove the task with this id (coerce to Number) from TASKS. Return true if it existed, false if not.
}

module.exports = { createTask, listTasks, deleteTask };
`;

const MODELS_SOLUTION = `const TASKS = new Map();
let nextId = 1;

function createTask(title) {
  const task = { id: nextId, title, done: false };
  TASKS.set(nextId, task);
  nextId++;
  return task;
}

function listTasks() {
  return Array.from(TASKS.values());
}

function deleteTask(id) {
  return TASKS.delete(Number(id));
}

module.exports = { createTask, listTasks, deleteTask };
`;

const ROUTES_STARTER = `const { App } = require('./framework');
const { createTask, listTasks, deleteTask } = require('./models');

const app = new App();

app.route('GET', '/tasks', function (req, params) {
  // TODO: return [200, { tasks: listTasks() }]
});

app.route('POST', '/tasks', function (req, params) {
  // TODO: return [201, createTask(req.body.title)]
});

app.route('DELETE', '/tasks/:id', function (req, params) {
  // TODO: if deleteTask(params.id) return [200, { deleted: true }], else [404, { error: 'not found' }]
});

module.exports = { app };
`;

const ROUTES_SOLUTION = `const { App } = require('./framework');
const { createTask, listTasks, deleteTask } = require('./models');

const app = new App();

app.route('GET', '/tasks', function (req, params) {
  return [200, { tasks: listTasks() }];
});

app.route('POST', '/tasks', function (req, params) {
  return [201, createTask(req.body.title)];
});

app.route('DELETE', '/tasks/:id', function (req, params) {
  if (deleteTask(params.id)) return [200, { deleted: true }];
  return [404, { error: 'not found' }];
});

module.exports = { app };
`;

const MAIN = `const { app } = require('./routes');

const [status, body] = app.handle('GET', '/tasks');
console.log('GET /tasks ->', status, JSON.stringify(body));
`;

const TEST_CODE = `const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let result = app.handle('GET', '/tasks');
check('empty list status', result[0], 200);
check('empty list body', result[1], { tasks: [] });

result = app.handle('POST', '/tasks', { title: 'Buy milk' });
check('create status', result[0], 201);
check('create title', result[1].title, 'Buy milk');
check('create id', result[1].id, 1);

result = app.handle('GET', '/tasks');
check('list has one', result[1].tasks.length, 1);

result = app.handle('DELETE', '/tasks/1');
check('delete status', result[0], 200);

result = app.handle('DELETE', '/tasks/999');
check('delete missing status', result[0], 404);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-001',
  title: 'Task API',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'HTTP & Routing',
  tags: ['routing', 'rest'],
  prompt:
    'A tiny router is already written in `framework.js` — real `:param` route matching, dispatched ' +
    'through `app.handle(method, path, body)`. Build a task-list API on top of it: an in-memory data ' +
    'layer in `models.js`, and REST-shaped routes (list, create, delete) in `routes.js`.',
  hints: [
    'models.js: build `{ id: nextId, title, done: false }`, `TASKS.set(nextId, task)`, then `nextId++`, then return `task`.',
    'Each route handler returns a `[status, body]` two-element array — that IS the whole response.',
    'DELETE /tasks/:id — `params.id` arrives as the exact string matched from the URL; `deleteTask` should Number() it before using it as the Map key.',
    '`TASKS.delete(...)` already returns true/false for "did this key exist" — no extra bookkeeping needed.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('models.js', MODELS_STARTER),
    pf('routes.js', ROUTES_STARTER),
    pf('main.js', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('models.js', MODELS_SOLUTION),
    pf('routes.js', ROUTES_SOLUTION),
    pf('main.js', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Task API', kind: 'node-js', entry: 'main.js', testCode: TEST_CODE }],
};

export default task;
