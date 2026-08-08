import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Weather Widget

Fetch on page load (not on a click) and render straight into the DOM — the simplest possible
"widget," and the shape almost every dashboard tile starts as: one fetch, one render.
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

const WEATHER_DATA = `const WEATHER = {
  accra: { temp: 29, condition: 'Sunny' },
  london: { temp: 14, condition: 'Cloudy' },
};

module.exports = { WEATHER };
`;

const ROUTES_STARTER = `const { App } = require('./framework');
const { WEATHER } = require('./weather_data');

const app = new App();

app.route('GET', '/weather/:city', function (req, params) {
  // TODO: return [200, WEATHER[params.city]] if it exists, else [404, { error: 'city not found' }]
});

module.exports = { app };
`;

const ROUTES_SOLUTION = `const { App } = require('./framework');
const { WEATHER } = require('./weather_data');

const app = new App();

app.route('GET', '/weather/:city', function (req, params) {
  const data = WEATHER[params.city];
  if (!data) return [404, { error: 'city not found' }];
  return [200, data];
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

let result = app.handle('GET', '/weather/accra');
check('known city status', result[0], 200);
check('known city temp', result[1].temp, 29);
check('known city condition', result[1].condition, 'Sunny');

result = app.handle('GET', '/weather/atlantis');
check('unknown city status', result[0], 404);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Weather Widget</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Weather in Accra</h1>
<div id="widget">
<span id="temp"></span>
<span id="condition"></span>
</div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
#widget { font-size: 1.5rem; }
`;

const APP_JS_STARTER = `async function loadWeather() {
  // TODO:
  //  - fetch('/weather/accra') and parse the JSON body
  //  - set #temp's textContent to "<N>°C" (e.g. "29°C")
  //  - set #condition's textContent to the condition string
}

loadWeather();
`;

const APP_JS_SOLUTION = `async function loadWeather() {
  const res = await fetch('/weather/accra');
  const data = await res.json();
  document.getElementById('temp').textContent = data.temp + '°C';
  document.getElementById('condition').textContent = data.condition;
}

loadWeather();
`;

const FRONTEND_TEST_CODE = `checkText('renders the temperature', '#temp', '29°C');
checkText('renders the condition', '#condition', 'Sunny');
`;

const FETCH_FIXTURES = {
  '/weather/accra': { temp: 29, condition: 'Sunny' },
};

const task: ProjectTask = {
  id: 'se-js-fst-009',
  title: 'Weather Widget',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'Fetch Integration',
  tags: ['fetch', 'rendering'],
  prompt: 'A backend route returns weather for a known city (404 for an unknown one); the frontend fetches on page load — not on a click — and renders straight into the page.',
  hints: [
    "backend/routes.js: `const data = WEATHER[params.city]; if (!data) return [404, ...];` — the success case is a one-liner after that.",
    "frontend/app.js: `loadWeather()` is already called at the bottom of the file — it just needs a body.",
    "`data.temp + '°C'` builds the display string — string concatenation coerces the number automatically.",
    'This fetch happens once, immediately, with no button or event listener involved — the whole page "loads its own data" the moment the script runs.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/weather_data.js', WEATHER_DATA, { editable: false }),
    pf('backend/routes.js', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/weather_data.js', WEATHER_DATA, { editable: false }),
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
