import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Kanban Task Board (Capstone)

A three-column board where tasks move between columns via "<"/">" buttons instead of drag-and-drop
(real drag events can't be simulated reliably in this sandbox) — the same underlying state
management a real Kanban board needs: an array of tasks, each tagged with its current column, one
render function that rebuilds all three columns from that array every time anything changes. Pure
frontend — no backend needed.
`;

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Task Board</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
<h1>Task Board</h1>
<div class="board">
<div class="column" data-column="todo">
<h2>To Do (<span class="count" id="count-todo">0</span>)</h2>
<ul id="list-todo"></ul>
</div>
<div class="column" data-column="progress">
<h2>In Progress (<span class="count" id="count-progress">0</span>)</h2>
<ul id="list-progress"></ul>
</div>
<div class="column" data-column="done">
<h2>Done (<span class="count" id="count-done">0</span>)</h2>
<ul id="list-done"></ul>
</div>
</div>
<script src="app.js"></script>
</body>
</html>
`;

const CSS = `body { font-family: sans-serif; margin: 2rem; color: #1a1a1a; }
.board { display: flex; gap: 1.5rem; }
.column { flex: 1; border: 1px solid #eee; padding: 0.75rem; border-radius: 6px; }
.column ul { list-style: none; padding: 0; margin: 0; }
.column li { padding: 0.4rem; margin-bottom: 0.4rem; background: #f4f4f5; border-radius: 4px; }
.column button { margin-left: 0.4rem; }
`;

const APP_JS_STARTER = `let TASKS = [
  { id: 1, text: 'Design mockups', column: 'todo' },
  { id: 2, text: 'Write tests', column: 'progress' },
  { id: 3, text: 'Fix bug #42', column: 'done' },
];

const COLUMNS = ['todo', 'progress', 'done'];

function render() {
  // TODO: for each name in COLUMNS:
  //  - clear that column's <ul> (#list-<name>)
  //  - for every task in TASKS whose .column matches, append an <li> containing:
  //      a text node with the task's text (plus a trailing space)
  //      IF this isn't the first column: a "<" button with data-action="left" and data-id=task.id
  //      IF this isn't the last column: a ">" button with data-action="right" and data-id=task.id
  //  - set #count-<name>'s textContent to the number of tasks in that column
  // Hint: COLUMNS.indexOf(name) tells you the column's position, so you know whether it's first/last.
}

document.querySelector('.board').addEventListener('click', function (e) {
  // TODO: read e.target.dataset.action ('left'/'right') and e.target.dataset.id. If either is
  // missing, return. Otherwise find the matching task in TASKS, compute its current column index
  // via COLUMNS.indexOf(task.column), move it one step left or right (COLUMNS[index - 1] or
  // COLUMNS[index + 1]) — but only if that new index is a valid position in COLUMNS — and re-render.
});

render();
`;

const APP_JS_SOLUTION = `let TASKS = [
  { id: 1, text: 'Design mockups', column: 'todo' },
  { id: 2, text: 'Write tests', column: 'progress' },
  { id: 3, text: 'Fix bug #42', column: 'done' },
];

const COLUMNS = ['todo', 'progress', 'done'];

function render() {
  COLUMNS.forEach(function (name) {
    const list = document.getElementById('list-' + name);
    list.innerHTML = '';
    const colIndex = COLUMNS.indexOf(name);
    const tasksInColumn = TASKS.filter(function (t) {
      return t.column === name;
    });

    tasksInColumn.forEach(function (task) {
      const li = document.createElement('li');
      li.appendChild(document.createTextNode(task.text + ' '));

      if (colIndex > 0) {
        const leftBtn = document.createElement('button');
        leftBtn.textContent = '<';
        leftBtn.dataset.action = 'left';
        leftBtn.dataset.id = String(task.id);
        li.appendChild(leftBtn);
      }
      if (colIndex < COLUMNS.length - 1) {
        const rightBtn = document.createElement('button');
        rightBtn.textContent = '>';
        rightBtn.dataset.action = 'right';
        rightBtn.dataset.id = String(task.id);
        li.appendChild(rightBtn);
      }

      list.appendChild(li);
    });

    document.getElementById('count-' + name).textContent = String(tasksInColumn.length);
  });
}

document.querySelector('.board').addEventListener('click', function (e) {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;
  if (!action || !id) return;

  const task = TASKS.find(function (t) {
    return t.id === Number(id);
  });
  if (!task) return;

  const colIndex = COLUMNS.indexOf(task.column);
  const newIndex = action === 'left' ? colIndex - 1 : colIndex + 1;
  if (newIndex < 0 || newIndex >= COLUMNS.length) return;

  task.column = COLUMNS[newIndex];
  render();
});

render();
`;

const FRONTEND_TEST_CODE = `checkText('todo column starts with 1 task', '#count-todo', '1');
checkText('progress column starts with 1 task', '#count-progress', '1');
checkText('done column starts with 1 task', '#count-done', '1');
checkCount('leftmost column tasks have no left-move button', '#list-todo button[data-action="left"]', 0);
checkCount('rightmost column tasks have no right-move button', '#list-done button[data-action="right"]', 0);

await click('#list-todo button[data-id="1"][data-action="right"]');
checkText('todo count decreases after moving a task right', '#count-todo', '0');
checkText('progress count increases', '#count-progress', '2');
checkCount('the moved task appears in the progress list', '#list-progress li', 2);

await click('#list-progress button[data-id="2"][data-action="right"]');
checkText('progress count decreases after moving task 2 right', '#count-progress', '1');
checkText('done count increases', '#count-done', '2');

await click('#list-done button[data-id="3"][data-action="left"]');
checkText('done count decreases after moving task 3 left', '#count-done', '1');
checkText('progress count increases again', '#count-progress', '2');
`;

const task: ProjectTask = {
  id: 'se-js-fst-023',
  title: 'Kanban Task Board',
  difficulty: 'Hard',
  language: 'javascript',
  track: 'fullstack',
  category: 'Capstones',
  tags: ['capstone', 'state', 'dom', 'events'],
  prompt:
    'Build a 3-column task board where each task moves between columns via "<"/">" buttons — one array ' +
    'of tasks tagged by column, one render() function that rebuilds all three columns from that array ' +
    'every time a task moves.',
  hints: [
    'render() loops over COLUMNS, and for EACH column: clears its list, filters TASKS down to just that column, builds an `<li>` per task (with conditional move buttons), and updates the count — all three columns get fully rebuilt on every call.',
    'A task only gets a "<" button if it\'s NOT in the first column (`colIndex > 0`), and only a ">" button if it\'s NOT in the last column (`colIndex < COLUMNS.length - 1`) — that\'s what makes the boundary columns naturally have no invalid move option.',
    'The click listener lives on `.board` itself (event delegation) so it catches clicks on move buttons in any column, including ones that only exist after tasks have already moved around.',
    '`COLUMNS[colIndex - 1]` or `COLUMNS[colIndex + 1]` computes the new column name from the old one\'s position — check the resulting index is still `>= 0` and `< COLUMNS.length` before applying it, as a safety net (though the button visibility rules should already prevent an invalid click).',
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
