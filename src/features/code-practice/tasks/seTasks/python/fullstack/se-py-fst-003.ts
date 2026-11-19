import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Product Card Template

Server-side rendering in its simplest form: the backend builds a ready-to-display HTML string
(\`template.py\`) instead of raw JSON, and the frontend just injects it — no client-side rendering
logic needed at all, the same division of labor a template-driven web framework (Flask+Jinja,
Django templates) uses.
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

const PRODUCTS = `PRODUCTS = {
    1: {"id": 1, "name": "Widget", "price": 9.99},
    2: {"id": 2, "name": "Gadget", "price": 24.5},
}
`;

const TEMPLATE_STARTER = `def render_product_card(product):
    """Return an HTML string:
    '<div class="card"><h2>{name}</h2><p class="price">\${price}</p></div>'
    Format price with exactly 2 decimal places (9.99, not 9.9 — Python's f-string \`:.2f\` format
    spec does this for you)."""
    # TODO
    pass
`;

const TEMPLATE_SOLUTION = `def render_product_card(product):
    return f'<div class="card"><h2>{product["name"]}</h2><p class="price">\${product["price"]:.2f}</p></div>'
`;

const ROUTES = `from framework import App
from products import PRODUCTS
from template import render_product_card

app = App()


@app.route('/products/<product_id>/card', methods=('GET',))
def product_card(req, product_id):
    product = PRODUCTS.get(int(product_id))
    if product is None:
        return (404, {"error": "not found"})
    return (200, {"html": render_product_card(product)})
`;

const MAIN = `from routes import app

if __name__ == '__main__':
    status, body = app.handle('GET', '/products/1/card')
    print(f"GET /products/1/card -> {status} {body}")
`;

const BACKEND_TEST_CODE = `from template import render_product_card
from routes import app

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

card = render_product_card({"id": 1, "name": "Widget", "price": 9.99})
__check__("card contains the name", "Widget" in card, True)
__check__("card formats price to 2 decimals", '$9.99' in card, True)

card2 = render_product_card({"id": 2, "name": "Gadget", "price": 24.5})
__check__("price is padded to 2 decimals even when the source has 1", '$24.50' in card2, True)

status, body = app.handle('GET', '/products/1/card')
__check__("route status", status, 200)
__check__("route returns the rendered html", body.get("html"), render_product_card({"id": 1, "name": "Widget", "price": 9.99}))

status, body = app.handle('GET', '/products/999/card')
__check__("missing product status", status, 404)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Product Card</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Featured Product</h1>
<div id="card"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.card { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; max-width: 240px; }
.price { color: #2563eb; font-weight: bold; }
`;

const APP_JS_STARTER = `async function loadCard() {
  // TODO:
  //  - fetch('/products/1/card') and parse the JSON body
  //  - set #card's innerHTML to data.html (the backend already rendered the full markup)
}

loadCard();
`;

const APP_JS_SOLUTION = `async function loadCard() {
  const res = await fetch('/products/1/card');
  const data = await res.json();
  document.getElementById('card').innerHTML = data.html;
}

loadCard();
`;

const FRONTEND_TEST_CODE = `checkExists('renders the card container', '#card .card');
checkText('renders the product name', '#card h2', 'Widget');
checkText('renders the formatted price', '#card .price', '$9.99');
`;

const FETCH_FIXTURES = {
  '/products/1/card': {
    html: '<div class="card"><h2>Widget</h2><p class="price">$9.99</p></div>',
  },
};

const task: ProjectTask = {
  id: 'se-py-fst-003',
  title: 'Product Card Template',
  difficulty: 'Medium',
  language: 'python',
  track: 'fullstack',
  category: 'Templating',
  tags: ['templating', 'server-side-rendering'],
  prompt: "Implement a server-side HTML template function that renders a product card, then wire up the frontend to fetch and inject the already-rendered markup — no client-side rendering logic needed.",
  hints: [
    'An f-string IS a template: `f\'<div>...</div>\'` with `{product["name"]}` and `{product["price"]:.2f}` interpolated directly into the markup.',
    'The `:.2f` format spec always shows exactly 2 decimal places — `24.5` becomes `"24.50"`, not `"24.5"`.',
    'The route (routes.py) is already correct and already calls `render_product_card` — you\'re only filling in the template function itself.',
    'frontend/app.js only needs `document.getElementById(\'card\').innerHTML = data.html;` — the backend already did all the rendering work.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/products.py', PRODUCTS, { editable: false }),
    pf('backend/template.py', TEMPLATE_STARTER),
    pf('backend/routes.py', ROUTES, { editable: false }),
    pf('backend/main.py', MAIN, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.py', FRAMEWORK, { editable: false }),
    pf('backend/products.py', PRODUCTS, { editable: false }),
    pf('backend/template.py', TEMPLATE_SOLUTION),
    pf('backend/routes.py', ROUTES, { editable: false }),
    pf('backend/main.py', MAIN, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'backend', label: 'Backend', kind: 'python', entry: 'backend/routes.py', testCode: BACKEND_TEST_CODE },
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
