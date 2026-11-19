import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Multi-Endpoint Dashboard

A real page rarely needs just one endpoint — fetch TWO independent routes on load and render each
into its own section, the shape a real dashboard's landing page takes.
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

const DASHBOARD_DATA = `const STATS = { users: 1204, revenue: 5830 };
const NOTIFICATIONS = ['Server restarted', 'New signup: Ama', 'Backup completed'];

module.exports = { STATS, NOTIFICATIONS };
`;

const ROUTES_STARTER = `const { App } = require('./framework');
const { STATS, NOTIFICATIONS } = require('./dashboard_data');

const app = new App();

app.route('GET', '/stats', function (req, params) {
  // TODO: return [200, STATS]
});

app.route('GET', '/notifications', function (req, params) {
  // TODO: return [200, { notifications: NOTIFICATIONS }]
});

module.exports = { app };
`;

const ROUTES_SOLUTION = `const { App } = require('./framework');
const { STATS, NOTIFICATIONS } = require('./dashboard_data');

const app = new App();

app.route('GET', '/stats', function (req, params) {
  return [200, STATS];
});

app.route('GET', '/notifications', function (req, params) {
  return [200, { notifications: NOTIFICATIONS }];
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

let result = app.handle('GET', '/stats');
check('stats status', result[0], 200);
check('stats users', result[1].users, 1204);
check('stats revenue', result[1].revenue, 5830);

result = app.handle('GET', '/notifications');
check('notifications status', result[0], 200);
check('notifications count', result[1].notifications.length, 3);

console.log('__RESULT__ ' + passed + '/' + total);
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
  id: 'se-js-fst-010',
  title: 'Multi-Endpoint Dashboard',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'Fetch Integration',
  tags: ['fetch', 'rendering'],
  prompt: 'Fetch two independent endpoints on page load and render each into its own section — a small dashboard, not just a single widget.',
  hints: [
    'Both backend routes are one-liners returning already-assembled data.',
    'The two fetches in app.js are independent — `await` the first one fully (including reading its JSON) before starting the second, or do them however feels natural; order doesn\'t matter for correctness here.',
    "String concatenation builds the display text: `'Users: ' + stats.users` and `'Revenue: $' + stats.revenue`.",
    "The notifications list uses the exact same `document.createElement('li')` + `appendChild` pattern you've used in earlier fetch-and-render tasks.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/dashboard_data.js', DASHBOARD_DATA, { editable: false }),
    pf('backend/routes.js', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/dashboard_data.js', DASHBOARD_DATA, { editable: false }),
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
