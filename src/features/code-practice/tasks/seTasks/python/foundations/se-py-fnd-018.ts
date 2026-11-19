import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Custom Assertions

Build a tiny assertion toolkit — the same kind of thing every test framework (including this
platform's own test runner) is built on top of. \`assert_equal\` and \`assert_true\` raise
\`AssertionError\` with a useful message on failure; \`assert_raises\` checks that a callable raises
the exception type you expect.
`;

const STARTER = `def assert_equal(actual, expected, message=""):
    """Raise AssertionError(f"expected {expected!r}, got {actual!r}" + (": " + message if message
    else "")) if actual != expected. Do nothing if they're equal."""
    # TODO
    pass


def assert_true(value, message=""):
    """Raise AssertionError(f"expected truthy value" + (": " + message if message else "")) if
    \`value\` is falsy. Do nothing if it's truthy."""
    # TODO
    pass


def assert_raises(exception_type, fn, *args):
    """Call fn(*args). Raise AssertionError("expected <exception_type name> to be raised") if it does
    NOT raise an instance of \`exception_type\`. If it does raise the right type, swallow it (return
    None) instead of letting it propagate."""
    # TODO
    pass
`;

const SOLUTION = `def assert_equal(actual, expected, message=""):
    if actual != expected:
        suffix = f": {message}" if message else ""
        raise AssertionError(f"expected {expected!r}, got {actual!r}{suffix}")


def assert_true(value, message=""):
    if not value:
        suffix = f": {message}" if message else ""
        raise AssertionError(f"expected truthy value{suffix}")


def assert_raises(exception_type, fn, *args):
    try:
        fn(*args)
    except exception_type:
        return None
    raise AssertionError(f"expected {exception_type.__name__} to be raised")
`;

const TEST_CODE = `from asserts import assert_equal, assert_true, assert_raises

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

try:
    assert_equal(2 + 2, 4)
    ok = True
except AssertionError:
    ok = False
__check__("assert_equal passes silently when equal", ok, True)

raised = False
try:
    assert_equal(2 + 2, 5)
except AssertionError as e:
    raised = True
    __check__("assert_equal error mentions both values", "5" in str(e) and "4" in str(e), True)
__check__("assert_equal raises when unequal", raised, True)

try:
    assert_true(1 == 1)
    ok = True
except AssertionError:
    ok = False
__check__("assert_true passes silently for truthy", ok, True)

raised = False
try:
    assert_true(False, "should have been true")
except AssertionError as e:
    raised = True
    __check__("assert_true includes custom message", "should have been true" in str(e), True)
__check__("assert_true raises for falsy", raised, True)

def bad_divide():
    return 1 / 0

__check__("assert_raises swallows the expected exception", assert_raises(ZeroDivisionError, bad_divide), None)

def no_op():
    return 42

raised = False
try:
    assert_raises(ValueError, no_op)
except AssertionError as e:
    raised = True
    __check__("assert_raises error message names the expected type", "ValueError" in str(e), True)
__check__("assert_raises fails when fn raises nothing", raised, True)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-018',
  title: 'Custom Assertions',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Testing & Debugging',
  tags: ['testing', 'exceptions'],
  prompt: 'Build a minimal assertion toolkit from scratch: assert_equal, assert_true, and assert_raises — the same primitives real test frameworks are built on.',
  hints: [
    '`assert_equal` and `assert_true` share a shape: check the condition, and if it fails, build a message string and `raise AssertionError(message)`.',
    'Build the optional suffix once: `suffix = f": {message}" if message else ""`, then include it at the end of the f-string.',
    'In `assert_raises`, put the call in a `try`/`except exception_type:` — if that except fires, the call raised the RIGHT thing, so just `return None`.',
    'If `fn(*args)` runs to completion without raising, execution falls through past the try/except entirely — that\'s exactly where the final `raise AssertionError(...)` belongs, unindented, after the try block.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('asserts.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('asserts.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Custom Assertions', kind: 'python', entry: 'asserts.py', testCode: TEST_CODE }],
};

export default task;
