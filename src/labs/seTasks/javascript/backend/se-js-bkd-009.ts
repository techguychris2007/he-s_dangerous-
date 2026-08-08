import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Serialized Store

This runner executes your code in a plain Worker with no real filesystem (unlike the Python
backend track, which has one via Pyodide) — so "persistence" here means round-tripping through
\`JSON.stringify\`/\`JSON.parse\` against an in-memory string standing in for a file's contents. Same
serialization discipline a real file-backed store needs, without an actual disk underneath.
`;

const STARTER = `function serialize(data) {
  // TODO: return data as a JSON string.
}

function deserialize(text) {
  // TODO: parse text back into a JS value. If text is null/undefined/empty, return {} instead of
  // throwing.
}

function saveToStore(store, key, data) {
  // TODO: store is a Map standing in for "disk" — set store.set(key, serialize(data)). Return
  // undefined (this function's job is the side effect).
}

function loadFromStore(store, key) {
  // TODO: read store.get(key) and deserialize it. Return {} if the key isn't in store at all.
}

module.exports = { serialize, deserialize, saveToStore, loadFromStore };
`;

const SOLUTION = `function serialize(data) {
  return JSON.stringify(data);
}

function deserialize(text) {
  if (!text) return {};
  return JSON.parse(text);
}

function saveToStore(store, key, data) {
  store.set(key, serialize(data));
}

function loadFromStore(store, key) {
  if (!store.has(key)) return {};
  return deserialize(store.get(key));
}

module.exports = { serialize, deserialize, saveToStore, loadFromStore };
`;

const TEST_CODE = `const { serialize, deserialize, saveToStore, loadFromStore } = require('./store');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('serialize produces a JSON string', serialize({ a: 1 }), '{"a":1}');
check('round trip preserves the value', deserialize(serialize({ theme: 'dark', volume: 80 })), { theme: 'dark', volume: 80 });
check('deserialize of empty text is {}', deserialize(''), {});
check('deserialize of null is {}', deserialize(null), {});

const store = new Map();
check('loading a key that was never saved', loadFromStore(store, 'settings'), {});

saveToStore(store, 'settings', { theme: 'dark', volume: 80 });
const loaded = loadFromStore(store, 'settings');
check('loads what was saved', loaded, { theme: 'dark', volume: 80 });

saveToStore(store, 'settings', { theme: 'light', volume: 50 });
const reloaded = loadFromStore(store, 'settings');
check('saving again overwrites the previous value', reloaded.theme, 'light');

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-bkd-009',
  title: 'Serialized Store',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'backend',
  category: 'Persistence',
  tags: ['json', 'serialization', 'persistence'],
  prompt: 'Build a serialize/deserialize pair around JSON, then a tiny key-value store on top of them — the round-tripping discipline any real persistence layer needs.',
  hints: [
    '`serialize` is a one-line `JSON.stringify(data)` call.',
    '`if (!text) return {};` catches empty string, null, and undefined all in one falsy check, before attempting `JSON.parse`.',
    '`saveToStore` always goes through `serialize` first — never store the raw object directly, since the whole point is round-tripping through a string form.',
    '`loadFromStore` needs its own missing-key check (`store.has(key)`) in addition to `deserialize`\'s empty-text check — a key that was never saved is a different case from a key saved with empty content.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('store.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('store.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Serialized Store', kind: 'node-js', entry: 'store.js', testCode: TEST_CODE }],
};

export default task;
