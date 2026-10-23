import type { CodeTask } from '../../codeTypes';
import { grader } from './harness';

const base = { language: 'python', category: 'Software Engineering' } as const;

/** Module 2 practice: contracts, abstract data types, error design, refactoring tools. */
export const SE_M2_TASKS: CodeTask[] = [
  {
    ...base,
    id: 'se-swe-09',
    title: 'Contracts: Merge Two Sorted Lists to Spec',
    difficulty: 'Easy',
    prompt:
      'Implement merge_sorted(a, b) to this specification. Requires: a and b are each sorted in non-decreasing ' +
      'order — if either is not, raise ValueError (this is a trust boundary). Effects: returns a NEW list ' +
      'containing every element of a and b (duplicates kept) in non-decreasing order, in O(len(a) + len(b)) ' +
      'time. Must not modify a or b, and must not call sorted() or list.sort() — merge them in one pass.',
    starterCode:
      'def merge_sorted(a: list[int], b: list[int]) -> list[int]:\n' +
      '    # TODO: check both preconditions, then merge with two indices\n' +
      '    pass\n',
    hints: [
      'A list is sorted if all(x <= y for x, y in zip(xs, xs[1:])).',
      'Walk with i and j; append the smaller of a[i] and b[j] and advance that index.',
      'When one list is exhausted, extend the result with the rest of the other.',
    ],
    solution:
      'def _is_sorted(xs):\n' +
      '    return all(x <= y for x, y in zip(xs, xs[1:]))\n\n' +
      'def merge_sorted(a: list[int], b: list[int]) -> list[int]:\n' +
      '    if not _is_sorted(a) or not _is_sorted(b):\n' +
      '        raise ValueError("inputs must be sorted")\n' +
      '    out, i, j = [], 0, 0\n' +
      '    while i < len(a) and j < len(b):\n' +
      '        if a[i] <= b[j]:\n' +
      '            out.append(a[i]); i += 1\n' +
      '        else:\n' +
      '            out.append(b[j]); j += 1\n' +
      '    out.extend(a[i:])\n' +
      '    out.extend(b[j:])\n' +
      '    return out\n',
    testCode: grader(`
import builtins
__check__("basic", merge_sorted([1, 4, 9], [2, 3, 10]), [1, 2, 3, 4, 9, 10])
__check__("keeps duplicates", merge_sorted([1, 2, 2], [2, 3]), [1, 2, 2, 2, 3])
__check__("empty side", merge_sorted([], [5, 6]), [5, 6])
__check__("both empty", merge_sorted([], []), [])
a, b = [1, 3], [2]
merge_sorted(a, b)
__check__("inputs not modified", (a, b), ([1, 3], [2]))
__raises__("rejects unsorted a", lambda: merge_sorted([3, 1], [2]), ValueError)
__raises__("rejects unsorted b", lambda: merge_sorted([1], [5, 4]), ValueError)
__real_sorted__ = builtins.sorted
def __no_sort__(*args, **kwargs):
    raise AssertionError("sorted() is not allowed")
builtins.sorted = __no_sort__
try:
    r = merge_sorted([0, 5], [1, 2, 8])
finally:
    builtins.sorted = __real_sorted__
__check__("merges without sorted()", r, [0, 1, 2, 5, 8])
`),
  },
  {
    ...base,
    id: 'se-swe-10',
    title: 'Contracts: A Design-by-Contract Decorator',
    difficulty: 'Hard',
    prompt:
      'Write a decorator factory contract(pre=None, post=None). pre is a function taking the same arguments as ' +
      'the decorated function and returning True if the precondition holds; post takes the RESULT followed by ' +
      'the same arguments. If pre returns False raise ContractError("precondition failed: <function name>"); ' +
      'if post returns False raise ContractError("postcondition failed: <function name>"). The wrapped function ' +
      'must keep its __name__ and docstring (use functools.wraps). ContractError is defined in the starter.',
    starterCode:
      'import functools\n\n' +
      'class ContractError(Exception):\n' +
      '    pass\n\n' +
      'def contract(pre=None, post=None):\n' +
      '    # TODO: return a decorator that checks pre before and post after the call\n' +
      '    pass\n',
    hints: [
      'Three levels: contract(...) returns decorate(fn), which returns wrapper(*args, **kwargs).',
      'In wrapper: if pre and not pre(*args, **kwargs): raise ContractError(f"precondition failed: {fn.__name__}").',
      'Call result = fn(*args, **kwargs), then check post(result, *args, **kwargs) the same way, then return result.',
    ],
    solution:
      'import functools\n\n' +
      'class ContractError(Exception):\n' +
      '    pass\n\n' +
      'def contract(pre=None, post=None):\n' +
      '    def decorate(fn):\n' +
      '        @functools.wraps(fn)\n' +
      '        def wrapper(*args, **kwargs):\n' +
      '            if pre is not None and not pre(*args, **kwargs):\n' +
      '                raise ContractError(f"precondition failed: {fn.__name__}")\n' +
      '            result = fn(*args, **kwargs)\n' +
      '            if post is not None and not post(result, *args, **kwargs):\n' +
      '                raise ContractError(f"postcondition failed: {fn.__name__}")\n' +
      '            return result\n' +
      '        return wrapper\n' +
      '    return decorate\n',
    testCode: grader(`
@contract(pre=lambda x: x >= 0, post=lambda r, x: abs(r * r - x) < 1e-9)
def root(x):
    "Square root."
    return x ** 0.5
@contract(post=lambda r, xs: r == sorted(xs))
def bad_sort(xs):
    return list(xs)
__check__("valid call passes through", root(9), 3.0)
__check__("keeps name", root.__name__, "root")
__check__("keeps docstring", root.__doc__, "Square root.")
try:
    root(-1)
    __check__("pre violation raises", "no error", "ContractError")
except ContractError as e:
    __check__("pre violation message", str(e), "precondition failed: root")
try:
    bad_sort([3, 1])
    __check__("post violation raises", "no error", "ContractError")
except ContractError as e:
    __check__("post violation message", str(e), "postcondition failed: bad_sort")
__check__("post ok when sorted input", bad_sort([1, 2]), [1, 2])
@contract()
def ident(v, *, scale=1):
    return v * scale
__check__("no conditions + kwargs", ident(4, scale=2), 8)
`),
  },
  {
    ...base,
    id: 'se-swe-11',
    title: 'ADTs: An Immutable Interval Type',
    difficulty: 'Medium',
    prompt:
      'Design an immutable ADT Interval(lo, hi) for half-open ranges [lo, hi) such as booking times. Rep ' +
      'invariant: lo <= hi (raise ValueError otherwise). Operations: length() → hi - lo; contains(x) → lo <= x ' +
      '< hi; overlaps(other) → True if they share any point (empty intervals overlap nothing); merge(other) → ' +
      'the smallest Interval covering both, raising ValueError if they neither overlap nor touch (touch means ' +
      'one ends exactly where the other starts). Interval must be immutable (assigning an attribute raises ' +
      'an exception), hashable, and equal when lo and hi are equal. Tip: @dataclass(frozen=True).',
    starterCode:
      'from dataclasses import dataclass\n\n' +
      'class Interval:\n' +
      '    # TODO: make this an immutable dataclass with lo and hi, check the rep invariant,\n' +
      '    #       and add length, contains, overlaps and merge\n' +
      '    pass\n',
    hints: [
      '@dataclass(frozen=True) gives you __init__, __eq__, __hash__ and immutability for free.',
      'Check the invariant in __post_init__ and raise ValueError when lo > hi.',
      'Two half-open intervals overlap when max(lo1, lo2) < min(hi1, hi2). They touch when hi1 == lo2 or hi2 == lo1.',
    ],
    solution:
      'from dataclasses import dataclass\n\n' +
      '@dataclass(frozen=True)\n' +
      'class Interval:\n' +
      '    lo: float\n' +
      '    hi: float\n\n' +
      '    def __post_init__(self):\n' +
      '        if self.lo > self.hi:\n' +
      '            raise ValueError("lo must be <= hi")\n\n' +
      '    def length(self):\n' +
      '        return self.hi - self.lo\n\n' +
      '    def contains(self, x):\n' +
      '        return self.lo <= x < self.hi\n\n' +
      '    def overlaps(self, other):\n' +
      '        return max(self.lo, other.lo) < min(self.hi, other.hi)\n\n' +
      '    def merge(self, other):\n' +
      '        touching = self.hi == other.lo or other.hi == self.lo\n' +
      '        if not (self.overlaps(other) or touching):\n' +
      '            raise ValueError("intervals are disjoint")\n' +
      '        return Interval(min(self.lo, other.lo), max(self.hi, other.hi))\n',
    testCode: grader(`
a, b, c = Interval(9, 12), Interval(11, 14), Interval(12, 13)
__check__("length", a.length(), 3)
__check__("contains lo", a.contains(9), True)
__check__("excludes hi", a.contains(12), False)
__check__("overlap", a.overlaps(b), True)
__check__("touching is not overlap", a.overlaps(c), False)
__check__("empty overlaps nothing", Interval(10, 10).overlaps(a), False)
__check__("merge overlapping", a.merge(b), Interval(9, 14))
__check__("merge touching", a.merge(c), Interval(9, 13))
__raises__("merge disjoint", lambda: Interval(1, 2).merge(Interval(5, 6)), ValueError)
__raises__("invariant", lambda: Interval(5, 1), ValueError)
def __mutate__():
    a.lo = 0
__raises__("immutable", __mutate__, Exception)
__check__("hashable and equal", len({Interval(1, 2), Interval(1, 2)}), 1)
`),
  },
  {
    ...base,
    id: 'se-swe-12',
    title: 'ADTs: A Multiset With No Rep Exposure',
    difficulty: 'Medium',
    prompt:
      'Implement a mutable ADT Bag (a multiset). Rep: a private dict mapping item → count. Rep invariant: every ' +
      'stored count is >= 1 (no zero or negative counts are ever stored). Operations: Bag(items=()) copies the ' +
      'iterable in; add(item, n=1) with n >= 1 (else ValueError); remove(item) removes ONE occurrence and raises ' +
      'KeyError if absent; count(item) → int (0 if absent); __len__ → total number of occurrences; distinct() → ' +
      'frozenset of items present; counts() → a dict snapshot that callers may modify without affecting the bag.',
    starterCode:
      'class Bag:\n' +
      '    # Rep: _counts: dict[item, int]\n' +
      '    # RI:  every value in _counts is >= 1\n' +
      '    # AF:  represents the multiset where item occurs _counts[item] times\n' +
      '    def __init__(self, items=()):\n' +
      '        pass  # TODO\n',
    hints: [
      'In __init__, build self._counts = {} and call self.add(item) for each item so the invariant is enforced in one place.',
      'In remove, decrement; when a count reaches 0, del self._counts[item] to keep the rep invariant.',
      'counts() must return dict(self._counts) — a copy — not the dict itself.',
    ],
    solution:
      'class Bag:\n' +
      '    def __init__(self, items=()):\n' +
      '        self._counts = {}\n' +
      '        for item in items:\n' +
      '            self.add(item)\n\n' +
      '    def _check_rep(self):\n' +
      '        assert all(c >= 1 for c in self._counts.values())\n\n' +
      '    def add(self, item, n=1):\n' +
      '        if n < 1:\n' +
      '            raise ValueError("n must be >= 1")\n' +
      '        self._counts[item] = self._counts.get(item, 0) + n\n' +
      '        self._check_rep()\n\n' +
      '    def remove(self, item):\n' +
      '        if item not in self._counts:\n' +
      '            raise KeyError(item)\n' +
      '        self._counts[item] -= 1\n' +
      '        if self._counts[item] == 0:\n' +
      '            del self._counts[item]\n' +
      '        self._check_rep()\n\n' +
      '    def count(self, item):\n' +
      '        return self._counts.get(item, 0)\n\n' +
      '    def __len__(self):\n' +
      '        return sum(self._counts.values())\n\n' +
      '    def distinct(self):\n' +
      '        return frozenset(self._counts)\n\n' +
      '    def counts(self):\n' +
      '        return dict(self._counts)\n',
    testCode: grader(`
src = ["a", "b", "a"]
bag = Bag(src)
src.append("z")
__check__("copies input", bag.count("z"), 0)
__check__("count", bag.count("a"), 2)
__check__("len counts occurrences", len(bag), 3)
bag.add("c", 3)
__check__("add n", bag.count("c"), 3)
bag.remove("b")
__check__("removed to zero disappears", bag.distinct(), frozenset({"a", "c"}))
__raises__("remove absent", lambda: bag.remove("b"), KeyError)
__raises__("add zero", lambda: bag.add("x", 0), ValueError)
snap = bag.counts()
snap["a"] = 100
snap["evil"] = 1
__check__("counts() is a copy", (bag.count("a"), bag.count("evil")), (2, 0))
__check__("invariant: no zero counts stored", all(v >= 1 for v in bag.counts().values()), True)
`),
  },
  {
    ...base,
    id: 'se-swe-13',
    title: 'Error Design: A Config Parser With Useful Errors',
    difficulty: 'Medium',
    prompt:
      'Write parse_config(text) for lines of the form key = value. Ignore blank lines and lines starting with #. ' +
      'Keys are stripped; values are stripped; values made only of digits become int. Errors must be useful: ' +
      'raise ConfigError (defined in the starter) with a message starting "line N:" (1-based) when a line has ' +
      'no "=", has an empty key, or repeats a key. For a key ending in "_port", the value must be an int ' +
      'between 1 and 65535 — otherwise raise ConfigError("line N: invalid port") chained from the original ' +
      'ValueError when int() conversion failed (use raise … from …).',
    starterCode:
      'class ConfigError(Exception):\n' +
      '    pass\n\n' +
      'def parse_config(text: str) -> dict:\n' +
      '    # TODO: parse line by line, raising ConfigError("line N: ...") on problems\n' +
      '    pass\n',
    hints: [
      'Use for number, raw in enumerate(text.splitlines(), start=1).',
      'key, sep, value = line.partition("="); if not sep → missing "=".',
      'For ports: try: port = int(value) except ValueError as exc: raise ConfigError(f"line {number}: invalid port") from exc.',
    ],
    solution:
      'class ConfigError(Exception):\n' +
      '    pass\n\n' +
      'def parse_config(text: str) -> dict:\n' +
      '    result = {}\n' +
      '    for number, raw in enumerate(text.splitlines(), start=1):\n' +
      '        line = raw.strip()\n' +
      '        if not line or line.startswith("#"):\n' +
      '            continue\n' +
      '        key, sep, value = line.partition("=")\n' +
      '        key, value = key.strip(), value.strip()\n' +
      '        if not sep:\n' +
      '            raise ConfigError(f"line {number}: expected key = value")\n' +
      '        if not key:\n' +
      '            raise ConfigError(f"line {number}: empty key")\n' +
      '        if key in result:\n' +
      '            raise ConfigError(f"line {number}: duplicate key {key!r}")\n' +
      '        if key.endswith("_port"):\n' +
      '            try:\n' +
      '                port = int(value)\n' +
      '            except ValueError as exc:\n' +
      '                raise ConfigError(f"line {number}: invalid port") from exc\n' +
      '            if not 1 <= port <= 65535:\n' +
      '                raise ConfigError(f"line {number}: invalid port")\n' +
      '            result[key] = port\n' +
      '        else:\n' +
      '            result[key] = int(value) if value.isdigit() else value\n' +
      '    return result\n',
    testCode: grader(`
cfg = parse_config("# service\\nname = ledger\\n\\nhttp_port = 8080\\nworkers=4\\n")
__check__("parses values", cfg, {"name": "ledger", "http_port": 8080, "workers": 4})
def __msg__(text):
    try:
        parse_config(text)
        return None
    except ConfigError as e:
        return e
e = __msg__("a = 1\\nbroken line\\n")
__check__("missing = reports line 2", str(e).startswith("line 2:") if e else None, True)
e = __msg__("a = 1\\n = 3\\n")
__check__("empty key", str(e).startswith("line 2:") if e else None, True)
e = __msg__("a = 1\\n# x\\na = 2\\n")
__check__("duplicate key on line 3", str(e).startswith("line 3:") if e else None, True)
e = __msg__("db_port = 99999\\n")
__check__("port out of range", str(e) if e else None, "line 1: invalid port")
e = __msg__("\\nadmin_port = eighty\\n")
__check__("bad port message", str(e) if e else None, "line 2: invalid port")
__check__("chained from ValueError", type(e.__cause__).__name__ if e else None, "ValueError")
__check__("empty config", parse_config(""), {})
`),
  },
  {
    ...base,
    id: 'se-swe-14',
    title: 'Error Design: Fail Closed on Authorization',
    difficulty: 'Easy',
    prompt:
      'An access check depends on a policy service that can be slow or broken. Write can_access(user, action, ' +
      'fetch_policy) where fetch_policy(user) returns a dict mapping actions to booleans — or raises any ' +
      'exception, or returns garbage. Return True ONLY if the policy is a dict whose value for action is exactly ' +
      'True. In every other case — exception, missing action, non-bool value such as "yes" or 1, non-dict ' +
      'policy — return False and append a short reason string to the module-level list AUDIT. Never let an ' +
      'exception escape. (OWASP A10:2025 — fail closed.)',
    starterCode:
      'AUDIT = []\n\n' +
      'def can_access(user: str, action: str, fetch_policy) -> bool:\n' +
      '    # TODO: deny by default; allow only on an explicit True\n' +
      '    pass\n',
    hints: [
      'Wrap the fetch in try/except Exception and return False after recording the reason.',
      'Use isinstance(policy, dict) before reading it.',
      'policy.get(action) is True is stricter than == True: 1 == True in Python, but 1 is True is False.',
    ],
    solution:
      'AUDIT = []\n\n' +
      'def can_access(user: str, action: str, fetch_policy) -> bool:\n' +
      '    try:\n' +
      '        policy = fetch_policy(user)\n' +
      '    except Exception as exc:\n' +
      '        AUDIT.append(f"deny {user} {action}: policy error {type(exc).__name__}")\n' +
      '        return False\n' +
      '    if not isinstance(policy, dict):\n' +
      '        AUDIT.append(f"deny {user} {action}: malformed policy")\n' +
      '        return False\n' +
      '    if policy.get(action) is True:\n' +
      '        return True\n' +
      '    AUDIT.append(f"deny {user} {action}: not granted")\n' +
      '    return False\n',
    testCode: grader(`
def ok(user): return {"read": True, "write": False, "export": "yes", "delete": 1}
def boom(user): raise TimeoutError("policy service slow")
def garbage(user): return ["read"]
__check__("explicit allow", can_access("ada", "read", ok), True)
__check__("explicit deny", can_access("ada", "write", ok), False)
__check__("missing action", can_access("ada", "admin", ok), False)
__check__("truthy string is not True", can_access("ada", "export", ok), False)
__check__("1 is not True", can_access("ada", "delete", ok), False)
__check__("exception fails closed", can_access("ada", "read", boom), False)
__check__("garbage fails closed", can_access("ada", "read", garbage), False)
before = len(AUDIT)
can_access("bob", "read", boom)
__check__("denials are audited", len(AUDIT), before + 1)
`),
  },
  {
    ...base,
    id: 'se-swe-15',
    title: 'Refactoring: Replace Conditional With Polymorphism',
    difficulty: 'Medium',
    prompt:
      'The legacy function in the starter prices a cart with an if/elif chain on customer type. Refactor it: ' +
      'create classes Regular, Member and Staff, each with discount(subtotal) returning the discount amount, ' +
      'and a function checkout(prices, customer) that returns the total (subtotal − discount, rounded to 2 ' +
      'places) using customer.discount. Behaviour must match legacy_total exactly — the tests are ' +
      'characterization tests comparing your code to it. Keep legacy_total in the file.',
    starterCode:
      'def legacy_total(prices, kind):\n' +
      '    subtotal = sum(prices)\n' +
      '    if kind == "regular":\n' +
      '        discount = 0\n' +
      '    elif kind == "member":\n' +
      '        discount = subtotal * 0.05 if subtotal < 100 else subtotal * 0.10\n' +
      '    elif kind == "staff":\n' +
      '        discount = min(subtotal * 0.30, 50)\n' +
      '    else:\n' +
      '        raise ValueError(kind)\n' +
      '    return round(subtotal - discount, 2)\n\n' +
      '# TODO: classes Regular, Member, Staff with discount(subtotal), and checkout(prices, customer)\n',
    hints: [
      'Each class only needs one method: def discount(self, subtotal): ...',
      'Copy each branch of the if/elif into the matching class.',
      'checkout: subtotal = sum(prices); return round(subtotal - customer.discount(subtotal), 2).',
    ],
    solution:
      'def legacy_total(prices, kind):\n' +
      '    subtotal = sum(prices)\n' +
      '    if kind == "regular":\n' +
      '        discount = 0\n' +
      '    elif kind == "member":\n' +
      '        discount = subtotal * 0.05 if subtotal < 100 else subtotal * 0.10\n' +
      '    elif kind == "staff":\n' +
      '        discount = min(subtotal * 0.30, 50)\n' +
      '    else:\n' +
      '        raise ValueError(kind)\n' +
      '    return round(subtotal - discount, 2)\n\n' +
      'class Regular:\n' +
      '    def discount(self, subtotal):\n' +
      '        return 0\n\n' +
      'class Member:\n' +
      '    def discount(self, subtotal):\n' +
      '        return subtotal * (0.05 if subtotal < 100 else 0.10)\n\n' +
      'class Staff:\n' +
      '    def discount(self, subtotal):\n' +
      '        return min(subtotal * 0.30, 50)\n\n' +
      'def checkout(prices, customer):\n' +
      '    subtotal = sum(prices)\n' +
      '    return round(subtotal - customer.discount(subtotal), 2)\n',
    testCode: grader(`
carts = [[], [10.0], [40.5, 59.49], [60, 40], [99.99], [120, 80.25], [300]]
for kind, cls in (("regular", Regular), ("member", Member), ("staff", Staff)):
    for cart in carts:
        __check__(f"{kind} {cart}", checkout(cart, cls()), legacy_total(cart, kind))
class Student:
    def discount(self, subtotal):
        return subtotal * 0.15
__check__("new type needs no edits to checkout", checkout([100], Student()), 85.0)
`),
  },
  {
    ...base,
    id: 'se-swe-16',
    title: 'Refactoring Tools: Build a Code-Smell Linter',
    difficulty: 'Hard',
    prompt:
      'Linters read code as a syntax tree, not as text. Using the ast module, write find_smells(source, ' +
      'max_lines=20, max_params=4) that returns a sorted list of (function_name, smell) tuples for every function ' +
      '(including methods and async functions) where: the body spans more than max_lines lines (end_lineno − ' +
      'lineno + 1, counting the def line) → "long_function"; it takes more than max_params parameters, ' +
      'excluding self and cls but including *args, **kwargs and keyword-only parameters → "too_many_params"; ' +
      'it contains a bare "except:" → "bare_except".',
    starterCode:
      'import ast\n\n' +
      'def find_smells(source: str, max_lines: int = 20, max_params: int = 4) -> list[tuple[str, str]]:\n' +
      '    # TODO: parse, walk every FunctionDef/AsyncFunctionDef, apply the three rules\n' +
      '    pass\n',
    hints: [
      'tree = ast.parse(source); for node in ast.walk(tree): if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)).',
      'Parameters: a = node.args; names = [x.arg for x in a.posonlyargs + a.args + a.kwonlyargs], plus a.vararg and a.kwarg when present.',
      'A bare except is an ast.ExceptHandler whose .type is None — walk the function node to find one.',
    ],
    solution:
      'import ast\n\n' +
      'def find_smells(source: str, max_lines: int = 20, max_params: int = 4) -> list[tuple[str, str]]:\n' +
      '    smells = set()\n' +
      '    for node in ast.walk(ast.parse(source)):\n' +
      '        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):\n' +
      '            continue\n' +
      '        if node.end_lineno - node.lineno + 1 > max_lines:\n' +
      '            smells.add((node.name, "long_function"))\n' +
      '        a = node.args\n' +
      '        names = [x.arg for x in a.posonlyargs + a.args + a.kwonlyargs]\n' +
      '        names += [x.arg for x in (a.vararg, a.kwarg) if x is not None]\n' +
      '        if len([n for n in names if n not in ("self", "cls")]) > max_params:\n' +
      '            smells.add((node.name, "too_many_params"))\n' +
      '        if any(isinstance(h, ast.ExceptHandler) and h.type is None for h in ast.walk(node)):\n' +
      '            smells.add((node.name, "bare_except"))\n' +
      '    return sorted(smells)\n',
    testCode: grader(`
src = '''
def tidy(a, b):
    return a + b

def wide(a, b, c, d, e):
    return a

class Repo:
    def save(self, a, b, c, d):
        try:
            pass
        except:
            pass

    async def fetch(self, *args, key=None, **kwargs):
        return args

def star(a, b, *rest, flag=False, **extra):
    return a

def long_one(x):
''' + "    x += 1\\n" * 25 + "    return x\\n"
found = find_smells(src)
__check__("clean function not reported", any(n == "tidy" for n, _ in found), False)
__check__("five params", ("wide", "too_many_params") in found, True)
__check__("self excluded (4 params ok)", ("save", "too_many_params") in found, False)
__check__("bare except in method", ("save", "bare_except") in found, True)
__check__("async with 3 params ok", any(n == "fetch" for n, _ in found), False)
__check__("varargs counted", ("star", "too_many_params") in found, True)
__check__("long function", ("long_one", "long_function") in found, True)
__check__("sorted output", found, sorted(found))
__check__("custom threshold", ("long_one", "long_function") in find_smells(src, max_lines=40), False)
`),
  },
];
