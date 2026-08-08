import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Contact Book

A tiny in-memory contact book — the smallest real "project" shape: a data-handling file (\`storage.py\`,
already written for you) and a logic file (\`contacts.py\`, yours to finish) that depends on it.

Implement the three functions in \`contacts.py\`. \`storage.py\` is complete already — you don't need to
touch it, just know it's there.
`;

const STORAGE = `import json


def serialize(book):
    """Turn a contact book (name -> phone dict) into a JSON string, keys sorted for stable output."""
    return json.dumps(book, sort_keys=True)


def deserialize(text):
    """Parse a JSON string back into a contact book."""
    return json.loads(text)
`;

const CONTACTS_STARTER = `def add_contact(book, name, phone):
    """Add or overwrite a contact in \`book\` (a plain name -> phone dict). Return the updated book."""
    # TODO
    pass


def find_contact(book, name):
    """Return the phone number for \`name\`, or None if \`name\` isn't in the book."""
    # TODO
    pass


def remove_contact(book, name):
    """Remove \`name\` from the book if present. Return the updated book either way."""
    # TODO
    pass


if __name__ == '__main__':
    book = {}
    book = add_contact(book, 'Ama', '555-0100')
    print('Book so far:', book)
`;

const CONTACTS_SOLUTION = `def add_contact(book, name, phone):
    book[name] = phone
    return book


def find_contact(book, name):
    return book.get(name)


def remove_contact(book, name):
    book.pop(name, None)
    return book


if __name__ == '__main__':
    book = {}
    book = add_contact(book, 'Ama', '555-0100')
    print('Book so far:', book)
`;

const TEST_CODE = `from contacts import add_contact, find_contact, remove_contact
from storage import serialize

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

book = {}
book = add_contact(book, "Ama", "555-0100")
book = add_contact(book, "Kofi", "555-0101")
__check__("add returns dict with 2 entries", len(book), 2)
__check__("find existing", find_contact(book, "Ama"), "555-0100")
__check__("find missing returns None", find_contact(book, "Nobody"), None)
book = remove_contact(book, "Ama")
__check__("remove drops the entry", "Ama" in book, False)
__check__("remove leaves others", len(book), 1)
serialized = serialize(book)
__check__("serialize produces a string", isinstance(serialized, str), True)
__check__("serialize includes remaining name", "Kofi" in serialized, True)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-001',
  title: 'Contact Book',
  difficulty: 'Easy',
  language: 'python',
  track: 'foundations',
  category: 'Data & Collections',
  tags: ['dicts', 'functions', 'modules'],
  prompt:
    'Build a tiny contact book: add, find, and remove contacts stored in a plain dict, then confirm ' +
    'it round-trips through JSON via the already-written `storage.py`. This is the smallest real ' +
    "multi-file shape — one file you write, one file you don't have to.",
  hints: [
    '`add_contact` just needs `book[name] = phone`, then return `book`.',
    '`find_contact` is a one-liner with `dict.get`, which returns None automatically for a missing key.',
    '`remove_contact` should use `book.pop(name, None)` so it never raises if the name isn\'t there.',
    "storage.py is already correct — you're only editing contacts.py.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('storage.py', STORAGE, { editable: false }),
    pf('contacts.py', CONTACTS_STARTER),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('storage.py', STORAGE, { editable: false }),
    pf('contacts.py', CONTACTS_SOLUTION),
  ],
  targets: [{ id: 'main', label: 'Contact Book', kind: 'python', entry: 'contacts.py', testCode: TEST_CODE }],
};

export default task;
