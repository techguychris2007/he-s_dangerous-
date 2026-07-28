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
];
