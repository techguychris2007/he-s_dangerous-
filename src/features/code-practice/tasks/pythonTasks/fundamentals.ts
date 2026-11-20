import type { CodeTask } from '../codeTypes';

/** Python fundamentals through a security lens: string/text handling, dicts, basic parsing —
 *  the everyday building blocks every automation script or quick triage tool is made of. */
export const PYTHON_FUNDAMENTALS_TASKS: CodeTask[] = [
  {
    id: 'py-fund-01',
    title: 'Validate an IPv4 Address',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write is_valid_ipv4(addr) that returns True only if addr is a syntactically valid IPv4 address: ' +
      'exactly 4 dot-separated parts, each a base-10 integer from 0 to 255, with no extra whitespace and ' +
      'no leading zeros (e.g. "01" is invalid, but "0" is valid). This kind of input validation is the ' +
      'first line of defense before an address ever gets passed to a scanner or firewall rule.',
    starterCode:
      'def is_valid_ipv4(addr):\n' +
      '    # TODO: return True only for a syntactically valid IPv4 address\n' +
      '    pass\n',
    hints: [
      'Split on "." first — anything that doesn\'t produce exactly 4 parts is already invalid.',
      'Each part must be all digits (str.isdigit()) before you even try int() on it, otherwise "1.2.3.-4" or "1.2.3. 4" can sneak through.',
      'Reject leading zeros by checking that str(int(part)) == part, then check the numeric range 0-255.',
    ],
    solution:
      'def is_valid_ipv4(addr):\n' +
      '    parts = addr.split(".")\n' +
      '    if len(parts) != 4:\n' +
      '        return False\n' +
      '    for part in parts:\n' +
      '        if not part.isdigit():\n' +
      '            return False\n' +
      '        if str(int(part)) != part:\n' +
      '            return False\n' +
      '        if not (0 <= int(part) <= 255):\n' +
      '            return False\n' +
      '    return True\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("valid", is_valid_ipv4("192.168.1.1"), True)\n' +
      '__check__("valid edge", is_valid_ipv4("0.0.0.0"), True)\n' +
      '__check__("valid max", is_valid_ipv4("255.255.255.255"), True)\n' +
      '__check__("too many parts", is_valid_ipv4("1.2.3.4.5"), False)\n' +
      '__check__("out of range", is_valid_ipv4("256.1.1.1"), False)\n' +
      '__check__("leading zero", is_valid_ipv4("192.168.01.1"), False)\n' +
      '__check__("non numeric", is_valid_ipv4("abc.1.1.1"), False)\n' +
      '__check__("negative", is_valid_ipv4("1.2.3.-4"), False)\n' +
      '__check__("whitespace", is_valid_ipv4("1.2.3. 4"), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-02',
    title: 'Count Failed Login Attempts Per User',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write count_failed_logins(lines) where lines is a list of log strings like ' +
      '"2024-01-01 09:00:01 FAILED_LOGIN user=alice" or "... SUCCESS user=bob". Return a dict mapping ' +
      'username to how many FAILED_LOGIN lines mention them. This is the first step of any brute-force ' +
      'detection — before you can alert on "too many failures," you need to count them per account.',
    starterCode:
      'def count_failed_logins(lines):\n' +
      '    # TODO: return {username: failed_count} counting only FAILED_LOGIN lines\n' +
      '    pass\n',
    hints: [
      'Skip any line that doesn\'t contain "FAILED_LOGIN" first.',
      'The username always follows "user=" and runs to the end of the line (or the next space, if you assume no spaces in usernames).',
      'A plain dict with dict.get(user, 0) + 1, or collections.Counter, both work fine.',
    ],
    solution:
      'def count_failed_logins(lines):\n' +
      '    counts = {}\n' +
      '    for line in lines:\n' +
      '        if "FAILED_LOGIN" not in line:\n' +
      '            continue\n' +
      '        idx = line.find("user=")\n' +
      '        if idx == -1:\n' +
      '            continue\n' +
      '        user = line[idx + len("user="):].split()[0]\n' +
      '        counts[user] = counts.get(user, 0) + 1\n' +
      '    return counts\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'lines = [\n' +
      '    "2024-01-01 09:00:01 FAILED_LOGIN user=alice",\n' +
      '    "2024-01-01 09:00:05 FAILED_LOGIN user=alice",\n' +
      '    "2024-01-01 09:00:09 SUCCESS user=bob",\n' +
      '    "2024-01-01 09:00:12 FAILED_LOGIN user=bob",\n' +
      '    "2024-01-01 09:00:20 FAILED_LOGIN user=alice",\n' +
      ']\n' +
      '__check__("counts", count_failed_logins(lines), {"alice": 3, "bob": 1})\n' +
      '__check__("empty", count_failed_logins([]), {})\n' +
      '__check__("no failures", count_failed_logins(["SUCCESS user=carol"]), {})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-03',
    title: 'Extract All IP Addresses From a Block of Text',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write extract_ips(text) that returns a list of every IPv4-shaped substring found in text, in the ' +
      'order they appear, duplicates included. You may use the re module. Pulling every IP out of a raw ' +
      'log dump or packet capture text is one of the most common first steps in any investigation.',
    starterCode: 'import re\n\ndef extract_ips(text):\n    # TODO: return every IPv4-shaped substring, in order, duplicates included\n    pass\n',
    hints: [
      'A reasonably good pattern is r"\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}" — it doesn\'t need to validate ranges, just shape.',
      're.findall(pattern, text) already returns matches in order as a list.',
      'You do not need to deduplicate — the task explicitly wants duplicates kept.',
    ],
    solution:
      'import re\n\n' +
      'def extract_ips(text):\n' +
      '    return re.findall(r"\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}", text)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'text = "Connection from 10.0.0.5 to 192.168.1.1 failed. Retried from 10.0.0.5 again."\n' +
      '__check__("basic", extract_ips(text), ["10.0.0.5", "192.168.1.1", "10.0.0.5"])\n' +
      '__check__("none", extract_ips("no addresses here"), [])\n' +
      '__check__("single", extract_ips("host is 8.8.8.8 only"), ["8.8.8.8"])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-04',
    title: 'Check Password Strength',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write password_strength(pw) returning one of "weak", "medium", "strong". "strong" needs length >= 12, ' +
      'at least one uppercase letter, one lowercase letter, one digit, and one symbol (anything not ' +
      'alphanumeric). "medium" needs length >= 8 and at least 2 of those 4 character-class checks. ' +
      'Everything else is "weak". This is the exact kind of rule-based check behind every signup form\'s ' +
      'password meter.',
    starterCode:
      'def password_strength(pw):\n' +
      '    # TODO: return "weak", "medium", or "strong" per the rules described\n' +
      '    pass\n',
    hints: [
      'Compute the 4 booleans first (has_upper, has_lower, has_digit, has_symbol), then count how many are True.',
      'str.isupper()/islower()/isdigit() work per-character — use any(c.isupper() for c in pw) style checks.',
      'Check the "strong" condition first (it\'s the strictest), then "medium", falling through to "weak".',
    ],
    solution:
      'def password_strength(pw):\n' +
      '    has_upper = any(c.isupper() for c in pw)\n' +
      '    has_lower = any(c.islower() for c in pw)\n' +
      '    has_digit = any(c.isdigit() for c in pw)\n' +
      '    has_symbol = any(not c.isalnum() for c in pw)\n' +
      '    class_count = sum([has_upper, has_lower, has_digit, has_symbol])\n' +
      '    if len(pw) >= 12 and has_upper and has_lower and has_digit and has_symbol:\n' +
      '        return "strong"\n' +
      '    if len(pw) >= 8 and class_count >= 2:\n' +
      '        return "medium"\n' +
      '    return "weak"\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("strong", password_strength("Tr0ub4dor&3xtra!"), "strong")\n' +
      '__check__("medium", password_strength("password123"), "medium")\n' +
      '__check__("weak short", password_strength("abc"), "weak")\n' +
      '__check__("weak one class", password_strength("alllowercase"), "weak")\n' +
      '__check__("weak all lower long", password_strength("aaaaaaaaaaaaaaaa"), "weak")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-05',
    title: 'Redact Credit Card Numbers in Text',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write redact_cards(text) that finds any run of 13-19 digits (allowing spaces or dashes between ' +
      'groups, e.g. "4111-1111-1111-1111" or "4111 1111 1111 1111" or "4111111111111111") and replaces it ' +
      'with only the last 4 digits visible, prefixed with asterisks, e.g. "************1111". Logging ' +
      'pipelines need exactly this kind of PCI-DSS-driven redaction before card numbers ever hit disk.',
    starterCode: 'import re\n\ndef redact_cards(text):\n    # TODO: replace card-like digit runs with asterisks + last 4 digits\n    pass\n',
    hints: [
      'Match with a regex like r"(?:\\d[ -]?){12,18}\\d" to allow optional spaces/dashes between digits.',
      'Inside a re.sub replacement function, strip the matched text down to digits only with re.sub(r"\\D", "", matched) before slicing the last 4.',
      'Use re.sub(pattern, repl_function, text) where repl_function takes a match object and returns the redacted string.',
    ],
    solution:
      'import re\n\n' +
      'def redact_cards(text):\n' +
      '    pattern = r"(?:\\d[ -]?){12,18}\\d"\n' +
      '    def repl(m):\n' +
      '        digits = re.sub(r"\\D", "", m.group())\n' +
      '        return "*" * (len(digits) - 4) + digits[-4:]\n' +
      '    return re.sub(pattern, repl, text)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("plain", redact_cards("Card: 4111111111111111 charged"), "Card: ************1111 charged")\n' +
      '__check__("dashes", redact_cards("Card: 4111-1111-1111-1111 charged"), "Card: ************1111 charged")\n' +
      '__check__("spaces", redact_cards("Card: 4111 1111 1111 1111 charged"), "Card: ************1111 charged")\n' +
      '__check__("no card", redact_cards("no card here"), "no card here")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-06',
    title: 'Parse a CSV-Style Access Log Line',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write parse_log_line(line) that parses a comma-separated line "ip,timestamp,method,path,status" ' +
      '(e.g. "203.0.113.5,2024-01-01T09:00:00,GET,/admin,403") into a dict with those exact keys, and ' +
      'converts status to an int. Structured parsing like this is what turns a flat log file into ' +
      'something you can actually filter and query.',
    starterCode:
      'def parse_log_line(line):\n' +
      '    # TODO: return {"ip":..., "timestamp":..., "method":..., "path":..., "status": <int>}\n' +
      '    pass\n',
    hints: [
      'line.split(",") gives you the 5 fields in order — the trick is just naming them correctly.',
      'Remember to int() the status field; everything else stays a string.',
      'zip(["ip","timestamp","method","path","status"], line.split(",")) plus dict() is a clean way to build it.',
    ],
    solution:
      'def parse_log_line(line):\n' +
      '    fields = line.split(",")\n' +
      '    keys = ["ip", "timestamp", "method", "path", "status"]\n' +
      '    parsed = dict(zip(keys, fields))\n' +
      '    parsed["status"] = int(parsed["status"])\n' +
      '    return parsed\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", parse_log_line("203.0.113.5,2024-01-01T09:00:00,GET,/admin,403"), {\n' +
      '    "ip": "203.0.113.5", "timestamp": "2024-01-01T09:00:00", "method": "GET", "path": "/admin", "status": 403\n' +
      '})\n' +
      '__check__("status is int", type(parse_log_line("1.1.1.1,t,GET,/,200")["status"]), int)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-07',
    title: 'Find Duplicate Lines in a Wordlist',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write find_duplicates(words) that returns a sorted list of every value that appears more than once ' +
      'in the list words, with each duplicate listed only once. Wordlists scraped from multiple breach ' +
      'dumps are full of duplicates, and de-duplicating them (while knowing what got removed) matters ' +
      'before running them through a cracking tool.',
    starterCode: 'def find_duplicates(words):\n    # TODO: return a sorted list of values that appear more than once\n    pass\n',
    hints: [
      'A dict or collections.Counter mapping value -> count gets you there in one pass.',
      'Filter the counts for anything with count > 1, then take just the keys.',
      'Don\'t forget to sorted() the final result — the task requires a specific order.',
    ],
    solution:
      'def find_duplicates(words):\n' +
      '    counts = {}\n' +
      '    for w in words:\n' +
      '        counts[w] = counts.get(w, 0) + 1\n' +
      '    return sorted(w for w, c in counts.items() if c > 1)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", find_duplicates(["password", "123456", "password", "qwerty", "123456", "123456"]), ["123456", "password"])\n' +
      '__check__("none", find_duplicates(["a", "b", "c"]), [])\n' +
      '__check__("empty", find_duplicates([]), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-08',
    title: 'Reverse a String Without Slicing',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write reverse_string(s) that returns s reversed, without using slicing (s[::-1]) or the built-in ' +
      'reversed()/str methods that do it for you. Basic string manipulation like this shows up constantly ' +
      'when reverse-engineering simple obfuscation that just flips or shuffles a payload.',
    starterCode: 'def reverse_string(s):\n    # TODO: return s reversed, without using [::-1] or reversed()\n    pass\n',
    hints: [
      'Build the result by walking the string from the last index down to 0 with a loop.',
      'String concatenation in a loop works fine here: result = s[i] + result for a decreasing i.',
      'range(len(s) - 1, -1, -1) walks the indices backwards.',
    ],
    solution:
      'def reverse_string(s):\n' +
      '    result = ""\n' +
      '    for i in range(len(s) - 1, -1, -1):\n' +
      '        result += s[i]\n' +
      '    return result\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", reverse_string("hacker"), "rekcah")\n' +
      '__check__("empty", reverse_string(""), "")\n' +
      '__check__("single", reverse_string("a"), "a")\n' +
      '__check__("palindrome", reverse_string("level"), "level")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-09',
    title: 'Character Frequency Count',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write char_frequency(text) returning a dict mapping each lowercase letter (a-z only, case-insensitive, ' +
      'ignore everything else including spaces/digits/punctuation) to how many times it appears. Letter ' +
      'frequency counting is the foundation of classical cipher-breaking — English text has a very ' +
      'distinctive letter distribution that cracking tools lean on heavily.',
    starterCode: 'def char_frequency(text):\n    # TODO: return {letter: count} for a-z only, case-insensitive\n    pass\n',
    hints: [
      'Lowercase the text first with text.lower() so "A" and "a" count together.',
      'Skip any character where c.isalpha() is False.',
      'A plain dict with counts.get(c, 0) + 1 works fine; no need to pre-seed all 26 letters.',
    ],
    solution:
      'def char_frequency(text):\n' +
      '    counts = {}\n' +
      '    for c in text.lower():\n' +
      '        if c.isalpha():\n' +
      '            counts[c] = counts.get(c, 0) + 1\n' +
      '    return counts\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", char_frequency("aAbb!! 123"), {"a": 2, "b": 2})\n' +
      '__check__("empty", char_frequency(""), {})\n' +
      '__check__("no letters", char_frequency("123 456"), {})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-10',
    title: 'Validate a Hex Hash by Length and Charset',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write is_valid_hash(s, algo) where algo is one of "md5" (32 hex chars), "sha1" (40 hex chars), or ' +
      '"sha256" (64 hex chars). Return True only if s is exactly the right length for that algorithm and ' +
      'every character is a valid lowercase or uppercase hex digit (0-9, a-f, A-F). Sanity-checking a hash ' +
      'string\'s shape before trying to look it up or compare it saves you from silently comparing garbage.',
    starterCode:
      'def is_valid_hash(s, algo):\n' +
      '    # TODO: check length matches algo (md5=32, sha1=40, sha256=64) and s is all hex digits\n' +
      '    pass\n',
    hints: [
      'A dict like {"md5": 32, "sha1": 40, "sha256": 64} gives you the expected length by algorithm name.',
      'If algo isn\'t one of the three known names, the answer should be False.',
      'all(c in "0123456789abcdefABCDEF" for c in s) checks the charset in one line.',
    ],
    solution:
      'def is_valid_hash(s, algo):\n' +
      '    lengths = {"md5": 32, "sha1": 40, "sha256": 64}\n' +
      '    if algo not in lengths:\n' +
      '        return False\n' +
      '    if len(s) != lengths[algo]:\n' +
      '        return False\n' +
      '    return all(c in "0123456789abcdefABCDEF" for c in s)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("valid md5", is_valid_hash("d41d8cd98f00b204e9800998ecf8427e", "md5"), True)\n' +
      '__check__("wrong length", is_valid_hash("d41d8cd9", "md5"), False)\n' +
      '__check__("bad chars", is_valid_hash("g" * 32, "md5"), False)\n' +
      '__check__("unknown algo", is_valid_hash("a" * 32, "md6"), False)\n' +
      '__check__("valid sha256", is_valid_hash("a" * 64, "sha256"), True)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-11',
    title: 'Merge Two Blocklists Without Duplicates',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write merge_blocklists(list_a, list_b) that returns a single sorted list containing every unique IP ' +
      'from both input lists. Feed and threat-intel sources constantly overlap — merging them cleanly is a ' +
      'daily task for anyone maintaining a blocklist.',
    starterCode: 'def merge_blocklists(list_a, list_b):\n    # TODO: return a sorted list of unique IPs from both lists\n    pass\n',
    hints: [
      'set(list_a) | set(list_b) (or set(list_a).union(list_b)) gives you the unique combined values.',
      'Convert back to a list and sort it before returning.',
      'Sorting IP-shaped strings lexicographically (not numerically) is fine here — the test cases are chosen so plain sorted() gives the expected order.',
    ],
    solution:
      'def merge_blocklists(list_a, list_b):\n' +
      '    combined = set(list_a) | set(list_b)\n' +
      '    return sorted(combined)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", merge_blocklists(["10.0.0.1", "10.0.0.2"], ["10.0.0.2", "10.0.0.3"]), ["10.0.0.1", "10.0.0.2", "10.0.0.3"])\n' +
      '__check__("no overlap", merge_blocklists(["1.1.1.1"], ["2.2.2.2"]), ["1.1.1.1", "2.2.2.2"])\n' +
      '__check__("empty both", merge_blocklists([], []), [])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-12',
    title: 'Rate-Limit Checker Over a Sliding Window',
    difficulty: 'Medium',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write count_in_window(timestamps, window_seconds) where timestamps is a sorted list of integer epoch ' +
      'seconds (one per request from the same source), and return how many timestamps fall within ' +
      'window_seconds of the LAST timestamp in the list (inclusive on both ends). This is the core check ' +
      'behind "block this IP if it made more than N requests in the last 60 seconds."',
    starterCode:
      'def count_in_window(timestamps, window_seconds):\n' +
      '    # TODO: count how many timestamps are within window_seconds of the last (most recent) one\n' +
      '    pass\n',
    hints: [
      'The window\'s start is timestamps[-1] - window_seconds; anything >= that (and <= the last one) counts.',
      'An empty list should just return 0 — check for that first to avoid an index error.',
      'A simple sum(1 for t in timestamps if t >= cutoff) works fine; the list being sorted isn\'t strictly required for correctness here.',
    ],
    solution:
      'def count_in_window(timestamps, window_seconds):\n' +
      '    if not timestamps:\n' +
      '        return 0\n' +
      '    latest = timestamps[-1]\n' +
      '    cutoff = latest - window_seconds\n' +
      '    return sum(1 for t in timestamps if t >= cutoff)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("basic", count_in_window([0, 10, 20, 65, 70], 60), 4)\n' +
      '__check__("all in window", count_in_window([100, 105, 110], 60), 3)\n' +
      '__check__("empty", count_in_window([], 60), 0)\n' +
      '__check__("single", count_in_window([500], 60), 1)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-13',
    title: 'Sanitize a Filename Against Path Traversal',
    difficulty: 'Medium',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write sanitize_filename(name) that strips out any path-traversal attempt and returns a safe base ' +
      'filename: remove any directory components (keep only the part after the last "/" or "\\\\"), then ' +
      'strip any remaining ".." sequences, and finally strip leading dots/whitespace. ' +
      '"../../etc/passwd" style input is one of the oldest and still most common file-handling ' +
      'vulnerabilities — never trust a filename a user gives you.',
    starterCode:
      'def sanitize_filename(name):\n' +
      '    # TODO: return a safe base filename with no directory traversal\n' +
      '    pass\n',
    hints: [
      'Split on both "/" and "\\\\" and keep only the last segment — os.path.basename-style logic, but write it by hand with .split().',
      'After isolating the base name, use str.replace("..", "") to strip out any remaining traversal sequences.',
      'Finish with .lstrip(". ") to remove any leading dots or spaces left behind.',
    ],
    solution:
      'def sanitize_filename(name):\n' +
      '    normalized = name.replace("\\\\", "/")\n' +
      '    base = normalized.split("/")[-1]\n' +
      '    base = base.replace("..", "")\n' +
      '    return base.lstrip(". ")\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("traversal unix", sanitize_filename("../../etc/passwd"), "passwd")\n' +
      '__check__("traversal windows", sanitize_filename("..\\\\..\\\\Windows\\\\System32\\\\config"), "config")\n' +
      '__check__("plain", sanitize_filename("report.pdf"), "report.pdf")\n' +
      '__check__("nested", sanitize_filename("a/b/c/file.txt"), "file.txt")\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-14',
    title: 'Safe Config Parsing With Try/Except',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write parse_port(value, default=0) that tries to convert value to an int and returns it if it\'s a ' +
      'valid port number (0-65535 inclusive); otherwise, catch the error and return default. Config files ' +
      'and CLI args are full of untrusted input that a scanner or service must never crash on — exceptions ' +
      'are the mechanism for handling that gracefully instead of letting bad input take the whole program down.',
    starterCode:
      'def parse_port(value, default=0):\n' +
      '    # TODO: return int(value) if it is a valid port (0-65535), else default\n' +
      '    pass\n',
    hints: [
      'Wrap int(value) in a try/except ValueError to handle non-numeric input like "abc".',
      'After converting, still check the 0-65535 range — int("999999") succeeds but isn\'t a valid port.',
      'TypeError can also happen if value is something like None — catch that too, or catch the broader (ValueError, TypeError).',
    ],
    solution:
      'def parse_port(value, default=0):\n' +
      '    try:\n' +
      '        port = int(value)\n' +
      '    except (ValueError, TypeError):\n' +
      '        return default\n' +
      '    if 0 <= port <= 65535:\n' +
      '        return port\n' +
      '    return default\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("valid", parse_port("8080"), 8080)\n' +
      '__check__("invalid text", parse_port("not-a-port", 22), 22)\n' +
      '__check__("out of range", parse_port("99999", 80), 80)\n' +
      '__check__("none input", parse_port(None, 443), 443)\n' +
      '__check__("default zero", parse_port("nope"), 0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-15',
    title: 'Find UID-0 Accounts in a passwd-Style String',
    difficulty: 'Medium',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write find_root_accounts(passwd_text) where passwd_text is a multi-line string in /etc/passwd format ' +
      '("username:x:uid:gid:comment:home:shell" per line). Return a sorted list of every username whose UID ' +
      '(the 3rd colon-separated field) equals 0. On a real system only "root" should ever have UID 0 — ' +
      'finding a second UID-0 account is a classic sign of a backdoored user.',
    starterCode:
      'def find_root_accounts(passwd_text):\n' +
      '    # TODO: return a sorted list of usernames whose uid field (3rd column) is "0"\n' +
      '    pass\n',
    hints: [
      'Split the text into lines with .splitlines(), skipping any blank lines.',
      'Each line splits on ":" into fields; the username is field 0, the uid is field 2.',
      'Compare the uid field as a string ("0") or convert with int() — both work as long as you\'re consistent.',
    ],
    solution:
      'def find_root_accounts(passwd_text):\n' +
      '    roots = []\n' +
      '    for line in passwd_text.splitlines():\n' +
      '        if not line.strip():\n' +
      '            continue\n' +
      '        fields = line.split(":")\n' +
      '        if len(fields) > 2 and fields[2] == "0":\n' +
      '            roots.append(fields[0])\n' +
      '    return sorted(roots)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'passwd = (\n' +
      '    "root:x:0:0:root:/root:/bin/bash\\n"\n' +
      '    "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\\n"\n' +
      '    "backdoor:x:0:0::/home/backdoor:/bin/bash\\n"\n' +
      '    "alice:x:1001:1001::/home/alice:/bin/bash\\n"\n' +
      ')\n' +
      '__check__("finds both uid-0 accounts", find_root_accounts(passwd), ["backdoor", "root"])\n' +
      '__check__("normal passwd has only root", find_root_accounts("root:x:0:0:root:/root:/bin/bash\\nalice:x:1001:1001::/home/alice:/bin/bash"), ["root"])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-16',
    title: 'Compute Shannon Entropy of a String',
    difficulty: 'Medium',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write shannon_entropy(s) that returns the Shannon entropy of the string s, in bits, based on each ' +
      'character\'s frequency. Malware analysts use exactly this measurement to flag packed or encrypted ' +
      'sections of a binary (entropy close to 8 bits/byte) versus plain text or code (much lower entropy). ' +
      'Return 0.0 for an empty string.',
    starterCode:
      'def shannon_entropy(s):\n' +
      '    # TODO: return the Shannon entropy of s, in bits\n' +
      '    pass\n',
    hints: [
      'Count how many times each character appears first — a dict works well.',
      'For each character, its probability p is count / len(s); entropy is the sum of -p * log2(p) over every character.',
      'import math and use math.log2(p) — remember to negate the sum, since log2 of a probability under 1 is negative.',
    ],
    solution:
      'import math\n\n' +
      'def shannon_entropy(s):\n' +
      '    if not s:\n' +
      '        return 0.0\n' +
      '    freq = {}\n' +
      '    for ch in s:\n' +
      '        freq[ch] = freq.get(ch, 0) + 1\n' +
      '    length = len(s)\n' +
      '    entropy = 0.0\n' +
      '    for count in freq.values():\n' +
      '        p = count / length\n' +
      '        entropy -= p * math.log2(p)\n' +
      '    return entropy\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, round(actual, 4) == round(expected, 4), actual, expected))\n\n' +
      '__check__("empty string", shannon_entropy(""), 0.0)\n' +
      '__check__("all same character", shannon_entropy("aaaa"), 0.0)\n' +
      '__check__("4 unique chars, equal freq", shannon_entropy("abcd"), 2.0)\n' +
      '__check__("8 unique chars, equal freq", shannon_entropy("abcdefgh"), 3.0)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-17',
    title: 'Detect a Private (RFC 1918) IPv4 Address',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write is_private_ipv4(addr) that returns True if a syntactically valid dotted-decimal IPv4 address ' +
      'falls inside one of the three RFC 1918 private ranges: 10.0.0.0/8, 172.16.0.0/12 (172.16.x.x through ' +
      '172.31.x.x), or 192.168.0.0/16. Return False for any address outside all three ranges. You may assume ' +
      'the input is always a well-formed IPv4 address.',
    starterCode:
      'def is_private_ipv4(addr):\n' +
      '    # TODO: return True only if addr falls in an RFC 1918 private range\n' +
      '    pass\n',
    hints: [
      'Split on "." and convert each octet to int — you only need the first two octets to decide.',
      '10.x.x.x is private whenever the first octet is exactly 10.',
      '172.16.x.x through 172.31.x.x is private — check the second octet falls in the inclusive range 16 to 31.',
    ],
    solution:
      'def is_private_ipv4(addr):\n' +
      '    parts = [int(p) for p in addr.split(".")]\n' +
      '    a, b = parts[0], parts[1]\n' +
      '    if a == 10:\n' +
      '        return True\n' +
      '    if a == 172 and 16 <= b <= 31:\n' +
      '        return True\n' +
      '    if a == 192 and b == 168:\n' +
      '        return True\n' +
      '    return False\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("10.x is private", is_private_ipv4("10.1.2.3"), True)\n' +
      '__check__("172.20 is private", is_private_ipv4("172.20.5.5"), True)\n' +
      '__check__("172.32 is NOT private (just outside range)", is_private_ipv4("172.32.0.1"), False)\n' +
      '__check__("192.168 is private", is_private_ipv4("192.168.1.1"), True)\n' +
      '__check__("192.169 is NOT private", is_private_ipv4("192.169.1.1"), False)\n' +
      '__check__("public IP", is_private_ipv4("8.8.8.8"), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-18',
    title: 'Validate a MAC Address Format',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write is_valid_mac(addr) that returns True only if addr is a syntactically valid MAC address in ' +
      'colon-separated hex form: exactly 6 groups of exactly 2 hexadecimal digits each, separated by colons ' +
      '(e.g. "00:1A:2B:3C:4D:5E"). Hex digits may be upper or lower case. Any other separator, wrong group ' +
      'count, or non-hex character should return False.',
    starterCode:
      'import re\n\n' +
      'def is_valid_mac(addr):\n' +
      '    # TODO: return True only for a valid colon-separated MAC address\n' +
      '    pass\n',
    hints: [
      'A regular expression makes this a one-liner — re.fullmatch requires the ENTIRE string to match, not just part of it.',
      'Each group is [0-9A-Fa-f]{2}; you need exactly 6 of them separated by colons.',
      'Pattern: r"([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}" — five "group:" pairs, then one final group with no trailing colon.',
    ],
    solution:
      'import re\n\n' +
      'def is_valid_mac(addr):\n' +
      '    return bool(re.fullmatch(r"([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}", addr))\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("valid uppercase", is_valid_mac("00:1A:2B:3C:4D:5E"), True)\n' +
      '__check__("valid lowercase", is_valid_mac("aa:bb:cc:dd:ee:ff"), True)\n' +
      '__check__("too few groups", is_valid_mac("00:1A:2B"), False)\n' +
      '__check__("invalid hex digit", is_valid_mac("00:1A:2B:3C:4D:GG"), False)\n' +
      '__check__("wrong separator", is_valid_mac("00-1A-2B-3C-4D-5E"), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-19',
    title: 'Parse a User-Agent String Into Browser & OS',
    difficulty: 'Medium',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write parse_user_agent(ua) that returns a dict {"browser": ..., "os": ...} by checking for a small, ' +
      'fixed set of substrings. Browser, checked IN THIS ORDER (since a Chrome-based Edge UA also contains ' +
      '"Chrome", and every Chrome UA also contains "Safari" — order matters): "Edg" -> "Edge", "Chrome" -> ' +
      '"Chrome", "Firefox" -> "Firefox", "Safari" -> "Safari", else "Unknown". OS: "Windows" -> "Windows", ' +
      '"Mac OS X" -> "macOS", "iPhone" or "iPad" -> "iOS", "Android" -> "Android", "Linux" -> "Linux", else ' +
      '"Unknown".',
    starterCode:
      'def parse_user_agent(ua):\n' +
      '    # TODO: return {"browser": ..., "os": ...} based on substrings, checked in the documented order\n' +
      '    pass\n',
    hints: [
      'Check for "Edg" before "Chrome" — a Chromium-based Edge user agent contains BOTH substrings.',
      'Check for "iPhone"/"iPad" before "Mac OS X" and before "Linux" — a mobile Safari UA can contain "like Mac OS X", and Android UAs contain "Linux".',
      'A simple if/elif chain in exactly the documented priority order handles every case correctly.',
    ],
    solution:
      'def parse_user_agent(ua):\n' +
      '    if "Edg" in ua:\n' +
      '        browser = "Edge"\n' +
      '    elif "Chrome" in ua:\n' +
      '        browser = "Chrome"\n' +
      '    elif "Firefox" in ua:\n' +
      '        browser = "Firefox"\n' +
      '    elif "Safari" in ua:\n' +
      '        browser = "Safari"\n' +
      '    else:\n' +
      '        browser = "Unknown"\n\n' +
      '    if "iPhone" in ua or "iPad" in ua:\n' +
      '        os_name = "iOS"\n' +
      '    elif "Android" in ua:\n' +
      '        os_name = "Android"\n' +
      '    elif "Windows" in ua:\n' +
      '        os_name = "Windows"\n' +
      '    elif "Mac OS X" in ua:\n' +
      '        os_name = "macOS"\n' +
      '    elif "Linux" in ua:\n' +
      '        os_name = "Linux"\n' +
      '    else:\n' +
      '        os_name = "Unknown"\n\n' +
      '    return {"browser": browser, "os": os_name}\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'chrome_windows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"\n' +
      'firefox_linux = "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0"\n' +
      'safari_iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1"\n' +
      'edge_windows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0"\n\n' +
      '__check__("chrome on windows", parse_user_agent(chrome_windows), {"browser": "Chrome", "os": "Windows"})\n' +
      '__check__("firefox on linux", parse_user_agent(firefox_linux), {"browser": "Firefox", "os": "Linux"})\n' +
      '__check__("safari on iphone", parse_user_agent(safari_iphone), {"browser": "Safari", "os": "iOS"})\n' +
      '__check__("edge on windows (contains Chrome too)", parse_user_agent(edge_windows), {"browser": "Edge", "os": "Windows"})\n' +
      '__check__("unrecognized", parse_user_agent(""), {"browser": "Unknown", "os": "Unknown"})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-20',
    title: 'Flatten a Nested Configuration Dictionary',
    difficulty: 'Medium',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write flatten_config(d, parent_key="", sep=".") that flattens an arbitrarily nested dictionary into a ' +
      'single-level dict whose keys are dotted paths — e.g. {"a": {"b": 1, "c": {"d": 2}}} becomes ' +
      '{"a.b": 1, "a.c.d": 2}. This is exactly the transformation needed to turn a nested YAML/JSON config ' +
      'file into flat, env-var-style keys.',
    starterCode:
      'def flatten_config(d, parent_key="", sep="."):\n' +
      '    # TODO: return a flat dict with dotted-path keys\n' +
      '    pass\n',
    hints: [
      'Recursion is the natural fit: for each key/value pair, if the value is itself a dict, recurse into it with an updated parent_key.',
      'The new key at each level is parent_key + sep + key (or just key, if parent_key is empty).',
      'If the value is NOT a dict, it\'s a leaf — add it directly to the result under the fully-built key.',
    ],
    solution:
      'def flatten_config(d, parent_key="", sep="."):\n' +
      '    result = {}\n' +
      '    for key, value in d.items():\n' +
      '        new_key = f"{parent_key}{sep}{key}" if parent_key else key\n' +
      '        if isinstance(value, dict):\n' +
      '            result.update(flatten_config(value, new_key, sep))\n' +
      '        else:\n' +
      '            result[new_key] = value\n' +
      '    return result\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("two levels", flatten_config({"a": {"b": 1, "c": {"d": 2}}}), {"a.b": 1, "a.c.d": 2})\n' +
      '__check__("empty dict", flatten_config({}), {})\n' +
      '__check__("already flat", flatten_config({"x": 1, "y": 2}), {"x": 1, "y": 2})\n' +
      '__check__("three levels deep", flatten_config({"p": {"q": {"r": {"s": 5}}}}), {"p.q.r.s": 5})\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-fund-21',
    title: 'Chunk a List Into Fixed-Size Batches',
    difficulty: 'Easy',
    language: 'python',
    category: 'Fundamentals',
    prompt:
      'Write chunk_list(items, size) that splits items into a list of lists, each of length size except ' +
      'possibly the last one, which holds whatever remainder is left over. Raise ValueError if size is 0 or ' +
      'negative. Useful for batching API calls or scan targets into fixed-size groups instead of firing them ' +
      'all at once.',
    starterCode:
      'def chunk_list(items, size):\n' +
      '    # TODO: return items split into chunks of length `size` (last chunk may be shorter)\n' +
      '    pass\n',
    hints: [
      'Validate size first — raise ValueError("size must be positive") if size <= 0.',
      'A list comprehension stepping through range(0, len(items), size) gives you the start index of each chunk.',
      'items[i:i+size] naturally returns a shorter final slice if there aren\'t size items left — no special-casing needed.',
    ],
    solution:
      'def chunk_list(items, size):\n' +
      '    if size <= 0:\n' +
      '        raise ValueError("size must be positive")\n' +
      '    return [items[i:i + size] for i in range(0, len(items), size)]\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      '__check__("even split", chunk_list([1, 2, 3, 4], 2), [[1, 2], [3, 4]])\n' +
      '__check__("remainder in last chunk", chunk_list([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])\n' +
      '__check__("empty list", chunk_list([], 3), [])\n' +
      '__check__("chunk size larger than list", chunk_list([1, 2, 3], 5), [[1, 2, 3]])\n\n' +
      'try:\n' +
      '    chunk_list([1, 2], 0)\n' +
      '    __results__.append(("raises on size=0", False, "no exception", "ValueError"))\n' +
      'except ValueError:\n' +
      '    __results__.append(("raises on size=0", True, "ValueError", "ValueError"))\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
