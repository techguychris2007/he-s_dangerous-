import type { CodeTask } from '../../codeTypes';
import { grader } from './harness';

const base = { language: 'python', category: 'Software Engineering' } as const;

/** Module 1 practice: versioning, commit conventions, debugging search, requirements → code. */
export const SE_M1_TASKS: CodeTask[] = [
  {
    ...base,
    id: 'se-swe-01',
    title: 'Release Engineering: Bump a Semantic Version',
    difficulty: 'Easy',
    prompt:
      'Write bump(version, change) for a release tool. version is "MAJOR.MINOR.PATCH" with an optional pre-release ' +
      'suffix such as "2.0.0-rc.1". change is "major", "minor" or "patch". Return the next version string: a major ' +
      'bump resets minor and patch to 0, a minor bump resets patch. Bumping a pre-release by "patch" releases it ' +
      '("1.2.3-rc.1" → "1.2.3"); other bumps also drop the suffix. Raise ValueError for an unknown change or a ' +
      'version that is not three non-negative integers (e.g. "v1.2", "1.2", "1.x.0").',
    starterCode:
      'def bump(version: str, change: str) -> str:\n' +
      '    # TODO: split off any "-prerelease" suffix, parse three integers, apply the change\n' +
      '    pass\n',
    hints: [
      'core, _, pre = version.partition("-") separates "1.2.3" from "rc.1".',
      'Validate with parts = core.split("."); require len(parts) == 3 and every part.isdigit().',
      'For "patch" with a pre-release present, return the core unchanged; otherwise increment.',
    ],
    solution:
      'def bump(version: str, change: str) -> str:\n' +
      '    core, _, pre = version.partition("-")\n' +
      '    parts = core.split(".")\n' +
      '    if len(parts) != 3 or not all(p.isdigit() for p in parts):\n' +
      '        raise ValueError(f"not a semantic version: {version!r}")\n' +
      '    major, minor, patch = (int(p) for p in parts)\n' +
      '    if change == "major":\n' +
      '        return f"{major + 1}.0.0"\n' +
      '    if change == "minor":\n' +
      '        return f"{major}.{minor + 1}.0"\n' +
      '    if change == "patch":\n' +
      '        return core if pre else f"{major}.{minor}.{patch + 1}"\n' +
      '    raise ValueError(f"unknown change: {change!r}")\n',
    testCode: grader(`
__check__("patch", bump("1.4.2", "patch"), "1.4.3")
__check__("minor resets patch", bump("1.4.2", "minor"), "1.5.0")
__check__("major resets minor+patch", bump("1.4.2", "major"), "2.0.0")
__check__("0.x major", bump("0.9.7", "major"), "1.0.0")
__check__("patch releases a pre-release", bump("2.0.0-rc.1", "patch"), "2.0.0")
__check__("minor drops pre-release", bump("2.0.0-beta.3", "minor"), "2.1.0")
__raises__("rejects v prefix", lambda: bump("v1.2.3", "patch"), ValueError)
__raises__("rejects two parts", lambda: bump("1.2", "patch"), ValueError)
__raises__("rejects unknown change", lambda: bump("1.2.3", "huge"), ValueError)
`),
  },
  {
    ...base,
    id: 'se-swe-02',
    title: 'Release Engineering: Semantic Version Precedence',
    difficulty: 'Medium',
    prompt:
      'Implement compare(a, b) returning -1, 0 or 1 using the precedence rules of Semantic Versioning 2.0.0, ' +
      'section 11. Compare MAJOR, MINOR and PATCH numerically. A version with a pre-release has LOWER precedence ' +
      'than the same version without one (1.0.0-alpha < 1.0.0). Pre-release identifiers are compared dot by dot: ' +
      'numeric identifiers numerically, alphanumeric ones in ASCII order, numeric always lower than alphanumeric, ' +
      'and if all shared identifiers are equal, the version with fewer identifiers is lower. Build metadata ' +
      '(anything after "+") is ignored. Package managers use exactly this ordering to pick upgrades.',
    starterCode:
      'def compare(a: str, b: str) -> int:\n' +
      '    # TODO: strip "+build", split core and pre-release, compare by the SemVer rules\n' +
      '    pass\n',
    hints: [
      'Drop build metadata first: a = a.split("+")[0].',
      'Compare the core as a tuple of three ints. If they differ you are done.',
      'Map each pre-release identifier to a sortable key: (0, int(x)) for digits, (1, x) for text. A missing pre-release should sort after any present one.',
    ],
    solution:
      'def _key(version):\n' +
      '    version = version.split("+")[0]\n' +
      '    core, _, pre = version.partition("-")\n' +
      '    nums = tuple(int(p) for p in core.split("."))\n' +
      '    if not pre:\n' +
      '        return nums, (1,)\n' +
      '    ids = tuple((0, int(p), "") if p.isdigit() else (1, 0, p) for p in pre.split("."))\n' +
      '    return nums, (0, ids)\n\n' +
      'def compare(a: str, b: str) -> int:\n' +
      '    ka, kb = _key(a), _key(b)\n' +
      '    if ka[0] != kb[0]:\n' +
      '        return -1 if ka[0] < kb[0] else 1\n' +
      '    if ka[1] == kb[1]:\n' +
      '        return 0\n' +
      '    return -1 if ka[1] < kb[1] else 1\n',
    testCode: grader(`
__check__("numeric minor", compare("1.10.0", "1.9.0"), 1)
__check__("equal", compare("2.3.4", "2.3.4"), 0)
__check__("pre-release < release", compare("1.0.0-alpha", "1.0.0"), -1)
__check__("alpha < alpha.1", compare("1.0.0-alpha", "1.0.0-alpha.1"), -1)
__check__("alpha.1 < alpha.beta", compare("1.0.0-alpha.1", "1.0.0-alpha.beta"), -1)
__check__("beta.2 < beta.11 (numeric)", compare("1.0.0-beta.2", "1.0.0-beta.11"), -1)
__check__("beta.11 < rc.1", compare("1.0.0-beta.11", "1.0.0-rc.1"), -1)
__check__("build metadata ignored", compare("1.0.0+20260101", "1.0.0+exp.sha.5114f85"), 0)
__check__("major dominates", compare("2.0.0-rc.1", "1.99.99"), 1)
spec = ["1.0.0", "1.0.0-rc.1", "1.0.0-alpha", "1.0.0-beta.11", "1.0.0-alpha.beta", "1.0.0-beta", "1.0.0-alpha.1", "1.0.0-beta.2"]
import functools
__check__("sorts the SemVer spec example", sorted(spec, key=functools.cmp_to_key(compare)), ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta", "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0"])
`),
  },
  {
    ...base,
    id: 'se-swe-03',
    title: 'Git Hygiene: Parse a Conventional Commit',
    difficulty: 'Medium',
    prompt:
      'Write parse_commit(message) for a commit-lint hook. The first line must look like ' +
      '"type(scope)!: description" where scope and ! are optional, type is lowercase letters, and there is ' +
      'exactly one space after the colon. Return a dict {"type", "scope", "breaking", "description"} (scope is ' +
      'None when absent). breaking is True if the header has "!" OR any later line starts with ' +
      '"BREAKING CHANGE:" or "BREAKING-CHANGE:". Return None if the header does not match.',
    starterCode:
      'import re\n\n' +
      'def parse_commit(message: str):\n' +
      '    # TODO: match the header with a regular expression, then scan the footer lines\n' +
      '    pass\n',
    hints: [
      'A pattern such as r"^([a-z]+)(?:\\(([^()]+)\\))?(!)?: (\\S.*)$" captures type, scope, bang and description.',
      'Use message.splitlines(); the header is lines[0] and footers are lines[1:].',
      'line.startswith(("BREAKING CHANGE:", "BREAKING-CHANGE:")) accepts a tuple of prefixes.',
    ],
    solution:
      'import re\n\n' +
      'HEADER = re.compile(r"^([a-z]+)(?:\\(([^()]+)\\))?(!)?: (\\S.*)$")\n\n' +
      'def parse_commit(message: str):\n' +
      '    lines = message.splitlines()\n' +
      '    if not lines:\n' +
      '        return None\n' +
      '    match = HEADER.match(lines[0])\n' +
      '    if not match:\n' +
      '        return None\n' +
      '    kind, scope, bang, description = match.groups()\n' +
      '    footer_break = any(l.startswith(("BREAKING CHANGE:", "BREAKING-CHANGE:")) for l in lines[1:])\n' +
      '    return {"type": kind, "scope": scope, "breaking": bool(bang) or footer_break, "description": description}\n',
    testCode: grader(`
__check__("simple fix", parse_commit("fix: handle empty csv"), {"type": "fix", "scope": None, "breaking": False, "description": "handle empty csv"})
__check__("scoped feat", parse_commit("feat(export): stream rows"), {"type": "feat", "scope": "export", "breaking": False, "description": "stream rows"})
__check__("bang is breaking", parse_commit("feat(api)!: drop v1")["breaking"], True)
__check__("footer is breaking", parse_commit("refactor: rename config\\n\\nBREAKING CHANGE: strict is now validate")["breaking"], True)
__check__("hyphen footer", parse_commit("fix: x\\n\\nBREAKING-CHANGE: y")["breaking"], True)
__check__("rejects missing space", parse_commit("fix:no space"), None)
__check__("rejects capitalised type", parse_commit("Fix: typo"), None)
__check__("rejects free text", parse_commit("updated stuff"), None)
__check__("rejects empty", parse_commit(""), None)
`),
  },
  {
    ...base,
    id: 'se-swe-04',
    title: 'Git Hygiene: Compute the Next Release From Commits',
    difficulty: 'Medium',
    prompt:
      'Automate release numbering. Write next_version(current, messages) where current is "MAJOR.MINOR.PATCH" ' +
      'and messages is a list of commit messages since the last release. Use a parse_commit like the previous ' +
      'task (included in the starter). Ignore messages that do not parse. If any commit is breaking → bump MAJOR; ' +
      'else if any is "feat" → MINOR; else if any is "fix" or "perf" → PATCH; otherwise (only docs, chore, ' +
      'test, ci, …) return current unchanged — no release needed.',
    starterCode:
      'import re\n\n' +
      'HEADER = re.compile(r"^([a-z]+)(?:\\(([^()]+)\\))?(!)?: (\\S.*)$")\n\n' +
      'def parse_commit(message):\n' +
      '    lines = message.splitlines()\n' +
      '    m = HEADER.match(lines[0]) if lines else None\n' +
      '    if not m:\n' +
      '        return None\n' +
      '    kind, scope, bang, desc = m.groups()\n' +
      '    footer = any(l.startswith(("BREAKING CHANGE:", "BREAKING-CHANGE:")) for l in lines[1:])\n' +
      '    return {"type": kind, "scope": scope, "breaking": bool(bang) or footer, "description": desc}\n\n' +
      'def next_version(current: str, messages: list[str]) -> str:\n' +
      '    # TODO: find the strongest change and bump current accordingly\n' +
      '    pass\n',
    hints: [
      'Build parsed = [p for p in map(parse_commit, messages) if p].',
      'Check the strongest condition first: any(p["breaking"] for p in parsed).',
      'Reuse the bump logic: major → f"{ma+1}.0.0", minor → f"{ma}.{mi+1}.0", patch → f"{ma}.{mi}.{pa+1}".',
    ],
    solution:
      'import re\n\n' +
      'HEADER = re.compile(r"^([a-z]+)(?:\\(([^()]+)\\))?(!)?: (\\S.*)$")\n\n' +
      'def parse_commit(message):\n' +
      '    lines = message.splitlines()\n' +
      '    m = HEADER.match(lines[0]) if lines else None\n' +
      '    if not m:\n' +
      '        return None\n' +
      '    kind, scope, bang, desc = m.groups()\n' +
      '    footer = any(l.startswith(("BREAKING CHANGE:", "BREAKING-CHANGE:")) for l in lines[1:])\n' +
      '    return {"type": kind, "scope": scope, "breaking": bool(bang) or footer, "description": desc}\n\n' +
      'def next_version(current: str, messages: list[str]) -> str:\n' +
      '    parsed = [p for p in map(parse_commit, messages) if p]\n' +
      '    ma, mi, pa = (int(x) for x in current.split("."))\n' +
      '    if any(p["breaking"] for p in parsed):\n' +
      '        return f"{ma + 1}.0.0"\n' +
      '    if any(p["type"] == "feat" for p in parsed):\n' +
      '        return f"{ma}.{mi + 1}.0"\n' +
      '    if any(p["type"] in ("fix", "perf") for p in parsed):\n' +
      '        return f"{ma}.{mi}.{pa + 1}"\n' +
      '    return current\n',
    testCode: grader(`
__check__("fix only -> patch", next_version("1.4.2", ["fix: a", "docs: b"]), "1.4.3")
__check__("feat wins over fix", next_version("1.4.2", ["fix: a", "feat(ui): b"]), "1.5.0")
__check__("breaking wins", next_version("1.4.2", ["feat: a", "fix!: b"]), "2.0.0")
__check__("footer breaking", next_version("1.4.2", ["refactor: x\\n\\nBREAKING CHANGE: y"]), "2.0.0")
__check__("perf -> patch", next_version("0.3.0", ["perf: faster"]), "0.3.1")
__check__("no release for chores", next_version("1.4.2", ["docs: a", "chore: b", "ci: c"]), "1.4.2")
__check__("ignores junk messages", next_version("1.0.0", ["wip", "Fixed things", "fix: real"]), "1.0.1")
__check__("empty list", next_version("3.1.4", []), "3.1.4")
`),
  },
  {
    ...base,
    id: 'se-swe-05',
    title: 'Debugging: Implement git bisect',
    difficulty: 'Medium',
    prompt:
      'Implement first_bad(commits, is_bad) — the algorithm behind git bisect. commits is ordered oldest → ' +
      'newest; once a commit is bad, every later commit is bad too. Return the index of the first bad commit, or ' +
      'None if none are bad. is_bad is expensive (imagine a 5-minute test run): the tests count your calls and ' +
      'allow at most ceil(log2(n)) + 1 of them, so a linear scan fails.',
    starterCode:
      'def first_bad(commits: list[str], is_bad) -> int | None:\n' +
      '    # TODO: binary search for the boundary between good and bad\n' +
      '    pass\n',
    hints: [
      'Keep lo = 0 and hi = len(commits) (one past the end). The answer is always in [lo, hi].',
      'mid = (lo + hi) // 2; if is_bad(commits[mid]) the first bad is at mid or earlier (hi = mid), else lo = mid + 1.',
      'When lo == hi, return lo if lo < len(commits) else None.',
    ],
    solution:
      'def first_bad(commits: list[str], is_bad) -> int | None:\n' +
      '    lo, hi = 0, len(commits)\n' +
      '    while lo < hi:\n' +
      '        mid = (lo + hi) // 2\n' +
      '        if is_bad(commits[mid]):\n' +
      '            hi = mid\n' +
      '        else:\n' +
      '            lo = mid + 1\n' +
      '    return lo if lo < len(commits) else None\n',
    testCode: grader(`
import math
def __probe__(n, first):
    calls = []
    commits = [f"c{i}" for i in range(n)]
    def is_bad(c):
        calls.append(c)
        return first is not None and int(c[1:]) >= first
    return first_bad(commits, is_bad), len(calls)
r, c = __probe__(1000, 613)
__check__("finds the first bad of 1000", r, 613)
__check__("uses at most 11 runs for 1000 commits", c <= math.ceil(math.log2(1000)) + 1, True)
__check__("first commit bad", __probe__(64, 0)[0], 0)
__check__("last commit bad", __probe__(64, 63)[0], 63)
__check__("no bad commit", __probe__(50, None)[0], None)
__check__("empty history", __probe__(0, None)[0], None)
`),
  },
  {
    ...base,
    id: 'se-swe-06',
    title: 'Debugging: Minimise a Crashing Input',
    difficulty: 'Medium',
    prompt:
      'A tokenizer crashes on some input strings. Write minimise(text, crashes) that returns a 1-minimal failing ' +
      'string: crashes(result) is True, and deleting ANY single character from result makes crashes return ' +
      'False. Keep the remaining characters in their original order. Start by trying to delete larger chunks ' +
      '(halves, quarters, …) before single characters — it is much faster on big inputs — but correctness ' +
      'is what the tests check.',
    starterCode:
      'def minimise(text: str, crashes) -> str:\n' +
      '    assert crashes(text)\n' +
      '    # TODO: repeatedly remove chunks while the crash persists\n' +
      '    pass\n',
    hints: [
      'Use a chunk size that starts at len(text) // 2 and halves whenever no chunk of that size can be removed.',
      'For each start in range(0, len(text), size), try candidate = text[:start] + text[start + size:].',
      'Stop when size reaches 0; at size 1 you have tried every single-character deletion, so the result is 1-minimal.',
    ],
    solution:
      'def minimise(text: str, crashes) -> str:\n' +
      '    assert crashes(text)\n' +
      '    size = max(1, len(text) // 2)\n' +
      '    while size >= 1:\n' +
      '        removed = False\n' +
      '        start = 0\n' +
      '        while start < len(text):\n' +
      '            candidate = text[:start] + text[start + size:]\n' +
      '            if candidate != text and crashes(candidate):\n' +
      '                text = candidate\n' +
      '                removed = True\n' +
      '            else:\n' +
      '                start += size\n' +
      '        if not removed:\n' +
      '            size //= 2\n' +
      '    return text\n',
    testCode: grader(`
def __one_minimal__(s, crashes):
    return crashes(s) and all(not crashes(s[:i] + s[i + 1:]) for i in range(len(s)))
bug1 = lambda s: "<" in s and ">" in s and s.index("<") < s.rindex(">")
r1 = minimise("hello <b>world</b> and more text", bug1)
__check__("still crashes (tag)", bug1(r1), True)
__check__("1-minimal (tag)", __one_minimal__(r1, bug1), True)
__check__("tag case is two characters", len(r1), 2)
bug2 = lambda s: s.count("\\\\") >= 2
r2 = minimise("path\\\\to\\\\file.txt", bug2)
__check__("1-minimal (backslashes)", __one_minimal__(r2, bug2), True)
__check__("keeps order", r2, "\\\\\\\\")
bug3 = lambda s: "x9" in s
big = "a" * 500 + "x9" + "b" * 500
__check__("big input shrinks to 'x9'", minimise(big, bug3), "x9")
`),
  },
  {
    ...base,
    id: 'se-swe-07',
    title: 'Requirements to Code: Sign-up Acceptance Criteria',
    difficulty: 'Easy',
    prompt:
      'Implement validate_signup(email, password, confirm, existing) from these acceptance criteria. Return a list ' +
      'of error codes in this order (empty list = accepted): "invalid_email" if, after stripping spaces and ' +
      'lower-casing, the email does not have exactly one "@" with text on both sides and a "." in the domain part; ' +
      '"email_taken" if the normalised email is in existing (a set of normalised emails) — only checked when the ' +
      'email is valid; "password_too_short" if fewer than 12 characters; "password_contains_name" if the ' +
      'password contains the email\'s local part (case-insensitive, local part of at least 3 characters); ' +
      '"passwords_differ" if confirm != password.',
    starterCode:
      'def validate_signup(email: str, password: str, confirm: str, existing: set[str]) -> list[str]:\n' +
      '    errors = []\n' +
      '    # TODO: implement each acceptance criterion, in the order given\n' +
      '    return errors\n',
    hints: [
      'normalised = email.strip().lower(); local, _, domain = normalised.partition("@").',
      'Valid means normalised.count("@") == 1 and local and "." in domain (and the domain does not start or end with ".").',
      'Only test "password_contains_name" when the email was valid and len(local) >= 3.',
    ],
    solution:
      'def validate_signup(email: str, password: str, confirm: str, existing: set[str]) -> list[str]:\n' +
      '    errors = []\n' +
      '    normalised = email.strip().lower()\n' +
      '    local, _, domain = normalised.partition("@")\n' +
      '    valid = normalised.count("@") == 1 and bool(local) and "." in domain and not domain.startswith(".") and not domain.endswith(".")\n' +
      '    if not valid:\n' +
      '        errors.append("invalid_email")\n' +
      '    elif normalised in existing:\n' +
      '        errors.append("email_taken")\n' +
      '    if len(password) < 12:\n' +
      '        errors.append("password_too_short")\n' +
      '    if valid and len(local) >= 3 and local in password.lower():\n' +
      '        errors.append("password_contains_name")\n' +
      '    if confirm != password:\n' +
      '        errors.append("passwords_differ")\n' +
      '    return errors\n',
    testCode: grader(`
taken = {"ada@example.com"}
__check__("happy path", validate_signup("grace@example.com", "correct horse battery", "correct horse battery", taken), [])
__check__("duplicate, case-insensitive", validate_signup("  ADA@Example.com ", "correct horse battery", "correct horse battery", taken), ["email_taken"])
__check__("no domain dot", validate_signup("bob@localhost", "correct horse battery", "correct horse battery", taken), ["invalid_email"])
__check__("two @", validate_signup("a@b@c.com", "correct horse battery", "correct horse battery", taken), ["invalid_email"])
__check__("short password", validate_signup("grace@example.com", "short", "short", taken), ["password_too_short"])
__check__("contains name", validate_signup("grace@example.com", "Grace-Hopper-1906", "Grace-Hopper-1906", taken), ["password_contains_name"])
__check__("mismatch", validate_signup("grace@example.com", "correct horse battery", "correct horse batery", taken), ["passwords_differ"])
__check__("several errors in order", validate_signup("ada@example.com", "ada123", "ada12", taken), ["email_taken", "password_too_short", "password_contains_name", "passwords_differ"])
`),
  },
  {
    ...base,
    id: 'se-swe-08',
    title: 'Requirements to Code: Parse Given/When/Then Scenarios',
    difficulty: 'Medium',
    prompt:
      'Write parse_scenarios(text) that turns Gherkin-style acceptance criteria into data a test runner can ' +
      'execute. Return a list of {"name", "given", "when", "then"} dicts, one per "Scenario:" line, where the ' +
      'three keys hold lists of step texts (without the keyword). "And" and "But" steps belong to the most ' +
      'recent Given/When/Then. Ignore blank lines, "Feature:" lines and comment lines starting with "#". ' +
      'Leading/trailing whitespace must be stripped everywhere. Raise ValueError if a step appears before ' +
      'any Scenario, or an And/But appears before any Given/When/Then in its scenario.',
    starterCode:
      'def parse_scenarios(text: str) -> list[dict]:\n' +
      '    scenarios = []\n' +
      '    # TODO: walk the lines, tracking the current scenario and the last keyword\n' +
      '    return scenarios\n',
    hints: [
      'For each stripped line, split once: keyword, _, rest = line.partition(" ").',
      'Keep current (the scenario dict) and last ("given", "when" or "then"). Reset last to None on every new Scenario.',
      'Scenario names come after "Scenario:" — use line[len("Scenario:"):].strip().',
    ],
    solution:
      'def parse_scenarios(text: str) -> list[dict]:\n' +
      '    scenarios, current, last = [], None, None\n' +
      '    for raw in text.splitlines():\n' +
      '        line = raw.strip()\n' +
      '        if not line or line.startswith("#") or line.startswith("Feature:"):\n' +
      '            continue\n' +
      '        if line.startswith("Scenario:"):\n' +
      '            current = {"name": line[len("Scenario:"):].strip(), "given": [], "when": [], "then": []}\n' +
      '            scenarios.append(current)\n' +
      '            last = None\n' +
      '            continue\n' +
      '        keyword, _, rest = line.partition(" ")\n' +
      '        if current is None:\n' +
      '            raise ValueError(f"step outside a scenario: {line!r}")\n' +
      '        if keyword in ("Given", "When", "Then"):\n' +
      '            last = keyword.lower()\n' +
      '        elif keyword in ("And", "But"):\n' +
      '            if last is None:\n' +
      '                raise ValueError(f"{keyword} without a preceding step")\n' +
      '        else:\n' +
      '            raise ValueError(f"unknown keyword: {keyword!r}")\n' +
      '        current[last].append(rest.strip())\n' +
      '    return scenarios\n',
    testCode: grader(`
spec = """
Feature: Sign-up
  # happy path first
  Scenario: Successful sign-up
    Given no account exists for ada
    When ada signs up
    Then an account is created
    And a verification email is sent

  Scenario:   Duplicate email
    Given an account exists for ada
    And ada is not verified
    When ada signs up again
    Then sign-up is rejected
    But no email is sent
"""
out = parse_scenarios(spec)
__check__("two scenarios", len(out), 2)
__check__("first scenario", out[0], {"name": "Successful sign-up", "given": ["no account exists for ada"], "when": ["ada signs up"], "then": ["an account is created", "a verification email is sent"]})
__check__("And after Given", out[1]["given"], ["an account exists for ada", "ada is not verified"])
__check__("But after Then", out[1]["then"], ["sign-up is rejected", "no email is sent"])
__check__("name stripped", out[1]["name"], "Duplicate email")
__raises__("step before scenario", lambda: parse_scenarios("Given x"), ValueError)
__raises__("And before any step", lambda: parse_scenarios("Scenario: s\\nAnd x"), ValueError)
__check__("empty text", parse_scenarios(""), [])
`),
  },
];
