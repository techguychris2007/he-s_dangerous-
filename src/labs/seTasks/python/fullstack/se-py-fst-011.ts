import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Reusable Card Renderer

A single function that builds one real DOM element (not an HTML string this time) from a data
object — the "component function" pattern that scales up to real component frameworks, just
without any framework underneath it.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Product Cards</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Products</h1>
<div id="cards"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem; max-width: 200px; }
.price { color: #2563eb; font-weight: bold; }
`;

const APP_JS_STARTER = `const ITEMS = [
  { name: 'Widget', price: 9.99 },
  { name: 'Gadget', price: 19.99 },
];

function renderCard(item) {
  // TODO: build and return a DOM element (not a string):
  // <div class="card"><h3>NAME</h3><p class="price">$PRICE</p></div>
  // using document.createElement + textContent + appendChild. Format price to 2 decimals.
}

const container = document.getElementById('cards');
for (const item of ITEMS) {
  container.appendChild(renderCard(item));
}
`;

const APP_JS_SOLUTION = `const ITEMS = [
  { name: 'Widget', price: 9.99 },
  { name: 'Gadget', price: 19.99 },
];

function renderCard(item) {
  const card = document.createElement('div');
  card.className = 'card';

  const heading = document.createElement('h3');
  heading.textContent = item.name;
  card.appendChild(heading);

  const price = document.createElement('p');
  price.className = 'price';
  price.textContent = '$' + item.price.toFixed(2);
  card.appendChild(price);

  return card;
}

const container = document.getElementById('cards');
for (const item of ITEMS) {
  container.appendChild(renderCard(item));
}
`;

const FRONTEND_TEST_CODE = `checkCount('renders one card per item', '#cards .card', 2);
checkText('first card name', '#cards .card:first-child h3', 'Widget');
checkText('first card price', '#cards .card:first-child .price', '$9.99');
checkText('second card name', '#cards .card:nth-child(2) h3', 'Gadget');
checkText('second card price', '#cards .card:nth-child(2) .price', '$19.99');
`;

const task: ProjectTask = {
  id: 'se-py-fst-011',
  title: 'Reusable Card Renderer',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'Component Patterns',
  tags: ['components', 'dom'],
  prompt: 'Write a function that builds and returns a real DOM element from a data object, then reuse it once per item — the smallest possible "component."',
  hints: [
    '`document.createElement(\'div\')` makes an element that doesn\'t exist on the page yet — nothing shows up until you `appendChild` it somewhere.',
    'Build the inner pieces the same way: create the `<h3>`, set its `.textContent`, `appendChild` it onto `card` — repeat for the price paragraph.',
    '`item.price.toFixed(2)` formats a number to exactly 2 decimal places as a string — `9.99` stays `"9.99"`, `19.9` becomes `"19.90"`.',
    'The function must `return card` at the end — the caller (`container.appendChild(renderCard(item))`) is what actually puts it on the page.',
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
