import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Pagination

Slice a big list into pages, and return enough metadata (current page, total pages, total items)
for a client to build "Next"/"Previous" controls — the shape almost every real list endpoint
returns instead of dumping everything at once.
`;

const STARTER = `def paginate(items, page, page_size):
    """Return {"items": [...], "page": page, "page_size": page_size, "total_items": N,
    "total_pages": N}. \`page\` is 1-indexed (page 1 is the first page). \`items\` for an out-of-range
    page (too high, or <= 0) should be an empty list, but total_items/total_pages should still be
    correct. total_pages should be 0 if items is empty, otherwise at least 1 (round UP — 7 items at
    page_size 3 is 3 pages, not 2)."""
    # TODO
    pass
`;

const SOLUTION = `import math


def paginate(items, page, page_size):
    total_items = len(items)
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 0

    if page < 1:
        page_items = []
    else:
        start = (page - 1) * page_size
        page_items = items[start:start + page_size]

    return {
        "items": page_items,
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
    }
`;

const TEST_CODE = `from pagination import paginate

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

items = list(range(1, 8))  # [1, 2, 3, 4, 5, 6, 7]

page1 = paginate(items, 1, 3)
__check__("page 1 has the first 3 items", page1["items"], [1, 2, 3])
__check__("total_items is correct", page1["total_items"], 7)
__check__("total_pages rounds up", page1["total_pages"], 3)

page3 = paginate(items, 3, 3)
__check__("last page has the remainder", page3["items"], [7])

page99 = paginate(items, 99, 3)
__check__("out-of-range page has no items", page99["items"], [])
__check__("out-of-range page still reports correct totals", page99["total_pages"], 3)

page0 = paginate(items, 0, 3)
__check__("page 0 has no items", page0["items"], [])

empty = paginate([], 1, 10)
__check__("empty list has no items", empty["items"], [])
__check__("empty list has 0 total_pages", empty["total_pages"], 0)

exact = paginate(list(range(6)), 2, 3)
__check__("exact multiple divides evenly", exact["total_pages"], 2)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-017',
  title: 'Pagination',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'API Design',
  tags: ['pagination', 'api-design'],
  prompt: 'Slice a list into 1-indexed pages and return the metadata (total items, total pages) a client needs to build pagination controls.',
  hints: [
    '`math.ceil(total_items / page_size)` rounds UP — 7 items at page_size 3 needs 3 pages, not `7 // 3 = 2`.',
    'The empty-list case needs its own branch: `total_pages` should be 0, not `math.ceil(0 / page_size)` which is also 0 but worth being explicit about.',
    '`start = (page - 1) * page_size` converts a 1-indexed page number into a 0-indexed slice start — page 1 starts at index 0, page 2 at index `page_size`, and so on.',
    'Python slicing already handles an out-of-range start gracefully (`items[100:103]` on a 7-item list just returns `[]`) — but `page < 1` still needs an explicit check, since a negative or zero page would slice from the wrong end.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('pagination.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('pagination.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Pagination', kind: 'python', entry: 'pagination.py', testCode: TEST_CODE }],
};

export default task;
