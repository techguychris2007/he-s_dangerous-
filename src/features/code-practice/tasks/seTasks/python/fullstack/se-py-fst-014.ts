import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Cart Total State

State that's an ARRAY instead of a number: adding an item pushes onto it, and one render function
rebuilds both the visible list AND the computed total from that same array every time it changes —
never two separate places to keep in sync by hand.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Shopping Cart</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Shopping Cart</h1>
<button id="add-widget">Add Widget ($5)</button>
<button id="add-gadget">Add Gadget ($10)</button>
<button id="clear">Clear Cart</button>
<ul id="cart"></ul>
<div id="total"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
button { margin-right: 0.5rem; padding: 0.4rem 0.8rem; }
#total { font-weight: bold; margin-top: 0.5rem; }
`;

const APP_JS_STARTER = `let cart = [];

function render() {
  // TODO:
  //  - rebuild #cart's contents: one <li> per item in cart, textContent set to item.name
  //  - set #total's textContent to "Total: $X.XX", the sum of every item's price, formatted to 2
  //    decimals (e.g. "Total: $15.00")
}

document.getElementById('add-widget').addEventListener('click', function () {
  // TODO: push { name: 'Widget', price: 5 } onto cart, then call render()
});

document.getElementById('add-gadget').addEventListener('click', function () {
  // TODO: push { name: 'Gadget', price: 10 } onto cart, then call render()
});

document.getElementById('clear').addEventListener('click', function () {
  // TODO: empty cart back to [], then call render()
});

render();
`;

const APP_JS_SOLUTION = `let cart = [];

function render() {
  const list = document.getElementById('cart');
  list.innerHTML = '';
  for (const item of cart) {
    const li = document.createElement('li');
    li.textContent = item.name;
    list.appendChild(li);
  }
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.getElementById('total').textContent = 'Total: $' + total.toFixed(2);
}

document.getElementById('add-widget').addEventListener('click', function () {
  cart.push({ name: 'Widget', price: 5 });
  render();
});

document.getElementById('add-gadget').addEventListener('click', function () {
  cart.push({ name: 'Gadget', price: 10 });
  render();
});

document.getElementById('clear').addEventListener('click', function () {
  cart = [];
  render();
});

render();
`;

const FRONTEND_TEST_CODE = `checkCount('cart starts empty', '#cart li', 0);
checkText('total starts at zero', '#total', 'Total: $0.00');

await click('#add-widget');
checkCount('adds one item to the cart', '#cart li', 1);
checkText('total reflects the added item', '#total', 'Total: $5.00');

await click('#add-gadget');
checkCount('adds a second item', '#cart li', 2);
checkText('total sums both items', '#total', 'Total: $15.00');

await click('#clear');
checkCount('clear empties the cart', '#cart li', 0);
checkText('clear resets the total', '#total', 'Total: $0.00');
`;

const task: ProjectTask = {
  id: 'se-py-fst-014',
  title: 'Cart Total State',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'State & Data Flow',
  tags: ['state', 'dom', 'reduce'],
  prompt: 'Keep a shopping cart as an array of items, with one render() function that rebuilds the visible list AND recomputes the total from that same array — no separate bookkeeping to keep in sync.',
  hints: [
    '`list.innerHTML = \'\';` at the top of `render()` clears out any previously-rendered items before rebuilding — otherwise every render would just keep appending duplicates.',
    'Rebuild the list the same way you have in earlier tasks: `document.createElement(\'li\')`, set `.textContent`, `appendChild`.',
    '`cart.reduce((sum, item) => sum + item.price, 0)` computes the total directly from the array — no separate running total to keep updated by hand.',
    'Each "Add" button just pushes one new item onto `cart` and calls `render()` — all the display logic lives in one place, not duplicated per button.',
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
