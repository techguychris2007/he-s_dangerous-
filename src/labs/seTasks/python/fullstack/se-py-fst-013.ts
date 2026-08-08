import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Counter With Shared State

Three separate buttons, one shared piece of state — each button changes the SAME \`count\` variable
differently, and a single render function keeps the on-page display in sync with it no matter which
button fired.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Counter</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Counter: <span id="count">0</span></h1>
<button id="inc">+1</button>
<button id="dec">-1</button>
<button id="reset">Reset</button>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
button { margin-right: 0.5rem; padding: 0.4rem 0.9rem; }
`;

const APP_JS_STARTER = `let count = 0;
const countEl = document.getElementById('count');

function render() {
  // TODO: set countEl's textContent to String(count).
}

document.getElementById('inc').addEventListener('click', function () {
  // TODO: increment count, then call render()
});

document.getElementById('dec').addEventListener('click', function () {
  // TODO: decrement count, then call render()
});

document.getElementById('reset').addEventListener('click', function () {
  // TODO: set count back to 0, then call render()
});
`;

const APP_JS_SOLUTION = `let count = 0;
const countEl = document.getElementById('count');

function render() {
  countEl.textContent = String(count);
}

document.getElementById('inc').addEventListener('click', function () {
  count++;
  render();
});

document.getElementById('dec').addEventListener('click', function () {
  count--;
  render();
});

document.getElementById('reset').addEventListener('click', function () {
  count = 0;
  render();
});
`;

const FRONTEND_TEST_CODE = `checkText('starts at 0', '#count', '0');

await click('#inc');
await click('#inc');
checkText('two increments -> 2', '#count', '2');

await click('#dec');
checkText('one decrement -> 1', '#count', '1');

await click('#reset');
checkText('reset -> 0', '#count', '0');

await click('#dec');
checkText('decrementing below zero is allowed', '#count', '-1');
`;

const task: ProjectTask = {
  id: 'se-py-fst-013',
  title: 'Counter With Shared State',
  difficulty: 'Easy',
  language: 'python',
  track: 'fullstack',
  category: 'State & Data Flow',
  tags: ['state', 'dom'],
  prompt: 'Three buttons, one shared `count` variable, and a single render() function that every button calls after changing it — the smallest possible "state drives the UI" pattern.',
  hints: [
    '`render()` has exactly one job: `countEl.textContent = String(count);` — every button calls it, so it\'s the only place display logic lives.',
    'Each button listener follows the same two-step shape: change `count`, then call `render()`.',
    '`count++` / `count--` / `count = 0` are the only differences between the three listeners.',
    'Nothing clamps `count` at zero — decrementing past 0 into negative numbers is expected behavior here, not a bug to guard against.',
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
