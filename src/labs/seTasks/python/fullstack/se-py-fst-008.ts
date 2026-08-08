import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Live Search Filter

Filter a visible list as the user types — no fetch, no server round-trip, just a real \`input\` event
hiding and showing elements already on the page. The same interaction pattern behind any client-side
search box.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Live Search</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Fruits</h1>
<input id="search" type="text" placeholder="Search..." />
<ul id="items">
<li class="item" id="item-apple">Apple</li>
<li class="item" id="item-banana">Banana</li>
<li class="item" id="item-cherry">Cherry</li>
</ul>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.item.hidden { display: none; }
`;

const APP_JS_STARTER = `const searchInput = document.getElementById('search');
const items = document.querySelectorAll('.item');

searchInput.addEventListener('input', function () {
  // TODO: for each item, add the 'hidden' class if its textContent (lowercased) does NOT include
  // searchInput's value (also lowercased); remove 'hidden' if it does.
});
`;

const APP_JS_SOLUTION = `const searchInput = document.getElementById('search');
const items = document.querySelectorAll('.item');

searchInput.addEventListener('input', function () {
  const query = searchInput.value.toLowerCase();
  items.forEach(function (item) {
    const matches = item.textContent.toLowerCase().includes(query);
    item.classList.toggle('hidden', !matches);
  });
});
`;

const FRONTEND_TEST_CODE = `checkCount('all items visible initially', '#items .item:not(.hidden)', 3);

await type('#search', 'a');
checkExists('Apple stays visible when filtering "a"', '#item-apple:not(.hidden)');
checkExists('Banana stays visible when filtering "a"', '#item-banana:not(.hidden)');
checkExists('Cherry gets hidden when filtering "a"', '#item-cherry.hidden');

await type('#search', '');
checkCount('clearing the search shows every item again', '#items .item:not(.hidden)', 3);
`;

const task: ProjectTask = {
  id: 'se-py-fst-008',
  title: 'Live Search Filter',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'Events & Interaction',
  tags: ['dom', 'events', 'filtering'],
  prompt: "Hide and show list items as the user types into a search box — a real 'input' event filtering already-rendered DOM elements, no network involved.",
  hints: [
    '`searchInput.value.toLowerCase()` gets the current typed text, lowercased so the match is case-insensitive.',
    '`item.textContent.toLowerCase().includes(query)` checks whether the item matches — do this once per item inside the `.forEach`.',
    '`item.classList.toggle(\'hidden\', !matches)` is `classList.toggle`\'s two-argument form: the second argument FORCES the class on or off instead of flipping it, which is exactly what you need here (an item might go from hidden back to visible, not just toggle blindly).',
    'An empty search string means `\'\'.includes(\'\')` is always `true` for every item — clearing the box naturally shows everything again, no special case needed.',
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
