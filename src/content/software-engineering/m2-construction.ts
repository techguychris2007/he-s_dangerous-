import type { CurriculumLesson } from '../curriculumDefinition';
import { SE_SOURCES as S } from './sources';

/** Module 2 — software construction (SWEBOK V4: Construction, Design; MIT 6.102 core ideas). */
export const SE_MODULE_2: CurriculumLesson[] = [
  {
    id: 'swe-5',
    slug: 'specifications-and-contracts',
    title: 'Specifications & Contracts: Saying Exactly What Code Does',
    summary: 'Preconditions, postconditions, stronger and weaker specs, type hints as partial specifications, and checking contracts at runtime.',
    minutes: 24,
    prerequisite: 'Python functions, type hints and exceptions (Code Portal: Python Fundamentals).',
    outcomes: [
      'Write a function specification with a precondition, a postcondition and its behaviour on invalid input.',
      'Compare two specifications and decide which is stronger, and why that matters for callers and implementers.',
      'Use type hints and a static checker as a machine-verified part of a spec.',
      'Choose between documenting, asserting and validating a precondition.',
    ],
    introduction:
      'A specification is a contract between the code that calls a function and the code that implements it. It lets two people — or the same person six months apart — work independently: the caller relies only on the spec, the implementer is free to change anything the spec does not promise. MIT\'s Software Construction course calls specs "the linchpin of teamwork". Most bugs in large systems are not typos; they are disagreements about what a function was supposed to do.',
    keyTerms: [
      { term: 'Precondition', meaning: 'An obligation on the caller: what must be true of the inputs and state before calling.' },
      { term: 'Postcondition', meaning: 'An obligation on the implementer: what will be true of the result and state afterwards, if the precondition held.' },
      { term: 'Stronger spec', meaning: 'A spec with a weaker (or equal) precondition and a stronger (or equal) postcondition. It can safely replace the weaker one.' },
      { term: 'Deterministic spec', meaning: 'For every valid input there is exactly one allowed output. Underdetermined specs allow several.' },
      { term: 'Defensive check', meaning: 'Code that verifies a precondition and fails fast with a clear error when the caller breaks the contract.' },
    ],
    sections: [
      {
        title: 'Anatomy of a specification',
        paragraphs: [
          'A good spec answers four questions: what may callers pass (types and preconditions), what will they get back (postcondition), what side effects happen (mutation, I/O), and what happens on bad input (which exception). It describes behaviour, never implementation: "returns the index of target" is a spec; "uses binary search" is an implementation detail — unless performance is part of the contract, in which case say "O(log n)".',
        ],
        code: `def find_first(items: list[int], target: int) -> int:
    """Return the index of the first occurrence of target in items.

    Requires: items is sorted in non-decreasing order.
    Effects:  returns the smallest i with items[i] == target;
              raises ValueError if target does not occur.
    Does not modify items.  Runs in O(log n) time.
    """
    lo, hi = 0, len(items)
    while lo < hi:
        mid = (lo + hi) // 2
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    if lo < len(items) and items[lo] == target:
        return lo
    raise ValueError(f"{target} not found")`,
        label: 'A complete specification in a docstring',
      },
      {
        title: 'Stronger and weaker specifications',
        paragraphs: [
          'Spec B is stronger than spec A if B\'s precondition is no stricter than A\'s and, for every input A accepts, B\'s postcondition promises at least as much. A stronger spec is a safe replacement: every caller of A still works with B. That is how you evolve an API without breaking callers — loosen preconditions, tighten postconditions, never the reverse.',
          'Compare three specs for find: (1) requires target to be present, returns any index where it occurs; (2) target may be absent (then raises ValueError), returns any index; (3) target may be absent, returns the lowest index. Each is stronger than the previous one. But stronger is not automatically better: very strong specs are harder to implement efficiently and harder to change later. Promise what callers need, no more.',
        ],
      },
      {
        title: 'Types are a machine-checked part of the spec',
        paragraphs: [
          'Type hints move part of the precondition into something tools can verify before the code ever runs. With mypy or pyright in CI, passing a str where a list[int] is required becomes a build failure instead of a 2 a.m. incident. Use precise types: Literal["asc", "desc"] instead of str, Sequence[int] when you only read, a TypedDict or dataclass instead of a bare dict, and Optional only when None is genuinely valid.',
          'Types cannot express everything ("sorted", "non-empty", "a valid email"). For those, either create a type that can only hold valid values (a NewType or small class built by a validating constructor — "parse, don\'t validate") or document and check them.',
        ],
        code: `from dataclasses import dataclass
from typing import Literal, Sequence

SortOrder = Literal["asc", "desc"]

@dataclass(frozen=True)
class EmailAddress:
    value: str
    def __post_init__(self):
        local, sep, domain = self.value.partition("@")
        if not (local and sep and "." in domain):
            raise ValueError(f"invalid email: {self.value!r}")

def top_scores(scores: Sequence[int], n: int, order: SortOrder = "desc") -> list[int]:
    return sorted(scores, reverse=(order == "desc"))[:n]

def send_welcome(to: EmailAddress) -> None:   # cannot be called with an unchecked str
    ...`,
        label: 'Encoding preconditions in types',
      },
      {
        title: 'Document, assert or validate?',
        paragraphs: [
          'At a trust boundary — user input, network data, files, another team\'s service — always validate and reject bad data with a clear, typed error. Inside your own module, between functions you control, a documented precondition is often enough, optionally backed by an assert that catches your own bugs during development and testing.',
          'Never use assert for security or input validation: Python removes assert statements when run with -O. And never let a broken precondition produce silently wrong results — failing fast, close to the cause, makes bugs cheap to find.',
        ],
        code: `def transfer(src: "Account", dst: "Account", cents: int) -> None:
    # Trust boundary: amount comes from a request -> validate, always.
    if cents <= 0:
        raise ValueError("amount must be positive")
    if src.id == dst.id:
        raise ValueError("cannot transfer to the same account")
    before = src.balance + dst.balance
    src.withdraw(cents)
    dst.deposit(cents)
    # Internal invariant: money is neither created nor destroyed.
    assert src.balance + dst.balance == before, "transfer changed total money"`,
        label: 'Validation at the boundary, assertion for internal invariants',
      },
      {
        title: 'Specs make testing and review possible',
        paragraphs: [
          'You cannot test code without a spec — you can only test that it does what it does. The spec tells you which inputs are valid (so you know what to test), which outputs are acceptable, and where the boundaries are. Module 3 builds test suites directly from specs by partitioning the input space. In code review, the first question is "is the spec right?", the second "does the code meet it?".',
        ],
      },
    ],
    table: {
      headers: ['Element', 'Owned by', 'Example'],
      rows: [
        ['Precondition', 'Caller must satisfy', 'items is sorted; n >= 0'],
        ['Postcondition', 'Implementer must guarantee', 'returns the smallest matching index'],
        ['Side effects', 'Implementer must declare', 'does not modify items; writes one log line'],
        ['Error behaviour', 'Implementer must declare', 'raises ValueError when target is absent'],
        ['Performance', 'Part of spec only when promised', 'O(log n); at most one network call'],
      ],
    },
    exercise: {
      scenario: 'A teammate wrote: def average(xs): "Returns the average." Callers pass lists of floats, sometimes empty, sometimes containing None from missing sensor readings.',
      task: 'Write a precise spec (types, precondition, postcondition, error behaviour). Then propose a stronger spec that handles more inputs and explain whether you would adopt it.',
      answer: 'Spec: average(xs: Sequence[float]) -> float. Requires: xs is non-empty and contains no None. Effects: returns sum(xs) / len(xs); raises ValueError("empty input") if xs is empty. A stronger spec weakens the precondition: average(xs: Sequence[float | None]) -> float | None — ignores None values and returns None if no numeric values remain. It is safe for existing callers (they never passed None, and the empty case now returns None instead of raising — which is NOT backward-compatible for callers who caught ValueError). So either keep raising on empty input to remain strictly stronger, or ship the change as a new function (mean_of_present) and leave average alone.',
      evidence: 'Explicit types, precondition and error case; recognising that changing an error into a return value can break callers even when the new spec looks "more helpful".',
    },
    misconceptions: [
      'The code is the spec. Then every bug is a feature and no change is ever safe.',
      'A stronger spec is always better. It is harder to implement and constrains future change; promise only what callers need.',
      'assert is a good way to validate user input. Asserts can be disabled with -O and produce unhelpful errors.',
      'Type hints slow Python down. They are ignored at runtime; their value is in tools that check them before you run.',
    ],
    sources: [S.mit6102, S.pythonTyping, S.sweGoogle],
    labs: [],
    quiz: [
      { question: 'Who is responsible for making the precondition true?', options: ['The implementer', 'The caller', 'The test suite', 'The compiler'], answer: 1, explanation: 'Preconditions are obligations on the caller; postconditions are obligations on the implementer.' },
      { question: 'Which change makes a spec stronger (safe for existing callers)?', options: ['Requiring an extra argument', 'Accepting more inputs and promising more about the result', 'Raising on inputs that used to be accepted', 'Returning fewer guarantees'], answer: 1, explanation: 'Weaker precondition plus stronger postcondition is a safe replacement.' },
      { question: 'Why must you not rely on assert for validating request data?', options: ['assert is slow', 'Python strips asserts when run with -O', 'assert only works on integers', 'assert cannot raise exceptions'], answer: 1, explanation: 'Optimised runs remove asserts entirely, silently disabling the check.' },
      { question: '"Parse, don\'t validate" suggests…', options: ['Never checking input', 'Converting input once into a type that can only hold valid values', 'Using regular expressions everywhere', 'Validating the same data in every function'], answer: 1, explanation: 'A validated type carries the guarantee forward so later code cannot receive bad data.' },
      { question: 'Should "uses binary search" be part of a spec?', options: ['Always', 'Only as a performance promise such as O(log n), if callers need it', 'Never mention performance', 'Only in comments inside the function'], answer: 1, explanation: 'Specs describe behaviour; algorithms are implementation details unless a complexity bound is promised.' },
    ],
  },
  {
    id: 'swe-6',
    slug: 'abstract-data-types',
    title: 'Abstract Data Types: Invariants, Immutability & Representation',
    summary: 'Design types whose users cannot break them: representation invariants, abstraction functions, rep exposure and immutable values.',
    minutes: 26,
    prerequisite: 'Lesson 5 and Python classes (Code Portal: Python OOP).',
    outcomes: [
      'Separate what a type means (its operations) from how it is stored (its representation).',
      'Write a representation invariant and an abstraction function, and enforce the invariant with checkRep.',
      'Find and fix representation exposure caused by returning or storing mutable objects.',
      'Prefer immutable value types and explain the bugs they prevent.',
    ],
    introduction:
      'An abstract data type (ADT) is defined by its operations, not its fields. A user of a Fraction type should be able to add, compare and print fractions without knowing — or being able to corrupt — how numerator and denominator are stored. This "representation independence" lets you change the internals later (normalise eagerly instead of lazily, switch a list to a dict) without touching a single caller. It is the most important idea in software construction.',
    keyTerms: [
      { term: 'Representation (rep)', meaning: 'The private fields that store an ADT\'s data.' },
      { term: 'Rep invariant (RI)', meaning: 'The condition every valid rep must satisfy, e.g. "denominator > 0 and gcd(num, den) == 1".' },
      { term: 'Abstraction function (AF)', meaning: 'How a valid rep maps to the abstract value it represents, e.g. "(num, den) represents num/den".' },
      { term: 'Rep exposure', meaning: 'Outside code gaining a reference to a mutable part of the rep, so it can break the invariant without calling any operation.' },
      { term: 'Immutable type', meaning: 'Values never change after construction; "modifying" returns a new value.' },
    ],
    sections: [
      {
        title: 'Operations first: classify them',
        paragraphs: [
          'Design an ADT by listing its operations, grouped the way MIT 6.102 does: creators make new values from scratch (Fraction(1, 2)), producers make new values from existing ones (a + b), observers return information (a.numerator, a < b, str(a)), and mutators change a value in place (list.append). An immutable type has no mutators. Check that every operation is needed and that together they are sufficient — users should never need to reach inside.',
        ],
      },
      {
        title: 'Rep invariant and abstraction function',
        paragraphs: [
          'Write both as a comment at the top of the class. The rep invariant says which reps are legal; the abstraction function says what a legal rep means. Then write a private _check_rep() that asserts the invariant and call it at the end of every creator, producer and mutator. Bugs that would surface far away ("why is this fraction 2/0?") now fail immediately where they were introduced.',
        ],
        code: `from math import gcd

class Fraction:
    """An immutable rational number."""
    # Rep: _num: int, _den: int
    # RI:  _den > 0 and gcd(_num, _den) == 1
    # AF:  represents the rational number _num / _den
    # Safety from rep exposure: fields are ints (immutable) and never reassigned.

    __slots__ = ("_num", "_den")

    def __init__(self, num: int, den: int = 1):
        if den == 0:
            raise ZeroDivisionError("denominator must be non-zero")
        sign = -1 if den < 0 else 1
        g = gcd(num, den) or 1
        object.__setattr__(self, "_num", sign * num // g)
        object.__setattr__(self, "_den", abs(den) // g)
        self._check_rep()

    def _check_rep(self):
        assert self._den > 0 and gcd(self._num, self._den) == 1

    def __setattr__(self, name, value):
        raise AttributeError("Fraction is immutable")

    def __add__(self, other: "Fraction") -> "Fraction":     # producer
        return Fraction(self._num * other._den + other._num * self._den, self._den * other._den)

    def __eq__(self, other):                                 # observer
        return isinstance(other, Fraction) and (self._num, self._den) == (other._num, other._den)

    def __hash__(self):
        return hash((self._num, self._den))

    def __repr__(self):
        return f"Fraction({self._num}, {self._den})"

print(Fraction(2, 4) + Fraction(1, -6))   # Fraction(1, 3)
print(Fraction(1, 2) == Fraction(3, 6))  # True - normalised rep makes equality simple`,
        label: 'An ADT with RI, AF and a rep check',
      },
      {
        title: 'Representation exposure',
        paragraphs: [
          'Rep exposure happens when a mutable object is shared between the rep and the outside world. Returning self._items lets callers append to your internals; storing a list passed to the constructor lets the caller mutate it later. Both silently bypass your invariant. The fix is defensive copying (copy in, copy out) or, better, using immutable types (tuple, frozenset, frozen dataclasses) so there is nothing to protect.',
        ],
        code: `class Roster:
    # RI: no duplicate names; names sorted
    def __init__(self, names: list[str]):
        self._names = sorted(set(names))          # copy in (sorted() builds a new list)

    def names(self) -> tuple[str, ...]:
        return tuple(self._names)                 # copy out as an immutable tuple

    def add(self, name: str) -> None:
        if name not in self._names:
            self._names.append(name)
            self._names.sort()

r = Roster(["zoe", "amir"])
leaked = r.names()
# leaked.append("eve")  -> AttributeError: tuples are immutable; the invariant is safe`,
        label: 'Copy in, copy out',
      },
      {
        title: 'Why immutability prevents whole classes of bugs',
        paragraphs: [
          'Immutable values can be shared freely between functions and threads, used as dictionary keys and set members, cached, and reasoned about locally: if you hold a reference, it will not change under you. Mutable shared state, by contrast, is behind aliasing bugs ("I changed my copy and yours changed too") and most concurrency bugs (Module 5). In Python, prefer @dataclass(frozen=True), tuples and frozensets for values; reserve mutation for objects that genuinely model changing state, such as a bank account or a connection.',
          'Python\'s default-argument trap is a classic aliasing bug: def add(item, bucket=[]) shares one list across every call. Use None and create the list inside.',
        ],
        code: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Money:
    cents: int
    currency: str = "GHS"
    def __post_init__(self):
        if self.cents < 0:
            raise ValueError("money cannot be negative")
    def add(self, other: "Money") -> "Money":
        if other.currency != self.currency:
            raise ValueError("currency mismatch")
        return replace(self, cents=self.cents + other.cents)

price = Money(1999)
total = price.add(Money(500))
print(price, total)     # price is unchanged; total is a new value`,
        label: 'An immutable value object',
      },
      {
        title: 'Equality and hashing done right',
        paragraphs: [
          'Two ADT values are equal when their abstract values are equal — not necessarily when their reps are identical. Normalising the rep (as Fraction does) makes this easy. If you define __eq__, you must define a consistent __hash__ (equal objects must have equal hashes), and mutable objects should not be hashable at all, because changing them after insertion into a set or dict makes them unfindable.',
        ],
      },
    ],
    table: {
      headers: ['Operation kind', 'Signature shape', 'Example'],
      rows: [
        ['Creator', 'inputs → T', 'Fraction(1, 2), Roster(names)'],
        ['Producer', 'T, … → T', 'a + b, money.add(other)'],
        ['Observer', 'T, … → other type', 'len(roster), a == b, str(a)'],
        ['Mutator', 'T, … → None (changes T)', 'roster.add(name), list.append(x)'],
      ],
    },
    exercise: {
      scenario: 'A Schedule class stores self.slots = slots (a list of (start, end) tuples passed in) and exposes get_slots() returning self.slots. Its documentation says slots never overlap.',
      task: 'Write the rep invariant and abstraction function, identify every rep exposure, and fix them.',
      answer: 'RI: slots is a list of (start, end) with start < end for every slot, sorted by start, and slots[i].end <= slots[i+1].start (no overlaps). AF: represents the set of booked time intervals [start, end). Exposures: (1) the constructor stores the caller\'s list, so the caller can later append an overlapping slot; (2) get_slots returns the internal list, so any caller can mutate it. Fixes: copy and validate in the constructor (self._slots = sorted(slots) then check the RI), return tuple(self._slots) from the observer, provide a book(start, end) mutator that checks for overlap, and call _check_rep() after construction and every mutation. Better still, store a tuple and make Schedule immutable, with book() returning a new Schedule.',
      evidence: 'A precise RI including ordering and non-overlap, both exposure routes (aliasing in and out), and fixes using copies or immutability plus a rep check.',
    },
    misconceptions: [
      'Making fields "private" with an underscore protects the invariant. Python does not enforce it, and returning a mutable field leaks it anyway.',
      'Getters and setters for every field make a good ADT. They expose the rep; design operations around what users need to do.',
      'Immutable objects are wasteful. Sharing becomes free and many defensive copies disappear; the safety usually outweighs the allocations.',
      'If two objects have the same fields they are the same object. Equality is about abstract values; identity (is) is about the same object in memory.',
    ],
    sources: [S.mit6102, S.pythonTyping, S.ddia],
    labs: [],
    quiz: [
      { question: 'What does a rep invariant describe?', options: ['How fast operations run', 'Which internal representations are valid', 'Which users may call the type', 'The public method names'], answer: 1, explanation: 'The RI defines the legal states of the internal fields.' },
      { question: 'A method returns self._items, a list. What is the problem?', options: ['Lists are slow', 'Rep exposure: callers can mutate the internal list and break the invariant', 'Lists cannot be returned', 'It violates PEP 8'], answer: 1, explanation: 'Return an immutable view or copy instead.' },
      { question: 'Which operation is a producer?', options: ['len(bag)', 'Fraction(1, 2)', 'a + b returning a new Fraction', 'bag.add(x) returning None'], answer: 2, explanation: 'Producers create new values from existing values of the type.' },
      { question: 'Why should mutable objects generally not be hashable?', options: ['Hashing is slow', 'If they change after insertion into a set or dict they can no longer be found', 'Python forbids it', 'They use too much memory'], answer: 1, explanation: 'The hash would change, placing the object in the wrong bucket.' },
      { question: 'What is the bug in def add(item, bucket=[]): bucket.append(item); return bucket?', options: ['Syntax error', 'The same default list is shared across all calls', 'append is not allowed in functions', 'It returns None'], answer: 1, explanation: 'Default values are evaluated once; use bucket=None and create a new list.' },
    ],
  },
  {
    id: 'swe-7',
    slug: 'error-handling-and-failure',
    title: 'Error Handling: Failing Fast, Failing Safely',
    summary: 'Exceptions vs. return values, designing an error hierarchy, chaining causes, cleaning up, and failing closed (OWASP A10:2025).',
    minutes: 23,
    prerequisite: 'Lesson 5 and Python try/except.',
    outcomes: [
      'Decide when to raise an exception, return a result value, or retry.',
      'Design a small exception hierarchy and chain low-level causes with raise … from.',
      'Guarantee cleanup with context managers and finally.',
      'Fail closed on security decisions and avoid leaking internals in error messages.',
    ],
    introduction:
      'Every real program meets disk-full errors, timeouts, malformed input and bugs in other people\'s code. How it behaves then decides whether an incident is a log line or a breach. OWASP\'s Top 10:2025 added a whole category — A10, Mishandling of Exceptional Conditions — for failures such as swallowing errors, failing open and leaking stack traces. This lesson turns error handling from an afterthought into a design decision.',
    keyTerms: [
      { term: 'Fail fast', meaning: 'Detect a problem as early as possible and stop, instead of continuing with corrupt state.' },
      { term: 'Fail closed (secure)', meaning: 'When a security check cannot complete, deny access rather than allow it.' },
      { term: 'Exception chaining', meaning: 'raise NewError(...) from original — keeps the root cause attached for debugging.' },
      { term: 'Recoverable vs. programmer error', meaning: 'Recoverable: expected situations the caller can handle (file missing). Programmer error: a bug (index out of range) that should crash loudly in development.' },
      { term: 'Idempotent', meaning: 'Doing an operation twice has the same effect as once — a precondition for safe retries.' },
    ],
    sections: [
      {
        title: 'Raise, return or retry?',
        paragraphs: [
          'Raise an exception when the function cannot fulfil its postcondition and the immediate caller is unlikely to handle it at that point (a missing configuration file at start-up). Return a value that encodes absence or failure when it is a normal, expected outcome the caller must consider (dict.get returning None, a parse that may legitimately find nothing). Retry only transient failures (timeouts, 503s), only idempotent operations, with a limit and backoff (Module 5).',
          'Never return special sentinel values that look like valid data (-1 for "not found" in an API where -1 is a valid balance). That is how errors silently become wrong answers.',
        ],
      },
      {
        title: 'Design an exception hierarchy',
        paragraphs: [
          'Give your library or service its own base exception and a few specific subclasses that reflect what callers can do differently: NotFound, Conflict, ValidationError, PermissionDenied. Callers can catch the base class to handle "anything from this library" or a subclass for precise handling. Wrap low-level exceptions (KeyError, sqlite3.IntegrityError) at your module boundary so your callers do not depend on your internals — and chain them with from so the root cause is not lost.',
        ],
        code: `class ConfigError(Exception):
    """Base class for configuration problems."""

class MissingSetting(ConfigError):
    pass

class InvalidSetting(ConfigError):
    def __init__(self, key: str, value: str, reason: str):
        super().__init__(f"{key}={value!r}: {reason}")
        self.key = key

def port_from(settings: dict[str, str]) -> int:
    try:
        raw = settings["PORT"]
    except KeyError as exc:
        raise MissingSetting("PORT is required") from exc
    try:
        port = int(raw)
    except ValueError as exc:
        raise InvalidSetting("PORT", raw, "not an integer") from exc
    if not 1 <= port <= 65535:
        raise InvalidSetting("PORT", raw, "out of range 1-65535")
    return port`,
        label: 'Domain exceptions with chained causes',
      },
      {
        title: 'Never swallow errors',
        paragraphs: [
          'except Exception: pass is one of the most dangerous lines in software. It hides bugs, corrupts data and turns failures into mysteries. Catch the narrowest exception you can actually handle, handle it meaningfully (retry, fall back, return a clear error) or let it propagate. If you must catch broadly at a top-level boundary (a request handler, a worker loop), log the full traceback with context and return a generic error — never continue as if nothing happened.',
        ],
        code: `import logging
log = logging.getLogger("worker")

def handle(job):
    ...

def worker_loop(queue):
    for job in queue:
        try:
            handle(job)
        except Exception:                                # top-level boundary only
            log.exception("job failed id=%s", job.id)    # full traceback + context
            queue.dead_letter(job)                        # keep it for investigation
        # BAD: except Exception: pass  -> the job silently disappears`,
        label: 'A broad catch at a boundary, done responsibly',
      },
      {
        title: 'Cleanup: context managers and finally',
        paragraphs: [
          'Resources — files, sockets, locks, database transactions — must be released even when an error occurs. A with statement guarantees it: the context manager\'s exit runs on success and on exception. Write your own with contextlib.contextmanager when you have paired setup and teardown. finally works too, but with is harder to get wrong.',
        ],
        code: `from contextlib import contextmanager
import sqlite3

@contextmanager
def transaction(conn: sqlite3.Connection):
    try:
        yield conn
        conn.commit()          # only if the block finished without raising
    except Exception:
        conn.rollback()        # undo partial work, then re-raise
        raise

conn = sqlite3.connect(":memory:")
conn.execute("create table t (x integer not null)")
try:
    with transaction(conn):
        conn.execute("insert into t values (1)")
        conn.execute("insert into t values (null)")   # violates NOT NULL
except sqlite3.IntegrityError:
    pass
print(conn.execute("select count(*) from t").fetchone())  # (0,) - rolled back`,
        label: 'All-or-nothing with a context manager',
      },
      {
        title: 'Failing safely: security and error messages',
        paragraphs: [
          'Security decisions must fail closed. If the permission service times out, the answer is "deny", not "allow". A surprising number of real vulnerabilities are an except branch that returns True, or a default of "allowed" when a policy file fails to load — OWASP A10:2025 calls this failing open.',
          'Error messages are for two audiences. Users get a short, safe message and a correlation ID. Logs get the details: stack trace, inputs (minus secrets and personal data) and context. Never return stack traces, SQL errors or file paths to clients; they hand attackers a map of your system. RFC 9457 "Problem Details" (Module 4) is a standard JSON shape for safe API errors.',
        ],
        code: `def can_access(user_id: str, document_id: str, policy_client) -> bool:
    try:
        return policy_client.check(user_id, document_id) is True
    except Exception:
        log.exception("policy check failed user=%s doc=%s", user_id, document_id)
        return False          # fail CLOSED: an outage must never grant access`,
        label: 'Fail closed',
      },
    ],
    table: {
      headers: ['Situation', 'Good response', 'Anti-pattern'],
      rows: [
        ['Invalid user input', 'Validate at the boundary, return a clear 4xx error', 'Let it crash deep inside with a KeyError'],
        ['Expected absence (no search hits)', 'Return an empty list or None', 'Raise and force callers to catch'],
        ['Transient network error', 'Bounded retry with backoff on idempotent calls', 'Infinite immediate retries'],
        ['Programmer bug', 'Crash loudly in tests; log and alert in production', 'except Exception: pass'],
        ['Security check cannot complete', 'Deny and log', 'Allow because "the service is down"'],
      ],
    },
    exercise: {
      scenario: 'A payment endpoint does: try: charge(card, amount); save_order(); except Exception as e: return {"error": str(e)}, 500. Support reports customers charged twice and error pages showing database hostnames.',
      task: 'List every problem in this handler and redesign it.',
      answer: 'Problems: (1) catching everything hides which step failed — if charge succeeded and save_order failed, the customer was charged without an order, so their retry charges again; (2) str(e) leaks internal details such as hostnames and SQL to the client; (3) nothing is logged; (4) there is no idempotency. Redesign: require an idempotency key per checkout so a repeated request returns the original result instead of charging again; record the order as "pending" in a transaction before charging; call charge with the idempotency key; on success mark the order "paid"; on a known payment error (card declined) return a clear 402 with a safe message; on unexpected errors log the full exception with a correlation ID and return a generic 500 Problem Details body containing only that ID; a reconciliation job resolves orders stuck in "pending".',
      evidence: 'Spotting partial failure between two steps, information leakage, missing logging and idempotency, and a redesign with explicit states and safe messages.',
    },
    misconceptions: [
      'Catching every exception makes software robust. It makes failures silent and data wrong.',
      'Detailed error messages help users. They help attackers; give users a correlation ID and keep details in logs.',
      'Retries fix flaky dependencies. Without limits, backoff and idempotency they turn a blip into an outage or duplicate charges.',
      'If an exception is rare it does not need handling. Rare failures still happen at scale; decide the behaviour explicitly.',
    ],
    sources: [S.pythonExceptions, S.owaspTop10, S.owaspErrors, S.rfc9457],
    labs: [],
    quiz: [
      { question: 'A permission check throws because the policy service is unreachable. What should the code do?', options: ['Allow the request', 'Deny the request and log the failure', 'Retry forever', 'Return the stack trace'], answer: 1, explanation: 'Security decisions must fail closed.' },
      { question: 'What does raise InvalidSetting(...) from exc achieve?', options: ['Suppresses the original error', 'Attaches the original exception as the cause for debugging', 'Retries the operation', 'Converts the error to a warning'], answer: 1, explanation: 'Chaining preserves the root cause in tracebacks.' },
      { question: 'Why is a with block preferable for database transactions?', options: ['It runs faster', 'It guarantees commit or rollback even when an exception occurs', 'It disables errors', 'It is required by SQL'], answer: 1, explanation: 'The context manager\'s exit path always runs.' },
      { question: 'Which OWASP Top 10:2025 category covers failing open and swallowed errors?', options: ['A01 Broken Access Control', 'A05 Injection', 'A10 Mishandling of Exceptional Conditions', 'A03 Software Supply Chain Failures'], answer: 2, explanation: 'A10 was added in 2025 for improper error handling and failing open.' },
      { question: 'When is retrying an operation safe?', options: ['Always', 'When the failure is transient and the operation is idempotent, with limits and backoff', 'Only for database writes', 'Never'], answer: 1, explanation: 'Non-idempotent retries can duplicate effects such as payments.' },
    ],
  },
  {
    id: 'swe-8',
    slug: 'clean-code-and-refactoring',
    title: 'Readable Code & Refactoring Without Fear',
    summary: 'Naming, functions that do one thing, code smells, Fowler\'s core refactorings, characterization tests and linters.',
    minutes: 25,
    prerequisite: 'Lessons 5–7.',
    outcomes: [
      'Recognise common code smells and the refactoring that removes each.',
      'Refactor safely in small steps protected by characterization tests.',
      'Replace conditionals with polymorphism or data where it simplifies change.',
      'Use formatters, linters and type checkers to automate the boring parts of readability.',
    ],
    introduction:
      'Code is read far more often than it is written — by reviewers, by teammates, by you next year. Refactoring is changing the structure of code without changing its behaviour, in small, safe steps, so that the next feature is easy to add. Martin Fowler\'s rule of thumb: "make the change easy (this may be hard), then make the easy change." This lesson gives you the vocabulary of smells and refactorings, and the safety net that makes refactoring routine instead of risky.',
    keyTerms: [
      { term: 'Refactoring', meaning: 'A behaviour-preserving change to internal structure, done in small verified steps.' },
      { term: 'Code smell', meaning: 'A surface symptom (long function, duplicated logic, long parameter list) that often indicates a deeper design problem.' },
      { term: 'Characterization test', meaning: 'A test that records what existing code currently does, so you can refactor legacy code without changing its behaviour.' },
      { term: 'Cyclomatic complexity', meaning: 'The number of independent paths through a function — a rough measure of how hard it is to test and understand.' },
      { term: 'Linter', meaning: 'A tool (such as Ruff or Pylint) that flags likely bugs and style problems automatically.' },
    ],
    sections: [
      {
        title: 'Names and functions',
        paragraphs: [
          'Names are the cheapest documentation. A good name says what something is or does at the level of the reader\'s problem: overdue_invoices, not list2; send_reminder, not process. Functions should do one thing at one level of abstraction; if you need "and" to describe a function, it probably does two things. Short functions are a consequence of this, not a goal in themselves.',
          'Comments should explain why — the business rule, the trade-off, the bug you avoided — not repeat what the code says. When you feel the need to comment what a block does, extract it into a well-named function instead.',
        ],
      },
      {
        title: 'Common smells and their cures',
        paragraphs: [
          'Long function → Extract Function. Duplicated code → extract and reuse, but only once the duplicates truly represent the same idea (two similar-looking rules that change for different reasons should stay separate). Long parameter list → Introduce Parameter Object. Feature envy (a method mostly uses another object\'s data) → Move Function. Repeated switch/if-elif on a type code → Replace Conditional with Polymorphism or a lookup table. Primitive obsession (passing raw strings for emails and money) → small value types (Lesson 6). Shotgun surgery (one change touches many files) → move related code together.',
        ],
      },
      {
        title: 'Refactoring safely: tests first, tiny steps',
        paragraphs: [
          'Before refactoring, make sure tests cover the behaviour you are about to touch. For legacy code with no tests, write characterization tests: call the code with representative inputs and assert whatever it currently returns — even if it looks wrong. They are your safety net. Then change one thing at a time (rename, extract, move), run the tests after each step, and commit often. Keep refactoring commits separate from behaviour changes so reviewers can verify each easily.',
        ],
        code: `# Legacy code we must not break
def legacy_shipping(weight_kg, country, express):
    if country == "GH":
        cost = 10 if weight_kg <= 1 else 10 + (weight_kg - 1) * 4
    else:
        cost = 25 if weight_kg <= 1 else 25 + (weight_kg - 1) * 9
    if express:
        cost = cost * 1.5
    return round(cost, 2)

# Characterization tests: record today's behaviour before touching anything.
CASES = [((0.5, "GH", False), 10), ((3, "GH", False), 18), ((3, "NG", True), 64.5),
         ((1, "US", False), 25)]
for args, expected in CASES:
    assert legacy_shipping(*args) == expected, args`,
        label: 'Characterization tests pin current behaviour',
      },
      {
        title: 'Replace conditional with polymorphism (or data)',
        paragraphs: [
          'When the same if/elif chain on a "type" appears in several places, every new type means editing all of them. Polymorphism moves each case into its own class behind a common interface; adding a type means adding a class. Often a simpler cure is a table: when the cases differ only in numbers, put the numbers in a dict.',
        ],
        code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Rate:
    base: float
    per_extra_kg: float

RATES = {"GH": Rate(10, 4)}
INTERNATIONAL = Rate(25, 9)

def shipping(weight_kg: float, country: str, express: bool) -> float:
    rate = RATES.get(country, INTERNATIONAL)
    cost = rate.base + max(0.0, weight_kg - 1) * rate.per_extra_kg
    return round(cost * (1.5 if express else 1), 2)

for args, expected in CASES:          # same characterization tests still pass
    assert shipping(*args) == expected, args`,
        label: 'The same behaviour, now open for new countries',
      },
      {
        title: 'Automate readability',
        paragraphs: [
          'Do not spend review time on formatting. Use a formatter (Ruff format or Black for Python, Prettier for JavaScript) so all code looks the same, a linter (Ruff) to catch unused variables, shadowed names and risky patterns, and a type checker (mypy or pyright) to catch type errors. Run them in pre-commit hooks and in CI so main never contains code that fails them. Your reviewers can then focus on design and correctness.',
        ],
        code: `# pyproject.toml
[tool.ruff]
line-length = 100
[tool.ruff.lint]
select = ["E", "F", "B", "I", "UP", "S"]   # pycodestyle, pyflakes, bugbear, imports, upgrades, security
[tool.mypy]
strict = true

# .pre-commit-config.yaml runs: ruff check --fix, ruff format, mypy`,
        label: 'Tooling configuration',
      },
    ],
    table: {
      headers: ['Smell', 'Refactoring', 'Benefit'],
      rows: [
        ['Long function', 'Extract Function', 'Each piece named, testable and reusable'],
        ['Long parameter list', 'Introduce Parameter Object', 'Related data travels together with its rules'],
        ['Repeated type switch', 'Replace Conditional with Polymorphism / table', 'New cases added without editing old ones'],
        ['Primitive obsession', 'Replace Primitive with Object', 'Validation lives in one place'],
        ['Duplicated logic', 'Extract and reuse (rule of three)', 'One fix updates every use'],
        ['Mysterious name', 'Rename', 'Code explains itself'],
      ],
    },
    exercise: {
      scenario: 'You must add a new "same-day" delivery option to a 300-line process_order function that has no tests, mixes validation, pricing, stock updates and email sending, and has three nested if/elif chains on delivery type.',
      task: 'Describe your plan, in order, before writing the feature.',
      answer: 'First, write characterization tests around process_order for each delivery type and key edge cases (empty cart, out of stock, discount codes), mocking email and stock side effects so you can assert on them. Then refactor in small committed steps with tests green after each: extract validate_order, price_order, reserve_stock and notify_customer; introduce an Order parameter object; replace the delivery-type conditionals with a DeliveryOption strategy (or a table if only numbers differ). Only then add SameDayDelivery as a new option with its own tests. Ship the refactoring and the feature as separate pull requests.',
      evidence: 'Tests before structural change, small reversible steps, separating refactoring from behaviour change, and adding the feature as a new class or entry rather than another branch.',
    },
    misconceptions: [
      'Refactoring means rewriting. A rewrite discards working behaviour; refactoring preserves it in small steps.',
      'All duplication must be removed immediately. Merge duplicates only when they represent the same rule; premature abstraction couples unrelated things.',
      'Comments make code readable. Clear names and structure do; comments should explain why.',
      'You can refactor without tests if you are careful. Without a safety net you cannot know behaviour was preserved.',
    ],
    sources: [S.refactoring, S.googleReview, S.sweGoogle],
    labs: [],
    quiz: [
      { question: 'What defines a refactoring?', options: ['Adding a feature', 'Changing structure without changing observable behaviour', 'Rewriting code in a new language', 'Fixing a bug'], answer: 1, explanation: 'Refactoring is behaviour-preserving by definition.' },
      { question: 'What is a characterization test?', options: ['A test of user interface characters', 'A test that captures what existing code currently does', 'A performance benchmark', 'A security scan'], answer: 1, explanation: 'It pins current behaviour so you can change structure safely.' },
      { question: 'The same if/elif on payment type appears in five functions. Which refactoring fits?', options: ['Rename Variable', 'Replace Conditional with Polymorphism', 'Inline Function', 'Add comments'], answer: 1, explanation: 'Each type becomes a class behind one interface.' },
      { question: 'Why separate refactoring commits from behaviour changes?', options: ['Git requires it', 'Reviewers can verify each kind of change independently and revert safely', 'It makes the history longer', 'Linters demand it'], answer: 1, explanation: 'Mixed changes hide behaviour changes inside large diffs.' },
      { question: 'What should comments mainly explain?', options: ['What each line does', 'Why the code is the way it is', 'The author\'s name', 'Variable types'], answer: 1, explanation: 'Code shows what; comments carry intent and trade-offs.' },
    ],
  },
];
