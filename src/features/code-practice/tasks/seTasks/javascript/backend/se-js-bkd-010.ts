import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Write-Through Task Store

Combine an in-memory data layer with immediate "persistence": every write goes straight through to
the backing store before the function returns, so a fresh read always reflects the latest state —
the same write-through pattern a real (if much simpler) database uses. (Same note as the Serialized
Store task: no real filesystem in this Worker, so a Map stands in for "disk.")
`;

const STARTER = `const DISK = new Map();
const FILE_KEY = 'tasks.json';

function _load() {
  if (!DISK.has(FILE_KEY)) return [];
  return JSON.parse(DISK.get(FILE_KEY));
}

function _save(tasks) {
  DISK.set(FILE_KEY, JSON.stringify(tasks));
}

function addTask(title) {
  // TODO: load the current tasks, push a new { title, done: false } object, save, and return the
  // full updated list.
}

function completeTask(index) {
  // TODO: load the current tasks, set tasks[index].done = true, save, and return the full updated
  // list. Assume index is always valid.
}

function getTasks() {
  // TODO: return the current list of tasks from the store.
}

module.exports = { addTask, completeTask, getTasks };
`;

const SOLUTION = `const DISK = new Map();
const FILE_KEY = 'tasks.json';

function _load() {
  if (!DISK.has(FILE_KEY)) return [];
  return JSON.parse(DISK.get(FILE_KEY));
}

function _save(tasks) {
  DISK.set(FILE_KEY, JSON.stringify(tasks));
}

function addTask(title) {
  const tasks = _load();
  tasks.push({ title, done: false });
  _save(tasks);
  return tasks;
}

function completeTask(index) {
  const tasks = _load();
  tasks[index].done = true;
  _save(tasks);
  return tasks;
}

function getTasks() {
  return _load();
}

module.exports = { addTask, completeTask, getTasks };
`;

const TEST_CODE = `const { addTask, completeTask, getTasks } = require('./tasks');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('starts empty', getTasks(), []);

addTask('Buy milk');
let tasks = getTasks();
check('addTask persists a new task', tasks.length, 1);
check('new task starts not done', tasks[0].done, false);

addTask('Walk the dog');
check('second addTask adds another entry', getTasks().length, 2);

completeTask(0);
tasks = getTasks();
check('completeTask marks the right task done', tasks[0].done, true);
check('completeTask leaves other tasks alone', tasks[1].done, false);

const result = addTask('Water the plants');
check('addTask returns the full updated list', result.length, 3);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-010',
  title: 'Write-Through Task Store',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Persistence',
  tags: ['persistence', 'json'],
  prompt: 'Build a write-through task store: every add/complete loads the current data, mutates it, and saves immediately — so the store is always the source of truth.',
  hints: [
    'The private `_load()`/`_save()` helpers are already written — every public function should call one or both, never touch `DISK` directly.',
    '`addTask`: load, `tasks.push({ title, done: false })`, save, then return `tasks`.',
    '`completeTask`: load, `tasks[index].done = true` (mutating the loaded array in place is fine here, since it\'s about to be saved), save, return `tasks`.',
    '`getTasks` is a one-line wrapper around `_load()` — there\'s no separate in-memory state to keep in sync, the store IS the state.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('tasks.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('tasks.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Write-Through Task Store', kind: 'node-js', entry: 'tasks.js', testCode: TEST_CODE }],
};

export default task;
