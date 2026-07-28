import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function OopBasics() {
  return (
    <div className="prose-hh">
      <h1>OOP Basics: Classes, Objects &amp; Encapsulation</h1>
      <p>
        Every real scanner, vault, firewall engine, and detection tool you'll ever look at is built from
        classes. Object-oriented programming (OOP) is a way of bundling <strong>data</strong> (attributes)
        and the <strong>behavior</strong> that operates on that data (methods) into one unit — an object —
        instead of passing loose dictionaries and standalone functions around everywhere.
      </p>

      <h2>Your first class</h2>
      <CodeBlock label="a minimal class">{`class Target:
    def __init__(self, ip, port):
        # __init__ runs automatically when you create a new Target — it sets up initial state
        self.ip = ip
        self.port = port

    def describe(self):
        return f"{self.ip}:{self.port}"

t = Target("10.0.0.5", 443)
print(t.ip)          # "10.0.0.5"
print(t.describe())  # "10.0.0.5:443"`}</CodeBlock>
      <p>
        <code>self</code> refers to "this particular instance" — every method takes it as the first
        parameter automatically. When you call <code>t.describe()</code>, Python is really calling{' '}
        <code>Target.describe(t)</code> behind the scenes; <code>self</code> is how the method knows which
        object's data to use.
      </p>
      <p>
        A <strong>class</strong> is the blueprint (<code>Target</code>); an <strong>instance</strong> (or
        "object") is one specific thing built from that blueprint (<code>t</code>). You can create as many
        instances as you want from one class, each with its own independent data.
      </p>
      <CodeBlock>{`t1 = Target("10.0.0.5", 443)
t2 = Target("10.0.0.9", 22)
print(t1.ip, t2.ip)  # "10.0.0.5 10.0.0.9" — completely independent`}</CodeBlock>

      <h2>Encapsulation — controlling access to internal state</h2>
      <p>
        Encapsulation means keeping an object's internal details private and only exposing a deliberate,
        controlled interface. Python doesn't have a hard "private" keyword like some languages — instead it
        uses a <strong>convention</strong>: a single leading underscore (<code>self._password_hash</code>)
        signals "this is internal, don't touch it directly from outside the class," even though nothing
        technically stops you.
      </p>
      <CodeBlock label="encapsulating a password">{`import hashlib

class User:
    def __init__(self, username, password):
        self.username = username
        self._password_hash = hashlib.sha256(password.encode()).hexdigest()

    def check_password(self, attempt):
        return hashlib.sha256(attempt.encode()).hexdigest() == self._password_hash

u = User("alice", "hunter2")
print(u.check_password("hunter2"))    # True
print(u.check_password("wrong"))      # False
# u._password_hash exists and is technically readable, but the underscore
# is a clear signal: "this is an implementation detail, use check_password() instead"`}</CodeBlock>
      <Callout variant="tip">
        <p>
          The real point of this <code>User</code> class isn't hiding the hash from a determined reader —
          it's making the <em>correct</em> way to check a password (via <code>check_password</code>) the
          <em>only convenient</em> way, so nobody accidentally compares a raw password to a hash somewhere
          else in a large codebase.
        </p>
      </Callout>

      <h2>Properties — computed attributes that look like plain data</h2>
      <CodeBlock label="the @property decorator">{`class ScanResult:
    def __init__(self, open_ports, total_ports):
        self.open_ports = open_ports
        self.total_ports = total_ports

    @property
    def exposure_ratio(self):
        # looks like a plain attribute from the outside, but it's computed on every access
        if self.total_ports == 0:
            return 0.0
        return len(self.open_ports) / self.total_ports

r = ScanResult([22, 80, 443], 1000)
print(r.exposure_ratio)  # 0.003 — no parentheses needed, reads like an attribute`}</CodeBlock>
      <p>
        <code>@property</code> lets you expose a method as if it were a plain attribute — useful when a
        value is always derived from other data and you never want it to silently go stale by being set
        directly and forgotten about.
      </p>

      <h2>Methods that mutate vs. methods that just read</h2>
      <CodeBlock>{`class PasswordVault:
    def __init__(self):
        self._secrets = {}

    def add_secret(self, name, value):     # mutates internal state
        self._secrets[name] = value

    def get_secret(self, name):             # only reads, never changes anything
        return self._secrets.get(name)

    def list_names(self):                   # only reads
        return sorted(self._secrets.keys())`}</CodeBlock>
      <p>
        It's worth noticing which of your methods change an object's state and which just report on it —
        this distinction becomes important once objects get passed around a larger program, since a
        "reading" method is always safe to call, while a "mutating" one needs more care about when and how
        often it runs.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-oop-01', title: 'A User Class With an Encapsulated, Hashed Password' },
          { id: 'py-oop-02', title: 'A PasswordVault Class' },
          { id: 'py-oop-03', title: 'FirewallRule and FirewallRuleEngine — Composition' },
        ]}
      />
    </div>
  );
}
