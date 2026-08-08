import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Select-All List

Individually clickable rows, PLUS a "Select All" button that has to reflect and drive the same
shared state — click a row to toggle just it, or click Select All to toggle everything at once, and
a live count always matches whatever's actually selected.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Select-All List</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Files</h1>
<button id="select-all">Select All</button>
<span id="count">0 selected</span>
<ul id="files">
<li class="file" id="file-1">report.pdf</li>
<li class="file" id="file-2">photo.png</li>
<li class="file" id="file-3">notes.txt</li>
</ul>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.file { padding: 0.3rem 0; cursor: pointer; }
.file.selected { background: #dbeafe; }
#count { margin-left: 1rem; font-weight: bold; }
`;

const APP_JS_STARTER = `const files = document.querySelectorAll('.file');

function updateCount() {
  // TODO: count how many .file elements currently have the 'selected' class, and set #count's
  // textContent to "<N> selected".
}

files.forEach(function (file) {
  file.addEventListener('click', function () {
    // TODO: toggle the 'selected' class on THIS file, then call updateCount().
  });
});

document.getElementById('select-all').addEventListener('click', function () {
  // TODO: add the 'selected' class to EVERY .file element, then call updateCount().
});
`;

const APP_JS_SOLUTION = `const files = document.querySelectorAll('.file');

function updateCount() {
  const selected = document.querySelectorAll('.file.selected').length;
  document.getElementById('count').textContent = selected + ' selected';
}

files.forEach(function (file) {
  file.addEventListener('click', function () {
    file.classList.toggle('selected');
    updateCount();
  });
});

document.getElementById('select-all').addEventListener('click', function () {
  files.forEach(function (file) {
    file.classList.add('selected');
  });
  updateCount();
});
`;

const FRONTEND_TEST_CODE = `checkText('starts with none selected', '#count', '0 selected');

await click('#file-1');
checkText('selecting one file updates the count', '#count', '1 selected');
checkExists('the clicked file is marked selected', '#file-1.selected');

await click('#file-1');
checkText('clicking again deselects it', '#count', '0 selected');
checkExists('the file no longer has the selected class', '#file-1:not(.selected)');

await click('#select-all');
checkText('Select All selects every file', '#count', '3 selected');
checkExists('file 1 is selected', '#file-1.selected');
checkExists('file 2 is selected', '#file-2.selected');
checkExists('file 3 is selected', '#file-3.selected');

await click('#file-2');
checkText('individual toggling still works after Select All', '#count', '2 selected');
`;

const task: ProjectTask = {
  id: 'se-js-fst-008',
  title: 'Select-All List',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'Events & Interaction',
  tags: ['dom', 'events'],
  prompt: 'Wire up individually-clickable rows AND a "Select All" button that both drive the same shared selection state, with a live count that always matches reality.',
  hints: [
    '`updateCount()` recomputes from the DOM every time (`document.querySelectorAll(\'.file.selected\').length`) rather than tracking a separate counter variable — that way it can never drift out of sync with what\'s actually selected.',
    'Each row\'s click listener toggles just that row: `file.classList.toggle(\'selected\')`, then calls `updateCount()`.',
    '"Select All" loops over every file and unconditionally ADDS the class (`classList.add`, not `toggle`) — clicking it twice should never deselect everything.',
    'Both code paths call the SAME `updateCount()` function at the end — that\'s what keeps the count correct no matter which interaction the user just used.',
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
