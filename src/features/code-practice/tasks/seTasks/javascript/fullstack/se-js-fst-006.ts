import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Login Form

A real form, submitted with a real click, sending its values through a real (stubbed) \`fetch\` call.
The backend (\`backend/routes.js\`) validates credentials against a small user store; the frontend
(\`frontend/app.js\`) reads the two inputs, posts them, and shows a welcome message.

Note: this sandbox's \`fetch\` stub only keys off the URL, not the request body — so the frontend
target can only exercise the SUCCESS path. The "wrong password" case is tested on the backend
target instead, where the real logic actually runs.
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

const USERS = `const USERS = { ama: 'hunter2', kofi: 'letmein' };

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
check('wrong password error', result[1].error, 'invalid credentials');

result = app.handle('POST', '/login', { username: 'nobody', password: 'anything' });
check('unknown user status', result[0], 401);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Login</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Log In</h1>
<input id="username" type="text" placeholder="Username" value="ama" />
<input id="password" type="password" placeholder="Password" value="hunter2" />
<button id="submit">Log In</button>
<div id="message"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
input { display: block; margin-bottom: 0.5rem; padding: 0.4rem; }
`;

const APP_JS_STARTER = `document.getElementById('submit').addEventListener('click', async function () {
  // TODO:
  //  - read #username's and #password's .value
  //  - fetch('/login', { method: 'POST', body: JSON.stringify({ username, password }) })
  //  - parse the JSON body
  //  - if the response was ok, set #message's textContent to 'Welcome, ' + username
  //  - otherwise set #message's textContent to data.error
});
`;

const APP_JS_SOLUTION = `document.getElementById('submit').addEventListener('click', async function () {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  const data = await res.json();
  if (res.ok) {
    document.getElementById('message').textContent = 'Welcome, ' + username;
  } else {
    document.getElementById('message').textContent = data.error;
  }
});
`;

const FRONTEND_TEST_CODE = `checkText('starts with no message', '#message', '');
await click('#submit');
checkText('shows a welcome message after login', '#message', 'Welcome, ama');
`;

const FETCH_FIXTURES = {
  '/login': { token: 'tok-ama' },
};

const task: ProjectTask = {
  id: 'se-js-fst-006',
  title: 'Login Form',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'Forms End-to-End',
  tags: ['forms', 'fetch', 'auth'],
  prompt: 'Wire up a real login form: the frontend reads two inputs and POSTs them, the backend validates against a small user store.',
  hints: [
    "backend/routes.js: `USERS[username] === password` is the whole check — success returns a token, anything else returns a 401.",
    "frontend/app.js: `document.getElementById('username').value` reads the current input text — do this INSIDE the click handler, not once at the top, so it reflects whatever the user typed.",
    '`JSON.stringify({ username, password })` as the fetch body — object shorthand builds `{username: username, password: password}` from the two local variables.',
    '`res.ok` is `true` for any 2xx status — checking it is the standard way to branch between the success and error paths after a fetch.',
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
