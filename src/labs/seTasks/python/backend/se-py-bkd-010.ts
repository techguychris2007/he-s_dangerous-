import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Persistent Task Store

Combine an in-memory data layer with real file-backed persistence: every write goes through to
disk immediately, so a fresh load of the same file always reflects the latest state — the same
"write-through" pattern a real (if much simpler) database uses.
`;

const STARTER = `import json
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


def add_task(title):
    """Load the current tasks, append a new {"title": title, "done": False} dict, save, and
    return the full updated list."""
    # TODO
    pass


def complete_task(index):
    """Load the current tasks, set tasks[index]["done"] = True, save, and return the full updated
    list. Assume index is always valid."""
    # TODO
    pass


def get_tasks():
    """Return the current list of tasks from disk."""
    # TODO
    pass
`;

const SOLUTION = `import json
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


def add_task(title):
    tasks = _load()
    tasks.append({"title": title, "done": False})
    _save(tasks)
    return tasks


def complete_task(index):
    tasks = _load()
    tasks[index]["done"] = True
    _save(tasks)
    return tasks


def get_tasks():
    return _load()
`;

const TEST_CODE = `from tasks import add_task, complete_task, get_tasks

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("starts empty", get_tasks(), [])

add_task("Buy milk")
tasks = get_tasks()
__check__("add_task persists a new task", len(tasks), 1)
__check__("new task starts not done", tasks[0]["done"], False)

add_task("Walk the dog")
__check__("second add_task adds another entry", len(get_tasks()), 2)

complete_task(0)
tasks = get_tasks()
__check__("complete_task marks the right task done", tasks[0]["done"], True)
__check__("complete_task leaves other tasks alone", tasks[1]["done"], False)

result = add_task("Water the plants")
__check__("add_task returns the full updated list", len(result), 3)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-010',
  title: 'Persistent Task Store',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Persistence',
  tags: ['files', 'json', 'persistence'],
  prompt: 'Build a write-through task store: every add/complete loads the current file, mutates it, and saves immediately — so the file on disk is always the source of truth.',
  hints: [
    'The private `_load()`/`_save()` helpers are already written — every public function should call one or both, never touch the file directly.',
    '`add_task`: load, `tasks.append({"title": title, "done": False})`, save, then return `tasks`.',
    '`complete_task`: load, `tasks[index]["done"] = True` (mutating the loaded list in place is fine here, since it\'s about to be saved), save, return `tasks`.',
    '`get_tasks` is a one-line wrapper around `_load()` — there\'s no separate in-memory state to keep in sync, the file IS the state.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('tasks.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('tasks.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Persistent Task Store', kind: 'python', entry: 'tasks.py', testCode: TEST_CODE }],
};

export default task;
