import type { CurriculumLesson } from '../curriculumDefinition';
import { SE_SOURCES as S } from './sources';

/** Module 5 — data, concurrency, distributed systems and performance (SWEBOK V4: Computing
 *  Foundations, Construction; DDIA; Amazon Builders' Library; Python concurrency docs). */
export const SE_MODULE_5: CurriculumLesson[] = [
  {
    id: 'swe-17',
    slug: 'data-modeling-and-transactions',
    title: 'Data Modeling, Indexes & Transactions',
    summary: 'Normalise schemas, index for real queries, read query plans, and choose isolation levels and optimistic locking to stop lost updates.',
    minutes: 26,
    prerequisite: 'Basic SQL (SELECT, JOIN, INSERT) and Module 2.',
    outcomes: [
      'Normalise a schema to third normal form and justify deliberate denormalisation.',
      'Design indexes from query patterns and confirm them with EXPLAIN QUERY PLAN.',
      'Explain ACID, isolation levels and the anomalies each prevents.',
      'Prevent lost updates with optimistic locking and avoid N+1 query patterns.',
    ],
    introduction:
      'Most production bugs that lose money are data bugs: two requests overwrite each other, a report double-counts, a slow query takes the site down at month end. Martin Kleppmann\'s Designing Data-Intensive Applications calls data "the long-lived asset" — code is rewritten, data survives. This lesson covers the database skills every application engineer needs, using SQLite so you can run every example.',
    keyTerms: [
      { term: 'Normalisation', meaning: 'Organising tables so each fact is stored once, removing update anomalies.' },
      { term: 'Index', meaning: 'A separate sorted structure (usually a B-tree) that makes lookups by certain columns fast, at a cost on writes.' },
      { term: 'ACID', meaning: 'Atomicity, Consistency, Isolation, Durability — the guarantees of a database transaction.' },
      { term: 'Lost update', meaning: 'Two transactions read the same value and both write, so one change silently disappears.' },
      { term: 'Optimistic locking', meaning: 'Detect conflicting writes with a version column instead of holding locks.' },
    ],
    sections: [
      {
        title: 'Model the facts once',
        paragraphs: [
          'A normalised schema stores each fact in one place. If a customer\'s email lives in every order row, changing it means updating many rows — and missing one creates contradictory data. Third normal form (3NF), informally: every non-key column depends on the key, the whole key, and nothing but the key. Use foreign keys and constraints (NOT NULL, UNIQUE, CHECK) so the database rejects invalid states instead of trusting every code path.',
          'Denormalise deliberately, not accidentally: a cached order total or a reporting table can be worth it for read performance, as long as you know which copy is the source of truth and how it is kept in sync.',
        ],
      },
      {
        title: 'Indexes come from queries',
        paragraphs: [
          'Design indexes from the queries you actually run. A query filtering by customer_id and ordering by created_at benefits from a composite index on (customer_id, created_at) — column order matters, because a B-tree is sorted by the first column, then the second. Every index speeds reads and slows writes and uses space, so index for real access patterns. Verify with the query plan instead of guessing.',
        ],
        code: `import sqlite3
conn = sqlite3.connect(":memory:")
conn.executescript("""
create table orders (id integer primary key, customer_id integer not null,
                     created_at text not null, total_minor integer not null);
""")
q = "select id from orders where customer_id = ? order by created_at desc limit 20"
print(conn.execute("explain query plan " + q, (7,)).fetchall())
# [(..., 'SCAN orders'), (..., 'USE TEMP B-TREE FOR ORDER BY')]  -> full scan + sort

conn.execute("create index idx_orders_customer_created on orders(customer_id, created_at)")
print(conn.execute("explain query plan " + q, (7,)).fetchall())
# [(..., 'SEARCH orders USING INDEX idx_orders_customer_created (customer_id=?)')]`,
        label: 'Confirming an index with EXPLAIN QUERY PLAN',
      },
      {
        title: 'Transactions and isolation',
        paragraphs: [
          'A transaction groups statements so they succeed or fail together (atomicity) and survive crashes once committed (durability). Isolation decides what concurrent transactions can see. Read Committed prevents dirty reads; Repeatable Read / Snapshot Isolation also prevents non-repeatable reads; Serializable behaves as if transactions ran one after another. Weaker levels allow anomalies such as lost updates and write skew, and the defaults differ between databases — PostgreSQL defaults to Read Committed — so read your database\'s documentation rather than assuming.',
        ],
      },
      {
        title: 'Stopping lost updates with optimistic locking',
        paragraphs: [
          'The classic bug: two requests read a balance of 100, each adds 50, both write 150 — one deposit vanished. Fixes: do the arithmetic in one atomic statement (UPDATE accounts SET balance = balance + 50), take a row lock (SELECT … FOR UPDATE in PostgreSQL), or use optimistic locking — store a version column, and make every update conditional on the version you read. If zero rows changed, someone else won; reload and retry or report a conflict. Optimistic locking suits web apps where conflicts are rare and holding locks across user think-time is impossible.',
        ],
        code: `def update_email(conn, user_id, new_email, expected_version) -> bool:
    with conn:
        cur = conn.execute(
            "update users set email = ?, version = version + 1 where id = ? and version = ?",
            (new_email, user_id, expected_version))
    return cur.rowcount == 1          # False -> conflict: reload and retry, or tell the user`,
        label: 'Conditional update with a version column',
      },
      {
        title: 'The N+1 query problem',
        paragraphs: [
          'Loading 100 orders and then running one query per order to fetch its customer issues 101 queries — fine on a laptop, painful across a network at scale. ORMs make this easy to do by accident. Fix it with a JOIN, an IN (…) batch query, or the ORM\'s eager-loading option, and count queries in tests (SQLite\'s set_trace_callback makes that easy). Push aggregation (SUM, COUNT, GROUP BY) into the database instead of looping in Python.',
        ],
      },
    ],
    table: {
      headers: ['Problem', 'Symptom', 'Fix'],
      rows: [
        ['Fact stored in many rows', 'Contradictory data after edits', 'Normalise; one source of truth'],
        ['Missing index', 'Full scans, slow pages at scale', 'Composite index matching filter + sort'],
        ['Lost update', 'Changes silently disappear', 'Atomic update, row lock or version check'],
        ['N+1 queries', 'Hundreds of tiny queries per page', 'JOIN, batch IN query or eager loading'],
        ['Aggregation in app code', 'Slow, memory-hungry reports', 'GROUP BY in the database'],
      ],
    },
    exercise: {
      scenario: 'Two support agents edit the same customer record at the same time; the second save overwrites the first agent\'s change to the phone number. The customer page also takes four seconds because it loads 300 tickets and then each ticket\'s assignee separately.',
      task: 'Fix both problems and explain how you would verify the fixes.',
      answer: 'Add a version column to customers; the edit form carries the version it loaded and the save runs UPDATE … WHERE id = ? AND version = ?, incrementing the version. If no row changes, return 409 Conflict and show the agent the latest data to merge. For the page, replace the per-ticket lookups with one JOIN (or a single IN query for assignees) and add an index on tickets(customer_id, created_at) for the list ordering. Verify with a test that simulates two saves from the same version (the second must fail), a test that counts queries for the page (should be constant, not proportional to tickets), and EXPLAIN QUERY PLAN showing an index search.',
      evidence: 'Optimistic locking with a user-visible conflict, a constant-query fix for N+1, an index matching the query, and tests that prove each.',
    },
    misconceptions: [
      'Transactions prevent every concurrency bug by default. Default isolation levels allow anomalies such as lost updates.',
      'More indexes always help. Each index slows writes and uses space; index for real queries.',
      'Normalisation is purely academic. It is how you avoid contradictory data after updates.',
      'The ORM makes queries efficient automatically. ORMs make N+1 patterns easy; measure query counts.',
    ],
    sources: [S.ddia, S.postgresIsolation, S.sqlite, S.swebok],
    labs: [],
    quiz: [
      { question: 'What does the A in ACID stand for?', options: ['Availability', 'Atomicity', 'Authorization', 'Accuracy'], answer: 1, explanation: 'All statements in a transaction succeed or fail together.' },
      { question: 'An UPDATE … WHERE id = ? AND version = ? changes zero rows. What happened?', options: ['The database is down', 'Another writer changed the row since you read it', 'The index is missing', 'The transaction committed twice'], answer: 1, explanation: 'Optimistic locking detected a conflict.' },
      { question: 'Why does column order matter in a composite index?', options: ['It does not', 'A B-tree is sorted by the first column, then the next', 'Indexes are alphabetical', 'Only the last column is indexed'], answer: 1, explanation: 'Leading columns determine which queries the index can serve.' },
      { question: 'Loading 50 posts then querying each author separately is an example of what?', options: ['Normalisation', 'The N+1 query problem', 'Sharding', 'A deadlock'], answer: 1, explanation: 'One query for the list plus N follow-ups.' },
      { question: 'Which tool shows how SQLite will execute a query?', options: ['EXPLAIN QUERY PLAN', 'VACUUM', 'PRAGMA foreign_keys', 'ANALYZE ALL'], answer: 0, explanation: 'It reveals scans, index searches and temporary sorts.' },
    ],
  },
  {
    id: 'swe-18',
    slug: 'concurrency',
    title: 'Concurrency: Threads, Processes, asyncio & Race Conditions',
    summary: 'Pick the right concurrency model, understand the GIL and free-threaded Python, and prevent races and deadlocks with locks, ordering and compare-and-set.',
    minutes: 26,
    prerequisite: 'Lesson 17 and Python functions and classes.',
    outcomes: [
      'Choose between threads, processes and asyncio for I/O-bound and CPU-bound work.',
      'Explain the GIL and what free-threaded Python 3.13/3.14 changes.',
      'Identify race conditions and fix them with locks, atomic operations or immutability.',
      'Prevent deadlocks with a global lock order and use compare-and-set retries for optimistic concurrency.',
    ],
    introduction:
      'Concurrency bugs are the hardest bugs: they depend on timing, disappear under a debugger and appear only in production under load. The cure is not cleverness but a small set of disciplined techniques — share less, make shared things immutable, protect the rest with locks taken in a fixed order, and prefer messaging over shared memory. Python adds its own twist: the Global Interpreter Lock, which Python 3.13 made optional and 3.14 officially supports turning off.',
    keyTerms: [
      { term: 'Race condition', meaning: 'A bug whose outcome depends on the timing of concurrent operations on shared state.' },
      { term: 'Critical section', meaning: 'Code that accesses shared state and must not run concurrently with itself.' },
      { term: 'Deadlock', meaning: 'Two or more tasks each wait forever for a lock the other holds.' },
      { term: 'GIL', meaning: 'Global Interpreter Lock: lets only one thread execute Python bytecode at a time in standard CPython.' },
      { term: 'Compare-and-set', meaning: 'An atomic "update only if the value is still what I read" operation used for lock-free updates.' },
    ],
    sections: [
      {
        title: 'Three models for doing more at once',
        paragraphs: [
          'Threads share memory inside one process; they are a good fit for blocking I/O such as network calls and file reads. Processes have separate memory; they sidestep the GIL for CPU-bound work at the cost of serialising data between them (multiprocessing, ProcessPoolExecutor). asyncio runs many coroutines on one thread, switching only at await points; it excels at thousands of concurrent network connections with low overhead, but one blocking call stalls everything.',
          'Rule of thumb: I/O-bound and many connections → asyncio (or threads); I/O-bound with blocking libraries → threads; CPU-bound → processes (or free-threaded Python, carefully). Always measure before choosing.',
        ],
        code: `import asyncio, time

async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)          # stands in for a network call
    return name

async def main():
    start = time.perf_counter()
    async with asyncio.timeout(2):      # Python 3.11+: cancel everything after 2 s
        results = await asyncio.gather(fetch("a", 0.5), fetch("b", 0.5), fetch("c", 0.5))
    print(results, f"{time.perf_counter() - start:.2f}s")   # ['a', 'b', 'c'] ~0.50s, not 1.5s

asyncio.run(main())`,
        label: 'Concurrent I/O with asyncio and a timeout',
      },
      {
        title: 'The GIL and free-threaded Python',
        paragraphs: [
          'In standard CPython, the GIL lets only one thread run Python bytecode at a time, so threads do not speed up pure-Python CPU work (I/O still overlaps because blocking calls release the GIL). Python 3.13 introduced an experimental free-threaded build, and Python 3.14 made it officially supported (but still optional). Without the GIL, threads can run Python code in parallel — and code that accidentally relied on the GIL for safety can now show races that were previously rare. Thread-safety must be designed, not assumed.',
        ],
      },
      {
        title: 'Race conditions and critical sections',
        paragraphs: [
          'counter += 1 is a read, an add and a write. Two threads can both read 41 and both write 42. Protect shared mutable state with a lock around the critical section, keep critical sections short, never call slow or unknown code while holding a lock, and prefer designs that avoid sharing: give each worker its own data and combine results at the end, or pass messages through a queue.Queue.',
        ],
        code: `import threading

class Account:
    def __init__(self, balance: int):
        self.balance = balance
        self.lock = threading.Lock()

def transfer(a: "Account", b: "Account", amount: int, a_id: int, b_id: int):
    # Deadlock prevention: always lock in a global order (here: by id),
    # never "my account first, then theirs".
    first, second = (a, b) if a_id < b_id else (b, a)
    with first.lock, second.lock:
        if a.balance < amount:
            raise ValueError("insufficient funds")
        a.balance -= amount
        b.balance += amount`,
        label: 'Locks taken in a global order',
      },
      {
        title: 'Deadlocks: why lock order matters',
        paragraphs: [
          'Thread 1 locks account A then waits for B; thread 2 locks B then waits for A. Neither can proceed — a deadlock. The standard prevention is a global lock order: every code path that needs several locks takes them in the same order. The Linux kernel enforces this with lockdep, which records the order in which locks are acquired and warns the moment two code paths acquire the same pair in opposite orders — before a real deadlock ever happens. You build a small version of that tool in this lesson\'s tasks. Timeouts on lock acquisition are a safety net, not a fix.',
        ],
      },
      {
        title: 'Optimistic concurrency: compare-and-set',
        paragraphs: [
          'Distributed stores rarely offer cross-machine locks. Instead they offer compare-and-set (CAS): "write version 8 only if the current version is still 7". The client loop reads, computes, attempts CAS, and on conflict re-reads and retries — with a bounded number of attempts so contention cannot spin forever. etcd, DynamoDB conditional writes and the database version column from Lesson 17 all use this idea.',
        ],
      },
    ],
    table: {
      headers: ['Workload', 'Good fit', 'Watch out for'],
      rows: [
        ['Many network connections', 'asyncio', 'A single blocking call stalls the loop'],
        ['Blocking I/O libraries', 'Thread pool', 'Shared mutable state; GIL limits CPU work'],
        ['CPU-heavy pure Python', 'Process pool (or free-threaded 3.14)', 'Serialisation cost; real races without the GIL'],
        ['Shared counters/state', 'Locks, atomic ops, or no sharing', 'Long critical sections, lock-order inversions'],
        ['Distributed updates', 'Compare-and-set with bounded retries', 'Retry storms under contention'],
      ],
    },
    exercise: {
      scenario: 'A ticket-booking service occasionally sells the same seat twice during flash sales and, rarely, freezes completely until restarted. It uses threads; booking checks "seat free?" then writes "seat taken", and the transfer-between-events feature locks the source event then the destination event.',
      task: 'Diagnose both problems and propose fixes that also work when the service runs on several machines.',
      answer: 'Double booking is a check-then-act race: two threads see the seat free before either writes. Make the check and write atomic in the database: a unique constraint on (event_id, seat_id) for bookings or a conditional UPDATE … WHERE seat_status = \'free\' and treat zero affected rows as "already taken" — this works across machines, unlike an in-process lock. The freeze is a deadlock: two transfers lock events in opposite orders. Always lock events in a global order (by event id), or avoid holding two locks by using a single transaction with conditional updates. Add a lock-order checker in tests and timeouts plus alerts as a safety net.',
      evidence: 'Naming check-then-act and lock-order inversion, fixing races at the database so they hold across machines, and a global lock order for deadlocks.',
    },
    misconceptions: [
      'The GIL makes Python code thread-safe. It never protected multi-step operations, and free-threaded builds remove it entirely.',
      'asyncio makes code run in parallel. It interleaves tasks on one thread; CPU work still blocks the loop.',
      'Adding more locks makes code safer. Locks taken in inconsistent orders cause deadlocks.',
      'If tests pass, there is no race. Races depend on timing; design for safety rather than relying on tests to expose them.',
    ],
    sources: [S.asyncio, S.freeThreading, S.ddia, S.sweGoogle],
    labs: [],
    quiz: [
      { question: 'Which model best suits thousands of concurrent network connections?', options: ['Process pool', 'asyncio', 'A single blocking loop', 'Busy waiting'], answer: 1, explanation: 'Cooperative coroutines handle many I/O waits cheaply.' },
      { question: 'What does Python 3.14 officially support that changes thread behaviour?', options: ['Removing the GIL in the free-threaded build', 'Automatic deadlock detection', 'Async-only code', 'Shared memory processes by default'], answer: 0, explanation: 'Free-threaded builds let threads run Python code in parallel.' },
      { question: 'How do you prevent the A-then-B / B-then-A deadlock?', options: ['Use more threads', 'Acquire locks in one global order everywhere', 'Remove all locks', 'Sleep before locking'], answer: 1, explanation: 'Consistent ordering makes circular waits impossible.' },
      { question: 'A compare-and-set fails. What should the client do?', options: ['Overwrite anyway', 'Re-read, recompute and retry a bounded number of times', 'Crash immediately', 'Retry forever without re-reading'], answer: 1, explanation: 'Someone else changed the value; base the next attempt on fresh data.' },
      { question: 'Why does counter += 1 race between threads?', options: ['It is not valid Python', 'It is a separate read, add and write', 'Integers are immutable', 'Threads cannot read variables'], answer: 1, explanation: 'Interleaved reads lose increments.' },
    ],
  },
  {
    id: 'swe-19',
    slug: 'distributed-systems',
    title: 'Distributed Systems: Timeouts, Retries, Breakers & Queues',
    summary: 'The fallacies of distributed computing, retries with exponential backoff and jitter, circuit breakers, CAP trade-offs, queues and the transactional outbox.',
    minutes: 25,
    prerequisite: 'Lessons 17–18 and Module 4 Lesson 16 (idempotency).',
    outcomes: [
      'Name the fallacies of distributed computing and design for partial failure.',
      'Implement timeouts, bounded retries with exponential backoff and full jitter, and circuit breakers.',
      'Explain consistency trade-offs (CAP/PACELC) in plain language for a real feature.',
      'Use message queues with at-least-once delivery, idempotent consumers and a transactional outbox.',
    ],
    introduction:
      'The moment your program talks to another program over a network, you are building a distributed system — and the network will fail in ways a function call never does: slowly, partially and ambiguously. Peter Deutsch\'s "fallacies of distributed computing" (the network is reliable, latency is zero, bandwidth is infinite…) describe the assumptions that cause outages. This lesson covers the patterns Amazon, Google and Netflix rely on to stay up when their dependencies do not.',
    keyTerms: [
      { term: 'Partial failure', meaning: 'Some components fail while others keep working, often with no clear signal which.' },
      { term: 'Exponential backoff with jitter', meaning: 'Retry delays that grow exponentially and are randomised so clients do not retry in lockstep.' },
      { term: 'Circuit breaker', meaning: 'Stops calling a failing dependency for a while, then probes carefully before resuming.' },
      { term: 'At-least-once delivery', meaning: 'A message may be delivered more than once, so consumers must be idempotent.' },
      { term: 'Transactional outbox', meaning: 'Write the event to an outbox table in the same transaction as the data change, then publish it asynchronously.' },
    ],
    sections: [
      {
        title: 'Design for partial failure',
        paragraphs: [
          'A remote call has three outcomes, not two: success, failure, and "unknown" — the request may have been processed even though you got a timeout. Every remote call needs a timeout (no timeout means a slow dependency can exhaust your threads or connections), and every caller must decide what to do when the outcome is unknown. This is why idempotency keys (Module 4) matter: they make "just retry" safe.',
        ],
      },
      {
        title: 'Retries, backoff and jitter',
        paragraphs: [
          'Retry only failures that are likely transient (timeouts, 503, 429 with Retry-After), only for idempotent operations, and only a few times. Space retries with exponential backoff (base × 2^attempt, capped) and add jitter — the Amazon Builders\' Library shows that "full jitter" (a random delay between 0 and the exponential value) spreads retries out and avoids synchronised waves that hammer a recovering service. Retry at one layer only; nested retries multiply (3 × 3 × 3 = 27 calls).',
        ],
        code: `import random, time

def call_with_retries(op, *, attempts=4, base=0.1, cap=2.0,
                      retryable=(TimeoutError, ConnectionError),
                      sleep=time.sleep, rand=random.random):
    for attempt in range(attempts):
        try:
            return op()
        except retryable:
            if attempt == attempts - 1:
                raise                                   # give up: surface the error
            delay = rand() * min(cap, base * 2 ** attempt)   # full jitter
            sleep(delay)`,
        label: 'Bounded retries with exponential backoff and full jitter',
      },
      {
        title: 'Circuit breakers',
        paragraphs: [
          'When a dependency is down, retrying every request makes things worse for everyone. A circuit breaker tracks failures: after N consecutive failures it opens and fails fast (or serves a fallback) without calling the dependency; after a cool-down it goes half-open and lets a trial request through; success closes it, failure opens it again. Breakers protect your threads and give the dependency room to recover.',
        ],
      },
      {
        title: 'Consistency trade-offs in plain language',
        paragraphs: [
          'CAP says that during a network partition a replicated system must choose between consistency (every read sees the latest write) and availability (every request gets a response). PACELC adds that even without partitions you trade latency against consistency. Translate this into product decisions: a bank balance shown before a transfer needs strong consistency; a "likes" counter can be eventually consistent. Make the choice per feature, document it, and tell users when data may be stale.',
        ],
      },
      {
        title: 'Queues, idempotent consumers and the outbox',
        paragraphs: [
          'Message queues decouple producers from consumers and absorb spikes. Most offer at-least-once delivery, so consumers must be idempotent: record processed message IDs, or make the effect naturally idempotent (set status = paid rather than add 1). A classic bug is the dual write: "commit order, then publish OrderPlaced" — if the process crashes in between, the event is lost; if you publish first, the event may describe an order that rolled back. The transactional outbox fixes it: insert the event into an outbox table in the same database transaction as the order, and let a relay publish outbox rows and mark them sent.',
        ],
      },
    ],
    table: {
      headers: ['Pattern', 'Protects against', 'Key setting'],
      rows: [
        ['Timeout', 'Slow dependencies exhausting resources', 'A deadline shorter than the caller\'s own'],
        ['Retry + backoff + jitter', 'Transient failures, thundering herds', 'Max attempts, cap, idempotent ops only'],
        ['Circuit breaker', 'Cascading failure into a sick dependency', 'Failure threshold and cool-down'],
        ['Idempotent consumer', 'Duplicate deliveries', 'Processed-ID store or naturally idempotent writes'],
        ['Transactional outbox', 'Lost or phantom events from dual writes', 'Outbox row in the same transaction'],
      ],
    },
    exercise: {
      scenario: 'Checkout calls a fraud-check service with no timeout and retries 5 times immediately; the payment service also retries fraud-check 3 times. During a fraud-service slowdown, checkout threads pile up and the whole site goes down. Separately, some orders never trigger their confirmation email.',
      task: 'Explain the outage and the missing emails, and redesign both flows.',
      answer: 'Without timeouts, slow fraud calls hold threads until the pool is exhausted; nested immediate retries (up to 15 calls per checkout) amplify load on the struggling service — a retry storm causing a cascading failure. Fix: a timeout below checkout\'s own deadline, retries at one layer only (max 2–3, exponential backoff with full jitter), and a circuit breaker that opens after repeated failures and falls back to a documented policy (for example, hold the order for manual review). The missing emails come from a dual write: the order commits but the process can crash before publishing the event. Use a transactional outbox so the event is stored with the order, a relay publishes it, and the email consumer is idempotent by order id so redeliveries do not send duplicates.',
      evidence: 'Identifying missing timeouts and multiplicative retries, adding breaker plus fallback, and solving dual writes with an outbox and idempotent consumers.',
    },
    misconceptions: [
      'Retries make systems more reliable. Unbounded or nested retries turn small blips into outages.',
      'A timeout means the request did not happen. The outcome is unknown; design for it with idempotency.',
      'Exactly-once delivery is easy to get from a queue. Practical systems give at-least-once; consumers dedupe.',
      'Eventual consistency means "eventually correct, so ignore it". It changes what users can see and must be designed per feature.',
    ],
    sources: [S.backoff, S.ddia, S.sreBook, S.sweGoogle],
    labs: [],
    quiz: [
      { question: 'What is "full jitter" in retry backoff?', options: ['No delay between retries', 'A random delay between 0 and the exponential backoff value', 'Always waiting the maximum', 'Retrying on every core'], answer: 1, explanation: 'Randomising spreads retries out and avoids synchronised spikes.' },
      { question: 'A circuit breaker is "open". What happens to new calls?', options: ['They are sent twice', 'They fail fast or use a fallback without calling the dependency', 'They wait forever', 'They bypass authentication'], answer: 1, explanation: 'Open means stop calling while the dependency recovers.' },
      { question: 'Why must queue consumers usually be idempotent?', options: ['Queues are slow', 'Most queues deliver at least once, so duplicates happen', 'It makes code shorter', 'Brokers require it for security'], answer: 1, explanation: 'Redeliveries must not repeat side effects.' },
      { question: 'What problem does the transactional outbox solve?', options: ['Slow queries', 'Lost or phantom events when writing to a database and a broker separately', 'Password storage', 'Cache invalidation'], answer: 1, explanation: 'The event is committed atomically with the data change.' },
      { question: 'Three layers each retry 3 times. How many calls can one request cause?', options: ['3', '9', '27', '6'], answer: 2, explanation: 'Retries multiply across layers: 3 × 3 × 3.' },
    ],
  },
  {
    id: 'swe-20',
    slug: 'performance-engineering',
    title: 'Performance Engineering: Measure, Cache, Batch & Percentiles',
    summary: 'Profile before optimising, reason with complexity, cache with correct invalidation, batch round trips, and judge latency with percentiles and SLOs.',
    minutes: 24,
    prerequisite: 'Lessons 17–19 and Big-O (Programming: Data Structures & Algorithms).',
    outcomes: [
      'Follow a measure–hypothesise–change–measure loop with profilers and benchmarks.',
      'Use latency percentiles (p50, p95, p99) and SLOs instead of averages.',
      'Design caches with TTLs, size bounds and an invalidation strategy.',
      'Apply Little\'s law and batching to reason about throughput and capacity.',
    ],
    introduction:
      '"Premature optimisation is the root of all evil" — the full Knuth quote continues: "yet we should not pass up our opportunities in that critical 3%." Performance engineering is about finding that 3% with measurements, fixing it with the right tool (a better algorithm, fewer round trips, a cache), and proving the improvement. It also means describing speed the way users experience it: in percentiles, not averages.',
    keyTerms: [
      { term: 'Profiler', meaning: 'A tool that measures where a program spends its time (cProfile) or memory.' },
      { term: 'Percentile latency', meaning: 'The latency under which a given share of requests complete, e.g. p95 = 95% are faster.' },
      { term: 'SLO', meaning: 'Service Level Objective: a target such as "99% of searches under 300 ms over 28 days".' },
      { term: 'Cache invalidation', meaning: 'Removing or updating cached data when the source changes so readers do not see stale values.' },
      { term: 'Little\'s law', meaning: 'Average items in a system = arrival rate × average time in the system (L = λW).' },
    ],
    sections: [
      {
        title: 'Measure first',
        paragraphs: [
          'Intuition about performance is usually wrong. Reproduce the slowness with realistic data, profile it (python -m cProfile -s cumtime app.py, or a sampling profiler such as py-spy for production), form one hypothesis, change one thing, and measure again with a repeatable benchmark (timeit, pytest-benchmark). Keep the benchmark as a regression test so the improvement is not silently undone.',
        ],
        code: `import cProfile, pstats, io

def slow_report(rows):
    out = ""
    for r in rows:                     # quadratic: strings are immutable
        out += f"{r['id']},{r['total']}\\n"
    return out

rows = [{"id": i, "total": i * 3} for i in range(50_000)]
prof = cProfile.Profile()
prof.enable(); slow_report(rows); prof.disable()
s = io.StringIO(); pstats.Stats(prof, stream=s).sort_stats("cumtime").print_stats(5)
print(s.getvalue())
# Fix: "\\n".join(f"{r['id']},{r['total']}" for r in rows)  -> linear`,
        label: 'Profiling before fixing',
      },
      {
        title: 'Percentiles, not averages',
        paragraphs: [
          'An average of 120 ms can hide that 1 in 20 users waits 3 seconds. Report p50 (typical experience), p95 and p99 (the tail that angry users feel). With many backend calls per page, tail latency compounds: if a page makes 10 calls and each has a 1% chance of being slow, about 10% of page loads hit at least one slow call. Set SLOs on percentiles over a time window, and alert on burning through the error budget (Module 6).',
        ],
      },
      {
        title: 'Caching correctly',
        paragraphs: [
          'A cache trades freshness and memory for speed. Every cache needs three decisions: a size bound with an eviction policy (LRU keeps the recently used items), an expiry (TTL) that matches how stale data may be, and an invalidation strategy for writes (delete or update the cached entry when the source changes). Cache keys must include everything that affects the result — including the user or tenant, or you will serve one customer\'s data to another. Measure hit rate; a cache with a 5% hit rate is just complexity.',
        ],
      },
      {
        title: 'Batching and round trips',
        paragraphs: [
          'Network round trips usually cost far more than computation. Batch them: one query with IN (…) instead of N queries (Lesson 17), bulk inserts, pipelined Redis commands, a single API call that accepts many IDs. The same principle applies to I/O: buffered writes beat many tiny ones.',
        ],
      },
      {
        title: 'Capacity with Little\'s law',
        paragraphs: [
          'Little\'s law, L = λW, connects concurrency, throughput and latency for any stable system. If requests arrive at 200 per second and each takes 0.25 s, about 50 are in flight at once — so a pool of 20 workers will queue and latency will climb. It also explains why slowness spreads: when a dependency doubles its latency, the number of in-flight requests (threads, connections, memory) doubles too.',
        ],
      },
    ],
    table: {
      headers: ['Symptom', 'First tool', 'Typical fix'],
      rows: [
        ['Slow function', 'cProfile / py-spy', 'Better algorithm or data structure'],
        ['Slow page with many queries', 'Query count + EXPLAIN', 'Batch queries, add the right index'],
        ['Good average, angry users', 'p95/p99 latency histogram', 'Fix the tail: timeouts, slow dependency, GC'],
        ['Repeated expensive reads', 'Hit-rate measurement', 'Bounded cache with TTL and invalidation'],
        ['Queueing under load', 'Little\'s law, in-flight metrics', 'More capacity, lower latency, or backpressure'],
      ],
    },
    exercise: {
      scenario: 'The product team says "search is fast — average 140 ms". Support says users complain constantly. Each search calls the catalogue service, then the pricing service once per result (20 results), with a 2-second timeout and no caching. Traffic is 100 searches per second.',
      task: 'Explain the disconnect, quantify the concurrency, and propose a plan with measurements.',
      answer: 'Averages hide the tail; report p50/p95/p99 — p99 is likely seconds because 21 sequential calls compound tail latency. With λ = 100/s and, say, W = 1.5 s at the tail, L = 150 searches in flight, so worker pools and connections saturate. Plan: measure percentiles and per-call timing; batch the 20 pricing calls into one request (or fetch prices concurrently with a shared deadline); add a bounded, short-TTL cache for prices keyed by product and currency with invalidation on price updates; lower the pricing timeout below the search deadline and add a fallback. Set an SLO such as 99% under 400 ms, and keep a benchmark in CI.',
      evidence: 'Percentiles over averages, Little\'s law with numbers, batching N calls, a correctly keyed bounded cache, and an SLO with ongoing measurement.',
    },
    misconceptions: [
      'Averages describe user experience. Tails (p95/p99) are what users remember and complain about.',
      'Caching always helps. Without bounds, TTLs, correct keys and invalidation, caches cause stale or leaked data.',
      'Optimise the code you suspect. Profile first — the hot spot is usually elsewhere.',
      'More threads always increase throughput. Past a point, contention and queueing increase latency instead.',
    ],
    sources: [S.profilers, S.sreBook, S.ddia, S.backoff],
    labs: [],
    quiz: [
      { question: 'Why report p95/p99 rather than only the average?', options: ['They are easier to compute', 'Averages hide slow tails that many users experience', 'Averages are always wrong', 'Percentiles include errors only'], answer: 1, explanation: 'Tail latency drives user frustration and compounds across calls.' },
      { question: 'Little\'s law: 50 req/s, each taking 0.2 s. How many in flight on average?', options: ['10', '250', '0.25', '50'], answer: 0, explanation: 'L = λW = 50 × 0.2 = 10.' },
      { question: 'Which is essential in a per-user cache key?', options: ['The server name', 'The user or tenant identity', 'The current time in ms', 'Nothing beyond the URL'], answer: 1, explanation: 'Otherwise one user\'s data can be served to another.' },
      { question: 'What should you do before optimising a slow function?', options: ['Rewrite it in C', 'Profile it with realistic data', 'Add caching everywhere', 'Add more threads'], answer: 1, explanation: 'Measurement finds the real hot spot.' },
      { question: 'Replacing 20 sequential API calls with one batched call mainly reduces what?', options: ['Code size', 'Network round trips and their latency', 'Memory leaks', 'Security risk'], answer: 1, explanation: 'Round trips dominate latency; batching removes most of them.' },
    ],
  },
];
