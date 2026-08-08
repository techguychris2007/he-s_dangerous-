import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Library Catalog (Capstone)

A bigger foundations project pulling several earlier ideas together in one app: real file
persistence (\`json\`/\`open\`), search over a collection, and state that has to change correctly
(checking a book out, then back in) — everything reloaded from disk fresh on every call, so nothing
is ever "remembered" except what's actually been saved.
`;

const STARTER = `import json
import os

CATALOG_FILE = 'catalog.json'


def _load():
    if not os.path.exists(CATALOG_FILE):
        return []
    with open(CATALOG_FILE) as f:
        return json.load(f)


def _save(books):
    with open(CATALOG_FILE, 'w') as f:
        json.dump(books, f)


def add_book(title, author):
    """Load the catalog, create a book {"id": ..., "title": title, "author": author,
    "available": True}, using (max existing id, default 0) + 1 as the new id. Append it, save, and
    return the created book."""
    # TODO
    pass


def search_by_title(query):
    """Return every book (loaded from disk) whose title contains query, case-insensitively."""
    # TODO
    pass


def checkout_book(book_id):
    """Load the catalog. If a book with this id exists AND is currently available, mark it
    unavailable, save, and return True. Otherwise (missing, or already checked out) return False
    without saving anything."""
    # TODO
    pass


def return_book(book_id):
    """Load the catalog. If a book with this id exists, mark it available (regardless of its
    current state), save, and return True. Return False if no book has that id."""
    # TODO
    pass
`;

const SOLUTION = `import json
import os

CATALOG_FILE = 'catalog.json'


def _load():
    if not os.path.exists(CATALOG_FILE):
        return []
    with open(CATALOG_FILE) as f:
        return json.load(f)


def _save(books):
    with open(CATALOG_FILE, 'w') as f:
        json.dump(books, f)


def add_book(title, author):
    books = _load()
    next_id = max([b["id"] for b in books], default=0) + 1
    book = {"id": next_id, "title": title, "author": author, "available": True}
    books.append(book)
    _save(books)
    return book


def search_by_title(query):
    books = _load()
    q = query.lower()
    return [b for b in books if q in b["title"].lower()]


def checkout_book(book_id):
    books = _load()
    for book in books:
        if book["id"] == book_id:
            if not book["available"]:
                return False
            book["available"] = False
            _save(books)
            return True
    return False


def return_book(book_id):
    books = _load()
    for book in books:
        if book["id"] == book_id:
            book["available"] = True
            _save(books)
            return True
    return False
`;

const TEST_CODE = `from catalog import add_book, search_by_title, checkout_book, return_book

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

b1 = add_book("The Great Gatsby", "F. Scott Fitzgerald")
__check__("add_book assigns id 1", b1["id"], 1)
__check__("add_book starts available", b1["available"], True)

b2 = add_book("Great Expectations", "Charles Dickens")
__check__("add_book increments id", b2["id"], 2)

results = search_by_title("great")
__check__("search is case-insensitive and finds both matches", len(results), 2)

results2 = search_by_title("gatsby")
__check__("search finds a specific title", results2[0]["author"], "F. Scott Fitzgerald")

__check__("search with no matches is empty", search_by_title("nonexistent"), [])

__check__("checkout of an available book succeeds", checkout_book(1), True)
__check__("checkout of an already-checked-out book fails", checkout_book(1), False)
__check__("checkout of a missing book fails", checkout_book(999), False)

after_checkout = search_by_title("gatsby")
__check__("checked-out book is marked unavailable", after_checkout[0]["available"], False)

__check__("returning a checked-out book succeeds", return_book(1), True)
after_return = search_by_title("gatsby")
__check__("returned book is available again", after_return[0]["available"], True)

__check__("returning a missing book fails", return_book(999), False)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-021',
  title: 'Library Catalog',
  difficulty: 'Hard',
  language: 'python',
  track: 'foundations',
  category: 'Capstones',
  tags: ['capstone', 'files', 'json', 'search'],
  prompt:
    'Build a file-backed library catalog: add books, search by title, and check books in/out — every ' +
    'function loads fresh from disk and saves back, so the file is always the single source of truth.',
  hints: [
    'Every public function follows the same shape: `books = _load()`, do something with the list, `_save(books)` if anything changed, return the result.',
    '`max([b["id"] for b in books], default=0) + 1` computes the next id from whatever is already on disk — this stays correct even if books were added in an earlier "session."',
    '`checkout_book` needs to check `available` before flipping it — checking out an already-unavailable book should fail, not silently re-checkout.',
    '`return_book` is simpler than checkout: it doesn\'t care about the current state, just sets `available = True` unconditionally for a book that exists.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('catalog.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('catalog.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Library Catalog', kind: 'python', entry: 'catalog.py', testCode: TEST_CODE }],
};

export default task;
