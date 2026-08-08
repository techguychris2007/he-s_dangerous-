import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Fix The Bugs

Not a blank-slate task — \`calculator.py\` already "works" (it runs without crashing) but gets several
answers wrong. Read the docstrings, figure out which behavior is actually intended, and fix each bug.
This is what real debugging looks like far more often than a stack trace does.
`;

const STARTER = `def average(numbers):
    """Return the arithmetic mean of \`numbers\`."""
    return sum(numbers) // len(numbers)  # BUG: integer division truncates the result


def is_even(n):
    """Return True if n is even."""
    return n % 2 == 1  # BUG: this checks for ODD, not even


def clamp(value, low, high):
    """Return value, restricted to the range [low, high]."""
    if value < low:
        return high  # BUG: should clamp DOWN to low, not jump to high
    if value > high:
        return low  # BUG: should clamp UP to high, not jump to low
    return value


def last_n(items, n):
    """Return the last n items of the list, in their original order."""
    return items[:n]  # BUG: this takes the FIRST n items, not the last n
`;

const SOLUTION = `def average(numbers):
    return sum(numbers) / len(numbers)


def is_even(n):
    return n % 2 == 0


def clamp(value, low, high):
    if value < low:
        return low
    if value > high:
        return high
    return value


def last_n(items, n):
    if n == 0:
        return []
    return items[-n:]
`;

const TEST_CODE = `from calculator import average, is_even, clamp, last_n

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("average with a fractional result", average([1, 2]), 1.5)
__check__("average of three numbers", average([10, 20, 30]), 20.0)

__check__("is_even on an even number", is_even(4), True)
__check__("is_even on an odd number", is_even(7), False)
__check__("is_even on zero", is_even(0), True)

__check__("clamp below range goes to low", clamp(-5, 0, 10), 0)
__check__("clamp above range goes to high", clamp(15, 0, 10), 10)
__check__("clamp inside range is unchanged", clamp(5, 0, 10), 5)

__check__("last_n of a 5-item list", last_n([1, 2, 3, 4, 5], 2), [4, 5])
__check__("last_n with n=0 is empty", last_n([1, 2, 3], 0), [])

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-017',
  title: 'Fix The Bugs',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Testing & Debugging',
  tags: ['debugging', 'reading-code'],
  prompt: 'Four small functions in calculator.py each have exactly one bug, marked with a `# BUG:` comment describing what\'s wrong. Fix all four so their docstrings become true.',
  hints: [
    '`//` is floor (integer) division in Python — `average` should use plain `/` to keep the fractional part.',
    '`is_even` has its comparison backwards: `n % 2 == 0` means even, `== 1` means odd.',
    "`clamp`'s two branches are swapped — going below `low` should clamp TO `low`, not jump to `high`.",
    '`items[:n]` is the first n items; `items[-n:]` is the last n — but watch out, `items[-0:]` is the WHOLE list, so `n == 0` needs its own explicit case returning `[]`.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('calculator.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('calculator.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Fix The Bugs', kind: 'python', entry: 'calculator.py', testCode: TEST_CODE }],
};

export default task;
