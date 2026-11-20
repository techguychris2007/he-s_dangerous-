import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Blog Post API

The same tiny \`framework.py\` router as the Task API, this time with a route that has TWO different
methods on the same path (\`GET\`/\`PUT\` on \`/posts/<post_id>\`) — routing decisions have to consider
both the path AND the method together.
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

const MODELS = `POSTS = {
    1: {"id": 1, "title": "Hello World", "body": "First post"},
    2: {"id": 2, "title": "Second Post", "body": "More content"},
}


def get_post(post_id):
    return POSTS.get(int(post_id))


def update_post(post_id, changes):
    post = POSTS.get(int(post_id))
    if post is None:
        return None
    post.update(changes)
    return post
`;

const ROUTES_STARTER = `from framework import App
from models import get_post, update_post

app = App()


@app.route('/posts/<post_id>', methods=('GET',))
def get_post_route(req, post_id):
    """Return (200, post) if it exists, or (404, {"error": "not found"}) if it doesn't."""
    # TODO
    pass


@app.route('/posts/<post_id>', methods=('PUT',))
def put_post_route(req, post_id):
    """Update the post at post_id with req.body (only the keys present in req.body should change —
    update_post already does a partial update). Return (200, the updated post) if it existed, or
    (404, {"error": "not found"}) if it didn't."""
    # TODO
    pass
`;

const ROUTES_SOLUTION = `from framework import App
from models import get_post, update_post

app = App()


@app.route('/posts/<post_id>', methods=('GET',))
def get_post_route(req, post_id):
    post = get_post(post_id)
    if post is None:
        return (404, {"error": "not found"})
    return (200, post)


@app.route('/posts/<post_id>', methods=('PUT',))
def put_post_route(req, post_id):
    post = update_post(post_id, req.body)
    if post is None:
        return (404, {"error": "not found"})
    return (200, post)
`;

const MAIN = `from routes import app

if __name__ == '__main__':
    status, body = app.handle('GET', '/posts/1')
    print(f"GET /posts/1 -> {status} {body}")
`;

const TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('GET', '/posts/1')
__check__("get existing post status", status, 200)
__check__("get existing post title", body.get("title"), "Hello World")

status, body = app.handle('GET', '/posts/999')
__check__("get missing post status", status, 404)

status, body = app.handle('PUT', '/posts/2', {"title": "Updated Title"})
__check__("update post status", status, 200)
__check__("update post changes title", body.get("title"), "Updated Title")
__check__("update post keeps other fields", body.get("body"), "More content")

status, body = app.handle('PUT', '/posts/999', {"title": "Nope"})
__check__("update missing post status", status, 404)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-002',
  title: 'Blog Post API',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'HTTP & Routing',
  tags: ['routing', 'rest'],
  prompt: 'Two routes sharing the same path (`/posts/<post_id>`) but different HTTP methods — GET to read, PUT to partially update. models.py already has get_post/update_post written.',
  hints: [
    'Both routes decorate the SAME path string but different `methods=(...)` tuples — the router dispatches on method + path together, so this is unambiguous.',
    'The pattern is identical in both handlers: call the model function, check for None, and return the matching (status, body) tuple.',
    '`update_post` already returns None for a missing id, exactly like `get_post` does — both routes can check for None the same way.',
    'req.body IS the changes dict already — `update_post(post_id, req.body)` needs no extra unpacking.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('models.py', MODELS, { editable: false }),
    pf('routes.py', ROUTES_STARTER),
    pf('main.py', MAIN, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('models.py', MODELS, { editable: false }),
    pf('routes.py', ROUTES_SOLUTION),
    pf('main.py', MAIN, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Blog Post API', kind: 'python', entry: 'main.py', testCode: TEST_CODE }],
};

export default task;
