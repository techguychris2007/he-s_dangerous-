import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Inventory Tracker

A list of dicts — the shape almost every real dataset starts as. Practice iterating over a list of
records and pulling summary numbers back out of it.
`;

const STARTER = `def add_item(inventory, name, price, quantity):
    """Append a new item dict {'name', 'price', 'quantity'} to \`inventory\`. Return the updated list."""
    # TODO
    pass


def total_value(inventory):
    """Return the sum of price * quantity across every item in \`inventory\`."""
    # TODO
    pass


def most_expensive(inventory):
    """Return the item dict with the highest \`price\`. Return None if \`inventory\` is empty."""
    # TODO
    pass
`;

const SOLUTION = `def add_item(inventory, name, price, quantity):
    inventory.append({'name': name, 'price': price, 'quantity': quantity})
    return inventory


def total_value(inventory):
    return sum(item['price'] * item['quantity'] for item in inventory)


def most_expensive(inventory):
    if not inventory:
        return None
    return max(inventory, key=lambda item: item['price'])
`;

const TEST_CODE = `from inventory import add_item, total_value, most_expensive

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

inv = []
inv = add_item(inv, "Widget", 2.5, 4)
inv = add_item(inv, "Gadget", 10.0, 1)
inv = add_item(inv, "Gizmo", 5.0, 2)
__check__("inventory has 3 items", len(inv), 3)
__check__("total value", total_value(inv), 30.0)
__check__("most expensive name", most_expensive(inv)['name'], "Gadget")
__check__("most expensive on empty", most_expensive([]), None)

inv2 = add_item([], "Solo", 3.0, 1)
__check__("total value single item", total_value(inv2), 3.0)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-004',
  title: 'Inventory Tracker',
  difficulty: 'Easy',
  language: 'python',
  track: 'foundations',
  category: 'Data & Collections',
  tags: ['lists', 'dicts', 'aggregation'],
  prompt: 'Track inventory as a list of item dicts: add items, total their value, and find the priciest one.',
  hints: [
    '`add_item` builds a dict with the three keys and appends it — `inventory.append({...})`, then return `inventory`.',
    '`total_value` is a one-line generator sum: `sum(item[\'price\'] * item[\'quantity\'] for item in inventory)`.',
    "`max(inventory, key=lambda item: item['price'])` finds the dict with the highest price directly.",
    'Guard the empty case first in `most_expensive` — `max()` on an empty sequence raises, so check `if not inventory` before calling it.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('inventory.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('inventory.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Inventory Tracker', kind: 'python', entry: 'inventory.py', testCode: TEST_CODE }],
};

export default task;
