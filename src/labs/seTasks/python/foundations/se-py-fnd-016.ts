import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Function Decorators

Write two decorators from scratch — functions that wrap other functions to add behavior (call
counting, memoized caching) without changing the wrapped function's own code.
`;

const STARTER = `def count_calls(fn):
    """Decorator: wrap fn so every call increments a counter stored as wrapper.calls (starts at 0),
    then calls through to fn and returns its result."""
    # TODO: define and return a wrapper function; remember to set wrapper.calls = 0 on the wrapper
    # itself before returning it.
    pass


def memoize(fn):
    """Decorator: wrap fn so repeated calls with the same arguments return a cached result instead
    of recomputing. Assume fn only ever takes a single positional argument."""
    # TODO: use a dict, keyed by the argument, to cache results.
    pass
`;

const SOLUTION = `def count_calls(fn):
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return fn(*args, **kwargs)
    wrapper.calls = 0
    return wrapper


def memoize(fn):
    cache = {}
    def wrapper(arg):
        if arg not in cache:
            cache[arg] = fn(arg)
        return cache[arg]
    return wrapper
`;

const TEST_CODE = `from decorators import count_calls, memoize

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

@count_calls
def add_one(x):
    return x + 1

__check__("wrapped function still works", add_one(5), 6)
__check__("calls starts having recorded 1 call", add_one.calls, 1)
add_one(10)
add_one(20)
__check__("calls accumulates across calls", add_one.calls, 3)

calls_made = []

@memoize
def slow_square(x):
    calls_made.append(x)
    return x * x

__check__("memoized function computes correctly", slow_square(4), 16)
__check__("memoized function computes correctly again", slow_square(5), 25)
__check__("repeat call returns cached (correct) value", slow_square(4), 16)
__check__("repeat call did not recompute", calls_made, [4, 5])

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-016',
  title: 'Function Decorators',
  difficulty: 'Hard',
  language: 'python',
  track: 'foundations',
  category: 'Functional Patterns',
  tags: ['decorators', 'closures'],
  prompt: 'Implement two decorators from scratch — a call counter and a memoizing cache — to see exactly what @decorator syntax is doing underneath.',
  hints: [
    'A decorator is a function that takes a function and returns a new function — define an inner `def wrapper(*args, **kwargs):` and `return wrapper` from `count_calls`.',
    'Attach the counter to the wrapper itself: `wrapper.calls = 0` right after defining it (but before returning), then `wrapper.calls += 1` as the first line inside `wrapper`.',
    '`memoize`\'s cache dict lives in the enclosing scope (a closure), not inside `wrapper` — that\'s what lets it persist between calls.',
    'Check `if arg not in cache:` before computing — only call the real (slow) function on a cache miss, and always return `cache[arg]` either way.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('decorators.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('decorators.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Function Decorators', kind: 'python', entry: 'decorators.py', testCode: TEST_CODE }],
};

export default task;
