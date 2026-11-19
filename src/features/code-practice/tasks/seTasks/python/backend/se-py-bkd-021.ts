import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Task Management API (Capstone)

A bigger backend project combining validation, file persistence, and pagination in one API: TWO
backend files are yours to finish (\`validation.py\` and \`tasks.py\`), wired together by an
already-correct \`routes.py\`.
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

const VALIDATION_STARTER = `VALID_PRIORITIES = {'low', 'medium', 'high'}


def validate_task(body):
    """Return a list of error strings (empty list if valid):
    - "title is required" if body.get('title') is missing or an empty string.
    - "priority must be low, medium, or high" if body.get('priority') is not one of
      VALID_PRIORITIES. Check BOTH fields — don't stop at the first problem."""
    # TODO
    pass
`;

const VALIDATION_SOLUTION = `VALID_PRIORITIES = {'low', 'medium', 'high'}


def validate_task(body):
    errors = []
    if not body.get('title'):
        errors.append("title is required")
    if body.get('priority') not in VALID_PRIORITIES:
        errors.append("priority must be low, medium, or high")
    return errors
`;

const TASKS_STARTER = `import json
import os

TASKS_FILE = 'tasks.json'


def _load():
    if not os.path.exists(TASKS_FILE):
        return []
    with open(TASKS_FILE) as f:
        return json.load(f)


def _save(tasks):
    with open(TASKS_FILE, 'w') as f:
        json.dump(tasks, f)


def add_task(title, priority):
    """Load the tasks, create {"id": ..., "title": title, "priority": priority, "done": False}
    using (max existing id, default 0) + 1, append it, save, and return the created task."""
    # TODO
    pass


def list_tasks_page(page, page_size):
    """Return a slice of the saved tasks: tasks[page * page_size : page * page_size + page_size]
    (page is 0-indexed)."""
    # TODO
    pass


def complete_task(task_id):
    """Load the tasks. If a task with this id exists, mark done=True, save, and return True.
    Return False if no task has that id."""
    # TODO
    pass
`;

const TASKS_SOLUTION = `import json
import os

TASKS_FILE = 'tasks.json'


def _load():
    if not os.path.exists(TASKS_FILE):
        return []
    with open(TASKS_FILE) as f:
        return json.load(f)


def _save(tasks):
    with open(TASKS_FILE, 'w') as f:
        json.dump(tasks, f)


def add_task(title, priority):
    tasks = _load()
    next_id = max([t["id"] for t in tasks], default=0) + 1
    task = {"id": next_id, "title": title, "priority": priority, "done": False}
    tasks.append(task)
    _save(tasks)
    return task


def list_tasks_page(page, page_size):
    tasks = _load()
    start = page * page_size
    return tasks[start:start + page_size]


def complete_task(task_id):
    tasks = _load()
    for task in tasks:
        if task["id"] == task_id:
            task["done"] = True
            _save(tasks)
            return True
    return False
`;

const ROUTES = `from framework import App
from validation import validate_task
from tasks import add_task, list_tasks_page, complete_task

app = App()


@app.route('/tasks', methods=('POST',))
def create_task(req):
    errors = validate_task(req.body)
    if errors:
        return (400, {"errors": errors})
    task = add_task(req.body.get('title'), req.body.get('priority'))
    return (201, task)


@app.route('/tasks/page/<page>', methods=('GET',))
def get_page(req, page):
    return (200, {"tasks": list_tasks_page(int(page), 2)})


@app.route('/tasks/<task_id>/complete', methods=('POST',))
def complete(req, task_id):
    if complete_task(int(task_id)):
        return (200, {"completed": True})
    return (404, {"error": "not found"})
`;

const TEST_CODE = `from validation import validate_task
from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("valid task has no errors", validate_task({"title": "Write report", "priority": "high"}), [])
__check__("missing title is an error", validate_task({"priority": "high"}), ["title is required"])
__check__("invalid priority is an error", validate_task({"title": "X", "priority": "urgent"}), ["priority must be low, medium, or high"])
__check__("both invalid collects both errors", len(validate_task({})), 2)

status, body = app.handle('POST', '/tasks', {"title": "Write report", "priority": "high"})
__check__("create status", status, 201)
__check__("create assigns id 1", body["id"], 1)

status, body = app.handle('POST', '/tasks', {"title": ""})
__check__("invalid create status", status, 400)

app.handle('POST', '/tasks', {"title": "Review PR", "priority": "medium"})
app.handle('POST', '/tasks', {"title": "Fix bug", "priority": "low"})

status, body = app.handle('GET', '/tasks/page/0')
__check__("first page has 2 tasks (page size 2)", len(body["tasks"]), 2)
__check__("first page starts with the first task", body["tasks"][0]["title"], "Write report")

status, body = app.handle('GET', '/tasks/page/1')
__check__("second page has the remaining task", len(body["tasks"]), 1)
__check__("second page shows the third task", body["tasks"][0]["title"], "Fix bug")

status, body = app.handle('POST', '/tasks/1/complete')
__check__("completing an existing task succeeds", status, 200)

status, body = app.handle('GET', '/tasks/page/0')
__check__("completed task is marked done", body["tasks"][0]["done"], True)

status, body = app.handle('POST', '/tasks/999/complete')
__check__("completing a missing task fails", status, 404)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-021',
  title: 'Task Management API',
  difficulty: 'Hard',
  language: 'python',
  track: 'backend',
  category: 'Capstones',
  tags: ['capstone', 'validation', 'persistence', 'pagination'],
  prompt:
    'A bigger backend project combining validation, file persistence, and pagination. Finish two ' +
    'files (`validation.py`, `tasks.py`) wired together by an already-correct `routes.py`.',
  hints: [
    'validation.py and tasks.py are independent — get `validate_task` right first (same "build an errors list" pattern from earlier tasks), then the persistence functions in tasks.py separately.',
    '`body.get(\'priority\') not in VALID_PRIORITIES` handles a missing priority AND an invalid one in a single check, since `None` is never a member of the set either.',
    '`list_tasks_page` is plain list slicing once you have the start index: `tasks[start:start + page_size]` — Python slicing already handles a short final page gracefully.',
    '`complete_task` follows the exact same load-find-mutate-save-return pattern as `checkout_book` in the Library Catalog capstone.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('validation.py', VALIDATION_STARTER),
    pf('tasks.py', TASKS_STARTER),
    pf('routes.py', ROUTES, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('validation.py', VALIDATION_SOLUTION),
    pf('tasks.py', TASKS_SOLUTION),
    pf('routes.py', ROUTES, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Task Management API', kind: 'python', entry: 'routes.py', testCode: TEST_CODE }],
};

export default task;
