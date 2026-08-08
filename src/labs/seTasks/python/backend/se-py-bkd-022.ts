import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Shopping Cart API (Capstone)

An in-memory shopping cart API: validated item creation, a running total computed fresh from the
cart's contents every time, and removal — combining request validation with real state mutation in
one small app.
`;

const FRAMEWORK = `class Request:
    def __init__(self, method, path, body=None):
        self.method = method
        self.path = path
        self.body = body or {}


class App:
    def __init__(self):
        self.routes = []

    def route(self, path, methods=('GET',)):
        def decorator(fn):
            for m in methods:
                self.routes.append((m, path, fn))
            return fn
        return decorator

    def handle(self, method, path, body=None):
        req = Request(method, path, body)
        for m, pattern, fn in self.routes:
            if m != method:
                continue
            params = _match(pattern, path)
            if params is not None:
                return fn(req, **params)
        return (404, {"error": "not found"})


def _match(pattern, path):
    p_parts = pattern.strip('/').split('/')
    a_parts = path.strip('/').split('/')
    if len(p_parts) != len(a_parts):
        return None
    params = {}
    for p, a in zip(p_parts, a_parts):
        if p.startswith('<') and p.endswith('>'):
            params[p[1:-1]] = a
        elif p != a:
            return None
    return params
`;

const VALIDATION_STARTER = `def validate_item(body):
    """Return a list of error strings (empty list if valid):
    - "name is required" if body.get('name') is missing or an empty string.
    - "price must be a positive number" if body.get('price') is missing, not an int/float, or <= 0.
    - "quantity must be a positive integer" if body.get('quantity') is missing, not an int, or <= 0.
    Check ALL three fields — don't stop at the first problem."""
    # TODO
    pass
`;

const VALIDATION_SOLUTION = `def validate_item(body):
    errors = []
    if not body.get('name'):
        errors.append("name is required")

    price = body.get('price')
    if not isinstance(price, (int, float)) or isinstance(price, bool) or price <= 0:
        errors.append("price must be a positive number")

    quantity = body.get('quantity')
    if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity <= 0:
        errors.append("quantity must be a positive integer")

    return errors
`;

const CART_STARTER = `CART = []
_next_id = [1]


def add_item(name, price, quantity):
    """Create {"id": ..., "name": name, "price": price, "quantity": quantity}, append it to CART,
    increment _next_id[0], and return the created item."""
    # TODO
    pass


def remove_item(item_id):
    """Remove the item with this id from CART if present. Return True if removed, False if it
    wasn't there."""
    # TODO
    pass


def get_total():
    """Return the sum of price * quantity across every item currently in CART."""
    # TODO
    pass
`;

const CART_SOLUTION = `CART = []
_next_id = [1]


def add_item(name, price, quantity):
    item = {"id": _next_id[0], "name": name, "price": price, "quantity": quantity}
    CART.append(item)
    _next_id[0] += 1
    return item


def remove_item(item_id):
    for i, item in enumerate(CART):
        if item["id"] == item_id:
            CART.pop(i)
            return True
    return False


def get_total():
    return sum(item["price"] * item["quantity"] for item in CART)
`;

const ROUTES = `from framework import App
from validation import validate_item
from cart import add_item, remove_item, get_total

app = App()


@app.route('/cart/items', methods=('POST',))
def add(req):
    errors = validate_item(req.body)
    if errors:
        return (400, {"errors": errors})
    item = add_item(req.body.get('name'), req.body.get('price'), req.body.get('quantity'))
    return (201, item)


@app.route('/cart/items/<item_id>', methods=('DELETE',))
def remove(req, item_id):
    if remove_item(int(item_id)):
        return (200, {"removed": True})
    return (404, {"error": "not found"})


@app.route('/cart/total', methods=('GET',))
def total(req):
    return (200, {"total": get_total()})
`;

const TEST_CODE = `from validation import validate_item
from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("valid item has no errors", validate_item({"name": "Widget", "price": 9.99, "quantity": 2}), [])
__check__("missing name is an error", validate_item({"price": 9.99, "quantity": 2}), ["name is required"])
__check__("zero price is invalid", validate_item({"name": "X", "price": 0, "quantity": 1}), ["price must be a positive number"])
__check__("negative quantity is invalid", validate_item({"name": "X", "price": 5, "quantity": -1}), ["quantity must be a positive integer"])

status, body = app.handle('GET', '/cart/total')
__check__("empty cart total is 0", body["total"], 0)

status, body = app.handle('POST', '/cart/items', {"name": "Widget", "price": 10.0, "quantity": 2})
__check__("add item status", status, 201)
__check__("add item assigns id", body["id"], 1)

app.handle('POST', '/cart/items', {"name": "Gadget", "price": 5.0, "quantity": 3})

status, body = app.handle('GET', '/cart/total')
__check__("total reflects both items", body["total"], 35.0)

status, body = app.handle('POST', '/cart/items', {"name": ""})
__check__("invalid item is rejected", status, 400)

status, body = app.handle('DELETE', '/cart/items/1')
__check__("removing an existing item succeeds", status, 200)

status, body = app.handle('GET', '/cart/total')
__check__("total updates after removal", body["total"], 15.0)

status, body = app.handle('DELETE', '/cart/items/999')
__check__("removing a missing item fails", status, 404)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-022',
  title: 'Shopping Cart API',
  difficulty: 'Hard',
  language: 'python',
  track: 'backend',
  category: 'Capstones',
  tags: ['capstone', 'validation', 'state'],
  prompt: 'Build a validated shopping cart API: add items with real validation, compute a running total fresh from the cart every time, and remove items.',
  hints: [
    'Check all three fields independently and collect every error — same "build a list, never return early" pattern as the earlier validators in this track.',
    '`isinstance(price, (int, float)) and not isinstance(price, bool)` is needed because Python\'s `bool` is technically a subclass of `int` — without excluding it, `{"price": True}` would sneak past the type check.',
    '`add_item`/`remove_item` follow the exact same auto-increment and find-and-remove patterns used throughout this track — nothing new here, just combined into one app.',
    '`get_total` is a one-line generator sum: `sum(item["price"] * item["quantity"] for item in CART)` — it recomputes from scratch every call, so it can never drift out of sync with the actual cart contents.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('validation.py', VALIDATION_STARTER),
    pf('cart.py', CART_STARTER),
    pf('routes.py', ROUTES, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('framework.py', FRAMEWORK, { editable: false }),
    pf('validation.py', VALIDATION_SOLUTION),
    pf('cart.py', CART_SOLUTION),
    pf('routes.py', ROUTES, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Shopping Cart API', kind: 'python', entry: 'routes.py', testCode: TEST_CODE }],
};

export default task;
