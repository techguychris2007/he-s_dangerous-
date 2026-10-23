import type { CurriculumLesson } from '../curriculumDefinition';
import { SE_SOURCES as S } from './sources';

/** Module 3 — testing and quality (SWEBOK V4: Testing, Quality; Google SWE book chapters 11–14). */
export const SE_MODULE_3: CurriculumLesson[] = [
  {
    id: 'swe-9',
    slug: 'designing-tests',
    title: 'Designing Tests: Partitions, Boundaries & Coverage',
    summary: 'Choose a small set of tests that finds most bugs: input partitioning, boundary values, oracles, and what coverage does and does not tell you.',
    minutes: 24,
    prerequisite: 'Lesson 5 (specifications).',
    outcomes: [
      'Partition a function\'s input space from its specification and pick one test per partition.',
      'Add boundary-value tests where bugs cluster.',
      'Interpret statement and branch coverage, and explain why 100% coverage is not proof of correctness.',
      'Judge a test suite by the bugs it would catch, using mutation testing.',
    ],
    introduction:
      'Exhaustive testing is impossible: even a function taking two 64-bit integers has more inputs than there are atoms you could test in a lifetime. Testing is therefore a selection problem — choosing a handful of inputs that are most likely to reveal bugs. Edsger Dijkstra put the limit plainly: "testing can show the presence of bugs, but never their absence." Good test design makes each test count.',
    keyTerms: [
      { term: 'Partition', meaning: 'A set of inputs the spec treats the same way; if one input in it works, the others probably do too.' },
      { term: 'Boundary value', meaning: 'An input at the edge of a partition (0, 1, max, empty, exactly the limit) — where off-by-one bugs live.' },
      { term: 'Test oracle', meaning: 'How you decide whether an output is correct: an expected value, a property, or a trusted reference implementation.' },
      { term: 'Branch coverage', meaning: 'The fraction of decision outcomes (each if true and false) executed by the tests.' },
      { term: 'Mutation testing', meaning: 'Deliberately injecting small bugs (mutants) to see whether the tests notice; surviving mutants reveal weak tests.' },
    ],
    sections: [
      {
        title: 'Partition the input space',
        paragraphs: [
          'Read the specification and split each input into partitions the spec treats differently. For abs(x): negative, zero, positive. For a function taking a list: empty, one element, many elements; sorted, unsorted; with duplicates, without. Combine partitions across inputs — for two inputs with three partitions each, either cover all nine combinations (full Cartesian product) or, when that explodes, make sure each partition of each input is covered at least once.',
          'Write the partitions as a comment above the tests. Reviewers can then check the reasoning instead of guessing why you chose 7 and -3.',
        ],
        code: `# Testing strategy for leap_year(y):
#   partition on divisibility: not by 4 | by 4 not 100 | by 100 not 400 | by 400
#   partition on y: y < 1 (invalid) | y >= 1
#   boundaries: 1, 4, 100, 400
def test_not_divisible_by_4():      assert leap_year(2023) is False
def test_divisible_by_4_only():     assert leap_year(2024) is True
def test_century_not_by_400():      assert leap_year(1900) is False
def test_divisible_by_400():        assert leap_year(2000) is True
def test_smallest_valid_year():     assert leap_year(1) is False
def test_rejects_year_zero():
    import pytest
    with pytest.raises(ValueError):
        leap_year(0)`,
        label: 'A documented testing strategy',
      },
      {
        title: 'Boundaries: where bugs cluster',
        paragraphs: [
          'Off-by-one errors, < versus <=, empty collections and maximum sizes cause a disproportionate share of bugs. For every limit in the spec, test just below, exactly at, and just above it. A password minimum of 12 characters needs tests at 11, 12 and 13. A page size of 50 needs 0, 1, 49, 50 and 51 items.',
        ],
      },
      {
        title: 'Oracles: knowing the right answer',
        paragraphs: [
          'The simplest oracle is a hand-computed expected value. When outputs are hard to compute by hand, use other oracles: a property that must hold (the output of sort is ordered and a permutation of the input), a slower but obviously correct reference implementation, or a round trip (decode(encode(x)) == x). Lesson 11 automates property-based oracles.',
        ],
      },
      {
        title: 'What coverage tells you — and what it does not',
        paragraphs: [
          'Coverage tools (coverage.py with --branch) show which lines and branches your tests executed. Unexecuted code is definitely untested, so coverage is an excellent way to find gaps. But executed is not the same as checked: a test that calls a function without asserting anything achieves coverage and catches nothing. Coverage also cannot see missing code — the validation you forgot to write has no line to cover.',
          'Use coverage as a flashlight, not a target. Teams that mandate a number tend to get tests written for the number. Google\'s guidance treats around 60% as acceptable, 75% as commendable and 90% as exemplary, but emphasises reviewing which code is uncovered and why.',
        ],
        code: `$ python -m pytest --cov=billing --cov-branch --cov-report=term-missing
Name               Stmts   Miss Branch BrPart  Cover   Missing
--------------------------------------------------------------
billing/tax.py        42      3     18      2    90%   57-59, 71->74`,
        label: 'Branch coverage report',
      },
      {
        title: 'Testing your tests: mutation testing',
        paragraphs: [
          'A mutation tool (mutmut, cosmic-ray) makes small changes to your code — < becomes <=, + becomes -, a return value becomes None — and runs your tests against each mutant. If the tests still pass, the mutant "survived": your suite would not have noticed that bug. Surviving mutants point exactly at missing assertions and boundaries. The coding tasks in this lesson use the same idea: your test function must accept a correct implementation and reject every planted mutant.',
        ],
        code: `def leap_year(y):                     # original
    if y < 1: raise ValueError(y)
    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)

def leap_mutant(y):                    # mutant: dropped the 400 rule
    if y < 1: raise ValueError(y)
    return y % 4 == 0 and y % 100 != 0

# A suite without a year divisible by 400 lets this mutant survive.
weak = [2023, 2024, 1900]
print(all(leap_year(y) == leap_mutant(y) for y in weak))   # True -> mutant survives
print(leap_year(2000), leap_mutant(2000))                   # True False -> 2000 kills it`,
        label: 'A surviving mutant reveals a missing test',
      },
    ],
    table: {
      headers: ['Technique', 'Finds', 'Limitation'],
      rows: [
        ['Partitioning', 'Whole categories of untested behaviour', 'Only as good as your reading of the spec'],
        ['Boundary values', 'Off-by-one and limit bugs', 'Needs explicit limits in the spec'],
        ['Branch coverage', 'Code no test executes', 'Cannot see missing code or weak assertions'],
        ['Mutation testing', 'Tests that would miss real bugs', 'Slow on large code bases; run on changed code'],
        ['Property oracles', 'Bugs on inputs you never thought of', 'Requires identifying good properties'],
      ],
    },
    exercise: {
      scenario: 'Spec: shipping_band(weight_kg: float) returns "small" for 0 < w <= 2, "medium" for 2 < w <= 10, "large" for 10 < w <= 30, and raises ValueError otherwise.',
      task: 'List the partitions and the boundary values you would test, and how many tests you need.',
      answer: 'Partitions: invalid low (w <= 0), small, medium, large, invalid high (w > 30). Boundaries: 0 (invalid), a tiny positive such as 0.001 (small), 2 (small), 2.001 (medium), 10 (medium), 10.001 (large), 30 (large), 30.001 (invalid), plus a representative mid value for each band (1, 5, 20), and a negative number. About 12 focused tests; each limit is tested on both sides, which is where < vs <= mistakes hide.',
      evidence: 'Five partitions including both invalid ranges, both sides of every limit, and a reasoned test count rather than "lots of tests".',
    },
    misconceptions: [
      '100% coverage means the code is correct. It means every line ran; it says nothing about assertions or missing logic.',
      'More tests are always better. Redundant tests slow the suite and add maintenance without finding new bugs.',
      'Random inputs are enough. Bugs cluster at boundaries that random choice rarely hits.',
      'Tests only need to check the happy path. Most production failures are in error and edge paths.',
    ],
    sources: [S.mit6102, S.sweGoogle, S.testPyramid, S.pytest],
    labs: [],
    quiz: [
      { question: 'A spec accepts passwords of 12–64 characters. Which set tests the boundaries best?', options: ['10, 30, 70', '11, 12, 64, 65', '12 only', '1, 100'], answer: 1, explanation: 'Test each limit and just beyond it.' },
      { question: 'What does a surviving mutant tell you?', options: ['The code is correct', 'The tests would not detect that particular bug', 'The mutation tool is broken', 'Coverage is 100%'], answer: 1, explanation: 'A mutant that passes all tests exposes a missing check.' },
      { question: 'Why is coverage a poor target but a good flashlight?', options: ['It is slow to compute', 'It shows untested code but cannot measure whether behaviour is checked', 'It only works in Java', 'It counts comments'], answer: 1, explanation: 'Executed code is not necessarily verified code.' },
      { question: 'Which is a property-based oracle for a sort function?', options: ['The output equals [1, 2, 3]', 'The output is ordered and is a permutation of the input', 'The function returns quickly', 'The function has no comments'], answer: 1, explanation: 'Properties check correctness for any input without precomputed answers.' },
      { question: 'Two inputs each have 3 partitions. What is the minimum number of tests that still covers every partition of each input at least once?', options: ['1', '3', '6', '9'], answer: 1, explanation: 'Three well-chosen tests can cover each partition of both inputs; nine covers every combination.' },
    ],
  },
  {
    id: 'swe-10',
    slug: 'unit-testing-and-test-doubles',
    title: 'Unit Testing With pytest: Fixtures, Fakes & Mocks',
    summary: 'Arrange–act–assert, parametrised tests, fixtures, and choosing between stubs, fakes, spies and mocks — plus designing code so it is testable.',
    minutes: 25,
    prerequisite: 'Lesson 9.',
    outcomes: [
      'Write clear pytest tests using arrange–act–assert, parametrize and fixtures.',
      'Choose the right test double (stub, fake, spy, mock) and avoid over-mocking.',
      'Inject dependencies such as clocks, randomness, HTTP clients and databases to make code testable.',
      'Keep unit tests fast, deterministic and focused on behaviour.',
    ],
    introduction:
      'A unit test checks one small piece of behaviour quickly and deterministically, so you can run hundreds of them every time you save. The hard part is not the test syntax — it is designing code whose behaviour can be observed without a real database, network or clock. This lesson covers both.',
    keyTerms: [
      { term: 'Arrange–Act–Assert', meaning: 'A test structure: set up inputs and collaborators, perform one action, check the outcome.' },
      { term: 'Fixture', meaning: 'Reusable setup provided to tests by pytest (a temporary directory, a fake repository, a client).' },
      { term: 'Stub', meaning: 'A double that returns canned answers.' },
      { term: 'Fake', meaning: 'A working lightweight implementation, such as an in-memory repository.' },
      { term: 'Spy / mock', meaning: 'A double that records how it was called so the test can verify interactions.' },
      { term: 'Dependency injection', meaning: 'Passing collaborators in (as parameters) instead of creating or importing them inside the code.' },
    ],
    sections: [
      {
        title: 'Anatomy of a good unit test',
        paragraphs: [
          'Name the test after the behaviour it checks: test_expired_token_is_rejected, not test_token_3. Arrange the inputs, act once, assert on the observable result. One behaviour per test makes failures self-explanatory. Tests should be independent (any order, in parallel), fast (milliseconds) and deterministic (same result every run).',
        ],
        code: `import pytest
from cart import Cart, OutOfStock

def test_adding_an_item_updates_the_total():
    cart = Cart()                                  # arrange
    cart.add("book", price_cents=1500, qty=2)      # act
    assert cart.total_cents == 3000                # assert

@pytest.mark.parametrize("qty", [0, -1])
def test_rejects_non_positive_quantity(qty):
    with pytest.raises(ValueError, match="quantity"):
        Cart().add("book", price_cents=1500, qty=qty)`,
        label: 'Readable pytest tests',
      },
      {
        title: 'Design for testability: inject what varies',
        paragraphs: [
          'Code that calls datetime.now(), random.random(), requests.get() or opens a database connection inside its logic is hard to test, because those collaborators are slow or non-deterministic. Pass them in instead. The production caller supplies the real clock; tests supply a fake one they control. This is dependency injection — no framework required, just parameters.',
          'A related pattern is "functional core, imperative shell": keep decisions in pure functions (data in, data out — trivial to test) and push I/O to a thin outer layer.',
        ],
        code: `from datetime import datetime, timedelta, timezone
from typing import Callable

Clock = Callable[[], datetime]

class Session:
    def __init__(self, ttl: timedelta, clock: Clock = lambda: datetime.now(timezone.utc)):
        self._clock = clock
        self._expires = clock() + ttl
    def is_valid(self) -> bool:
        return self._clock() < self._expires

def test_session_expires_after_ttl():
    now = [datetime(2026, 1, 1, tzinfo=timezone.utc)]
    session = Session(timedelta(minutes=30), clock=lambda: now[0])
    now[0] += timedelta(minutes=29)
    assert session.is_valid()
    now[0] += timedelta(minutes=1)
    assert not session.is_valid()      # no sleeping, no flakiness`,
        label: 'Injecting a clock',
      },
      {
        title: 'Choosing a test double',
        paragraphs: [
          'Prefer real objects when they are fast and deterministic (a dataclass, a pure function). When they are not, prefer fakes — an in-memory repository behaves like the real one, so tests check behaviour rather than call sequences. Use stubs to force specific answers (a payment gateway that always declines). Use spies or mocks only to verify interactions that are themselves the behaviour, such as "an email was sent exactly once".',
          'Over-mocking is a common trap: tests that mock every collaborator and assert exact call sequences break on every refactoring while catching few real bugs. The Google SWE book recommends favouring real implementations and fakes over mocking frameworks for this reason.',
        ],
        code: `class InMemoryUserRepo:                       # a fake
    def __init__(self):
        self._users = {}
    def add(self, email, name):
        if email in self._users:
            raise ValueError("duplicate")
        self._users[email] = name
    def get(self, email):
        return self._users.get(email)

class SpyMailer:                                # a spy
    def __init__(self):
        self.sent = []
    def send(self, to, subject):
        self.sent.append((to, subject))

def register(repo, mailer, email, name):
    repo.add(email, name)
    mailer.send(email, "Welcome!")

def test_register_sends_one_welcome_email():
    repo, mailer = InMemoryUserRepo(), SpyMailer()
    register(repo, mailer, "ada@example.com", "Ada")
    assert repo.get("ada@example.com") == "Ada"
    assert mailer.sent == [("ada@example.com", "Welcome!")]`,
        label: 'A fake and a spy, no mocking library needed',
      },
      {
        title: 'Fixtures and unittest.mock',
        paragraphs: [
          'pytest fixtures remove repeated setup and handle teardown: tmp_path gives each test a fresh directory; your own fixture can build a fake repository. When you must replace something you cannot inject (legacy code calling a module function directly), unittest.mock.patch swaps it for the duration of a test — patch where the name is looked up, not where it is defined. Always use autospec=True so the mock fails if called with arguments the real function would reject.',
        ],
        code: `import pytest
from unittest.mock import patch

@pytest.fixture
def repo():
    return InMemoryUserRepo()

def test_report_written_to_disk(tmp_path):
    out = tmp_path / "report.csv"
    out.write_text("id,total\\n1,30\\n")
    assert out.read_text().splitlines()[1] == "1,30"

def test_weather_summary_uses_api():
    with patch("weather.fetch_temperature", autospec=True, return_value=31.5) as fake:
        from weather import summary
        assert summary("Accra") == "Hot: 31.5°C"
        fake.assert_called_once_with("Accra")`,
        label: 'Fixtures and patching',
      },
    ],
    table: {
      headers: ['Double', 'What it does', 'Use when'],
      rows: [
        ['Stub', 'Returns canned answers', 'You need a specific response (a decline, a timeout)'],
        ['Fake', 'Simplified working implementation', 'The real thing is slow or external (database, queue)'],
        ['Spy', 'Records calls for later assertions', 'The interaction itself is the behaviour (email sent once)'],
        ['Mock', 'Pre-programmed expectations, verifies calls', 'Sparingly — legacy seams you cannot inject'],
        ['Real object', 'The production code', 'It is fast and deterministic — always the first choice'],
      ],
    },
    exercise: {
      scenario: 'def send_due_reminders(): rows = db.query("select …"); for r in rows: if r.due < datetime.now(): smtp.send(r.email, "Reminder") — with db and smtp as module-level globals.',
      task: 'Explain why this is hard to test and refactor it so a unit test can check that only overdue, unpaid invoices get exactly one reminder each.',
      answer: 'It reads a global database, calls the real clock and sends real email, so a test needs live infrastructure and is non-deterministic. Refactor to def send_due_reminders(invoices, mailer, today): for inv in invoices: if not inv.paid and inv.due < today: mailer.send(inv.email, f"Reminder: invoice {inv.id}"). The decision logic is now pure apart from the injected mailer. The production entry point loads invoices from the database, passes the real SMTP client and date.today(). The unit test passes a list of invoice objects, a SpyMailer and a fixed date, then asserts the exact list of sent messages — including that paid and not-yet-due invoices are skipped.',
      evidence: 'Identifying the three hidden dependencies (database, clock, SMTP), injecting them, and a deterministic test using a fake clock value and a spy.',
    },
    misconceptions: [
      'Unit tests must mock everything except the function under test. Over-mocking produces brittle tests; prefer real objects and fakes.',
      'If code is hard to test, the tests are the problem. Usually the design is: hidden dependencies and mixed concerns.',
      'Sleeping in tests is fine for time-based logic. Inject a clock; sleeps make suites slow and flaky.',
      'Private methods need their own tests. Test behaviour through the public interface so refactoring stays free.',
    ],
    sources: [S.pytest, S.unittestMock, S.sweGoogle, S.testPyramid],
    labs: [],
    quiz: [
      { question: 'Which test double is a working, simplified implementation such as an in-memory repository?', options: ['Stub', 'Fake', 'Spy', 'Dummy'], answer: 1, explanation: 'Fakes really work, just not in a production-grade way.' },
      { question: 'What is the main benefit of injecting a clock?', options: ['Faster code in production', 'Tests can control time deterministically without sleeping', 'It avoids time zones', 'It removes the need for tests'], answer: 1, explanation: 'Tests set the time they need instantly and reliably.' },
      { question: 'Why use autospec=True with patch?', options: ['It makes tests faster', 'The mock rejects calls whose signature the real function would reject', 'It disables the mock', 'It is required by pytest'], answer: 1, explanation: 'Autospec keeps mocks honest when the real signature changes.' },
      { question: 'A test asserts the exact order of 12 internal method calls. What is the likely problem?', options: ['It is too fast', 'It is coupled to implementation and will break on refactoring', 'It has too few assertions', 'Nothing'], answer: 1, explanation: 'Interaction-heavy tests check how, not what, and resist change.' },
      { question: 'What does "functional core, imperative shell" mean?', options: ['Write all code as lambdas', 'Keep decisions in pure functions and push I/O to a thin outer layer', 'Use shell scripts for tests', 'Avoid classes'], answer: 1, explanation: 'Pure decision logic is trivial to test; the thin shell needs only a few integration tests.' },
    ],
  },
  {
    id: 'swe-11',
    slug: 'property-and-integration-testing',
    title: 'Beyond Unit Tests: Property-Based, Integration & End-to-End',
    summary: 'Let the computer find inputs you missed, test real collaborators together, balance the test pyramid, and eliminate flaky tests.',
    minutes: 24,
    prerequisite: 'Lessons 9–10.',
    outcomes: [
      'Write property-based tests with invariants, round trips and reference oracles.',
      'Write integration tests against real dependencies such as SQLite, and contract tests between services.',
      'Balance unit, integration and end-to-end tests by cost, speed and confidence.',
      'Diagnose and fix flaky tests.',
    ],
    introduction:
      'Example-based tests check the inputs you thought of. Property-based testing generates hundreds of inputs you did not, and shrinks any failure to a minimal example. Integration tests check that your pieces actually work together — the place where unit tests with fakes cannot see. Together with a few end-to-end checks, they give confidence that the whole system works, not just its parts.',
    keyTerms: [
      { term: 'Property', meaning: 'A statement true for all valid inputs, e.g. decode(encode(x)) == x.' },
      { term: 'Shrinking', meaning: 'Simplifying a failing generated input to the smallest one that still fails.' },
      { term: 'Integration test', meaning: 'Tests several components together with real infrastructure (database, filesystem, HTTP).' },
      { term: 'Contract test', meaning: 'Checks that a provider still satisfies the requests and responses its consumers rely on.' },
      { term: 'Flaky test', meaning: 'A test that sometimes passes and sometimes fails without any code change.' },
    ],
    sections: [
      {
        title: 'Property-based testing',
        paragraphs: [
          'With Hypothesis you describe the shape of valid inputs and a property; the library generates many examples, including nasty edge cases (empty strings, huge numbers, unicode, NaN), and shrinks failures. Good properties: round trips (parse/serialise, encode/decode), invariants (sorted output is ordered and the same length), idempotence (normalising twice equals normalising once), and comparison with a simple reference implementation.',
        ],
        code: `from hypothesis import given, strategies as st

def rle_encode(s: str) -> list[tuple[str, int]]:
    out: list[tuple[str, int]] = []
    for ch in s:
        if out and out[-1][0] == ch:
            out[-1] = (ch, out[-1][1] + 1)
        else:
            out.append((ch, 1))
    return out

def rle_decode(pairs: list[tuple[str, int]]) -> str:
    return "".join(ch * n for ch, n in pairs)

@given(st.text())
def test_round_trip(s):
    assert rle_decode(rle_encode(s)) == s

@given(st.text())
def test_no_adjacent_runs_share_a_character(s):
    pairs = rle_encode(s)
    assert all(a[0] != b[0] for a, b in zip(pairs, pairs[1:]))`,
        label: 'Properties instead of examples',
      },
      {
        title: 'Integration tests with real dependencies',
        paragraphs: [
          'Fakes can drift from the real thing: your in-memory repository might allow duplicate emails that the real database\'s UNIQUE constraint rejects. Integration tests run your repository against a real database — SQLite in memory is perfect for Python projects, and containers (Testcontainers) make a real PostgreSQL disposable for each test run. Keep them focused on the boundary: SQL correctness, constraints, transactions and serialisation.',
        ],
        code: `import sqlite3, pytest

class UserRepo:
    def __init__(self, conn):
        self.conn = conn
        conn.execute("create table if not exists users (email text primary key collate nocase, name text not null)")
    def add(self, email, name):
        with self.conn:
            self.conn.execute("insert into users values (?, ?)", (email, name))   # parameterised: no injection
    def get(self, email):
        row = self.conn.execute("select name from users where email = ?", (email,)).fetchone()
        return row[0] if row else None

@pytest.fixture
def repo():
    return UserRepo(sqlite3.connect(":memory:"))

def test_email_uniqueness_is_case_insensitive(repo):
    repo.add("ada@example.com", "Ada")
    with pytest.raises(sqlite3.IntegrityError):
        repo.add("ADA@example.com", "Impostor")`,
        label: 'An integration test against real SQLite',
      },
      {
        title: 'The test pyramid (and its critics)',
        paragraphs: [
          'The classic pyramid says: many fast unit tests, fewer integration tests, very few slow end-to-end (E2E) tests through the real UI. E2E tests give the most confidence per test but are slow, flaky and expensive to diagnose. Some teams prefer a "trophy" shape with more integration tests, because modern tooling makes them fast. The principle behind both: push each check to the cheapest level that can catch the bug, and keep a few E2E "smoke" tests for the critical user journeys (sign-up, checkout, login).',
          'For services that talk to each other, consumer-driven contract tests (Pact) let each team verify the API expectations of its consumers without spinning up the whole system.',
        ],
      },
      {
        title: 'Flaky tests: causes and cures',
        paragraphs: [
          'Flaky tests destroy trust: once people learn to "just re-run CI", real failures get ignored. Common causes: time (tests that depend on the current date or on sleep), ordering (tests sharing global state or depending on dictionary or set order), concurrency and timeouts, randomness without a fixed seed, and external services. Cures: inject clocks and seeds, isolate state per test, wait for conditions instead of sleeping, replace external services with fakes or recorded responses, and quarantine a flaky test immediately with an owner and a deadline instead of leaving it to rot.',
        ],
        code: `import random

def pick_winner(entries, rng: random.Random):
    return rng.choice(sorted(entries))     # sorted: set order is not stable across runs

def test_pick_winner_is_reproducible():
    entries = {"amir", "zoe", "kofi"}
    assert pick_winner(entries, random.Random(42)) == pick_winner(entries, random.Random(42))`,
        label: 'Seeded randomness and stable ordering',
      },
    ],
    table: {
      headers: ['Level', 'Speed / cost', 'Catches'],
      rows: [
        ['Unit', 'Milliseconds, cheap', 'Logic errors inside one unit'],
        ['Property-based', 'Seconds, cheap', 'Edge cases nobody thought of'],
        ['Integration', 'Seconds, moderate', 'SQL, serialisation, configuration, wiring'],
        ['Contract', 'Seconds, moderate', 'API drift between teams'],
        ['End-to-end', 'Minutes, expensive and flaky', 'Broken user journeys across the whole stack'],
      ],
    },
    exercise: {
      scenario: 'A team has 40 E2E browser tests that take 35 minutes and fail randomly about once a day, and almost no unit tests. Developers merge without waiting for CI.',
      task: 'Propose a plan to rebalance the suite and restore trust in CI.',
      answer: 'Keep 5–8 E2E smoke tests for critical journeys (sign-up, login, checkout, password reset) and quarantine the rest with owners. For each removed E2E test, identify what it actually verified and push the check down: business rules into unit and property tests on pure functions, database and API wiring into integration tests against SQLite or a container, and cross-service expectations into contract tests. Fix flakiness at the source (inject clocks, wait for conditions, isolate data per test, fixed seeds). Make CI required on main, track test duration and flake rate, and aim for a pipeline under 10 minutes.',
      evidence: 'Fewer but critical E2E tests, checks moved to cheaper levels by what they verify, root-cause fixes for flakiness, and enforcing CI again.',
    },
    misconceptions: [
      'End-to-end tests are the most realistic, so more of them is better. Their cost and flakiness make them a poor foundation.',
      'Property-based testing is only for mathematicians. Round trips and invariants exist in almost every program (parsers, serialisers, converters).',
      'A flaky test is harmless if you re-run it. It trains the team to ignore failures, including real ones.',
      'Fakes make integration tests unnecessary. Fakes can drift from the real dependency; integration tests keep them honest.',
    ],
    sources: [S.hypothesis, S.testPyramid, S.sweGoogle, S.sqlite],
    labs: [],
    quiz: [
      { question: 'Which is a round-trip property?', options: ['len(sorted(xs)) == len(xs)', 'loads(dumps(x)) == x', 'f(x) > 0', 'the test runs in under 1 second'], answer: 1, explanation: 'Encoding then decoding should return the original value.' },
      { question: 'What does shrinking do?', options: ['Compresses test output', 'Reduces a failing generated input to a minimal failing example', 'Deletes old tests', 'Shortens test names'], answer: 1, explanation: 'Minimal counterexamples make the bug obvious.' },
      { question: 'Why add integration tests if you already test with an in-memory fake?', options: ['They are faster', 'The fake can behave differently from the real dependency (constraints, SQL)', 'Fakes are forbidden', 'They replace unit tests'], answer: 1, explanation: 'Integration tests verify the real boundary.' },
      { question: 'Which is NOT a common cause of flaky tests?', options: ['Shared global state', 'Depending on the current time', 'Unseeded randomness', 'Using descriptive test names'], answer: 3, explanation: 'Names do not cause nondeterminism.' },
      { question: 'What should you do with a newly discovered flaky test?', options: ['Ignore it', 'Retry it automatically forever', 'Quarantine it with an owner and fix the root cause', 'Delete all tests'], answer: 2, explanation: 'Quarantining protects trust while the cause is fixed.' },
    ],
  },
  {
    id: 'swe-12',
    slug: 'tdd-and-code-review',
    title: 'Test-Driven Development, Code Review & Quality Culture',
    summary: 'Red–green–refactor in practice, reviewing code like a senior engineer, automated quality gates, and a definition of done.',
    minutes: 23,
    prerequisite: 'Lessons 8–11.',
    outcomes: [
      'Practise the red–green–refactor cycle and explain when TDD helps most.',
      'Review a change for design, correctness, tests and security, and write actionable comments.',
      'Set up automated quality gates (formatting, linting, types, tests, coverage diff, security scanning).',
      'Write a definition of done for a team.',
    ],
    introduction:
      'Quality is not a phase at the end; it is the sum of many small habits. Test-driven development makes you state the expected behaviour before writing code. Code review spreads knowledge and catches design problems early. Automated gates make the basics non-negotiable. Teams that combine them ship faster, not slower, because they spend less time firefighting.',
    keyTerms: [
      { term: 'TDD', meaning: 'Write a failing test (red), make it pass with the simplest code (green), then improve the design (refactor).' },
      { term: 'Code review', meaning: 'Another engineer reads a change before it merges, checking design, correctness, tests, readability and security.' },
      { term: 'Quality gate', meaning: 'An automated check that must pass before merging (tests, linters, type checks, security scans).' },
      { term: 'Definition of done', meaning: 'The team\'s shared checklist a change must meet before it counts as finished.' },
      { term: 'Nit', meaning: 'A minor, optional review suggestion — label it so the author knows it does not block.' },
    ],
    sections: [
      {
        title: 'Red, green, refactor',
        paragraphs: [
          'TDD works in tiny loops of a few minutes. Red: write one test for the next small behaviour and watch it fail (a test you never saw fail might not be testing anything). Green: write the simplest code that passes — even if it feels naive. Refactor: with the tests green, remove duplication and improve names. Repeat. The tests become a by-product that documents the behaviour; the design emerges from real usage of your API.',
          'TDD shines for logic with clear inputs and outputs (parsers, pricing rules, validators) and for bug fixes (write the failing test first). It is less useful for exploratory spikes where you do not yet know what you are building — prototype, then throw the spike away and rebuild it test-first.',
        ],
        code: `# Kata: add("1,2\\n3") -> 6 ; custom delimiter "//;\\n1;2" -> 3 ; negatives rejected
def test_empty_string_is_zero():      assert add("") == 0          # red -> green: return 0
def test_single_number():             assert add("7") == 7         # red -> green: int(s) if s else 0
def test_commas_and_newlines():       assert add("1,2\\n3") == 6     # generalise with re.split
def test_custom_delimiter():          assert add("//;\\n1;2") == 3
def test_negatives_listed_in_error():
    import pytest
    with pytest.raises(ValueError, match="-1, -4"):
        add("2,-1,3,-4")`,
        label: 'Each test drives the next small step',
      },
      {
        title: 'Reviewing code like a senior engineer',
        paragraphs: [
          'Google\'s review guide asks one question first: does this change improve the overall health of the code base? Not "is it perfect". Review in order: design (does it belong here, is it the right approach?), functionality (does it do what the author intended, including edge cases and concurrency?), complexity (could it be simpler?), tests (would they fail if the code broke?), naming and comments, then style (which tools should handle).',
          'Review for security too: input validation at boundaries, authorisation on every new endpoint, secrets in code or logs, injection risks (string-built SQL or shell commands), and unsafe deserialisation. Small changes get better reviews — push back on 2,000-line pull requests.',
        ],
      },
      {
        title: 'Writing comments people act on',
        paragraphs: [
          'Comment on the code, not the person ("this loop re-reads the file each time" rather than "you made this slow"). Explain why ("this query runs per row; with 10k rows that is 10k round trips — could we batch it?"). Distinguish blocking issues from suggestions by prefixing "Nit:" or "Optional:". Approve when remaining comments are minor, trusting the author to address them. As an author, respond to every comment and keep discussions about the code.',
        ],
      },
      {
        title: 'Automated quality gates',
        paragraphs: [
          'Everything a machine can check, a machine should check, on every pull request: formatting (ruff format), linting (ruff), types (mypy/pyright), tests with coverage on changed lines, dependency vulnerability scanning (pip-audit, Dependabot), secret scanning, and static security analysis (Bandit, Semgrep, CodeQL). Fast gates run in pre-commit hooks; all run in CI. A red gate blocks the merge — no exceptions for "urgent" changes, which are exactly when mistakes happen.',
        ],
        code: `# .github/workflows/ci.yml (excerpt)
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.13" }
      - run: pip install -r requirements-dev.txt
      - run: ruff format --check . && ruff check .
      - run: mypy src
      - run: pytest --cov=src --cov-branch --cov-fail-under=80
      - run: pip-audit -r requirements.txt`,
        label: 'A quality gate in CI',
      },
      {
        title: 'A definition of done',
        paragraphs: [
          'Agree as a team what "done" means, write it down, and use it in reviews. A typical list: acceptance criteria met and demonstrated; tests added (unit plus integration where a boundary changed); all CI gates green; docs and changelog updated; security and privacy considered (threat model updated for new data flows); observability added (logs, metrics, alerts for the new path); feature flagged if risky; reviewed and approved. "Done" means users can safely get the value, not "the code compiles on my machine".',
        ],
      },
    ],
    table: {
      headers: ['Review focus', 'Question to ask', 'Typical finding'],
      rows: [
        ['Design', 'Is this the right approach and the right place?', 'Logic duplicated from an existing module'],
        ['Correctness', 'What happens on empty, huge, concurrent or failing input?', 'Missing error path'],
        ['Tests', 'Would these tests fail if the code were wrong?', 'Assertions missing on the important output'],
        ['Security', 'What can an attacker control here?', 'String-built SQL, missing authorisation check'],
        ['Readability', 'Will the next person understand it quickly?', 'Unclear names, a function doing three things'],
      ],
    },
    exercise: {
      scenario: 'You are reviewing a 60-line pull request that adds GET /admin/export?table=users, which runs f"SELECT * FROM {table}" and streams the result as CSV. It has one test that checks the endpoint returns status 200.',
      task: 'Write the three most important review comments, with reasons and a suggested fix.',
      answer: '1) Blocking — security: the table name is interpolated into SQL, so ?table=users;DROP TABLE … or any other table is injectable and exposes data. Allow-list exportable tables in a dict mapping names to fixed queries; never build SQL from input. 2) Blocking — authorisation: nothing checks that the caller is an admin; the /admin prefix is not access control. Add the admin permission check and a test proving a normal user gets 403. 3) Blocking — tests: the only test checks status 200, so it would pass even if the CSV were empty or wrong. Add tests asserting the header row and content for a seeded table, the 403 case, and rejection of an unknown table. Nit: stream with the csv module rather than manual string joins so quoting is correct.',
      evidence: 'Injection and missing authorisation identified as blocking, weak tests called out with concrete additions, and a clear blocking vs. nit distinction.',
    },
    misconceptions: [
      'TDD means writing all tests before any code. It is one tiny test at a time, interleaved with code.',
      'Code review is for finding typos. Its main value is design, correctness, security and spreading knowledge.',
      'Senior engineers do not need review. Everyone\'s code benefits; review is also how teams share context.',
      'Quality gates slow teams down. Fast automated gates remove whole categories of review discussion and production incidents.',
    ],
    sources: [S.googleReview, S.sweGoogle, S.pytest, S.ssdf],
    labs: [],
    quiz: [
      { question: 'What is the correct TDD cycle?', options: ['Code, test, deploy', 'Red, green, refactor', 'Design, code, review', 'Test, refactor, red'], answer: 1, explanation: 'Fail first, pass simply, then improve the design.' },
      { question: 'Why should you watch a new test fail before making it pass?', options: ['It is tradition', 'To confirm the test can actually detect the missing behaviour', 'Failing tests run faster', 'CI requires it'], answer: 1, explanation: 'A test that never failed might be testing nothing.' },
      { question: 'What should reviewers focus on first?', options: ['Whitespace', 'Design and correctness', 'Variable name length', 'Commit timestamps'], answer: 1, explanation: 'Style is for tools; humans focus on design and correctness.' },
      { question: 'How should a minor, non-blocking suggestion be marked?', options: ['In capital letters', 'With a "Nit:" or "Optional:" prefix', 'As a separate pull request', 'It should not be mentioned'], answer: 1, explanation: 'Labelling helps authors prioritise and keeps reviews moving.' },
      { question: 'Which belongs in a definition of done?', options: ['Code compiles on the author\'s machine', 'Acceptance criteria met, tests added, CI green, observability in place', 'The manager has seen a demo', 'The branch is at least a week old'], answer: 1, explanation: 'Done means safe, verified value for users.' },
    ],
  },
];
