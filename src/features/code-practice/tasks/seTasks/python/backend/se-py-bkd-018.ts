import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Response Envelope

Wrap every route's response in a consistent shape (\`{"data": ..., "meta": {...}}\` on success,
\`{"error": {...}}\` on failure) instead of letting each route invent its own format — a small
convention that makes an entire API predictable to consume.
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

const ENVELOPE_STARTER = `def success_envelope(data, meta=None):
    """Return {"data": data, "meta": meta or {}}."""
    # TODO
    pass


def error_envelope(code, message):
    """Return {"error": {"code": code, "message": message}}."""
    # TODO
    pass
`;

const ENVELOPE_SOLUTION = `def success_envelope(data, meta=None):
    return {"data": data, "meta": meta or {}}


def error_envelope(code, message):
    return {"error": {"code": code, "message": message}}
`;

const ROUTES = `from framework import App
from envelope import success_envelope, error_envelope

USERS = {1: {"id": 1, "name": "Ama"}}

app = App()


@app.route('/users/<user_id>', methods=('GET',))
def get_user(req, user_id):
    user = USERS.get(int(user_id))
    if user is None:
        return (404, error_envelope("NOT_FOUND", f"no user with id {user_id}"))
    return (200, success_envelope(user))


@app.route('/users', methods=('GET',))
def list_users(req):
    users = list(USERS.values())
    return (200, success_envelope(users, meta={"count": len(users)}))
`;

const MAIN = `from routes import app

if __name__ == '__main__':
    status, body = app.handle('GET', '/users/1')
    print(f"GET /users/1 -> {status} {body}")
`;

const TEST_CODE = `from routes import app
from envelope import success_envelope, error_envelope

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("success_envelope wraps data", success_envelope({"x": 1}), {"data": {"x": 1}, "meta": {}})
__check__("success_envelope keeps given meta", success_envelope([1, 2], meta={"count": 2}), {"data": [1, 2], "meta": {"count": 2}})
__check__("error_envelope shape", error_envelope("BAD", "oops"), {"error": {"code": "BAD", "message": "oops"}})

status, body = app.handle('GET', '/users/1')
__check__("found-user status", status, 200)
__check__("found-user data", body["data"]["name"], "Ama")

status, body = app.handle('GET', '/users/999')
__check__("missing-user status", status, 404)
__check__("missing-user has an error envelope", "error" in body, True)
__check__("missing-user error code", body["error"]["code"], "NOT_FOUND")

status, body = app.handle('GET', '/users')
__check__("list endpoint reports count in meta", body["meta"]["count"], 1)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-018',
  title: 'Response Envelope',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'API Design',
  tags: ['api-design', 'conventions'],
  prompt: "Write two small envelope helpers (success and error), then use them consistently across two routes so every response — found or not — follows the same predictable shape.",
  hints: [
    '`success_envelope` and `error_envelope` are each a one-line dict literal — no logic beyond assembling the shape.',
    '`meta or {}` covers both "meta was never passed" (None) and "meta was passed as {}" — either way the result is a dict, never None.',
    'Both routes call one of the two envelope helpers instead of returning a raw dict — that consistency is the entire point of the pattern.',
    'The 404 case still returns a normal (status, body) tuple, just with `error_envelope(...)` as the body instead of `success_envelope(...)`.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('envelope.py', ENVELOPE_STARTER),
    pf('routes.py', ROUTES, { editable: false }),
    pf('main.py', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('envelope.py', ENVELOPE_SOLUTION),
    pf('routes.py', ROUTES, { editable: false }),
    pf('main.py', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Response Envelope', kind: 'python', entry: 'main.py', testCode: TEST_CODE }],
};

export default task;
