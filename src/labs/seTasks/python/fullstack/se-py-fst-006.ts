import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Comment Form

Submitting a form doesn't just show a message this time — the backend's response (the newly
created comment, with its server-assigned id) gets appended straight into the page's existing list,
the same "optimistic-ish update from the real response" pattern a real comment box uses.
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

const COMMENTS_MODEL = `COMMENTS = []
_next_id = [1]


def add_comment(author, text):
    comment = {"id": _next_id[0], "author": author, "text": text}
    COMMENTS.append(comment)
    _next_id[0] += 1
    return comment
`;

const ROUTES_STARTER = `from framework import App
from comments import add_comment

app = App()


@app.route('/comments', methods=('POST',))
def post_comment(req):
    """req.body has 'author' and 'text'. Create a comment via add_comment() and return
    (201, the created comment dict)."""
    # TODO
    pass
`;

const ROUTES_SOLUTION = `from framework import App
from comments import add_comment

app = App()


@app.route('/comments', methods=('POST',))
def post_comment(req):
    comment = add_comment(req.body.get('author', ''), req.body.get('text', ''))
    return (201, comment)
`;

const BACKEND_TEST_CODE = `from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

status, body = app.handle('POST', '/comments', {"author": "Ama", "text": "Nice work!"})
__check__("create status", status, 201)
__check__("create returns the author", body.get("author"), "Ama")
__check__("create assigns an id", body.get("id"), 1)

status, body = app.handle('POST', '/comments', {"author": "Kofi", "text": "Agreed."})
__check__("second comment gets the next id", body.get("id"), 2)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Comment Form</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Leave a Comment</h1>
<input id="author" type="text" value="Ama" />
<input id="text" type="text" value="Nice work!" />
<button id="submit">Post</button>
<ul id="comments"></ul>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
input { display: block; margin-bottom: 0.5rem; padding: 0.4rem; }
`;

const APP_JS_STARTER = `document.getElementById('submit').addEventListener('click', async function () {
  // TODO:
  //  - read #author's and #text's .value
  //  - fetch('/comments', { method: 'POST', body: JSON.stringify({ author, text }) })
  //  - parse the JSON body (the created comment, with its server-assigned id)
  //  - append a new <li> to #comments with textContent "AUTHOR: TEXT" using the RESPONSE data
  //    (not the raw input values) — e.g. "Ama: Nice work!"
  //  - clear #text's value back to '' afterward
});
`;

const APP_JS_SOLUTION = `document.getElementById('submit').addEventListener('click', async function () {
  const author = document.getElementById('author').value;
  const text = document.getElementById('text').value;
  const res = await fetch('/comments', { method: 'POST', body: JSON.stringify({ author, text }) });
  const comment = await res.json();
  const li = document.createElement('li');
  li.textContent = comment.author + ': ' + comment.text;
  document.getElementById('comments').appendChild(li);
  document.getElementById('text').value = '';
});
`;

const FRONTEND_TEST_CODE = `checkCount('starts with no comments', '#comments li', 0);
await click('#submit');
checkCount('adds one comment after submit', '#comments li', 1);
checkText('new comment shows author and text', '#comments li:first-child', 'Ama: Nice work!');
check('clears the text input after submit', document.getElementById('text').value, '');
`;

const FETCH_FIXTURES = {
  '/comments': { id: 1, author: 'Ama', text: 'Nice work!' },
};

const task: ProjectTask = {
  id: 'se-py-fst-006',
  title: 'Comment Form',
  difficulty: 'Hard',
  language: 'python',
  track: 'fullstack',
  category: 'Forms End-to-End',
  tags: ['forms', 'fetch'],
  prompt: "Submit a comment form and append the backend's response — not the raw input values — into the page's list, then clear the input for the next comment.",
  hints: [
    'backend/routes.py: `add_comment(req.body.get(\'author\', \'\'), req.body.get(\'text\', \'\'))` does the real work — you just call it and return `(201, comment)`.',
    'Use the comment object that comes BACK from `res.json()` to build the `<li>` text, not the raw `author`/`text` local variables — they happen to match here, but the response is the actual source of truth (e.g. it also carries the server-assigned id).',
    '`li.textContent = comment.author + \': \' + comment.text;` then `document.getElementById(\'comments\').appendChild(li);`.',
    "Clearing the input is a separate, final step: `document.getElementById('text').value = '';` after the comment has been appended.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/comments.py', COMMENTS_MODEL, { editable: false }),
    pf('backend/routes.py', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/comments.py', COMMENTS_MODEL, { editable: false }),
    pf('backend/routes.py', ROUTES_SOLUTION),
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
