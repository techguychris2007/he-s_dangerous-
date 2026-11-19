import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Login/Logout UI

A login button that fetches a token from the backend, and a logout button that clears it — no
fetch involved in logout at all, since forgetting a token locally doesn't need the server's help.
`;

const FRAMEWORK = `class Request:
    def __init__(self, method, path, body=None):
        self.method = method
        self.path = path
        self.body = body or {}


class App:
    def __init__(self):
        self.routes = []

    def route(self, path, methods=('GET',)):
        def decorator(fn):
            for m in methods:
                self.routes.append((m, path, fn))
            return fn
        return decorator

    def handle(self, method, path, body=None):
        req = Request(method, path, body)
        for m, pattern, fn in self.routes:
            if m != method:
                continue
            params = _match(pattern, path)
            if params is not None:
                return fn(req, **params)
        return (404, {"error": "not found"})


def _match(pattern, path):
    p_parts = pattern.strip('/').split('/')
    a_parts = path.strip('/').split('/')
    if len(p_parts) != len(a_parts):
        return None
    params = {}
    for p, a in zip(p_parts, a_parts):
        if p.startswith('<') and p.endswith('>'):
            params[p[1:-1]] = a
        elif p != a:
            return None
    return params
`;

const USERS = `USERS = {"ama": "hunter2"}
`;

const ROUTES_STARTER = `from framework import App
from users import USERS

app = App()


@app.route('/login', methods=('POST',))
def login(req):
    """req.body has 'username' and 'password'. If USERS.get(username) == password, return
    (200, {"token": "tok-" + username}). Otherwise return (401, {"error": "invalid credentials"})."""
    # TODO
    pass
`;

const ROUTES_SOLUTION = `from framework import App
from users import USERS

app = App()


@app.route('/login', methods=('POST',))
def login(req):
    username = req.body.get('username')
    password = req.body.get('password')
    if USERS.get(username) == password:
        return (200, {"token": "tok-" + username})
    return (401, {"error": "invalid credentials"})
`;

const BACKEND_TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('POST', '/login', {"username": "ama", "password": "hunter2"})
__check__("correct credentials status", status, 200)
__check__("correct credentials token", body.get("token"), "tok-ama")

status, body = app.handle('POST', '/login', {"username": "ama", "password": "wrong"})
__check__("wrong password status", status, 401)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
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
  id: 'se-py-fst-015',
  title: 'Login/Logout UI',
  difficulty: 'Medium',
  language: 'python',
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
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/users.py', USERS, { editable: false }),
    pf('backend/routes.py', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/users.py', USERS, { editable: false }),
    pf('backend/routes.py', ROUTES_SOLUTION),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'backend', label: 'Backend', kind: 'python', entry: 'backend/routes.py', testCode: BACKEND_TEST_CODE },
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
