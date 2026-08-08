import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Comment Form

Submitting a form doesn't just show a message this time — the backend's response (the newly
created comment, with its server-assigned id) gets appended straight into the page's existing list.
`;

const FRAMEWORK = `class Request {
  constructor(method, path, body) {
    this.method = method;
    this.path = path;
    this.body = body || {};
  }
}

class App {
  constructor() {
    this.routes = [];
  }
  route(method, path, handler) {
    this.routes.push({ method, path, handler });
  }
  handle(method, path, body) {
    const req = new Request(method, path, body);
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const params = matchPath(r.path, path);
      if (params) return r.handler(req, params);
    }
    return [404, { error: 'not found' }];
  }
}

function matchPath(pattern, path) {
  const p = pattern.replace(/^\\/|\\/$/g, '').split('/');
  const a = path.replace(/^\\/|\\/$/g, '').split('/');
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = a[i];
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

module.exports = { App };
`;

const COMMENTS_MODEL = `const COMMENTS = [];
let nextId = 1;

function addComment(author, text) {
  const comment = { id: nextId, author, text };
  COMMENTS.push(comment);
  nextId++;
  return comment;
}

module.exports = { addComment };
`;

const ROUTES_STARTER = `const { App } = require('./framework');
const { addComment } = require('./comments');

const app = new App();

app.route('POST', '/comments', function (req, params) {
  // TODO: req.body has 'author' and 'text'. Create a comment via addComment() and return
  // [201, the created comment object].
});

module.exports = { app };
`;

const ROUTES_SOLUTION = `const { App } = require('./framework');
const { addComment } = require('./comments');

const app = new App();

app.route('POST', '/comments', function (req, params) {
  const comment = addComment(req.body.author, req.body.text);
  return [201, comment];
});

module.exports = { app };
`;

const BACKEND_TEST_CODE = `const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let result = app.handle('POST', '/comments', { author: 'Ama', text: 'Nice work!' });
check('create status', result[0], 201);
check('create returns the author', result[1].author, 'Ama');
check('create assigns an id', result[1].id, 1);

result = app.handle('POST', '/comments', { author: 'Kofi', text: 'Agreed.' });
check('second comment gets the next id', result[1].id, 2);

console.log('__RESULT__ ' + passed + '/' + total);
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
  id: 'se-js-fst-007',
  title: 'Comment Form',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'Forms End-to-End',
  tags: ['forms', 'fetch'],
  prompt: "Submit a comment form and append the backend's response — not the raw input values — into the page's list, then clear the input for the next comment.",
  hints: [
    "backend/routes.js: `addComment(req.body.author, req.body.text)` does the real work — you just call it and return `[201, comment]`.",
    "Use the comment object that comes BACK from `res.json()` to build the `<li>` text, not the raw `author`/`text` local variables — the response is the actual source of truth (e.g. it also carries the server-assigned id).",
    "`li.textContent = comment.author + ': ' + comment.text;` then `document.getElementById('comments').appendChild(li);`.",
    "Clearing the input is a separate, final step: `document.getElementById('text').value = '';` after the comment has been appended.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/comments.js', COMMENTS_MODEL, { editable: false }),
    pf('backend/routes.js', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/comments.js', COMMENTS_MODEL, { editable: false }),
    pf('backend/routes.js', ROUTES_SOLUTION),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'backend', label: 'Backend', kind: 'node-js', entry: 'backend/routes.js', testCode: BACKEND_TEST_CODE },
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
