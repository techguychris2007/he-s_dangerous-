import type { LessonDepth } from './types';

/** Practice depth for the professional Software Engineering lessons (SE 3–7), placed after each
 *  lesson's core sections: a realistic worked case carried end to end, the deeper mechanics behind
 *  the headline idea, the failure modes seen in real teams, and short exercises to try. */
export const SOFTWARE_ENGINEERING_PRACTICE_DEPTH: Record<string, LessonDepth> = {
  // ── SE 3 · The Engineering Mindset & Toolchain ───────────────────────────────────────────────
  'swe-1': {
    after: [
      {
        title: 'Worked case: one small change, five consequences',
        paragraphs: [
          `Imagine a student-records library with a function format_name(first, last) that returns "Mensah, Ama". A colleague asks for a version that returns "Ama Mensah". As a programming task this takes thirty seconds. As an engineering task it raises questions that take much longer to answer, and those questions are the job.`,
          `Who calls this function today? A search across the codebase finds three callers. A sorting screen depends on the comma, because it sorts by surname. A CSV export writes the value into a column that a finance spreadsheet parses. A third team copied the output format into a database report. None of them is mentioned in the docstring. This is Hyrum's Law in practice: the real contract is everything callers observe, not what you documented.`,
          `What are the options? (1) Change the existing function and fix every caller in the same change, which is possible only if you can see and test every caller. (2) Add a new function, format_display_name, and leave the old one alone. (3) Add a parameter, style="last_first", with the old behaviour as the default. Options 2 and 3 are additive, so semantic versioning would call the release a minor version. Option 1 is a breaking change and needs a major version, a migration note, and probably a deprecation period.`,
          `How long will this code live? If the library is a two-week prototype, option 1 is fine. If it is used by four teams for the next five years, the extra care of option 2 or 3 is cheap insurance. That is the core idea of this lesson: the same code change has a different correct answer depending on time, scale and the number of people affected.`,
        ],
        code: `import warnings

def format_name(first, last, style="last_first"):
    """Return a person's name for display.

    style="last_first"  -> "Mensah, Ama"   (default; unchanged since v1.0)
    style="first_last"  -> "Ama Mensah"    (added in v1.4)
    """
    if style == "last_first":
        return f"{last}, {first}"
    if style == "first_last":
        return f"{first} {last}"
    raise ValueError(f"unknown style: {style!r}")

def full_name(first, last):
    """Deprecated in v1.4: use format_name(first, last, style="first_last")."""
    warnings.warn("full_name is deprecated; use format_name(style='first_last')",
                  DeprecationWarning, stacklevel=2)
    return format_name(first, last, style="first_last")

print(format_name("Ama", "Mensah"))                      # Mensah, Ama
print(format_name("Ama", "Mensah", style="first_last"))  # Ama Mensah`,
        label: 'An additive, backward-compatible change',
      },
      {
        title: 'Technical debt: borrowing against the future',
        paragraphs: [
          `Technical debt is the extra future work created by choosing a quick solution now. Like financial debt, it is not automatically bad. A startup that hard-codes a price list to hit a launch date has taken a sensible loan. The trouble starts when nobody records the loan and the "interest" (every later change taking longer) keeps growing.`,
          `Martin Fowler's debt quadrant is a useful way to talk about it. Debt can be deliberate or inadvertent, and prudent or reckless. "We know this will not scale past 1,000 users; we will revisit in Q3" is deliberate and prudent. "What is a test?" is inadvertent and reckless. Inadvertent, prudent debt also exists: "Now we understand the domain, we see how we should have designed it." That one is unavoidable, and it is why refactoring is part of normal work.`,
          `Healthy teams make debt visible: a ticket with the reason, the cost of leaving it, and the trigger for paying it back ("before we add a second payment provider"). They pay some down continuously, typically by leaving each file a little better than they found it, instead of waiting for a rewrite that rarely gets approved.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Pick a function you wrote in SE 1–2. List every behaviour a caller could observe, including error messages, output order and speed. Which of those would you be comfortable changing without warning?`,
          `2. A library is at version 2.3.1. Decide the next version number for each change: a bug fix; a new optional parameter; removing a deprecated function; changing a default value.`,
          `3. Write a one-paragraph debt record for a shortcut you have taken in your own code: what it is, why you took it, what it costs, and when it should be repaid.`,
        ],
      },
    ],
  },
  'swe-2': {
    after: [
      {
        title: 'Worked case: a feature from branch to merge',
        paragraphs: [
          `Here is the full life of a small feature in a trunk-based team, with the commands at each step. The task: add a late-submission penalty to a grading service. Start by updating your local main so you branch from the latest shared state, then create a short-lived branch named for the work.`,
          `Commit in small, meaningful steps. The first commit adds a failing test; the second implements the rule; the third updates the documentation. Each commit builds and passes tests on its own, so anyone running git bisect later can land on any of them safely.`,
          `Before opening the pull request, bring your branch up to date with main. In a team that prefers linear history, you rebase. If the rebase reports a conflict, Git stops and marks the conflicting region in the file. You edit the file to the correct combined result, remove the markers, git add it, and run git rebase --continue. Then run the tests again, because a clean textual merge can still be a broken program.`,
          `Push and open the PR with a description that says what changed, why, and how it was tested. After approval, the branch is merged and deleted. The whole cycle should take hours or a day or two, not weeks; long-lived branches are where painful conflicts come from.`,
        ],
        code: `git switch main && git pull --ff-only
git switch -c feat/late-penalty

# ...write a failing test...
git add tests/test_penalty.py
git commit -m "Add failing test for 10% late penalty"

# ...implement...
git add grading/penalty.py
git commit -m "Apply 10% penalty per day late, capped at 50%"

git fetch origin
git rebase origin/main          # replay your commits on the latest main
# CONFLICT in grading/penalty.py -> edit, then:
git add grading/penalty.py
git rebase --continue
pytest                          # re-test after any conflict resolution

git push -u origin feat/late-penalty
# open the pull request; after approval and merge:
git switch main && git pull --ff-only && git branch -d feat/late-penalty`,
        label: 'Branch, commit, rebase, push',
      },
      {
        title: 'Undoing things safely',
        paragraphs: [
          `Every Git user eventually needs to undo something, and the right command depends on one question: has this commit been shared with others yet?`,
          `If it has not been pushed, you can rewrite freely. git commit --amend fixes the last commit's message or adds a forgotten file. git reset --soft HEAD~1 removes the last commit but keeps its changes staged, so you can redo it. git restore file.py throws away uncommitted edits to a file (permanently, so be sure).`,
          `If it has been pushed, do not rewrite it; other people may already have built on it. Use git revert <commit>, which creates a new commit that undoes the old one. History stays honest and nobody's copy breaks.`,
          `And if you think you have lost work, you almost certainly have not. git reflog lists every position your HEAD has been in recently, including commits that no branch points to any more. Find the hash and git switch -c rescue <hash> brings it back.`,
        ],
        code: `git commit --amend -m "Better message"   # fix the last (unpushed) commit
git reset --soft HEAD~1                   # undo last commit, keep changes staged
git restore grading/penalty.py            # discard uncommitted edits (careful)
git revert 3f9c2a1                        # undo a PUSHED commit with a new commit
git reflog                                # find "lost" commits
git switch -c rescue 7b1e044              # recover one onto a new branch`,
        label: 'The undo toolkit',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. In a practice repository, create two branches that edit the same line differently, merge one, then rebase the other onto main and resolve the conflict by hand.`,
          `2. Rewrite these commit messages to explain why: "fix", "update stuff", "changes from review".`,
          `3. Commit a file by mistake, then remove it from the last commit without losing your other changes. Which command did you use, and would you use the same one if you had already pushed?`,
        ],
      },
    ],
  },
  'swe-3': {
    after: [
      {
        title: 'Worked case: the average that is sometimes wrong',
        paragraphs: [
          `A bug report says: "The class average on the dashboard is sometimes higher than every student's score." That word "sometimes" is the first clue. Deterministic code given the same input always does the same thing, so either the inputs differ between runs or something hidden (time, order, shared state) is changing.`,
          `Reproduce: you ask for an example and get a class where scores are [72, 65, 80] and the dashboard shows 108.5. You call the function directly with those numbers and get 72.33, which is correct. So the function is fine with this input, and the input reaching it must be different. Your first hypothesis: the dashboard passes something other than the raw list.`,
          `Isolate with logging at the boundary: log the exact arguments the dashboard passes. The log shows [72, 65, 80, 72, 65, 80] on the second page load. The scores have been appended twice. Hypothesis two: the list is shared between requests. You search for where it is built and find a function with a mutable default argument, def load_scores(course, cache=[]), which you met in SE 1. On every call it appends to the same list.`,
          `Wait: [72, 65, 80, 72, 65, 80] averages to 72.33 too. The numbers still do not match 108.5, so there is a second effect. Following the evidence, you find the dashboard divides by the number of students (3), not by the length of the list (6). Two bugs combined to produce the symptom. Fix both causes, add a regression test that calls load_scores twice and asserts the second result has three scores, and add a test that the average never exceeds the maximum. That last test is a property, and it would catch future bugs of the same class.`,
        ],
        code: `# Before: two bugs that only show up together on the second request
def load_scores(course, cache=[]):        # bug 1: shared mutable default
    cache.extend(DB[course])
    return cache

def dashboard_average(course, student_count):
    scores = load_scores(course)
    return round(sum(scores) / student_count, 2)   # bug 2: wrong divisor

DB = {"SE101": [72, 65, 80]}
print(dashboard_average("SE101", 3))   # 72.33
print(dashboard_average("SE101", 3))   # 144.67  wrong, and different each time

# After: fix both causes, then lock them in with tests
def load_scores(course):
    return list(DB[course])

def dashboard_average(course):
    scores = load_scores(course)
    return round(sum(scores) / len(scores), 2)

def test_repeated_loads_do_not_accumulate():
    load_scores("SE101")
    assert load_scores("SE101") == [72, 65, 80]

def test_average_within_range():
    scores = load_scores("SE101")
    assert min(scores) <= dashboard_average("SE101") <= max(scores)`,
        label: 'Two causes, one symptom, two regression tests',
      },
      {
        title: 'Reading a stack trace from a real program',
        paragraphs: [
          `In professional code a traceback can be fifty lines long, mostly through frameworks and libraries you did not write. Do not read it top to bottom. Read the last line first (the exception type and message), then scan upwards for the first frame in your own code. That frame is usually where the wrong value was used, though not always where it was created.`,
          `Chained exceptions add a second layer. "During handling of the above exception, another exception occurred" or "The above exception was the direct cause of the following exception" means there are two tracebacks: the original problem at the top, and what happened while dealing with it at the bottom. The original cause is often the more useful one.`,
          `When the failing value came from much earlier, ask "where did this value come from?" and follow it backwards through the code, one assignment at a time. Debuggers make this fast. In pdb or your editor, set a breakpoint, inspect the variable, then use the "up" command to see the caller's variables.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Take a program with a known bug and write down, before touching the code, three specific hypotheses and the one observation that would rule each in or out.`,
          `2. In a small repository, introduce a bug in one of twenty commits, then find it with git bisect run pytest. How many steps did Git need?`,
          `3. Replace the print() calls in one of your programs with the logging module at DEBUG level. Run it once with level=INFO and once with level=DEBUG and compare.`,
        ],
      },
    ],
  },
  'swe-4': {
    after: [
      {
        title: 'Worked case: from a vague request to testable criteria',
        paragraphs: [
          `The request arrives as one sentence from a head of department: "We need students to be able to submit assignments online." It sounds clear, but it hides dozens of decisions. Writing good requirements means turning that sentence into specific, agreed statements a tester could check.`,
          `Start by asking questions, grouped by who cares. Students: What file types? How large? Can I resubmit before the deadline? Do I get a receipt? Lecturers: Can I see who has not submitted? Are late submissions allowed, and marked as late? Administrators: How long must submissions be kept? Who can see them? Each answer becomes a functional or non-functional requirement.`,
          `Then write stories and criteria for the most important behaviour. The examples below cover the late-submission rule, which is where disagreements usually hide. Notice how each criterion names a concrete time and outcome. "Late submissions are handled appropriately" cannot be tested; "a submission at 23:59:59 is on time and one at 00:00:00 is late" can.`,
          `Finally, list what you are deliberately not doing in this version (plagiarism checking, group submissions). A clear out-of-scope list prevents the most common project failure, where everyone agreed on different things without noticing.`,
        ],
        code: `Story: As a student, I want to submit my assignment before the deadline
       so that it is marked without penalty.

Scenario: Submission just before the deadline is on time
  Given the deadline is 2026-11-14 23:59:59 Africa/Accra
  When I upload "report.pdf" (2 MB) at 2026-11-14 23:59:59
  Then the submission is recorded as "on time"
  And I receive a receipt with the exact timestamp

Scenario: Submission at the deadline boundary is late
  Given the deadline is 2026-11-14 23:59:59 Africa/Accra
  When I upload at 2026-11-15 00:00:00
  Then the submission is recorded as "late, 1 day"

Scenario: Oversized file is rejected with a reason
  When I upload a 30 MB file
  Then the upload is refused with "Files must be 20 MB or smaller"
  And nothing is stored

Non-functional: 95% of uploads up to 20 MB complete within 10 s on a 10 Mbps link.
Out of scope (v1): plagiarism checks, group submissions, peer review.`,
        label: 'Stories, scenarios and a scope boundary',
      },
      {
        title: 'Making non-functional requirements measurable',
        paragraphs: [
          `Non-functional requirements (performance, availability, security, usability, accessibility) are where vague words do the most damage. "The system must be fast" or "highly available" gives a developer nothing to build towards and a tester nothing to check.`,
          `A useful template is: under [condition], [measurable quantity] must be [threshold], measured by [method]. For example: "Under 500 concurrent users, the 95th percentile response time for the submission page must be under 800 ms, measured by the weekly load test." Or: "The submission service must be available 99.5% of each calendar month, measured by the uptime monitor, excluding announced maintenance."`,
          `Accessibility deserves explicit requirements too, such as "all pages meet WCAG 2.2 level AA, checked with an automated scan and a manual keyboard-only test before release." Without that, it tends to be skipped until a student who relies on a screen reader cannot submit their work.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Take the request "Add a search feature to the library app" and write ten clarifying questions, grouped by stakeholder.`,
          `2. Rewrite these as measurable requirements: "The app should load quickly"; "Passwords must be secure"; "The system should handle lots of users."`,
          `3. Write three Given/When/Then scenarios for a password-reset feature, including one for an expired reset link.`,
        ],
      },
    ],
  },

  // ── SE 4 · Software Construction ─────────────────────────────────────────────────────────────
  'swe-5': {
    after: [
      {
        title: 'Worked case: specifying a function before writing it',
        paragraphs: [
          `Suppose you must write a function that splits a bill among friends. Writing the code first and the documentation later leads to surprises, so we write the specification first, then let it drive the implementation and the tests.`,
          `The specification answers every question a caller might have. What are the inputs and their types? What must be true of them (preconditions)? What does the function guarantee about its output (postconditions)? What happens when a precondition is broken? Here the interesting decision is rounding: 100 split three ways is 33.333..., and a bill must add up to exactly the original amount.`,
          `We work in pesewas (integers) to avoid floating-point surprises, and we distribute the leftover pesewas one each to the first people. The postcondition "the shares sum to the total" is strong and easy to check, so we also assert it in a test with many inputs. The spec turned a vague task into precise, checkable behaviour.`,
        ],
        code: `def split_bill(total_pesewas: int, people: int) -> list[int]:
    """Split a bill into near-equal integer shares.

    Preconditions:
      total_pesewas >= 0, people >= 1 (ValueError otherwise).
    Postconditions:
      len(result) == people
      sum(result) == total_pesewas
      max(result) - min(result) <= 1
      larger shares come first.
    """
    if total_pesewas < 0 or people < 1:
        raise ValueError("total must be >= 0 and people >= 1")
    base, leftover = divmod(total_pesewas, people)
    return [base + 1] * leftover + [base] * (people - leftover)

print(split_bill(10000, 3))   # [3334, 3333, 3333]

def test_split_postconditions():
    for total in range(0, 2000, 7):
        for people in range(1, 9):
            shares = split_bill(total, people)
            assert len(shares) == people
            assert sum(shares) == total
            assert max(shares) - min(shares) <= 1`,
        label: 'Spec first, then code, then a test of the postconditions',
      },
      {
        title: 'Design by contract in practice',
        paragraphs: [
          `The idea of contracts comes from Bertrand Meyer's Eiffel language: the caller promises the preconditions, and in exchange the function promises the postconditions. If a precondition is broken, the bug is in the caller. If a postcondition is broken, the bug is in the function. That clear division of blame makes large systems debuggable.`,
          `In Python there are three ways to state a contract, and they fit different situations. At public boundaries (user input, web requests, files), always validate and raise a clear exception, because the caller may be outside your control. Between internal functions you wrote, assert can document and check assumptions during development and testing. Type hints, checked by tools such as mypy or pyright, cover the "what kind of value" part of every contract at no runtime cost.`,
          `Remember that Python removes assert statements when run with the -O flag, so never use assert for checks your program's safety depends on, such as permission checks or input validation.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write a full specification (types, pre- and postconditions, errors) for a function that returns the median of a list of numbers. What should happen for an empty list? For an even-length list?`,
          `2. Compare two specs for find(items, target): "returns an index of target" versus "returns the lowest index of target". Which is stronger, and which implementations satisfy each?`,
          `3. Add type hints to three functions you wrote in SE 1–2 and run mypy over them. Did it find anything?`,
        ],
      },
    ],
  },
  'swe-6': {
    after: [
      {
        title: 'Worked case: a Money type that cannot be misused',
        paragraphs: [
          `Money is a classic place for bugs: adding cedis to dollars, floating-point rounding, negative amounts where they make no sense. A small abstract data type can rule out all of these at once, so the rest of the program never has to think about them.`,
          `The representation is two fields: an integer number of minor units (pesewas, cents) and a three-letter currency code. The representation invariant states what must always be true: minor is an int and currency is one of the supported codes. The abstraction function says what a representation means: Money(1250, "GHS") represents GHS 12.50.`,
          `Making the class a frozen dataclass makes it immutable, so once a Money value is checked, it can never become invalid. Operations return new Money objects. Adding different currencies raises an error instead of producing nonsense. Because instances are immutable and compare by value, they are also safe to use as dictionary keys and to share between threads.`,
        ],
        code: `from dataclasses import dataclass

SUPPORTED = {"GHS", "USD", "EUR"}

@dataclass(frozen=True)
class Money:
    minor: int          # pesewas / cents
    currency: str

    # Rep invariant: type(minor) is int and currency in SUPPORTED
    # Abstraction function: Money(m, c) represents m / 100 units of currency c
    def __post_init__(self):
        if type(self.minor) is not int:
            raise TypeError("minor units must be an int")
        if self.currency not in SUPPORTED:
            raise ValueError(f"unsupported currency {self.currency!r}")

    def __add__(self, other: "Money") -> "Money":
        if other.currency != self.currency:
            raise ValueError(f"cannot add {other.currency} to {self.currency}")
        return Money(self.minor + other.minor, self.currency)

    def __str__(self):
        return f"{self.currency} {self.minor / 100:,.2f}"

a = Money(1250, "GHS")
b = Money(375, "GHS")
print(a + b)                      # GHS 16.25
print(a == Money(1250, "GHS"))    # True: equality by value
for bad in (lambda: a + Money(100, "USD"), lambda: Money(12.5, "GHS")):
    try:
        bad()
    except (ValueError, TypeError) as err:
        print(type(err).__name__, err)
# ValueError cannot add USD to GHS
# TypeError minor units must be an int`,
        label: 'An immutable Money ADT with a checked invariant',
      },
      {
        title: 'Spotting rep exposure in code review',
        paragraphs: [
          `Rep exposure happens when outside code gets a reference to a mutable internal part of an object and can change it without going through the object's methods. Then the invariant can be broken from outside, and the class can no longer guarantee anything.`,
          `Three patterns cause almost every case. A getter that returns an internal list or dict directly. A constructor that stores a list the caller passed in, so the caller still holds a reference to it. And a public mutable attribute. Each has a simple fix: return a copy or an immutable view (a tuple, or types.MappingProxyType for a dict); copy inputs in the constructor; and make the attribute private behind a method or property.`,
          `When reviewing a class, ask for each attribute: "Can anyone outside this class change this without calling one of its methods?" If yes, either the invariant does not depend on it, or there is rep exposure to fix.`,
        ],
        code: `class Course:
    def __init__(self, code, students):
        self._code = code
        self._students = list(students)     # defensive copy of the input

    def students(self):
        return tuple(self._students)        # read-only view, not the list

    def enrol(self, name):
        if name in self._students:
            raise ValueError(f"{name} already enrolled")
        self._students.append(name)

names = ["Ama", "Kojo"]
c = Course("SE101", names)
names.append("Intruder")         # does not affect the course
print(c.students())              # ('Ama', 'Kojo')`,
        label: 'Defensive copies at the boundary',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write the rep invariant and abstraction function for a DateRange(start, end) type. Implement it as a frozen dataclass that rejects end < start.`,
          `2. Find a class in your own code with a getter returning a list. Show, with a three-line script, that a caller can break it; then fix it.`,
          `3. Add a split(n) method to Money that returns n Money values summing exactly to the original, reusing the idea from the previous lesson's split_bill.`,
        ],
      },
    ],
  },
  'swe-7': {
    after: [
      {
        title: 'Worked case: error handling across the layers of a small service',
        paragraphs: [
          `A request to transfer money passes through three layers: the HTTP handler, the service logic, and the database. Each layer has a different job when something goes wrong, and mixing those jobs is how error handling becomes a mess.`,
          `The domain layer raises specific, meaningful exceptions from the application's own hierarchy, such as InsufficientFunds or AccountNotFound. It does not know about HTTP status codes or how to phrase a message for a user. The infrastructure layer translates low-level errors (a database driver's error) into the application's own exceptions using raise ... from err, so the original cause is preserved for debugging.`,
          `The outermost layer, the HTTP handler, is the only place that decides what the user sees. It maps each application exception to a status code and a safe message, logs the full detail with a correlation id, and returns a generic 500 for anything unexpected. Internal details such as SQL, file paths and stack traces never reach the client.`,
        ],
        code: `import logging, uuid
log = logging.getLogger("transfers")

class AppError(Exception): ...
class NotFound(AppError): ...
class InsufficientFunds(AppError): ...
class StorageUnavailable(AppError): ...

def load_balance(account_id):                # infrastructure layer
    try:
        return FAKE_DB[account_id]
    except KeyError as err:
        raise NotFound(f"account {account_id}") from err
    except ConnectionError as err:
        raise StorageUnavailable("balance store unreachable") from err

def transfer(src, dst, amount):              # domain layer
    if load_balance(src) < amount:
        raise InsufficientFunds(f"{src} cannot send {amount}")
    load_balance(dst)
    return "ok"

STATUS = {NotFound: 404, InsufficientFunds: 409, StorageUnavailable: 503}

def handle_transfer_request(src, dst, amount):   # HTTP boundary
    try:
        return 200, transfer(src, dst, amount)
    except AppError as err:
        return STATUS.get(type(err), 400), str(err)
    except Exception:
        ref = uuid.uuid4().hex[:8]
        log.exception("unexpected error ref=%s", ref)
        return 500, f"Something went wrong (reference {ref})"

FAKE_DB = {"A1": 500, "B2": 20}
print(handle_transfer_request("A1", "B2", 100))   # (200, 'ok')
print(handle_transfer_request("B2", "A1", 100))   # (409, 'B2 cannot send 100')
print(handle_transfer_request("A1", "Z9", 10))    # (404, 'account Z9')`,
        label: 'Raise specific, translate at boundaries, report once',
      },
      {
        title: 'Retries are error handling too',
        paragraphs: [
          `Some failures are transient: a network blip, a database briefly overloaded, a rate limit. Retrying those after a short wait often succeeds. Other failures are permanent: invalid input, a missing record, a permissions error. Retrying those only wastes time and can make an outage worse.`,
          `So classify before you retry. A retry policy should list which exceptions are retryable, cap the number of attempts, and wait longer between attempts (exponential backoff, covered fully in SE 7). It should only retry operations that are safe to repeat; retrying a payment that might already have succeeded can charge a customer twice.`,
          `Finally, log once. If every layer logs the same exception on its way up, one failure produces five log entries and hides the real signal. A good rule is that the layer that handles the error (decides what happens next) is the one that logs it.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Design an exception hierarchy for a library-loans system: which errors are there, and which HTTP status should each map to?`,
          `2. Find a bare except: or except Exception: pass in any code you have written. Replace it with specific handling, or remove it and let the error surface.`,
          `3. Write a context manager with contextlib.contextmanager that times a block of code and logs the duration even if the block raises.`,
        ],
      },
    ],
  },
  'swe-8': {
    after: [
      {
        title: 'Worked case: refactoring a real function in small, safe steps',
        paragraphs: [
          `Below is the kind of function every codebase contains: it works, but it is long, mixes responsibilities, and nobody wants to touch it. It calculates a shipping quote, and the business wants to add a new region. We will refactor it first, without changing behaviour, so that the new feature becomes easy.`,
          `Step 0: pin the behaviour with characterization tests. We do not need to know whether every result is "correct"; we record what the function does today for a spread of inputs, so we notice any accidental change. Step 1: rename unclear variables (w, r, t). Step 2: extract the rate lookup into data, a dictionary, instead of an if/elif chain. Step 3: extract the surcharge rule into its own function. Run the tests after every step.`,
          `The result is shorter, each part has one reason to change, and adding a new region is now a one-line change to a dictionary rather than a new branch in a long chain. That is the purpose of refactoring: to make the next change cheap.`,
        ],
        code: `# Before
def q(w, r, t):
    if r == "accra":
        p = 10 + w * 2
    elif r == "kumasi":
        p = 15 + w * 2.5
    elif r == "tamale":
        p = 25 + w * 3
    else:
        raise ValueError("bad region")
    if t == "express":
        p = p * 1.5
        if p < 40:
            p = 40
    return round(p, 2)

# Step 0: characterization test (record current behaviour first)
CASES = [(1, "accra", "std"), (3, "kumasi", "express"), (10, "tamale", "std"),
         (0, "accra", "express"), (2.5, "kumasi", "std")]
EXPECTED = {c: q(*c) for c in CASES}

# After
RATES = {"accra": (10, 2.0), "kumasi": (15, 2.5), "tamale": (25, 3.0)}
EXPRESS_MULTIPLIER, EXPRESS_MINIMUM = 1.5, 40

def apply_express(price):
    return max(price * EXPRESS_MULTIPLIER, EXPRESS_MINIMUM)

def shipping_quote(weight_kg, region, service="standard"):
    try:
        base, per_kg = RATES[region]
    except KeyError:
        raise ValueError(f"unknown region {region!r}") from None
    price = base + weight_kg * per_kg
    if service == "express":
        price = apply_express(price)
    return round(price, 2)

assert all(shipping_quote(w, r, "express" if t == "express" else "standard") == EXPECTED[(w, r, t)]
           for (w, r, t) in CASES)
print("behaviour preserved")   # behaviour preserved`,
        label: 'Characterize, rename, extract, replace conditional with data',
      },
      {
        title: 'Comments: what to write and what to delete',
        paragraphs: [
          `Good code explains what it does through names and structure, so comments that restate the code (i += 1  # add one to i) are noise that drifts out of date. Delete them.`,
          `Comments earn their place when they explain why: a business rule ("Express has a GHS 40 minimum because the courier charges per pickup"), a non-obvious decision ("We sort twice because the API returns pages in random order"), a warning ("Do not cache this; prices change hourly"), or a link to the issue or standard behind the code.`,
          `Docstrings are different: they are the specification for callers and should describe behaviour, parameters, return value and errors. Tools display them in editors and generate documentation from them, so keep them accurate.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write characterization tests for a function you did not write (or one from an old project), then refactor it in at least three separate steps, running the tests after each.`,
          `2. Run ruff check and ruff format on one of your projects. Read three of the rules it flags and decide whether you agree with each.`,
          `3. Go through a file you wrote and classify every comment as "why" (keep), "what" (delete or replace with a better name) or "stale" (fix or delete).`,
        ],
      },
    ],
  },

  // ── SE 5 · Testing & Quality ─────────────────────────────────────────────────────────────────
  'swe-9': {
    after: [
      {
        title: 'Worked case: designing tests for a password-strength rule',
        paragraphs: [
          `Rule: a password is acceptable if it has 12 to 64 characters, is not in a list of common passwords, and does not contain the username (case-insensitive). How do we choose a small set of tests that would catch most bugs in an implementation?`,
          `Partition each input dimension. Length: below 12, 12 to 64, above 64. Common list: in it, not in it. Username: contained (same case), contained (different case), not contained. Then add boundary values for length: 11, 12, 64, 65, and 0 (empty). Each test should exercise one partition or boundary at a time, with every other dimension in its "valid" partition, so a failure points at one cause.`,
          `This gives about ten tests instead of the infinite number of possible passwords, and each one exists for a reason you can name. When a test fails, its name tells you which part of the rule broke.`,
        ],
        code: `import pytest

COMMON = {"password1234", "qwertyuiop12"}

def acceptable(password, username):
    return (12 <= len(password) <= 64
            and password.lower() not in COMMON
            and username.lower() not in password.lower())

GOOD = "violet-river-42"

@pytest.mark.parametrize("pw, ok", [
    ("",            False),   # empty
    ("a" * 11,      False),   # just below min
    ("a" * 12,      True),    # exactly min
    ("a" * 64,      True),    # exactly max
    ("a" * 65,      False),   # just above max
    ("password1234", False),  # common
    ("PASSWORD1234", False),  # common, different case
])
def test_length_and_common(pw, ok):
    assert acceptable(pw, "ama") is ok

@pytest.mark.parametrize("pw, ok", [
    ("ama-violet-river", False),   # contains username
    ("AMA-violet-river", False),   # contains username, other case
    (GOOD,               True),    # does not contain it
])
def test_username(pw, ok):
    assert acceptable(pw, "ama") is ok`,
        label: 'Partitions and boundaries as parametrised tests',
      },
      {
        title: 'Combinatorial explosion and pairwise testing',
        paragraphs: [
          `When a feature has many independent options, testing every combination quickly becomes impossible. A form with five fields that each have four interesting values has 4^5 = 1,024 combinations. Most bugs, however, are triggered by a single value or by the interaction of just two values.`,
          `Pairwise (all-pairs) testing exploits this: it chooses a small set of cases in which every pair of values from any two fields appears together at least once. For the five-by-four example, around 16–20 cases cover every pair. Tools such as allpairspy generate these sets for you.`,
          `Use pairwise testing for configuration-heavy features (browsers × operating systems × languages, or payment method × currency × country). Keep explicit, hand-written tests for the boundaries and for any combination with a known business rule.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. List the partitions and boundaries for a function that applies a discount: 10% for orders of GHS 100–499.99, 20% from GHS 500, none below 100, and an error for negative totals. Write them as a parametrised test.`,
          `2. Run coverage on one of your test suites (pytest --cov). Find one line that is covered but whose behaviour is not actually checked by any assertion.`,
          `3. Introduce a deliberate off-by-one bug (< instead of <=) into the password rule and check which of the tests above fail. If none do, which test is missing?`,
        ],
      },
    ],
  },
  'swe-10': {
    after: [
      {
        title: 'Worked case: testing code that depends on time and the network',
        paragraphs: [
          `A function sends a reminder email to students whose assignment is due in less than 24 hours. As first written, it calls datetime.now() and an email library directly. That makes it almost impossible to test: the result depends on when you run the test, and every run would send real emails.`,
          `The fix is to inject what varies. The function takes the current time and an email sender as parameters. In production we pass the real clock and the real sender. In tests we pass a fixed time and a fake sender that just records messages in a list. Nothing is patched, and the tests are fast, deterministic and readable.`,
          `Notice which test double fits. The clock is a stub: it just provides a value. The sender is a fake (or spy): a simple working implementation that records calls, which we then inspect. We assert on the outcome, who was emailed, rather than on the exact sequence of internal calls, so the test survives harmless refactoring.`,
        ],
        code: `from datetime import datetime, timedelta

def send_reminders(assignments, now, sender):
    """Email each student whose deadline is within the next 24 hours."""
    for a in assignments:
        if now <= a["due"] < now + timedelta(hours=24):
            sender.send(a["email"], f"Reminder: {a['title']} is due soon")

class FakeSender:
    def __init__(self):
        self.sent = []
    def send(self, to, body):
        self.sent.append((to, body))

def test_only_assignments_due_within_24h_get_reminders():
    now = datetime(2026, 11, 14, 9, 0)
    assignments = [
        {"email": "ama@ug.edu.gh",  "title": "Lab 3", "due": now + timedelta(hours=5)},
        {"email": "kojo@ug.edu.gh", "title": "Lab 4", "due": now + timedelta(hours=30)},
        {"email": "esi@ug.edu.gh",  "title": "Lab 2", "due": now - timedelta(hours=1)},
    ]
    sender = FakeSender()
    send_reminders(assignments, now, sender)
    assert [to for to, _ in sender.sent] == ["ama@ug.edu.gh"]

test_only_assignments_due_within_24h_get_reminders()
print("passed")   # passed`,
        label: 'Inject the clock and the sender',
      },
      {
        title: 'When mocks hurt, and what to do instead',
        paragraphs: [
          `Mocks are powerful but easy to overuse. A test that mocks four collaborators and asserts that each was called with exact arguments in an exact order is really a copy of the implementation. Rename a method or merge two calls and the test fails, even though behaviour is unchanged. Teams with many such tests start to fear refactoring, which defeats the point of testing.`,
          `Prefer, in order: real objects when they are fast and deterministic (a dataclass, a pure function); fakes for infrastructure (an in-memory repository, a fake sender); and mocks only to verify an interaction that is the actual purpose of the code, such as "an audit event is published when an admin deletes a user".`,
          `Only mock what you own. If you mock a third-party library's API directly, your test passes even when your understanding of that library is wrong. Wrap the library in a small adapter you own, fake the adapter in unit tests, and test the adapter itself against the real library in a few integration tests.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Find a function in your code that calls datetime.now(), random or input() directly. Refactor it so the varying part is a parameter, then write a deterministic test.`,
          `2. Write a pytest fixture that creates a temporary folder with three sample files (hint: the built-in tmp_path fixture), and use it in two tests.`,
          `3. Rewrite a test that uses a mock with assert_called_once_with into one that checks the observable outcome instead. Which version would survive a refactor better?`,
        ],
      },
    ],
  },
  'swe-11': {
    after: [
      {
        title: 'Worked case: a property-based test finds a bug the examples missed',
        paragraphs: [
          `A team writes a function to compress strings using run-length encoding: "aaabcc" becomes "3a1b2c". Their example tests pass. Then someone adds a property-based test with Hypothesis stating a simple law: decoding an encoded string always gives back the original.`,
          `Within a second, Hypothesis reports a failing input: "0". Encoding gives "10", which the decoder reads as "ten copies of nothing". Digits in the input clash with the counts. No one thought to include a digit in the examples, but Hypothesis generates many kinds of strings and then shrinks any failure to the smallest example that still fails, which makes the cause obvious.`,
          `The fix is to change the format (for example, put a separator after each count, or restrict inputs to letters and document that as a precondition). The property test stays in the suite, protecting every future change to either function.`,
        ],
        code: `from hypothesis import given, strategies as st
from itertools import groupby
import re

def encode(s):
    return "".join(f"{len(list(g))}{ch}" for ch, g in groupby(s))

def decode(s):
    return "".join(ch * int(n) for n, ch in re.findall(r"(\\d+)(\\D)", s))

@given(st.text())
def test_round_trip(s):
    assert decode(encode(s)) == s

# pytest output (abridged):
#   Falsifying example: test_round_trip(s='0')
#   AssertionError: assert '' == '0'

# One fix: a separator the payload cannot contain, so counts are unambiguous
def encode(s):
    return "".join(f"{len(list(g))}:{ch}" for ch, g in groupby(s))

def decode(s):
    return "".join(ch * int(n) for n, ch in re.findall(r"(\\d+):(.)", s, flags=re.S))`,
        label: 'A round-trip property and the shrunk counterexample',
      },
      {
        title: 'Useful properties when you cannot name the exact answer',
        paragraphs: [
          `The hardest part of property-based testing is thinking of properties. A handful of patterns cover most cases. Round trip: decode(encode(x)) == x, also parse/format, serialize/deserialize. Invariants: sorting keeps the same items and the same length; a discount never makes a price negative. Idempotence: normalising twice gives the same result as normalising once.`,
          `Comparison with an oracle: a slow but obviously correct version must agree with the fast version. Metamorphic relations: if you add an item to a cart, the total cannot go down; searching for a longer, more specific term cannot return more results than a shorter one.`,
          `Combine properties with a few hand-picked examples. Properties catch the inputs you did not imagine; examples document the cases the business cares about and serve as readable specifications for the next developer.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write a Hypothesis test that checks sorted(xs) has the same length as xs, contains the same items, and is in non-decreasing order.`,
          `2. Write an integration test for a function that stores and loads users with SQLite, using an in-memory database (":memory:") created fresh for each test.`,
          `3. Find a test that sometimes fails in a project you know (or create one using random or time). Identify its cause from the list in this lesson and make it deterministic.`,
        ],
      },
    ],
  },
  'swe-12': {
    after: [
      {
        title: 'Worked case: one TDD session, cycle by cycle',
        paragraphs: [
          `Task: a function that turns a number of seconds into a friendly duration such as "1 h 5 min". We will do it with test-driven development, one small cycle at a time, so you can see the rhythm instead of just the result.`,
          `Cycle 1, red: test that 0 seconds is "0 s". Green: return "0 s", deliberately the simplest thing. Cycle 2, red: 45 seconds is "45 s". Green: return f"{seconds} s". Cycle 3, red: 60 seconds is "1 min". Green: add a branch for minutes. Cycle 4, red: 3,900 seconds is "1 h 5 min". Green: add hours. Refactor: the branches now repeat a pattern, so we replace them with a loop over units.`,
          `Each test drove one small decision, and the refactor step happened only when there was duplication to remove, with all tests green to protect it. The final suite doubles as documentation of every format the function supports.`,
        ],
        code: `import pytest

UNITS = [("h", 3600), ("min", 60), ("s", 1)]

def friendly(seconds: int) -> str:
    if seconds == 0:
        return "0 s"
    parts = []
    for name, size in UNITS:
        amount, seconds = divmod(seconds, size)
        if amount:
            parts.append(f"{amount} {name}")
    return " ".join(parts)

@pytest.mark.parametrize("seconds, text", [
    (0, "0 s"),          # cycle 1
    (45, "45 s"),        # cycle 2
    (60, "1 min"),       # cycle 3
    (3900, "1 h 5 min"), # cycle 4
    (3661, "1 h 1 min 1 s"),
])
def test_friendly(seconds, text):
    assert friendly(seconds) == text`,
        label: 'The test list that drove the design',
      },
      {
        title: 'A code review checklist that finds real problems',
        paragraphs: [
          `Research on code review at Microsoft and Google found that its biggest benefits are knowledge sharing and finding design and maintainability problems, more than catching individual bugs. Reviews work best when they are small (under about 400 lines), fast (within a working day) and focused on the things tools cannot check.`,
          `A practical order for reading a pull request: (1) Read the description; is the problem worth solving and is this the right approach? (2) Read the tests; do they describe the intended behaviour, including edge cases and failure paths? (3) Read the code for correctness: boundaries, error handling, concurrency, resource clean-up. (4) Security and data: is input validated, are permissions checked, are secrets kept out? (5) Readability: would a new team member understand this in six months?`,
          `Style issues (formatting, import order, naming conventions) should be handled by automated tools before review starts, so human attention goes to the questions above.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Use TDD to build a function that validates Ghanaian mobile numbers (10 digits starting with 02 or 05, or +233 followed by 9 digits). Write down your test list first.`,
          `2. Review a pull request from an open-source project you use. Write one comment for each of the five review areas above, phrased as a question or suggestion with a reason.`,
          `3. Write a definition of done for your own projects with no more than eight items. Which item are you most likely to skip, and how could you automate it?`,
        ],
      },
    ],
  },

  // ── SE 6 · Software Design & Architecture ────────────────────────────────────────────────────
  'swe-13': {
    after: [
      {
        title: 'Worked case: untangling a report generator',
        paragraphs: [
          `The class below generates a monthly sales report. It works, but every change is risky: it queries the database, applies business rules, formats HTML and sends email, all in one method. A change to the email provider means editing the same method as a change to the discount rules. It has low cohesion (unrelated jobs together) and high coupling (hard-wired to specific technologies).`,
          `We separate it along its reasons to change. Fetching data, calculating figures, formatting and delivering are four different concerns that change for four different reasons. The calculation becomes a pure function, the easiest kind of code to test. Formatting and delivery become small classes behind simple interfaces, so a PDF formatter or a Slack sender can be added without touching the calculation.`,
          `The report service now depends on abstractions (anything with a format method; anything with a send method), and the concrete choices are made in one place where the application is assembled. This is the dependency inversion principle in its everyday form.`,
        ],
        code: `from typing import Protocol

# Before: one method, four reasons to change
class MonthlyReport:
    def run(self, month):
        rows = DB.query("SELECT ...", month)              # data access
        total = sum(r.amount for r in rows) * 0.95         # business rule
        html = f"<h1>{month}</h1><p>{total:.2f}</p>"      # formatting
        SMTP.send("finance@example.com", html)             # delivery

# After: each concern changes on its own
def summarise(amounts: list[float], discount: float = 0.05) -> dict:
    total = sum(amounts) * (1 - discount)
    return {"count": len(amounts), "total": round(total, 2)}

class Formatter(Protocol):
    def format(self, month: str, summary: dict) -> str: ...

class Sender(Protocol):
    def send(self, to: str, body: str) -> None: ...

class ReportService:
    def __init__(self, load_amounts, formatter: Formatter, sender: Sender):
        self.load_amounts = load_amounts
        self.formatter = formatter
        self.sender = sender

    def run(self, month: str, to: str) -> None:
        summary = summarise(self.load_amounts(month))
        self.sender.send(to, self.formatter.format(month, summary))`,
        label: 'Separating concerns by reason to change',
      },
      {
        title: 'Measuring coupling in your own code',
        paragraphs: [
          `You can see coupling without special tools. Look at a module's imports: a module that imports from fifteen other modules of your project is affected by changes in any of them. Look at change history: git log --name-only shows which files tend to change together. Files that always change together but live far apart are a sign that one concept has been split in the wrong place.`,
          `Watch for these signs in reviews: a "small" feature touching many unrelated files (shotgun surgery); one module reaching through objects to call a.b.c.d() (a violation of the Law of Demeter); circular imports between packages; and tests that need large amounts of setup for a simple behaviour, which usually means the code under test depends on too much.`,
          `Lower coupling is not free. Every interface and indirection adds something to read. The goal is not zero coupling, but coupling that matches how the system actually changes.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Take the "after" ReportService above and write a unit test for it using a lambda for load_amounts, a simple formatter and a fake sender.`,
          `2. Run git log --name-only on a project with some history and find two files that often change together. Should they be closer together, or is something wrong in the design?`,
          `3. Pick one SOLID principle and find a place in your code that breaks it. Is fixing it worth the extra structure right now? Write down why or why not.`,
        ],
      },
    ],
  },
  'swe-14': {
    after: [
      {
        title: 'Worked case: from a growing if-chain to Strategy and Observer',
        paragraphs: [
          `An online shop calculates delivery fees with an if/elif chain on the delivery type, and after each order it sends an email, updates stock and records analytics, all called directly from place_order. Every new delivery option and every new after-order action means editing place_order, which is the most important and most tested function in the system.`,
          `Strategy fixes the first problem. Each delivery option becomes a small function (or class) with the same signature, registered in a dictionary. place_order looks up the strategy by name and calls it. Adding "same-day drone" means adding one function and one dictionary entry.`,
          `Observer fixes the second. place_order publishes an OrderPlaced event; email, stock and analytics subscribe to it. place_order no longer knows who is listening. One caution: with a simple in-process observer, a failing subscriber can still break the order, so here each handler's errors are caught and logged rather than allowed to cancel the sale.`,
        ],
        code: `import logging
from collections import defaultdict
log = logging.getLogger("shop")

# Strategy: interchangeable fee rules
DELIVERY = {
    "pickup":   lambda kg: 0,
    "standard": lambda kg: 15 + 2 * kg,
    "express":  lambda kg: max(40, 30 + 4 * kg),
}

# Observer: a tiny event bus
_subscribers = defaultdict(list)

def subscribe(event, handler):
    _subscribers[event].append(handler)

def publish(event, payload):
    for handler in _subscribers[event]:
        try:
            handler(payload)
        except Exception:
            log.exception("handler %s failed for %s", handler.__name__, event)

def place_order(order_id, weight_kg, delivery):
    fee = DELIVERY[delivery](weight_kg)
    publish("order_placed", {"id": order_id, "fee": fee})
    return fee

subscribe("order_placed", lambda o: print(f"email receipt for {o['id']}"))
subscribe("order_placed", lambda o: print(f"reserve stock for {o['id']}"))

print(place_order("A17", 3, "express"))
# email receipt for A17
# reserve stock for A17
# 42`,
        label: 'Strategy for rules, Observer for reactions',
      },
      {
        title: 'Pythonic patterns: functions, protocols and decorators',
        paragraphs: [
          `Many classic patterns were described for languages where functions are not values. In Python they are, so a Strategy is often just a function, a Factory is often a dictionary from names to classes, and a Command is a function plus its arguments stored for later (functools.partial).`,
          `Python's @decorator syntax is a built-in way of applying the Decorator pattern to functions: wrap a function to add behaviour (logging, timing, caching, retrying) without changing it. functools.lru_cache is a decorator you will use for caching in SE 7.`,
          `typing.Protocol lets you describe the shape an object must have (its methods) without forcing it to inherit from a base class. That fits Python's duck typing and keeps patterns light: any class with the right methods qualifies.`,
        ],
        code: `import functools, time

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(f"{func.__name__} took {time.perf_counter() - start:.4f}s")
    return wrapper

@timed
def slow_sum(n):
    return sum(range(n))

slow_sum(1_000_000)   # slow_sum took 0.0xxxs`,
        label: 'The Decorator pattern as a Python decorator',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Add a fourth delivery option to the example without editing place_order. Then add an "order_placed" subscriber that deliberately raises, and confirm the order still succeeds.`,
          `2. Write an Adapter that gives two different weather APIs (with different field names and units) the same get_temperature_c(city) method.`,
          `3. Find a place in your own code where a pattern would be overkill. Write one sentence explaining what would trigger you to introduce it later.`,
        ],
      },
    ],
  },
  'swe-15': {
    after: [
      {
        title: 'Worked case: choosing an architecture for a campus app',
        paragraphs: [
          `A university wants one app for timetables, course registration, library loans and campus news. The team has six developers. Expected load is low most of the year, with a huge spike during the two weeks of registration. Registration must not lose or double-book places; news can be a few minutes stale.`,
          `The quality attributes point the way. The team is small, so microservices would bring operational cost (many deployments, network failures, distributed data) without the organisational benefit they exist for. A modular monolith fits better: one deployable application, split into modules (timetable, registration, library, news) with clear interfaces and no reaching into each other's database tables.`,
          `Registration is different from the rest: it needs strong consistency and must handle a short, intense spike. So it gets extra care inside the monolith: database transactions with optimistic locking for seat counts (SE 7), a queue to smooth the spike, and load tests before every registration period. If one day registration needs to scale separately, its clean module boundary makes extracting it into a service a manageable project rather than a rewrite.`,
          `The team records this as an ADR, including the alternatives considered and the trigger for revisiting it ("if more than three teams work on the codebase, or registration needs independent scaling").`,
        ],
        code: `# ADR 0003: Modular monolith for the campus app

Status: Accepted (2026-10-28)

Context
  6 developers, one product. Peak load only during registration (2 weeks/year).
  Registration requires no lost or double-booked seats; news may be stale for minutes.

Decision
  One deployable Python application with four modules:
  timetable, registration, library, news.
  Modules talk only through their public service interfaces.
  Each module owns its tables; no cross-module SQL.

Consequences
  + One deployment, one database, simple local development.
  + Module boundaries keep later extraction possible.
  - Registration spikes scale the whole app; mitigate with a queue and load tests.
  - Boundaries must be enforced by an import-linter fitness function in CI.

Revisit when
  more than 3 teams work on the code, or registration needs independent scaling.`,
        label: 'An architecture decision record',
      },
      {
        title: 'Enforcing boundaries automatically',
        paragraphs: [
          `Architecture diagrams describe intentions; code drifts. Within months of a deadline, someone imports a registration helper directly into the news module "just this once", and the boundary starts to dissolve. Fitness functions are automated checks that fail the build when an architectural rule is broken.`,
          `In Python, import-linter can express rules such as "news must not import registration" or "the domain layer must not import the web framework". Other fitness functions check performance budgets, dependency licences or that no module exceeds a size limit. They turn the architecture from a document people forget into a constraint the build enforces.`,
        ],
        code: `# .importlinter
[importlinter]
root_package = campus

[importlinter:contract:modules-independent]
name = Feature modules do not import each other
type = independence
modules =
    campus.timetable
    campus.registration
    campus.library
    campus.news

[importlinter:contract:layers]
name = Domain does not depend on the web layer
type = layers
layers =
    campus.web
    campus.services
    campus.domain`,
        label: 'Boundaries as a failing build',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write an ADR for a decision in a project you know (a database choice, a framework, a hosting provider), including at least two rejected alternatives.`,
          `2. Draw a C4 context diagram and a container diagram for the campus app. What are the external systems?`,
          `3. List three quality attributes for a mobile-money app and explain how each one would push the architecture in a different direction from the campus app.`,
        ],
      },
    ],
  },
  'swe-16': {
    after: [
      {
        title: 'Worked case: designing a course-enrolment API end to end',
        paragraphs: [
          `We need an API that lets students list courses, enrol, and withdraw. Start from resources, not actions: courses, and enrolments (the relationship between a student and a course). Actions become HTTP methods on those resources rather than verbs in URLs such as /enrolStudent.`,
          `Each endpoint has a defined set of responses. Listing is paginated with a cursor so pages stay stable while new courses are added. Enrolling is a POST that creates an enrolment and returns 201 with a Location header. Because networks fail, clients send an Idempotency-Key header, so a retried POST does not create two enrolments. A full course returns 409 Conflict with an RFC 9457 problem body that a client can act on.`,
          `Withdrawing is a DELETE on the enrolment, and it is naturally idempotent: deleting something already deleted still leaves it deleted. The API returns 204 the first time; on repeats it can return 204 or 404, as long as the choice is documented and consistent.`,
        ],
        code: `GET /courses?limit=20&cursor=eyJpZCI6IlNFMTAxIn0
200 OK
{ "items": [{ "code": "SE201", "title": "Testing", "seats_left": 3 }],
  "next_cursor": "eyJpZCI6IlNFMjAxIn0" }

POST /courses/SE201/enrolments
Idempotency-Key: 6f1c7c0e-2d4b-4b7a-9a51-1f1e2c5d7a10
{ "student_id": "10234567" }
201 Created
Location: /courses/SE201/enrolments/en_8812

POST /courses/SE201/enrolments          (course now full)
409 Conflict
Content-Type: application/problem+json
{ "type": "https://api.example.edu/problems/course-full",
  "title": "Course is full",
  "status": 409,
  "detail": "SE201 has no seats left for the 2026/27 first semester.",
  "waitlist": "/courses/SE201/waitlist" }

DELETE /courses/SE201/enrolments/en_8812
204 No Content`,
        label: 'Resources, status codes, idempotency and problem details',
      },
      {
        title: 'Security belongs in the API design',
        paragraphs: [
          `The most common serious API vulnerability is broken object-level authorisation (number one in the OWASP API Security Top 10). An attacker changes /students/10234567/grades to /students/10234568/grades and sees someone else's data, because the server checked that the caller was logged in but not that they were allowed to see that particular object. Every handler that loads an object by id must check that the current user may access it.`,
          `Other design-level protections: never trust ids or roles sent in the request body (derive them from the authenticated session); return only the fields a client needs, so internal data does not leak through a generous serializer; set limits on page sizes and request bodies; and rate-limit authentication and expensive endpoints.`,
          `Error responses should help legitimate clients without helping attackers. "Course is full" is useful; a database error message with table names is not. Problem details let you be specific about client errors while keeping server internals private.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Design the resources and endpoints for a library-loans API (books, copies, loans, reservations). Which operations are idempotent?`,
          `2. Write the problem-details response for three errors: a loan limit reached, a book that does not exist, and a malformed request body.`,
          `3. A client wants to add a "middle_name" field to students. Is adding it a breaking change? What about renaming "name" to "full_name"? Describe a safe migration for the rename.`,
        ],
      },
    ],
  },

  // ── SE 7 · Data, Concurrency & Distributed Systems ───────────────────────────────────────────
  'swe-17': {
    after: [
      {
        title: 'Worked case: a schema for course registration',
        paragraphs: [
          `Requirements: students register for course sections; each section has a seat limit; a student cannot register twice for the same section; we need fast lookups of "this student's timetable" and "who is in this section". We model the facts once: students, courses, sections (a course offered in a semester with a seat limit) and registrations (the relationship).`,
          `Constraints in the database enforce rules that must never be broken, whatever code path touches the data. A UNIQUE constraint on (student_id, section_id) makes double registration impossible, even if two requests arrive at the same instant. A CHECK constraint keeps seat counts non-negative. Foreign keys make orphan rows impossible.`,
          `Indexes follow the queries. The UNIQUE constraint already creates an index starting with student_id, which serves the timetable query. The "who is in this section" query needs an index starting with section_id. We confirm with EXPLAIN QUERY PLAN instead of guessing.`,
        ],
        code: `import sqlite3
db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE sections (
  id INTEGER PRIMARY KEY,
  course_code TEXT NOT NULL,
  semester TEXT NOT NULL,
  seats_left INTEGER NOT NULL CHECK (seats_left >= 0)
);
CREATE TABLE registrations (
  student_id INTEGER NOT NULL REFERENCES students(id),
  section_id INTEGER NOT NULL REFERENCES sections(id),
  registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, section_id)
);
CREATE INDEX idx_reg_section ON registrations(section_id);
""")

for row in db.execute("EXPLAIN QUERY PLAN SELECT student_id FROM registrations WHERE section_id = ?", (1,)):
    print(row[-1])
# SEARCH registrations USING INDEX idx_reg_section (section_id=?)`,
        label: 'Constraints for rules, indexes for queries',
      },
      {
        title: 'Taking a seat safely under concurrency',
        paragraphs: [
          `Two students click "register" for the last seat at the same moment. If the code reads seats_left, checks it is above zero, then writes seats_left - 1, both requests can read 1, both pass the check, and both register. The section is now overbooked: a classic lost update.`,
          `The simplest correct fix is to make the check and the change one atomic statement: UPDATE sections SET seats_left = seats_left - 1 WHERE id = ? AND seats_left > 0. The database runs it atomically; if it reports zero rows changed, there was no seat. Wrap it in a transaction with the INSERT into registrations, so either both happen or neither does. The UNIQUE constraint independently blocks a double registration by the same student.`,
          `This conditional-update pattern is optimistic concurrency without a version column, and it works in every SQL database. Reach for explicit row locks (SELECT ... FOR UPDATE in PostgreSQL) only when the decision depends on reading several rows first.`,
        ],
        code: `def register(db, student_id, section_id):
    try:
        with db:   # one transaction: commit on success, roll back on error
            cur = db.execute(
                "UPDATE sections SET seats_left = seats_left - 1 "
                "WHERE id = ? AND seats_left > 0", (section_id,))
            if cur.rowcount == 0:
                raise ValueError("section is full")
            db.execute("INSERT INTO registrations (student_id, section_id) VALUES (?, ?)",
                       (student_id, section_id))
    except sqlite3.IntegrityError:
        raise ValueError("already registered") from None

db.execute("INSERT INTO students VALUES (1, 'Ama'), (2, 'Kojo')")
db.execute("INSERT INTO sections VALUES (1, 'SE201', '2026-1', 1)")
register(db, 1, 1)
for student in (2, 1):
    try:
        register(db, student, 1)
    except ValueError as err:
        print(student, err)
# 2 section is full
# 1 section is full    (the seat check fails first; the UNIQUE constraint is the backstop)`,
        label: 'An atomic conditional update inside a transaction',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Add a waitlist table to the schema. What constraints does it need, and which index serves "the next person on the waitlist for this section"?`,
          `2. Write a query that lists a student's timetable with course codes, and check its plan with EXPLAIN QUERY PLAN. Remove the index and compare.`,
          `3. Rewrite a read-check-write function from your own code as a single conditional UPDATE, and explain why it is safe when the original was not.`,
        ],
      },
    ],
  },
  'swe-18': {
    after: [
      {
        title: 'Worked case: downloading 50 pages, three ways',
        paragraphs: [
          `A program must fetch 50 web pages and count the words on each. Sequentially, with each request taking about 200 ms of waiting on the network, it takes around 10 seconds, nearly all of it idle. The work is I/O-bound: the CPU is waiting, not working. That is exactly where threads and asyncio help.`,
          `With concurrent.futures.ThreadPoolExecutor and ten workers, ten requests wait at the same time, and the total drops to around one second. The code barely changes: you submit a function and collect results. With asyncio and an async HTTP client, a single thread can have all 50 requests in flight, which scales to thousands of connections with little memory.`,
          `If the work were CPU-bound instead (resizing images, parsing huge files), threads would not help on standard CPython because of the GIL; you would use ProcessPoolExecutor so each worker runs on its own core. The executor interface is the same, so switching is a one-word change once you have measured which kind of work you have.`,
        ],
        code: `import time
from concurrent.futures import ThreadPoolExecutor

def fetch(url):
    time.sleep(0.2)                  # stands in for network waiting
    return url, len(url) * 10        # pretend word count

urls = [f"https://example.org/page/{i}" for i in range(50)]

start = time.perf_counter()
results = [fetch(u) for u in urls]
print(f"sequential: {time.perf_counter() - start:.1f}s")   # sequential: 10.0s

start = time.perf_counter()
with ThreadPoolExecutor(max_workers=10) as pool:
    results = list(pool.map(fetch, urls))
print(f"10 threads: {time.perf_counter() - start:.1f}s")   # 10 threads: 1.0s

import asyncio
async def fetch_async(url):
    await asyncio.sleep(0.2)
    return url, len(url) * 10

async def main():
    return await asyncio.gather(*(fetch_async(u) for u in urls))

start = time.perf_counter()
results = asyncio.run(main())
print(f"asyncio:    {time.perf_counter() - start:.1f}s")   # asyncio:    0.2s`,
        label: 'Sequential, thread pool and asyncio for I/O-bound work',
      },
      {
        title: 'Designing to avoid shared mutable state',
        paragraphs: [
          `Locks fix races, but every lock is something to get wrong: forgotten in one place, held too long, or taken in the wrong order. The more robust approach is to design so that threads rarely share mutable state at all.`,
          `Three techniques cover most needs. First, give each worker its own data and combine results at the end (map-reduce): pool.map returns results, and the main thread sums them, so no counter is shared. Second, communicate through a queue.Queue, which is already thread-safe; producers put work items in and consumers take them out. Third, share only immutable values, such as tuples, frozen dataclasses and strings, which cannot be raced because nobody can change them.`,
          `When you do need a lock, keep the critical section as small as possible (no network calls or slow work while holding it), always use with lock: so it is released on errors, and when you need more than one lock, always acquire them in the same global order.`,
        ],
        code: `import queue, threading

tasks = queue.Queue()
results = queue.Queue()

def worker():
    while True:
        n = tasks.get()
        if n is None:          # sentinel: no more work
            break
        results.put(n * n)     # no shared counter, no lock needed

threads = [threading.Thread(target=worker) for _ in range(4)]
for t in threads: t.start()
for n in range(1, 101): tasks.put(n)
for _ in threads: tasks.put(None)
for t in threads: t.join()

print(sum(results.get() for _ in range(100)))   # 338350`,
        label: 'Workers that communicate through queues',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write a counter incremented 100,000 times by each of four threads, first without a lock and then with one. Use n = counter; counter = n + 1 to make the race easier to see.`,
          `2. Time a CPU-bound function (such as summing squares up to 5 million) with ThreadPoolExecutor and ProcessPoolExecutor using four workers. Explain the difference.`,
          `3. Convert a sequential script that calls several slow functions into asyncio with asyncio.gather, and add a timeout with asyncio.wait_for.`,
        ],
      },
    ],
  },
  'swe-19': {
    after: [
      {
        title: 'Worked case: calling an unreliable payment provider',
        paragraphs: [
          `Your shop calls an external mobile-money provider to charge customers. The provider is usually fast, but occasionally slow, sometimes returns 503 during peaks, and once a quarter has a full outage. A naïve call with no timeout can hang a worker for minutes; a naïve retry loop can charge a customer twice or hammer the provider while it is trying to recover.`,
          `A resilient client combines the techniques from this lesson. Every call has a timeout. Only transient failures (timeouts, 502/503/504, connection resets) are retried, at most three times, with exponential backoff and full jitter so thousands of clients do not retry in lockstep. Every charge request carries an idempotency key generated once per purchase, so if the first attempt actually succeeded but the response was lost, the retry returns the original result instead of charging again.`,
          `A circuit breaker wraps the whole thing. After five consecutive failures it opens and fails fast for 30 seconds, showing customers "Mobile money is temporarily unavailable, try card" instead of a spinning wheel, and giving the provider room to recover. Then it lets one trial request through (half-open) and closes again if it succeeds.`,
        ],
        code: `import random, time

class Transient(Exception): ...
class CircuitOpen(Exception): ...

class CircuitBreaker:
    def __init__(self, threshold=5, cooldown=30.0):
        self.threshold, self.cooldown = threshold, cooldown
        self.failures, self.opened_at = 0, None

    def call(self, fn, *args):
        if self.opened_at is not None:
            if time.monotonic() - self.opened_at < self.cooldown:
                raise CircuitOpen("failing fast")
            self.opened_at = None              # half-open: allow one trial
        try:
            result = fn(*args)
        except Transient:
            self.failures += 1
            if self.failures >= self.threshold:
                self.opened_at = time.monotonic()
            raise
        self.failures = 0
        return result

def with_retries(fn, *args, attempts=3, base=0.2, cap=2.0):
    for attempt in range(attempts):
        try:
            return fn(*args)
        except Transient:
            if attempt == attempts - 1:
                raise
            time.sleep(random.uniform(0, min(cap, base * 2 ** attempt)))   # full jitter

breaker = CircuitBreaker()

def charge(order_id, amount, idempotency_key):
    # provider_api.charge(..., timeout=3, headers={"Idempotency-Key": idempotency_key})
    ...

def pay(order_id, amount):
    key = f"order-{order_id}"                  # same key on every retry
    return with_retries(breaker.call, charge, order_id, amount, key)`,
        label: 'Timeout, bounded retries with jitter, idempotency key and a breaker',
      },
      {
        title: 'Observability: knowing what your distributed system is doing',
        paragraphs: [
          `When a request crosses five services and fails, "check the logs" is not a plan unless the logs can be connected. Every request should carry a correlation (trace) id from the edge, passed in a header to every downstream call and included in every log line. Then one search shows the whole journey.`,
          `The three pillars work together. Metrics (request rate, error rate, latency percentiles per endpoint) tell you something is wrong and where. Traces show the path and timing of individual requests through services, so you can see that a slow checkout is waiting 2.8 seconds on the payment provider. Structured logs (JSON with fields, not free text) give the detail for a specific request.`,
          `OpenTelemetry is the vendor-neutral standard for producing all three, and most languages and frameworks have libraries for it. Alert on symptoms users feel (error rate, latency against the SLO), not on every internal cause, so the people on call are woken only when it matters.`,
        ],
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Write a fake provider that fails randomly 30% of the time with Transient. Use with_retries and the breaker against it and log each attempt, the delay chosen and the breaker state.`,
          `2. Explain, with a timeline, how a lost response plus a retry could double-charge a customer without an idempotency key, and how the key prevents it.`,
          `3. Design the message flow for "order placed → reserve stock → charge → send receipt" using a queue and the outbox pattern. What happens if the service crashes after charging but before sending the receipt?`,
        ],
      },
    ],
  },
  'swe-20': {
    after: [
      {
        title: 'Worked case: a slow course-search page, from complaint to fix',
        paragraphs: [
          `Complaint: "Course search takes ages." Before changing anything, measure. The latency dashboard shows the search endpoint at p50 = 180 ms but p99 = 4.2 s; most searches are fine, but one in a hundred is terrible. Averages would have hidden that.`,
          `Profile a slow request. cProfile shows 85% of the time in a function that, for each of 200 matching courses, runs a separate query to fetch the lecturer's name: an N+1 query problem, 201 database round trips. Fast searches had few matches; slow ones had many. That explains the long tail.`,
          `Fix the cause, not the symptom: one query with a JOIN fetches courses and lecturers together. p99 drops to 240 ms. Only then consider caching. Lecturer names change rarely, so caching them for ten minutes would be safe, but the measurement shows it is no longer needed. You avoid adding cache invalidation risk for no benefit. Finally, add a performance test that fails if the endpoint issues more than five queries, so the N+1 cannot quietly return.`,
        ],
        code: `import cProfile, pstats, sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE lecturers (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE courses (code TEXT, title TEXT, lecturer_id INTEGER);
""")
db.executemany("INSERT INTO lecturers VALUES (?, ?)", [(i, f"Dr {i}") for i in range(50)])
db.executemany("INSERT INTO courses VALUES (?, ?, ?)",
               [(f"SE{i}", f"Course {i}", i % 50) for i in range(2000)])

def search_n_plus_1(term):
    rows = db.execute("SELECT code, title, lecturer_id FROM courses WHERE title LIKE ?", (f"%{term}%",))
    return [(c, t, db.execute("SELECT name FROM lecturers WHERE id = ?", (l,)).fetchone()[0])
            for c, t, l in rows.fetchall()]

def search_joined(term):
    return db.execute("""SELECT c.code, c.title, l.name FROM courses c
                         JOIN lecturers l ON l.id = c.lecturer_id
                         WHERE c.title LIKE ?""", (f"%{term}%",)).fetchall()

assert search_n_plus_1("1") == search_joined("1")      # same answer
cProfile.run('search_n_plus_1("1")', "prof.out")
pstats.Stats("prof.out").sort_stats("cumulative").print_stats(5)`,
        label: 'Profile, find the N+1, replace it with a join',
      },
      {
        title: 'Caching with functools and a time limit',
        paragraphs: [
          `For pure functions (same input, same output, no side effects), functools.lru_cache is the simplest effective cache: it remembers recent results in memory and evicts the least recently used when full. cache_info() reports hits and misses, so you can check the cache is actually helping.`,
          `For data that changes, you need a time-to-live (TTL) or explicit invalidation. A small TTL cache is easy to write, but think through the questions every cache raises. How stale may the data be? What happens when many requests miss at once and all hit the database (a stampede)? Is the cache per process, so each server has its own copy, or shared, as with Redis? Is the key complete? A key that forgets the user id will serve one user's data to another.`,
        ],
        code: `import functools, time

@functools.lru_cache(maxsize=1024)
def grade_boundaries(scheme: str) -> tuple:
    time.sleep(0.1)                     # pretend this is expensive
    return (80, 70, 60, 50) if scheme == "ug" else (70, 60, 50, 40)

grade_boundaries("ug"); grade_boundaries("ug"); grade_boundaries("pg")
print(grade_boundaries.cache_info())
# CacheInfo(hits=1, misses=2, maxsize=1024, currsize=2)

def ttl_cache(seconds):
    def decorate(fn):
        store = {}
        @functools.wraps(fn)
        def wrapper(*args):
            hit = store.get(args)
            if hit and time.monotonic() - hit[1] < seconds:
                return hit[0]
            value = fn(*args)
            store[args] = (value, time.monotonic())
            return value
        return wrapper
    return decorate

@ttl_cache(seconds=600)
def lecturer_name(lecturer_id):
    return f"Dr {lecturer_id}"          # would be a database query`,
        label: 'lru_cache for pure functions, TTL for changing data',
      },
      {
        title: 'Try it yourself',
        paragraphs: [
          `1. Run the worked example and compare the time of search_n_plus_1 and search_joined with timeit. How many queries does each issue?`,
          `2. Given latencies [100, 110, 95, 105, 3000, 98, 102, 99, 101, 97] ms, compute the mean, median and p90 by hand. Which one best describes what a typical user experiences, and which reveals the problem?`,
          `3. A service handles 200 requests per second, each taking 50 ms on average. Using Little's law, how many requests are in progress at once? What happens to that number if latency rises to 500 ms?`,
        ],
      },
    ],
  },
};
