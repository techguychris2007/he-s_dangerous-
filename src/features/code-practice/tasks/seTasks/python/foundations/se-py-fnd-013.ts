import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Custom Range Iterator

Implement Python's iterator protocol by hand: a class with \`__iter__\` and \`__next__\` that a
\`for\` loop (or \`list()\`) can drive, ending with \`StopIteration\` just like a built-in.
`;

const STARTER = `class Countdown:
    """Counts down from \`start\` to 1 (inclusive), one number per iteration."""

    def __init__(self, start):
        # TODO: store start; you'll also need to track the current count somewhere
        pass

    def __iter__(self):
        """An iterator returns itself from __iter__."""
        # TODO
        pass

    def __next__(self):
        """Return the next number in the countdown. Raise StopIteration once you've gone past 1."""
        # TODO
        pass
`;

const SOLUTION = `class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current < 1:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value
`;

const TEST_CODE = `from countdown import Countdown

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("collects as list", list(Countdown(5)), [5, 4, 3, 2, 1])
__check__("collects from 1", list(Countdown(1)), [1])
__check__("collects from 0 is empty", list(Countdown(0)), [])

total = 0
for n in Countdown(3):
    total += n
__check__("for-loop sums to 6", total, 6)

it = Countdown(2)
__check__("__iter__ returns self", iter(it) is it, True)
__check__("first next()", next(it), 2)
__check__("second next()", next(it), 1)

stopped = False
try:
    next(it)
except StopIteration:
    stopped = True
__check__("raises StopIteration when exhausted", stopped, True)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-013',
  title: 'Custom Range Iterator',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Iterators/Generators/Async',
  tags: ['iterators', 'dunder-methods'],
  prompt: 'Implement the iterator protocol by hand — __iter__ and __next__ — so a plain class works with for-loops and list().',
  hints: [
    '`__init__` only needs one piece of state: the current count, initialized to `start`.',
    '`__iter__` on an iterator (as opposed to an iterable) just returns `self` — the object IS its own iterator here.',
    'In `__next__`: check `if self.current < 1: raise StopIteration` FIRST, before computing a value to return.',
    "Save the value to return, decrement `self.current`, then return the saved value — decrementing before saving would skip the starting number.",
  ],
  files: [pf('README.md', README, { editable: false }), pf('countdown.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('countdown.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Custom Range Iterator', kind: 'python', entry: 'countdown.py', testCode: TEST_CODE }],
};

export default task;
