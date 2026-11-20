import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Recipe Finder

Another search-and-render pair, this time filtering by an ingredient instead of a title — same
overall shape as Book Search, different query logic on the backend and a slightly richer render on
the frontend (each result shows two fields, not just one).
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

const RECIPES = `const RECIPES = [
  { id: 1, name: 'Tomato Soup', minutes: 20, ingredients: ['tomato', 'onion', 'garlic'] },
  { id: 2, name: 'Garlic Bread', minutes: 10, ingredients: ['bread', 'garlic', 'butter'] },
  { id: 3, name: 'Fruit Salad', minutes: 5, ingredients: ['apple', 'banana', 'grape'] },
];

function findByIngredient(ingredient) {
  const target = ingredient.toLowerCase();
  return RECIPES.filter((r) => r.ingredients.includes(target));
}

module.exports = { findByIngredient };
`;

const ROUTES_STARTER = `const { App } = require('./framework');
const { findByIngredient } = require('./recipes');

const app = new App();

app.route('GET', '/recipes/:ingredient', function (req, params) {
  // TODO: return [200, { results: findByIngredient(params.ingredient) }]
});

module.exports = { app };
`;

const ROUTES_SOLUTION = `const { App } = require('./framework');
const { findByIngredient } = require('./recipes');

const app = new App();

app.route('GET', '/recipes/:ingredient', function (req, params) {
  return [200, { results: findByIngredient(params.ingredient) }];
});

module.exports = { app };
`;

const BACKEND_TEST_CODE = `const { app } = require('./routes');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const result = app.handle('GET', '/recipes/garlic');
check('status', result[0], 200);
check('finds both garlic recipes', result[1].results.length, 2);
check('first result name', result[1].results[0].name, 'Tomato Soup');

const noMatch = app.handle('GET', '/recipes/chocolate');
check('no matches is an empty array, not an error', noMatch[1].results, []);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Recipe Finder</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Recipes with "garlic"</h1>
<div id="count"></div>
<ul id="results"></ul>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
#count { font-weight: bold; margin-bottom: 0.5rem; }
.minutes { color: #666; font-size: 0.9em; }
`;

const APP_JS_STARTER = `async function loadResults() {
  // TODO:
  //  - fetch('/recipes/garlic') and parse the JSON body
  //  - set #count's textContent to "<N> recipes" where N is the number of results
  //  - for each result, append an <li> to #results containing the recipe name AND its minutes,
  //    e.g.: "Tomato Soup" as an inline element of its own, plus " (20 min)" wrapped in a
  //    <span class="minutes">. Build it with two child nodes, not one string.
}

loadResults();
`;

const APP_JS_SOLUTION = `async function loadResults() {
  const res = await fetch('/recipes/garlic');
  const data = await res.json();
  const results = data.results;
  document.getElementById('count').textContent = results.length + ' recipes';
  const list = document.getElementById('results');
  for (const recipe of results) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(recipe.name));
    const minutes = document.createElement('span');
    minutes.className = 'minutes';
    minutes.textContent = ' (' + recipe.minutes + ' min)';
    li.appendChild(minutes);
    list.appendChild(li);
  }
}

loadResults();
`;

const FRONTEND_TEST_CODE = `checkText('renders result count', '#count', '2 recipes');
checkCount('renders one li per result', '#results li', 2);
checkText('first result shows the name and minutes', '#results li:first-child', 'Tomato Soup (20 min)');
checkText('second result shows the name and minutes', '#results li:nth-child(2)', 'Garlic Bread (10 min)');
`;

const FETCH_FIXTURES = {
  '/recipes/garlic': {
    results: [
      { id: 1, name: 'Tomato Soup', minutes: 20, ingredients: ['tomato', 'onion', 'garlic'] },
      { id: 2, name: 'Garlic Bread', minutes: 10, ingredients: ['bread', 'garlic', 'butter'] },
    ],
  },
};

const task: ProjectTask = {
  id: 'se-js-fst-003',
  title: 'Recipe Finder',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'JSON APIs + Client',
  tags: ['fetch', 'rendering', 'search'],
  prompt: 'Search recipes by ingredient on the backend, then render each result with two pieces of data (name and cook time) built from two separate DOM nodes.',
  hints: [
    '`RECIPES.filter((r) => r.ingredients.includes(target))` — `findByIngredient` is already written; the route just wraps it in the response shape.',
    'An ingredient with no matches should return an empty array, not an error — `.filter()` already does this correctly on its own, no extra handling needed.',
    '`document.createTextNode(recipe.name)` creates a plain text node you can append directly, alongside a separate `<span>` for the minutes — two children, not one combined string.',
    'The minutes span\'s text starts with a leading space (`\' (\' + recipe.minutes + \' min)\'`) so it doesn\'t run together with the name when both nodes render side by side.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/recipes.js', RECIPES, { editable: false }),
    pf('backend/routes.js', ROUTES_STARTER),
    pf('frontend/index.html', HTML, { editable: false }),
    pf('frontend/style.css', CSS, { editable: false }),
    pf('frontend/app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('backend/framework.js', FRAMEWORK, { editable: false }),
    pf('backend/recipes.js', RECIPES, { editable: false }),
    pf('backend/routes.js', ROUTES_SOLUTION),
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
