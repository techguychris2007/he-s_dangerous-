import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Blog Platform (Capstone)

A bigger, multi-feature project pulling together everything earlier in this track: validation,
server-side templating, a form that creates new data, and delete-by-click — all in one app. TWO
backend files are yours to finish this time (\`validation.js\` and \`template.js\`), wired together by
an already-correct \`routes.js\`, plus a frontend that has to juggle three different interactions:
loading the initial list, publishing a new post, and deleting one.
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

const POSTS_MODEL = `const POSTS = [
  { id: 1, title: 'Hello World', body: 'My first post about learning to code.' },
  { id: 2, title: 'Second Post', body: 'Getting the hang of this.' },
];
let nextId = 3;

function listPosts() {
  return POSTS;
}

function addPost(title, body) {
  const post = { id: nextId, title, body };
  POSTS.push(post);
  nextId++;
  return post;
}

function deletePost(postId) {
  const index = POSTS.findIndex((p) => p.id === postId);
  if (index === -1) return false;
  POSTS.splice(index, 1);
  return true;
}

module.exports = { listPosts, addPost, deletePost };
`;

const VALIDATION_STARTER = `function validatePost(body) {
  // TODO: return an array of error strings (empty if valid):
  // - 'title is required' if body.title is missing or an empty string.
  // - 'body is required' if body.body is missing or an empty string.
  // Check BOTH fields — don't stop at the first problem.
}

module.exports = { validatePost };
`;

const VALIDATION_SOLUTION = `function validatePost(body) {
  const errors = [];
  if (!body.title) errors.push('title is required');
  if (!body.body) errors.push('body is required');
  return errors;
}

module.exports = { validatePost };
`;

const TEMPLATE_STARTER = `function renderPostList(posts) {
  // TODO: return ONE HTML string containing every post, each formatted exactly as:
  // '<div class="post" data-id="ID"><h3>TITLE</h3><p>BODY</p>' +
  // '<button class="delete-btn" data-id="ID">Delete</button></div>'
  // with no separator between posts (they're joined directly together — Array.prototype.map then
  // .join('') is the natural way to do this).
}

module.exports = { renderPostList };
`;

const TEMPLATE_SOLUTION = `function renderPostList(posts) {
  return posts
    .map(
      (post) =>
        '<div class="post" data-id="' + post.id + '"><h3>' + post.title + '</h3>' +
        '<p>' + post.body + '</p>' +
        '<button class="delete-btn" data-id="' + post.id + '">Delete</button></div>'
    )
    .join('');
}

module.exports = { renderPostList };
`;

const ROUTES = `const { App } = require('./framework');
const { listPosts, addPost, deletePost } = require('./posts');
const { validatePost } = require('./validation');
const { renderPostList } = require('./template');

const app = new App();

app.route('GET', '/posts', function (req, params) {
  return [200, { html: renderPostList(listPosts()) }];
});

app.route('POST', '/posts/new', function (req, params) {
  const errors = validatePost(req.body);
  if (errors.length > 0) return [400, { errors }];
  const post = addPost(req.body.title, req.body.body);
  return [201, post];
});

app.route('DELETE', '/posts/:id', function (req, params) {
  if (deletePost(Number(params.id))) return [200, { deleted: true }];
  return [404, { error: 'not found' }];
});

module.exports = { app };
`;

const BACKEND_TEST_CODE = `const { validatePost } = require('./validation');
const { renderPostList } = require('./template');
const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('valid post has no errors', validatePost({ title: 'T', body: 'B' }), []);
check('missing title', validatePost({ body: 'B' }), ['title is required']);
check('missing body', validatePost({ title: 'T' }), ['body is required']);
check('both missing collects both errors', validatePost({}).length, 2);

const html = renderPostList([{ id: 1, title: 'Hi', body: 'There' }]);
check('template includes the title', html.includes('Hi'), true);
check('template includes the body', html.includes('There'), true);
check('template includes a delete button with the right data-id', html.includes('data-id="1">Delete'), true);

let result = app.handle('GET', '/posts');
check('list route status', result[0], 200);
check('list route includes both seeded posts', result[1].html.includes('Hello World') && result[1].html.includes('Second Post'), true);

result = app.handle('POST', '/posts/new', { title: 'New', body: 'Content' });
check('create status', result[0], 201);
check('create returns the title', result[1].title, 'New');

result = app.handle('POST', '/posts/new', { title: '' });
check('invalid create status', result[0], 400);

result = app.handle('DELETE', '/posts/1');
check('delete existing status', result[0], 200);

result = app.handle('DELETE', '/posts/999');
check('delete missing status', result[0], 404);

console.log('__RESULT__ ' + passed + '/' + total);
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
  id: 'se-js-fst-021',
  title: 'Blog Platform',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'Capstones',
  tags: ['capstone', 'validation', 'templating', 'forms', 'fetch'],
  prompt:
    'A bigger project combining validation, server-side templating, a create form, and delete-by-click. ' +
    'Finish two backend pieces (`validation.js`, `template.js`) and the frontend (`app.js`), which has to ' +
    'load, publish, AND delete — including handling clicks on posts that did not exist when the page ' +
    'first loaded.',
  hints: [
    'validation.js and template.js are independent — get validatePost right first (same "build an errors array" pattern from earlier tasks), then renderPostList separately.',
    "renderPostList: `posts.map((post) => '...').join('')` — build one string per post with a template literal or concatenation, then join with no separator.",
    "app.js's delete listener is attached to `#posts` itself, not to individual buttons — that's what lets it catch clicks on delete buttons added later by the publish handler. Check `e.target.classList.contains('delete-btn')` to filter for the right clicks.",
    'The publish handler builds its new post with `document.createElement` (matching the server template\'s shape by hand) instead of `innerHTML` — this is deliberate: it\'s the same markup, built the other way, for practice.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/posts.js', POSTS_MODEL, { editable: false }),
    pf('backend/validation.js', VALIDATION_STARTER),
    pf('backend/template.js', TEMPLATE_STARTER),
    pf('backend/routes.js', ROUTES, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/posts.js', POSTS_MODEL, { editable: false }),
    pf('backend/validation.js', VALIDATION_SOLUTION),
    pf('backend/template.js', TEMPLATE_SOLUTION),
    pf('backend/routes.js', ROUTES, { editable: false }),
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
