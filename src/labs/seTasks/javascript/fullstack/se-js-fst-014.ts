import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Todo List With Live Count

An array is the state this time (not just a class on a DOM element) — adding and removing items
mutates \`TODOS\`, and one render function rebuilds both the visible list AND the remaining-count
display from that same array every time.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Todo List</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Todos</h1>
<input id="new-todo" type="text" value="Buy milk" />
<button id="add-btn">Add</button>
<ul id="todo-list"></ul>
<div id="remaining"></div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
input { padding: 0.4rem; margin-right: 0.5rem; }
li { padding: 0.3rem 0; }
.remove-btn { margin-left: 0.5rem; }
#remaining { margin-top: 0.75rem; font-weight: bold; }
`;

const APP_JS_STARTER = `let TODOS = [];
let nextId = 1;

function render() {
  // TODO:
  //  - rebuild #todo-list: one <li> per item in TODOS, each containing the item's text as a text
  //    node PLUS a <button class="remove-btn" data-id="ID">x</button>
  //  - set #remaining's textContent to "<N> remaining" where N is TODOS.length
}

document.getElementById('add-btn').addEventListener('click', function () {
  // TODO: read #new-todo's value; if it's non-empty, push {id: nextId, text: value} onto TODOS,
  // increment nextId, clear #new-todo's value back to '', and call render().
});

document.getElementById('todo-list').addEventListener('click', function (e) {
  // TODO: if e.target has class 'remove-btn', read its data-id, filter TODOS to remove the
  // matching item (TODOS = TODOS.filter(...)), and call render().
});

render();
`;

const APP_JS_SOLUTION = `let TODOS = [];
let nextId = 1;

function render() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  for (const todo of TODOS) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(todo.text));
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.dataset.id = String(todo.id);
    removeBtn.textContent = 'x';
    li.appendChild(removeBtn);
    list.appendChild(li);
  }
  document.getElementById('remaining').textContent = TODOS.length + ' remaining';
}

document.getElementById('add-btn').addEventListener('click', function () {
  const input = document.getElementById('new-todo');
  const text = input.value;
  if (!text) return;
  TODOS.push({ id: nextId, text: text });
  nextId++;
  input.value = '';
  render();
});

document.getElementById('todo-list').addEventListener('click', function (e) {
  if (!e.target.classList.contains('remove-btn')) return;
  const id = Number(e.target.dataset.id);
  TODOS = TODOS.filter(function (t) {
    return t.id !== id;
  });
  render();
});

render();
`;

const FRONTEND_TEST_CODE = `checkText('starts with zero remaining', '#remaining', '0 remaining');
checkCount('starts with no todos', '#todo-list li', 0);

await click('#add-btn');
checkCount('adds one todo', '#todo-list li', 1);
checkText('remaining count updates after adding', '#remaining', '1 remaining');
check('clears the input after adding', document.getElementById('new-todo').value, '');

await type('#new-todo', 'Walk the dog');
await click('#add-btn');
checkCount('adds a second todo', '#todo-list li', 2);
checkText('remaining count reflects both todos', '#remaining', '2 remaining');

await click('#todo-list .remove-btn');
checkCount('removes a todo when its x button is clicked', '#todo-list li', 1);
checkText('remaining count decreases after removal', '#remaining', '1 remaining');
checkText('the correct todo remains', '#todo-list li:first-child', 'Walk the dogx');
`;

const task: ProjectTask = {
  id: 'se-js-fst-014',
  title: 'Todo List With Live Count',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'fullstack',
  category: 'State & Data Flow',
  tags: ['state', 'dom', 'arrays'],
  prompt: 'Keep todos in an array, with one render() function that rebuilds the visible list AND the remaining-count from that same array on every change.',
  hints: [
    '`list.innerHTML = \'\';` at the top of `render()` clears out any previously-rendered items before rebuilding — otherwise you\'d get duplicates on every render.',
    'Each `<li>` needs both a text node for the todo text AND a remove button carrying `data-id` — build them with `document.createTextNode` and `document.createElement(\'button\')`, appending both to the `<li>`.',
    'The remove listener lives on `#todo-list` itself (event delegation, same pattern as earlier tasks) so it catches clicks on remove buttons for todos added AFTER the page first loaded.',
    '`TODOS = TODOS.filter(function (t) { return t.id !== id; })` builds a new array without the removed item — reassign `TODOS` to it, then `render()` to reflect the change.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('index.html', HTML, { editable: false }),
    pf('style.css', CSS, { editable: false }),
    pf('app.js', APP_JS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('index.html', HTML, { editable: false }),
    pf('style.css', CSS, { editable: false }),
    pf('app.js', APP_JS_SOLUTION),
  ],
  targets: [{ id: 'frontend', label: 'Frontend', kind: 'dom', entry: 'index.html', testCode: FRONTEND_TEST_CODE }],
};

export default task;
