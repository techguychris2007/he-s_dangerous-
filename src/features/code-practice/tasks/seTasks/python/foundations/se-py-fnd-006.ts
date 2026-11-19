import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# JSON Config Loader

Read a JSON config file from disk with the \`json\` module, then merge a base config with an
override — the same shallow-merge pattern real app config layering uses (defaults + environment
overrides).
`;

const STARTER = `import json


def load_config(path):
    """Read the JSON file at \`path\` and return it parsed as a dict."""
    # TODO
    pass


def merge_configs(base, override):
    """Return a NEW dict: a shallow copy of \`base\` with every key from \`override\` applied on top
    (override wins on key collisions). Do not mutate \`base\` or \`override\`."""
    # TODO
    pass
`;

const SOLUTION = `import json


def load_config(path):
    with open(path) as f:
        return json.load(f)


def merge_configs(base, override):
    merged = dict(base)
    merged.update(override)
    return merged
`;

const TEST_CODE = `import json
from config import load_config, merge_configs

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

with open('config.json', 'w') as f:
    json.dump({"debug": False, "port": 8000, "name": "app"}, f)

cfg = load_config('config.json')
__check__("loads debug", cfg["debug"], False)
__check__("loads port", cfg["port"], 8000)
__check__("loads name", cfg["name"], "app")

base = {"debug": False, "port": 8000}
override = {"port": 9000, "verbose": True}
merged = merge_configs(base, override)
__check__("merge overrides port", merged["port"], 9000)
__check__("merge keeps base key", merged["debug"], False)
__check__("merge adds new key", merged["verbose"], True)
__check__("merge does not mutate base", base, {"debug": False, "port": 8000})

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-006',
  title: 'JSON Config Loader',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Files & Formats',
  tags: ['json', 'files', 'dicts'],
  prompt: 'Load a JSON config file from disk, then shallow-merge a base config with an override without mutating either input.',
  hints: [
    '`json.load(f)` parses an already-open file object directly into a Python value — no need for `json.loads` + `.read()`.',
    "`with open(path) as f:` gives you that file object; return `json.load(f)` right inside the `with` block.",
    '`dict(base)` makes a shallow copy — do that first, then `.update(override)` on the COPY so the original `base` is never touched.',
    'Returning the copy after `.update()` (not `base` itself) is what keeps the function from mutating its input.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('config.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('config.py', SOLUTION)],
  targets: [{ id: 'main', label: 'JSON Config Loader', kind: 'python', entry: 'config.py', testCode: TEST_CODE }],
};

export default task;
