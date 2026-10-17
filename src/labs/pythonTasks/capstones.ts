import type { CodeTask } from '../codeTypes';

/** Capstone-tier Python tasks: full, self-contained tools built from several cooperating functions
 *  or classes rather than a single method — closer to something you'd actually keep in a SOC toolkit
 *  or a backend service than a one-concept exercise. Still single-file, like every Code Portal task,
 *  but deliberately larger in scope and test surface than the Fundamentals/OOP/Advanced catalogs. */
export const PYTHON_CAPSTONE_TASKS: CodeTask[] = [
  {
    id: 'py-capstone-01',
    title: 'Capstone: Brute-Force Login Detector',
    difficulty: 'Hard',
    language: 'python',
    category: 'Capstone',
    prompt:
      'Build a small SOC tool that reads raw auth-log lines and flags IP addresses carrying out a brute-force ' +
      'login attack. Each log line looks like "2026-08-01 09:14:00 | 203.0.113.44 | admin | FAILURE" — ' +
      'timestamp, source IP, username, and SUCCESS/FAILURE, separated by " | ".\n\n' +
      'Write two functions:\n\n' +
      '1. parse_log_line(line) -> a dict with keys "timestamp" (a datetime.datetime, parsed with format ' +
      '"%Y-%m-%d %H:%M:%S"), "ip", "username", "status".\n\n' +
      '2. detect_brute_force(log_lines, window_seconds=60, threshold=5) -> a sorted list of the distinct ' +
      'IPs that had at least `threshold` FAILURE events falling within some window of `window_seconds` ' +
      'seconds. The window is a SLIDING window, not a fixed bucket — 5 failures at 0s, 10s, 20s, 30s, 40s ' +
      'all fall within a single 60-second span and must be flagged, but the same 5 failures spread out one ' +
      'every 10 minutes must NOT be flagged, even though the log covers less than an hour total.\n\n' +
      'This sliding-window approach — not just "count failures in the whole log" — is exactly how real ' +
      'brute-force detection rules in a SIEM work: a burst of failures close together is the actual signal; ' +
      'the same total spread thin over hours usually is not.',
    starterCode:
      'from datetime import datetime\n\n' +
      'def parse_log_line(line):\n' +
      '    # TODO: split line on " | ", parse the timestamp with strptime, return a dict with keys\n' +
      '    # "timestamp" (datetime), "ip", "username", "status"\n' +
      '    pass\n\n' +
      'def detect_brute_force(log_lines, window_seconds=60, threshold=5):\n' +
      '    # TODO: parse every line, group FAILURE timestamps by ip, and flag any ip where some window of\n' +
      '    # `window_seconds` contains at least `threshold` failures. Return a sorted list of flagged ips.\n' +
      '    pass\n',
    hints: [
      'parse_log_line: line.split(" | ") gives you the 4 fields directly, in order, already whitespace-trimmed as long as your log lines use exactly " | " as the separator.',
      'datetime.strptime(text, "%Y-%m-%d %H:%M:%S") parses the timestamp field into a real datetime you can subtract.',
      'For detect_brute_force: first build a dict of ip -> sorted list of FAILURE timestamps only (ignore SUCCESS entirely for this check).',
      'The sliding window is a classic two-pointer approach: for each ip\'s sorted failure timestamps, keep a `left` index; for each `right`, while (timestamps[right] - timestamps[left]).total_seconds() > window_seconds, advance left. If right - left + 1 >= threshold at any point, that ip is flagged.',
      'Return sorted(set_of_flagged_ips) — sorted() on a list of IP strings sorts lexicographically, which is fine here since the tests don\'t depend on numeric IP ordering.',
    ],
    solution:
      'from datetime import datetime\n\n' +
      'def parse_log_line(line):\n' +
      '    parts = [p.strip() for p in line.split("|")]\n' +
      '    ts = datetime.strptime(parts[0], "%Y-%m-%d %H:%M:%S")\n' +
      '    return {"timestamp": ts, "ip": parts[1], "username": parts[2], "status": parts[3]}\n\n' +
      'def detect_brute_force(log_lines, window_seconds=60, threshold=5):\n' +
      '    events = [parse_log_line(line) for line in log_lines]\n' +
      '    by_ip = {}\n' +
      '    for e in events:\n' +
      '        by_ip.setdefault(e["ip"], []).append(e)\n\n' +
      '    flagged = []\n' +
      '    for ip, ip_events in by_ip.items():\n' +
      '        failures = sorted(e["timestamp"] for e in ip_events if e["status"] == "FAILURE")\n' +
      '        left = 0\n' +
      '        for right in range(len(failures)):\n' +
      '            while (failures[right] - failures[left]).total_seconds() > window_seconds:\n' +
      '                left += 1\n' +
      '            if right - left + 1 >= threshold:\n' +
      '                flagged.append(ip)\n' +
      '                break\n' +
      '    return sorted(flagged)\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'line = parse_log_line("2026-08-01 09:14:00 | 203.0.113.44 | admin | FAILURE")\n' +
      '__check__("parse: ip", line["ip"], "203.0.113.44")\n' +
      '__check__("parse: username", line["username"], "admin")\n' +
      '__check__("parse: status", line["status"], "FAILURE")\n' +
      '__check__("parse: timestamp year", line["timestamp"].year, 2026)\n' +
      '__check__("parse: timestamp second", line["timestamp"].second, 0)\n\n' +
      'normal = [\n' +
      '    "2026-08-01 09:00:00 | 10.0.0.5 | jsmith | SUCCESS",\n' +
      '    "2026-08-01 09:05:00 | 10.0.0.5 | jsmith | FAILURE",\n' +
      '    "2026-08-01 09:06:00 | 10.0.0.5 | jsmith | SUCCESS",\n' +
      ']\n' +
      '__check__("no brute force on normal traffic", detect_brute_force(normal), [])\n\n' +
      'burst = [\n' +
      '    "2026-08-01 09:14:00 | 203.0.113.44 | admin | FAILURE",\n' +
      '    "2026-08-01 09:14:10 | 203.0.113.44 | admin | FAILURE",\n' +
      '    "2026-08-01 09:14:20 | 203.0.113.44 | admin | FAILURE",\n' +
      '    "2026-08-01 09:14:30 | 203.0.113.44 | admin | FAILURE",\n' +
      '    "2026-08-01 09:14:40 | 203.0.113.44 | admin | FAILURE",\n' +
      ']\n' +
      '__check__("flags a tight burst of 5 failures", detect_brute_force(burst), ["203.0.113.44"])\n\n' +
      'spread = [\n' +
      '    "2026-08-01 09:00:00 | 198.51.100.9 | root | FAILURE",\n' +
      '    "2026-08-01 09:10:00 | 198.51.100.9 | root | FAILURE",\n' +
      '    "2026-08-01 09:20:00 | 198.51.100.9 | root | FAILURE",\n' +
      '    "2026-08-01 09:30:00 | 198.51.100.9 | root | FAILURE",\n' +
      '    "2026-08-01 09:40:00 | 198.51.100.9 | root | FAILURE",\n' +
      ']\n' +
      '__check__("does not flag the same count spread thin", detect_brute_force(spread, window_seconds=60, threshold=5), [])\n\n' +
      'mixed = burst + [\n' +
      '    "2026-08-01 09:00:00 | 8.8.8.8 | user1 | SUCCESS",\n' +
      '    "2026-08-01 09:01:00 | 8.8.8.8 | user1 | SUCCESS",\n' +
      ']\n' +
      '__check__("ignores an unrelated well-behaved ip", detect_brute_force(mixed), ["203.0.113.44"])\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
  {
    id: 'py-capstone-02',
    title: 'Capstone: Token Bucket Rate Limiter',
    difficulty: 'Hard',
    language: 'python',
    category: 'Capstone',
    prompt:
      'Implement the token bucket algorithm — the same rate-limiting approach used by real API gateways ' +
      '(AWS API Gateway, nginx\'s limit_req, and most login-throttling systems) — as a reusable RateLimiter ' +
      'that tracks a separate bucket per client.\n\n' +
      'Write a class RateLimiter with __init__(self, capacity, refill_rate) where capacity is the maximum ' +
      'number of tokens a bucket can hold and refill_rate is tokens added per second. Add ' +
      'allow_request(self, client_id, now, cost=1): the FIRST time a client_id is seen, create a fresh ' +
      'bucket for it starting completely full (capacity tokens) as of that `now`. On every call, first ' +
      'refill that client\'s bucket based on elapsed time since its last refill (capped at `capacity` — a ' +
      'bucket can never hold more than capacity tokens no matter how long it sits idle), then, if it has at ' +
      'least `cost` tokens, subtract `cost` and return True; otherwise return False and leave the bucket ' +
      'unchanged.\n\n' +
      'Note `now` is passed in explicitly as a parameter (a plain number of seconds) rather than read from ' +
      'the system clock — this is deliberate, and it\'s also how you\'d actually want it in production: a ' +
      'rate limiter that takes time as an argument is trivially unit-testable and safe to reason about, ' +
      'versus one secretly reading time.time() that you can\'t control in a test at all.',
    starterCode:
      'class RateLimiter:\n' +
      '    def __init__(self, capacity, refill_rate):\n' +
      '        # TODO: store capacity and refill_rate; set up empty per-client bucket storage\n' +
      '        pass\n\n' +
      '    def allow_request(self, client_id, now, cost=1):\n' +
      '        # TODO: create a fresh, full bucket for a never-before-seen client_id\n' +
      '        # then refill based on elapsed time (capped at capacity), then spend `cost` tokens if available\n' +
      '        pass\n',
    hints: [
      'Store buckets as a dict: self.buckets[client_id] = {"tokens": self.capacity, "last_refill": now} the first time you see a client_id.',
      'Refill math: elapsed = now - bucket["last_refill"]; bucket["tokens"] = min(self.capacity, bucket["tokens"] + elapsed * self.refill_rate); bucket["last_refill"] = now — do this every call, even ones that end up returning False.',
      'After refilling, check bucket["tokens"] >= cost: if so, subtract cost and return True; otherwise return False without changing the token count.',
      'A brand new client_id\'s bucket should start already full (capacity tokens) as of `now` — don\'t start it at 0 and make the client wait for its first tokens.',
    ],
    solution:
      'class RateLimiter:\n' +
      '    def __init__(self, capacity, refill_rate):\n' +
      '        self.capacity = capacity\n' +
      '        self.refill_rate = refill_rate\n' +
      '        self.buckets = {}\n\n' +
      '    def allow_request(self, client_id, now, cost=1):\n' +
      '        if client_id not in self.buckets:\n' +
      '            self.buckets[client_id] = {"tokens": self.capacity, "last_refill": now}\n\n' +
      '        bucket = self.buckets[client_id]\n' +
      '        elapsed = now - bucket["last_refill"]\n' +
      '        if elapsed > 0:\n' +
      '            bucket["tokens"] = min(self.capacity, bucket["tokens"] + elapsed * self.refill_rate)\n' +
      '            bucket["last_refill"] = now\n\n' +
      '        if bucket["tokens"] >= cost:\n' +
      '            bucket["tokens"] -= cost\n' +
      '            return True\n' +
      '        return False\n',
    testCode:
      '__results__ = []\n' +
      'def __check__(name, actual, expected):\n' +
      '    __results__.append((name, actual == expected, actual, expected))\n\n' +
      'rl = RateLimiter(capacity=3, refill_rate=1)\n' +
      '__check__("1st request allowed", rl.allow_request("1.2.3.4", now=0), True)\n' +
      '__check__("2nd request allowed", rl.allow_request("1.2.3.4", now=0), True)\n' +
      '__check__("3rd request allowed", rl.allow_request("1.2.3.4", now=0), True)\n' +
      '__check__("4th request denied (bucket empty)", rl.allow_request("1.2.3.4", now=0), False)\n' +
      '__check__("allowed again after 2s refill", rl.allow_request("1.2.3.4", now=2), True)\n' +
      '__check__("different client gets its own fresh bucket", rl.allow_request("5.6.7.8", now=100), True)\n\n' +
      'rl2 = RateLimiter(capacity=5, refill_rate=2)\n' +
      'for _ in range(5):\n' +
      '    rl2.allow_request("a", now=0)\n' +
      '__check__("bucket exhausted after capacity requests", rl2.allow_request("a", now=0), False)\n' +
      '__check__("refill caps at capacity, not unlimited", rl2.allow_request("a", now=10), True)\n\n' +
      'rl3 = RateLimiter(capacity=10, refill_rate=1)\n' +
      '__check__("cost > 1 spends multiple tokens at once", rl3.allow_request("x", now=0, cost=4), True)\n' +
      '__check__("second cost=4 request still fits (10-4=6 left, needs 4)", rl3.allow_request("x", now=0, cost=4), True)\n' +
      '__check__("third cost=4 request denied (6-4=2 left, needs 4)", rl3.allow_request("x", now=0, cost=4), False)\n\n' +
      'for name, ok, actual, expected in __results__:\n' +
      '    print(f"[{\'PASS\' if ok else \'FAIL\'}] {name}: got {actual!r}, expected {expected!r}")\n' +
      'print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")\n',
  },
];
