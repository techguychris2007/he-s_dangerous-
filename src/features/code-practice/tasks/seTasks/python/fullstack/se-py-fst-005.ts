import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Login Form

A real form, submitted with a real click, sending its values through a real (stubbed) \`fetch\` call.
The backend (\`backend/routes.py\`) validates credentials against a small user store; the frontend
(\`frontend/app.js\`) reads the two inputs, posts them, and shows a welcome message.

Note: this sandbox's \`fetch\` stub only keys off the URL, not the request body — so the frontend
target can only exercise the SUCCESS path (it always gets back the same fixed response for
\`/login\`). The "wrong password" case is tested on the backend target instead, where the real logic
actually runs.
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

const USERS = `USERS = {"ama": "hunter2", "kofi": "letmein"}
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
__check__("wrong password error", body.get("error"), "invalid credentials")

status, body = app.handle('POST', '/login', {"username": "nobody", "password": "anything"})
__check__("unknown user status", status, 401)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
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
  id: 'se-py-fst-005',
  title: 'Login Form',
  difficulty: 'Hard',
  language: 'python',
  track: 'fullstack',
  category: 'Forms End-to-End',
  tags: ['forms', 'fetch', 'auth'],
  prompt: 'Wire up a real login form: the frontend reads two inputs and POSTs them, the backend validates against a small user store.',
  hints: [
    'backend/routes.py: `USERS.get(username) == password` is the whole check — success returns a token, anything else returns a 401.',
    'frontend/app.js: `document.getElementById(\'username\').value` reads the current input text — do this INSIDE the click handler, not once at the top, so it reflects whatever the user typed.',
    '`JSON.stringify({ username, password })` as the fetch body — object shorthand builds `{username: username, password: password}` from the two local variables.',
    '`res.ok` is `true` for any 2xx status — checking it is the standard way to branch between the success and error paths after a fetch.',
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
