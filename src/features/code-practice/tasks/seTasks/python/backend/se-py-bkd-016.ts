import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Retry Logic

Real background jobs fail sometimes — a flaky network call, a momentary lock conflict. Wrap a
function so it retries on failure up to a limit, only giving up (and re-raising) once every attempt
has been exhausted.
`;

const STARTER = `def run_with_retries(fn, max_attempts):
    """Call fn() (no arguments). If it raises, try again, up to max_attempts total attempts.
    Return the first successful result. If EVERY attempt raises, let the LAST exception propagate
    (don't swallow it)."""
    # TODO
    pass
`;

const SOLUTION = `def run_with_retries(fn, max_attempts):
    last_error = None
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception as e:
            last_error = e
    raise last_error
`;

const TEST_CODE = `from retry import run_with_retries

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

def always_works():
    return "ok"

__check__("succeeding function returns its result", run_with_retries(always_works, 3), "ok")

attempts = []
def fails_twice_then_works():
    attempts.append(1)
    if len(attempts) < 3:
        raise ValueError("not yet")
    return "eventually ok"

__check__("retries until it succeeds", run_with_retries(fails_twice_then_works, 5), "eventually ok")
__check__("took exactly 3 attempts", len(attempts), 3)

def always_fails():
    raise ValueError("nope")

raised = False
try:
    run_with_retries(always_fails, 3)
except ValueError as e:
    raised = True
    __check__("re-raises the actual error message", str(e), "nope")
__check__("exhausting all retries re-raises", raised, True)

call_count = []
def counting_failure():
    call_count.append(1)
    raise ValueError("boom")

try:
    run_with_retries(counting_failure, 4)
except ValueError:
    pass
__check__("makes exactly max_attempts attempts before giving up", len(call_count), 4)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-016',
  title: 'Retry Logic',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Background Jobs',
  tags: ['retries', 'error-handling'],
  prompt: 'Wrap a function call so it retries on failure up to a limit, returning the first successful result, or re-raising the last error once every attempt has failed.',
  hints: [
    '`for attempt in range(max_attempts):` gives you exactly `max_attempts` tries.',
    '`try: return fn() except Exception as e: last_error = e` inside the loop — a successful call returns immediately (exiting the loop early); a failure just records the error and lets the loop continue.',
    'Track the most recent exception in a variable outside the loop (`last_error = None` before it starts) so it survives past the loop.',
    'After the loop finishes (meaning every attempt failed), `raise last_error` — this is reached only if `fn()` never once returned successfully.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('retry.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('retry.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Retry Logic', kind: 'python', entry: 'retry.py', testCode: TEST_CODE }],
};

export default task;
