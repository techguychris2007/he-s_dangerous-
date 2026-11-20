import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Blog Platform (Capstone)

A bigger, multi-feature project pulling together everything earlier in this track: validation,
server-side templating, a form that creates new data, and delete-by-click — all in one app. TWO
backend files are yours to finish this time (\`validation.py\` and \`template.py\`), wired together by
an already-correct \`routes.py\`, plus a frontend that has to juggle three different interactions:
loading the initial list, publishing a new post, and deleting one.
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

const POSTS_MODEL = `POSTS = [
    {"id": 1, "title": "Hello World", "body": "My first post about learning to code."},
    {"id": 2, "title": "Second Post", "body": "Getting the hang of this."},
]
_next_id = [3]


def list_posts():
    return POSTS


def add_post(title, body):
    post = {"id": _next_id[0], "title": title, "body": body}
    POSTS.append(post)
    _next_id[0] += 1
    return post


def delete_post(post_id):
    for i, p in enumerate(POSTS):
        if p["id"] == post_id:
            POSTS.pop(i)
            return True
    return False
`;

const VALIDATION_STARTER = `def validate_post(body):
    """Return a list of error strings (empty list if valid):
    - "title is required" if body.get('title') is missing or an empty string.
    - "body is required" if body.get('body') is missing or an empty string.
    Check BOTH fields — don't stop at the first problem."""
    # TODO
    pass
`;

const VALIDATION_SOLUTION = `def validate_post(body):
    errors = []
    if not body.get('title'):
        errors.append("title is required")
    if not body.get('body'):
        errors.append("body is required")
    return errors
`;

const TEMPLATE_STARTER = `def render_post_list(posts):
    """Return ONE HTML string containing every post, each formatted exactly as:
    '<div class="post" data-id="{id}"><h3>{title}</h3><p>{body}</p>' +
    '<button class="delete-btn" data-id="{id}">Delete</button></div>'
    with no separator between posts (they're joined directly together)."""
    # TODO
    pass
`;

const TEMPLATE_SOLUTION = `def render_post_list(posts):
    parts = []
    for post in posts:
        parts.append(
            f'<div class="post" data-id="{post["id"]}"><h3>{post["title"]}</h3>'
            f'<p>{post["body"]}</p>'
            f'<button class="delete-btn" data-id="{post["id"]}">Delete</button></div>'
        )
    return ''.join(parts)
`;

const ROUTES = `from framework import App
from posts import list_posts, add_post, delete_post
from validation import validate_post
from template import render_post_list

app = App()


@app.route('/posts', methods=('GET',))
def get_posts(req):
    return (200, {"html": render_post_list(list_posts())})


@app.route('/posts/new', methods=('POST',))
def create_post(req):
    errors = validate_post(req.body)
    if errors:
        return (400, {"errors": errors})
    post = add_post(req.body.get('title', ''), req.body.get('body', ''))
    return (201, post)


@app.route('/posts/<post_id>', methods=('DELETE',))
def remove_post(req, post_id):
    if delete_post(int(post_id)):
        return (200, {"deleted": True})
    return (404, {"error": "not found"})
`;

const MAIN = `from routes import app

if __name__ == '__main__':
    status, body = app.handle('GET', '/posts')
    print(f"GET /posts -> {status} {body}")
`;

const BACKEND_TEST_CODE = `from validation import validate_post
from template import render_post_list
from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("valid post has no errors", validate_post({"title": "T", "body": "B"}), [])
__check__("missing title", validate_post({"body": "B"}), ["title is required"])
__check__("missing body", validate_post({"title": "T"}), ["body is required"])
__check__("both missing collects both errors", len(validate_post({})), 2)

html = render_post_list([{"id": 1, "title": "Hi", "body": "There"}])
__check__("template includes the title", "Hi" in html, True)
__check__("template includes the body", "There" in html, True)
__check__("template includes a delete button with the right data-id", 'data-id="1">Delete' in html, True)

status, body = app.handle('GET', '/posts')
__check__("list route status", status, 200)
__check__("list route includes both seeded posts", "Hello World" in body["html"] and "Second Post" in body["html"], True)

status, body = app.handle('POST', '/posts/new', {"title": "New", "body": "Content"})
__check__("create status", status, 201)
__check__("create returns the title", body.get("title"), "New")

status, body = app.handle('POST', '/posts/new', {"title": ""})
__check__("invalid create status", status, 400)

status, body = app.handle('DELETE', '/posts/1')
__check__("delete existing status", status, 200)

status, body = app.handle('DELETE', '/posts/999')
__check__("delete missing status", status, 404)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Blog Platform</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Blog</h1>
<div id="posts"></div>
<h2>New Post</h2>
<input id="new-title" type="text" value="My New Post" />
<textarea id="new-body">Some thoughts.</textarea>
<button id="submit-btn">Publish</button>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.post { border-bottom: 1px solid #eee; padding: 0.75rem 0; }
input, textarea { display: block; margin-bottom: 0.5rem; padding: 0.4rem; width: 240px; }
`;

const APP_JS_STARTER = `async function loadPosts() {
  // TODO: fetch('/posts'), parse the JSON body, set #posts' innerHTML to data.html
  // (the server already rendered the markup).
}

document.getElementById('submit-btn').addEventListener('click', async function () {
  // TODO:
  //  - read #new-title's and #new-body's .value
  //  - fetch('/posts/new', { method: 'POST', body: JSON.stringify({ title, body }) })
  //  - parse the JSON body (the created post, with its server-assigned id)
  //  - build a NEW post element with document.createElement (NOT innerHTML this time) matching the
  //    server's markup shape: <div class="post" data-id="ID"><h3>TITLE</h3><p>BODY</p>
  //    <button class="delete-btn" data-id="ID">Delete</button></div>
  //  - append it to #posts
});

document.getElementById('posts').addEventListener('click', async function (e) {
  // TODO: this listener catches clicks on ANY element inside #posts, including buttons added
  // later (event delegation) — check if e.target has the class 'delete-btn'. If so:
  //  - read its data-id attribute
  //  - fetch('/posts/' + id, { method: 'DELETE' })
  //  - remove the containing .post element from the DOM: e.target.closest('.post').remove()
});

loadPosts();
`;

const APP_JS_SOLUTION = `async function loadPosts() {
  const res = await fetch('/posts');
  const data = await res.json();
  document.getElementById('posts').innerHTML = data.html;
}

document.getElementById('submit-btn').addEventListener('click', async function () {
  const title = document.getElementById('new-title').value;
  const body = document.getElementById('new-body').value;
  const res = await fetch('/posts/new', { method: 'POST', body: JSON.stringify({ title, body }) });
  const post = await res.json();

  const div = document.createElement('div');
  div.className = 'post';
  div.dataset.id = String(post.id);

  const h3 = document.createElement('h3');
  h3.textContent = post.title;
  div.appendChild(h3);

  const p = document.createElement('p');
  p.textContent = post.body;
  div.appendChild(p);

  const btn = document.createElement('button');
  btn.className = 'delete-btn';
  btn.dataset.id = String(post.id);
  btn.textContent = 'Delete';
  div.appendChild(btn);

  document.getElementById('posts').appendChild(div);
});

document.getElementById('posts').addEventListener('click', async function (e) {
  if (!e.target.classList.contains('delete-btn')) return;
  const id = e.target.getAttribute('data-id');
  await fetch('/posts/' + id, { method: 'DELETE' });
  e.target.closest('.post').remove();
});

loadPosts();
`;

const FRONTEND_TEST_CODE = `checkCount('renders the two seeded posts from the server', '#posts .post', 2);
checkText('first post title', '#posts .post:first-child h3', 'Hello World');

await type('#new-title', 'My New Post');
await type('#new-body', 'Some thoughts.');
await click('#submit-btn');
checkCount('appends the new post after publishing', '#posts .post', 3);
checkText('new post shows the created title', '#posts .post:last-child h3', 'My New Post');

await click('#posts .post[data-id="1"] .delete-btn');
checkCount('removes a post after clicking delete', '#posts .post', 2);
checkCount('the deleted post is gone from the DOM', '#posts .post[data-id="1"]', 0);
checkText('the remaining original post is still there', '#posts .post:first-child h3', 'Second Post');
`;

const FETCH_FIXTURES = {
  '/posts': {
    html:
      '<div class="post" data-id="1"><h3>Hello World</h3><p>My first post about learning to code.</p><button class="delete-btn" data-id="1">Delete</button></div>' +
      '<div class="post" data-id="2"><h3>Second Post</h3><p>Getting the hang of this.</p><button class="delete-btn" data-id="2">Delete</button></div>',
  },
  '/posts/new': { id: 3, title: 'My New Post', body: 'Some thoughts.' },
  '/posts/1': { deleted: true },
};

const task: ProjectTask = {
  id: 'se-py-fst-021',
  title: 'Blog Platform',
  difficulty: 'Hard',
  language: 'python',
  track: 'fullstack',
  category: 'Capstones',
  tags: ['capstone', 'validation', 'templating', 'forms', 'fetch'],
  prompt:
    'A bigger project combining validation, server-side templating, a create form, and delete-by-click. ' +
    'Finish two backend pieces (`validation.py`, `template.py`) and the frontend (`app.js`), which has to ' +
    'load, publish, AND delete — including handling clicks on posts that did not exist when the page ' +
    'first loaded.',
  hints: [
    'validation.py and template.py are independent — get validate_post right first (same "build an errors list" pattern from earlier tasks), then render_post_list separately.',
    'render_post_list: build one f-string per post, collect them in a list, then `\'\'.join(parts)` — no separator needed between posts.',
    'app.js\'s delete listener is attached to `#posts` itself, not to individual buttons — that\'s what lets it catch clicks on delete buttons added later by the publish handler. Check `e.target.classList.contains(\'delete-btn\')` to filter for the right clicks.',
    'The publish handler builds its new post with `document.createElement` (matching the server template\'s shape by hand) instead of `innerHTML` — this is deliberate: it\'s the same markup, built the other way, for practice.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/posts.py', POSTS_MODEL, { editable: false }),
    pf('backend/validation.py', VALIDATION_STARTER),
    pf('backend/template.py', TEMPLATE_STARTER),
    pf('backend/routes.py', ROUTES, { editable: false }),
    pf('backend/main.py', MAIN, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/posts.py', POSTS_MODEL, { editable: false }),
    pf('backend/validation.py', VALIDATION_SOLUTION),
    pf('backend/template.py', TEMPLATE_SOLUTION),
    pf('backend/routes.py', ROUTES, { editable: false }),
    pf('backend/main.py', MAIN, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'backend', label: 'Backend', kind: 'python', entry: 'backend/routes.py', testCode: BACKEND_TEST_CODE },
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
