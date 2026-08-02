import type { CodeTask } from '../codeTypes';

/** Object-oriented Python applied to security tooling: encapsulation, inheritance, polymorphism,
 *  dunder methods, dataclasses, abstract base classes — the design vocabulary every real scanner,
 *  vault, or detection engine in this book is actually built from. */
export const PYTHON_OOP_TASKS: CodeTask[] = [
  {
    id: 'py-oop-01',
    title: 'A User Class With an Encapsulated, Hashed Password',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write a class User with __init__(self, username, password) that stores username directly but never ' +
      'stores the raw password — instead store its SHA-256 hex digest in a "private" attribute ' +
      '(self._password_hash). Add a method check_password(self, attempt) returning True if attempt hashes ' +
      'to the stored value. This is the core shape of every real authentication system: the plaintext ' +
      'password should never exist anywhere after the moment it\'s hashed.',
    starterCode:
      'import hashlib\n\n' +
      'class User:\n' +
      '    def __init__(self, username, password):\n' +
      '        # TODO: store username, and store only the sha256 hex digest of password\n' +
      '        pass\n\n' +
      '    def check_password(self, attempt):\n' +
      '        # TODO: return True if attempt hashes to the same value as the stored hash\n' +
      '        pass\n',
    hints: [
      'self.username = username is straightforward; for the password, hash it immediately in __init__ and never keep the original.',
      'Reuse hashlib.sha256(text.encode("utf-8")).hexdigest() for both the constructor and check_password.',
      'check_password just compares: hash the attempt the same way, and compare it to self._password_hash.',
    ],
    solution:
      'import hashlib\n\n' +
      'class User:\n' +
      '    def __init__(self, username, password):\n' +
      '        self.username = username\n' +
      '        self._password_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()\n\n' +
      '    def check_password(self, attempt):\n' +
      '        return hashlib.sha256(attempt.encode("utf-8")).hexdigest() == self._password_hash\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'u = User("alice", "hunter2")\n' +
      '__check__("username stored", u.username, "alice")\n' +
      '__check__("raw password not stored as attribute", "hunter2" not in vars(u).values(), True)\n' +
      '__check__("correct password", u.check_password("hunter2"), True)\n' +
      '__check__("wrong password", u.check_password("wrongpass"), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-02',
    title: 'A PasswordVault Class',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write a class PasswordVault with an empty internal dict in __init__. Add add_secret(self, name, ' +
      'value), get_secret(self, name) (returns the value, or None if not found), and list_names(self) ' +
      '(returns a sorted list of stored secret names — never the values). This "vault" shape — store by ' +
      'name, retrieve by name, never dump everything at once — is exactly how real secrets managers like ' +
      'Vault or AWS Secrets Manager are used from application code.',
    starterCode:
      'class PasswordVault:\n' +
      '    def __init__(self):\n' +
      '        # TODO: set up internal storage\n' +
      '        pass\n\n' +
      '    def add_secret(self, name, value):\n' +
      '        # TODO\n' +
      '        pass\n\n' +
      '    def get_secret(self, name):\n' +
      '        # TODO: return the value, or None if not found\n' +
      '        pass\n\n' +
      '    def list_names(self):\n' +
      '        # TODO: return a sorted list of stored names (not values)\n' +
      '        pass\n',
    hints: [
      'A plain dict on self (e.g. self._secrets = {}) is all the storage you need.',
      'dict.get(name) already returns None for a missing key, which is exactly get_secret\'s contract.',
      'list_names should return sorted(self._secrets.keys()), not the values.',
    ],
    solution:
      'class PasswordVault:\n' +
      '    def __init__(self):\n' +
      '        self._secrets = {}\n\n' +
      '    def add_secret(self, name, value):\n' +
      '        self._secrets[name] = value\n\n' +
      '    def get_secret(self, name):\n' +
      '        return self._secrets.get(name)\n\n' +
      '    def list_names(self):\n' +
      '        return sorted(self._secrets.keys())\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'v = PasswordVault()\n' +
      'v.add_secret("db", "s3cr3t")\n' +
      'v.add_secret("api", "tok123")\n' +
      '__check__("retrieves stored secret", v.get_secret("db"), "s3cr3t")\n' +
      '__check__("missing secret returns None", v.get_secret("nope"), None)\n' +
      '__check__("list_names sorted", v.list_names(), ["api", "db"])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-03',
    title: 'FirewallRule and FirewallRuleEngine — Composition',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write class FirewallRule with __init__(self, ip, action) where action is "ALLOW" or "BLOCK". Then ' +
      'write class FirewallRuleEngine with an empty list of rules in __init__, a method add_rule(self, ' +
      'rule) that appends a FirewallRule, and evaluate(self, ip) that returns the action of the FIRST rule ' +
      'matching that ip (checked in the order rules were added), or "ALLOW" by default if no rule matches. ' +
      'This first-match-wins evaluation order is exactly how real firewalls and ACLs process their rule lists.',
    starterCode:
      'class FirewallRule:\n' +
      '    def __init__(self, ip, action):\n' +
      '        # TODO\n' +
      '        pass\n\n' +
      'class FirewallRuleEngine:\n' +
      '    def __init__(self):\n' +
      '        # TODO\n' +
      '        pass\n\n' +
      '    def add_rule(self, rule):\n' +
      '        # TODO\n' +
      '        pass\n\n' +
      '    def evaluate(self, ip):\n' +
      '        # TODO: return the action of the first matching rule, or "ALLOW" if none match\n' +
      '        pass\n',
    hints: [
      'FirewallRuleEngine "has" FirewallRules — that\'s composition: store them in a list attribute, don\'t inherit from FirewallRule.',
      'evaluate should loop through self.rules in order and return as soon as rule.ip == ip.',
      'If the loop finishes with no match, fall through to returning "ALLOW".',
    ],
    solution:
      'class FirewallRule:\n' +
      '    def __init__(self, ip, action):\n' +
      '        self.ip = ip\n' +
      '        self.action = action\n\n' +
      'class FirewallRuleEngine:\n' +
      '    def __init__(self):\n' +
      '        self.rules = []\n\n' +
      '    def add_rule(self, rule):\n' +
      '        self.rules.append(rule)\n\n' +
      '    def evaluate(self, ip):\n' +
      '        for rule in self.rules:\n' +
      '            if rule.ip == ip:\n' +
      '                return rule.action\n' +
      '        return "ALLOW"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'engine = FirewallRuleEngine()\n' +
      'engine.add_rule(FirewallRule("10.0.0.5", "BLOCK"))\n' +
      'engine.add_rule(FirewallRule("10.0.0.5", "ALLOW"))\n' +
      '__check__("first matching rule wins", engine.evaluate("10.0.0.5"), "BLOCK")\n' +
      '__check__("default allow for unknown ip", engine.evaluate("8.8.8.8"), "ALLOW")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-04',
    title: 'Inheritance — a Scanner Base Class',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write a base class Scanner with __init__(self, target) storing target, and a method run(self) that ' +
      'raises NotImplementedError. Then write PortScanner(Scanner) and VulnScanner(Scanner), both calling ' +
      'the parent __init__ via super(), each overriding run(self) to return a distinct descriptive string ' +
      'mentioning self.target. Every real scanning framework (nmap wrappers, vuln scanners, recon tools) ' +
      'shares this shape: one base interface, many interchangeable implementations.',
    starterCode:
      'class Scanner:\n' +
      '    def __init__(self, target):\n' +
      '        # TODO\n' +
      '        pass\n\n' +
      '    def run(self):\n' +
      '        raise NotImplementedError\n\n' +
      'class PortScanner(Scanner):\n' +
      '    def run(self):\n' +
      '        # TODO: return f"Scanning ports on {self.target}"\n' +
      '        pass\n\n' +
      'class VulnScanner(Scanner):\n' +
      '    def run(self):\n' +
      '        # TODO: return f"Checking vulnerabilities on {self.target}"\n' +
      '        pass\n',
    hints: [
      'Scanner.__init__ just needs self.target = target.',
      'Subclasses inherit __init__ automatically since they don\'t define their own — no need to call super().__init__() unless you override __init__ too.',
      'Each run() override just needs an f-string using self.target.',
    ],
    solution:
      'class Scanner:\n' +
      '    def __init__(self, target):\n' +
      '        self.target = target\n\n' +
      '    def run(self):\n' +
      '        raise NotImplementedError\n\n' +
      'class PortScanner(Scanner):\n' +
      '    def run(self):\n' +
      '        return f"Scanning ports on {self.target}"\n\n' +
      'class VulnScanner(Scanner):\n' +
      '    def run(self):\n' +
      '        return f"Checking vulnerabilities on {self.target}"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'p = PortScanner("10.0.0.1")\n' +
      'v = VulnScanner("10.0.0.1")\n' +
      '__check__("port scanner output", p.run(), "Scanning ports on 10.0.0.1")\n' +
      '__check__("vuln scanner output", v.run(), "Checking vulnerabilities on 10.0.0.1")\n' +
      '__check__("both are Scanner instances", isinstance(p, Scanner) and isinstance(v, Scanner), True)\n' +
      'try:\n' +
      '    Scanner("x").run()\n' +
      '    __results__.append(("base run raises", False, "no exception", "NotImplementedError"))\n' +
      'except NotImplementedError:\n' +
      '    __results__.append(("base run raises", True, "NotImplementedError", "NotImplementedError"))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-05',
    title: 'Polymorphism — Alert Subclasses',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write a base class Alert with __init__(self, source) and a method describe(self) returning ' +
      'f"Generic alert from {self.source}". Write subclasses BruteForceAlert and MalwareAlert, each ' +
      'overriding describe() to return their own specific message mentioning self.source. Then write a ' +
      'function summarize(alerts) that takes a list of Alert (or subclass) instances and returns a list of ' +
      'their describe() strings, in order — notice the function never needs to know or care which subclass ' +
      'each alert actually is. That\'s the entire point of polymorphism: a SIEM\'s alert-processing loop ' +
      'never needs an if/elif chain checking types.',
    starterCode:
      'class Alert:\n' +
      '    def __init__(self, source):\n' +
      '        self.source = source\n\n' +
      '    def describe(self):\n' +
      '        return f"Generic alert from {self.source}"\n\n' +
      'class BruteForceAlert(Alert):\n' +
      '    def describe(self):\n' +
      '        # TODO: return f"Brute-force attempts detected from {self.source}"\n' +
      '        pass\n\n' +
      'class MalwareAlert(Alert):\n' +
      '    def describe(self):\n' +
      '        # TODO: return f"Malware activity detected from {self.source}"\n' +
      '        pass\n\n' +
      'def summarize(alerts):\n' +
      '    # TODO: return [a.describe() for a in alerts]\n' +
      '    pass\n',
    hints: [
      'Each describe() override is just one f-string using self.source — no need to call the parent version.',
      'summarize is a one-liner: build a list by calling .describe() on every alert in the input list, in order.',
      'This works precisely because every object in the list — regardless of its exact class — has a describe() method with the same name/signature.',
    ],
    solution:
      'class Alert:\n' +
      '    def __init__(self, source):\n' +
      '        self.source = source\n\n' +
      '    def describe(self):\n' +
      '        return f"Generic alert from {self.source}"\n\n' +
      'class BruteForceAlert(Alert):\n' +
      '    def describe(self):\n' +
      '        return f"Brute-force attempts detected from {self.source}"\n\n' +
      'class MalwareAlert(Alert):\n' +
      '    def describe(self):\n' +
      '        return f"Malware activity detected from {self.source}"\n\n' +
      'def summarize(alerts):\n' +
      '    return [a.describe() for a in alerts]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'alerts = [BruteForceAlert("10.0.0.5"), MalwareAlert("10.0.0.9"), Alert("10.0.0.1")]\n' +
      '__check__("summarize output", summarize(alerts), [\n' +
      '    "Brute-force attempts detected from 10.0.0.5",\n' +
      '    "Malware activity detected from 10.0.0.9",\n' +
      '    "Generic alert from 10.0.0.1",\n' +
      '])\n' +
      '__check__("empty list", summarize([]), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-06',
    title: 'Dunder Methods — a Hashable Fingerprint Class',
    difficulty: 'Hard',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write class Fingerprint with __init__(self, value) storing value, plus __eq__ (two Fingerprints are ' +
      'equal if their values are equal) and __hash__ (based on value) so instances can be safely used in ' +
      'sets and as dict keys. Without a correct __hash__/__eq__ pair, two Fingerprint objects representing ' +
      'the same underlying hash would be treated as different set members — exactly the kind of subtle bug ' +
      'that lets duplicate indicators-of-compromise slip past a dedup step.',
    starterCode:
      'class Fingerprint:\n' +
      '    def __init__(self, value):\n' +
      '        self.value = value\n\n' +
      '    def __eq__(self, other):\n' +
      '        # TODO: equal if other is a Fingerprint with the same value\n' +
      '        pass\n\n' +
      '    def __hash__(self):\n' +
      '        # TODO: hash based on self.value\n' +
      '        pass\n',
    hints: [
      'Check isinstance(other, Fingerprint) before comparing, so comparing to unrelated types doesn\'t crash and just returns False (or NotImplemented).',
      '__hash__ should be consistent with __eq__: equal objects must return the same hash, so hash(self.value) is the natural choice.',
      'Once both are defined correctly, Fingerprint("abc") == Fingerprint("abc") is True and {Fingerprint("abc"), Fingerprint("abc")} has length 1.',
    ],
    solution:
      'class Fingerprint:\n' +
      '    def __init__(self, value):\n' +
      '        self.value = value\n\n' +
      '    def __eq__(self, other):\n' +
      '        if not isinstance(other, Fingerprint):\n' +
      '            return NotImplemented\n' +
      '        return self.value == other.value\n\n' +
      '    def __hash__(self):\n' +
      '        return hash(self.value)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'a = Fingerprint("d41d8cd98f00b204e9800998ecf8427e")\n' +
      'b = Fingerprint("d41d8cd98f00b204e9800998ecf8427e")\n' +
      'c = Fingerprint("different")\n' +
      '__check__("equal values are equal", a == b, True)\n' +
      '__check__("different values are not equal", a == c, False)\n' +
      '__check__("dedups correctly in a set", len({a, b, c}), 2)\n' +
      '__check__("usable as dict key", {a: "seen"}.get(b), "seen")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-07',
    title: '__str__ vs __repr__ for a LogEntry Class',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write class LogEntry with __init__(self, level, message), a __str__ returning just ' +
      'f"[{self.level}] {self.message}" (a clean, human-readable line), and a __repr__ returning ' +
      'f"LogEntry(level={self.level!r}, message={self.message!r})" (an unambiguous, developer-facing form ' +
      'you could paste back into Python). Getting this distinction right matters a lot once you\'re ' +
      'debugging a script by printing/logging objects instead of guessing at their internals.',
    starterCode:
      'class LogEntry:\n' +
      '    def __init__(self, level, message):\n' +
      '        self.level = level\n' +
      '        self.message = message\n\n' +
      '    def __str__(self):\n' +
      '        # TODO\n' +
      '        pass\n\n' +
      '    def __repr__(self):\n' +
      '        # TODO\n' +
      '        pass\n',
    hints: [
      '__str__ is what str(obj)/print(obj) uses — keep it short and readable.',
      '__repr__ is what you see in a list/dict repr, or at a REPL prompt — the !r conversion in the f-string reuses repr() on level/message for you.',
      'The exact literal formats are given in the prompt — match them precisely, including spacing and the "LogEntry(...)" wrapper.',
    ],
    solution:
      'class LogEntry:\n' +
      '    def __init__(self, level, message):\n' +
      '        self.level = level\n' +
      '        self.message = message\n\n' +
      '    def __str__(self):\n' +
      '        return f"[{self.level}] {self.message}"\n\n' +
      '    def __repr__(self):\n' +
      '        return f"LogEntry(level={self.level!r}, message={self.message!r})"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'e = LogEntry("WARN", "disk almost full")\n' +
      '__check__("str", str(e), "[WARN] disk almost full")\n' +
      '__check__("repr", repr(e), "LogEntry(level=\'WARN\', message=\'disk almost full\')")\n' +
      '__check__("repr inside a list uses repr not str", repr([e]), "[LogEntry(level=\'WARN\', message=\'disk almost full\')]")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-08',
    title: 'An Abstract AuthProvider Interface',
    difficulty: 'Hard',
    language: 'python',
    category: 'OOP',
    prompt:
      'Using the abc module, write an abstract base class AuthProvider with an abstract method ' +
      'authenticate(self, username, password) (returning bool). Write two concrete subclasses: ' +
      'StaticAuthProvider(AuthProvider), whose __init__ takes a dict of {username: password} and whose ' +
      'authenticate checks against it, and AllowAllAuthProvider(AuthProvider) (mainly for local dev/testing), ' +
      'whose authenticate always returns True. Also confirm that AuthProvider itself cannot be instantiated ' +
      'directly. Abstract base classes are how real auth systems support swappable backends (LDAP, OAuth, ' +
      'local) behind one guaranteed interface.',
    starterCode:
      'from abc import ABC, abstractmethod\n\n' +
      'class AuthProvider(ABC):\n' +
      '    @abstractmethod\n' +
      '    def authenticate(self, username, password):\n' +
      '        ...\n\n' +
      'class StaticAuthProvider(AuthProvider):\n' +
      '    def __init__(self, credentials):\n' +
      '        # TODO: store credentials (a dict of username -> password)\n' +
      '        pass\n\n' +
      '    def authenticate(self, username, password):\n' +
      '        # TODO: return True if credentials.get(username) == password\n' +
      '        pass\n\n' +
      'class AllowAllAuthProvider(AuthProvider):\n' +
      '    def authenticate(self, username, password):\n' +
      '        # TODO: always return True\n' +
      '        pass\n',
    hints: [
      'StaticAuthProvider.__init__ just needs self.credentials = credentials.',
      'authenticate on StaticAuthProvider compares self.credentials.get(username) to the given password.',
      'Because AuthProvider has an @abstractmethod and inherits from ABC, Python itself will raise TypeError if you try AuthProvider() directly — you don\'t need to write that check yourself.',
    ],
    solution:
      'from abc import ABC, abstractmethod\n\n' +
      'class AuthProvider(ABC):\n' +
      '    @abstractmethod\n' +
      '    def authenticate(self, username, password):\n' +
      '        ...\n\n' +
      'class StaticAuthProvider(AuthProvider):\n' +
      '    def __init__(self, credentials):\n' +
      '        self.credentials = credentials\n\n' +
      '    def authenticate(self, username, password):\n' +
      '        return self.credentials.get(username) == password\n\n' +
      'class AllowAllAuthProvider(AuthProvider):\n' +
      '    def authenticate(self, username, password):\n' +
      '        return True\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'static = StaticAuthProvider({"alice": "hunter2"})\n' +
      '__check__("correct creds", static.authenticate("alice", "hunter2"), True)\n' +
      '__check__("wrong creds", static.authenticate("alice", "wrong"), False)\n' +
      '__check__("unknown user", static.authenticate("bob", "anything"), False)\n' +
      '__check__("allow-all always true", AllowAllAuthProvider().authenticate("anyone", "anything"), True)\n' +
      'try:\n' +
      '    AuthProvider()\n' +
      '    __results__.append(("cannot instantiate abstract base", False, "no error", "TypeError"))\n' +
      'except TypeError:\n' +
      '    __results__.append(("cannot instantiate abstract base", True, "TypeError", "TypeError"))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-09',
    title: 'A Vulnerability Dataclass',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Using @dataclass from the dataclasses module, define Vulnerability with fields cve_id: str, ' +
      'severity: str, cvss_score: float, and patched: bool = False (with a default). Dataclasses ' +
      'auto-generate __init__, __eq__, and a readable __repr__ for you — no boilerplate needed. This is the ' +
      'modern, idiomatic way to write small "just holds data" classes like scan findings or report rows.',
    starterCode:
      'from dataclasses import dataclass\n\n' +
      '# TODO: decorate this class with @dataclass and add the fields described in the prompt\n' +
      'class Vulnerability:\n' +
      '    pass\n',
    hints: [
      'Put @dataclass directly above the class definition.',
      'Fields are declared as class-level type-annotated attributes, e.g. cve_id: str — no __init__ needed at all.',
      'A field with a default value (patched: bool = False) must come after fields without defaults, same as regular Python function arguments.',
    ],
    solution:
      'from dataclasses import dataclass\n\n' +
      '@dataclass\n' +
      'class Vulnerability:\n' +
      '    cve_id: str\n' +
      '    severity: str\n' +
      '    cvss_score: float\n' +
      '    patched: bool = False\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'v1 = Vulnerability("CVE-2024-1234", "Critical", 9.8)\n' +
      'v2 = Vulnerability("CVE-2024-1234", "Critical", 9.8)\n' +
      'v3 = Vulnerability("CVE-2024-9999", "Low", 2.1, patched=True)\n' +
      '__check__("default patched is False", v1.patched, False)\n' +
      '__check__("auto __eq__ works", v1 == v2, True)\n' +
      '__check__("different fields not equal", v1 == v3, False)\n' +
      '__check__("explicit field set", v3.patched, True)\n' +
      '__check__("auto repr contains class name", "Vulnerability" in repr(v1), True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-10',
    title: 'Class Methods & Static Methods — an IPAddress Class',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write class IPAddress with __init__(self, octets) where octets is a tuple of 4 ints. Add a classmethod ' +
      'from_string(cls, s) that parses a "a.b.c.d" string and returns an IPAddress instance (use cls(...), ' +
      'not IPAddress(...), so subclasses would still work correctly). Add a staticmethod is_private(octets) ' +
      'that returns True if the first octet is 10, or the first two octets are 172 and a number from 16-31, ' +
      'or the first two octets are 192 and 168. Finally add an instance method to_string(self) that returns ' +
      'the standard dotted form. Classmethods are how you build alternate constructors; staticmethods are ' +
      'for logic that belongs conceptually to the class but needs no instance state at all.',
    starterCode:
      'class IPAddress:\n' +
      '    def __init__(self, octets):\n' +
      '        self.octets = octets\n\n' +
      '    @classmethod\n' +
      '    def from_string(cls, s):\n' +
      '        # TODO: parse "a.b.c.d" and return cls((a, b, c, d))\n' +
      '        pass\n\n' +
      '    @staticmethod\n' +
      '    def is_private(octets):\n' +
      '        # TODO: True for 10.x.x.x, 172.16-31.x.x, or 192.168.x.x\n' +
      '        pass\n\n' +
      '    def to_string(self):\n' +
      '        # TODO: return "a.b.c.d"\n' +
      '        pass\n',
    hints: [
      'from_string: split s on ".", convert each part to int, build a tuple, then return cls(that_tuple).',
      'is_private has 3 independent conditions joined by "or" — write each one as its own clear check on octets[0] and octets[1].',
      'to_string can use ".".join(str(o) for o in self.octets).',
    ],
    solution:
      'class IPAddress:\n' +
      '    def __init__(self, octets):\n' +
      '        self.octets = octets\n\n' +
      '    @classmethod\n' +
      '    def from_string(cls, s):\n' +
      '        parts = tuple(int(p) for p in s.split("."))\n' +
      '        return cls(parts)\n\n' +
      '    @staticmethod\n' +
      '    def is_private(octets):\n' +
      '        if octets[0] == 10:\n' +
      '            return True\n' +
      '        if octets[0] == 172 and 16 <= octets[1] <= 31:\n' +
      '            return True\n' +
      '        if octets[0] == 192 and octets[1] == 168:\n' +
      '            return True\n' +
      '        return False\n\n' +
      '    def to_string(self):\n' +
      '        return ".".join(str(o) for o in self.octets)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'ip = IPAddress.from_string("192.168.1.10")\n' +
      '__check__("from_string parses octets", ip.octets, (192, 168, 1, 10))\n' +
      '__check__("to_string roundtrips", ip.to_string(), "192.168.1.10")\n' +
      '__check__("10.x is private", IPAddress.is_private((10, 1, 2, 3)), True)\n' +
      '__check__("172.20.x is private", IPAddress.is_private((172, 20, 0, 1)), True)\n' +
      '__check__("172.40.x is not private", IPAddress.is_private((172, 40, 0, 1)), False)\n' +
      '__check__("8.8.8.8 is not private", IPAddress.is_private((8, 8, 8, 8)), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-11',
    title: 'Operator Overloading — Combine Two ACLs',
    difficulty: 'Hard',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write class AccessControlList with __init__(self, allowed) storing allowed as a set. Implement ' +
      '__add__(self, other) so that acl1 + acl2 returns a NEW AccessControlList whose allowed set is the ' +
      'union of both, and __contains__(self, item) so that "user" in acl works. Overloading + to mean ' +
      '"merge" only makes sense because it matches how people already think about combining permission ' +
      'sets — that\'s the whole judgment call behind operator overloading: only do it when it reads naturally.',
    starterCode:
      'class AccessControlList:\n' +
      '    def __init__(self, allowed):\n' +
      '        self.allowed = set(allowed)\n\n' +
      '    def __add__(self, other):\n' +
      '        # TODO: return a new AccessControlList with the union of both allowed sets\n' +
      '        pass\n\n' +
      '    def __contains__(self, item):\n' +
      '        # TODO: return whether item is in self.allowed\n' +
      '        pass\n',
    hints: [
      '__add__ should not mutate self or other — build and return a brand new AccessControlList from the union.',
      'self.allowed | other.allowed gives you the union of the two sets.',
      '__contains__ just needs `return item in self.allowed` — Python calls this automatically for the `in` operator.',
    ],
    solution:
      'class AccessControlList:\n' +
      '    def __init__(self, allowed):\n' +
      '        self.allowed = set(allowed)\n\n' +
      '    def __add__(self, other):\n' +
      '        return AccessControlList(self.allowed | other.allowed)\n\n' +
      '    def __contains__(self, item):\n' +
      '        return item in self.allowed\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'a = AccessControlList(["alice", "bob"])\n' +
      'b = AccessControlList(["carol"])\n' +
      'combined = a + b\n' +
      '__check__("union has all three", combined.allowed, {"alice", "bob", "carol"})\n' +
      '__check__("contains works", "alice" in combined, True)\n' +
      '__check__("contains false for missing", "dave" in combined, False)\n' +
      '__check__("originals untouched", a.allowed, {"alice", "bob"})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-12',
    title: 'Composition — an IncidentReport of Assets and Indicators',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Write class Asset with __init__(self, hostname, ip). Write class Indicator with __init__(self, ' +
      'kind, value) (kind is e.g. "hash" or "domain"). Write class IncidentReport with ' +
      '__init__(self, title) storing title and empty lists for assets and indicators, plus ' +
      'add_asset(self, asset) and add_indicator(self, indicator), and a summary(self) method returning ' +
      'f"{self.title}: {N} asset(s), {M} indicator(s)". This "report HAS-A list of assets and indicators" ' +
      'shape (composition) is deliberately simpler and more flexible here than trying to force ' +
      'inheritance between unrelated concepts.',
    starterCode:
      'class Asset:\n' +
      '    def __init__(self, hostname, ip):\n' +
      '        self.hostname = hostname\n' +
      '        self.ip = ip\n\n' +
      'class Indicator:\n' +
      '    def __init__(self, kind, value):\n' +
      '        self.kind = kind\n' +
      '        self.value = value\n\n' +
      'class IncidentReport:\n' +
      '    def __init__(self, title):\n' +
      '        # TODO: store title, set up empty asset/indicator lists\n' +
      '        pass\n\n' +
      '    def add_asset(self, asset):\n' +
      '        # TODO\n' +
      '        pass\n\n' +
      '    def add_indicator(self, indicator):\n' +
      '        # TODO\n' +
      '        pass\n\n' +
      '    def summary(self):\n' +
      '        # TODO: return f"{self.title}: {N} asset(s), {M} indicator(s)"\n' +
      '        pass\n',
    hints: [
      'IncidentReport.__init__ needs self.title, self.assets = [], self.indicators = [].',
      'add_asset/add_indicator are simple .append() calls onto the corresponding list.',
      'summary uses len(self.assets) and len(self.indicators) inside the f-string.',
    ],
    solution:
      'class Asset:\n' +
      '    def __init__(self, hostname, ip):\n' +
      '        self.hostname = hostname\n' +
      '        self.ip = ip\n\n' +
      'class Indicator:\n' +
      '    def __init__(self, kind, value):\n' +
      '        self.kind = kind\n' +
      '        self.value = value\n\n' +
      'class IncidentReport:\n' +
      '    def __init__(self, title):\n' +
      '        self.title = title\n' +
      '        self.assets = []\n' +
      '        self.indicators = []\n\n' +
      '    def add_asset(self, asset):\n' +
      '        self.assets.append(asset)\n\n' +
      '    def add_indicator(self, indicator):\n' +
      '        self.indicators.append(indicator)\n\n' +
      '    def summary(self):\n' +
      '        return f"{self.title}: {len(self.assets)} asset(s), {len(self.indicators)} indicator(s)"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'report = IncidentReport("Suspicious Lateral Movement")\n' +
      'report.add_asset(Asset("web01", "10.0.0.5"))\n' +
      'report.add_asset(Asset("db01", "10.0.0.9"))\n' +
      'report.add_indicator(Indicator("hash", "d41d8cd98f00b204e9800998ecf8427e"))\n' +
      '__check__("summary counts", report.summary(), "Suspicious Lateral Movement: 2 asset(s), 1 indicator(s)")\n' +
      '__check__("empty report", IncidentReport("Empty").summary(), "Empty: 0 asset(s), 0 indicator(s)")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-13',
    title: 'A Severity Enum for Sorting Alerts',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Using the enum module, define class Severity(Enum) with members LOW = 1, MEDIUM = 2, HIGH = 3, ' +
      'CRITICAL = 4. Then write sort_by_severity(alerts) where alerts is a list of (name, Severity) tuples, ' +
      'returning them sorted from most to least severe. An Enum gives you named, comparable, typo-proof ' +
      'constants instead of scattering raw strings like "high"/"High"/"HIGH" throughout a codebase.',
    starterCode:
      'from enum import Enum\n\n' +
      '# TODO: define Severity as an Enum with LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4\n' +
      'class Severity(Enum):\n' +
      '    pass\n\n' +
      'def sort_by_severity(alerts):\n' +
      '    # TODO: return alerts sorted from most to least severe (by Severity.value)\n' +
      '    pass\n',
    hints: [
      'Enum members are declared like class attributes: LOW = 1, MEDIUM = 2, and so on, directly in the class body.',
      'Each alert tuple is (name, Severity) — sort using the severity\'s .value.',
      'sorted(alerts, key=lambda a: a[1].value, reverse=True) sorts from highest value (most severe) to lowest.',
    ],
    solution:
      'from enum import Enum\n\n' +
      'class Severity(Enum):\n' +
      '    LOW = 1\n' +
      '    MEDIUM = 2\n' +
      '    HIGH = 3\n' +
      '    CRITICAL = 4\n\n' +
      'def sort_by_severity(alerts):\n' +
      '    return sorted(alerts, key=lambda a: a[1].value, reverse=True)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'alerts = [("port scan", Severity.LOW), ("ransomware", Severity.CRITICAL), ("failed logins", Severity.MEDIUM)]\n' +
      '__check__("sorted most to least severe", sort_by_severity(alerts), [\n' +
      '    ("ransomware", Severity.CRITICAL), ("failed logins", Severity.MEDIUM), ("port scan", Severity.LOW)\n' +
      '])\n' +
      '__check__("enum values correct", (Severity.LOW.value, Severity.CRITICAL.value), (1, 4))\n' +
      '__check__("empty list", sort_by_severity([]), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-14',
    title: 'A Token-Bucket RateLimiter Class',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Implement a RateLimiter class using the token-bucket algorithm. __init__(self, capacity, refill_rate) ' +
      'starts with a full bucket of capacity tokens. tick() adds refill_rate tokens to the bucket, never ' +
      'exceeding capacity. allow() consumes exactly 1 token and returns True if a token was available, or ' +
      'returns False (consuming nothing) if the bucket was empty.',
    starterCode:
      'class RateLimiter:\n' +
      '    def __init__(self, capacity, refill_rate):\n' +
      '        # TODO: store capacity/refill_rate, start with a FULL bucket\n' +
      '        pass\n\n' +
      '    def tick(self):\n' +
      '        # TODO: add refill_rate tokens, capped at capacity\n' +
      '        pass\n\n' +
      '    def allow(self):\n' +
      '        # TODO: consume 1 token and return True if available, else return False\n' +
      '        pass\n',
    hints: [
      'Store self.tokens = capacity in __init__ — the bucket starts full, not empty.',
      'tick() should do self.tokens = min(self.capacity, self.tokens + self.refill_rate).',
      'allow() checks if self.tokens >= 1 first — only decrement and return True in that branch, otherwise return False without touching self.tokens.',
    ],
    solution:
      'class RateLimiter:\n' +
      '    def __init__(self, capacity, refill_rate):\n' +
      '        self.capacity = capacity\n' +
      '        self.refill_rate = refill_rate\n' +
      '        self.tokens = capacity\n\n' +
      '    def tick(self):\n' +
      '        self.tokens = min(self.capacity, self.tokens + self.refill_rate)\n\n' +
      '    def allow(self):\n' +
      '        if self.tokens >= 1:\n' +
      '            self.tokens -= 1\n' +
      '            return True\n' +
      '        return False\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'rl = RateLimiter(capacity=3, refill_rate=1)\n' +
      '__check__("1st request allowed", rl.allow(), True)\n' +
      '__check__("2nd request allowed", rl.allow(), True)\n' +
      '__check__("3rd request allowed", rl.allow(), True)\n' +
      '__check__("4th request denied (bucket empty)", rl.allow(), False)\n' +
      'rl.tick()\n' +
      '__check__("allowed again after a tick refills one token", rl.allow(), True)\n' +
      '__check__("denied again immediately after", rl.allow(), False)\n\n' +
      'rl2 = RateLimiter(capacity=2, refill_rate=5)\n' +
      'rl2.allow()\n' +
      'rl2.allow()\n' +
      'rl2.tick()\n' +
      '__check__("refill never exceeds capacity", rl2.tokens, 2)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-oop-15',
    title: 'A Minimal Observer Pattern for Security Alerts',
    difficulty: 'Medium',
    language: 'python',
    category: 'OOP',
    prompt:
      'Implement an AlertBus class with subscribe(callback) (registers a callback) and publish(event) (calls ' +
      'every registered callback with event, in the order they were subscribed). Then implement a ' +
      'LoggingSubscriber class whose instances are callable (define __call__) — calling one with an event ' +
      'appends that event to the instance\'s own .log list, so a LoggingSubscriber can be used directly as a ' +
      'callback passed to subscribe().',
    starterCode:
      'class AlertBus:\n' +
      '    def __init__(self):\n' +
      '        # TODO: store a list of subscribed callbacks\n' +
      '        pass\n\n' +
      '    def subscribe(self, callback):\n' +
      '        # TODO: register callback\n' +
      '        pass\n\n' +
      '    def publish(self, event):\n' +
      '        # TODO: call every subscribed callback with event, in subscription order\n' +
      '        pass\n\n' +
      'class LoggingSubscriber:\n' +
      '    def __init__(self):\n' +
      '        # TODO: start with an empty log list\n' +
      '        pass\n\n' +
      '    def __call__(self, event):\n' +
      '        # TODO: append event to self.log\n' +
      '        pass\n',
    hints: [
      'AlertBus needs a plain list of callbacks in __init__; subscribe() just appends to it.',
      'publish() loops over the stored callbacks in the order they were added, calling each one with event.',
      '__call__ is what makes an instance usable as if it were a function — callback(event) on a LoggingSubscriber instance runs its __call__(self, event) method.',
    ],
    solution:
      'class AlertBus:\n' +
      '    def __init__(self):\n' +
      '        self._subscribers = []\n\n' +
      '    def subscribe(self, callback):\n' +
      '        self._subscribers.append(callback)\n\n' +
      '    def publish(self, event):\n' +
      '        for callback in self._subscribers:\n' +
      '            callback(event)\n\n' +
      'class LoggingSubscriber:\n' +
      '    def __init__(self):\n' +
      '        self.log = []\n\n' +
      '    def __call__(self, event):\n' +
      '        self.log.append(event)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'bus = AlertBus()\n' +
      'sub1 = LoggingSubscriber()\n' +
      'sub2 = LoggingSubscriber()\n' +
      'bus.subscribe(sub1)\n' +
      'bus.subscribe(sub2)\n' +
      'bus.publish("ransomware detected")\n' +
      'bus.publish("port scan detected")\n\n' +
      '__check__("sub1 received both events in order", sub1.log, ["ransomware detected", "port scan detected"])\n' +
      '__check__("sub2 received both events too", sub2.log, ["ransomware detected", "port scan detected"])\n\n' +
      'bus2 = AlertBus()\n' +
      'bus2.publish("no subscribers yet")\n' +
      '__check__("publish with zero subscribers does not error", True, True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
