import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function InheritanceAndPolymorphism() {
  return (
    <div className="prose-hh">
      <h1>Inheritance, Polymorphism &amp; Composition</h1>
      <p>
        These three ideas are how you avoid rewriting the same code for every slightly-different variant of
        a thing — a PortScanner and a VulnScanner share almost everything except the actual scanning logic;
        a BruteForceAlert and a MalwareAlert share almost everything except how they describe themselves.
      </p>

      <h2>Inheritance — sharing a common base</h2>
      <CodeBlock label="a Scanner base class">{`class Scanner:
    def __init__(self, target):
        self.target = target

    def run(self):
        raise NotImplementedError   # forces subclasses to provide their own version

class PortScanner(Scanner):        # PortScanner "is a" Scanner
    def run(self):
        return f"Scanning ports on {self.target}"

class VulnScanner(Scanner):
    def run(self):
        return f"Checking vulnerabilities on {self.target}"

p = PortScanner("10.0.0.1")
print(p.run())            # "Scanning ports on 10.0.0.1"
print(p.target)           # "10.0.0.1" — inherited straight from Scanner.__init__
print(isinstance(p, Scanner))  # True — a PortScanner IS-A Scanner`}</CodeBlock>
      <p>
        <code>PortScanner(Scanner)</code> means "PortScanner inherits from Scanner." It automatically gets{' '}
        <code>Scanner</code>'s <code>__init__</code> (so <code>self.target</code> just works) without
        rewriting it, and it overrides <code>run()</code> with its own version.
      </p>

      <h2>super() — calling the parent's version explicitly</h2>
      <CodeBlock label="extending, not just replacing, a parent method">{`class LoggingScanner(Scanner):
    def __init__(self, target, log):
        super().__init__(target)   # calls Scanner.__init__(self, target) explicitly
        self.log = log

    def run(self):
        self.log.append(f"starting scan of {self.target}")
        return f"Scanning {self.target}"`}</CodeBlock>
      <p>
        You need <code>super().__init__(...)</code> whenever a subclass defines its own{' '}
        <code>__init__</code> but still wants the parent class's setup logic to run too — without it, the
        parent's <code>__init__</code> never executes and <code>self.target</code> would never get set.
      </p>

      <h2>Polymorphism — treating different types the same way</h2>
      <p>
        "Polymorphism" sounds abstract, but the idea is simple: if several different classes all provide a
        method with the same name, you can call that method on any of them without caring which exact class
        you're holding.
      </p>
      <CodeBlock label="polymorphism in action">{`class Alert:
    def __init__(self, source):
        self.source = source
    def describe(self):
        return f"Generic alert from {self.source}"

class BruteForceAlert(Alert):
    def describe(self):
        return f"Brute-force attempts detected from {self.source}"

class MalwareAlert(Alert):
    def describe(self):
        return f"Malware activity detected from {self.source}"

def summarize(alerts):
    # this function never checks "if type(a) is BruteForceAlert" anywhere —
    # it just trusts that every alert has a describe() method
    return [a.describe() for a in alerts]

alerts = [BruteForceAlert("10.0.0.5"), MalwareAlert("10.0.0.9")]
print(summarize(alerts))`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is the real payoff of polymorphism: a SIEM's alert-processing loop, a scanner's report
          generator, or any function operating on a list of "things that share an interface" never needs an{' '}
          <code>if/elif</code> chain checking exact types. Adding a brand new <code>PhishingAlert</code>{' '}
          subclass later requires zero changes to <code>summarize</code> — it already works.
        </p>
      </Callout>

      <h2>Duck typing: polymorphism without even sharing a base class</h2>
      <p>
        The <code>summarize()</code> function above never checks that its arguments inherit from{' '}
        <code>Alert</code> — it just calls <code>.describe()</code> and trusts it exists. Python takes this
        further than languages that require a formal shared interface: <strong>"if it walks like a duck and
        quacks like a duck"</strong> — any object with a matching method works, inheritance relationship or
        not.
      </p>
      <CodeBlock label="an unrelated class, no shared base, works anyway">{`class ThirdPartyFinding:      # doesn't inherit from Alert at all
    def __init__(self, note):
        self.note = note
    def describe(self):
        return f"External finding: {self.note}"

mixed = [BruteForceAlert("10.0.0.5"), ThirdPartyFinding("leaked API key")]
print(summarize(mixed))   # works fine — summarize() never cared about the class hierarchy, only the method`}</CodeBlock>
      <p>
        This is why Python's built-in <code>isinstance()</code> checks are used far more sparingly than in
        strictly-typed languages — most Python code is written to trust behavior (does it have the method I
        need?) over identity (is it officially the right type?), a philosophy usually summarized as{' '}
        <strong>"ask forgiveness, not permission."</strong>
      </p>

      <h2>Composition — when inheritance is the wrong tool</h2>
      <p>
        Inheritance models "IS-A" relationships (a PortScanner <em>is a</em> Scanner). But not everything
        fits that shape. An <code>IncidentReport</code> isn't a kind of <code>Asset</code> or a kind of{' '}
        <code>Indicator</code> — it just <em>has</em> a list of each. Forcing that into inheritance would be
        awkward; composition (storing other objects as attributes) is the natural fit.
      </p>
      <CodeBlock label="composition — HAS-A instead of IS-A">{`class Asset:
    def __init__(self, hostname, ip):
        self.hostname = hostname
        self.ip = ip

class IncidentReport:
    def __init__(self, title):
        self.title = title
        self.assets = []          # IncidentReport HAS-A list of assets

    def add_asset(self, asset):
        self.assets.append(asset)`}</CodeBlock>
      <p>
        A useful rule of thumb: reach for inheritance when you can honestly say "X is a kind of Y" and the
        subclass genuinely needs everything the parent provides. Reach for composition — just storing
        other objects as attributes — for almost everything else. Composition is generally more flexible
        and harder to get tangled up than deep inheritance hierarchies.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-oop-04', title: 'Inheritance — a Scanner Base Class' },
          { id: 'py-oop-05', title: 'Polymorphism — Alert Subclasses' },
          { id: 'py-oop-12', title: 'Composition — an IncidentReport of Assets and Indicators' },
        ]}
      />
    </div>
  );
}
