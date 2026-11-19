import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Book Search

Two connected halves, graded independently: a Python backend (\`backend/\`) exposing a search route,
and a plain JS frontend (\`frontend/\`) that fetches and renders the results.

They don't share a real network connection in this sandbox — the frontend's \`fetch\` is stubbed with
a fixed response matching exactly what the backend, correctly implemented, would return.
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

const BOOKS = `BOOKS = [
    {"id": 1, "title": "The Great Mystery", "author": "A. Writer"},
    {"id": 2, "title": "Mystery of the Deep", "author": "B. Author"},
    {"id": 3, "title": "Simple Cookbook", "author": "C. Chef"},
]


def search_books(query):
    q = query.lower()
    return [b for b in BOOKS if q in b["title"].lower()]
`;

const ROUTES_STARTER = `from framework import App
from books import search_books

app = App()


@app.route('/books/<query>', methods=('GET',))
def search(req, query):
    """Return (200, {"results": [...]}) listing every book matching query via search_books()."""
    # TODO
    pass
`;

const ROUTES_SOLUTION = `from framework import App
from books import search_books

app = App()


@app.route('/books/<query>', methods=('GET',))
def search(req, query):
    return (200, {"results": search_books(query)})
`;

const BACKEND_TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('GET', '/books/mystery')
__check__("status", status, 200)
__check__("finds both mystery books", len(body.get("results", [])), 2)
__check__("first result title", body["results"][0]["title"], "The Great Mystery")

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
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
  id: 'se-py-fst-002',
  title: 'Book Search',
  difficulty: 'Hard',
  language: 'python',
  track: 'fullstack',
  category: 'JSON APIs + Client',
  tags: ['fetch', 'rendering', 'search'],
  prompt:
    'Finish both halves of a small search feature. The backend (`backend/routes.py`) returns books ' +
    'matching a query via `GET /books/<query>`; the frontend (`frontend/app.js`) fetches that endpoint ' +
    'and renders the results. Each half is graded independently — the frontend never actually reaches ' +
    'the backend over a real socket in this sandbox, so its `fetch` is stubbed with the exact response ' +
    'your backend, correctly implemented, would produce.',
  hints: [
    'backend/routes.py: return `(200, {"results": search_books(query)})` — search_books() is already written in books.py.',
    'frontend/app.js: `const res = await fetch(\'/books/mystery\'); const data = await res.json();` gets you the same shape the backend returns.',
    'Build each `<li>` with `document.createElement(\'li\')` and set `.textContent` to the title.',
    'Check the Live Preview pane below the console once both halves compile — that\'s the fastest way to see what\'s actually rendering.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/books.py', BOOKS, { editable: false }),
    pf('backend/routes.py', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/books.py', BOOKS, { editable: false }),
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
