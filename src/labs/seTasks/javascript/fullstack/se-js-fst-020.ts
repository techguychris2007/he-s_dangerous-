import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Master-Detail List Router

A classic UI shape: a list on one side, a detail view on the other, and the URL hash tracks which
item is currently selected — click any item and the detail panel rebuilds itself from that item's
data.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Master-Detail</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Products</h1>
<div id="list">
<button class="item-link" data-hash="#item-1">Widget</button>
<button class="item-link" data-hash="#item-2">Gadget</button>
<button class="item-link" data-hash="#item-3">Gizmo</button>
</div>
<div id="detail">Select an item</div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
#list { margin-bottom: 1rem; }
#list button { margin-right: 0.5rem; padding: 0.4rem 0.9rem; }
#detail { border: 1px solid #eee; padding: 1rem; max-width: 300px; }
`;

const APP_JS_STARTER = `const ITEMS = {
  '#item-1': { name: 'Widget', description: 'A simple widget.' },
  '#item-2': { name: 'Gadget', description: 'A fancy gadget.' },
  '#item-3': { name: 'Gizmo', description: 'A mysterious gizmo.' },
};

function showDetail() {
  // TODO: look up ITEMS[location.hash].
  //  - if it exists: clear #detail (detail.innerHTML = ''), then build and append an <h2> with the
  //    item's name and a <p> with its description.
  //  - if it doesn't exist (e.g. the hash is empty or unrecognized), leave #detail showing its
  //    current content untouched.
}

document.querySelectorAll('.item-link').forEach(function (link) {
  link.addEventListener('click', function () {
    location.hash = link.dataset.hash;
    showDetail();
  });
});

showDetail();
`;

const APP_JS_SOLUTION = `const ITEMS = {
  '#item-1': { name: 'Widget', description: 'A simple widget.' },
  '#item-2': { name: 'Gadget', description: 'A fancy gadget.' },
  '#item-3': { name: 'Gizmo', description: 'A mysterious gizmo.' },
};

function showDetail() {
  const item = ITEMS[location.hash];
  if (!item) return;

  const detail = document.getElementById('detail');
  detail.innerHTML = '';

  const heading = document.createElement('h2');
  heading.textContent = item.name;
  detail.appendChild(heading);

  const description = document.createElement('p');
  description.textContent = item.description;
  detail.appendChild(description);
}

document.querySelectorAll('.item-link').forEach(function (link) {
  link.addEventListener('click', function () {
    location.hash = link.dataset.hash;
    showDetail();
  });
});

showDetail();
`;

const FRONTEND_TEST_CODE = `checkText('starts with the placeholder message', '#detail', 'Select an item');

await click('#list .item-link[data-hash="#item-2"]');
checkText('shows the selected item name', '#detail h2', 'Gadget');
checkText('shows the selected item description', '#detail p', 'A fancy gadget.');

await click('#list .item-link[data-hash="#item-1"]');
checkText('switches to a different item on a new click', '#detail h2', 'Widget');
checkText('description updates along with the name', '#detail p', 'A simple widget.');
`;

const task: ProjectTask = {
  id: 'se-js-fst-020',
  title: 'Master-Detail List Router',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'SPA Routing',
  tags: ['spa', 'routing', 'dom'],
  prompt: "Build a master-detail view where clicking a list item updates the URL hash AND rebuilds the detail panel from that item's own data.",
  hints: [
    '`ITEMS[location.hash]` looks up the currently-selected item directly from the hash — no separate "which item is selected" variable needed.',
    "Guard the missing case first: `if (!item) return;` — an empty or unrecognized hash should leave whatever's already showing alone.",
    "`detail.innerHTML = '';` clears out the previous item's content before building the new `<h2>`/`<p>` — otherwise you'd stack multiple items' details on top of each other.",
    'Each list button already has its target hash on a `data-hash` attribute, read via `link.dataset.hash` — the click listeners are already wired up for you.',
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
