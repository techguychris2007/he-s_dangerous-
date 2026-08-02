import type { CodeTask } from '../codeTypes';

export const JS_OOP_TASKS: CodeTask[] = [
  {
    id: 'js-oop-01',
    title: 'A Login Attempt Tracker (Class)',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'OOP & Classes',
    prompt:
      'Write a class LoginTracker whose constructor takes maxAttempts, with two methods: ' +
      'recordFailure(username) which counts one more failed attempt for that user, and ' +
      'isLockedOut(username) which returns true once that user has reached maxAttempts failures. ' +
      'This is the actual shape of a real account-lockout guard — the same pattern behind why ' +
      'password-spraying (one attempt per account) evades a per-account lockout policy that this ' +
      'exact class would enforce.',
    starterCode:
      'class LoginTracker {\n' +
      '  constructor(maxAttempts) {\n' +
      '    // TODO: store maxAttempts and set up a place to count failures per username\n' +
      '  }\n' +
      '\n' +
      '  recordFailure(username) {\n' +
      '    // TODO: increment the failure count for username\n' +
      '  }\n' +
      '\n' +
      '  isLockedOut(username) {\n' +
      '    // TODO: return true if username has reached maxAttempts failures\n' +
      '  }\n' +
      '}\n',
    hints: [
      'Store an object (e.g. this.attempts = {}) in the constructor to count failures per username.',
      'recordFailure: this.attempts[username] = (this.attempts[username] || 0) + 1;',
      'isLockedOut: return (this.attempts[username] || 0) >= this.maxAttempts; — a user never attempted is never locked out.',
    ],
    solution:
      'class LoginTracker {\n' +
      '  constructor(maxAttempts) {\n' +
      '    this.maxAttempts = maxAttempts;\n' +
      '    this.attempts = {};\n' +
      '  }\n' +
      '\n' +
      '  recordFailure(username) {\n' +
      '    this.attempts[username] = (this.attempts[username] || 0) + 1;\n' +
      '  }\n' +
      '\n' +
      '  isLockedOut(username) {\n' +
      '    return (this.attempts[username] || 0) >= this.maxAttempts;\n' +
      '  }\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = actual === expected;\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + actual + ", expected " + expected);\n' +
      '}\n' +
      'const tracker = new LoginTracker(3);\n' +
      'check("never attempted, not locked out", tracker.isLockedOut("alice"), false);\n' +
      'tracker.recordFailure("bob");\n' +
      'tracker.recordFailure("bob");\n' +
      'check("2 of 3 failures, not locked out yet", tracker.isLockedOut("bob"), false);\n' +
      'tracker.recordFailure("bob");\n' +
      'check("3 of 3 failures, locked out", tracker.isLockedOut("bob"), true);\n' +
      'check("other user unaffected", tracker.isLockedOut("alice"), false);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-oop-02',
    title: 'A Simple Request Rate Limiter (Class)',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'OOP & Classes',
    prompt:
      'Write a class RateLimiter whose constructor takes a limit, with one method: allowRequest(), ' +
      'which returns true and counts the request if fewer than limit requests have been allowed so ' +
      'far, or returns false (and does not count) once the limit is reached. Real rate limiters use a ' +
      'sliding time window instead of a hard total, but this counting core is the exact mechanism ' +
      'underneath — and the reason a naive one is bypassable by simply waiting, or by distributing ' +
      'requests across many source IPs.',
    starterCode:
      'class RateLimiter {\n' +
      '  constructor(limit) {\n' +
      '    // TODO: store limit and a counter for requests allowed so far\n' +
      '  }\n' +
      '\n' +
      '  allowRequest() {\n' +
      '    // TODO: return true and count the request if under the limit, otherwise return false\n' +
      '  }\n' +
      '}\n',
    hints: [
      'Store limit and a running this.count = 0 in the constructor.',
      'In allowRequest, check this.count >= this.limit FIRST — if so, return false without incrementing anything.',
      'Otherwise: this.count++; return true;',
    ],
    solution:
      'class RateLimiter {\n' +
      '  constructor(limit) {\n' +
      '    this.limit = limit;\n' +
      '    this.count = 0;\n' +
      '  }\n' +
      '\n' +
      '  allowRequest() {\n' +
      '    if (this.count >= this.limit) return false;\n' +
      '    this.count++;\n' +
      '    return true;\n' +
      '  }\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = actual === expected;\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + actual + ", expected " + expected);\n' +
      '}\n' +
      'const limiter = new RateLimiter(3);\n' +
      'check("request 1 allowed", limiter.allowRequest(), true);\n' +
      'check("request 2 allowed", limiter.allowRequest(), true);\n' +
      'check("request 3 allowed", limiter.allowRequest(), true);\n' +
      'check("request 4 blocked", limiter.allowRequest(), false);\n' +
      'check("still blocked after that", limiter.allowRequest(), false);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-oop-03',
    title: 'An Access Control List (Class)',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'OOP & Classes',
    prompt:
      'Write a class AccessControlList with three methods: grant(user) to allow a user, revoke(user) ' +
      'to remove their access, and canAccess(user) to check whether they currently have it. This tiny ' +
      'class is the actual shape of a real permission check — and the reason "was this user ever ' +
      'granted access, right now" has to be a live lookup, not something decided once and cached ' +
      'forever, since access can be revoked at any time.',
    starterCode:
      'class AccessControlList {\n' +
      '  constructor() {\n' +
      '    // TODO: set up a place to track which users currently have access\n' +
      '  }\n' +
      '\n' +
      '  grant(user) {\n' +
      '    // TODO: give user access\n' +
      '  }\n' +
      '\n' +
      '  revoke(user) {\n' +
      '    // TODO: remove user\'s access\n' +
      '  }\n' +
      '\n' +
      '  canAccess(user) {\n' +
      '    // TODO: return whether user currently has access\n' +
      '  }\n' +
      '}\n',
    hints: [
      'A Set is a natural fit here: this.allowed = new Set() in the constructor.',
      'grant/revoke map directly to Set methods: this.allowed.add(user) and this.allowed.delete(user).',
      'canAccess is just: return this.allowed.has(user);',
    ],
    solution:
      'class AccessControlList {\n' +
      '  constructor() {\n' +
      '    this.allowed = new Set();\n' +
      '  }\n' +
      '\n' +
      '  grant(user) {\n' +
      '    this.allowed.add(user);\n' +
      '  }\n' +
      '\n' +
      '  revoke(user) {\n' +
      '    this.allowed.delete(user);\n' +
      '  }\n' +
      '\n' +
      '  canAccess(user) {\n' +
      '    return this.allowed.has(user);\n' +
      '  }\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = actual === expected;\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + actual + ", expected " + expected);\n' +
      '}\n' +
      'const acl = new AccessControlList();\n' +
      'check("nobody has access by default", acl.canAccess("alice"), false);\n' +
      'acl.grant("alice");\n' +
      'check("alice granted", acl.canAccess("alice"), true);\n' +
      'check("bob still has none", acl.canAccess("bob"), false);\n' +
      'acl.revoke("alice");\n' +
      'check("alice revoked", acl.canAccess("alice"), false);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
];
