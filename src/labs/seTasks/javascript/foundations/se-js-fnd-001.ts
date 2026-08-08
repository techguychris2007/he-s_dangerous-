import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Contact Book

The JavaScript twin of the Python foundations task — same shape, CommonJS instead of dicts-and-modules:
a data-handling file (\`storage.js\`, already written) and a logic file (\`contacts.js\`, yours to finish).
`;

const STORAGE = `function serialize(book) {
  return JSON.stringify(book, Object.keys(book).sort());
}

function deserialize(text) {
  return JSON.parse(text);
}

module.exports = { serialize, deserialize };
`;

const CONTACTS_STARTER = `function addContact(book, name, phone) {
  // TODO: set book[name] = phone and return book
}

function findContact(book, name) {
  // TODO: return book[name] (undefined if not present)
}

function removeContact(book, name) {
  // TODO: delete book[name] if present; return book either way
}

module.exports = { addContact, findContact, removeContact };
`;

const CONTACTS_SOLUTION = `function addContact(book, name, phone) {
  book[name] = phone;
  return book;
}

function findContact(book, name) {
  return book[name];
}

function removeContact(book, name) {
  delete book[name];
  return book;
}

module.exports = { addContact, findContact, removeContact };
`;

const TEST_CODE = `const { addContact, findContact, removeContact } = require('./contacts');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

let book = {};
book = addContact(book, 'Ama', '555-0100');
book = addContact(book, 'Kofi', '555-0101');
check('book has 2 entries', Object.keys(book).length, 2);
check('find existing', findContact(book, 'Ama'), '555-0100');
check('find missing', findContact(book, 'Nobody'), undefined);
book = removeContact(book, 'Ama');
check('remove drops entry', 'Ama' in book, false);
check('remove leaves others', Object.keys(book).length, 1);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-001',
  title: 'Contact Book',
  difficulty: 'Easy',
  language: 'javascript',
  track: 'foundations',
  category: 'Data & Collections',
  tags: ['objects', 'commonjs'],
  prompt:
    'Build a tiny contact book: add, find, and remove contacts stored in a plain object. `storage.js` ' +
    '(already written) shows real CommonJS module boundaries — `require`/`module.exports` between two ' +
    'files instead of one script.',
  hints: [
    '`addContact` just needs `book[name] = phone`, then return `book`.',
    'Plain property access (`book[name]`) already returns `undefined` for a missing key — no special-casing needed.',
    '`delete book[name]` removes a key without throwing even if it was never there.',
    "storage.js is already correct — you're only editing contacts.js.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('storage.js', STORAGE, { editable: false }),
    pf('contacts.js', CONTACTS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('storage.js', STORAGE, { editable: false }),
    pf('contacts.js', CONTACTS_SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Contact Book', kind: 'node-js', entry: 'contacts.js', testCode: TEST_CODE }],
};

export default task;
