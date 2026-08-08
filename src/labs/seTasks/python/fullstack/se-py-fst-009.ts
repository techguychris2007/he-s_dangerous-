import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Weather Widget

Fetch on page load (not on a click) and render straight into the DOM — the simplest possible
"widget," and the shape almost every dashboard tile starts as: one fetch, one render.
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

const WEATHER_DATA = `WEATHER = {
    "accra": {"temp": 29, "condition": "Sunny"},
    "london": {"temp": 14, "condition": "Cloudy"},
}
`;

const ROUTES_STARTER = `from framework import App
from weather_data import WEATHER

app = App()


@app.route('/weather/<city>', methods=('GET',))
def get_weather(req, city):
    """Return (200, WEATHER[city]) if city is in WEATHER, else (404, {"error": "city not found"})."""
    # TODO
    pass
`;

const ROUTES_SOLUTION = `from framework import App
from weather_data import WEATHER

app = App()


@app.route('/weather/<city>', methods=('GET',))
def get_weather(req, city):
    if city not in WEATHER:
        return (404, {"error": "city not found"})
    return (200, WEATHER[city])
`;

const BACKEND_TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('GET', '/weather/accra')
__check__("known city status", status, 200)
__check__("known city temp", body.get("temp"), 29)
__check__("known city condition", body.get("condition"), "Sunny")

status, body = app.handle('GET', '/weather/atlantis')
__check__("unknown city status", status, 404)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
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
  id: 'se-py-fst-009',
  title: 'Weather Widget',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'Fetch Integration',
  tags: ['fetch', 'rendering'],
  prompt: 'A backend route returns weather for a known city (404 for an unknown one); the frontend fetches on page load — not on a click — and renders straight into the page.',
  hints: [
    'backend/routes.py: `if city not in WEATHER: return (404, ...)` first, then the success case is a one-liner.',
    'frontend/app.js: `loadWeather()` is already called at the bottom of the file — it just needs a body.',
    '`data.temp + \'°C\'` builds the display string — string concatenation coerces the number automatically.',
    'This fetch happens once, immediately, with no button or event listener involved — the whole page "loads its own data" the moment the script runs.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/weather_data.py', WEATHER_DATA, { editable: false }),
    pf('backend/routes.py', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/weather_data.py', WEATHER_DATA, { editable: false }),
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
