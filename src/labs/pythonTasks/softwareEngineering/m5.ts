import type { CodeTask } from '../../codeTypes';
import { grader } from './harness';

const base = { language: 'python', category: 'Software Engineering' } as const;

/** Module 5 practice: data integrity, concurrency control, resilience patterns and performance.
 *  Every task is deterministic and thread-free (clocks, sleeps and randomness are injected) so it
 *  behaves the same in Pyodide and in the local verifier. */
export const SE_M5_TASKS: CodeTask[] = [
  {
    ...base,
    id: 'se-swe-33',
    title: 'Optimistic Locking: No More Lost Updates',
    difficulty: 'Easy',
    prompt:
      'Two support agents load the same user and both save — the second save silently overwrites the first. ' +
      'Fix UserRepo.update_email(user_id, email, expected_version) so it only writes when the stored version still ' +
      'equals expected_version, incrementing the version in the same UPDATE, and returns the new version. If no ' +
      'row changed, raise KeyError when the user does not exist and VersionConflict when someone else saved first. ' +
      'add() and get() are already done; get returns (email, version).',
    starterCode: `import sqlite3

class VersionConflict(Exception):
    pass

class UserRepo:
    def __init__(self, conn):
        self.conn = conn
        conn.execute("create table if not exists users ("
                     "id integer primary key, email text not null, version integer not null default 1)")

    def add(self, email):
        with self.conn:
            cur = self.conn.execute("insert into users (email) values (?)", (email,))
        return cur.lastrowid

    def get(self, user_id):
        row = self.conn.execute("select email, version from users where id = ?", (user_id,)).fetchone()
        if row is None:
            raise KeyError(user_id)
        return row

    def update_email(self, user_id, email, expected_version):
        # BUG: last write wins - concurrent edits are silently lost
        with self.conn:
            self.conn.execute("update users set email = ? where id = ?", (email, user_id))
`,
    hints: [
      'Put the version check in the WHERE clause: "... where id = ? and version = ?", and set version = version + 1.',
      'cursor.rowcount tells you how many rows the UPDATE changed — 1 means you won, 0 means conflict or missing row.',
      'When rowcount is 0, call self.get(user_id) to tell "missing" (KeyError) from "stale" (VersionConflict).',
    ],
    solution: `import sqlite3

class VersionConflict(Exception):
    pass

class UserRepo:
    def __init__(self, conn):
        self.conn = conn
        conn.execute("create table if not exists users ("
                     "id integer primary key, email text not null, version integer not null default 1)")

    def add(self, email):
        with self.conn:
            cur = self.conn.execute("insert into users (email) values (?)", (email,))
        return cur.lastrowid

    def get(self, user_id):
        row = self.conn.execute("select email, version from users where id = ?", (user_id,)).fetchone()
        if row is None:
            raise KeyError(user_id)
        return row

    def update_email(self, user_id, email, expected_version):
        with self.conn:
            cur = self.conn.execute(
                "update users set email = ?, version = version + 1 where id = ? and version = ?",
                (email, user_id, expected_version))
        if cur.rowcount != 1:
            _, current = self.get(user_id)          # raises KeyError for a missing user
            raise VersionConflict(f"user {user_id}: expected v{expected_version}, found v{current}")
        return expected_version + 1
`,
    testCode: grader(`
import sqlite3
conn = sqlite3.connect(":memory:")
repo = UserRepo(conn)
uid = repo.add("ada@example.com")
__check__("new user starts at version 1", repo.get(uid), ("ada@example.com", 1))
email, v = repo.get(uid)
__check__("update returns the new version", repo.update_email(uid, "ada@new.example", v), 2)
__check__("row updated and version bumped", repo.get(uid), ("ada@new.example", 2))
__raises__("stale version raises VersionConflict", lambda: repo.update_email(uid, "lost@example.com", v), VersionConflict)
__check__("stale write did not land", repo.get(uid)[0], "ada@new.example")
_, loaded = repo.get(uid)
repo.update_email(uid, "agent-a@example.com", loaded)
__raises__("second agent saving from the same version conflicts", lambda: repo.update_email(uid, "agent-b@example.com", loaded), VersionConflict)
__check__("first agent's change is kept", repo.get(uid), ("agent-a@example.com", 3))
__raises__("unknown user raises KeyError", lambda: repo.update_email(999, "x@example.com", 1), KeyError)
other = repo.add("grace@example.com")
repo.update_email(uid, "agent-c@example.com", 3)
__check__("other rows untouched", repo.get(other), ("grace@example.com", 1))
`),
  },
  {
    ...base,
    id: 'se-swe-34',
    title: 'Kill the N+1: One Query Per Report',
    difficulty: 'Medium',
    prompt:
      'The orders page is slow because it runs one query for the orders and then one per order for the customer. ' +
      'Rewrite both functions so each issues exactly ONE SQL statement, whatever the data size — the tests count ' +
      'statements with conn.set_trace_callback. orders_with_customers(conn) returns [(order_id, customer_name, ' +
      'total_minor), ...] ordered by order id. customer_totals(conn) returns {customer_name: total_minor_sum} ' +
      'for EVERY customer, with 0 for customers who have no orders. Tables: customers(id, name) and ' +
      'orders(id, customer_id, total_minor).',
    starterCode: `def orders_with_customers(conn):
    out = []
    for order_id, customer_id, total in conn.execute(
            "select id, customer_id, total_minor from orders order by id").fetchall():
        name = conn.execute("select name from customers where id = ?", (customer_id,)).fetchone()[0]
        out.append((order_id, name, total))
    return out

def customer_totals(conn):
    totals = {}
    for cid, name in conn.execute("select id, name from customers").fetchall():
        rows = conn.execute("select total_minor from orders where customer_id = ?", (cid,)).fetchall()
        totals[name] = sum(r[0] for r in rows)
    return totals
`,
    hints: [
      'orders_with_customers: "select o.id, c.name, o.total_minor from orders o join customers c on c.id = o.customer_id order by o.id".',
      'customer_totals needs customers with no orders, so use LEFT JOIN from customers to orders.',
      'SUM over no rows is NULL — wrap it: coalesce(sum(o.total_minor), 0), and GROUP BY c.id. dict(rows) builds the result.',
    ],
    solution: `def orders_with_customers(conn):
    return conn.execute(
        "select o.id, c.name, o.total_minor from orders o "
        "join customers c on c.id = o.customer_id order by o.id").fetchall()

def customer_totals(conn):
    return dict(conn.execute(
        "select c.name, coalesce(sum(o.total_minor), 0) from customers c "
        "left join orders o on o.customer_id = c.id group by c.id").fetchall())
`,
    testCode: grader(`
import sqlite3
conn = sqlite3.connect(":memory:")
conn.executescript("""
create table customers (id integer primary key, name text not null);
create table orders (id integer primary key, customer_id integer not null references customers(id),
                     total_minor integer not null);
insert into customers values (1, 'Ama'), (2, 'Kofi'), (3, 'Esi'), (4, 'Yaw');
insert into orders values (10, 1, 500), (11, 2, 1200), (12, 1, 250), (13, 3, 900), (14, 2, 100);
""")
__stmts__ = []
conn.set_trace_callback(__stmts__.append)
__stmts__.clear()
r = orders_with_customers(conn)
__check__("orders joined to names, ordered by id", [tuple(x) for x in r],
          [(10, "Ama", 500), (11, "Kofi", 1200), (12, "Ama", 250), (13, "Esi", 900), (14, "Kofi", 100)])
__check__("orders_with_customers runs one statement", len(__stmts__), 1)
__stmts__.clear()
t = customer_totals(conn)
__check__("totals per customer, zero for no orders", t, {"Ama": 750, "Kofi": 1300, "Esi": 900, "Yaw": 0})
__check__("customer_totals runs one statement", len(__stmts__), 1)
conn.set_trace_callback(None)
with conn:
    conn.executemany("insert into orders values (?, ?, ?)", [(100 + i, 1 + i % 4, 10) for i in range(200)])
conn.set_trace_callback(__stmts__.append)
__stmts__.clear()
big = orders_with_customers(conn)
__check__("still one statement with 205 orders", len(__stmts__), 1)
__check__("all 205 rows returned", len(big), 205)
__stmts__.clear()
__check__("Yaw now has orders", customer_totals(conn)["Yaw"], 500)
__check__("customer_totals still one statement", len(__stmts__), 1)
`),
  },
  {
    ...base,
    id: 'se-swe-35',
    title: 'Mini Lockdep: Catch Deadlocks Before They Happen',
    difficulty: 'Medium',
    prompt:
      'Like the Linux kernel\'s lockdep, analyse the order in which code paths take locks. Each path is a list of ' +
      'lock names acquired in nesting order (["accounts", "ledger"] means ledger is taken while holding accounts, so ' +
      'accounts comes before ledger — and so does every earlier lock before every later one). Write ' +
      'find_inversions(paths) returning a sorted list of (a, b) pairs, a < b alphabetically, where some path orders ' +
      'a before b and another orders b before a. Then write safe_order(paths): a global lock order consistent with ' +
      'every path (a topological sort; when several locks are free to go next, take the alphabetically smallest) — ' +
      'or raise ValueError if no such order exists, which also catches three-way cycles that are not simple pairs. ' +
      'Ignore a lock repeated after itself.',
    starterCode: `def find_inversions(paths):
    # TODO: collect "before" edges from every path, then find pairs that appear both ways
    pass

def safe_order(paths):
    # TODO: topological sort with alphabetical tie-break; ValueError on a cycle
    pass
`,
    hints: [
      'Edges: for i, a in enumerate(path): for b in path[i + 1:]: if a != b: edges.add((a, b)).',
      'An inversion is an edge (a, b) whose reverse (b, a) is also present; normalise with tuple(sorted(...)) into a set.',
      'Kahn\'s algorithm: count incoming edges; repeatedly take the smallest lock with zero incoming edges. If you cannot place every lock, there is a cycle.',
    ],
    solution: `def _edges(paths):
    edges = set()
    for path in paths:
        for i, a in enumerate(path):
            for b in path[i + 1:]:
                if a != b:
                    edges.add((a, b))
    return edges

def find_inversions(paths):
    edges = _edges(paths)
    return sorted({tuple(sorted((a, b))) for a, b in edges if (b, a) in edges})

def safe_order(paths):
    edges = _edges(paths)
    nodes = {lock for path in paths for lock in path}
    incoming = {n: 0 for n in nodes}
    for _, b in edges:
        incoming[b] += 1
    ready = sorted(n for n in nodes if incoming[n] == 0)
    order = []
    while ready:
        lock = ready.pop(0)
        order.append(lock)
        for a, b in edges:
            if a == lock:
                incoming[b] -= 1
                if incoming[b] == 0:
                    ready.append(b)
        ready.sort()
    if len(order) != len(nodes):
        raise ValueError("lock-order cycle: these paths can deadlock")
    return order
`,
    testCode: grader(`
__check__("classic A-B / B-A inversion", find_inversions([["accounts", "ledger"], ["ledger", "accounts"]]), [("accounts", "ledger")])
consistent = [["a", "b", "c"], ["a", "c"], ["b", "c"]]
__check__("consistent paths have no inversions", find_inversions(consistent), [])
__check__("consistent paths give a safe order", safe_order(consistent), ["a", "b", "c"])
__check__("non-adjacent locks in one path count", find_inversions([["a", "b", "c"], ["c", "a"]]), [("a", "c")])
__check__("several inversions sorted", find_inversions([["z", "y"], ["y", "z"], ["b", "a"], ["a", "b"]]), [("a", "b"), ("y", "z")])
cycle = [["a", "b"], ["b", "c"], ["c", "a"]]
__check__("three-way cycle has no pairwise inversion", find_inversions(cycle), [])
__raises__("safe_order rejects the three-way cycle", lambda: safe_order(cycle), ValueError)
__raises__("safe_order rejects a simple inversion", lambda: safe_order([["x", "y"], ["y", "x"]]), ValueError)
__check__("alphabetical tie-break", safe_order([["x"], ["b", "a2"]]), ["b", "a2", "x"])
__check__("repeated lock ignored", (find_inversions([["a", "a", "b"]]), safe_order([["a", "a", "b"]])), ([], ["a", "b"]))
__check__("no paths", (find_inversions([]), safe_order([])), ([], []))
`),
  },
  {
    ...base,
    id: 'se-swe-36',
    title: 'Compare-and-Set With Bounded Retries',
    difficulty: 'Medium',
    prompt:
      'A distributed key-value store offers get(key) -> (value, version) and cas(key, expected_version, new_value) ' +
      '-> bool, which writes only if the version is unchanged. Write update(store, key, fn, max_attempts=5): read, ' +
      'compute fn(value), attempt cas, and on failure RE-READ and recompute — never reuse a stale value. Return the ' +
      'value that was written. After max_attempts failed cas calls, raise TooMuchContention so a hot key cannot spin ' +
      'forever. The tests use a store where another writer sneaks in before some of your writes.',
    starterCode: `class TooMuchContention(Exception):
    pass

def update(store, key, fn, max_attempts=5):
    # BUG: one attempt, and the result of cas is ignored
    value, version = store.get(key)
    new = fn(value)
    store.cas(key, version, new)
    return new
`,
    hints: [
      'Loop for _ in range(max_attempts): get, compute, cas. Return as soon as cas returns True.',
      'Read inside the loop — after a failed cas the version (and value) you hold is stale.',
      'After the loop ends without success, raise TooMuchContention(...).',
    ],
    solution: `class TooMuchContention(Exception):
    pass

def update(store, key, fn, max_attempts=5):
    for _ in range(max_attempts):
        value, version = store.get(key)
        new = fn(value)
        if store.cas(key, version, new):
            return new
    raise TooMuchContention(f"{key!r}: gave up after {max_attempts} attempts")
`,
    testCode: grader(`
class __Store__:
    def __init__(self, value, interfere=0):
        self.data = {"n": (value, 1)}
        self.interfere = interfere
        self.cas_calls = 0
    def get(self, key):
        return self.data[key]
    def cas(self, key, expected, new):
        self.cas_calls += 1
        value, version = self.data[key]
        if self.interfere > 0:              # another writer adds 10 first
            self.interfere -= 1
            self.data[key] = (value + 10, version + 1)
            return False
        if version != expected:
            return False
        self.data[key] = (new, version + 1)
        return True

s = __Store__(0)
__check__("no contention: writes fn(value)", update(s, "n", lambda v: v + 1), 1)
__check__("stored value and version", s.data["n"], (1, 2))
__check__("one cas call", s.cas_calls, 1)
s = __Store__(0, interfere=2)
seen = []
def __inc__(v):
    seen.append(v)
    return v + 1
__check__("keeps the other writer's changes", update(s, "n", __inc__), 21)
__check__("fn saw fresh values each attempt", seen, [0, 10, 20])
__check__("three cas calls", s.cas_calls, 3)
__check__("final version", s.data["n"], (21, 4))
s = __Store__(0, interfere=5)
__raises__("gives up after max_attempts", lambda: update(s, "n", lambda v: v + 1), TooMuchContention)
__check__("bounded: exactly 5 cas calls", s.cas_calls, 5)
s = __Store__(5, interfere=2)
__check__("custom max_attempts=3 succeeds on the last try", update(s, "n", lambda v: v * 2, max_attempts=3), 50)
s = __Store__(0, interfere=1)
__raises__("custom max_attempts=1 fails fast", lambda: update(s, "n", lambda v: v + 1, max_attempts=1), TooMuchContention)
`),
  },
  {
    ...base,
    id: 'se-swe-37',
    title: 'Retries With Exponential Backoff, Full Jitter & Retry-After',
    difficulty: 'Easy',
    prompt:
      'Write call_with_retries(op, *, attempts=4, base=0.1, cap=2.0, retryable=(TimeoutError, ConnectionError), ' +
      'sleep=time.sleep, rand=random.random). Call op(); on a retryable exception wait and try again, up to attempts ' +
      'calls in total, then re-raise the last error. The wait before retry number k (k = 0 for the first retry) is ' +
      'rand() * min(cap, base * 2**k) — "full jitter". If the exception has a retry_after attribute that is not ' +
      'None (a server\'s Retry-After), wait exactly min(cap, retry_after) instead. Non-retryable exceptions propagate ' +
      'immediately with no wait. attempts < 1 raises ValueError. sleep and rand are injected so tests run instantly.',
    starterCode: `import random
import time

def call_with_retries(op, *, attempts=4, base=0.1, cap=2.0,
                      retryable=(TimeoutError, ConnectionError),
                      sleep=time.sleep, rand=random.random):
    # TODO: bounded retries with backoff
    return op()
`,
    hints: [
      'for attempt in range(attempts): try: return op() except retryable as exc: ...',
      'On the last attempt, re-raise with a bare raise so the original traceback is kept.',
      'retry_after = getattr(exc, "retry_after", None) — use it when present, otherwise rand() * min(cap, base * 2 ** attempt).',
    ],
    solution: `import random
import time

def call_with_retries(op, *, attempts=4, base=0.1, cap=2.0,
                      retryable=(TimeoutError, ConnectionError),
                      sleep=time.sleep, rand=random.random):
    if attempts < 1:
        raise ValueError("attempts must be at least 1")
    for attempt in range(attempts):
        try:
            return op()
        except retryable as exc:
            if attempt == attempts - 1:
                raise
            retry_after = getattr(exc, "retry_after", None)
            if retry_after is not None:
                delay = min(cap, retry_after)
            else:
                delay = rand() * min(cap, base * 2 ** attempt)
            sleep(delay)
`,
    testCode: grader(`
class __Flaky__:
    def __init__(self, failures, make_exc=lambda: TimeoutError("timed out")):
        self.failures = failures
        self.make_exc = make_exc
        self.calls = 0
    def __call__(self):
        self.calls += 1
        if self.calls <= self.failures:
            raise self.make_exc()
        return "ok"

slept = []
op = __Flaky__(2)
__check__("succeeds after transient failures", call_with_retries(op, sleep=slept.append, rand=lambda: 0.5), "ok")
__check__("called three times", op.calls, 3)
__check__("full-jitter exponential delays", slept, [0.05, 0.1])
slept = []
op = __Flaky__(4)
call_with_retries(op, attempts=5, base=1, cap=3, sleep=slept.append, rand=lambda: 1.0)
__check__("delays are capped", slept, [1, 2, 3, 3])
slept = []
op = __Flaky__(10)
__raises__("gives up and re-raises", lambda: call_with_retries(op, attempts=3, sleep=slept.append, rand=lambda: 0.5), TimeoutError)
__check__("bounded to 3 calls", op.calls, 3)
__check__("no sleep after the final failure", len(slept), 2)
slept = []
op = __Flaky__(1, make_exc=lambda: ValueError("bad input"))
__raises__("non-retryable propagates", lambda: call_with_retries(op, sleep=slept.append), ValueError)
__check__("non-retryable: one call, no sleep", (op.calls, slept), (1, []))
class __Throttled__(ConnectionError):
    def __init__(self, retry_after):
        super().__init__("429 Too Many Requests")
        self.retry_after = retry_after
slept = []
call_with_retries(__Flaky__(1, make_exc=lambda: __Throttled__(1.5)), sleep=slept.append, rand=lambda: 0.5)
__check__("honours Retry-After", slept, [1.5])
slept = []
call_with_retries(__Flaky__(1, make_exc=lambda: __Throttled__(30)), cap=2.0, sleep=slept.append, rand=lambda: 0.5)
__check__("Retry-After is capped too", slept, [2.0])
__raises__("attempts < 1 rejected", lambda: call_with_retries(lambda: "ok", attempts=0), ValueError)
`),
  },
  {
    ...base,
    id: 'se-swe-38',
    title: 'Circuit Breaker With an Injected Clock',
    difficulty: 'Hard',
    prompt:
      'Implement CircuitBreaker(threshold=3, cooldown=10.0, clock=time.monotonic) with call(fn, *args, **kwargs) and ' +
      'a state attribute: "closed", "open" or "half_open". Closed: call fn; a success resets the consecutive-failure ' +
      'count; after threshold consecutive failures the breaker opens (record clock()). Open: raise CircuitOpen ' +
      'WITHOUT calling fn until cooldown seconds have passed (clock() - opened_at >= cooldown); then go half_open ' +
      'and let one trial call through. A trial success closes the breaker and resets the count; a trial failure ' +
      'opens it again from the current time. fn\'s own exceptions always propagate unchanged.',
    starterCode: `import time

class CircuitOpen(Exception):
    pass

class CircuitBreaker:
    def __init__(self, threshold=3, cooldown=10.0, clock=time.monotonic):
        self.state = "closed"

    def call(self, fn, *args, **kwargs):
        # TODO: count failures, open, fail fast, half-open trial
        return fn(*args, **kwargs)
`,
    hints: [
      'Keep self.failures and self.opened_at. At the start of call(), if open: either move to half_open (cool-down over) or raise CircuitOpen.',
      'Wrap fn in try/except Exception: on failure update state and re-raise with a bare raise.',
      'On failure: self.failures += 1; open if the state was half_open or failures >= threshold, setting opened_at = clock().',
    ],
    solution: `import time

class CircuitOpen(Exception):
    pass

class CircuitBreaker:
    def __init__(self, threshold=3, cooldown=10.0, clock=time.monotonic):
        self.threshold = threshold
        self.cooldown = cooldown
        self.clock = clock
        self.state = "closed"
        self.failures = 0
        self.opened_at = None

    def call(self, fn, *args, **kwargs):
        if self.state == "open":
            if self.clock() - self.opened_at < self.cooldown:
                raise CircuitOpen("dependency unavailable; failing fast")
            self.state = "half_open"
        try:
            result = fn(*args, **kwargs)
        except Exception:
            self.failures += 1
            if self.state == "half_open" or self.failures >= self.threshold:
                self.state = "open"
                self.opened_at = self.clock()
            raise
        self.state = "closed"
        self.failures = 0
        return result
`,
    testCode: grader(`
now = [0.0]
calls = []
def ok():
    calls.append("ok")
    return "fine"
def down():
    calls.append("down")
    raise ConnectionError("dependency down")
cb = CircuitBreaker(threshold=3, cooldown=10.0, clock=lambda: now[0])
def __try__(fn):
    try:
        return cb.call(fn)
    except Exception as e:
        return type(e).__name__
__check__("starts closed", cb.state, "closed")
__check__("passes results through", __try__(ok), "fine")
__check__("fn errors propagate unchanged", [__try__(down), __try__(down)], ["ConnectionError", "ConnectionError"])
__try__(ok)
__check__("success resets the consecutive count", (__try__(down), __try__(down), cb.state), ("ConnectionError", "ConnectionError", "closed"))
__try__(down)
__check__("opens after 3 consecutive failures", cb.state, "open")
calls.clear()
now[0] = 9.9
__check__("open: fails fast", __try__(ok), "CircuitOpen")
__check__("open: fn not called", calls, [])
now[0] = 10.0
__check__("after cool-down a trial goes through", __try__(down), "ConnectionError")
__check__("failed trial re-opens", cb.state, "open")
now[0] = 15.0
__check__("cool-down restarts from the failed trial", __try__(ok), "CircuitOpen")
now[0] = 20.0
__check__("successful trial", __try__(ok), "fine")
__check__("successful trial closes", cb.state, "closed")
__check__("closed again: one failure does not open", (__try__(down), cb.state), ("ConnectionError", "closed"))
cb2 = CircuitBreaker(threshold=1, cooldown=5, clock=lambda: now[0])
__check__("passes args and kwargs", cb2.call(lambda a, b=0: a + b, 2, b=3), 5)
`),
  },
  {
    ...base,
    id: 'se-swe-39',
    title: 'Transactional Outbox & Idempotent Consumer',
    difficulty: 'Hard',
    prompt:
      'Fix the dual-write bug. place_order(conn, order_id, total_minor) must insert the order AND an outbox row ' +
      '(topic "OrderPlaced", payload json.dumps({"order_id": ..., "total_minor": ...})) in ONE transaction. ' +
      'relay(conn, publish) publishes unsent outbox rows in id order as {"id": row_id, "topic": ..., "payload": ' +
      'dict}, marking each row sent only after publish returns; if publish raises, let it propagate and leave that ' +
      'row (and later ones) unsent. Return how many were sent. Finally IdempotentConsumer(handler).handle(message) ' +
      'calls handler once per message id and returns True, returns False for a duplicate, and does NOT remember a ' +
      'message whose handler raised — so redelivery can retry it. setup(conn) creates the tables.',
    starterCode: `import json
import sqlite3

def setup(conn):
    conn.executescript("""
    create table if not exists orders (id text primary key, total_minor integer not null);
    create table if not exists outbox (id integer primary key autoincrement, topic text not null,
                                       payload text not null, sent integer not null default 0);
    """)

def place_order(conn, order_id, total_minor):
    # BUG: the event is never recorded - if we published here and crashed, it would be lost
    with conn:
        conn.execute("insert into orders (id, total_minor) values (?, ?)", (order_id, total_minor))

def relay(conn, publish):
    pass

class IdempotentConsumer:
    def __init__(self, handler):
        self.handler = handler

    def handle(self, message):
        self.handler(message)
        return True
`,
    hints: [
      'Do both INSERTs inside one "with conn:" block — sqlite3 commits on success and rolls back both on any error.',
      'relay: select id, topic, payload from outbox where sent = 0 order by id; for each row publish, then update ... set sent = 1.',
      'IdempotentConsumer: keep a set of seen ids; add the id only after the handler returns.',
    ],
    solution: `import json
import sqlite3

def setup(conn):
    conn.executescript("""
    create table if not exists orders (id text primary key, total_minor integer not null);
    create table if not exists outbox (id integer primary key autoincrement, topic text not null,
                                       payload text not null, sent integer not null default 0);
    """)

def place_order(conn, order_id, total_minor):
    payload = json.dumps({"order_id": order_id, "total_minor": total_minor})
    with conn:
        conn.execute("insert into orders (id, total_minor) values (?, ?)", (order_id, total_minor))
        conn.execute("insert into outbox (topic, payload) values (?, ?)", ("OrderPlaced", payload))

def relay(conn, publish):
    rows = conn.execute("select id, topic, payload from outbox where sent = 0 order by id").fetchall()
    sent = 0
    for row_id, topic, payload in rows:
        publish({"id": row_id, "topic": topic, "payload": json.loads(payload)})
        with conn:
            conn.execute("update outbox set sent = 1 where id = ?", (row_id,))
        sent += 1
    return sent

class IdempotentConsumer:
    def __init__(self, handler):
        self.handler = handler
        self.seen = set()

    def handle(self, message):
        if message["id"] in self.seen:
            return False
        self.handler(message)
        self.seen.add(message["id"])
        return True
`,
    testCode: grader(`
import sqlite3
conn = sqlite3.connect(":memory:")
setup(conn)
place_order(conn, "A-1", 500)
place_order(conn, "A-2", 1200)
place_order(conn, "A-3", 90)
__check__("event stored with each order", conn.execute("select count(*) from outbox where sent = 0").fetchone()[0], 3)
__raises__("duplicate order id rejected", lambda: place_order(conn, "A-1", 1), sqlite3.IntegrityError)
__check__("failed order leaves no event", conn.execute("select count(*) from outbox").fetchone()[0], 3)
published = []
def __flaky__(msg):
    if len(published) == 1:
        raise ConnectionError("broker down")
    published.append(msg)
__raises__("relay surfaces broker errors", lambda: relay(conn, __flaky__), ConnectionError)
__check__("first event published", published, [{"id": 1, "topic": "OrderPlaced", "payload": {"order_id": "A-1", "total_minor": 500}}])
__check__("unpublished events stay pending", conn.execute("select id from outbox where sent = 0 order by id").fetchall(), [(2,), (3,)])
__check__("relay resumes in order", (relay(conn, published.append), [m["id"] for m in published]), (2, [1, 2, 3]))
__check__("nothing left to send", relay(conn, published.append), 0)
emails = []
fail_once = {"A-3"}
def __send_email__(msg):
    order = msg["payload"]["order_id"]
    if order in fail_once:
        fail_once.discard(order)
        raise TimeoutError("smtp timeout")
    emails.append(order)
consumer = IdempotentConsumer(__send_email__)
__check__("first delivery handled", consumer.handle(published[0]), True)
__check__("redelivery is a duplicate", consumer.handle(published[0]), False)
consumer.handle(published[1])
__raises__("handler failure propagates", lambda: consumer.handle(published[2]), TimeoutError)
__check__("failed message can be retried", consumer.handle(published[2]), True)
__check__("each email sent exactly once", emails, ["A-1", "A-2", "A-3"])
conn.execute("drop table outbox")
__raises__("outbox failure fails the order", lambda: place_order(conn, "B-1", 10), sqlite3.OperationalError)
__check__("order rolled back with its event", conn.execute("select count(*) from orders where id = 'B-1'").fetchone()[0], 0)
`),
  },
  {
    ...base,
    id: 'se-swe-40',
    title: 'A Bounded LRU Cache With TTL and Invalidation',
    difficulty: 'Medium',
    prompt:
      'Build TTLCache(maxsize, ttl, clock=time.monotonic). set(key, value) stores a value that expires ttl seconds ' +
      'later (expired when clock() >= expiry) and makes it most recently used; when more than maxsize entries exist, ' +
      'evict the least recently used. get(key, default=None) returns the value (and marks it recently used) or ' +
      'default if missing or expired, counting hits and misses in .hits and .misses. invalidate(key) removes a key ' +
      'if present. get_or_load(key, loader) returns the cached value or calls loader(key), caches and returns it — ' +
      'even when the value is None. hit_rate() is hits / (hits + misses), 0.0 before any lookup. maxsize < 1 raises ' +
      'ValueError.',
    starterCode: `import time
from collections import OrderedDict

class TTLCache:
    def __init__(self, maxsize, ttl, clock=time.monotonic):
        self._data = {}   # TODO: no bound, no expiry, no stats

    def get(self, key, default=None):
        return self._data.get(key, default)

    def set(self, key, value):
        self._data[key] = value

    def invalidate(self, key):
        pass

    def get_or_load(self, key, loader):
        pass

    def hit_rate(self):
        return 0.0
`,
    hints: [
      'Store (value, expires_at) in an OrderedDict; move_to_end(key) marks use, popitem(last=False) evicts the oldest.',
      'Wrapping values in a tuple lets you tell "cached None" apart from "missing".',
      'get_or_load needs its own "missing" marker: use a private sentinel object() as the default for get().',
    ],
    solution: `import time
from collections import OrderedDict

_MISSING = object()

class TTLCache:
    def __init__(self, maxsize, ttl, clock=time.monotonic):
        if maxsize < 1:
            raise ValueError("maxsize must be at least 1")
        self.maxsize = maxsize
        self.ttl = ttl
        self.clock = clock
        self._data = OrderedDict()
        self.hits = 0
        self.misses = 0

    def get(self, key, default=None):
        entry = self._data.get(key)
        if entry is not None and self.clock() >= entry[1]:
            del self._data[key]
            entry = None
        if entry is None:
            self.misses += 1
            return default
        self._data.move_to_end(key)
        self.hits += 1
        return entry[0]

    def set(self, key, value):
        self._data[key] = (value, self.clock() + self.ttl)
        self._data.move_to_end(key)
        while len(self._data) > self.maxsize:
            self._data.popitem(last=False)

    def invalidate(self, key):
        self._data.pop(key, None)

    def get_or_load(self, key, loader):
        value = self.get(key, _MISSING)
        if value is _MISSING:
            value = loader(key)
            self.set(key, value)
        return value

    def hit_rate(self):
        total = self.hits + self.misses
        return self.hits / total if total else 0.0
`,
    testCode: grader(`
now = [0.0]
c = TTLCache(maxsize=2, ttl=60, clock=lambda: now[0])
__check__("empty hit rate", c.hit_rate(), 0.0)
c.set("a", 1)
c.set("b", 2)
__check__("hit", c.get("a"), 1)
c.set("c", 3)
__check__("LRU evicted b (a was used recently)", (c.get("b"), c.get("a"), c.get("c")), (None, 1, 3))
__check__("default for missing", c.get("zzz", "none"), "none")
__check__("hit and miss counters", (c.hits, c.misses), (3, 2))
__check__("hit rate", c.hit_rate(), 0.6)
now[0] = 59.9
__check__("fresh before ttl", c.get("a"), 1)
now[0] = 60.0
__check__("expired at ttl", c.get("a"), None)
c.set("a", 10)
c.invalidate("a")
__check__("invalidate removes", c.get("a"), None)
c.invalidate("never-set")
loads = []
def __load__(key):
    loads.append(key)
    return None if key == "ghost" else key.upper()
c2 = TTLCache(maxsize=10, ttl=5, clock=lambda: now[0])
__check__("get_or_load loads once", (c2.get_or_load("x", __load__), c2.get_or_load("x", __load__)), ("X", "X"))
__check__("cached None is not reloaded", (c2.get_or_load("ghost", __load__), c2.get_or_load("ghost", __load__)), (None, None))
__check__("loader calls", loads, ["x", "ghost"])
now[0] = 70.0
c2.get_or_load("x", __load__)
__check__("expired entries reload", loads, ["x", "ghost", "x"])
c3 = TTLCache(maxsize=10, ttl=5, clock=lambda: now[0])
c3.set(("tenant-1", "profile"), "Ama")
__check__("tenant is part of the key", (c3.get(("tenant-1", "profile")), c3.get(("tenant-2", "profile"))), ("Ama", None))
__raises__("maxsize < 1 rejected", lambda: TTLCache(0, 5), ValueError)
`),
  },
  {
    ...base,
    id: 'se-swe-41',
    title: 'Latency Percentiles, SLOs & Little\'s Law',
    difficulty: 'Easy',
    prompt:
      'Turn raw timings into numbers people can act on. percentile(values, p) uses the nearest-rank method: sort, ' +
      'take the item at rank ceil(p / 100 * n) (1-based); p must satisfy 0 < p <= 100 and values must be non-empty, ' +
      'otherwise ValueError. latency_report(samples_ms) returns {"p50", "p95", "p99", "mean"} with the mean rounded ' +
      'to 1 decimal place. slo_met(samples_ms, threshold_ms, target) is True when the fraction of samples at or ' +
      'under threshold_ms is at least target. in_flight(arrival_rate, latency_s) applies Little\'s law (L = λW), and ' +
      'workers_needed(arrival_rate, latency_s, headroom=0.25) rounds L * (1 + headroom) UP to a whole worker.',
    starterCode: `import math

def percentile(values, p):
    # BUG: this is the average, which hides the tail
    return sum(values) / len(values)

def latency_report(samples_ms):
    pass

def slo_met(samples_ms, threshold_ms, target):
    pass

def in_flight(arrival_rate, latency_s):
    pass

def workers_needed(arrival_rate, latency_s, headroom=0.25):
    pass
`,
    hints: [
      'Nearest rank: ordered = sorted(values); rank = math.ceil(p / 100 * len(ordered)); return ordered[rank - 1].',
      'slo_met: sum(1 for s in samples_ms if s <= threshold_ms) / len(samples_ms) >= target.',
      'workers_needed: math.ceil(in_flight(arrival_rate, latency_s) * (1 + headroom)).',
    ],
    solution: `import math

def percentile(values, p):
    if not values:
        raise ValueError("no samples")
    if not 0 < p <= 100:
        raise ValueError("p must be in (0, 100]")
    ordered = sorted(values)
    rank = max(1, math.ceil(p / 100 * len(ordered)))
    return ordered[rank - 1]

def latency_report(samples_ms):
    return {
        "p50": percentile(samples_ms, 50),
        "p95": percentile(samples_ms, 95),
        "p99": percentile(samples_ms, 99),
        "mean": round(sum(samples_ms) / len(samples_ms), 1),
    }

def slo_met(samples_ms, threshold_ms, target):
    good = sum(1 for s in samples_ms if s <= threshold_ms)
    return good / len(samples_ms) >= target

def in_flight(arrival_rate, latency_s):
    return arrival_rate * latency_s

def workers_needed(arrival_rate, latency_s, headroom=0.25):
    return math.ceil(in_flight(arrival_rate, latency_s) * (1 + headroom))
`,
    testCode: grader(`
ones = list(range(100, 0, -1))
__check__("p50 of 1..100 (unsorted input)", percentile(ones, 50), 50)
__check__("p95 / p99 / p100", (percentile(ones, 95), percentile(ones, 99), percentile(ones, 100)), (95, 99, 100))
__check__("single sample", percentile([42], 1), 42)
__check__("small list rounds rank up", percentile([10, 20, 30, 40], 90), 40)
search = [120] * 95 + [3000] * 5
__check__("report shows the tail the mean hides", latency_report(search), {"p50": 120, "p95": 120, "p99": 3000, "mean": 264.0})
__check__("mean rounded to 1 dp", latency_report([1, 2, 2])["mean"], 1.7)
__check__("SLO 99% under 300 ms missed", slo_met(search, 300, 0.99), False)
__check__("SLO 95% under 300 ms met", slo_met(search, 300, 0.95), True)
__check__("threshold is inclusive", slo_met([300, 300], 300, 1.0), True)
__check__("Little's law", in_flight(200, 0.25), 50.0)
__check__("workers with default headroom", workers_needed(200, 0.25), 63)
__check__("workers round up", workers_needed(40, 0.25, headroom=0.5), 15)
__raises__("empty samples rejected", lambda: percentile([], 50), ValueError)
__raises__("p = 0 rejected", lambda: percentile([1, 2], 0), ValueError)
__raises__("p > 100 rejected", lambda: percentile([1, 2], 101), ValueError)
`),
  },
];
