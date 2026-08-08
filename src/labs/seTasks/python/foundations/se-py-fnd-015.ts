import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Higher-Order Functions

Functions that take other functions as arguments — the core move behind \`map\`/\`filter\`/\`sorted\`\`key=\`
and most of Python's functional toolkit.
`;

const STARTER = `def apply_discount(prices, discount_fn):
    """Return a new list with discount_fn(price) applied to every price in \`prices\`."""
    # TODO
    pass


def filter_valid(records, predicate):
    """Return a new list containing only the records for which predicate(record) is truthy."""
    # TODO
    pass


def apply_all(value, functions):
    """Apply each function in \`functions\` to \`value\` in order, each one feeding into the next.
    apply_all(2, [f, g]) means g(f(2)). Return the final result."""
    # TODO
    pass
`;

const SOLUTION = `def apply_discount(prices, discount_fn):
    return [discount_fn(p) for p in prices]


def filter_valid(records, predicate):
    return [r for r in records if predicate(r)]


def apply_all(value, functions):
    result = value
    for fn in functions:
        result = fn(result)
    return result
`;

const TEST_CODE = `from hof import apply_discount, filter_valid, apply_all

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("halve every price", apply_discount([10, 20, 30], lambda p: p / 2), [5.0, 10.0, 15.0])
__check__("apply_discount preserves order", apply_discount([1, 2], lambda p: p + 100), [101, 102])

records = [{"name": "a", "age": 30}, {"name": "b", "age": -1}, {"name": "c", "age": 25}]
valid = filter_valid(records, lambda r: r["age"] >= 0)
__check__("filter_valid keeps only valid ages", [r["name"] for r in valid], ["a", "c"])
__check__("filter_valid with all-false predicate", filter_valid(records, lambda r: r["age"] > 1000), [])

double = lambda x: x * 2
add_ten = lambda x: x + 10
__check__("apply_all chains left to right", apply_all(3, [double, add_ten]), 16)
__check__("apply_all with single function", apply_all(5, [double]), 10)
__check__("apply_all with no functions returns input unchanged", apply_all(7, []), 7)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-015',
  title: 'Higher-Order Functions',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Functional Patterns',
  tags: ['functions', 'lambdas', 'list-comprehensions'],
  prompt: 'Write three functions that take a function as an argument and apply it — the building blocks map()/filter() are made of.',
  hints: [
    'A list comprehension `[discount_fn(p) for p in prices]` is the whole body of `apply_discount`.',
    'Same shape for `filter_valid`, but with an `if`: `[r for r in records if predicate(r)]`.',
    'In `apply_all`, start `result = value`, then `for fn in functions: result = fn(result)` — each function\'s output feeds the next one\'s input.',
    'An empty `functions` list should leave `apply_all` returning `value` unchanged — the loop simply never runs, which the accumulator pattern already handles for free.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('hof.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('hof.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Higher-Order Functions', kind: 'python', entry: 'hof.py', testCode: TEST_CODE }],
};

export default task;
