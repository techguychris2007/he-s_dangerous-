import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Todo Toggle

A frontend-only task: click a todo item to mark it done (strikethrough), click it again to mark it
not-done — each item toggles independently. Real DOM, real click events, graded inside a sandboxed
browser frame.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Todo Toggle</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Todos</h1>
<ul id="todos">
<li class="todo" id="todo-1">Buy milk</li>
<li class="todo" id="todo-2">Walk the dog</li>
</ul>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.todo { padding: 0.4rem 0; cursor: pointer; }
.todo.done { text-decoration: line-through; color: #888; }
`;

const APP_JS_STARTER = `const todos = document.querySelectorAll('.todo');

todos.forEach(function (todo) {
  todo.addEventListener('click', function () {
    // TODO: toggle the 'done' class on THIS todo item (classList.toggle is exactly one call).
  });
});
`;

const APP_JS_SOLUTION = `const todos = document.querySelectorAll('.todo');

todos.forEach(function (todo) {
  todo.addEventListener('click', function () {
    todo.classList.toggle('done');
  });
});
`;

const FRONTEND_TEST_CODE = `checkExists('todo-1 starts without the done class', '#todo-1:not(.done)');
await click('#todo-1');
checkExists('todo-1 gets the done class after one click', '#todo-1.done');
await click('#todo-1');
checkExists('todo-1 loses the done class on a second click', '#todo-1:not(.done)');

await click('#todo-2');
checkExists('todo-2 toggles independently', '#todo-2.done');
checkExists('todo-1 is unaffected by clicking todo-2', '#todo-1:not(.done)');
`;

const task: ProjectTask = {
  id: 'se-py-fst-007',
  title: 'Todo Toggle',
  difficulty: 'Easy',
  language: 'python',
  track: 'fullstack',
  category: 'Events & Interaction',
  tags: ['dom', 'events'],
  prompt: 'Wire up click-to-toggle on each todo item — clicking marks it done (strikethrough), clicking again marks it not-done, and every item toggles independently.',
  hints: [
    '`document.querySelectorAll(\'.todo\')` is already looked up for you, and `.forEach` already loops over each one, attaching its own listener.',
    'Inside the listener, `todo` refers to THAT specific item (thanks to the closure over the forEach callback\'s parameter) — no need to look it up again.',
    '`todo.classList.toggle(\'done\')` adds the class if it\'s missing, removes it if it\'s present — exactly the on/off behavior this needs, in one call.',
    'CSS already handles the visual strikethrough via `.todo.done` — you only need to manage the class, not any styling directly.',
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
