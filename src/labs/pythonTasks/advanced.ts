import type { CodeTask } from '../codeTypes';

/** Decorators, generators, context managers, regex, caching, custom exceptions, and asyncio — the
 *  toolbox that turns "a script that works" into something closer to a real automation/detection tool. */
export const PYTHON_ADVANCED_TASKS: CodeTask[] = [
  {
    id: 'py-adv-01',
    title: 'A require_auth Decorator',
    difficulty: 'Medium',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write a decorator require_auth(func) that wraps func so that calling the wrapped function raises ' +
      'PermissionError("Not authenticated") if its FIRST argument (a dict representing a session, e.g. ' +
      '{"authenticated": True}) does not have authenticated set to True — otherwise it calls func normally ' +
      'and returns its result. Decorators are how real frameworks bolt an auth check onto a route/handler ' +
      'without tangling that logic into every single function body.',
    starterCode:
      'def require_auth(func):\n' +
      '    # TODO: return a wrapper that checks session["authenticated"] before calling func\n' +
      '    pass\n\n' +
      '@require_auth\n' +
      'def get_secret_data(session):\n' +
      '    return "top secret"\n',
    hints: [
      'A decorator is a function that takes func and returns a new function (the "wrapper") which decides whether/how to call it.',
      'Use *args, **kwargs in the wrapper signature so it works for any function shape, then read args[0] as the session.',
      'raise PermissionError("Not authenticated") when the check fails; otherwise return func(*args, **kwargs).',
    ],
    solution:
      'def require_auth(func):\n' +
      '    def wrapper(*args, **kwargs):\n' +
      '        session = args[0]\n' +
      '        if not session.get("authenticated"):\n' +
      '            raise PermissionError("Not authenticated")\n' +
      '        return func(*args, **kwargs)\n' +
      '    return wrapper\n\n' +
      '@require_auth\n' +
      'def get_secret_data(session):\n' +
      '    return "top secret"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("authenticated session works", get_secret_data({"authenticated": True}), "top secret")\n' +
      'try:\n' +
      '    get_secret_data({"authenticated": False})\n' +
      '    __results__.append(("unauthenticated raises", False, "no exception", "PermissionError"))\n' +
      'except PermissionError:\n' +
      '    __results__.append(("unauthenticated raises", True, "PermissionError", "PermissionError"))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-02',
    title: 'A rate_limit Decorator With Arguments',
    difficulty: 'Hard',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write a decorator FACTORY rate_limit(max_calls) — it takes max_calls and returns the actual ' +
      'decorator, which wraps a function so it can only be successfully called max_calls times total; any ' +
      'call beyond that raises RuntimeError("Rate limit exceeded"). This is a decorator with its own ' +
      'arguments, one extra level of nesting deeper than a plain decorator — exactly the pattern behind ' +
      'real API rate-limiting middleware.',
    starterCode:
      'def rate_limit(max_calls):\n' +
      '    # TODO: return a decorator that allows at most max_calls total calls to the wrapped function\n' +
      '    pass\n\n' +
      '@rate_limit(3)\n' +
      'def ping(host):\n' +
      '    return f"pong from {host}"\n',
    hints: [
      'rate_limit(max_calls) needs to return an actual decorator function — that decorator then takes func and returns the wrapper, three levels deep total.',
      'A mutable counter needs to live in the enclosing scope so it persists across calls — a list like calls = [0] (or Python 3\'s nonlocal keyword) both work.',
      'Increment the counter and check it against max_calls every time the wrapper runs, raising RuntimeError once the limit is exceeded.',
    ],
    solution:
      'def rate_limit(max_calls):\n' +
      '    def decorator(func):\n' +
      '        calls = [0]\n' +
      '        def wrapper(*args, **kwargs):\n' +
      '            if calls[0] >= max_calls:\n' +
      '                raise RuntimeError("Rate limit exceeded")\n' +
      '            calls[0] += 1\n' +
      '            return func(*args, **kwargs)\n' +
      '        return wrapper\n' +
      '    return decorator\n\n' +
      '@rate_limit(3)\n' +
      'def ping(host):\n' +
      '    return f"pong from {host}"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("call 1", ping("a"), "pong from a")\n' +
      '__check__("call 2", ping("b"), "pong from b")\n' +
      '__check__("call 3", ping("c"), "pong from c")\n' +
      'try:\n' +
      '    ping("d")\n' +
      '    __results__.append(("4th call raises", False, "no exception", "RuntimeError"))\n' +
      'except RuntimeError:\n' +
      '    __results__.append(("4th call raises", True, "RuntimeError", "RuntimeError"))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-03',
    title: 'A Generator That Filters Log Lines Lazily',
    difficulty: 'Easy',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write filter_lines(lines, keyword) as a GENERATOR function (uses yield, not return) that yields each ' +
      'line from lines containing keyword (case-insensitive), one at a time, without building the whole ' +
      'result list in memory first. On a real multi-gigabyte log file, this lazy-evaluation approach is the ' +
      'difference between a script that streams through fine and one that runs out of memory.',
    starterCode:
      'def filter_lines(lines, keyword):\n' +
      '    # TODO: yield (don\'t return a list) each line containing keyword, case-insensitive\n' +
      '    pass\n',
    hints: [
      'Using yield anywhere in a function body automatically makes it a generator function.',
      'Loop over lines, and for each one that matches, `yield line` instead of appending to a list.',
      'keyword.lower() in line.lower() is the same case-insensitive containment check used elsewhere in this course.',
    ],
    solution:
      'def filter_lines(lines, keyword):\n' +
      '    for line in lines:\n' +
      '        if keyword.lower() in line.lower():\n' +
      '            yield line\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'import inspect\n' +
      'lines = ["login OK", "FAILED login", "login OK", "failed AGAIN"]\n' +
      'gen = filter_lines(lines, "failed")\n' +
      '__check__("is a generator", inspect.isgenerator(gen), True)\n' +
      '__check__("filters correctly, in order", list(gen), ["FAILED login", "failed AGAIN"])\n' +
      '__check__("no matches yields nothing", list(filter_lines(["a", "b"], "zzz")), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-04',
    title: 'An Infinite Ticket-ID Generator',
    difficulty: 'Medium',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write ticket_ids(prefix) as a generator function that yields f"{prefix}-1", f"{prefix}-2", ' +
      'f"{prefix}-3", ... forever, never stopping on its own. Callers are expected to only pull as many as ' +
      'they need (e.g. via itertools.islice or a plain loop with a break). This is the standard pattern for ' +
      'an incident-ticket ID generator or any counter that should never "run out."',
    starterCode:
      'def ticket_ids(prefix):\n' +
      '    # TODO: yield f"{prefix}-1", f"{prefix}-2", ... forever\n' +
      '    pass\n',
    hints: [
      'A while True: loop combined with yield is exactly how you write a generator that never terminates by itself.',
      'Keep a counter starting at 1, yield the formatted string, then increment it, each time through the loop.',
      'Never call list() or for...in directly on this without limiting it first — that would hang forever. Use itertools.islice(gen, n) to safely take just the first n values.',
    ],
    solution:
      'def ticket_ids(prefix):\n' +
      '    n = 1\n' +
      '    while True:\n' +
      '        yield f"{prefix}-{n}"\n' +
      '        n += 1\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'import itertools\n' +
      'gen = ticket_ids("INC")\n' +
      'first_three = list(itertools.islice(gen, 3))\n' +
      '__check__("first three ids", first_three, ["INC-1", "INC-2", "INC-3"])\n' +
      '__check__("continues where it left off", next(gen), "INC-4")\n' +
      '__check__("different prefix independent", next(ticket_ids("REQ")), "REQ-1")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-05',
    title: 'A Context Manager That Clears a Secret on Exit',
    difficulty: 'Medium',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write class SecureTempSecret implementing the context manager protocol directly: __init__(self, ' +
      'value) stores value, __enter__(self) returns self, and __exit__(self, exc_type, exc_val, exc_tb) ' +
      'sets self.value = None and returns False (so it never swallows exceptions) — and it must clear the ' +
      'value whether the with-block exited normally OR via an exception. Sensitive values living in memory ' +
      'only as long as strictly necessary, guaranteed by the language\'s own with-block cleanup, is a real ' +
      'defense-in-depth habit.',
    starterCode:
      'class SecureTempSecret:\n' +
      '    def __init__(self, value):\n' +
      '        self.value = value\n\n' +
      '    def __enter__(self):\n' +
      '        # TODO: return self\n' +
      '        pass\n\n' +
      '    def __exit__(self, exc_type, exc_val, exc_tb):\n' +
      '        # TODO: clear self.value, return False\n' +
      '        pass\n',
    hints: [
      '__enter__ is what the `as` part of `with X() as x` binds to — returning self is the normal choice when the object itself is what you want to use inside the block.',
      '__exit__ always runs on the way out of the with-block, exception or not — that\'s exactly why it\'s the right place to clear a secret.',
      'Returning False (or None) from __exit__ means "don\'t suppress the exception" — it will keep propagating normally if one occurred.',
    ],
    solution:
      'class SecureTempSecret:\n' +
      '    def __init__(self, value):\n' +
      '        self.value = value\n\n' +
      '    def __enter__(self):\n' +
      '        return self\n\n' +
      '    def __exit__(self, exc_type, exc_val, exc_tb):\n' +
      '        self.value = None\n' +
      '        return False\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'holder = {}\n' +
      'with SecureTempSecret("s3cr3t") as s:\n' +
      '    holder["inside"] = s.value\n' +
      '__check__("value available inside the block", holder["inside"], "s3cr3t")\n' +
      '__check__("value cleared after normal exit", s.value, None)\n\n' +
      'secret2 = SecureTempSecret("other-secret")\n' +
      'try:\n' +
      '    with secret2 as s2:\n' +
      '        raise ValueError("boom")\n' +
      'except ValueError:\n' +
      '    pass\n' +
      '__check__("value cleared even after an exception", secret2.value, None)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-06',
    title: 'A @contextmanager-Decorated Logging Block',
    difficulty: 'Medium',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Using contextlib.contextmanager, write a generator function timed_block(label, log) that appends ' +
      'f"{label}: start" to the list log, then yields once, then appends f"{label}: end" to log in a ' +
      'finally block (so it still logs "end" even if the code inside the with-block raised). This is the ' +
      'much shorter alternative to writing a full __enter__/__exit__ class when your context manager is ' +
      'simple enough to express as "setup, yield, teardown."',
    starterCode:
      'from contextlib import contextmanager\n\n' +
      '@contextmanager\n' +
      'def timed_block(label, log):\n' +
      '    # TODO: log.append(f"{label}: start"), yield, then log.append(f"{label}: end") in a finally block\n' +
      '    pass\n',
    hints: [
      'Everything before the yield runs as __enter__ would; everything after (in a finally) runs as __exit__ would.',
      'Wrap the yield in try/finally so the "end" log line still happens even if the with-block\'s body raises.',
      'The decorator @contextmanager is what turns this generator function into something usable with `with timed_block(...) as x:`.',
    ],
    solution:
      'from contextlib import contextmanager\n\n' +
      '@contextmanager\n' +
      'def timed_block(label, log):\n' +
      '    log.append(f"{label}: start")\n' +
      '    try:\n' +
      '        yield\n' +
      '    finally:\n' +
      '        log.append(f"{label}: end")\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'log = []\n' +
      'with timed_block("scan", log):\n' +
      '    log.append("scan: working")\n' +
      '__check__("normal order", log, ["scan: start", "scan: working", "scan: end"])\n\n' +
      'log2 = []\n' +
      'try:\n' +
      '    with timed_block("scan2", log2):\n' +
      '        raise ValueError("boom")\n' +
      'except ValueError:\n' +
      '    pass\n' +
      '__check__("end still logged after exception", log2, ["scan2: start", "scan2: end"])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-07',
    title: 'Extract Every Email Address With Regex',
    difficulty: 'Medium',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write extract_emails(text) using the re module to return a list of every email-shaped substring in ' +
      'text, in order. A reasonable pattern is fine — you don\'t need full RFC 5322 compliance, just ' +
      'something matching typical addresses like "user.name+tag@sub.example.com". This exact kind of ' +
      'extraction is the first step of theHarvester-style OSINT tooling.',
    starterCode: 'import re\n\ndef extract_emails(text):\n    # TODO: return every email-shaped substring found in text, in order\n    pass\n',
    hints: [
      'A workable pattern: r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}".',
      're.findall(pattern, text) returns all non-overlapping matches as a list, already in order.',
      'Remember to escape the literal dot before the TLD as \\. so it doesn\'t match any character.',
    ],
    solution:
      'import re\n\n' +
      'def extract_emails(text):\n' +
      '    return re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", text)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'text = "Contact hr@example.com or press+media@sub.example.co for info. Not an email: user@@bad"\n' +
      '__check__("finds valid emails", extract_emails(text), ["hr@example.com", "press+media@sub.example.co"])\n' +
      '__check__("no emails", extract_emails("nothing here"), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-08',
    title: 'Validate a Strong Password With One Regex',
    difficulty: 'Hard',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write is_strong_password(pw) that returns True only if a SINGLE regex (using lookaheads) confirms pw ' +
      'is at least 10 characters long and contains at least one lowercase letter, one uppercase letter, one ' +
      'digit, and one symbol from [!@#$%^&*]. Use re.fullmatch with lookahead assertions rather than several ' +
      'separate checks — a good exercise in just how much logic a single regex can express.',
    starterCode:
      'import re\n\n' +
      'def is_strong_password(pw):\n' +
      '    # TODO: one regex with lookaheads enforcing length >= 10 and all 4 character classes\n' +
      '    pass\n',
    hints: [
      'Lookaheads like (?=.*[A-Z]) check "somewhere ahead there\'s an uppercase letter" without consuming any characters, so you can stack several at the start of the pattern.',
      'The full pattern looks like r"(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{10,}" — each (?=...) is one requirement, and .{10,} enforces the minimum length.',
      're.fullmatch(pattern, pw) returns a Match object (truthy) or None (falsy) — wrap it with bool(...) to get True/False.',
    ],
    solution:
      'import re\n\n' +
      'def is_strong_password(pw):\n' +
      '    pattern = r"(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{10,}"\n' +
      '    return bool(re.fullmatch(pattern, pw))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("strong password", is_strong_password("Tr0ub4dor&3x"), True)\n' +
      '__check__("too short", is_strong_password("Ab1!"), False)\n' +
      '__check__("no symbol", is_strong_password("Abcdefghij1"), False)\n' +
      '__check__("no uppercase", is_strong_password("abcdefghij1!"), False)\n' +
      '__check__("no digit", is_strong_password("Abcdefghij!!"), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-09',
    title: 'Top 3 Most Targeted Usernames With Counter',
    difficulty: 'Easy',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write top_targeted_users(usernames, n=3) using collections.Counter to return the n most common ' +
      'entries in the usernames list, as a list of (username, count) tuples in descending order of count. ' +
      'This is the exact "who is getting hit the hardest" query you\'d run against a pile of brute-force ' +
      'login attempts.',
    starterCode:
      'from collections import Counter\n\n' +
      'def top_targeted_users(usernames, n=3):\n' +
      '    # TODO: return the n most common usernames as [(username, count), ...]\n' +
      '    pass\n',
    hints: [
      'Counter(usernames) builds the frequency table for you in one call.',
      'Counter has a .most_common(n) method that returns exactly the [(item, count), ...] format already sorted by count descending.',
      'This task really is just one line once you know that method exists.',
    ],
    solution:
      'from collections import Counter\n\n' +
      'def top_targeted_users(usernames, n=3):\n' +
      '    return Counter(usernames).most_common(n)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'attempts = ["admin"] * 5 + ["root"] * 3 + ["admin"] * 2 + ["test"] * 1 + ["guest"] * 4\n' +
      '__check__("top 3", top_targeted_users(attempts, 3), [("admin", 7), ("guest", 4), ("root", 3)])\n' +
      '__check__("top 1", top_targeted_users(attempts, 1), [("admin", 7)])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-10',
    title: 'Memoize an Expensive Lookup With lru_cache',
    difficulty: 'Medium',
    language: 'python',
    category: 'Advanced',
    prompt:
      'A function slow_hash_lookup(value, call_log) simulates an expensive hash computation — it appends ' +
      'value to call_log every time it actually runs, then returns a fake hash string. Wrap it with ' +
      '@functools.lru_cache so repeated calls with the SAME value only do the expensive work once. Write ' +
      'cached_lookup(value, call_log) that calls the cached version. Note: call_log must stay a plain ' +
      'argument, not part of the cache key logic itself — the point is that identical inputs should skip ' +
      're-computation entirely, exactly like caching repeated hash/IOC lookups in a real pipeline.',
    starterCode:
      'from functools import lru_cache\n\n' +
      '_call_log_ref = []\n\n' +
      '@lru_cache(maxsize=None)\n' +
      'def _slow_hash_lookup(value):\n' +
      '    _call_log_ref.append(value)\n' +
      '    return f"hash-of-{value}"\n\n' +
      'def cached_lookup(value, call_log):\n' +
      '    # TODO: call _slow_hash_lookup(value), then sync call_log to reflect _call_log_ref, and return the result\n' +
      '    # (this indirection exists so the cache truly only depends on `value`, not on which call_log object is passed)\n' +
      '    result = _slow_hash_lookup(value)\n' +
      '    call_log.clear()\n' +
      '    call_log.extend(_call_log_ref)\n' +
      '    return result\n',
    hints: [
      'The @lru_cache decorator is already applied for you on _slow_hash_lookup — your job is just to call it correctly from cached_lookup.',
      'Because _slow_hash_lookup is cached, calling it twice with the same value only actually runs the function body (and appends to _call_log_ref) once.',
      'This starter code has almost everything filled in already — trace through it and make sure you understand why _call_log_ref only grows on true cache misses.',
    ],
    solution:
      'from functools import lru_cache\n\n' +
      '_call_log_ref = []\n\n' +
      '@lru_cache(maxsize=None)\n' +
      'def _slow_hash_lookup(value):\n' +
      '    _call_log_ref.append(value)\n' +
      '    return f"hash-of-{value}"\n\n' +
      'def cached_lookup(value, call_log):\n' +
      '    result = _slow_hash_lookup(value)\n' +
      '    call_log.clear()\n' +
      '    call_log.extend(_call_log_ref)\n' +
      '    return result\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'log = []\n' +
      'r1 = cached_lookup("abc", log)\n' +
      'r2 = cached_lookup("abc", log)\n' +
      'r3 = cached_lookup("xyz", log)\n' +
      '__check__("same result both times", r1 == r2, True)\n' +
      '__check__("only computed twice total (abc once, xyz once) despite 3 calls", log, ["abc", "xyz"])\n' +
      '__check__("distinct values give distinct results", r1 != r3, True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-11',
    title: 'A Custom Security Exception Hierarchy',
    difficulty: 'Medium',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Define class SecurityError(Exception), then class AuthenticationError(SecurityError) and class ' +
      'AuthorizationError(SecurityError) as subclasses. Write check_access(is_authenticated, is_authorized) ' +
      'that raises AuthenticationError("Not logged in") if is_authenticated is False, else raises ' +
      'AuthorizationError("Insufficient permissions") if is_authorized is False, else returns "access ' +
      'granted". A custom exception hierarchy like this lets calling code catch broadly (except ' +
      'SecurityError) or narrowly (except AuthenticationError) depending on what it actually needs to do ' +
      'about the failure.',
    starterCode:
      'class SecurityError(Exception):\n' +
      '    pass\n\n' +
      'class AuthenticationError(SecurityError):\n' +
      '    pass\n\n' +
      'class AuthorizationError(SecurityError):\n' +
      '    pass\n\n' +
      'def check_access(is_authenticated, is_authorized):\n' +
      '    # TODO: raise AuthenticationError, then AuthorizationError, else return "access granted"\n' +
      '    pass\n',
    hints: [
      'Check is_authenticated first — if False, raise AuthenticationError("Not logged in") and stop there.',
      'Only check is_authorized once you know the user is authenticated.',
      'If both checks pass, return the literal string "access granted".',
    ],
    solution:
      'class SecurityError(Exception):\n' +
      '    pass\n\n' +
      'class AuthenticationError(SecurityError):\n' +
      '    pass\n\n' +
      'class AuthorizationError(SecurityError):\n' +
      '    pass\n\n' +
      'def check_access(is_authenticated, is_authorized):\n' +
      '    if not is_authenticated:\n' +
      '        raise AuthenticationError("Not logged in")\n' +
      '    if not is_authorized:\n' +
      '        raise AuthorizationError("Insufficient permissions")\n' +
      '    return "access granted"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("full access", check_access(True, True), "access granted")\n' +
      'try:\n' +
      '    check_access(False, True)\n' +
      '    __results__.append(("not authenticated raises", False, "no exception", "AuthenticationError"))\n' +
      'except AuthenticationError:\n' +
      '    __results__.append(("not authenticated raises", True, "AuthenticationError", "AuthenticationError"))\n' +
      'try:\n' +
      '    check_access(True, False)\n' +
      '    __results__.append(("not authorized raises", False, "no exception", "AuthorizationError"))\n' +
      'except AuthorizationError:\n' +
      '    __results__.append(("not authorized raises", True, "AuthorizationError", "AuthorizationError"))\n' +
      'try:\n' +
      '    check_access(False, True)\n' +
      '    __results__.append(("subclass catchable as SecurityError", False, "no exception", "SecurityError"))\n' +
      'except SecurityError:\n' +
      '    __results__.append(("subclass catchable as SecurityError", True, "SecurityError", "SecurityError"))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-12',
    title: 'Concurrent Host Checks With asyncio.gather',
    difficulty: 'Hard',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Given the async function check_host(host, delay) (provided, simulating a network round-trip with ' +
      'asyncio.sleep), write async def check_hosts_concurrently(hosts_with_delays) where hosts_with_delays ' +
      'is a list of (host, delay) tuples — run all the checks CONCURRENTLY with asyncio.gather and return ' +
      'their results as a list, in the same order as the input. Real recon/monitoring tools check dozens of ' +
      'hosts at once precisely because doing it one at a time, waiting for each response before starting ' +
      'the next, would be unusably slow.',
    starterCode:
      'import asyncio\n\n' +
      'async def check_host(host, delay):\n' +
      '    await asyncio.sleep(delay)\n' +
      '    return f"{host}: reachable"\n\n' +
      'async def check_hosts_concurrently(hosts_with_delays):\n' +
      '    # TODO: run check_host(host, delay) for every tuple CONCURRENTLY via asyncio.gather,\n' +
      '    # returning the results in the same order as the input\n' +
      '    pass\n',
    hints: [
      'Build a list of coroutine objects first: [check_host(host, delay) for host, delay in hosts_with_delays] — calling an async function doesn\'t run it yet, it just creates the coroutine.',
      'asyncio.gather(*coroutines) runs them all concurrently and returns their results in the same order they were passed in, regardless of which finishes first.',
      'Remember to await the gather call, and this function itself needs the async def / return await asyncio.gather(...) shape.',
    ],
    solution:
      'import asyncio\n\n' +
      'async def check_host(host, delay):\n' +
      '    await asyncio.sleep(delay)\n' +
      '    return f"{host}: reachable"\n\n' +
      'async def check_hosts_concurrently(hosts_with_delays):\n' +
      '    coroutines = [check_host(host, delay) for host, delay in hosts_with_delays]\n' +
      '    return await asyncio.gather(*coroutines)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'import time\n' +
      'start = time.time()\n' +
      'result = await check_hosts_concurrently([("web01", 0.05), ("web02", 0.05), ("web03", 0.05)])\n' +
      'elapsed = time.time() - start\n' +
      '__check__("all results present in order", list(result), ["web01: reachable", "web02: reachable", "web03: reachable"])\n' +
      '__check__("ran concurrently, not serially (elapsed well under 3x0.05s)", elapsed < 0.13, True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-13',
    title: 'A Validated ScanResult Dataclass',
    difficulty: 'Hard',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Using @dataclass and type hints, define ScanResult with fields host: str, port: int, and open: bool. ' +
      'Add a __post_init__(self) method that raises ValueError("Invalid port") if port is not between 1 ' +
      'and 65535 inclusive. __post_init__ runs automatically right after the auto-generated __init__ ' +
      'finishes, making it the natural place to add validation a plain dataclass doesn\'t give you for free.',
    starterCode:
      'from dataclasses import dataclass\n\n' +
      '@dataclass\n' +
      'class ScanResult:\n' +
      '    host: str\n' +
      '    port: int\n' +
      '    open: bool\n\n' +
      '    def __post_init__(self):\n' +
      '        # TODO: raise ValueError("Invalid port") if self.port is not in 1-65535\n' +
      '        pass\n',
    hints: [
      '__post_init__ takes only self — the fields are already set on the instance by the time it runs.',
      'The check is just `if not (1 <= self.port <= 65535): raise ValueError("Invalid port")`.',
      'Because this raises inside __init__ indirectly, constructing ScanResult(...) with a bad port will raise immediately, before you even get an instance back.',
    ],
    solution:
      'from dataclasses import dataclass\n\n' +
      '@dataclass\n' +
      'class ScanResult:\n' +
      '    host: str\n' +
      '    port: int\n' +
      '    open: bool\n\n' +
      '    def __post_init__(self):\n' +
      '        if not (1 <= self.port <= 65535):\n' +
      '            raise ValueError("Invalid port")\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'r = ScanResult("10.0.0.1", 443, True)\n' +
      '__check__("valid construction", (r.host, r.port, r.open), ("10.0.0.1", 443, True))\n' +
      'try:\n' +
      '    ScanResult("10.0.0.1", 70000, True)\n' +
      '    __results__.append(("invalid port raises", False, "no exception", "ValueError"))\n' +
      'except ValueError:\n' +
      '    __results__.append(("invalid port raises", True, "ValueError", "ValueError"))\n' +
      'try:\n' +
      '    ScanResult("10.0.0.1", 0, True)\n' +
      '    __results__.append(("port zero raises", False, "no exception", "ValueError"))\n' +
      'except ValueError:\n' +
      '    __results__.append(("port zero raises", True, "ValueError", "ValueError"))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-14',
    title: 'A Decorator That Retries a Flaky Network Call',
    difficulty: 'Hard',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Write a retry(max_attempts) decorator factory. The decorated function should be called; if it raises ' +
      'any exception, retry by calling it again, up to max_attempts TOTAL attempts. Return the result ' +
      'immediately on whichever attempt succeeds — no further calls after that. If every attempt raises, let ' +
      'the exception from the FINAL attempt propagate to the caller.',
    starterCode:
      'def retry(max_attempts):\n' +
      '    # TODO: return a decorator that retries the wrapped function up to max_attempts times\n' +
      '    def decorator(func):\n' +
      '        def wrapper(*args, **kwargs):\n' +
      '            pass\n' +
      '        return wrapper\n' +
      '    return decorator\n',
    hints: [
      'retry(max_attempts) must return a decorator — a function that takes func and returns a wrapper.',
      'Inside wrapper, loop attempt from 1 to max_attempts: try calling func(*args, **kwargs) and return its result immediately on success.',
      'On the LAST attempt, don\'t catch the exception (or catch it and immediately re-raise) — every earlier attempt should catch-and-continue, but the final failure must propagate.',
    ],
    solution:
      'def retry(max_attempts):\n' +
      '    def decorator(func):\n' +
      '        def wrapper(*args, **kwargs):\n' +
      '            for attempt in range(1, max_attempts + 1):\n' +
      '                try:\n' +
      '                    return func(*args, **kwargs)\n' +
      '                except Exception:\n' +
      '                    if attempt == max_attempts:\n' +
      '                        raise\n' +
      '        return wrapper\n' +
      '    return decorator\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'call_count_a = [0]\n\n' +
      '@retry(max_attempts=3)\n' +
      'def flaky_then_succeeds():\n' +
      '    call_count_a[0] += 1\n' +
      '    if call_count_a[0] < 3:\n' +
      '        raise ConnectionError("simulated network blip")\n' +
      '    return "connected"\n\n' +
      '__check__("succeeds on the 3rd attempt", flaky_then_succeeds(), "connected")\n' +
      '__check__("called exactly 3 times", call_count_a[0], 3)\n\n' +
      'call_count_b = [0]\n\n' +
      '@retry(max_attempts=2)\n' +
      'def always_fails():\n' +
      '    call_count_b[0] += 1\n' +
      '    raise ConnectionError("always down")\n\n' +
      'try:\n' +
      '    always_fails()\n' +
      '    __results__.append(("propagates final failure", False, "no exception", "ConnectionError"))\n' +
      'except ConnectionError:\n' +
      '    __results__.append(("propagates final failure", True, "ConnectionError", "ConnectionError"))\n' +
      '__check__("stopped after exactly max_attempts calls", call_count_b[0], 2)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-adv-15',
    title: 'Build an LRU Cache From Scratch',
    difficulty: 'Hard',
    language: 'python',
    category: 'Advanced',
    prompt:
      'Implement an LRUCache class (capacity) with get(key) (returns the value, or None if absent, and marks ' +
      'the key as most-recently-used) and put(key, value) (inserts or updates a key, marking it ' +
      'most-recently-used; if this pushes the cache over capacity, evict the LEAST-recently-used entry ' +
      'first). You may use collections.OrderedDict internally — the point of this task is implementing the ' +
      'eviction policy correctly, not banning any particular data structure.',
    starterCode:
      'from collections import OrderedDict\n\n' +
      'class LRUCache:\n' +
      '    def __init__(self, capacity):\n' +
      '        # TODO: store capacity and set up internal storage\n' +
      '        pass\n\n' +
      '    def get(self, key):\n' +
      '        # TODO: return the value (or None), marking key as most-recently-used on a hit\n' +
      '        pass\n\n' +
      '    def put(self, key, value):\n' +
      '        # TODO: insert/update key, marking it most-recently-used; evict LRU entry if over capacity\n' +
      '        pass\n',
    hints: [
      'OrderedDict.move_to_end(key) moves an existing key to the "most recently used" end without changing its value.',
      'On get(): if key isn\'t present return None; otherwise move it to the end and return its value.',
      'On put(): if key already exists, update its value and move it to the end. If it\'s new and adding it pushes len over capacity, remove the LRU entry with self._data.popitem(last=False) — the item at the OPPOSITE end from move_to_end.',
    ],
    solution:
      'from collections import OrderedDict\n\n' +
      'class LRUCache:\n' +
      '    def __init__(self, capacity):\n' +
      '        self.capacity = capacity\n' +
      '        self._data = OrderedDict()\n\n' +
      '    def get(self, key):\n' +
      '        if key not in self._data:\n' +
      '            return None\n' +
      '        self._data.move_to_end(key)\n' +
      '        return self._data[key]\n\n' +
      '    def put(self, key, value):\n' +
      '        if key in self._data:\n' +
      '            self._data.move_to_end(key)\n' +
      '        self._data[key] = value\n' +
      '        if len(self._data) > self.capacity:\n' +
      '            self._data.popitem(last=False)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'cache = LRUCache(capacity=2)\n' +
      'cache.put(1, "a")\n' +
      'cache.put(2, "b")\n' +
      '__check__("get existing key 1", cache.get(1), "a")\n' +
      "# key 1 was just touched by get() -- key 2 is now the LEAST recently used\n" +
      'cache.put(3, "c")\n' +
      '__check__("key 2 evicted (was least recently used)", cache.get(2), None)\n' +
      '__check__("key 1 survives (was touched more recently)", cache.get(1), "a")\n' +
      '__check__("key 3 present (just inserted)", cache.get(3), "c")\n\n' +
      'cache.put(1, "updated")\n' +
      '__check__("put on existing key updates value", cache.get(1), "updated")\n' +
      '__check__("missing key returns None", cache.get(999), None)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
