import type { LessonDepth } from './types';

const plain = (title: string, ...paragraphs: string[]) => ({ title: `In plain English: ${title}`, paragraphs });

/** Beginner depth for the professional Software Engineering lessons (SE 3–7). Each opens with an
 *  everyday picture of the idea before the precise sections, adds the vocabulary a learner fresh from
 *  SE 1–2 has not met yet, and — where a lesson leans on background (terminal, type hints, HTTP, SQL,
 *  threads, Big-O) — a short recap so nobody has to leave the lesson to look it up. */
export const SOFTWARE_ENGINEERING_DEPTH: Record<string, LessonDepth> = {
  // ── SE 3 · The Engineering Mindset & Toolchain ───────────────────────────────────────────────
  'swe-1': {
    keyTerms: [
      { term: 'Dependency', meaning: 'Someone else\'s code your program uses, such as a library you install. If it changes, your program may break.' },
      { term: 'API', meaning: 'The part of a piece of code that other code is allowed to call: its public functions, classes and their behaviour.' },
      { term: 'Breaking change', meaning: 'A change that makes existing code that used yours stop working.' },
    ],
    before: [plain('from homework to a building that people live in',
      'Writing a program for yourself is like cooking dinner at home: if it goes wrong, you shrug and try again. Software engineering is like running a restaurant kitchen that must serve thousands of meals a day for years, with staff who come and go, suppliers who change their ingredients, and health inspectors checking the work. The cooking skills are the same — the habits around them are different.',
      'In Modules 1 and 2 you learned to write correct programs. This module is about what changes when other people depend on your code, and when it has to keep working for years. Do not worry about memorising the long names (SWEBOK, Hyrum\'s Law, semantic versioning). Focus on the one big idea: the hard part of professional software is changing it safely, not writing it the first time.')],
  },
  'swe-2': {
    keyTerms: [
      { term: 'Repository', meaning: 'A project folder whose full history of changes is tracked by Git. Often shortened to "repo".' },
      { term: 'Terminal', meaning: 'A text window where you type commands such as cd or git status instead of clicking.' },
      { term: 'Staging area', meaning: 'The list of changes you have chosen (with git add) to include in your next commit.' },
    ],
    before: [
      plain('save points for your whole project',
        'Think of a video game with save points. If you mess up a level, you reload the last save. Git gives your project save points called commits, and it remembers every one, so you can see exactly what changed, when, and why — and go back if something breaks.',
        'Branches are like parallel copies of the game where you can try a risky strategy without touching your main save. If it works, you merge it back; if not, you throw the branch away. Teams use this so many people can work on the same project without overwriting each other.'),
      {
        title: 'Quick recap: the terminal and the five Git commands you will use daily',
        paragraphs: [
          'Git is usually used from a terminal. cd moves into a folder, ls (or dir on Windows) lists what is there. You only need a handful of Git commands to start; the rest of the lesson explains how professionals use them well.',
        ],
        code: `cd my-project          # move into the project folder
git init               # start tracking this folder (once per project)
git status             # what has changed since the last commit?
git add grades.py      # choose a change to include in the next commit
git commit -m "Add grade calculator"   # save a commit with a message
git log --oneline      # list the commits so far`,
        label: 'A first Git session',
      },
    ],
  },
  'swe-3': {
    keyTerms: [
      { term: 'Bug', meaning: 'A mistake in a program that makes it behave differently from what was intended.' },
      { term: 'Hypothesis', meaning: 'A specific guess about the cause of a bug that you can test, such as "the list is empty when average() is called".' },
      { term: 'Debugger', meaning: 'A tool that pauses a program so you can run it line by line and inspect variables.' },
    ],
    before: [plain('be a detective, not a guesser',
      'When something breaks, the tempting move is to change random lines until it works. That is like a doctor prescribing random medicine. A good detective instead collects evidence, forms a theory ("the butler did it"), tests it, and only then makes an arrest.',
      'Scientific debugging is exactly that: make the bug happen reliably, shrink it to the smallest example that still fails, guess one specific cause, check that guess, fix the cause, and add a test so it never comes back. You already practised the first step in Module 2 — reading the traceback carefully — and this lesson builds the rest of the method around it.')],
  },
  'swe-4': {
    keyTerms: [
      { term: 'Requirement', meaning: 'Something the software must do or a quality it must have, agreed with the people who need it.' },
      { term: 'Edge case', meaning: 'An unusual input or situation at the limits of what is expected, such as an empty list or a 0 price.' },
    ],
    before: [plain('measure twice, cut once',
      'A carpenter who starts cutting before measuring wastes wood. A programmer who starts coding before understanding what is needed wastes weeks. Requirements are the measurements: what exactly should the software do, for whom, and how will we know it works?',
      'Acceptance criteria turn a vague wish ("users should be able to reset their password") into checkable statements ("Given a registered email, when the user asks for a reset, then a link valid for 30 minutes is sent"). If you can check it, you can test it — and the test is the proof that you built the right thing.')],
  },

  // ── SE 4 · Software Construction ─────────────────────────────────────────────────────────────
  'swe-5': {
    keyTerms: [
      { term: 'Type hint', meaning: 'A note in the code saying what type a value should be, such as def area(width: float) -> float. Python does not enforce it, but tools can check it.' },
      { term: 'Contract', meaning: 'The agreement between a function and its callers: what the caller must provide, and what the function promises in return.' },
    ],
    before: [
      plain('the label on a medicine bottle',
        'A medicine label says who may take it, how much, and what it does. You do not need to know the chemistry inside to use it safely. A specification does the same for a function: what inputs it accepts (the precondition), what it promises to give back (the postcondition), and what happens if you break the rules.',
        'You already wrote small specifications without the fancy name: docstrings that explain a function, and raise ValueError when input is wrong (Module 2). This lesson makes those habits precise, so that anyone — including future you — can use a function correctly without reading its body.'),
      {
        title: 'Quick recap: type hints',
        paragraphs: [
          'Type hints are optional labels written after a parameter name with a colon, and after the brackets with an arrow for the return type. Python runs the code the same with or without them, but editors and checkers such as mypy use them to catch mistakes before you run anything. list[int] means "a list of ints", and str | None means "a str or None".',
        ],
        code: `def average(marks: list[int]) -> float:
    """Return the mean of marks. marks must not be empty."""
    return sum(marks) / len(marks)

def find_user(user_id: int) -> str | None:
    """Return the user's name, or None if there is no such user."""
    ...

average([80, 90])      # fine
average("80, 90")      # runs and fails, but a type checker warns you first`,
        label: 'Reading type hints',
      },
    ],
  },
  'swe-6': {
    keyTerms: [
      { term: 'Abstract data type', meaning: 'A type described by what you can do with it (its operations), not by how it stores its data inside.' },
      { term: 'Defensive copy', meaning: 'A copy of mutable data made so outside code cannot change an object\'s insides through a shared reference.' },
    ],
    before: [plain('the vending machine again — with a lock on the back',
      'In Module 2 you met encapsulation: a BankAccount whose balance can only change through deposit() and withdraw(). This lesson goes one step further. It asks: what exactly must always be true inside the object (its invariant), and is there any sneaky way for outside code to break it?',
      'A classic sneaky way is handing out your internal list. If a method returns self._items directly, the caller can append to it and bypass every check. That is like a vending machine that hands customers the key to the back door. Returning a copy, or using immutable types such as tuples, keeps the door locked.')],
  },
  'swe-7': {
    keyTerms: [
      { term: 'Exception hierarchy', meaning: 'A family of related exception classes built with inheritance, so callers can catch a whole group with one except.' },
      { term: 'Context manager', meaning: 'An object used with the with statement that sets something up and is guaranteed to clean it up afterwards, like a file.' },
    ],
    before: [plain('smoke alarms, not silence',
      'A smoke alarm that never makes a sound is worse than none: you feel safe while the kitchen burns. Code that catches every error and carries on is the same — the problem is still there, just hidden. You learned the basics of raising and catching exceptions in Module 2; this lesson is about doing it well in a large program.',
      'Two ideas carry the lesson. Fail fast: stop as soon as something is wrong, with a clear message, instead of letting bad data travel. Fail safely: when something fails, leave the system in a secure state — a failed login check should deny access, never allow it. The exception classes you design are just inheritance (Module 2) applied to errors.')],
  },
  'swe-8': {
    keyTerms: [
      { term: 'Readability', meaning: 'How easily another person can understand what code does and why, just by reading it.' },
      { term: 'Duplication', meaning: 'The same logic written in more than one place, so a fix in one place can be forgotten in another.' },
    ],
    before: [plain('tidying a room without breaking anything',
      'Refactoring means improving how code is organised without changing what it does — like tidying a room: the same things are there afterwards, just easier to find. The danger is knocking something off a shelf while you tidy. Tests are what tell you nothing broke.',
      'You already know the main tools: better variable names, splitting a long function into small ones (Module 1), and moving related data and behaviour into a class (Module 2). This lesson names the common "smells" that tell you a tidy-up is due, and shows how to make each change in small, safe steps.')],
  },

  // ── SE 5 · Testing & Quality ─────────────────────────────────────────────────────────────────
  'swe-9': {
    keyTerms: [
      { term: 'Test case', meaning: 'One specific input together with the output you expect for it.' },
      { term: 'assert', meaning: 'A Python statement that stops with an error if a condition is False, used to check results in tests: assert add(2, 2) == 4.' },
    ],
    before: [
      plain('you cannot taste every grain of rice',
        'A cook does not taste every grain of rice to know the pot is done; they taste a spoonful from the middle and one from the edge where it might burn. Testing works the same way. You cannot try every possible input, so you choose a few that represent whole groups, plus the edges where mistakes hide — exactly the boundary ages you tested in the cinema-ticket task in Module 1.',
        'This lesson gives that instinct a method: split inputs into groups that should behave the same (partitions), always test the edges between groups (boundaries), and know what coverage numbers can and cannot tell you.'),
      {
        title: 'Quick recap: a test is just code that checks code',
        paragraphs: [
          'Every coding task in this track already graded you with automatic checks. A test is the same idea written by you: call the function with a chosen input and assert the result is what the specification says.',
        ],
        code: `def letter(avg):
    if avg >= 80:
        return "A"
    if avg >= 70:
        return "B"
    return "F"

# Tests: one from each group, plus the boundaries between them
assert letter(95) == "A"
assert letter(80) == "A"     # boundary
assert letter(79.9) == "B"   # just below the boundary
assert letter(70) == "B"
assert letter(10) == "F"
print("all tests passed")`,
        label: 'Tests chosen from groups and boundaries',
      },
    ],
  },
  'swe-10': {
    keyTerms: [
      { term: 'Unit test', meaning: 'A small, fast test that checks one function or class on its own.' },
      { term: 'pytest', meaning: 'The most popular Python testing tool. It finds functions whose names start with test_ and runs them.' },
      { term: 'Test double', meaning: 'A stand-in object used in a test instead of a real one, such as a fake database or a pretend clock.' },
    ],
    before: [plain('crash-test dummies',
      'Car makers do not test seat belts with real drivers; they use crash-test dummies that behave like people in the ways that matter. When the code you want to test talks to something slow, expensive or unpredictable — the internet, a payment provider, today\'s date — you swap that part for a stand-in called a test double.',
      'To make swapping possible, pass the collaborator in as a parameter instead of creating it inside the function. That is the same "pass values in, return results out" habit from the Functions lesson, applied to objects. pytest then makes writing and running many small tests quick: a test is just a function whose name starts with test_ and that uses assert.')],
  },
  'swe-11': {
    keyTerms: [
      { term: 'End-to-end test', meaning: 'A test that drives the whole system the way a user would, from the user interface down to the database.' },
      { term: 'Random input', meaning: 'Test data generated by a tool instead of written by hand, used to find cases you did not think of.' },
    ],
    before: [plain('a fire drill for the whole building',
      'Unit tests check each part on its own, like testing every smoke detector separately. You still need a fire drill to check that the alarms, doors and stairways work together. Integration and end-to-end tests are those drills: slower and fewer, but they catch problems that only appear when parts meet.',
      'Property-based testing is another idea: instead of choosing examples yourself, you state a rule that must always hold — "reversing a list twice gives back the original list" — and let a tool try hundreds of random inputs to break it. It is excellent at finding the edge cases humans forget.')],
  },
  'swe-12': {
    keyTerms: [
      { term: 'Pull request', meaning: 'A request to merge a branch into the main code, where teammates review the changes first.' },
      { term: 'Continuous integration', meaning: 'Automatically building and testing every change as soon as it is pushed, so problems are found within minutes.' },
    ],
    before: [plain('a second pair of eyes and a checklist',
      'Pilots use checklists before every take-off, however experienced they are, because checklists catch the mistakes that experts make when they are tired or in a hurry. Code review (a teammate reading your change) and automated quality gates (tests and linters that must pass before merging) are the checklists of software.',
      'Test-driven development (TDD) flips the usual order: write a small failing test first, then just enough code to pass it, then tidy up. It feels backwards at first, but it means every piece of code is born with a test, and you always know exactly what you are trying to build next.')],
  },

  // ── SE 6 · Design & Architecture ─────────────────────────────────────────────────────────────
  'swe-13': {
    keyTerms: [
      { term: 'Module boundary', meaning: 'The line between one part of a program and another — what each part shows to the other and what it keeps hidden.' },
      { term: 'Interface', meaning: 'The set of methods a class or module offers to the outside world; what callers can rely on.' },
    ],
    before: [plain('LEGO bricks versus superglue',
      'LEGO bricks connect through a small, standard set of studs, so you can pull one off and swap in another without breaking the model. Superglued pieces cannot be changed without destroying something. Good design makes the parts of a program like LEGO: each part does one clear job (high cohesion) and connects to others through a small, stable interface (low coupling).',
      'You have already used the key tools: functions that do one thing (Module 1), encapsulation and properties (Module 2), and the advice to prefer composition over deep inheritance (the Inheritance lesson). SOLID and information hiding are names for those same instincts, written down so teams can discuss them.')],
  },
  'swe-14': {
    keyTerms: [
      { term: 'Design pattern', meaning: 'A named, reusable solution to a problem that keeps appearing in software design.' },
      { term: 'Callback', meaning: 'A function you hand to other code so it can call you back later, for example when an event happens.' },
    ],
    before: [plain('recipes with names',
      'Chefs say "make a roux" instead of describing flour, butter and heat every time. Design patterns are named recipes for common design problems, so engineers can say "use a Strategy here" and everyone understands.',
      'Most patterns are built from things you know. Strategy is polymorphism (the Shapes lesson): several classes with the same method, chosen at run time. Observer is a list of callback functions to call when something happens. Adapter is a small class that wraps another so it fits the interface you expect. Learn the problem each one solves, not just the shape of the code.')],
  },
  'swe-15': {
    keyTerms: [
      { term: 'Architecture', meaning: 'The big-picture structure of a system: its main parts, how they communicate, and the decisions that are hardest to change later.' },
      { term: 'Service', meaning: 'A separately running program that offers functions to other programs, usually over a network.' },
    ],
    before: [plain('the floor plan before the furniture',
      'Design (the previous two lessons) is about arranging the furniture inside a room. Architecture is the floor plan of the whole building: how many rooms, where the walls and stairs go, where the plumbing runs. Moving furniture is easy; moving a load-bearing wall is not. Architecture is about those hard-to-change decisions.',
      'There is no single best floor plan. A family house, a hospital and a stadium need different ones. In software, the right structure depends on what the system must be good at — fast, secure, easy to change, able to handle millions of users — and on the size of the team. The lesson teaches you to choose deliberately and write the reasons down.')],
  },
  'swe-16': {
    keyTerms: [
      { term: 'HTTP', meaning: 'The protocol web browsers and apps use to send requests to servers and receive responses.' },
      { term: 'Status code', meaning: 'A three-digit number in every HTTP response saying how it went: 200 OK, 404 Not Found, 500 Server Error.' },
      { term: 'Endpoint', meaning: 'A URL plus method that an API offers, such as GET /orders/42.' },
    ],
    before: [
      plain('a restaurant menu for programs',
        'A web API is a menu that one program offers to others. Each item (an endpoint) says what you can ask for and what you will get back. A good menu is clear, consistent and does not change the meaning of a dish overnight. A good API is the same.',
        'An important detail: networks are unreliable, so a client may send the same order twice when a reply gets lost. An idempotent request is one that is safe to repeat — ordering the same meal twice by accident must not charge the customer twice.'),
      {
        title: 'Quick recap: what an HTTP request and response look like',
        paragraphs: [
          'Every HTTP exchange is a request from a client and a response from a server. The request has a method (GET to read, POST to create, PUT to replace, PATCH to update part, DELETE to remove) and a path. The response has a status code and usually a JSON body — the same JSON you saved to files in Module 2.',
        ],
        code: `GET /books/17 HTTP/1.1          <- request: method and path
Host: library.example

HTTP/1.1 200 OK                 <- response: status code
Content-Type: application/json

{"id": 17, "title": "Things Fall Apart", "on_loan": false}

# Status code families: 2xx success, 4xx the client made a mistake,
# 5xx the server failed.`,
        label: 'One request, one response',
      },
    ],
  },

  // ── SE 7 · Data, Concurrency & Distributed Systems ───────────────────────────────────────────
  'swe-17': {
    keyTerms: [
      { term: 'SQL', meaning: 'The language used to ask a relational database to store, find and change data.' },
      { term: 'Table', meaning: 'A grid of data in a database, with one row per record and one column per field — like a spreadsheet sheet.' },
      { term: 'Primary key', meaning: 'A column whose value is unique for every row, such as an id, used to find exactly one row.' },
    ],
    before: [
      plain('a filing cabinet with a very fast librarian',
        'A database is a filing cabinet with a librarian who can find any card in milliseconds — if the cabinet is organised well. An index is like the index at the back of a book: without it, the librarian reads every page. A transaction is a promise that a group of changes happens completely or not at all, like a bank transfer that must never take money from one account without adding it to the other.',
        'The dictionaries and lists you used in Module 1 live only while the program runs. A database keeps data safe for years, lets many programs use it at once, and protects it when two people change the same thing at the same moment.'),
      {
        title: 'Quick recap: four SQL statements',
        paragraphs: [
          'SQL reads almost like English. These four statements cover most everyday work; the lesson builds on them.',
        ],
        code: `CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, on_loan BOOLEAN);

INSERT INTO books (id, title, on_loan) VALUES (1, 'Americanah', FALSE);

SELECT title FROM books WHERE on_loan = FALSE;   -- find rows

UPDATE books SET on_loan = TRUE WHERE id = 1;    -- change rows

-- JOIN combines rows from two tables that share a value:
SELECT members.name, books.title
FROM loans JOIN members ON loans.member_id = members.id
           JOIN books   ON loans.book_id   = books.id;`,
        label: 'Create, insert, select, update and join',
      },
    ],
  },
  'swe-18': {
    keyTerms: [
      { term: 'Concurrency', meaning: 'Making progress on several tasks during the same period, by switching between them or running them at the same time.' },
      { term: 'Thread', meaning: 'One sequence of instructions inside a program. A program with several threads can work on several things at once.' },
      { term: 'Lock', meaning: 'A tool that lets only one thread at a time run a piece of code, so shared data is not changed by two at once.' },
    ],
    before: [
      plain('two cooks, one pot',
        'One cook following a recipe never gets confused. Put two cooks in the kitchen and they can finish dinner faster — but if both add salt to the same pot without talking, the soup is ruined. Concurrency is the art of letting several workers share the kitchen without ruining the soup.',
        'A race condition is the salted-twice soup: two threads read the same value, both change it, and one change is lost. A lock is a rule that only the cook holding the wooden spoon may touch the pot. A deadlock is two cooks each holding one tool and waiting forever for the other\'s.'),
      {
        title: 'Quick recap: what a lost update looks like',
        paragraphs: [
          'Here two threads each add 1 to a shared counter 100,000 times. You would expect 200,000. Without the lock, the result can be lower, because "read, add one, write back" is three steps and the threads can interleave between them. With the lock, only one thread does those three steps at a time.',
        ],
        code: `import threading

count = 0
lock = threading.Lock()

def add_many():
    global count
    for _ in range(100_000):
        with lock:            # remove this line and updates can be lost
            count += 1

threads = [threading.Thread(target=add_many) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(count)                  # 200000 with the lock`,
        label: 'Protecting a shared counter',
      },
    ],
  },
  'swe-19': {
    keyTerms: [
      { term: 'Distributed system', meaning: 'A system made of several programs on different computers that work together over a network.' },
      { term: 'Timeout', meaning: 'A limit on how long to wait for a reply before giving up.' },
      { term: 'Message queue', meaning: 'A waiting line of messages between programs, so a sender can continue even if the receiver is busy or briefly down.' },
    ],
    before: [plain('sending letters through an unreliable post office',
      'Imagine running a business entirely by post. Letters can arrive late, arrive twice, or never arrive, and when you hear nothing back you cannot tell whether your letter was lost, their reply was lost, or they are simply slow. Every program that talks over a network lives with exactly these problems.',
      'The tools in this lesson are common sense written down. Do not wait forever (timeouts). Try again, but wait a bit longer each time and not all at the same moment as everyone else (backoff with jitter). Stop calling a partner that is clearly down for a while (circuit breaker). Make sure that receiving the same letter twice does no harm (idempotency, from the HTTP APIs lesson).')],
  },
  'swe-20': {
    keyTerms: [
      { term: 'Latency', meaning: 'How long one request takes from start to finish.' },
      { term: 'Throughput', meaning: 'How many requests a system completes per second.' },
      { term: 'Big-O notation', meaning: 'A way to describe how the work an algorithm does grows as its input grows, such as O(n) or O(n²).' },
    ],
    before: [
      plain('find the traffic jam before widening the road',
        'If your commute is slow, widening a road you barely use will not help; you need to find where the traffic actually jams. Performance work is the same. Measure first with a profiler to find the slow part, fix that, and measure again. Guessing usually optimises the wrong thing.',
        'Averages also hide pain. If 99 requests take 10 ms and one takes 5 seconds, the average looks fine, but that one user waited five seconds. That is why engineers talk about percentiles: "99% of requests finish within 200 ms".'),
      {
        title: 'Quick recap: Big-O in plain English',
        paragraphs: [
          'Big-O describes how the amount of work grows when the input gets bigger, ignoring small constant details. Looking up a key in a dictionary or a set is O(1): about the same work for 10 items or 10 million. Checking whether a value is in a list is O(n): twice the items, twice the work. Comparing every item with every other item is O(n²): twice the items, four times the work — which is why a nested loop over a large list can suddenly become very slow.',
        ],
        code: `names = ["user%d" % i for i in range(100_000)]
name_set = set(names)

"user99999" in names      # O(n): checks up to 100,000 items
"user99999" in name_set   # O(1): one hash lookup

# O(n^2): every pair — 10 billion comparisons for 100,000 names
# for a in names:
#     for b in names:
#         ...`,
        label: 'Constant, linear and quadratic work',
      },
    ],
  },
};
