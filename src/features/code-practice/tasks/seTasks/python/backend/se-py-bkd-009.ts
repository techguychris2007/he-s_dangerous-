import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# JSON File Store

Real persistence: save a Python dict to an actual file on disk as JSON, and load it back. This is
the simplest possible "database" — a single JSON file — and the same \`open\`/\`json\` pattern scales
up to real config files, caches, and small local datastores.
`;

const STARTER = `import json


def save_store(path, data):
    """Write \`data\` (a dict) to the file at \`path\` as JSON."""
    # TODO
    pass


def load_store(path):
    """Read and parse the JSON file at \`path\`. Return {} if the file doesn't exist yet (don't let
    a missing file raise — catch the exception)."""
    # TODO
    pass


def update_store(path, key, value):
    """Load the store at path, set store[key] = value, save it back, and return the updated store."""
    # TODO
    pass
`;

const SOLUTION = `import json
import os


def save_store(path, data):
    with open(path, 'w') as f:
        json.dump(data, f)


def load_store(path):
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return json.load(f)


def update_store(path, key, value):
    store = load_store(path)
    store[key] = value
    save_store(path, store)
    return store
`;

const TEST_CODE = `from store import save_store, load_store, update_store

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("loading a store that doesn't exist yet", load_store('nope.json'), {})

save_store('settings.json', {"theme": "dark", "volume": 80})
loaded = load_store('settings.json')
__check__("loads what was saved", loaded, {"theme": "dark", "volume": 80})

updated = update_store('settings.json', "volume", 50)
__check__("update_store changes the given key", updated["volume"], 50)
__check__("update_store keeps other keys", updated["theme"], "dark")

reloaded = load_store('settings.json')
__check__("update_store actually persisted to disk", reloaded["volume"], 50)

fresh = update_store('brand_new.json', "first_key", "first_value")
__check__("update_store works on a store that didn't exist yet", fresh, {"first_key": "first_value"})

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-009',
  title: 'JSON File Store',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Persistence',
  tags: ['files', 'json', 'persistence'],
  prompt: 'Build a tiny JSON-file-backed key/value store: save, load (missing file returns {} instead of crashing), and an update that combines both.',
  hints: [
    '`json.dump(data, f)` writes directly to an already-open file object — no separate `.write()` call needed.',
    '`os.path.exists(path)` lets you check before opening, so a missing file returns `{}` instead of raising `FileNotFoundError`.',
    '`json.load(f)` on an open file object parses it directly into a Python value.',
    '`update_store` composes the other two: load, mutate the in-memory dict, save it back, return it — three function calls, no new file logic.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('store.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('store.py', SOLUTION)],
  targets: [{ id: 'main', label: 'JSON File Store', kind: 'python', entry: 'store.py', testCode: TEST_CODE }],
};

export default task;
