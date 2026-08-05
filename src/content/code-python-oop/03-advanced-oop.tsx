import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function AdvancedOop() {
  return (
    <div className="prose-hh">
      <h1>Advanced OOP: Dunder Methods, Dataclasses &amp; Abstract Classes</h1>
      <p>
        This lesson covers the features that separate "I can write a class" from "I can design a class that
        behaves the way Python itself expects objects to behave" — the difference matters the moment your
        objects need to go into a set, get printed for debugging, or plug into a framework expecting a
        specific interface.
      </p>

      <h2>Dunder methods — hooking into Python's own operators</h2>
      <p>
        "Dunder" means <strong>d</strong>ouble-<strong>under</strong>score — methods like{' '}
        <code>__init__</code>, <code>__str__</code>, and <code>__eq__</code>. Python calls these
        automatically in response to built-in syntax (<code>print()</code>, <code>==</code>,{' '}
        <code>+</code>, <code>in</code>), which is how you make your own classes work naturally with
        Python's built-in operators instead of needing custom method names for everything.
      </p>
      <CodeBlock label="__str__ vs __repr__">{`class LogEntry:
    def __init__(self, level, message):
        self.level = level
        self.message = message

    def __str__(self):
        # used by print(obj) and str(obj) — aim for human-readable
        return f"[{self.level}] {self.message}"

    def __repr__(self):
        # used in lists/dicts, and at a REPL prompt — aim for unambiguous, "could paste this back in"
        return f"LogEntry(level={self.level!r}, message={self.message!r})"

e = LogEntry("WARN", "disk almost full")
print(e)          # [WARN] disk almost full          (calls __str__)
print([e])         # [LogEntry(level='WARN', message='disk almost full')]   (calls __repr__)`}</CodeBlock>

      <h2>__eq__ and __hash__ — making objects comparable and hashable</h2>
      <CodeBlock label="a class that works correctly in sets">{`class Fingerprint:
    def __init__(self, value):
        self.value = value

    def __eq__(self, other):
        if not isinstance(other, Fingerprint):
            return NotImplemented
        return self.value == other.value

    def __hash__(self):
        return hash(self.value)

a = Fingerprint("abc123")
b = Fingerprint("abc123")
print(a == b)              # True — same value
print(len({a, b}))          # 1 — correctly deduplicated in a set`}</CodeBlock>
      <Callout variant="warn">
        <p>
          If you define <code>__eq__</code> without also defining <code>__hash__</code>, Python makes your
          objects unhashable by default — you won't be able to put them in a set or use them as dict keys
          at all. The two methods need to agree: objects that compare equal <em>must</em> produce the same
          hash, or sets/dicts will behave incorrectly.
        </p>
      </Callout>

      <h2>Operator overloading — __add__, __contains__, and friends</h2>
      <CodeBlock label="making + and `in` mean something sensible">{`class AccessControlList:
    def __init__(self, allowed):
        self.allowed = set(allowed)

    def __add__(self, other):
        return AccessControlList(self.allowed | other.allowed)

    def __contains__(self, item):
        return item in self.allowed

a = AccessControlList(["alice", "bob"])
b = AccessControlList(["carol"])
combined = a + b               # calls a.__add__(b)
print("alice" in combined)      # calls combined.__contains__("alice") -> True`}</CodeBlock>
      <p>
        Overload operators only when the meaning is obvious and natural — <code>+</code> for "merge these
        two ACLs" reads clearly; using <code>+</code> for something unrelated to combining would just
        confuse anyone reading the code later.
      </p>

      <h2>Dataclasses — less boilerplate for "just data" classes</h2>
      <CodeBlock label="@dataclass generates __init__, __eq__, and __repr__ for you">{`from dataclasses import dataclass

@dataclass
class Vulnerability:
    cve_id: str
    severity: str
    cvss_score: float
    patched: bool = False

v = Vulnerability("CVE-2024-1234", "Critical", 9.8)
print(v)                 # Vulnerability(cve_id='CVE-2024-1234', severity='Critical', cvss_score=9.8, patched=False)
print(v.patched)          # False — the default
v2 = Vulnerability("CVE-2024-1234", "Critical", 9.8)
print(v == v2)             # True — auto-generated __eq__ compares all fields`}</CodeBlock>
      <p>
        Without <code>@dataclass</code>, you'd hand-write <code>__init__</code> assigning every field, plus{' '}
        <code>__eq__</code> and <code>__repr__</code> if you wanted them — for a class that's really just a
        labeled bundle of fields, that's pure boilerplate. Reach for a dataclass any time a class's job is
        mostly "hold these values together," and reserve full hand-written classes for objects with real
        behavior.
      </p>

      <h2>Frozen dataclasses: immutability, without writing __hash__ by hand</h2>
      <p>
        The <code>Vulnerability</code> dataclass above is still mutable — nothing stops{' '}
        <code>v.severity = "Low"</code> from silently rewriting it after creation. Passing{' '}
        <code>frozen=True</code> makes every field read-only after <code>__init__</code>, and as a bonus
        automatically generates a correct <code>__hash__</code> based on the fields — the exact pairing the{' '}
        <code>Fingerprint</code> class above had to write by hand:
      </p>
      <CodeBlock label="frozen=True — immutable, hashable, for free">{`@dataclass(frozen=True)
class Vulnerability:
    cve_id: str
    severity: str
    cvss_score: float

v = Vulnerability("CVE-2024-1234", "Critical", 9.8)
# v.severity = "Low"          # FrozenInstanceError — frozen instances reject attribute assignment
seen: set[Vulnerability] = {v}   # works — frozen dataclasses are hashable automatically`}</CodeBlock>
      <p>
        Reach for <code>frozen=True</code> any time a value object shouldn't change after creation — a
        finding, a fingerprint, a config snapshot — the same reasoning the earlier lesson gave for choosing a
        tuple over a list, applied to a full class instead of a plain sequence of values.
      </p>

      <h2>Abstract base classes — enforcing an interface</h2>
      <CodeBlock label="abc.ABC and @abstractmethod">{`from abc import ABC, abstractmethod

class AuthProvider(ABC):
    @abstractmethod
    def authenticate(self, username, password):
        ...

class StaticAuthProvider(AuthProvider):
    def __init__(self, credentials):
        self.credentials = credentials
    def authenticate(self, username, password):
        return self.credentials.get(username) == password

# AuthProvider()  # TypeError! Can't instantiate a class with unimplemented abstract methods.`}</CodeBlock>
      <p>
        An abstract base class is a contract: "anything claiming to be an AuthProvider MUST implement{' '}
        <code>authenticate</code>." Python enforces this at the moment you try to create an instance — you
        physically cannot instantiate <code>AuthProvider</code> directly, and any subclass that forgets to
        implement <code>authenticate</code> will also fail to instantiate. This is exactly how real
        pluggable systems (multiple auth backends, multiple storage backends) guarantee every backend
        actually implements the methods the rest of the system depends on.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-oop-06', title: 'Dunder Methods — a Hashable Fingerprint Class' },
          { id: 'py-oop-09', title: 'A Vulnerability Dataclass' },
          { id: 'py-oop-08', title: 'An Abstract AuthProvider Interface' },
        ]}
      />

      <p>
        With OOP covered, the final module goes further: decorators, generators, context managers, and
        concurrency — the tools that make your Python genuinely efficient and expressive, not just correct.
      </p>
    </div>
  );
}
