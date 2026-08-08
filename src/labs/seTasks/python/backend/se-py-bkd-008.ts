import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Order Line Items

Nested data modeling: an order is a dict containing a LIST of line-item dicts, and the interesting
logic lives in aggregating across that nested structure — the same shape a real order/invoice
system's data layer takes.
`;

const STARTER = `def create_order(order_id):
    """Return a new order: {"id": order_id, "items": []}."""
    # TODO
    pass


def add_line_item(order, product_name, unit_price, quantity):
    """Append a line item {"product": product_name, "unit_price": unit_price, "quantity": quantity}
    to order["items"]. Return the order."""
    # TODO
    pass


def order_total(order):
    """Return the sum of unit_price * quantity across every line item in the order."""
    # TODO
    pass


def most_expensive_item(order):
    """Return the line item dict with the highest (unit_price * quantity) line total.
    Return None if the order has no items."""
    # TODO
    pass
`;

const SOLUTION = `def create_order(order_id):
    return {"id": order_id, "items": []}


def add_line_item(order, product_name, unit_price, quantity):
    order["items"].append({"product": product_name, "unit_price": unit_price, "quantity": quantity})
    return order


def order_total(order):
    return sum(item["unit_price"] * item["quantity"] for item in order["items"])


def most_expensive_item(order):
    if not order["items"]:
        return None
    return max(order["items"], key=lambda item: item["unit_price"] * item["quantity"])
`;

const TEST_CODE = `from orders import create_order, add_line_item, order_total, most_expensive_item

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

order = create_order(42)
__check__("new order has the right id", order["id"], 42)
__check__("new order starts with no items", order["items"], [])

add_line_item(order, "Widget", 2.0, 3)
add_line_item(order, "Gadget", 10.0, 1)
__check__("order now has 2 line items", len(order["items"]), 2)

__check__("order_total sums unit_price * quantity", order_total(order), 16.0)

expensive = most_expensive_item(order)
__check__("most_expensive_item picks the highest line total", expensive["product"], "Gadget")

empty_order = create_order(1)
__check__("most_expensive_item on an empty order", most_expensive_item(empty_order), None)
__check__("order_total on an empty order", order_total(empty_order), 0)

add_line_item(order, "Bulk Widget", 1.0, 20)
expensive2 = most_expensive_item(order)
__check__("most_expensive_item considers quantity, not just unit price", expensive2["product"], "Bulk Widget")

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-008',
  title: 'Order Line Items',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Data Modeling',
  tags: ['data-modeling', 'nested-data'],
  prompt: 'Model an order as a dict containing a list of line items, then aggregate across that nested structure to compute totals and find the priciest line.',
  hints: [
    '`create_order` returns a dict shape with an empty `"items"` list — nothing to compute yet.',
    '`add_line_item` builds one line-item dict and appends it to `order["items"]`.',
    '`order_total` is a generator sum over `order["items"]`: `sum(item["unit_price"] * item["quantity"] for item in order["items"])`.',
    'For `most_expensive_item`, the sort key is the LINE total (`unit_price * quantity`), not just `unit_price` — a cheap item bought in bulk can outrank an expensive single item.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('orders.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('orders.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Order Line Items', kind: 'python', entry: 'orders.py', testCode: TEST_CODE }],
};

export default task;
