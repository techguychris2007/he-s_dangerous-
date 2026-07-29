import type { CodeTask } from '../codeTypes';

export const SECURITY_TESTING_RISK_TASKS: CodeTask[] = [
  {
    id: 'sec-testing-01',
    title: 'Flag Risky Open Ports from a Port Scan',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Testing & Risk (NIST 800-115 / CSF / OWASP WSTG)',
    prompt:
      'A real vulnerability scan starts with real port-scanner output — the format below is genuine Nmap ' +
      'normal-output wording. Reading it is the first thing a security tester does with any new target: ' +
      'certain open ports are risky enough by themselves (unencrypted protocols, common lateral-movement ' +
      'and brute-force targets) to flag immediately, before any deeper testing.\n\n' +
      'Write find_risky_open_ports(nmap_output) where nmap_output is a multi-line string like:\n' +
      '  PORT     STATE SERVICE\n' +
      '  22/tcp   open  ssh\n' +
      '  23/tcp   open  telnet\n' +
      '  445/tcp  open  microsoft-ds\n' +
      'Use a regex to find every line reporting an OPEN port (ignore "closed"/"filtered" lines). For each ' +
      'open port whose number is in this risk table, append "<port>/<proto> (<service>): <reason>" to the ' +
      'result list, in the order the ports appear in the input:\n' +
      '  21: "FTP allows unencrypted credentials in transit"\n' +
      '  23: "Telnet transmits everything, including credentials, in plaintext"\n' +
      '  445: "SMB is a common ransomware and lateral-movement vector"\n' +
      '  3389: "RDP is a top target for brute-force and exploit attempts"\n' +
      '  5900: "VNC is frequently deployed with weak or no authentication"\n' +
      'Ports not in the table (like 22 or 80) are simply skipped.',
    starterCode:
      'import re\n\n' +
      'def find_risky_open_ports(nmap_output):\n' +
      '    # TODO: regex-match open-port lines, look each port number up in the risk table\n' +
      '    pass\n',
    hints: [
      'A regex like r"^(\\d+)/(tcp|udp)\\s+open\\s+(\\S+)" with re.MULTILINE matches exactly the open-port lines and captures port, protocol, and service in one pass.',
      'pattern.findall(nmap_output) returns a list of (port_str, proto, service) tuples you can loop over directly.',
      'Convert the captured port string to int before looking it up in the risk dict, since dict keys are ints.',
    ],
    solution:
      'import re\n\n' +
      'def find_risky_open_ports(nmap_output):\n' +
      '    RISKY = {\n' +
      '        21: "FTP allows unencrypted credentials in transit",\n' +
      '        23: "Telnet transmits everything, including credentials, in plaintext",\n' +
      '        445: "SMB is a common ransomware and lateral-movement vector",\n' +
      '        3389: "RDP is a top target for brute-force and exploit attempts",\n' +
      '        5900: "VNC is frequently deployed with weak or no authentication",\n' +
      '    }\n' +
      '    pattern = re.compile(r"^(\\d+)/(tcp|udp)\\s+open\\s+(\\S+)", re.MULTILINE)\n' +
      '    findings = []\n' +
      '    for port_str, proto, service in pattern.findall(nmap_output):\n' +
      '        port = int(port_str)\n' +
      '        if port in RISKY:\n' +
      '            findings.append(f"{port}/{proto} ({service}): {RISKY[port]}")\n' +
      '    return findings\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'scan1 = """Starting Nmap scan report for 192.168.1.10\n' +
      'PORT     STATE SERVICE\n' +
      '22/tcp   open  ssh\n' +
      '23/tcp   open  telnet\n' +
      '80/tcp   open  http\n' +
      '443/tcp  open  https\n' +
      '445/tcp  open  microsoft-ds\n' +
      '3389/tcp open  ms-wbt-server\n' +
      '"""\n' +
      '__check__(\n' +
      '    "flags telnet, smb, rdp; leaves ssh/http/https alone",\n' +
      '    find_risky_open_ports(scan1),\n' +
      '    [\n' +
      '        "23/tcp (telnet): Telnet transmits everything, including credentials, in plaintext",\n' +
      '        "445/tcp (microsoft-ds): SMB is a common ransomware and lateral-movement vector",\n' +
      '        "3389/tcp (ms-wbt-server): RDP is a top target for brute-force and exploit attempts",\n' +
      '    ],\n' +
      ')\n\n' +
      'scan2 = """PORT     STATE  SERVICE\n' +
      '21/tcp   closed ftp\n' +
      '22/tcp   open   ssh\n' +
      '"""\n' +
      '__check__("ignores closed ports even if the port number is risky", find_risky_open_ports(scan2), [])\n' +
      '__check__("no open ports at all", find_risky_open_ports("PORT   STATE  SERVICE\\n"), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-risk-01',
    title: 'Risk-Based Vulnerability Prioritization',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Testing & Risk (NIST 800-115 / CSF / OWASP WSTG)',
    prompt:
      'The NIST Cybersecurity Framework treats security as risk management, not an endless checklist: with ' +
      'limited time, you fix the highest-risk issues first. A standard, real-world formula (the same shape ' +
      'used by NIST SP 800-30 and CVSS-style scoring) is Risk = Likelihood x Impact, each rated 1-5, giving ' +
      'a score from 1 to 25 that you can bucket into severity bands and sort by.\n\n' +
      'Write prioritize_risks(vulnerabilities) where vulnerabilities is a list of dicts like ' +
      '{"name": "...", "likelihood": 1-5, "impact": 1-5}. For each one, compute score = likelihood * impact ' +
      'and a severity band: "Critical" if score >= 20, "High" if score >= 12, "Moderate" if score >= 6, ' +
      'else "Low". Return a new list of dicts, each the original fields plus "score" and "severity", sorted ' +
      'by score descending (ties broken alphabetically by name).',
    starterCode:
      'def prioritize_risks(vulnerabilities):\n' +
      '    # TODO: compute score + severity band for each item, return sorted by score desc, name asc\n' +
      '    pass\n',
    hints: [
      'A small nested band(score) helper with if/elif thresholds keeps the banding logic readable.',
      '{**v, "score": score, "severity": band(score)} builds a new dict that keeps every original field plus the two new ones.',
      'list.sort(key=lambda v: (-v["score"], v["name"])) gives descending score with an alphabetical tiebreaker in one call.',
    ],
    solution:
      'def prioritize_risks(vulnerabilities):\n' +
      '    def band(score):\n' +
      '        if score >= 20:\n' +
      '            return "Critical"\n' +
      '        if score >= 12:\n' +
      '            return "High"\n' +
      '        if score >= 6:\n' +
      '            return "Moderate"\n' +
      '        return "Low"\n\n' +
      '    scored = []\n' +
      '    for v in vulnerabilities:\n' +
      '        score = v["likelihood"] * v["impact"]\n' +
      '        scored.append({**v, "score": score, "severity": band(score)})\n' +
      '    scored.sort(key=lambda v: (-v["score"], v["name"]))\n' +
      '    return scored\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'vulns = [\n' +
      '    {"name": "Unpatched public web server (RCE)", "likelihood": 5, "impact": 5},\n' +
      '    {"name": "Weak Wi-Fi password on guest network", "likelihood": 3, "impact": 2},\n' +
      '    {"name": "Missing MFA on admin portal", "likelihood": 4, "impact": 4},\n' +
      '    {"name": "Verbose error messages leak stack traces", "likelihood": 2, "impact": 2},\n' +
      ']\n\n' +
      'result = prioritize_risks(vulns)\n' +
      '__check__(\n' +
      '    "sorted by score descending, banded correctly",\n' +
      '    [(r["name"], r["score"], r["severity"]) for r in result],\n' +
      '    [\n' +
      '        ("Unpatched public web server (RCE)", 25, "Critical"),\n' +
      '        ("Missing MFA on admin portal", 16, "High"),\n' +
      '        ("Weak Wi-Fi password on guest network", 6, "Moderate"),\n' +
      '        ("Verbose error messages leak stack traces", 4, "Low"),\n' +
      '    ],\n' +
      ')\n\n' +
      'tie = [\n' +
      '    {"name": "Zebra issue", "likelihood": 3, "impact": 3},\n' +
      '    {"name": "Alpha issue", "likelihood": 3, "impact": 3},\n' +
      ']\n' +
      '__check__("equal scores break ties alphabetically by name", [r["name"] for r in prioritize_risks(tie)], ["Alpha issue", "Zebra issue"])\n' +
      '__check__("empty input", prioritize_risks([]), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-testing-02',
    title: 'Fix a Real SQL Injection with Parameterized Queries',
    difficulty: 'Hard',
    language: 'python',
    category: 'Security: Testing & Risk (NIST 800-115 / CSF / OWASP WSTG)',
    prompt:
      'This lab runs a genuine SQL database (Python\'s built-in sqlite3, not a simulation) so you can see a ' +
      'real SQL injection actually work — and actually get fixed. This exact bug and exact payload style ' +
      'is the OWASP WSTG\'s SQL injection test case (WSTG-INPV-05), still one of the most common real-world ' +
      'web vulnerabilities.\n\n' +
      'vulnerable_login(conn, username, password) is given, already implemented, and IS vulnerable — it ' +
      'builds SQL by interpolating the raw strings straight into the query text. Study it, then write ' +
      'safe_login(conn, username, password): run the same "does a user with this username and password ' +
      'exist" check, but using a parameterized query — pass "?" placeholders in the SQL string and the ' +
      'actual values as a separate tuple to conn.execute(), so user input is never concatenated into the ' +
      'SQL text itself. Both functions should return True if a matching row exists, False otherwise.\n\n' +
      'The test will prove the point directly: it logs in with the classic payload username ' +
      '"alice\' -- " (a real quote-breakout comment payload) against both functions. It should succeed ' +
      'against vulnerable_login (that IS the bug) and fail against your safe_login.',
    starterCode:
      'import sqlite3\n\n' +
      'def _setup_db():\n' +
      '    conn = sqlite3.connect(":memory:")\n' +
      '    conn.execute("CREATE TABLE users (username TEXT, password TEXT)")\n' +
      '    conn.execute("INSERT INTO users VALUES (?, ?)", ("alice", "correcthorse"))\n' +
      '    conn.commit()\n' +
      '    return conn\n\n' +
      '# Given, and deliberately vulnerable — do NOT copy this pattern in real code.\n' +
      'def vulnerable_login(conn, username, password):\n' +
      '    query = f"SELECT * FROM users WHERE username = \'{username}\' AND password = \'{password}\'"\n' +
      '    cursor = conn.execute(query)\n' +
      '    return cursor.fetchone() is not None\n\n' +
      'def safe_login(conn, username, password):\n' +
      '    # TODO: same check as vulnerable_login, but using a parameterized query ("?" placeholders\n' +
      '    # + a tuple of values passed to conn.execute) so input can never break out of the SQL text\n' +
      '    pass\n',
    hints: [
      'conn.execute("SELECT ... WHERE username = ? AND password = ?", (username, password)) is the whole fix — sqlite3 handles quoting/escaping for you, so the values can never be interpreted as SQL syntax.',
      'Do not use an f-string or .format() anywhere in safe_login — that reintroduces the exact bug you are fixing.',
      'The return logic is identical to vulnerable_login: cursor.fetchone() is not None.',
    ],
    solution:
      'import sqlite3\n\n' +
      'def _setup_db():\n' +
      '    conn = sqlite3.connect(":memory:")\n' +
      '    conn.execute("CREATE TABLE users (username TEXT, password TEXT)")\n' +
      '    conn.execute("INSERT INTO users VALUES (?, ?)", ("alice", "correcthorse"))\n' +
      '    conn.commit()\n' +
      '    return conn\n\n' +
      'def vulnerable_login(conn, username, password):\n' +
      '    query = f"SELECT * FROM users WHERE username = \'{username}\' AND password = \'{password}\'"\n' +
      '    cursor = conn.execute(query)\n' +
      '    return cursor.fetchone() is not None\n\n' +
      'def safe_login(conn, username, password):\n' +
      '    cursor = conn.execute(\n' +
      '        "SELECT * FROM users WHERE username = ? AND password = ?",\n' +
      '        (username, password),\n' +
      '    )\n' +
      '    return cursor.fetchone() is not None\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'conn = _setup_db()\n\n' +
      '__check__("vulnerable: correct creds", vulnerable_login(conn, "alice", "correcthorse"), True)\n' +
      '__check__("safe: correct creds", safe_login(conn, "alice", "correcthorse"), True)\n' +
      '__check__("vulnerable: wrong password", vulnerable_login(conn, "alice", "wrong"), False)\n' +
      '__check__("safe: wrong password", safe_login(conn, "alice", "wrong"), False)\n\n' +
      'payload_user = "alice\' -- "\n' +
      '__check__("vulnerable: SQLi bypass succeeds (proves the bug is real)", vulnerable_login(conn, payload_user, "anything"), True)\n' +
      '__check__("safe: same payload is rejected", safe_login(conn, payload_user, "anything"), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
