import type { CodeTask } from '../../codeTypes';
import { grader } from './harness';

const base = { language: 'python', category: 'Software Engineering' } as const;

/** Runs the learner's test function against a reference and several mutants (Python source). */
const mutationChecks = (fn: string, reference: string, mutants: [string, string][]) => `
${reference}
def __verdict__(impl):
    try:
        return bool(${fn}(impl))
    except Exception:
        return False
__check__("your tests pass the correct implementation", __verdict__(__reference__), True)
${mutants.map(([name, src]) => `${src}\n__check__(${JSON.stringify(`kills mutant: ${name}`)}, __verdict__(__mutant__), False)`).join('\n')}
`;

/** Module 3 practice: test design, test doubles, property-based and integration testing, TDD, review. */
export const SE_M3_TASKS: CodeTask[] = [
  {
    ...base,
    id: 'se-swe-17',
    title: 'Test Design: Kill the Leap-Year Mutants',
    difficulty: 'Medium',
    prompt:
      'This time YOU write the tests. Implement check_leap(leap_year) that calls the leap_year function it is ' +
      'given and returns True only if it behaves correctly: years divisible by 4 are leap years, except century ' +
      'years, which are leap years only if divisible by 400; years below 1 must raise ValueError. The grader runs ' +
      'your function against a correct implementation (must return True) and against four buggy mutants (must ' +
      'return False for each). Choose partitions and boundaries that catch every bug.',
    starterCode:
      'def check_leap(leap_year) -> bool:\n' +
      '    # TODO: test each partition (not /4, /4 not /100, /100 not /400, /400) and the invalid range\n' +
      '    return True\n',
    hints: [
      'Use one year per partition: 2023 (no), 2024 (yes), 1900 (no), 2000 (yes).',
      'Check expected values with all(leap_year(y) == expected for y, expected in cases.items()).',
      'For the invalid range, call leap_year(0) inside try/except ValueError and fail if no exception is raised.',
    ],
    solution:
      'def check_leap(leap_year) -> bool:\n' +
      '    cases = {2023: False, 2024: True, 1900: False, 2000: True, 1: False, 4: True}\n' +
      '    if not all(leap_year(y) is expected for y, expected in cases.items()):\n' +
      '        return False\n' +
      '    for bad in (0, -4):\n' +
      '        try:\n' +
      '            leap_year(bad)\n' +
      '            return False\n' +
      '        except ValueError:\n' +
      '            pass\n' +
      '    return True\n',
    testCode: grader(mutationChecks('check_leap',
      'def __reference__(y):\n    if y < 1: raise ValueError(y)\n    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)',
      [
        ['ignores the century rule', 'def __mutant__(y):\n    if y < 1: raise ValueError(y)\n    return y % 4 == 0'],
        ['drops the 400 rule', 'def __mutant__(y):\n    if y < 1: raise ValueError(y)\n    return y % 4 == 0 and y % 100 != 0'],
        ['forgets divisibility by 4', 'def __mutant__(y):\n    if y < 1: raise ValueError(y)\n    return y % 100 != 0 or y % 400 == 0'],
        ['accepts year 0', 'def __mutant__(y):\n    if y < 0: raise ValueError(y)\n    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)'],
      ])),
  },
  {
    ...base,
    id: 'se-swe-18',
    title: 'Test Design: Kill the Triangle Mutants',
    difficulty: 'Medium',
    prompt:
      'Write check_triangle(classify) for a function classify(a, b, c) that returns "equilateral", "isosceles", ' +
      '"scalene" or "invalid". Spec: any side <= 0 is invalid; the triangle must satisfy the STRICT triangle ' +
      'inequality for every side (1, 2, 3 is invalid — it is flat); otherwise all equal → equilateral, exactly ' +
      'two equal → isosceles, none equal → scalene. Return True only for a correct classify. Four mutants hide ' +
      'boundary and permutation bugs — think about which side is the long one, and about argument order.',
    starterCode:
      'def check_triangle(classify) -> bool:\n' +
      '    # TODO: cover every outcome, the flat boundary, and permutations of the same triangle\n' +
      '    return True\n',
    hints: [
      'Test one triangle per outcome, e.g. (3, 3, 3), (2, 2, 3), (3, 4, 5), (0, 1, 1).',
      'Boundary: (1, 2, 3) is invalid but (2, 3, 4) is scalene.',
      'Permutations: (3, 2, 2) and (2, 3, 2) are isosceles too; (1, 1, 10) and (10, 1, 1) are invalid.',
    ],
    solution:
      'from itertools import permutations\n\n' +
      'def check_triangle(classify) -> bool:\n' +
      '    cases = {(3, 3, 3): "equilateral", (2, 2, 3): "isosceles", (3, 4, 5): "scalene",\n' +
      '             (0, 1, 1): "invalid", (-1, 2, 2): "invalid", (1, 2, 3): "invalid", (1, 1, 10): "invalid"}\n' +
      '    for sides, expected in cases.items():\n' +
      '        for perm in set(permutations(sides)):\n' +
      '            if classify(*perm) != expected:\n' +
      '                return False\n' +
      '    return True\n',
    testCode: grader(mutationChecks('check_triangle',
      'def __reference__(a, b, c):\n    if min(a, b, c) <= 0: return "invalid"\n    x, y, z = sorted((a, b, c))\n    if x + y <= z: return "invalid"\n    if a == b == c: return "equilateral"\n    if a == b or b == c or a == c: return "isosceles"\n    return "scalene"',
      [
        ['accepts flat triangles', 'def __mutant__(a, b, c):\n    if min(a, b, c) <= 0: return "invalid"\n    x, y, z = sorted((a, b, c))\n    if x + y < z: return "invalid"\n    if a == b == c: return "equilateral"\n    if a == b or b == c or a == c: return "isosceles"\n    return "scalene"'],
        ['isosceles only when a == b', 'def __mutant__(a, b, c):\n    if min(a, b, c) <= 0: return "invalid"\n    x, y, z = sorted((a, b, c))\n    if x + y <= z: return "invalid"\n    if a == b == c: return "equilateral"\n    if a == b: return "isosceles"\n    return "scalene"'],
        ['equilateral when a == b', 'def __mutant__(a, b, c):\n    if min(a, b, c) <= 0: return "invalid"\n    x, y, z = sorted((a, b, c))\n    if x + y <= z: return "invalid"\n    if a == b: return "equilateral"\n    if b == c or a == c: return "isosceles"\n    return "scalene"'],
        ['checks the inequality for one side only', 'def __mutant__(a, b, c):\n    if min(a, b, c) <= 0: return "invalid"\n    if a + b <= c: return "invalid"\n    if a == b == c: return "equilateral"\n    if a == b or b == c or a == c: return "isosceles"\n    return "scalene"'],
      ])),
  },
  {
    ...base,
    id: 'se-swe-19',
    title: 'Testable Design: A Session Store With an Injected Clock',
    difficulty: 'Medium',
    prompt:
      'Implement SessionStore(ttl_seconds, clock) where clock is a zero-argument function returning the current ' +
      'time in seconds (production passes time.time; tests pass a fake). create(user) returns a new unique token ' +
      'string; get(token) returns the user while now < created + ttl, and None once expired, revoked or unknown; ' +
      'revoke(token) ends a session (unknown tokens are ignored); active_count() returns how many sessions are ' +
      'still valid right now. Never call time.time() directly — the tests control time.',
    starterCode:
      'import secrets\n\n' +
      'class SessionStore:\n' +
      '    def __init__(self, ttl_seconds: float, clock):\n' +
      '        pass  # TODO: keep the clock; never read real time directly\n',
    hints: [
      'Store sessions in a dict: token -> (user, created_at) where created_at = self._clock().',
      'secrets.token_hex(16) gives an unpredictable unique token.',
      'Expiry check: self._clock() < created_at + self._ttl. Remove expired entries when you notice them.',
    ],
    solution:
      'import secrets\n\n' +
      'class SessionStore:\n' +
      '    def __init__(self, ttl_seconds: float, clock):\n' +
      '        self._ttl = ttl_seconds\n' +
      '        self._clock = clock\n' +
      '        self._sessions = {}\n\n' +
      '    def create(self, user):\n' +
      '        token = secrets.token_hex(16)\n' +
      '        self._sessions[token] = (user, self._clock())\n' +
      '        return token\n\n' +
      '    def _valid(self, token):\n' +
      '        entry = self._sessions.get(token)\n' +
      '        if entry is None:\n' +
      '            return None\n' +
      '        user, created = entry\n' +
      '        if self._clock() < created + self._ttl:\n' +
      '            return user\n' +
      '        del self._sessions[token]\n' +
      '        return None\n\n' +
      '    def get(self, token):\n' +
      '        return self._valid(token)\n\n' +
      '    def revoke(self, token):\n' +
      '        self._sessions.pop(token, None)\n\n' +
      '    def active_count(self):\n' +
      '        return sum(1 for t in list(self._sessions) if self._valid(t) is not None)\n',
    testCode: grader(`
now = [1000.0]
store = SessionStore(60, clock=lambda: now[0])
t1 = store.create("ada")
t2 = store.create("grace")
__check__("tokens are unique strings", isinstance(t1, str) and t1 != t2, True)
__check__("valid session", store.get(t1), "ada")
now[0] += 59.9
__check__("still valid just before expiry", store.get(t1), "ada")
now[0] += 0.1
__check__("expired exactly at ttl", store.get(t1), None)
__check__("unknown token", store.get("nope"), None)
t3 = store.create("linus")
store.revoke(t3)
__check__("revoked session", store.get(t3), None)
store.revoke("never-existed")
t4 = store.create("barbara")
__check__("active count", store.active_count(), 1)
import time as __time
__real__ = __time.time
__time.time = lambda: (_ for _ in ()).throw(AssertionError("time.time() must not be called"))
try:
    s2 = SessionStore(5, clock=lambda: 0.0)
    __check__("does not read the real clock", s2.get(s2.create("x")), "x")
finally:
    __time.time = __real__
`),
  },
  {
    ...base,
    id: 'se-swe-20',
    title: 'Test Doubles: Reminder Emails Verified With a Spy',
    difficulty: 'Easy',
    prompt:
      'Write send_due_reminders(invoices, mailer, today). invoices is a list of dicts with keys id, email, due (a ' +
      'datetime.date) and paid (bool). For every UNPAID invoice whose due date is BEFORE today, call ' +
      'mailer.send(email, f"Reminder: invoice {id}") exactly once — even if the same invoice id appears twice in ' +
      'the list. Skip invoices with an empty email. Return the number of reminders sent. The grader passes a spy ' +
      'mailer that records calls — no real email, no real clock.',
    starterCode:
      'from datetime import date\n\n' +
      'def send_due_reminders(invoices: list[dict], mailer, today: date) -> int:\n' +
      '    # TODO: decide who is overdue, then call mailer.send once per invoice id\n' +
      '    pass\n',
    hints: [
      'Overdue means not inv["paid"] and inv["due"] < today.',
      'Keep a set of invoice ids you have already reminded.',
      'Count how many times you call mailer.send and return that number.',
    ],
    solution:
      'from datetime import date\n\n' +
      'def send_due_reminders(invoices: list[dict], mailer, today: date) -> int:\n' +
      '    sent = set()\n' +
      '    for inv in invoices:\n' +
      '        if inv["paid"] or inv["due"] >= today or not inv["email"] or inv["id"] in sent:\n' +
      '            continue\n' +
      '        mailer.send(inv["email"], f"Reminder: invoice {inv[\'id\']}")\n' +
      '        sent.add(inv["id"])\n' +
      '    return len(sent)\n',
    testCode: grader(`
from datetime import date
class __Spy__:
    def __init__(self): self.sent = []
    def send(self, to, subject): self.sent.append((to, subject))
today = date(2026, 3, 10)
invoices = [
    {"id": 1, "email": "a@x.test", "due": date(2026, 3, 1), "paid": False},
    {"id": 2, "email": "b@x.test", "due": date(2026, 3, 1), "paid": True},
    {"id": 3, "email": "c@x.test", "due": date(2026, 3, 10), "paid": False},
    {"id": 4, "email": "d@x.test", "due": date(2026, 4, 1), "paid": False},
    {"id": 5, "email": "", "due": date(2026, 1, 1), "paid": False},
    {"id": 1, "email": "a@x.test", "due": date(2026, 3, 1), "paid": False},
    {"id": 6, "email": "e@x.test", "due": date(2026, 3, 9), "paid": False},
]
spy = __Spy__()
n = send_due_reminders(invoices, spy, today)
__check__("returns count", n, 2)
__check__("exact messages", spy.sent, [("a@x.test", "Reminder: invoice 1"), ("e@x.test", "Reminder: invoice 6")])
spy2 = __Spy__()
__check__("nothing overdue", send_due_reminders([], spy2, today), 0)
__check__("no calls when nothing overdue", spy2.sent, [])
`),
  },
  {
    ...base,
    id: 'se-swe-21',
    title: 'Property-Based Testing: A Run-Length Codec',
    difficulty: 'Medium',
    prompt:
      'Implement rle_encode(text) → list of (char, count) pairs and rle_decode(pairs) → str. The grader checks ' +
      'PROPERTIES over hundreds of random strings rather than a few examples: decode(encode(s)) == s for every s; ' +
      'no two adjacent pairs share a character; every count is >= 1; and the counts sum to len(s). It also checks ' +
      'that rle_decode raises ValueError for a pair with a count below 1 or a "char" that is not exactly one ' +
      'character.',
    starterCode:
      'def rle_encode(text: str) -> list[tuple[str, int]]:\n' +
      '    pass  # TODO\n\n' +
      'def rle_decode(pairs: list[tuple[str, int]]) -> str:\n' +
      '    pass  # TODO\n',
    hints: [
      'Encoding: if the list is non-empty and out[-1][0] == ch, replace the last pair with (ch, count + 1); otherwise append (ch, 1).',
      'Decoding: "".join(ch * n for ch, n in pairs) — after validating every pair.',
      'Validation: raise ValueError if len(ch) != 1 or n < 1.',
    ],
    solution:
      'def rle_encode(text: str) -> list[tuple[str, int]]:\n' +
      '    out = []\n' +
      '    for ch in text:\n' +
      '        if out and out[-1][0] == ch:\n' +
      '            out[-1] = (ch, out[-1][1] + 1)\n' +
      '        else:\n' +
      '            out.append((ch, 1))\n' +
      '    return out\n\n' +
      'def rle_decode(pairs: list[tuple[str, int]]) -> str:\n' +
      '    for ch, n in pairs:\n' +
      '        if not isinstance(ch, str) or len(ch) != 1 or n < 1:\n' +
      '            raise ValueError(f"bad pair: {(ch, n)!r}")\n' +
      '    return "".join(ch * n for ch, n in pairs)\n',
    testCode: grader(`
import random
rng = random.Random(1729)
alphabet = "aab\\u00e9\\u4e2d \\n"
samples = ["", "a", "aaaa", "abc", "aabbaa"] + ["".join(rng.choice(alphabet) for _ in range(rng.randint(0, 40))) for _ in range(300)]
round_trip = all(rle_decode(rle_encode(s)) == s for s in samples)
__check__("round trip holds for 305 strings", round_trip, True)
def __adjacent_ok__(s):
    p = rle_encode(s)
    return all(a[0] != b[0] for a, b in zip(p, p[1:]))
__check__("no adjacent pairs share a character", all(__adjacent_ok__(s) for s in samples), True)
__check__("counts are positive and sum to length", all(all(n >= 1 for _, n in rle_encode(s)) and sum(n for _, n in rle_encode(s)) == len(s) for s in samples), True)
__check__("example", rle_encode("aaab"), [("a", 3), ("b", 1)])
__raises__("rejects zero count", lambda: rle_decode([("a", 0)]), ValueError)
__raises__("rejects multi-char", lambda: rle_decode([("ab", 2)]), ValueError)
`),
  },
  {
    ...base,
    id: 'se-swe-22',
    title: 'Integration Testing: A SQLite User Repository',
    difficulty: 'Hard',
    prompt:
      'Build UserRepo(conn) on a real sqlite3 connection — the tests use an in-memory database, not a fake. The ' +
      'constructor creates a users table if missing. add(email, name) stores a user and raises DuplicateEmail ' +
      '(defined in the starter) if the email already exists, compared case-insensitively. get(email) returns ' +
      'the name or None (case-insensitive). rename(email, new_name) returns True if a row changed. All queries ' +
      'must be parameterized: names like O\'Brien and hostile emails must be stored literally, never executed.',
    starterCode:
      'import sqlite3\n\n' +
      'class DuplicateEmail(Exception):\n' +
      '    pass\n\n' +
      'class UserRepo:\n' +
      '    def __init__(self, conn: sqlite3.Connection):\n' +
      '        self.conn = conn\n' +
      '        # TODO: create the table (email unique, case-insensitive)\n',
    hints: [
      'Schema: create table if not exists users (email text primary key collate nocase, name text not null).',
      'Use placeholders: conn.execute("insert into users values (?, ?)", (email, name)).',
      'Catch sqlite3.IntegrityError and raise DuplicateEmail from it; use "with self.conn:" to commit.',
    ],
    solution:
      'import sqlite3\n\n' +
      'class DuplicateEmail(Exception):\n' +
      '    pass\n\n' +
      'class UserRepo:\n' +
      '    def __init__(self, conn: sqlite3.Connection):\n' +
      '        self.conn = conn\n' +
      '        with conn:\n' +
      '            conn.execute("create table if not exists users (email text primary key collate nocase, name text not null)")\n\n' +
      '    def add(self, email, name):\n' +
      '        try:\n' +
      '            with self.conn:\n' +
      '                self.conn.execute("insert into users (email, name) values (?, ?)", (email, name))\n' +
      '        except sqlite3.IntegrityError as exc:\n' +
      '            raise DuplicateEmail(email) from exc\n\n' +
      '    def get(self, email):\n' +
      '        row = self.conn.execute("select name from users where email = ?", (email,)).fetchone()\n' +
      '        return row[0] if row else None\n\n' +
      '    def rename(self, email, new_name):\n' +
      '        with self.conn:\n' +
      '            cur = self.conn.execute("update users set name = ? where email = ?", (new_name, email))\n' +
      '        return cur.rowcount == 1\n',
    testCode: grader(`
import sqlite3
conn = sqlite3.connect(":memory:")
repo = UserRepo(conn)
repo.add("ada@example.com", "Ada")
__check__("get", repo.get("ada@example.com"), "Ada")
__check__("get is case-insensitive", repo.get("ADA@EXAMPLE.COM"), "Ada")
__raises__("duplicate (case-insensitive)", lambda: repo.add("Ada@Example.com", "Impostor"), DuplicateEmail)
repo.add("ob@example.com", "O'Brien")
__check__("quote stored literally", repo.get("ob@example.com"), "O'Brien")
evil = "x'); drop table users; --@evil.test"
repo.add(evil, "Mallory")
__check__("hostile email stored as data", repo.get(evil), "Mallory")
__check__("table survived", conn.execute("select count(*) from users").fetchone()[0], 3)
__check__("rename existing", repo.rename("ada@example.com", "Ada Lovelace"), True)
__check__("rename persisted", repo.get("ada@example.com"), "Ada Lovelace")
__check__("rename missing", repo.rename("nobody@example.com", "X"), False)
__check__("missing user", repo.get("nobody@example.com"), None)
repo2 = UserRepo(conn)
__check__("constructor is idempotent", repo2.get("ob@example.com"), "O'Brien")
`),
  },
  {
    ...base,
    id: 'se-swe-23',
    title: 'TDD Kata: The String Calculator',
    difficulty: 'Medium',
    prompt:
      'Grow add(numbers: str) -> int one rule at a time, test-first (the grader\'s checks follow the classic TDD ' +
      'kata order): "" → 0; "7" → 7; "1,2" → 3; newlines also separate numbers ("1\\n2,3" → 6); a custom ' +
      'delimiter line "//;\\n1;2" → 3 (the delimiter can be any single character, including regex symbols like ' +
      '* or .); numbers above 1000 are ignored ("2,1001" → 2, but 1000 counts); negatives raise ValueError whose ' +
      'message lists ALL negatives in order: "negatives not allowed: -1, -4".',
    starterCode:
      'def add(numbers: str) -> int:\n' +
      '    # TODO: make the next failing rule pass, then refactor\n' +
      '    return 0\n',
    hints: [
      'Read an optional header: if numbers.startswith("//"), the delimiter is numbers[2] and the body starts after the first newline.',
      'Normalise separators with body.replace("\\n", delim).split(delim) — no regex needed, so * and . are safe.',
      'Collect negatives first; if any, raise ValueError("negatives not allowed: " + ", ".join(map(str, negatives))).',
    ],
    solution:
      'def add(numbers: str) -> int:\n' +
      '    if not numbers:\n' +
      '        return 0\n' +
      '    delim, body = ",", numbers\n' +
      '    if numbers.startswith("//"):\n' +
      '        delim = numbers[2]\n' +
      '        body = numbers[numbers.index("\\n") + 1:]\n' +
      '    values = [int(part) for part in body.replace("\\n", delim).replace(",", delim).split(delim) if part != ""]\n' +
      '    negatives = [v for v in values if v < 0]\n' +
      '    if negatives:\n' +
      '        raise ValueError("negatives not allowed: " + ", ".join(map(str, negatives)))\n' +
      '    return sum(v for v in values if v <= 1000)\n',
    testCode: grader(`
__check__("empty string", add(""), 0)
__check__("single number", add("7"), 7)
__check__("two numbers", add("1,2"), 3)
__check__("newlines", add("1\\n2,3"), 6)
__check__("custom delimiter", add("//;\\n1;2"), 3)
__check__("regex-special delimiter *", add("//*\\n4*5*6"), 15)
__check__("regex-special delimiter .", add("//.\\n1.1"), 2)
__check__("ignores above 1000", add("2,1001"), 2)
__check__("1000 counts", add("1000,1"), 1001)
try:
    add("2,-1,3,-4")
    __check__("negatives raise", "no error", "ValueError")
except ValueError as e:
    __check__("lists all negatives", str(e), "negatives not allowed: -1, -4")
`),
  },
  {
    ...base,
    id: 'se-swe-24',
    title: 'Code Review Bot: Flag Risky Lines in a Diff',
    difficulty: 'Hard',
    prompt:
      'Automate the boring part of review. Write review_diff(diff) that reads a unified diff and returns a sorted ' +
      'list of (path, line, message) comments for ADDED lines only. Track the file from "+++ b/<path>" and the ' +
      'new-file line number from each hunk header "@@ -a,b +c,d @@" (context lines and added lines advance the ' +
      'counter; removed lines do not). Rules: a line containing "print(" → "debug print"; "TODO" → "unresolved ' +
      'TODO"; "eval(" → "eval call"; a string matching AKIA followed by 16 uppercase letters/digits → "possible ' +
      'AWS key". A line can produce several comments.',
    starterCode:
      'import re\n\n' +
      'def review_diff(diff: str) -> list[tuple[str, int, str]]:\n' +
      '    comments = []\n' +
      '    # TODO: track the current file and new-file line number, then apply the rules to "+" lines\n' +
      '    return sorted(comments)\n',
    hints: [
      'A hunk header can be parsed with re.match(r"@@ -\\d+(?:,\\d+)? \\+(\\d+)", line); the captured number is the next new-file line.',
      'Skip "+++" and "---" header lines before treating "+" as an added line.',
      'For "+" and " " (context) lines use the current number then increment; for "-" lines do not increment.',
    ],
    solution:
      'import re\n\n' +
      'AWS = re.compile(r"AKIA[0-9A-Z]{16}")\n' +
      'HUNK = re.compile(r"@@ -\\d+(?:,\\d+)? \\+(\\d+)")\n\n' +
      'def review_diff(diff: str) -> list[tuple[str, int, str]]:\n' +
      '    comments, path, line_no = [], None, 0\n' +
      '    for raw in diff.splitlines():\n' +
      '        if raw.startswith("+++ "):\n' +
      '            path = raw[4:].removeprefix("b/")\n' +
      '            continue\n' +
      '        if raw.startswith("--- "):\n' +
      '            continue\n' +
      '        hunk = HUNK.match(raw)\n' +
      '        if hunk:\n' +
      '            line_no = int(hunk.group(1))\n' +
      '            continue\n' +
      '        if raw.startswith("+"):\n' +
      '            text = raw[1:]\n' +
      '            if "print(" in text: comments.append((path, line_no, "debug print"))\n' +
      '            if "TODO" in text: comments.append((path, line_no, "unresolved TODO"))\n' +
      '            if "eval(" in text: comments.append((path, line_no, "eval call"))\n' +
      '            if AWS.search(text): comments.append((path, line_no, "possible AWS key"))\n' +
      '            line_no += 1\n' +
      '        elif raw.startswith(" "):\n' +
      '            line_no += 1\n' +
      '    return sorted(comments)\n',
    testCode: grader(`
diff = """diff --git a/app.py b/app.py
--- a/app.py
+++ b/app.py
@@ -10,4 +10,6 @@ def handler(req):
     user = load(req)
-    log(user)
+    print(user)  # TODO remove
     check(user)
+    key = "AKIAABCDEFGHIJKLMNOP"
+    return eval(req.body)
@@ -40,2 +42,3 @@ def other():
     a = 1
+    # TODO: tidy
     b = 2
--- a/README.md
+++ b/README.md
@@ -1,1 +1,2 @@
 # Project
+Use print() carefully.
"""
got = review_diff(diff)
__check__("all comments in order", got, [
    ("README.md", 2, "debug print"),
    ("app.py", 11, "debug print"),
    ("app.py", 11, "unresolved TODO"),
    ("app.py", 13, "possible AWS key"),
    ("app.py", 14, "eval call"),
    ("app.py", 43, "unresolved TODO"),
])
__check__("removed lines ignored", any(c[1] == 10 and c[0] == "app.py" for c in got), False)
__check__("short key not flagged", review_diff("+++ b/x.py\\n@@ -1 +1 @@\\n+k = 'AKIA123'\\n"), [])
__check__("empty diff", review_diff(""), [])
`),
  },
];
