import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Hash-Based View Switcher

The simplest possible client-side "router": one hash, one visible view at a time — no page reload,
no server round-trip, just JS driving \`location.hash\` and showing/hiding DOM sections to match.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>View Switcher</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<nav>
<a href="#home" id="nav-home">Home</a>
<a href="#about" id="nav-about">About</a>
</nav>
<div id="view-home" class="view">Welcome home!</div>
<div id="view-about" class="view" hidden>About us.</div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
nav a { margin-right: 1rem; }
`;

const APP_JS_STARTER = `function showView() {
  // TODO:
  //  - const hash = location.hash || '#home'
  //  - the target view's id is 'view-' + hash.slice(1) (e.g. '#about' -> 'view-about')
  //  - hide every element with class "view" (element.hidden = true)
  //  - un-hide the one matching the current hash
}

document.getElementById('nav-home').addEventListener('click', function (e) {
  e.preventDefault();
  location.hash = '#home';
  showView();
});

document.getElementById('nav-about').addEventListener('click', function (e) {
  e.preventDefault();
  location.hash = '#about';
  showView();
});

showView();
`;

const APP_JS_SOLUTION = `function showView() {
  const hash = location.hash || '#home';
  const viewId = 'view-' + hash.slice(1);
  document.querySelectorAll('.view').forEach(function (v) {
    v.hidden = true;
  });
  const target = document.getElementById(viewId);
  if (target) target.hidden = false;
}

document.getElementById('nav-home').addEventListener('click', function (e) {
  e.preventDefault();
  location.hash = '#home';
  showView();
});

document.getElementById('nav-about').addEventListener('click', function (e) {
  e.preventDefault();
  location.hash = '#about';
  showView();
});

showView();
`;

const FRONTEND_TEST_CODE = `checkExists('home view is visible initially', '#view-home:not([hidden])');
checkExists('about view is hidden initially', '#view-about[hidden]');

await click('#nav-about');
checkExists('about view becomes visible after clicking About', '#view-about:not([hidden])');
checkExists('home view becomes hidden after clicking About', '#view-home[hidden]');

await click('#nav-home');
checkExists('home view is visible again after clicking Home', '#view-home:not([hidden])');
checkExists('about view is hidden again after clicking Home', '#view-about[hidden]');
`;

const task: ProjectTask = {
  id: 'se-py-fst-019',
  title: 'Hash-Based View Switcher',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'SPA Routing',
  tags: ['spa', 'routing', 'dom'],
  prompt: 'Build the simplest possible client-side router: one URL hash, one visible view — show/hide DOM sections to match location.hash, with no page reload.',
  hints: [
    '`location.hash || \'#home\'` gives you a default when the hash is empty (e.g. on first load, before any nav link is clicked).',
    '`hash.slice(1)` drops the leading `#`, so `\'#about\'` becomes `\'about\'` — prefixed with `\'view-\'` that\'s the target element\'s id.',
    'Hide everything first with `document.querySelectorAll(\'.view\').forEach(...)`, THEN un-hide just the one matching view — this way exactly one is ever visible at a time.',
    'The click handlers already call `e.preventDefault()` and set `location.hash` for you — `showView()` is the only function you need to fill in.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('index.html', HTML, { editable: false }),
    pf('style.css', CSS, { editable: false }),
    pf('app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('index.html', HTML, { editable: false }),
    pf('style.css', CSS, { editable: false }),
    pf('app.js', APP_JS_SOLUTION),
  ],
  targets: [{ id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'index.html', testCode: FRONTEND_TEST_CODE }],
};

export default task;
