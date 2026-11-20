import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Logging Middleware

Middleware, in its simplest form: a function that wraps a route handler to add behavior around it
(here, recording every call) without the handler itself knowing anything happened. This is the same
"function that takes a function and returns a function" shape as a decorator — applied to a web
handler instead of an arbitrary function.
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

const MIDDLEWARE_STARTER = `LOG = []


def with_logging(handler):
    """Return a new handler that, before calling handler(req, **kwargs), appends
    f"{req.method} {req.path}" to LOG. Then calls handler and returns its result unchanged."""
    # TODO
    pass
`;

const MIDDLEWARE_SOLUTION = `LOG = []


def with_logging(handler):
    def wrapped(req, **kwargs):
        LOG.append(f"{req.method} {req.path}")
        return handler(req, **kwargs)
    return wrapped
`;

const ROUTES = `from framework import App
from middleware import with_logging, LOG

app = App()


@app.route('/ping', methods=('GET',))
@with_logging
def ping(req):
    return (200, {"pong": True})
`;

const MAIN = `from routes import app
from middleware import LOG

if __name__ == '__main__':
    app.handle('GET', '/ping')
    print("LOG:", LOG)
`;

const TEST_CODE = `from routes import app
from middleware import LOG

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("log starts empty", len(LOG), 0)

status, body = app.handle('GET', '/ping')
__check__("wrapped handler still responds correctly", (status, body), (200, {"pong": True}))
__check__("logs the request after one call", LOG, ["GET /ping"])

app.handle('GET', '/ping')
__check__("logs accumulate across calls", LOG, ["GET /ping", "GET /ping"])

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-003',
  title: 'Logging Middleware',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Middleware',
  tags: ['middleware', 'decorators'],
  prompt: 'Write a middleware decorator that logs every request that passes through a wrapped handler, without changing what the handler itself returns.',
  hints: [
    'Same shape as any decorator: define an inner function that takes the same arguments as the handler, and return that inner function.',
    '`def wrapped(req, **kwargs):` needs `**kwargs` to forward along any path parameters (like `<post_id>`) that a specific route might receive.',
    'Log BEFORE calling through: `LOG.append(f"{req.method} {req.path}")`, then `return handler(req, **kwargs)`.',
    'The `@app.route(...)` and `@with_logging` decorators stack — `@with_logging` runs first (closest to the function), wrapping `ping` before `@app.route` registers the wrapped version.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('middleware.py', MIDDLEWARE_STARTER),
    pf('routes.py', ROUTES, { editable: false }),
    pf('main.py', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('middleware.py', MIDDLEWARE_SOLUTION),
    pf('routes.py', ROUTES, { editable: false }),
    pf('main.py', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Logging Middleware', kind: 'python', entry: 'main.py', testCode: TEST_CODE }],
};

export default task;
