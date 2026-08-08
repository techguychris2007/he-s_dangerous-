import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Safe Divider

Two small functions that turn exceptions into ordinary return values instead of letting them
propagate — \`try\`/\`except\` as a control-flow tool, not just a crash handler.
`;

const STARTER = `def safe_divide(a, b):
    """Return a / b, or None if b is 0 (instead of raising ZeroDivisionError)."""
    # TODO
    pass


def parse_int_or_default(text, default):
    """Try to parse \`text\` as an int. Return \`default\` if it isn't a valid integer string."""
    # TODO
    pass
`;

const SOLUTION = `def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None


def parse_int_or_default(text, default):
    try:
        return int(text)
    except (ValueError, TypeError):
        return default
`;

const TEST_CODE = `from safe_math import safe_divide, parse_int_or_default

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("normal division", safe_divide(10, 2), 5.0)
__check__("division by zero", safe_divide(10, 0), None)
__check__("negative division", safe_divide(-9, 3), -3.0)
__check__("valid int string", parse_int_or_default("42", 0), 42)
__check__("invalid int string", parse_int_or_default("abc", 0), 0)
__check__("empty string", parse_int_or_default("", -1), -1)
__check__("negative int string", parse_int_or_default("-7", 0), -7)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-007',
  title: 'Safe Divider',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Errors & Robustness',
  tags: ['exceptions', 'try-except'],
  prompt: 'Wrap two operations that can naturally fail (division, int parsing) so they return a fallback value instead of raising.',
  hints: [
    '`try: return a / b` then `except ZeroDivisionError: return None` — catch the specific exception, not a bare `except:`.',
    '`int("abc")` raises `ValueError`; `int(None)` raises `TypeError` — catch both in one `except (ValueError, TypeError):` clause.',
    'The return-inside-try pattern works fine in Python: if no exception is raised, that return value is used; if one is, control jumps straight to `except`.',
    '`int("42")` is valid, `int("")` and `int("abc")` are not — your `parse_int_or_default` should fall back to `default` for the latter two.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('safe_math.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('safe_math.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Safe Divider', kind: 'python', entry: 'safe_math.py', testCode: TEST_CODE }],
};

export default task;
