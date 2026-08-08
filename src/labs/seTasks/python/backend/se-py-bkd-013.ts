import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Get-Or-Compute Cache

The pattern behind almost every real cache layer: check if a value is already there, return it if
so, otherwise compute it, STORE it, and then return it — so the expensive computation only ever
runs once per key.
`;

const STARTER = `CACHE = {}


def cache_get_or_compute(key, compute_fn):
    """If key is already in CACHE, return its cached value WITHOUT calling compute_fn. Otherwise
    call compute_fn(), store the result in CACHE[key], and return it."""
    # TODO
    pass


def cache_invalidate(key):
    """Remove key from CACHE if present. Return True if it was removed, False if it wasn't there."""
    # TODO
    pass
`;

const SOLUTION = `CACHE = {}


def cache_get_or_compute(key, compute_fn):
    if key in CACHE:
        return CACHE[key]
    value = compute_fn()
    CACHE[key] = value
    return value


def cache_invalidate(key):
    return CACHE.pop(key, None) is not None
`;

const TEST_CODE = `from cache import cache_get_or_compute, cache_invalidate

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

calls = []

def expensive():
    calls.append(1)
    return 42

result1 = cache_get_or_compute("answer", expensive)
__check__("first call computes the value", result1, 42)
__check__("first call actually invoked compute_fn", len(calls), 1)

result2 = cache_get_or_compute("answer", expensive)
__check__("second call returns the cached value", result2, 42)
__check__("second call did NOT invoke compute_fn again", len(calls), 1)

def other():
    calls.append(1)
    return "different"

result3 = cache_get_or_compute("other-key", other)
__check__("a different key computes independently", result3, "different")
__check__("different key invoked its own compute_fn", len(calls), 2)

__check__("invalidating an existing key returns True", cache_invalidate("answer"), True)
__check__("invalidating a missing key returns False", cache_invalidate("answer"), False)

result4 = cache_get_or_compute("answer", expensive)
__check__("after invalidation, the value is recomputed", len(calls), 3)
__check__("recomputed value is still correct", result4, 42)

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-bkd-013',
  title: 'Get-Or-Compute Cache',
  difficulty: 'Medium',
  language: 'python',
  track: 'backend',
  category: 'Caching & Rate Limiting',
  tags: ['caching'],
  prompt: 'Implement the check-then-compute-then-store pattern behind almost every cache, plus an invalidation function to force a key to recompute.',
  hints: [
    '`if key in CACHE: return CACHE[key]` — the cache hit path must return WITHOUT ever calling `compute_fn`.',
    'On a miss, call `compute_fn()` (note the parentheses — it\'s a zero-argument callable), store the result, then return it.',
    'Two different keys should never interfere — each one independently follows the check-then-compute path the first time it\'s seen.',
    '`cache_invalidate` reuses the same `CACHE.pop(key, None) is not None` pattern as session logout — it can never raise, even on a key that was never cached.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('cache.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('cache.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Get-Or-Compute Cache', kind: 'python', entry: 'cache.py', testCode: TEST_CODE }],
};

export default task;
