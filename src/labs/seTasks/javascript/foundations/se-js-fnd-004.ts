import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Inventory Tracker

An array of objects — the shape almost every real dataset starts as in JS. Practice iterating with
array methods and pulling summary numbers back out.
`;

const STARTER = `function addItem(inventory, name, price, quantity) {
  // TODO: push a new {name, price, quantity} object onto inventory. Return the updated array.
}

function totalValue(inventory) {
  // TODO: sum of price * quantity across every item
}

function mostExpensive(inventory) {
  // TODO: the item object with the highest price. Return null if inventory is empty.
}

module.exports = { addItem, totalValue, mostExpensive };
`;

const SOLUTION = `function addItem(inventory, name, price, quantity) {
  inventory.push({ name, price, quantity });
  return inventory;
}

function totalValue(inventory) {
  return inventory.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function mostExpensive(inventory) {
  if (inventory.length === 0) return null;
  return inventory.reduce((best, item) => (item.price > best.price ? item : best));
}

module.exports = { addItem, totalValue, mostExpensive };
`;

const TEST_CODE = `const { addItem, totalValue, mostExpensive } = require('./inventory');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let inv = [];
inv = addItem(inv, 'Widget', 2.5, 4);
inv = addItem(inv, 'Gadget', 10.0, 1);
inv = addItem(inv, 'Gizmo', 5.0, 2);
check('inventory has 3 items', inv.length, 3);
check('total value', totalValue(inv), 30.0);
check('most expensive name', mostExpensive(inv).name, 'Gadget');
check('most expensive on empty', mostExpensive([]), null);

const inv2 = addItem([], 'Solo', 3.0, 1);
check('total value single item', totalValue(inv2), 3.0);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-004',
  title: 'Inventory Tracker',
  difficulty: 'Easy',
  language: 'javascript',
  track: 'foundations',
  category: 'Data & Collections',
  tags: ['arrays', 'objects', 'reduce'],
  prompt: 'Track inventory as an array of item objects: add items, total their value, and find the priciest one.',
  hints: [
    '`inventory.push({ name, price, quantity })` — object shorthand builds the object from the matching parameter names, then return `inventory`.',
    '`inventory.reduce((sum, item) => sum + item.price * item.quantity, 0)` totals in one pass.',
    '`inventory.reduce((best, item) => (item.price > best.price ? item : best))` — without a seed, `reduce` starts from the first element, which works here since you already know the array isn\'t empty.',
    'Guard the empty case first in `mostExpensive` — return `null` before calling `.reduce()` on an empty array (which would throw).',
  ],
  files: [pf('README.md', README, { editable: false }), pf('inventory.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('inventory.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Inventory Tracker', kind: 'node-js', entry: 'inventory.js', testCode: TEST_CODE }],
};

export default task;
