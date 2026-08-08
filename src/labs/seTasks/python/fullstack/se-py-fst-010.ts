import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Multi-Endpoint Dashboard

A real page rarely needs just one endpoint — fetch TWO independent routes on load and render each
into its own section, the shape a real dashboard's landing page takes.
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

const DASHBOARD_DATA = `STATS = {"users": 1204, "revenue": 5830}
NOTIFICATIONS = ["Server restarted", "New signup: Ama", "Backup completed"]
`;

const ROUTES_STARTER = `from framework import App
from dashboard_data import STATS, NOTIFICATIONS

app = App()


@app.route('/stats', methods=('GET',))
def get_stats(req):
    """Return (200, STATS)."""
    # TODO
    pass


@app.route('/notifications', methods=('GET',))
def get_notifications(req):
    """Return (200, {"notifications": NOTIFICATIONS})."""
    # TODO
    pass
`;

const ROUTES_SOLUTION = `from framework import App
from dashboard_data import STATS, NOTIFICATIONS

app = App()


@app.route('/stats', methods=('GET',))
def get_stats(req):
    return (200, STATS)


@app.route('/notifications', methods=('GET',))
def get_notifications(req):
    return (200, {"notifications": NOTIFICATIONS})
`;

const BACKEND_TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('GET', '/stats')
__check__("stats status", status, 200)
__check__("stats users", body.get("users"), 1204)
__check__("stats revenue", body.get("revenue"), 5830)

status, body = app.handle('GET', '/notifications')
__check__("notifications status", status, 200)
__check__("notifications count", len(body.get("notifications", [])), 3)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Dashboard</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Dashboard</h1>
<section>
<h2>Stats</h2>
<div id="users"></div>
<div id="revenue"></div>
</section>
<section>
<h2>Notifications</h2>
<ul id="notifications"></ul>
</section>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
section { margin-bottom: 1.5rem; }
`;

const APP_JS_STARTER = `async function loadDashboard() {
  // TODO:
  //  - fetch('/stats') and parse the JSON body; set #users' textContent to "Users: <N>" and
  //    #revenue's textContent to "Revenue: $<N>"
  //  - fetch('/notifications') and parse the JSON body; for each notification, append an <li> to
  //    #notifications with the notification text
}

loadDashboard();
`;

const APP_JS_SOLUTION = `async function loadDashboard() {
  const statsRes = await fetch('/stats');
  const stats = await statsRes.json();
  document.getElementById('users').textContent = 'Users: ' + stats.users;
  document.getElementById('revenue').textContent = 'Revenue: $' + stats.revenue;

  const notifRes = await fetch('/notifications');
  const notifData = await notifRes.json();
  const list = document.getElementById('notifications');
  for (const note of notifData.notifications) {
    const li = document.createElement('li');
    li.textContent = note;
    list.appendChild(li);
  }
}

loadDashboard();
`;

const FRONTEND_TEST_CODE = `checkText('renders user count', '#users', 'Users: 1204');
checkText('renders revenue', '#revenue', 'Revenue: $5830');
checkCount('renders one li per notification', '#notifications li', 3);
checkText('first notification text', '#notifications li:first-child', 'Server restarted');
`;

const FETCH_FIXTURES = {
  '/stats': { users: 1204, revenue: 5830 },
  '/notifications': { notifications: ['Server restarted', 'New signup: Ama', 'Backup completed'] },
};

const task: ProjectTask = {
  id: 'se-py-fst-010',
  title: 'Multi-Endpoint Dashboard',
  difficulty: 'Hard',
  language: 'python',
  track: 'fullstack',
  category: 'Fetch Integration',
  tags: ['fetch', 'rendering'],
  prompt: 'Fetch two independent endpoints on page load and render each into its own section — a small dashboard, not just a single widget.',
  hints: [
    'Both backend routes are one-liners returning already-assembled data — `get_stats` and `get_notifications` just need `return (200, ...)`.',
    'The two fetches in app.js are independent — `await` the first one fully (including reading its JSON) before starting the second, or do them however feels natural; order doesn\'t matter for correctness here.',
    "String concatenation builds the display text: `'Users: ' + stats.users` and `'Revenue: $' + stats.revenue`.",
    'The notifications list uses the exact same `document.createElement(\'li\')` + `appendChild` pattern you\'ve used in earlier fetch-and-render tasks.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/dashboard_data.py', DASHBOARD_DATA, { editable: false }),
    pf('backend/routes.py', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/dashboard_data.py', DASHBOARD_DATA, { editable: false }),
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
