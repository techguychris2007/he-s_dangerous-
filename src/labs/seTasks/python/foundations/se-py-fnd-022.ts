import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Personal Finance Tracker (Capstone)

A file-backed ledger of income/expense transactions — the running balance, category filtering, and
per-category totals are all computed fresh from the saved transaction list every time, never from a
separately-tracked running number that could drift out of sync with what's actually on disk.
`;

const STARTER = `import json
import os

LEDGER_FILE = 'ledger.json'


def _load():
    if not os.path.exists(LEDGER_FILE):
        return []
    with open(LEDGER_FILE) as f:
        return json.load(f)


def _save(transactions):
    with open(LEDGER_FILE, 'w') as f:
        json.dump(transactions, f)


def add_transaction(description, amount, category):
    """amount is positive for income, negative for an expense. Load the ledger, create
    {"id": ..., "description": description, "amount": amount, "category": category} using
    (max existing id, default 0) + 1, append it, save, and return the created transaction."""
    # TODO
    pass


def get_balance():
    """Return the sum of every transaction's amount currently on disk."""
    # TODO
    pass


def get_by_category(category):
    """Return every transaction (loaded from disk) whose category exactly matches."""
    # TODO
    pass


def get_total_by_category(category):
    """Return the sum of amounts for every transaction in the given category."""
    # TODO
    pass
`;

const SOLUTION = `import json
import os

LEDGER_FILE = 'ledger.json'


def _load():
    if not os.path.exists(LEDGER_FILE):
        return []
    with open(LEDGER_FILE) as f:
        return json.load(f)


def _save(transactions):
    with open(LEDGER_FILE, 'w') as f:
        json.dump(transactions, f)


def add_transaction(description, amount, category):
    transactions = _load()
    next_id = max([t["id"] for t in transactions], default=0) + 1
    transaction = {"id": next_id, "description": description, "amount": amount, "category": category}
    transactions.append(transaction)
    _save(transactions)
    return transaction


def get_balance():
    transactions = _load()
    return sum(t["amount"] for t in transactions)


def get_by_category(category):
    transactions = _load()
    return [t for t in transactions if t["category"] == category]


def get_total_by_category(category):
    return sum(t["amount"] for t in get_by_category(category))
`;

const TEST_CODE = `from ledger import add_transaction, get_balance, get_by_category, get_total_by_category

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("balance starts at 0", get_balance(), 0)

t1 = add_transaction("Paycheck", 2000, "income")
__check__("add_transaction assigns id 1", t1["id"], 1)

add_transaction("Groceries", -150, "food")
add_transaction("Rent", -1000, "housing")
t4 = add_transaction("Dinner out", -50, "food")
__check__("add_transaction increments id across calls", t4["id"], 4)

__check__("balance reflects income and expenses", get_balance(), 800)

food = get_by_category("food")
__check__("get_by_category filters correctly", len(food), 2)

__check__("get_total_by_category sums matching transactions", get_total_by_category("food"), -200)
__check__("get_total_by_category for income", get_total_by_category("income"), 2000)
__check__("get_total_by_category for a category with no transactions is 0", get_total_by_category("entertainment"), 0)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-022',
  title: 'Personal Finance Tracker',
  difficulty: 'Hard',
  language: 'python',
  track: 'foundations',
  category: 'Capstones',
  tags: ['capstone', 'files', 'json'],
  prompt: 'Build a file-backed transaction ledger where balance, category filters, and category totals are all computed fresh from the saved list, never from a separately-tracked running total.',
  hints: [
    'Same shape as the Library Catalog capstone: every function starts with `_load()`, and any function that changes data ends with `_save(transactions)`.',
    '`max([t["id"] for t in transactions], default=0) + 1` computes the next id from whatever is already on disk.',
    '`sum(t["amount"] for t in transactions)` is the whole of `get_balance` — income (positive amounts) and expenses (negative amounts) net out correctly with plain addition.',
    '`get_total_by_category` can reuse `get_by_category` directly: `sum(t["amount"] for t in get_by_category(category))` — no need to re-filter by hand.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('ledger.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('ledger.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Personal Finance Tracker', kind: 'python', entry: 'ledger.py', testCode: TEST_CODE }],
};

export default task;
