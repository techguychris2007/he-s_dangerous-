import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Request Metrics

Wrap every route call to record what real production systems watch first: how many requests came
in, how many failed, and split out per status code — the numbers behind a real uptime/error-rate
dashboard, collected here with nothing more than a dict and a wrapper function.
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

const METRICS_STARTER = `METRICS = {"total": 0, "by_status": {}}


def track_metrics(handler):
    """Return a new handler that calls handler(req, **kwargs), then:
    - increments METRICS["total"] by 1
    - increments METRICS["by_status"][status] by 1 (starting from 0 if this status hasn't been
      seen yet), where status is the first element of the (status, body) tuple handler returned
    ...and finally returns handler's original (status, body) result unchanged."""
    # TODO
    pass


def error_rate():
    """Return the fraction of tracked requests whose status was >= 400, as a float between 0 and 1.
    Return 0.0 if no requests have been tracked yet (avoid dividing by zero)."""
    # TODO
    pass
`;

const METRICS_SOLUTION = `METRICS = {"total": 0, "by_status": {}}


def track_metrics(handler):
    def wrapped(req, **kwargs):
        result = handler(req, **kwargs)
        status = result[0]
        METRICS["total"] += 1
        METRICS["by_status"][status] = METRICS["by_status"].get(status, 0) + 1
        return result
    return wrapped


def error_rate():
    if METRICS["total"] == 0:
        return 0.0
    errors = sum(count for status, count in METRICS["by_status"].items() if status >= 400)
    return errors / METRICS["total"]
`;

const ROUTES = `from framework import App
from metrics import track_metrics

app = App()


@app.route('/items/<item_id>', methods=('GET',))
@track_metrics
def get_item(req, item_id):
    if item_id == '1':
        return (200, {"id": 1, "name": "Widget"})
    return (404, {"error": "not found"})
`;

const MAIN = `from routes import app
from metrics import METRICS, error_rate

if __name__ == '__main__':
    app.handle('GET', '/items/1')
    app.handle('GET', '/items/999')
    print("METRICS:", METRICS)
    print("error_rate:", error_rate())
`;

const TEST_CODE = `from routes import app
from metrics import METRICS, error_rate

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("error_rate with no requests yet", error_rate(), 0.0)

app.handle('GET', '/items/1')
__check__("total increments after one request", METRICS["total"], 1)
__check__("by_status tracks the 200", METRICS["by_status"].get(200), 1)
__check__("error rate is 0 with only successes", error_rate(), 0.0)

app.handle('GET', '/items/999')
app.handle('GET', '/items/999')
__check__("total increments across multiple requests", METRICS["total"], 3)
__check__("by_status tracks the 404s separately", METRICS["by_status"].get(404), 2)

rate = error_rate()
__check__("error rate reflects 2 errors out of 3", abs(rate - (2 / 3)) < 0.001, True)

status, body = app.handle('GET', '/items/1')
__check__("the wrapped handler still returns its normal result", (status, body), (200, {"id": 1, "name": "Widget"}))

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-019',
  title: 'Request Metrics',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Observability',
  tags: ['observability', 'middleware'],
  prompt: 'Wrap a handler to record total requests and a per-status-code breakdown, then compute an error rate from those counts — the numbers a real dashboard is built on.',
  hints: [
    'Call `handler(req, **kwargs)` first and keep its result — you need the status code out of it before you can record anything.',
    '`result[0]` is the status code, since handlers return `(status, body)` tuples.',
    '`METRICS["by_status"].get(status, 0) + 1` is the same "increment or start at zero" pattern as any other frequency counter.',
    'Guard `error_rate` against dividing by zero — check `if METRICS["total"] == 0: return 0.0` before computing anything.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('metrics.py', METRICS_STARTER),
    pf('routes.py', ROUTES, { editable: false }),
    pf('main.py', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('metrics.py', METRICS_SOLUTION),
    pf('routes.py', ROUTES, { editable: false }),
    pf('main.py', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Request Metrics', kind: 'python', entry: 'main.py', testCode: TEST_CODE }],
};

export default task;
