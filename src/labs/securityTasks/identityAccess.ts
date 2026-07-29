import type { CodeTask } from '../codeTypes';

export const SECURITY_IDENTITY_ACCESS_TASKS: CodeTask[] = [
  {
    id: 'sec-idaccess-01',
    title: 'NIST 800-63B Password Policy Validator',
    difficulty: 'Easy',
    language: 'python',
    category: 'Security: Identity & Access (NIST 800-63 / OWASP ASVS)',
    prompt:
      'NIST SP 800-63B (the guideline this book covers) deliberately rejected the old rules — no forced ' +
      'mix of upper/lower/digit/symbol, no mandatory periodic rotation. Real modern policy instead checks: ' +
      'a sane minimum/maximum length, and comparison against a blocklist of known weak/breached passwords, ' +
      'because length and uniqueness stop real attacks (credential stuffing, dictionary attacks) that ' +
      'composition rules never did.\n\n' +
      'Write check_password_policy(password, blocklist) where blocklist is a set of lowercase known-weak ' +
      'passwords. Return a list of violation strings (empty list = compliant):\n' +
      '- "too short (minimum 8 characters)" if len(password) < 8\n' +
      '- "too long (maximum 64 characters)" if len(password) > 64\n' +
      '- "appears on the known-weak/breached password blocklist" if password.lower() is in blocklist\n' +
      '- "too simple (a single character repeated)" if the password is 8+ chars but only one distinct character',
    starterCode:
      'def check_password_policy(password, blocklist):\n' +
      '    # TODO: return a list of violation strings per NIST 800-63B, or [] if compliant\n' +
      '    pass\n',
    hints: [
      'Build up a violations = [] list and append a string for each rule that fails — do not return early, a password can violate more than one rule at once.',
      'len(set(password)) == 1 is a clean way to detect "only one distinct character used" for the repeated-character check.',
      'Check the blocklist against password.lower() so "Password" and "password" are both caught.',
    ],
    solution:
      'def check_password_policy(password, blocklist):\n' +
      '    violations = []\n' +
      '    if len(password) < 8:\n' +
      '        violations.append("too short (minimum 8 characters)")\n' +
      '    if len(password) > 64:\n' +
      '        violations.append("too long (maximum 64 characters)")\n' +
      '    if password.lower() in blocklist:\n' +
      '        violations.append("appears on the known-weak/breached password blocklist")\n' +
      '    if len(set(password)) == 1 and len(password) >= 8:\n' +
      '        violations.append("too simple (a single character repeated)")\n' +
      '    return violations\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'blocklist = {"password", "password1", "qwertyuiop", "letmein123"}\n\n' +
      '__check__("too short", check_password_policy("abc123", blocklist), ["too short (minimum 8 characters)"])\n' +
      '__check__("blocklisted", check_password_policy("Password", blocklist), ["appears on the known-weak/breached password blocklist"])\n' +
      '__check__("repeated char", check_password_policy("aaaaaaaa", blocklist), ["too simple (a single character repeated)"])\n' +
      '__check__("compliant long passphrase", check_password_policy("correct horse battery staple", blocklist), [])\n' +
      '__check__("compliant simple 8-char (no composition rules required)", check_password_policy("banana42", blocklist), [])\n' +
      '__check__("too long", check_password_policy("x" * 65, blocklist), ["too long (maximum 64 characters)", "too simple (a single character repeated)"])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-idaccess-02',
    title: 'Verify Password Storage Against OWASP ASVS',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Identity & Access (NIST 800-63 / OWASP ASVS)',
    prompt:
      'OWASP ASVS\'s authentication chapter sets concrete, testable requirements for how credentials must ' +
      'be stored: an approved memory-hard/adaptive one-way function (bcrypt, scrypt, Argon2, or PBKDF2— ' +
      'never a fast general-purpose hash like MD5/SHA-1/SHA-256, and never reversible encryption), a ' +
      'unique random salt per user, and a work factor high enough to resist offline cracking. This is the ' +
      'exact kind of check a real application-security review runs against a system design.\n\n' +
      'Write check_password_storage(scheme) where scheme is a dict like ' +
      '{"algorithm": "bcrypt", "salted": True, "work_factor": 12}. Return a list of violation strings ' +
      '(empty = compliant):\n' +
      '- if algorithm (lowercased) is not one of {"bcrypt", "scrypt", "argon2", "pbkdf2"}: ' +
      '"\'<algorithm>\' is not an approved memory-hard/adaptive hashing algorithm (ASVS requires bcrypt, ' +
      'scrypt, Argon2, or PBKDF2)"\n' +
      '- if scheme["salted"] is falsy: "password is not salted with a unique, random per-user salt"\n' +
      '- if the algorithm IS approved but work_factor is below its minimum ' +
      '({"bcrypt": 10, "pbkdf2": 600000, "scrypt": 16384, "argon2": 2}): ' +
      '"work factor <work_factor> is below the recommended minimum for <algorithm>"',
    starterCode:
      'def check_password_storage(scheme):\n' +
      '    # TODO: return a list of ASVS violation strings, or [] if the scheme is compliant\n' +
      '    pass\n',
    hints: [
      'Normalize with algo = (scheme.get("algorithm") or "").lower() so comparisons are case-insensitive.',
      'The work-factor check only applies to algorithms that ARE in the approved set — an unapproved algorithm should not also get a confusing work-factor message.',
      'MIN_WORK_FACTOR = {"bcrypt": 10, "pbkdf2": 600000, "scrypt": 2 ** 14, "argon2": 2} — look the threshold up by algo.',
    ],
    solution:
      'def check_password_storage(scheme):\n' +
      '    violations = []\n' +
      '    algo = (scheme.get("algorithm") or "").lower()\n' +
      '    APPROVED = {"bcrypt", "scrypt", "argon2", "pbkdf2"}\n' +
      '    if algo not in APPROVED:\n' +
      '        violations.append(\n' +
      '            f"\'{scheme.get(\'algorithm\')}\' is not an approved memory-hard/adaptive hashing "\n' +
      '            "algorithm (ASVS requires bcrypt, scrypt, Argon2, or PBKDF2)"\n' +
      '        )\n' +
      '    if not scheme.get("salted", False):\n' +
      '        violations.append("password is not salted with a unique, random per-user salt")\n' +
      '    work_factor = scheme.get("work_factor", 0)\n' +
      '    MIN_WORK_FACTOR = {"bcrypt": 10, "pbkdf2": 600000, "scrypt": 2 ** 14, "argon2": 2}\n' +
      '    if algo in MIN_WORK_FACTOR and work_factor < MIN_WORK_FACTOR[algo]:\n' +
      '        violations.append(f"work factor {work_factor} is below the recommended minimum for {algo}")\n' +
      '    return violations\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__(\n' +
      '    "plaintext storage",\n' +
      '    check_password_storage({"algorithm": "plaintext", "salted": False, "work_factor": 0}),\n' +
      '    [\n' +
      '        "\'plaintext\' is not an approved memory-hard/adaptive hashing algorithm (ASVS requires bcrypt, scrypt, Argon2, or PBKDF2)",\n' +
      '        "password is not salted with a unique, random per-user salt",\n' +
      '    ],\n' +
      ')\n' +
      '__check__(\n' +
      '    "salted md5 (fast hash, still non-compliant)",\n' +
      '    check_password_storage({"algorithm": "md5", "salted": True, "work_factor": 0}),\n' +
      '    ["\'md5\' is not an approved memory-hard/adaptive hashing algorithm (ASVS requires bcrypt, scrypt, Argon2, or PBKDF2)"],\n' +
      ')\n' +
      '__check__("compliant bcrypt", check_password_storage({"algorithm": "bcrypt", "salted": True, "work_factor": 12}), [])\n' +
      '__check__(\n' +
      '    "bcrypt too-low work factor",\n' +
      '    check_password_storage({"algorithm": "bcrypt", "salted": True, "work_factor": 4}),\n' +
      '    ["work factor 4 is below the recommended minimum for bcrypt"],\n' +
      ')\n' +
      '__check__("compliant pbkdf2", check_password_storage({"algorithm": "pbkdf2", "salted": True, "work_factor": 650000}), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'sec-idaccess-03',
    title: 'Role-Based Access Control with Inheritance',
    difficulty: 'Medium',
    language: 'python',
    category: 'Security: Identity & Access (NIST 800-63 / OWASP ASVS)',
    prompt:
      'Real access-control systems (AWS IAM, Kubernetes RBAC, most enterprise apps) implement the ' +
      'principle this book opens with: deny by default, grant explicitly, and let roles inherit from a ' +
      'parent role so you don\'t repeat every low-level permission at every level.\n\n' +
      'Write can_access(role, resource, action, role_permissions, role_hierarchy). role_permissions maps ' +
      'each role name to a set of (resource, action) tuples it is directly granted. role_hierarchy maps a ' +
      'role name to its single parent role (or omits it if it has none). Starting at role, check whether ' +
      '(resource, action) is directly granted; if not, walk up to the parent and check again, continuing ' +
      'until you run out of parents. Return True the moment you find a grant, False if you reach the top ' +
      'of the chain without one (deny by default — an unknown role or resource must return False, never ' +
      'raise an error).',
    starterCode:
      'def can_access(role, resource, action, role_permissions, role_hierarchy):\n' +
      '    # TODO: check role, then walk role_hierarchy upward, deny by default\n' +
      '    pass\n',
    hints: [
      'Loop with current = role; while current is not None: check current\'s permissions, then current = role_hierarchy.get(current) to move up (defaults to None when a role has no parent).',
      'role_permissions.get(current, set()) avoids a KeyError for a role with no entry at all.',
      'Guard against a cyclical hierarchy by tracking visited roles in a set and stopping if you see one again — real config can have bugs.',
    ],
    solution:
      'def can_access(role, resource, action, role_permissions, role_hierarchy):\n' +
      '    current = role\n' +
      '    seen = set()\n' +
      '    while current is not None and current not in seen:\n' +
      '        seen.add(current)\n' +
      '        if (resource, action) in role_permissions.get(current, set()):\n' +
      '            return True\n' +
      '        current = role_hierarchy.get(current)\n' +
      '    return False\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'permissions = {\n' +
      '    "viewer": {("report", "read")},\n' +
      '    "editor": {("report", "write")},\n' +
      '    "admin": {("report", "delete"), ("user", "manage")},\n' +
      '}\n' +
      'hierarchy = {"editor": "viewer", "admin": "editor"}\n\n' +
      '__check__("viewer can read", can_access("viewer", "report", "read", permissions, hierarchy), True)\n' +
      '__check__("viewer cannot write (deny by default)", can_access("viewer", "report", "write", permissions, hierarchy), False)\n' +
      '__check__("editor inherits viewer\'s read", can_access("editor", "report", "read", permissions, hierarchy), True)\n' +
      '__check__("editor can write directly", can_access("editor", "report", "write", permissions, hierarchy), True)\n' +
      '__check__("editor cannot delete", can_access("editor", "report", "delete", permissions, hierarchy), False)\n' +
      '__check__("admin inherits read via editor->viewer chain", can_access("admin", "report", "read", permissions, hierarchy), True)\n' +
      '__check__("admin can manage users directly", can_access("admin", "user", "manage", permissions, hierarchy), True)\n' +
      '__check__("unknown role denied by default", can_access("guest", "report", "read", permissions, hierarchy), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
