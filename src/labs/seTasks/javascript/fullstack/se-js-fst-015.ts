import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Login/Logout UI

A login button that fetches a token, and a logout button that clears it — no fetch involved in
logout at all, since forgetting a token locally doesn't need the server's help.
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

const USERS = `const USERS = { ama: 'hunter2' };

module.exports = { USERS };
`;

const ROUTES_STARTER = `const { App } = require('./framework');
const { USERS } = require('./users');

const app = new App();

app.route('POST', '/login', function (req, params) {
  // TODO: req.body has 'username' and 'password'. If USERS[username] === password, return
  // [200, { token: 'tok-' + username }]. Otherwise return [401, { error: 'invalid credentials' }].
});

module.exports = { app };
`;

const ROUTES_SOLUTION = `const { App } = require('./framework');
const { USERS } = require('./users');

const app = new App();

app.route('POST', '/login', function (req, params) {
  const { username, password } = req.body;
  if (USERS[username] === password) {
    return [200, { token: 'tok-' + username }];
  }
  return [401, { error: 'invalid credentials' }];
});

module.exports = { app };
`;

const BACKEND_TEST_CODE = `const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let result = app.handle('POST', '/login', { username: 'ama', password: 'hunter2' });
check('correct credentials status', result[0], 200);
check('correct credentials token', result[1].token, 'tok-ama');

result = app.handle('POST', '/login', { username: 'ama', password: 'wrong' });
check('wrong password status', result[0], 401);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Login/Logout</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Account</h1>
<div id="status">Not logged in</div>
<button id="login-btn">Log In</button>
<button id="logout-btn">Log Out</button>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
button { margin-right: 0.5rem; padding: 0.4rem 0.9rem; }
`;

const APP_JS_STARTER = `let token = null;
const statusEl = document.getElementById('status');

document.getElementById('login-btn').addEventListener('click', async function () {
  // TODO:
  //  - fetch('/login', { method: 'POST', body: JSON.stringify({ username: 'ama', password: 'hunter2' }) })
  //  - parse the JSON body and store its token in the \`token\` variable
  //  - set statusEl's textContent to 'Welcome, ama'
});

document.getElementById('logout-btn').addEventListener('click', function () {
  // TODO: set token back to null, and set statusEl's textContent to 'Not logged in'.
  // No fetch needed — logging out is purely local.
});
`;

const APP_JS_SOLUTION = `let token = null;
const statusEl = document.getElementById('status');

document.getElementById('login-btn').addEventListener('click', async function () {
  const res = await fetch('/login', { method: 'POST', body: JSON.stringify({ username: 'ama', password: 'hunter2' }) });
  const data = await res.json();
  token = data.token;
  statusEl.textContent = 'Welcome, ama';
});

document.getElementById('logout-btn').addEventListener('click', function () {
  token = null;
  statusEl.textContent = 'Not logged in';
});
`;

const FRONTEND_TEST_CODE = `checkText('starts logged out', '#status', 'Not logged in');

await click('#login-btn');
checkText('shows a welcome message after logging in', '#status', 'Welcome, ama');

await click('#logout-btn');
checkText('shows logged out again after logging out', '#status', 'Not logged in');
`;

const FETCH_FIXTURES = {
  '/login': { token: 'tok-ama' },
};

const task: ProjectTask = {
  id: 'se-js-fst-015',
  title: 'Login/Logout UI',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'Auth Flows',
  tags: ['auth', 'fetch', 'state'],
  prompt: 'Wire up a login button that fetches a token, and a logout button that clears it locally — logging out never needs to talk to the backend.',
  hints: [
    'The login handler is `async` (already declared that way) since it needs to `await` the fetch — the logout handler is plain and synchronous, since it does no I/O at all.',
    '`const data = await res.json(); token = data.token;` — store what the backend gave you, don\'t invent your own token.',
    'Logging out is just resetting local state: `token = null;` then updating the status text — no fetch call belongs in that handler.',
    'Both handlers end the same way conceptually: update `statusEl.textContent` to reflect whatever the CURRENT state is after the change.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/users.js', USERS, { editable: false }),
    pf('backend/routes.js', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/users.js', USERS, { editable: false }),
    pf('backend/routes.js', ROUTES_SOLUTION),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'backend', label: 'Backend', kind: 'node-js', entry: 'backend/routes.js', testCode: BACKEND_TEST_CODE },
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
