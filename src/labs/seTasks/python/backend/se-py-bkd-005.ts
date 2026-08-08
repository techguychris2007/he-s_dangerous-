import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Validated Signup

A route that must reject bad input BEFORE doing anything with it — a validation function that
collects every problem (not just the first) and a route that turns those problems into a proper
\`400\` response.
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

const VALIDATION_STARTER = `def validate_signup(body):
    """Return a list of error strings for problems with body (empty list if it's valid):
    - "username is required" if body.get('username') is missing or an empty string.
    - "age must be a non-negative integer" if body.get('age') is missing, not an int, or negative.
    Check BOTH fields — don't stop at the first problem."""
    # TODO
    pass
`;

const VALIDATION_SOLUTION = `def validate_signup(body):
    errors = []
    username = body.get('username')
    if not username:
        errors.append("username is required")

    age = body.get('age')
    if not isinstance(age, int) or isinstance(age, bool) or age < 0:
        errors.append("age must be a non-negative integer")

    return errors
`;

const ROUTES = `from framework import App
from validation import validate_signup

app = App()


@app.route('/signup', methods=('POST',))
def signup(req):
    errors = validate_signup(req.body)
    if errors:
        return (400, {"errors": errors})
    return (201, {"username": req.body["username"], "age": req.body["age"]})
`;

const MAIN = `from routes import app

if __name__ == '__main__':
    status, body = app.handle('POST', '/signup', {"username": "ama", "age": 25})
    print(f"valid signup -> {status} {body}")
`;

const TEST_CODE = `from routes import app
from validation import validate_signup

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("valid input has no errors", validate_signup({"username": "ama", "age": 25}), [])
__check__("missing username", validate_signup({"age": 25}), ["username is required"])
__check__("empty username", validate_signup({"username": "", "age": 25}), ["username is required"])
__check__("negative age", validate_signup({"username": "ama", "age": -1}), ["age must be a non-negative integer"])
__check__("non-integer age", validate_signup({"username": "ama", "age": "old"}), ["age must be a non-negative integer"])

errors = validate_signup({})
__check__("both fields missing collects both errors", len(errors), 2)

status, body = app.handle('POST', '/signup', {"username": "kofi", "age": 30})
__check__("valid signup status", status, 201)

status, body = app.handle('POST', '/signup', {"username": ""})
__check__("invalid signup status", status, 400)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-005',
  title: 'Validated Signup',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Request Validation',
  tags: ['validation', 'rest'],
  prompt: 'Write a validator that collects every problem with a signup payload (not just the first), and wire it into a route that returns 400 with the full error list.',
  hints: [
    'Build an `errors = []` list and append to it — don\'t `return` on the first problem, or the second field never gets checked.',
    '`if not username:` catches both a missing key (None) and an empty string in one check.',
    '`isinstance(age, bool)` needs its own check because in Python `True`/`False` ARE technically ints (`isinstance(True, int)` is True) — exclude booleans explicitly so `{"age": True}` doesn\'t sneak through.',
    'The route just needs `if errors: return (400, {"errors": errors})` — the validator already did all the real work.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('validation.py', VALIDATION_STARTER),
    pf('routes.py', ROUTES, { editable: false }),
    pf('main.py', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('validation.py', VALIDATION_SOLUTION),
    pf('routes.py', ROUTES, { editable: false }),
    pf('main.py', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Validated Signup', kind: 'python', entry: 'main.py', testCode: TEST_CODE }],
};

export default task;
