import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Task Board (Full-Stack)

Two connected halves, graded independently: a Python backend (\`backend/\`) exposing \`GET /api/tasks\`,
and a plain JS frontend (\`frontend/\`) that fetches and renders it.

They don't share a real network connection in this sandbox — the frontend's \`fetch\` is stubbed with a
fixed response matching exactly what the backend, correctly implemented, would return. Get both halves
right and the "Live preview" pane below shows a working task list.
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

const MODELS = `TASKS = [
    {"id": 1, "title": "Design the schema", "done": True},
    {"id": 2, "title": "Build the API", "done": True},
    {"id": 3, "title": "Wire up the frontend", "done": False},
]


def list_tasks():
    return TASKS
`;

const ROUTES_STARTER = `from framework import App
from models import list_tasks

app = App()


@app.route('/api/tasks', methods=('GET',))
def get_tasks(req):
    """Return (200, {"tasks": [...]}) listing every task from list_tasks()."""
    # TODO
    pass
`;

const ROUTES_SOLUTION = `from framework import App
from models import list_tasks

app = App()


@app.route('/api/tasks', methods=('GET',))
def get_tasks(req):
    return (200, {"tasks": list_tasks()})
`;

const BACKEND_TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('GET', '/api/tasks')
__check__("status", status, 200)
__check__("has 3 seeded tasks", len(body.get("tasks", [])), 3)
__check__("first task title", body["tasks"][0]["title"], "Design the schema")

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Task Board</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Task Board</h1>
<div id="count"></div>
<ul id="task-list"></ul>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
#count { font-weight: bold; margin-bottom: 0.5rem; }
#task-list li.done { text-decoration: line-through; color: #888; }
`;

const APP_JS_STARTER = `async function loadTasks() {
  // TODO:
  //  - fetch('/api/tasks') and parse the JSON body
  //  - set #count's textContent to "<N> tasks" where N is the number of tasks
  //  - for each task, append an <li> to #task-list with the task's title as its text,
  //    adding the class "done" to the <li> if the task is done
}

loadTasks();
`;

const APP_JS_SOLUTION = `async function loadTasks() {
  const res = await fetch('/api/tasks');
  const data = await res.json();
  const tasks = data.tasks;
  document.getElementById('count').textContent = tasks.length + ' tasks';
  const list = document.getElementById('task-list');
  for (const task of tasks) {
    const li = document.createElement('li');
    li.textContent = task.title;
    if (task.done) li.classList.add('done');
    list.appendChild(li);
  }
}

loadTasks();
`;

const FRONTEND_TEST_CODE = `checkText('renders task count', '#count', '3 tasks');
checkCount('renders one li per task', '#task-list li', 3);
checkText('first task title', '#task-list li:first-child', 'Design the schema');
checkExists('marks a done task', '#task-list li.done');
`;

const FETCH_FIXTURES = {
  '/api/tasks': {
    tasks: [
      { id: 1, title: 'Design the schema', done: true },
      { id: 2, title: 'Build the API', done: true },
      { id: 3, title: 'Wire up the frontend', done: false },
    ],
  },
};

const task: ProjectTask = {
  id: 'se-py-fst-001',
  title: 'Task Board',
  difficulty: 'Hard',
  language: 'python',
  track: 'fullstack',
  category: 'JSON APIs + Client',
  tags: ['fetch', 'rendering'],
  prompt:
    'Finish both halves of a small task board. The backend (`backend/routes.py`) returns a fixed set ' +
    'of seeded tasks from `GET /api/tasks`; the frontend (`frontend/app.js`) fetches that endpoint and ' +
    'renders it into the page. Each half is graded independently — the frontend never actually reaches ' +
    'the backend over a real socket in this sandbox, so its `fetch` is stubbed with the exact response ' +
    'your backend, correctly implemented, would produce.',
  hints: [
    'backend/routes.py: return `(200, {"tasks": list_tasks()})` — list_tasks() and the seed data are already written in models.py.',
    'frontend/app.js: `const res = await fetch(\'/api/tasks\'); const data = await res.json();` gets you the same shape the backend returns.',
    'Build each `<li>` with `document.createElement(\'li\')`, set `.textContent` to the title, and `classList.add(\'done\')` when the task is done.',
    "Check the Live Preview pane below the console once both halves compile — that's the fastest way to see what's actually rendering.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/models.py', MODELS, { editable: false }),
    pf('backend/routes.py', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/models.py', MODELS, { editable: false }),
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
