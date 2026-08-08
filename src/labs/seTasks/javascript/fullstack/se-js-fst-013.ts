import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Filter Chips

A set of toggleable filter chips, where the on-page count of "active filters" is always derived
fresh from the chips themselves — never a separately-tracked number that could drift out of sync.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Filter Chips</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Filter Products</h1>
<div id="chips">
<button class="chip" id="chip-electronics">Electronics</button>
<button class="chip" id="chip-books">Books</button>
<button class="chip" id="chip-clothing">Clothing</button>
</div>
<div id="summary">0 filters active</div>
<button id="reset">Reset</button>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.chip { padding: 0.4rem 0.9rem; margin-right: 0.5rem; border-radius: 999px; border: 1px solid #ccc; background: white; }
.chip.active { background: #2563eb; color: white; border-color: #2563eb; }
#summary { margin: 0.75rem 0; font-weight: bold; }
`;

const APP_JS_STARTER = `const chips = document.querySelectorAll('.chip');

function updateSummary() {
  // TODO: count how many .chip elements have the 'active' class, and set #summary's textContent
  // to "<N> filters active".
}

chips.forEach(function (chip) {
  chip.addEventListener('click', function () {
    // TODO: toggle the 'active' class on THIS chip, then call updateSummary().
  });
});

document.getElementById('reset').addEventListener('click', function () {
  // TODO: remove the 'active' class from EVERY chip, then call updateSummary().
});
`;

const APP_JS_SOLUTION = `const chips = document.querySelectorAll('.chip');

function updateSummary() {
  const activeCount = document.querySelectorAll('.chip.active').length;
  document.getElementById('summary').textContent = activeCount + ' filters active';
}

chips.forEach(function (chip) {
  chip.addEventListener('click', function () {
    chip.classList.toggle('active');
    updateSummary();
  });
});

document.getElementById('reset').addEventListener('click', function () {
  chips.forEach(function (chip) {
    chip.classList.remove('active');
  });
  updateSummary();
});
`;

const FRONTEND_TEST_CODE = `checkText('starts with no filters active', '#summary', '0 filters active');

await click('#chip-electronics');
checkText('activating one chip updates the summary', '#summary', '1 filters active');
checkExists('the clicked chip is marked active', '#chip-electronics.active');

await click('#chip-books');
checkText('activating a second chip updates the summary', '#summary', '2 filters active');

await click('#chip-electronics');
checkText('deactivating a chip decreases the count', '#summary', '1 filters active');
checkExists('the deactivated chip no longer has the active class', '#chip-electronics:not(.active)');
checkExists('the other chip stays active', '#chip-books.active');

await click('#reset');
checkText('reset clears every active chip', '#summary', '0 filters active');
checkExists('no chip has the active class after reset', '#chip-books:not(.active)');
`;

const task: ProjectTask = {
  id: 'se-js-fst-013',
  title: 'Filter Chips',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'State & Data Flow',
  tags: ['state', 'dom'],
  prompt: 'Wire up toggleable filter chips with a live "N filters active" summary that always recomputes from the current DOM state, never a separately-tracked counter.',
  hints: [
    '`updateSummary()` recomputes from scratch every time — `document.querySelectorAll(\'.chip.active\').length` — rather than incrementing/decrementing a separate variable that could fall out of sync.',
    'Each chip\'s own click listener just toggles its own class: `chip.classList.toggle(\'active\')`, then calls `updateSummary()`.',
    '"Reset" loops over every chip and unconditionally REMOVES the class (`classList.remove`, not `toggle`) — clicking Reset should never accidentally re-activate anything.',
    'All three interactions (activate, deactivate, reset) end by calling the same `updateSummary()` — that single shared call is what keeps the count always correct.',
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
