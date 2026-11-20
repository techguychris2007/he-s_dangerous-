import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Auth Middleware

A second middleware, this time one that can SHORT-CIRCUIT: if the request isn't authorized, the
wrapped handler never runs at all, and the middleware returns its own \`401\` response instead.
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

const MIDDLEWARE_STARTER = `VALID_TOKEN = 'secret123'


def require_auth(handler):
    """Return a new handler that checks req.body.get('token'). If it doesn't equal VALID_TOKEN,
    return (401, {"error": "unauthorized"}) WITHOUT calling handler. Otherwise call handler(req,
    **kwargs) and return its result."""
    # TODO
    pass
`;

const MIDDLEWARE_SOLUTION = `VALID_TOKEN = 'secret123'


def require_auth(handler):
    def wrapped(req, **kwargs):
        if req.body.get('token') != VALID_TOKEN:
            return (401, {"error": "unauthorized"})
        return handler(req, **kwargs)
    return wrapped
`;

const ROUTES = `from framework import App
from middleware import require_auth

app = App()


@app.route('/secret', methods=('POST',))
@require_auth
def get_secret(req):
    return (200, {"secret": "the cake is a lie"})
`;

const MAIN = `from routes import app

if __name__ == '__main__':
    status, body = app.handle('POST', '/secret', {"token": "secret123"})
    print(f"authorized -> {status} {body}")
    status, body = app.handle('POST', '/secret', {"token": "wrong"})
    print(f"unauthorized -> {status} {body}")
`;

const TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('POST', '/secret', {"token": "secret123"})
__check__("correct token status", status, 200)
__check__("correct token returns the secret", body.get("secret"), "the cake is a lie")

status, body = app.handle('POST', '/secret', {"token": "wrong"})
__check__("wrong token status", status, 401)
__check__("wrong token error body", body, {"error": "unauthorized"})

status, body = app.handle('POST', '/secret', {})
__check__("missing token status", status, 401)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-004',
  title: 'Auth Middleware',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Middleware',
  tags: ['middleware', 'auth'],
  prompt: 'Write a middleware decorator that rejects unauthorized requests with a 401 before the wrapped handler ever runs.',
  hints: [
    'Same wrapper shape as any middleware — the difference is a check at the top that can return early instead of always calling through.',
    'Check `if req.body.get(\'token\') != VALID_TOKEN:` and return the 401 tuple immediately — the key part is NOT calling `handler` in that branch.',
    'Only reach `return handler(req, **kwargs)` in the success path, after the check passes.',
    'A request with no token at all still works with `.get(\'token\')` — it returns None, which is never equal to VALID_TOKEN, so it\'s correctly rejected without a KeyError.',
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
  targets: [{ id: 'main', label: 'Auth Middleware', kind: 'python', entry: 'main.py', testCode: TEST_CODE }],
};

export default task;
