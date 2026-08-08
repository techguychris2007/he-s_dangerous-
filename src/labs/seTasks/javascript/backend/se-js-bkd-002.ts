import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Blog Post API

The same tiny \`framework.js\` router as the Task API, this time with a route that has TWO different
methods on the same path (\`GET\`/\`PUT\` on \`/posts/:id\`) — routing decisions have to consider both
the path AND the method together.
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

const MODELS = `const POSTS = new Map([
  [1, { id: 1, title: 'Hello World', body: 'First post' }],
  [2, { id: 2, title: 'Second Post', body: 'More content' }],
]);

function getPost(id) {
  return POSTS.get(Number(id)) || null;
}

function updatePost(id, changes) {
  const post = POSTS.get(Number(id));
  if (!post) return null;
  Object.assign(post, changes);
  return post;
}

module.exports = { getPost, updatePost };
`;

const ROUTES_STARTER = `const { App } = require('./framework');
const { getPost, updatePost } = require('./models');

const app = new App();

app.route('GET', '/posts/:id', function (req, params) {
  // TODO: return [200, post] if it exists, or [404, { error: 'not found' }] if it doesn't.
});

app.route('PUT', '/posts/:id', function (req, params) {
  // TODO: update the post at params.id with req.body (updatePost already does a partial update).
  // Return [200, the updated post] if it existed, or [404, { error: 'not found' }] if it didn't.
});

module.exports = { app };
`;

const ROUTES_SOLUTION = `const { App } = require('./framework');
const { getPost, updatePost } = require('./models');

const app = new App();

app.route('GET', '/posts/:id', function (req, params) {
  const post = getPost(params.id);
  if (!post) return [404, { error: 'not found' }];
  return [200, post];
});

app.route('PUT', '/posts/:id', function (req, params) {
  const post = updatePost(params.id, req.body);
  if (!post) return [404, { error: 'not found' }];
  return [200, post];
});

module.exports = { app };
`;

const MAIN = `const { app } = require('./routes');

const [status, body] = app.handle('GET', '/posts/1');
console.log('GET /posts/1 ->', status, JSON.stringify(body));
`;

const TEST_CODE = `const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let result = app.handle('GET', '/posts/1');
check('get existing post status', result[0], 200);
check('get existing post title', result[1].title, 'Hello World');

result = app.handle('GET', '/posts/999');
check('get missing post status', result[0], 404);

result = app.handle('PUT', '/posts/2', { title: 'Updated Title' });
check('update post status', result[0], 200);
check('update post changes title', result[1].title, 'Updated Title');
check('update post keeps other fields', result[1].body, 'More content');

result = app.handle('PUT', '/posts/999', { title: 'Nope' });
check('update missing post status', result[0], 404);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-002',
  title: 'Blog Post API',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'HTTP & Routing',
  tags: ['routing', 'rest'],
  prompt: 'Two routes sharing the same path (`/posts/:id`) but different HTTP methods — GET to read, PUT to partially update. models.js already has getPost/updatePost written.',
  hints: [
    'Both routes are registered on the same path string but different methods — the router dispatches on method + path together, so this is unambiguous.',
    'The pattern is identical in both handlers: call the model function, check for a falsy result, and return the matching [status, body] pair.',
    '`updatePost` already returns `null` for a missing id, exactly like `getPost` does — both routes can check with the same `if (!post)`.',
    '`req.body` IS the changes object already — `updatePost(params.id, req.body)` needs no extra unpacking.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('models.js', MODELS, { editable: false }),
    pf('routes.js', ROUTES_STARTER),
    pf('main.js', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.js', FRAMEWORK, { editable: false }),
    pf('models.js', MODELS, { editable: false }),
    pf('routes.js', ROUTES_SOLUTION),
    pf('main.js', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Blog Post API', kind: 'node-js', entry: 'main.js', testCode: TEST_CODE }],
};

export default task;
