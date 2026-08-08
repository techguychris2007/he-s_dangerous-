import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Product Card Template

Server-side rendering in its simplest form: the backend builds a ready-to-display HTML string
(\`template.js\`) instead of raw JSON, and the frontend just injects it — no client-side rendering
logic needed at all.
`;

const FRAMEWORK = `class Request {
  constructor(method, path, body) {
    this.method = method;
    this.path = path;
    this.body = body || {};
  }
}

class App {
  constructor() {
    this.routes = [];
  }
  route(method, path, handler) {
    this.routes.push({ method, path, handler });
  }
  handle(method, path, body) {
    const req = new Request(method, path, body);
    for (const r of this.routes) {
      if (r.method !== method) continue;
      const params = matchPath(r.path, path);
      if (params) return r.handler(req, params);
    }
    return [404, { error: 'not found' }];
  }
}

function matchPath(pattern, path) {
  const p = pattern.replace(/^\\/|\\/$/g, '').split('/');
  const a = path.replace(/^\\/|\\/$/g, '').split('/');
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = a[i];
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

module.exports = { App };
`;

const PRODUCTS = `const PRODUCTS = {
  1: { id: 1, name: 'Widget', price: 9.99 },
  2: { id: 2, name: 'Gadget', price: 24.5 },
};

module.exports = { PRODUCTS };
`;

const TEMPLATE_STARTER = `function renderProductCard(product) {
  // TODO: return an HTML string:
  // '<div class="card"><h2>NAME</h2><p class="price">$PRICE</p></div>'
  // Format price with exactly 2 decimal places (product.price.toFixed(2)).
}

module.exports = { renderProductCard };
`;

const TEMPLATE_SOLUTION = `function renderProductCard(product) {
  return '<div class="card"><h2>' + product.name + '</h2><p class="price">$' + product.price.toFixed(2) + '</p></div>';
}

module.exports = { renderProductCard };
`;

const ROUTES = `const { App } = require('./framework');
const { PRODUCTS } = require('./products');
const { renderProductCard } = require('./template');

const app = new App();

app.route('GET', '/products/:id/card', function (req, params) {
  const product = PRODUCTS[Number(params.id)];
  if (!product) return [404, { error: 'not found' }];
  return [200, { html: renderProductCard(product) }];
});

module.exports = { app };
`;

const BACKEND_TEST_CODE = `const { renderProductCard } = require('./template');
const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const card = renderProductCard({ id: 1, name: 'Widget', price: 9.99 });
check('card contains the name', card.includes('Widget'), true);
check('card formats price to 2 decimals', card.includes('$9.99'), true);

const card2 = renderProductCard({ id: 2, name: 'Gadget', price: 24.5 });
check('price is padded to 2 decimals even when the source has 1', card2.includes('$24.50'), true);

const result = app.handle('GET', '/products/1/card');
check('route status', result[0], 200);
check('route returns the rendered html', result[1].html, renderProductCard({ id: 1, name: 'Widget', price: 9.99 }));

const missing = app.handle('GET', '/products/999/card');
check('missing product status', missing[0], 404);

console.log('__RESULT__ ' + passed + '/' + total);
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
  id: 'se-js-fst-004',
  title: 'Product Card Template',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'Templating',
  tags: ['templating', 'server-side-rendering'],
  prompt: 'Implement a server-side HTML template function that renders a product card, then wire up the frontend to fetch and inject the already-rendered markup.',
  hints: [
    "String concatenation IS the template: build the markup piece by piece with `+`, interpolating `product.name` and `product.price.toFixed(2)`.",
    '`.toFixed(2)` always shows exactly 2 decimal places — `24.5` becomes `"24.50"`, not `"24.5"`.',
    'The route (routes.js) is already correct and already calls `renderProductCard` — you\'re only filling in the template function itself.',
    "frontend/app.js only needs `document.getElementById('card').innerHTML = data.html;` — the backend already did all the rendering work.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/products.js', PRODUCTS, { editable: false }),
    pf('backend/template.js', TEMPLATE_STARTER),
    pf('backend/routes.js', ROUTES, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/products.js', PRODUCTS, { editable: false }),
    pf('backend/template.js', TEMPLATE_SOLUTION),
    pf('backend/routes.js', ROUTES, { editable: false }),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_SOLUTION),
  ],
  targets: [
    { id: 'backend', label: 'Backend', kind: 'node-js', entry: 'backend/routes.js', testCode: BACKEND_TEST_CODE },
    { id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'frontend/index.html', testCode: FRONTEND_TEST_CODE, fetchFixtures: FETCH_FIXTURES },
  ],
};

export default task;
