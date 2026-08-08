import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Order Line Items

Nested data modeling: an order is an object containing an ARRAY of line-item objects, and the
interesting logic lives in aggregating across that nested structure — the same shape a real
order/invoice system's data layer takes.
`;

const STARTER = `function createOrder(orderId) {
  // TODO: return a new order: { id: orderId, items: [] }.
}

function addLineItem(order, productName, unitPrice, quantity) {
  // TODO: push { product: productName, unitPrice, quantity } onto order.items. Return the order.
}

function orderTotal(order) {
  // TODO: return the sum of unitPrice * quantity across every line item in the order.
}

function mostExpensiveItem(order) {
  // TODO: return the line item with the highest (unitPrice * quantity) line total.
  // Return null if the order has no items.
}

module.exports = { createOrder, addLineItem, orderTotal, mostExpensiveItem };
`;

const SOLUTION = `function createOrder(orderId) {
  return { id: orderId, items: [] };
}

function addLineItem(order, productName, unitPrice, quantity) {
  order.items.push({ product: productName, unitPrice, quantity });
  return order;
}

function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function mostExpensiveItem(order) {
  if (order.items.length === 0) return null;
  return order.items.reduce((best, item) =>
    item.unitPrice * item.quantity > best.unitPrice * best.quantity ? item : best
  );
}

module.exports = { createOrder, addLineItem, orderTotal, mostExpensiveItem };
`;

const TEST_CODE = `const { createOrder, addLineItem, orderTotal, mostExpensiveItem } = require('./orders');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const order = createOrder(42);
check('new order has the right id', order.id, 42);
check('new order starts with no items', order.items, []);

addLineItem(order, 'Widget', 2.0, 3);
addLineItem(order, 'Gadget', 10.0, 1);
check('order now has 2 line items', order.items.length, 2);

check('orderTotal sums unitPrice * quantity', orderTotal(order), 16.0);

const expensive = mostExpensiveItem(order);
check('mostExpensiveItem picks the highest line total', expensive.product, 'Gadget');

const emptyOrder = createOrder(1);
check('mostExpensiveItem on an empty order', mostExpensiveItem(emptyOrder), null);
check('orderTotal on an empty order', orderTotal(emptyOrder), 0);

addLineItem(order, 'Bulk Widget', 1.0, 20);
const expensive2 = mostExpensiveItem(order);
check('mostExpensiveItem considers quantity, not just unit price', expensive2.product, 'Bulk Widget');

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-008',
  title: 'Order Line Items',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Data Modeling',
  tags: ['data-modeling', 'nested-data'],
  prompt: 'Model an order as an object containing an array of line items, then aggregate across that nested structure to compute totals and find the priciest line.',
  hints: [
    '`createOrder` returns an object shape with an empty `items` array — nothing to compute yet.',
    '`addLineItem` builds one line-item object and pushes it onto `order.items`.',
    '`orderTotal` is a `.reduce()` over `order.items`: `order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)`.',
    'For `mostExpensiveItem`, compare the LINE total (`unitPrice * quantity`), not just `unitPrice` — a cheap item bought in bulk can outrank an expensive single item.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('orders.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('orders.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Order Line Items', kind: 'node-js', entry: 'orders.js', testCode: TEST_CODE }],
};

export default task;
