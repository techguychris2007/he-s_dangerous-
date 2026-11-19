import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Book Search

Two connected halves, graded independently: a JS backend (\`backend/\`) exposing a search route, and
a plain JS frontend (\`frontend/\`) that fetches and renders the results.

They don't share a real network connection in this sandbox — the frontend's \`fetch\` is stubbed with
a fixed response matching exactly what the backend, correctly implemented, would return.
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

const BOOKS = `const BOOKS = [
  { id: 1, title: 'The Great Mystery', author: 'A. Writer' },
  { id: 2, title: 'Mystery of the Deep', author: 'B. Author' },
  { id: 3, title: 'Simple Cookbook', author: 'C. Chef' },
];

function searchBooks(query) {
  const q = query.toLowerCase();
  return BOOKS.filter((b) => b.title.toLowerCase().includes(q));
}

module.exports = { searchBooks };
`;

const ROUTES_STARTER = `const { App } = require('./framework');
const { searchBooks } = require('./books');

const app = new App();

app.route('GET', '/books/:query', function (req, params) {
  // TODO: return [200, { results: searchBooks(params.query) }]
});

module.exports = { app };
`;

const ROUTES_SOLUTION = `const { App } = require('./framework');
const { searchBooks } = require('./books');

const app = new App();

app.route('GET', '/books/:query', function (req, params) {
  return [200, { results: searchBooks(params.query) }];
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

const result = app.handle('GET', '/books/mystery');
check('status', result[0], 200);
check('finds both mystery books', result[1].results.length, 2);
check('first result title', result[1].results[0].title, 'The Great Mystery');

console.log('__RESULT__ ' + passed + '/' + total);
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Book Search</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Books matching "mystery"</h1>
<div id="count"></div>
<ul id="results"></ul>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
#count { font-weight: bold; margin-bottom: 0.5rem; }
`;

const APP_JS_STARTER = `async function loadResults() {
  // TODO:
  //  - fetch('/books/mystery') and parse the JSON body
  //  - set #count's textContent to "<N> results" where N is the number of results
  //  - for each result, append an <li> to #results with the book's title as its text
}

loadResults();
`;

const APP_JS_SOLUTION = `async function loadResults() {
  const res = await fetch('/books/mystery');
  const data = await res.json();
  const results = data.results;
  document.getElementById('count').textContent = results.length + ' results';
  const list = document.getElementById('results');
  for (const book of results) {
    const li = document.createElement('li');
    li.textContent = book.title;
    list.appendChild(li);
  }
}

loadResults();
`;

const FRONTEND_TEST_CODE = `checkText('renders result count', '#count', '2 results');
checkCount('renders one li per result', '#results li', 2);
checkText('first result title', '#results li:first-child', 'The Great Mystery');
`;

const FETCH_FIXTURES = {
  '/books/mystery': {
    results: [
      { id: 1, title: 'The Great Mystery', author: 'A. Writer' },
      { id: 2, title: 'Mystery of the Deep', author: 'B. Author' },
    ],
  },
};

const task: ProjectTask = {
  id: 'se-js-fst-002',
  title: 'Book Search',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'JSON APIs + Client',
  tags: ['fetch', 'rendering', 'search'],
  prompt:
    'Finish both halves of a small search feature. The backend (`backend/routes.js`) returns books ' +
    'matching a query via `GET /books/:query`; the frontend (`frontend/app.js`) fetches that endpoint ' +
    'and renders the results.',
  hints: [
    'backend/routes.js: `[200, { results: searchBooks(params.query) }]` — searchBooks() is already written in books.js.',
    "frontend/app.js: `const res = await fetch('/books/mystery'); const data = await res.json();` gets you the same shape the backend returns.",
    "Build each `<li>` with `document.createElement('li')` and set `.textContent` to the title.",
    'Check the Live Preview pane below the console once both halves compile — that\'s the fastest way to see what\'s actually rendering.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/books.js', BOOKS, { editable: false }),
    pf('backend/routes.js', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/books.js', BOOKS, { editable: false }),
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
