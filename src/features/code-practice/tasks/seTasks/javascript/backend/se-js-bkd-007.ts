import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Product Catalog

A data layer with no route wrapping around it — just designing and querying the shape of the data
itself: add products, look them up, and filter by category. This is the layer real \`routes.js\`
handlers sit on top of.
`;

const STARTER = `const PRODUCTS = [];
let nextId = 1;

function addProduct(name, category, price) {
  // TODO: create { id: nextId, name, category, price }, push it onto PRODUCTS, increment nextId,
  // and return it.
}

function getProduct(productId) {
  // TODO: return the product with this id, or null if it doesn't exist.
}

function listByCategory(category) {
  // TODO: return an array of every product whose category matches, in insertion order.
}

module.exports = { addProduct, getProduct, listByCategory };
`;

const SOLUTION = `const PRODUCTS = [];
let nextId = 1;

function addProduct(name, category, price) {
  const product = { id: nextId, name, category, price };
  PRODUCTS.push(product);
  nextId++;
  return product;
}

function getProduct(productId) {
  return PRODUCTS.find((p) => p.id === productId) || null;
}

function listByCategory(category) {
  return PRODUCTS.filter((p) => p.category === category);
}

module.exports = { addProduct, getProduct, listByCategory };
`;

const TEST_CODE = `const { addProduct, getProduct, listByCategory } = require('./catalog');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const p1 = addProduct('Widget', 'hardware', 9.99);
check('addProduct returns id 1', p1.id, 1);
check('addProduct stores the name', p1.name, 'Widget');

const p2 = addProduct('Gadget', 'electronics', 19.99);
check('addProduct increments the id', p2.id, 2);

check('getProduct finds an existing product', getProduct(1).name, 'Widget');
check('getProduct returns null for a missing id', getProduct(999), null);

addProduct('Cable', 'electronics', 4.99);
const electronics = listByCategory('electronics');
check('listByCategory filters correctly', electronics.length, 2);
check('listByCategory preserves insertion order', electronics[0].name, 'Gadget');

check('listByCategory with no matches is empty', listByCategory('nonexistent'), []);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-007',
  title: 'Product Catalog',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Data Modeling',
  tags: ['data-modeling', 'arrays'],
  prompt: 'Design a small in-memory data layer: create products with auto-incrementing ids, look one up, and filter a list by category.',
  hints: [
    'Same auto-increment pattern as the Task API: build the object, push it, increment `nextId`, return the object.',
    '`PRODUCTS.find((p) => p.id === productId) || null` — `.find()` already returns `undefined` on a miss, so `|| null` normalizes that to the documented return value.',
    '`listByCategory` is a one-line `.filter()`: `PRODUCTS.filter((p) => p.category === category)`.',
    'Storing products in a plain array (not a Map keyed by id, unlike the Task API) means insertion order falls out naturally — no extra bookkeeping needed.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('catalog.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('catalog.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Product Catalog', kind: 'node-js', entry: 'catalog.js', testCode: TEST_CODE }],
};

export default task;
