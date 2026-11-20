import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Click Counter

A frontend-only task: real DOM, real click events, graded inside a sandboxed browser frame (not just
function-in, value-out assertions). Wire up the two buttons in \`app.js\` so the page actually works —
check the Live Preview pane below the console to see it live.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Click Counter</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Click Counter</h1>
<p>Count: <span id="count">0</span></p>
<button id="increment">+1</button>
<button id="reset">Reset</button>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
button { font-size: 1rem; padding: 0.4rem 0.9rem; margin-right: 0.5rem; }
`;

const APP_JS_STARTER = `let count = 0;
const countEl = document.getElementById('count');
const incrementBtn = document.getElementById('increment');
const resetBtn = document.getElementById('reset');

incrementBtn.addEventListener('click', function () {
  // TODO: increment \`count\` and update countEl's textContent to reflect it
});

resetBtn.addEventListener('click', function () {
  // TODO: set \`count\` back to 0 and update countEl's textContent
});
`;

const APP_JS_SOLUTION = `let count = 0;
const countEl = document.getElementById('count');
const incrementBtn = document.getElementById('increment');
const resetBtn = document.getElementById('reset');

incrementBtn.addEventListener('click', function () {
  count++;
  countEl.textContent = String(count);
});

resetBtn.addEventListener('click', function () {
  count = 0;
  countEl.textContent = String(count);
});
`;

const TEST_CODE = `checkText('starts at 0', '#count', '0');
await click('#increment');
await click('#increment');
checkText('two clicks -> 2', '#count', '2');
await click('#reset');
checkText('reset -> 0', '#count', '0');
`;

const task: ProjectTask = {
  id: 'se-js-fst-001',
  title: 'Click Counter',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'Events & Interaction',
  tags: ['dom', 'events'],
  prompt:
    'Two buttons already exist in `index.html`, already wired to empty event listeners in `app.js`. ' +
    'Make Increment actually increment the on-page counter, and Reset actually reset it — real DOM ' +
    'text content, updated by real click events, checked against the real rendered page.',
  hints: [
    'The elements are already looked up for you (`countEl`, `incrementBtn`, `resetBtn`) — you only need to fill in the two listener bodies.',
    '`countEl.textContent = String(count)` after changing `count` is the whole pattern, both listeners use it.',
    "Increment: `count++` then update the text. Reset: `count = 0` then update the text — same update line both times.",
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
  targets: [{ id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'index.html', testCode: TEST_CODE }],
};

export default task;
