import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Protected Action Button

A button that checks local login state BEFORE deciding whether to fetch at all — the frontend half
of an auth flow. This task is graded frontend-only, focused purely on the gating logic; a real app
must never trust a client-side gate alone — the server has to re-check auth on every request too,
since nothing stops someone from calling the API directly.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Protected Action</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Account Actions</h1>
<button id="login-btn">Log In</button>
<button id="action-btn">Do Protected Action</button>
<div id="result"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
button { margin-right: 0.5rem; padding: 0.4rem 0.9rem; }
`;

const APP_JS_STARTER = `let loggedIn = false;

document.getElementById('login-btn').addEventListener('click', function () {
  // TODO: set loggedIn to true. (No fetch here — this task hardcodes a successful login to keep
  // focus on the gated action itself.)
});

document.getElementById('action-btn').addEventListener('click', async function () {
  // TODO:
  //  - if NOT loggedIn, set #result's textContent to 'Please log in first' and return WITHOUT fetching
  //  - otherwise fetch('/action'), parse the JSON body, and set #result's textContent to data.message
});
`;

const APP_JS_SOLUTION = `let loggedIn = false;

document.getElementById('login-btn').addEventListener('click', function () {
  loggedIn = true;
});

document.getElementById('action-btn').addEventListener('click', async function () {
  if (!loggedIn) {
    document.getElementById('result').textContent = 'Please log in first';
    return;
  }
  const res = await fetch('/action');
  const data = await res.json();
  document.getElementById('result').textContent = data.message;
});
`;

const FRONTEND_TEST_CODE = `await click('#action-btn');
checkText('blocks the action while logged out', '#result', 'Please log in first');

await click('#login-btn');
await click('#action-btn');
checkText('performs the action once logged in', '#result', 'Action completed!');
`;

const FETCH_FIXTURES = {
  '/action': { message: 'Action completed!' },
};

const task: ProjectTask = {
  id: 'se-py-fst-016',
  title: 'Protected Action Button',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'Auth Flows',
  tags: ['auth', 'fetch', 'state'],
  prompt: 'Gate a fetch behind a local login flag — the button must refuse to even make the request when logged out, not just hide an error after the fact.',
  hints: [
    'Check `if (!loggedIn)` FIRST, before anything else in the click handler — the whole point is that the fetch never happens in that branch.',
    '`return;` right after setting the "please log in" message is what actually prevents the fetch from running — without it, execution would fall through to the fetch call regardless.',
    'The success path only runs when `loggedIn` is true: fetch, parse, then display `data.message`.',
    'The login button\'s job here is just `loggedIn = true;` — this task hardcodes a successful login to keep the focus on the gated action.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
