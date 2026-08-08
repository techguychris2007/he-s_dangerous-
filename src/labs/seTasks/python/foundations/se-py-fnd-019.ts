import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Sorting Small Data

Implement two textbook algorithms by hand instead of calling \`sorted()\`/\`list.index()\` — the point
is the mechanics (comparing and swapping, halving a search range), not the one-liner.
`;

const STARTER = `def bubble_sort(arr):
    """Return a NEW list containing arr's elements in ascending order, using the bubble sort
    algorithm (repeatedly swap adjacent out-of-order pairs). Do not mutate \`arr\`; do not call
    sorted() or .sort()."""
    # TODO
    pass


def binary_search(sorted_arr, target):
    """Return the index of \`target\` in \`sorted_arr\` (which is already sorted ascending), or -1 if
    it isn't present. Do not call .index() or use "in"."""
    # TODO
    pass
`;

const SOLUTION = `def bubble_sort(arr):
    result = list(arr)
    n = len(result)
    for i in range(n):
        for j in range(0, n - i - 1):
            if result[j] > result[j + 1]:
                result[j], result[j + 1] = result[j + 1], result[j]
    return result


def binary_search(sorted_arr, target):
    low, high = 0, len(sorted_arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if sorted_arr[mid] == target:
            return mid
        elif sorted_arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
`;

const TEST_CODE = `from algorithms import bubble_sort, binary_search

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

original = [5, 2, 8, 1, 9, 3]
sorted_copy = bubble_sort(original)
__check__("bubble_sort produces ascending order", sorted_copy, [1, 2, 3, 5, 8, 9])
__check__("bubble_sort does not mutate the input", original, [5, 2, 8, 1, 9, 3])
__check__("bubble_sort on already-sorted input", bubble_sort([1, 2, 3]), [1, 2, 3])
__check__("bubble_sort on empty list", bubble_sort([]), [])
__check__("bubble_sort on single element", bubble_sort([7]), [7])

data = [1, 3, 5, 7, 9, 11]
__check__("binary_search finds first element", binary_search(data, 1), 0)
__check__("binary_search finds last element", binary_search(data, 11), 5)
__check__("binary_search finds middle element", binary_search(data, 7), 3)
__check__("binary_search returns -1 when absent", binary_search(data, 4), -1)
__check__("binary_search on empty list", binary_search([], 1), -1)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-019',
  title: 'Sorting Small Data',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Algorithms in Practice',
  tags: ['sorting', 'searching', 'algorithms'],
  prompt: 'Implement bubble sort and binary search by hand — the classic pair for understanding comparison-based algorithms.',
  hints: [
    'Copy first: `result = list(arr)` so the original is never touched, then sort `result` in place.',
    'Bubble sort is two nested loops: the outer one runs `n` passes, the inner one compares `result[j]` and `result[j + 1]`, swapping them with `result[j], result[j+1] = result[j+1], result[j]` when out of order.',
    'Binary search keeps a `low`/`high` window and a `while low <= high:` loop — compute `mid = (low + high) // 2` each iteration.',
    'If `sorted_arr[mid] < target`, the answer must be to the right, so `low = mid + 1`; otherwise `high = mid - 1`. Falling out of the loop (never returning) means it\'s absent — return -1 there.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('algorithms.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('algorithms.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Sorting Small Data', kind: 'python', entry: 'algorithms.py', testCode: TEST_CODE }],
};

export default task;
