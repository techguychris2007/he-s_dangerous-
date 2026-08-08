import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Product Catalog

A data layer with no route wrapping around it — just designing and querying the shape of the data
itself: add products, look them up, and filter by category. This is the layer real \`routes.py\`
handlers sit on top of.
`;

const STARTER = `PRODUCTS = []
_next_id = [1]


def add_product(name, category, price):
    """Create a product {"id": int, "name": str, "category": str, "price": float}, append it to
    PRODUCTS, and return it. Use and increment _next_id[0] for the id."""
    # TODO
    pass


def get_product(product_id):
    """Return the product dict with this id, or None if it doesn't exist."""
    # TODO
    pass


def list_by_category(category):
    """Return a list of every product whose category matches, in insertion order."""
    # TODO
    pass
`;

const SOLUTION = `PRODUCTS = []
_next_id = [1]


def add_product(name, category, price):
    product = {"id": _next_id[0], "name": name, "category": category, "price": price}
    PRODUCTS.append(product)
    _next_id[0] += 1
    return product


def get_product(product_id):
    for product in PRODUCTS:
        if product["id"] == product_id:
            return product
    return None


def list_by_category(category):
    return [p for p in PRODUCTS if p["category"] == category]
`;

const TEST_CODE = `from catalog import add_product, get_product, list_by_category

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

p1 = add_product("Widget", "hardware", 9.99)
__check__("add_product returns id 1", p1["id"], 1)
__check__("add_product stores the name", p1["name"], "Widget")

p2 = add_product("Gadget", "electronics", 19.99)
__check__("add_product increments the id", p2["id"], 2)

__check__("get_product finds an existing product", get_product(1)["name"], "Widget")
__check__("get_product returns None for a missing id", get_product(999), None)

add_product("Cable", "electronics", 4.99)
electronics = list_by_category("electronics")
__check__("list_by_category filters correctly", len(electronics), 2)
__check__("list_by_category preserves insertion order", electronics[0]["name"], "Gadget")

__check__("list_by_category with no matches is empty", list_by_category("nonexistent"), [])

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-007',
  title: 'Product Catalog',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Data Modeling',
  tags: ['data-modeling', 'dicts'],
  prompt: 'Design a small in-memory data layer: create products with auto-incrementing ids, look one up, and filter a list by category.',
  hints: [
    'Same auto-increment pattern as the Task API: build the dict, append it, bump `_next_id[0]`, return the dict.',
    '`get_product` is a linear scan: `for product in PRODUCTS: if product["id"] == product_id: return product`, then `return None` after the loop.',
    '`list_by_category` is a one-line list comprehension: `[p for p in PRODUCTS if p["category"] == category]`.',
    "Storing products in a plain list (not a dict keyed by id, unlike the Task API) means insertion order falls out naturally — no extra bookkeeping needed.",
  ],
  files: [pf('README.md', README, { editable: false }), pf('catalog.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('catalog.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Product Catalog', kind: 'python', entry: 'catalog.py', testCode: TEST_CODE }],
};

export default task;
