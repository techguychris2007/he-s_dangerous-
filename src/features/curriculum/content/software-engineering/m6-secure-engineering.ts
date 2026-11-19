import type { CurriculumLesson } from '../curriculumDefinition';
import { SE_SOURCES as S } from './sources';

/** Module 8 — secure software engineering: designing for security, injection, secrets and
 *  passwords, and the software supply chain. Vulnerable and secure code are shown side by side and
 *  mapped to CWE; every code block runs on Python 3.12 with the standard library and checks its own
 *  result. Facts checked against OWASP ASVS 5.0.0, NIST SP 800-218, SLSA v1.2, the 2025 CWE Top 25
 *  and the OWASP Password Storage Cheat Sheet (see docs/improvement/SOURCES.md). */
export const SE_MODULE_6: CurriculumLesson[] = [
  {
    id: 'swe-21',
    slug: 'secure-by-design',
    title: 'Secure by Design: Threat Models, ASVS and the SSDF',
    summary: 'Find security problems while they are still cheap to fix: model threats with STRIDE per element, set requirements with OWASP ASVS, organise the work with NIST\'s SSDF, and validate input at every trust boundary.',
    minutes: 26,
    prerequisite: 'SE 6 (Design & Architecture). No security background is needed; every term is explained.',
    outcomes: [
      'Draw a data-flow diagram with trust boundaries and apply STRIDE per element to it.',
      'Choose an OWASP ASVS level for a system and turn it into testable requirements.',
      'Explain the four practice groups of the NIST Secure Software Development Framework.',
      'Validate untrusted input with allow-lists and block mass assignment.',
    ],
    introduction:
      'Most security bugs are ordinary design and construction mistakes that an attacker happens to find first. The MITRE CWE Top 25 for 2025 is led by cross-site scripting (CWE-79), SQL injection (CWE-89), cross-site request forgery (CWE-352), missing authorization (CWE-862) and out-of-bounds write (CWE-787): mistakes made while writing normal features. This module treats security the way the rest of this track treats correctness: as something you design for, specify, test and review, rather than bolt on before release.',
    keyTerms: [
      { term: 'Trust boundary', meaning: 'A line in a system where data or control passes between parties that trust each other differently.' },
      { term: 'STRIDE', meaning: 'Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.' },
      { term: 'ASVS', meaning: 'OWASP Application Security Verification Standard: a catalogue of testable security requirements in three levels.' },
      { term: 'SSDF', meaning: 'NIST SP 800-218, the Secure Software Development Framework of practices for building secure software.' },
      { term: 'Mass assignment', meaning: 'Copying every client-supplied field into an object, letting a user set fields such as role (CWE-915).' },
    ],
    sections: [
      {
        title: 'Threat modelling in four questions',
        paragraphs: [
          'The Threat Modeling Manifesto reduces the practice to four questions: What are we working on? What can go wrong? What are we going to do about it? Did we do a good enough job? Answer the first with a data-flow diagram: external entities (users, other systems), processes (your code), data stores (databases, buckets, logs) and the data flows between them. Then draw trust boundaries wherever data crosses from something you control to something you do not, such as the internet to your API, or your API to a third-party payment service.',
          'Every arrow that crosses a trust boundary is a place where input must be validated, identity must be checked and failures must be handled. Most real vulnerabilities sit on these arrows.',
        ],
      },
      {
        title: 'STRIDE per element',
        paragraphs: [
          'STRIDE names six kinds of threat. Rather than asking all six questions about everything, the STRIDE-per-element approach described by Microsoft and Adam Shostack asks only the ones that apply to each kind of element: external entities can be spoofed or can repudiate (deny) actions; processes are exposed to all six; data stores can be tampered with, can disclose information or can be made unavailable, and a data store that holds logs also faces repudiation, because deleting or altering logs is how actions get denied; data flows can be tampered with, read or interrupted.',
          'The output is a list of threats, each with a decision: mitigate, eliminate, transfer or accept, with an owner. This lesson\'s second coding task builds the checker that finds gaps in such a list.',
        ],
        code: `APPLICABLE = {"external_entity": "SR", "process": "STRIDE", "data_store": "TID", "data_flow": "TID"}

def gaps(kind, recorded):
    return sorted(set(APPLICABLE[kind]) - set(recorded))

# The upload API has threats recorded for S, T, I and D only.
assert gaps("process", "STID") == ["E", "R"]
# Nobody can "elevate privilege" as a data flow, so E is not required there.
assert gaps("data_flow", "TID") == []
print("process gaps:", gaps("process", "STID"))`,
        label: 'STRIDE per element as data',
      },
      {
        title: 'Requirements you can test: OWASP ASVS 5.0',
        paragraphs: [
          'Threat models say what could go wrong; requirements say what the software must do about it. OWASP ASVS 5.0.0, released in May 2025, lists roughly 350 testable requirements in 17 chapters, grouped into three cumulative levels: Level 1 is the minimum every application should meet, Level 2 suits most applications that handle sensitive data, and Level 3 is for systems where failure is critical. Pick a level per system, copy the relevant requirements into your backlog, and cite them with the version, because requirement numbers and levels change between releases.',
          'A requirement such as "verify that the application uses parameterised queries for all database access" becomes a code-review checklist item and an automated test, which is the same discipline as the specification lessons in SE 4.',
        ],
      },
      {
        title: 'Organising the work: NIST SSDF',
        paragraphs: [
          'NIST SP 800-218, the Secure Software Development Framework (version 1.1, February 2022), groups practices into four families: Prepare the Organization (PO: roles, training, tooling, security requirements), Protect the Software (PS: protect code and releases from tampering, keep provenance), Produce Well-Secured Software (PW: design, threat modelling, secure coding, review and testing), and Respond to Vulnerabilities (RV: find, triage, fix and learn from root causes). NIST published a draft version 1.2 in December 2025; check the NIST project page for the current final version before citing practice numbers.',
          'The SSDF does not prescribe tools. It is a checklist for whether your process covers each area, and it is increasingly used by customers, including governments, to ask suppliers how they build software.',
        ],
      },
      {
        title: 'Validate at the boundary with allow-lists',
        paragraphs: [
          'Validation decides whether input is acceptable before your code uses it. Deny-lists ("reject anything containing <script") fail because attackers have endless encodings; allow-lists ("a username is 3–20 characters of a–z, 0–9 and _") accept only what you expect. Validate type, length, range and format, and reject fields you did not ask for, so a client cannot send role=admin and have it copied into the user record (mass assignment, CWE-915).',
          'Validation is not the only defence. It narrows what reaches your code, but each place that interprets data still needs its own protection: parameterised queries for SQL, encoding for HTML, safe APIs for the shell. Lesson 22 covers those.',
        ],
        code: `import re

ALLOWED = {"username", "email"}
USERNAME = re.compile(r"[a-z0-9_]{3,20}")

def validate(payload):
    errors = sorted(k for k in payload if k not in ALLOWED)          # mass assignment
    if not USERNAME.fullmatch(str(payload.get("username", ""))):
        errors.append("username")
    return errors

assert validate({"username": "ama_k", "email": "a@b.co"}) == []
assert validate({"username": "ama_k", "email": "a@b.co", "role": "admin"}) == ["role"]
assert validate({"username": "<script>"}) == ["username"]           # no deny-list needed
print("allow-list validation works")`,
        label: 'Allow-list validation and mass-assignment protection',
      },
    ],
    table: {
      headers: ['Element', 'STRIDE categories to consider', 'Typical control'],
      rows: [
        ['External entity (user, partner)', 'Spoofing, Repudiation', 'Strong authentication, signed audit records'],
        ['Process (your service)', 'All six', 'Least privilege, input validation, authorisation checks'],
        ['Data store (database, bucket)', 'Tampering, Information disclosure, Denial of service; plus Repudiation for logs', 'Access control, encryption, backups, append-only logs'],
        ['Data flow (API call, queue)', 'Tampering, Information disclosure, Denial of service', 'TLS, message signing, rate limits and timeouts'],
      ],
    },
    exercise: {
      scenario: 'A team is adding "share a file by link" to an internal document system: a user uploads a file, the API stores it in object storage, and anyone with the link can download it for seven days. The design note covers authentication for uploads and TLS everywhere.',
      task: 'Draw the elements and trust boundaries, apply STRIDE per element, and name the three most important missing controls with an ASVS-style requirement for each.',
      answer: 'Elements: uploader (external entity), link recipient (external entity), API (process), object store (data store), upload and download flows. Missing controls: (1) Information disclosure on the download flow: links must be unguessable (at least 128 bits from a CSPRNG) and expire server-side; requirement: "verify that shared links are random, single-purpose and expire after the configured period". (2) Repudiation: nothing records who created or used a link; requirement: "verify that link creation and downloads are logged with user, file and time, without logging the link token". (3) Denial of service and tampering on uploads: no size or type limits; requirement: "verify that uploads enforce size limits and allowed content types and are stored outside the web root".',
      evidence: 'A diagram with two external entities and a boundary between the internet and the API, a STRIDE category per element, and testable requirements rather than general advice.',
    },
    misconceptions: [
      'Security is a phase at the end. Design mistakes found in review cost far less to fix than the same mistakes found in production.',
      'Input validation prevents injection. It reduces risk, but each interpreter still needs its own safe API (parameterised queries, output encoding).',
      'A deny-list of dangerous strings is enough. Attackers have many encodings; allow-lists accept only what you expect.',
      'Threat modelling needs special tools. A whiteboard diagram and the four questions are enough to start.',
    ],
    sources: [S.threatManifesto, S.msStride, S.asvs, S.ssdf, S.cweTop25, S.owaspInputValidation],
    labs: [],
    questions: [
      { prompt: 'Which STRIDE letters apply to an external entity under STRIDE per element? (two letters)', answer: 'S and R', accept: ['SR', 'S R', 'RS', 'R and S', 'spoofing and repudiation'] },
      { prompt: 'What is the CWE identifier for SQL injection, ranked second in the 2025 CWE Top 25?', answer: 'CWE-89', accept: ['89', 'cwe 89'] },
    ],
    quiz: [
      { question: 'Why are allow-lists preferred over deny-lists for input validation?', options: ['They are faster to run', 'They accept only expected input instead of trying to list every bad input', 'They remove the need for parameterised queries', 'They encrypt the input'], answer: 1, explanation: 'Attackers can encode bad input in endless ways; describing what is valid is far more reliable.' },
      { question: 'Which element types face all six STRIDE threats?', options: ['Data flows', 'External entities', 'Processes', 'Data stores'], answer: 2, explanation: 'Processes run your code, so they can be spoofed, tampered with, deny actions, leak data, be stopped, or let attackers gain privileges.' },
      { question: 'What are the four practice groups of NIST SP 800-218 (SSDF)?', options: ['Identify, Protect, Detect, Respond', 'Prepare the Organization, Protect the Software, Produce Well-Secured Software, Respond to Vulnerabilities', 'Plan, Build, Test, Deploy', 'Govern, Map, Measure, Manage'], answer: 1, explanation: 'PO, PS, PW and RV. The first option is part of the Cybersecurity Framework; the last is the AI Risk Management Framework.' },
      { question: 'A client sends {"username": "ama", "role": "admin"} to a signup endpoint that saves every field. What weakness is this?', options: ['Mass assignment (CWE-915)', 'Path traversal', 'Cross-site scripting', 'Race condition'], answer: 0, explanation: 'Binding every client field into an object lets users set fields they should never control.' },
      { question: 'Why cite the ASVS version together with a requirement number?', options: ['It is a legal requirement', 'Numbers and levels can change between releases', 'Old versions are free and new ones are not', 'Only version 5 has levels'], answer: 1, explanation: 'OWASP recommends citing the version because requirements move between chapters and levels.' },
    ],
  },
  {
    id: 'swe-22',
    slug: 'injection-and-path-traversal',
    title: 'Injection: Keep Data Out of the Code Channel',
    summary: 'Understand why SQL injection, OS command injection and path traversal happen, and fix each with the safe API: bound parameters, argument lists without a shell, and path containment checks.',
    minutes: 28,
    prerequisite: 'Lesson 21 and SE 7 (basic SQL with sqlite3).',
    outcomes: [
      'Explain injection as data being interpreted as code by another component.',
      'Fix SQL injection with bound parameters and allow-list identifiers that cannot be bound.',
      'Run external programs without a shell and without letting input become options.',
      'Contain user-supplied file paths inside a base directory (CWE-22).',
    ],
    introduction:
      'Injection happens when your program builds a command for another interpreter (a database, a shell, a file system, a browser) by pasting untrusted text into it. The interpreter cannot tell which parts you meant as code and which parts came from the user. SQL injection (CWE-89) is second, path traversal (CWE-22) sixth and OS command injection (CWE-78) ninth in the 2025 CWE Top 25. The fix is the same idea every time: use an API that keeps code and data in separate channels.',
    keyTerms: [
      { term: 'Injection', meaning: 'Untrusted data being interpreted as code or commands by another component.' },
      { term: 'Bound parameter', meaning: 'A placeholder in a query whose value is sent separately from the SQL text, so it is never parsed as SQL.' },
      { term: 'Path traversal', meaning: 'Using ../ or absolute paths to reach files outside the intended directory (CWE-22).' },
      { term: 'Second-order injection', meaning: 'Malicious input that is stored safely, then later used unsafely in another query or command.' },
    ],
    sections: [
      {
        title: 'SQL injection: vulnerable and fixed',
        paragraphs: [
          'The vulnerable version builds SQL with an f-string, so a name like \' OR \'1\'=\'1 changes the query\'s logic. The fixed version uses a placeholder: sqlite3 sends the SQL text and the value separately, so the value can never become SQL, whatever characters it contains. Escaping quotes by hand is not a substitute; it is easy to get wrong and differs between databases.',
        ],
        code: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("create table users (name text, is_admin int)")
db.executemany("insert into users values (?, ?)", [("ama", 0), ("kofi", 1)])

def find_vulnerable(name):              # CWE-89: input pasted into SQL text
    return db.execute(f"select name from users where name = '{name}'").fetchall()

def find_safe(name):                    # bound parameter: data stays data
    return db.execute("select name from users where name = ?", (name,)).fetchall()

attack = "x' or '1'='1"
assert find_vulnerable(attack) == [("ama",), ("kofi",)]   # every row leaks
assert find_safe(attack) == []                             # no user has that name
print("vulnerable:", find_vulnerable(attack), "safe:", find_safe(attack))`,
        label: 'CWE-89: f-string versus bound parameter',
      },
      {
        title: 'What parameters cannot do: identifiers and LIKE',
        paragraphs: [
          'Placeholders carry values, not identifiers: you cannot bind a column name for ORDER BY or a table name. When users choose a sort column, map their choice through a fixed dictionary of allowed column names and reject anything else. In LIKE patterns, % and _ are wildcards even inside a bound value, so escape them (and the escape character) if users should search for them literally, and add an ESCAPE clause.',
          'Object-relational mappers (ORMs) bind parameters for you, but most still offer raw-SQL escape hatches. Search code review diffs for string formatting near execute(, raw(, or text(.',
        ],
        code: `SORTS = {"name": "name", "newest": "created_at desc"}

def order_clause(choice):
    try:
        return "order by " + SORTS[choice]
    except KeyError:
        raise ValueError(f"unsupported sort: {choice!r}") from None

assert order_clause("newest") == "order by created_at desc"
try:
    order_clause("name; drop table users")
except ValueError as error:
    print("rejected:", error)`,
        label: 'Allow-listing identifiers that cannot be bound',
      },
      {
        title: 'OS command injection: no shell, no surprises',
        paragraphs: [
          'subprocess.run("ping -c 1 " + host, shell=True) hands the whole string to /bin/sh, so a host of 8.8.8.8; cat /etc/passwd runs a second command (CWE-78). Pass a list of arguments with the default shell=False instead: the program receives each list item as one argument and no shell parses it. The Python documentation\'s security considerations for subprocess make the same recommendation.',
          'A list is not the whole story. If user input can start with a dash, the target program may read it as an option (argument injection, CWE-88). Validate the value, and where the program supports it put -- before user input to mark the end of options. Better still, use a library function instead of a program where one exists (for example socket or shutil rather than calling ping or cp).',
        ],
        code: `import ipaddress, shlex

def ping_command(host):
    ipaddress.ip_address(host)            # allow-list: must parse as an IP address
    return ["ping", "-c", "1", "--", host]

print(shlex.join(ping_command("8.8.8.8")))
for bad in ["8.8.8.8; cat /etc/passwd", "-f", "$(reboot)"]:
    try:
        ping_command(bad)
    except ValueError:
        print("rejected:", bad)`,
        label: 'CWE-78: build an argument list from validated input',
      },
      {
        title: 'Path traversal: contain the path',
        paragraphs: [
          'A download handler that does open(UPLOADS + "/" + name) serves ../../etc/passwd as happily as report.pdf. Removing "../" once does not help: "....//" becomes "../" after one pass. Instead, build the full path, normalise it, and check that the result is still inside the base directory. On a real file system also resolve symbolic links (os.path.realpath or Path.resolve) before the check, because a link inside the folder can point anywhere. The lesson\'s second coding task asks you to implement the containment check.',
        ],
        code: `import posixpath

def contained(base, user_path):
    root = posixpath.normpath(base)
    full = posixpath.normpath(posixpath.join(root, user_path))
    return full.startswith(root + "/")

assert contained("/srv/uploads", "2026/report.pdf")
assert not contained("/srv/uploads", "../../etc/passwd")
assert not contained("/srv/uploads", "/etc/passwd")            # join() discards the base for absolute paths
assert not contained("/srv/uploads", "../uploads-private/key")   # same prefix, different folder
print("containment checks pass")`,
        label: 'CWE-22: normalise, then check containment',
      },
    ],
    table: {
      headers: ['Weakness', 'Vulnerable pattern', 'Safe pattern'],
      rows: [
        ['SQL injection (CWE-89)', 'f"... where name = \'{name}\'"', 'execute("... where name = ?", (name,)); allow-list for ORDER BY'],
        ['OS command injection (CWE-78)', 'subprocess.run("cmd " + arg, shell=True)', 'subprocess.run(["cmd", "--", arg]) with validated arg, or a library call'],
        ['Path traversal (CWE-22)', 'open(base + "/" + name)', 'Normalise and resolve, then require the path to stay under base'],
        ['Cross-site scripting (CWE-79)', 'Building HTML by string concatenation', 'A templating engine that encodes output by default'],
      ],
    },
    exercise: {
      scenario: 'A reporting service lets staff export a CSV: GET /export?table=orders&sort=created_at&file=orders-nov.csv. The handler runs f"select * from {table} order by {sort}", writes the result to /srv/exports/{file}, then calls subprocess.run(f"gzip {path}", shell=True).',
      task: 'List every injection point, the CWE for each, and the fix.',
      answer: 'table and sort are identifiers pasted into SQL (CWE-89): map both through allow-lists of permitted tables and columns. file is joined onto a directory (CWE-22): accept only a generated name, or normalise and require the result to stay under /srv/exports. The gzip call passes a path through a shell (CWE-78): use subprocess.run(["gzip", "--", path]) or Python\'s gzip module, which removes the external program entirely.',
      evidence: 'Three injection points identified, each mapped to a CWE, and each fixed with a channel-separating API or an allow-list rather than escaping.',
    },
    misconceptions: [
      'Escaping quotes is as good as parameters. Escaping rules differ between databases and are easy to get wrong; bound parameters keep values out of the SQL text entirely.',
      'An ORM makes SQL injection impossible. Raw-query features and string-built filters still exist and still inject.',
      'Using a list with subprocess makes any argument safe. Input that starts with a dash can still be read as an option.',
      'Stripping ../ fixes path traversal. Encodings and patterns such as ....// survive; check the final normalised path instead.',
    ],
    sources: [S.owaspSqli, S.sqlite, S.pySubprocessSecurity, S.owaspPathTraversal, S.cweTop25, S.owaspTop10],
    labs: [],
    questions: [
      { prompt: 'Which subprocess argument should stay at its default of False to avoid passing input through /bin/sh?', answer: 'shell', accept: ['shell=False', 'shell false'] },
      { prompt: 'What two-character marker tells many command-line programs that options have ended?', answer: '--', accept: ['double dash', 'double hyphen'] },
    ],
    quiz: [
      { question: 'Why does a bound parameter stop SQL injection?', options: ['It encrypts the value', 'The value is sent separately from the SQL text and never parsed as SQL', 'It removes quotes from the value', 'It limits the value to 255 characters'], answer: 1, explanation: 'The database receives code and data in separate channels.' },
      { question: 'How should a user-chosen ORDER BY column be handled?', options: ['Bind it as a parameter', 'Escape it with quotes', 'Map it through a fixed allow-list of column names', 'Lower-case it'], answer: 2, explanation: 'Placeholders cannot carry identifiers, so only known column names should reach the SQL text.' },
      { question: 'A filter removes "../" once. Which input still escapes the folder?', options: ['report.pdf', '....//etc/passwd', 'docs/a.txt', 'a/b/c'], answer: 1, explanation: 'Removing the inner "../" leaves "../etc/passwd".' },
      { question: 'Which call is safest for compressing a user-named file that has already been validated?', options: ['os.system("gzip " + path)', 'subprocess.run("gzip " + path, shell=True)', 'subprocess.run(["gzip", "--", path])', 'eval("gzip(" + path + ")")'], answer: 2, explanation: 'No shell parses the input, and -- stops it being read as an option. Python\'s gzip module avoids the external program altogether.' },
      { question: 'Why check the path after resolving symbolic links?', options: ['Links are slower', 'A link inside the folder can point to a file outside it', 'Links cannot be read', 'It is required by POSIX'], answer: 1, explanation: 'String checks alone miss links that lead outside the allowed directory.' },
    ],
  },
  {
    id: 'swe-23',
    slug: 'secrets-passwords-randomness',
    title: 'Secrets, Passwords and Randomness',
    summary: 'Keep credentials out of code and logs, load configuration from the environment, store passwords with slow salted hashes, and use the right random numbers and comparisons for security.',
    minutes: 26,
    prerequisite: 'Lesson 21. Basic familiarity with hashing from the pre-security cryptography lesson helps.',
    outcomes: [
      'Load configuration and secrets from the environment, failing fast when they are missing (Twelve-Factor, factor III).',
      'Keep secrets out of source control, error messages and logs (CWE-798, CWE-532).',
      'Store passwords with an adaptive, salted hash at OWASP-recommended cost and upgrade old hashes.',
      'Choose secrets over random for tokens and compare secrets in constant time.',
    ],
    introduction:
      'A database password committed to a public repository, an API key printed in a debug log, a reset token generated with random.random(), user passwords stored as plain SHA-256: each of these is a one-line mistake that turns into a breach. This lesson covers the small set of rules that prevents them.',
    keyTerms: [
      { term: 'Salt', meaning: 'A random value stored with a password hash so identical passwords produce different hashes.' },
      { term: 'Work factor', meaning: 'The tunable cost (iterations or memory) of a password hash, raised over time as hardware gets faster.' },
      { term: 'CSPRNG', meaning: 'A cryptographically secure random number generator, such as Python\'s secrets module.' },
      { term: 'Constant-time comparison', meaning: 'Comparing secrets in time that does not depend on where they first differ (hmac.compare_digest).' },
    ],
    sections: [
      {
        title: 'Configuration belongs in the environment',
        paragraphs: [
          'Factor III of the Twelve-Factor App says to store config, anything that varies between deployments such as database URLs and credentials, in the environment rather than in code. A useful test: could you open-source the repository right now without leaking a credential? Never give a secret a default value in code; a missing secret should stop the application at start-up with a clear message that names the setting but not its value.',
          'Hard-coded credentials are CWE-798. Once committed, a secret stays in Git history even after it is deleted from the current files, so the only fix is to revoke and rotate it. Secret-scanning tools in CI and pre-commit hooks catch most accidents before they are pushed. In production, a secrets manager (cloud key vaults, HashiCorp Vault) adds access control, auditing and rotation on top of environment variables.',
        ],
        code: `import os

class ConfigError(Exception):
    pass

def require(env, name, min_length=1):
    value = env.get(name, "")
    if len(value) < min_length:
        raise ConfigError(f"{name} is missing or too short")   # name, never the value
    return value

env = {"DATABASE_URL": "postgresql://app:pw@db/shop"}
try:
    require(env, "SECRET_KEY", min_length=32)
except ConfigError as error:
    print("refusing to start:", error)
assert require(env, "DATABASE_URL").startswith("postgresql://")`,
        label: 'Fail fast on missing secrets, without echoing them',
      },
      {
        title: 'Keep secrets out of logs and errors',
        paragraphs: [
          'Logs are copied to many places and kept for a long time, so a secret in a log is a secret shared with everyone who can read logs (CWE-532). Redact at the source: give configuration objects a __repr__ that masks secrets, never log full request headers or bodies by default, and mask tokens to their last few characters when you need to correlate them.',
        ],
        code: `import re

def redact_url(url):
    return re.sub(r"(//[^:/@]+:)[^@]*@", r"\\1***@", url)

def mask_token(token):
    return "*" * (len(token) - 4) + token[-4:]

assert redact_url("postgresql://app:S3cret@db:5432/shop") == "postgresql://app:***@db:5432/shop"
assert mask_token("tok_9f2a71c4e8") == "**********c4e8"
print(redact_url("postgresql://app:S3cret@db:5432/shop"))`,
        label: 'CWE-532: redact before logging',
      },
      {
        title: 'Storing passwords',
        paragraphs: [
          'Never store passwords, and never encrypt them; store a slow, salted hash. Fast hashes such as SHA-256 let an attacker with a stolen database test billions of guesses per second on a GPU, and without a salt, identical passwords share a hash. The OWASP Password Storage Cheat Sheet recommends Argon2id (for example 19 MiB of memory, 2 iterations, parallelism 1) first, scrypt (N=2^17, r=8, p=1) when Argon2id is unavailable, bcrypt (work factor 10 or more, remembering its 72-byte input limit) for legacy systems, and PBKDF2-HMAC-SHA256 with at least 600,000 iterations where FIPS-140 compliance is required.',
          'Store the algorithm and its parameters with each hash so you can raise the cost later: when a user logs in successfully and their hash uses old parameters, re-hash the password they just typed with the new ones. Python\'s standard library includes hashlib.pbkdf2_hmac and hashlib.scrypt; Argon2id is available from maintained third-party packages.',
        ],
        code: `import base64, hashlib, hmac, secrets

def hash_password(password, iterations=600_000):
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"pbkdf2_sha256\${iterations}\${base64.b64encode(salt).decode()}\${base64.b64encode(digest).decode()}"

def verify(password, stored):
    algorithm, iterations, salt, digest = stored.split("$")
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), base64.b64decode(salt), int(iterations))
    return hmac.compare_digest(actual, base64.b64decode(digest))

stored = hash_password("correct horse battery staple", iterations=1_000)  # low cost only for this demo
assert verify("correct horse battery staple", stored)
assert not verify("Correct horse battery staple", stored)
assert hash_password("same", 1_000) != hash_password("same", 1_000)      # salts differ
print(stored.split("$")[0], "hash verified")`,
        label: 'Slow, salted, self-describing password hashes',
      },
      {
        title: 'Randomness and comparisons',
        paragraphs: [
          'Python\'s random module is designed for simulations; its output can be predicted after observing enough values, so it must never generate tokens, passwords or reset links (CWE-338). Use the secrets module: secrets.token_urlsafe(32) gives a URL-safe token with 256 bits of randomness.',
          'When checking a secret such as an API key or an HMAC signature, == can return as soon as the first character differs, and over many requests that timing difference can leak the secret (CWE-208). hmac.compare_digest takes the same time wherever the difference is.',
        ],
        code: `import hmac, secrets

token = secrets.token_urlsafe(32)          # 32 random bytes, about 43 URL-safe characters
assert len(token) >= 43
expected = "sk_live_7Hk2"
assert hmac.compare_digest(expected, "sk_live_7Hk2")
assert not hmac.compare_digest(expected, "sk_live_7Hk3")
print("token length:", len(token))`,
        label: 'secrets for tokens, compare_digest for checks',
      },
    ],
    table: {
      headers: ['Task', 'Do not use', 'Use'],
      rows: [
        ['Store a password', 'Plain text, encryption, MD5, SHA-256', 'Argon2id, scrypt, bcrypt or PBKDF2 with a salt and current cost'],
        ['Generate a token or reset link', 'random.random(), uuid1(), timestamps', 'secrets.token_urlsafe() or secrets.token_bytes()'],
        ['Check a token or signature', '== on the secret', 'hmac.compare_digest()'],
        ['Provide a credential to the app', 'A constant in code or a default value', 'Environment variable or secrets manager, required at start-up'],
      ],
    },
    exercise: {
      scenario: 'A code review finds: SECRET_KEY = os.environ.get("SECRET_KEY", "changeme"); password reset links built from str(random.randint(100000, 999999)); passwords stored as hashlib.sha256(pw.encode()).hexdigest(); and a log line logger.info("login %s %s", username, password).',
      task: 'Name each weakness with its CWE and give the fix, including how to migrate existing password hashes.',
      answer: 'Default secret: CWE-798 (hard-coded credential); remove the default and fail at start-up if SECRET_KEY is missing, then rotate the key because "changeme" may have been used in production. Reset codes: CWE-338 and a tiny six-digit space; use secrets.token_urlsafe(32), single use, short expiry. SHA-256 passwords: CWE-916 and CWE-759 (fast, unsalted); switch to Argon2id or PBKDF2 at OWASP cost, and migrate by re-hashing each password at the user\'s next successful login (or wrapping the old hash immediately). Logging passwords: CWE-532; remove the password from the log, purge existing logs, and treat logged passwords as exposed.',
      evidence: 'Four weaknesses with CWE numbers, concrete replacements from the standard library, and a migration plan that does not require users to reset all at once.',
    },
    misconceptions: [
      'Deleting a committed secret fixes the leak. It remains in Git history; revoke and rotate it.',
      'Encrypting passwords is safer than hashing them. Anyone with the key can decrypt every password; slow hashes are one-way.',
      'random is fine for tokens if you seed it well. Its output is predictable by design; use secrets.',
      'A long hash means a strong hash. Speed matters: SHA-256 is long but far too fast for passwords.',
    ],
    sources: [S.twelveFactor, S.owaspPasswords, S.owaspSecrets, S.pySecrets, S.pyHmac, S.cweTop25],
    labs: [],
    questions: [
      { prompt: 'Which Python standard-library module should generate password-reset tokens?', answer: 'secrets', accept: ['secrets module', 'the secrets module'] },
      { prompt: 'What is the minimum PBKDF2-HMAC-SHA256 iteration count in the OWASP Password Storage Cheat Sheet?', answer: '600000', accept: ['600,000', '600 000', '600k'] },
    ],
    quiz: [
      { question: 'Why do password hashes need a unique salt?', options: ['To make hashes shorter', 'So identical passwords get different hashes and precomputed tables do not work', 'To encrypt the password', 'To speed up verification'], answer: 1, explanation: 'Salts defeat rainbow tables and hide which users share a password.' },
      { question: 'A secret was committed and then deleted in the next commit. What must happen?', options: ['Nothing, it is deleted', 'Squash the commits', 'Revoke and rotate the secret', 'Make the repository private'], answer: 2, explanation: 'The secret stays in history and may already be copied; only rotation removes the risk.' },
      { question: 'Which function compares an API key without leaking timing information?', options: ['str.__eq__', 'hmac.compare_digest', 'hashlib.sha256', 'secrets.choice'], answer: 1, explanation: 'compare_digest takes the same time regardless of where the inputs differ.' },
      { question: 'What does factor III of the Twelve-Factor App recommend?', options: ['Store config in the environment', 'Use one codebase per service', 'Keep processes stateless', 'Treat logs as event streams'], answer: 0, explanation: 'Config that varies between deploys, including credentials, belongs in the environment, not in code.' },
      { question: 'How do you raise the cost of existing password hashes without a mass reset?', options: ['Decrypt and re-encrypt them', 'Re-hash with the new parameters when each user next logs in successfully', 'Delete them', 'Double the salt length'], answer: 1, explanation: 'At login you briefly have the plain password, so you can store a new hash at the current cost.' },
    ],
  },
  {
    id: 'swe-24',
    slug: 'software-supply-chain',
    title: 'The Software Supply Chain: Dependencies, SBOMs and SLSA',
    summary: 'Treat every dependency and build step as part of your attack surface: pin and hash-check packages, spot typosquats, produce SBOMs, raise your SLSA build level, and gate releases on known-exploited vulnerabilities.',
    minutes: 26,
    prerequisite: 'Lessons 21–23. Familiarity with pip and requirements.txt from SE 3.',
    outcomes: [
      'Explain how supply-chain attacks work, using the xz Utils backdoor (CVE-2024-3094) as a case study.',
      'Pin dependencies with hashes and recognise typosquatting.',
      'Describe what an SBOM is and the SLSA v1.2 build levels.',
      'Design a CI release gate that prioritises known-exploited vulnerabilities and expires waivers.',
    ],
    introduction:
      'Your application is mostly other people\'s code: frameworks, libraries, build tools, base images. An attacker who compromises any of them, or tricks you into installing a look-alike, gets your privileges without attacking your code at all. OWASP lists Software Supply Chain Failures as A03 in the OWASP Top 10:2025. This lesson covers the engineering habits that make the supply chain verifiable.',
    keyTerms: [
      { term: 'Typosquatting', meaning: 'Publishing a malicious package whose name is a near-miss of a popular one, such as reqeusts for requests.' },
      { term: 'SBOM', meaning: 'Software Bill of Materials: a machine-readable list of the components in a piece of software (SPDX or CycloneDX).' },
      { term: 'Provenance', meaning: 'Verifiable information about how, where and from what sources an artifact was built.' },
      { term: 'SLSA', meaning: 'Supply-chain Levels for Software Artifacts: a framework of build-integrity levels from L0 to L3.' },
      { term: 'KEV', meaning: 'CISA\'s Known Exploited Vulnerabilities catalog of CVEs with evidence of exploitation in the wild.' },
    ],
    sections: [
      {
        title: 'Case study: the xz Utils backdoor',
        paragraphs: [
          'CVE-2024-3094: malicious code was found in the upstream release tarballs of xz Utils starting with version 5.6.0. Through obfuscated build steps, the liblzma library was modified in a way that could affect software linked against it, including OpenSSH servers on some Linux distributions. It was discovered in March 2024, before the affected versions reached most stable distributions. The attacker had spent a long time building trust as a maintainer, and the malicious parts were in release tarballs and test files rather than plainly visible source.',
          'Lessons for engineers: build from source you can review, compare release artifacts with the repository, prefer reproducible builds, and limit what build and test steps can modify. These are exactly what the SLSA framework asks for.',
        ],
      },
      {
        title: 'Pin, hash and review your dependencies',
        paragraphs: [
          'A requirement such as Django>=5.0 installs whatever the newest matching version is on the day you deploy, so two builds of the same commit can differ. Pin exact versions in a lock file (requests==2.32.3), generated by a tool such as pip-tools, uv or Poetry, and update it deliberately through reviewed pull requests, ideally with an automated update bot.',
          'Pins say which version; hashes say which bytes. With pip install --require-hashes, every requirement must carry a --hash=sha256:… value and pip refuses any download that does not match, which protects against a tampered mirror or a replaced release file. Review new dependencies like new code: who maintains it, how active is it, does the name exactly match the project you meant? Installing a source distribution can run its build code with your privileges, so a typo can be enough.',
        ],
        code: `def one_edit_apart(a, b):
    """True if b is one insertion, deletion or substitution away from a."""
    if a == b or abs(len(a) - len(b)) > 1:
        return False
    if len(a) == len(b):
        return sum(x != y for x, y in zip(a, b)) == 1
    short, long_ = sorted((a, b), key=len)
    return any(long_[:i] + long_[i + 1:] == short for i in range(len(long_)))

POPULAR = ["requests", "numpy", "langchain"]
for name in ["requests", "requets", "nunpy", "langchainn", "pandas"]:
    hits = [p for p in POPULAR if one_edit_apart(name, p)]
    print(f"{name:<11} suspicious of {hits}" if hits else f"{name:<11} ok")
assert one_edit_apart("langchainn", "langchain") and not one_edit_apart("pandas", "numpy")`,
        label: 'Flagging likely typosquats',
      },
      {
        title: 'SBOMs and SLSA',
        paragraphs: [
          'An SBOM lists every component and version in a release, in a standard format such as SPDX or CycloneDX. When the next Log4Shell-style vulnerability is announced, an SBOM turns "are we affected?" from days of searching into a query. Generate it in CI for every release and store it with the artifact.',
          'SLSA (current specification v1.2) describes build integrity in levels. Build L0 offers no guarantees. Build L1 means provenance exists: the build platform records how the artifact was built. Build L2 means a hosted build platform generates signed provenance, so tampering after the build is detectable. Build L3 means hardened builds: runs are isolated from each other and signing secrets are unreachable from build steps, protecting against tampering during the build. Consumers verify provenance before deploying, for example that an image was built from the expected repository by the expected workflow.',
        ],
      },
      {
        title: 'Release gates that reflect real risk',
        paragraphs: [
          'Dependency scanners report many vulnerabilities, and blocking on every finding teaches teams to ignore the gate. Prioritise: CISA\'s Known Exploited Vulnerabilities catalog lists CVEs with evidence of exploitation in the wild, which makes a finding urgent whatever its CVSS score. Combine it with a CVSS threshold, and allow time-limited, owned waivers for findings that are not reachable in your use of the library. Expired waivers block again, so "temporary" never becomes "permanent". The lesson\'s second coding task builds this gate.',
        ],
        code: `from datetime import date

def blocks(finding, threshold, waivers, today):
    serious = finding.get("kev", False) or finding["cvss"] >= threshold
    expiry = waivers.get(finding["id"])
    waived = expiry is not None and today <= date.fromisoformat(expiry)
    return serious and not waived

today = date(2026, 11, 9)
assert blocks({"id": "CVE-X", "cvss": 5.3, "kev": True}, 7.0, {}, today)          # exploited: urgent
assert not blocks({"id": "CVE-Y", "cvss": 9.8}, 7.0, {"CVE-Y": "2026-12-01"}, today)  # owned waiver
assert blocks({"id": "CVE-Y", "cvss": 9.8}, 7.0, {"CVE-Y": "2026-11-01"}, today)      # waiver expired
print("release gate rules hold")`,
        label: 'KEV-aware gate with expiring waivers',
      },
    ],
    table: {
      headers: ['Risk', 'Example', 'Control'],
      rows: [
        ['Unpinned versions', 'Django>=5.0 installs a different version next week', 'Lock file with exact versions, updated by reviewed PRs'],
        ['Tampered package bytes', 'A compromised mirror serves a modified wheel', 'pip install --require-hashes'],
        ['Typosquatting', 'langchainn instead of langchain', 'Review new dependencies; flag near-miss names in CI'],
        ['Compromised build', 'A build step injects code before signing', 'SLSA Build L2–L3: hosted, isolated builds with signed provenance'],
        ['Unknown exposure', '"Do we use the vulnerable library?"', 'An SBOM for every release'],
      ],
    },
    exercise: {
      scenario: 'A team\'s CI installs dependencies with pip install -r requirements.txt from a file containing flask, requests>=2.0 and a package a developer added last week called python-dateutils. The build runs on a long-lived VM that also holds the signing key, and the scanner fails the build on any finding with CVSS 4.0 or higher, so developers routinely disable it.',
      task: 'Identify the supply-chain risks and propose a prioritised improvement plan.',
      answer: 'Risks: unpinned and unhashed dependencies (non-reproducible, tamper-able); python-dateutils is one letter away from the real python-dateutil and should be investigated as a possible typosquat and removed; a shared, long-lived build VM with the signing key reachable from build steps (SLSA L0–L1); a gate so noisy it is disabled. Plan: (1) remove and investigate the suspicious package and rotate any secrets the build could reach; (2) generate a lock file with exact versions and hashes and install with --require-hashes; (3) move builds to a hosted, ephemeral platform that produces signed provenance, with signing keys outside build steps (towards SLSA Build L3); (4) produce an SBOM per release; (5) gate on KEV-listed findings and a higher CVSS threshold, with owned, expiring waivers.',
      evidence: 'The typosquat is spotted, controls map to specific risks, the plan is ordered by urgency, and the gate is designed to stay switched on.',
    },
    misconceptions: [
      'Popular packages are safe by default. Maintainer accounts and build systems are attacked precisely because packages are popular.',
      'Pinning versions is enough. Pins name a version; only hashes prove the bytes are the ones you reviewed.',
      'An SBOM secures the software. It is an inventory; its value is in answering exposure questions quickly.',
      'The highest CVSS score is always the first thing to fix. Known exploitation and reachability often matter more.',
    ],
    sources: [S.slsa, S.cveXz, S.pipSecureInstalls, S.cycloneDx, S.cisaKev, S.owaspTop10],
    labs: [],
    questions: [
      { prompt: 'Which pip option makes every requirement carry a matching sha256 hash?', answer: '--require-hashes', accept: ['require-hashes', 'require hashes'] },
      { prompt: 'What is the CVE identifier of the 2024 xz Utils backdoor?', answer: 'CVE-2024-3094', accept: ['2024-3094'] },
    ],
    quiz: [
      { question: 'What does a --hash value in requirements.txt protect against?', options: ['Choosing the wrong version range', 'Installing bytes that differ from the reviewed release file', 'Slow downloads', 'License violations'], answer: 1, explanation: 'pip refuses a download whose hash does not match.' },
      { question: 'Which SLSA build level adds a hosted build platform that signs provenance?', options: ['Build L0', 'Build L1', 'Build L2', 'Build L3'], answer: 2, explanation: 'L1 requires provenance to exist; L2 adds a hosted platform and signed provenance; L3 hardens and isolates builds.' },
      { question: 'Why is the KEV catalog useful in a release gate?', options: ['It lists every CVE ever published', 'It marks vulnerabilities with evidence of exploitation in the wild', 'It replaces CVSS', 'It lists only open-source bugs'], answer: 1, explanation: 'Known exploitation is a strong signal of urgency regardless of the CVSS score.' },
      { question: 'Which name is most likely a typosquat of the popular package numpy?', options: ['pandas', 'nunpy', 'scipy', 'numba'], answer: 1, explanation: 'One substituted letter from a popular name is the classic typosquatting pattern.' },
      { question: 'What is an SBOM mainly used for?', options: ['Encrypting releases', 'Listing the components in a release so exposure to new vulnerabilities can be checked quickly', 'Signing commits', 'Measuring test coverage'], answer: 1, explanation: 'It is an inventory that makes "are we affected?" answerable.' },
    ],
  },
];
