import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Task API

A tiny hand-rolled web framework (\`framework.py\`, given) and a task-list backend built on it. You
write the data layer (\`models.py\`) and the routes (\`routes.py\`) — the same shape a real Flask/FastAPI
app takes, just small enough to run entirely in-browser with no real HTTP server underneath.
`;

const FRAMEWORK = `class Request:
    def __init__(self, method, path, body=None):
        self.method = method
        self.path = path
        self.body = body or {}


class App:
    """A minimal router: register a handler per (method, path pattern), then \`handle()\` a request
    against whichever registered route matches. <name> segments in a pattern bind as keyword args."""

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

const MODELS_STARTER = `TASKS = {}
_next_id = [1]


def create_task(title):
    """Create a task {"id": int, "title": str, "done": False}, store it in TASKS keyed by id
    (using and incrementing _next_id[0] for the id), and return the new task dict."""
    # TODO
    pass


def list_tasks():
    """Return every task in TASKS as a list, in insertion order."""
    # TODO
    pass


def delete_task(task_id):
    """Remove the task whose id equals int(task_id) from TASKS if present.
    Return True if it was removed, False if it wasn't there."""
    # TODO
    pass
`;

const MODELS_SOLUTION = `TASKS = {}
_next_id = [1]


def create_task(title):
    task = {"id": _next_id[0], "title": title, "done": False}
    TASKS[task["id"]] = task
    _next_id[0] += 1
    return task


def list_tasks():
    return list(TASKS.values())


def delete_task(task_id):
    return TASKS.pop(int(task_id), None) is not None
`;

const ROUTES_STARTER = `from framework import App
from models import create_task, list_tasks, delete_task

app = App()


@app.route('/tasks', methods=('GET',))
def get_tasks(req):
    """Return (200, {"tasks": [...]}) listing every task."""
    # TODO
    pass


@app.route('/tasks', methods=('POST',))
def post_task(req):
    """Create a task from req.body['title'] and return (201, the created task dict)."""
    # TODO
    pass


@app.route('/tasks/<task_id>', methods=('DELETE',))
def delete_task_route(req, task_id):
    """Delete the task with this id. Return (200, {"deleted": True}) if it existed,
    or (404, {"error": "not found"}) if it didn't."""
    # TODO
    pass
`;

const ROUTES_SOLUTION = `from framework import App
from models import create_task, list_tasks, delete_task

app = App()


@app.route('/tasks', methods=('GET',))
def get_tasks(req):
    return (200, {"tasks": list_tasks()})


@app.route('/tasks', methods=('POST',))
def post_task(req):
    task = create_task(req.body.get('title', ''))
    return (201, task)


@app.route('/tasks/<task_id>', methods=('DELETE',))
def delete_task_route(req, task_id):
    if delete_task(task_id):
        return (200, {"deleted": True})
    return (404, {"error": "not found"})
`;

const MAIN = `from routes import app

if __name__ == '__main__':
    status, body = app.handle('GET', '/tasks')
    print(f"GET /tasks -> {status} {body}")
`;

const TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('GET', '/tasks')
__check__("empty list status", status, 200)
__check__("empty list body", body, {"tasks": []})

status, body = app.handle('POST', '/tasks', {"title": "Buy milk"})
__check__("create status", status, 201)
__check__("create returns title", body.get("title"), "Buy milk")
__check__("create assigns id", body.get("id"), 1)

status, body = app.handle('GET', '/tasks')
__check__("list has one task", len(body.get("tasks", [])), 1)

status, body = app.handle('DELETE', '/tasks/1')
__check__("delete status", status, 200)

status, body = app.handle('DELETE', '/tasks/999')
__check__("delete missing status", status, 404)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-001',
  title: 'Task API',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'HTTP & Routing',
  tags: ['routing', 'rest'],
  prompt:
    'A tiny hand-rolled framework (`framework.py`) is already written — real route registration with ' +
    '`<param>` path segments, dispatched through `app.handle(method, path, body)`. Build a task-list ' +
    'API on top of it: an in-memory data layer in `models.py`, and REST-shaped routes (list, create, ' +
    'delete) in `routes.py`.',
  hints: [
    'models.py: `create_task` builds the dict, stores it in TASKS keyed by its id, bumps `_next_id[0]`, and returns it.',
    'routes.py handlers return a (status, body) tuple — that IS the whole response, no separate serialization step.',
    'DELETE /tasks/<task_id> — the `<task_id>` in framework.py\'s pattern arrives as a keyword arg with that exact name.',
    'delete_task should return False (not raise) for an id that was never there — TASKS.pop(id, None) is not None gives you that for free.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('models.py', MODELS_STARTER),
    pf('routes.py', ROUTES_STARTER),
    pf('main.py', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('models.py', MODELS_SOLUTION),
    pf('routes.py', ROUTES_SOLUTION),
    pf('main.py', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Task API', kind: 'python', entry: 'main.py', testCode: TEST_CODE }],
};

export default task;
