import type { CodeTask } from '../codeTypes';

export const JS_FUNDAMENTALS_TASKS: CodeTask[] = [
  {
    id: 'js-fund-01',
    title: 'Total Bytes Transferred',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function totalBytes(sizes) that returns the sum of the numbers in the array sizes — ' +
      'the total bytes moved across a set of logged packets or file transfers. This kind of running ' +
      'total is the base of almost every bandwidth or data-exfiltration monitor.',
    starterCode:
      'function totalBytes(sizes) {\n' +
      '  // TODO: return the sum of all numbers in sizes\n' +
      '}\n',
    hints: [
      'sizes.reduce((total, n) => total + n, 0) sums every element starting from 0.',
      'A plain for...of loop with a running total works just as well if you prefer it.',
      'An empty array should return 0 — reduce with an initial value of 0 already handles that.',
    ],
    solution:
      'function totalBytes(sizes) {\n' +
      '  return sizes.reduce((total, n) => total + n, 0);\n' +
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
      'check("basic", totalBytes([120, 340, 560, 80]), 1100);\n' +
      'check("empty", totalBytes([]), 0);\n' +
      'check("larger set", totalBytes([1000, 2000, 3000, 4000, 5000]), 15000);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-02',
    title: 'Reverse a Token',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function reverseString(s) that returns a new string with the characters of s in ' +
      'reverse order. Some log shippers use a reversed token as a cheap, fast obfuscation step ' +
      'before writing it to disk; this is the primitive that makes it work.',
    starterCode:
      'function reverseString(s) {\n' +
      '  // TODO: return s reversed\n' +
      '}\n',
    hints: [
      'Strings are immutable in JS — you can\'t reverse in place, you have to build a new one.',
      's.split("") turns the string into an array of characters, which arrays have a .reverse() method for.',
      'Chain it together: s.split("").reverse().join("") turns the reversed array back into a string.',
    ],
    solution:
      'function reverseString(s) {\n' +
      '  return s.split("").reverse().join("");\n' +
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
      'check("basic", reverseString("hello"), "olleh");\n' +
      'check("single char", reverseString("a"), "a");\n' +
      'check("empty", reverseString(""), "");\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-03',
    title: 'Count Failed Login Attempts',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function countFailures(attempts) that takes an array of objects like ' +
      '{ user: "bob", status: "fail" } and returns how many have status === "fail". This is the ' +
      'single-line building block behind every brute-force/lockout detector: count failures per ' +
      'window, alert past a threshold.',
    starterCode:
      'function countFailures(attempts) {\n' +
      '  // TODO: return how many entries in attempts have status === "fail"\n' +
      '}\n',
    hints: [
      'array.filter(predicate) keeps only the elements the predicate returns true for.',
      'The predicate you need is: attempt => attempt.status === "fail".',
      'filter returns an array — .length on that array is the count you want.',
    ],
    solution:
      'function countFailures(attempts) {\n' +
      '  return attempts.filter((a) => a.status === "fail").length;\n' +
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
      'check("mixed", countFailures([{status:"ok"},{status:"fail"},{status:"fail"},{status:"ok"}]), 2);\n' +
      'check("none failed", countFailures([{status:"ok"},{status:"ok"}]), 0);\n' +
      'check("empty", countFailures([]), 0);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-04',
    title: 'Deduplicate a List of IP Addresses',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function uniqueIps(ips) that returns a new array containing each IP address from ips ' +
      'exactly once, in the order it first appeared. Log files routinely repeat the same source IP ' +
      'across many lines — deduplicating is the first step before you can meaningfully count or rank ' +
      '"distinct attacking hosts."',
    starterCode:
      'function uniqueIps(ips) {\n' +
      '  // TODO: return a new array with duplicates removed, first-seen order preserved\n' +
      '}\n',
    hints: [
      'A Set can only ever hold each value once — building one from your array removes duplicates automatically.',
      'new Set(ips) builds the set; the spread operator turns any iterable (including a Set) back into an array.',
      'Put it together: [...new Set(ips)] — one line, and Sets preserve insertion order so "first seen" order is kept.',
    ],
    solution:
      'function uniqueIps(ips) {\n' +
      '  return [...new Set(ips)];\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = JSON.stringify(actual) === JSON.stringify(expected);\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n' +
      'check("basic dedupe", uniqueIps(["1.1.1.1","2.2.2.2","1.1.1.1","3.3.3.3","2.2.2.2"]), ["1.1.1.1","2.2.2.2","3.3.3.3"]);\n' +
      'check("no duplicates", uniqueIps(["10.0.0.1","10.0.0.2"]), ["10.0.0.1","10.0.0.2"]);\n' +
      'check("empty", uniqueIps([]), []);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-05',
    title: 'Group Log Entries by Severity',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function groupBySeverity(logs) that takes an array of { severity, message } objects and ' +
      'returns an object mapping each severity level to an array of its messages, e.g. ' +
      '{ critical: [...], warning: [...] }. This exact shape — bucket a flat event stream by a field — ' +
      'is the first transform behind almost every SOC dashboard\'s "alerts by severity" view.',
    starterCode:
      'function groupBySeverity(logs) {\n' +
      '  // TODO: return an object mapping each distinct severity to an array of its messages\n' +
      '}\n',
    hints: [
      'array.reduce(fn, initialValue) builds up a single result (here, an object) across every element.',
      'For each log, you need to either start a new array under acc[log.severity] or push onto the existing one.',
      'acc[log.severity] ??= []; acc[log.severity].push(log.message); return acc; — inside a reduce with {} as the initial value.',
    ],
    solution:
      'function groupBySeverity(logs) {\n' +
      '  return logs.reduce((acc, log) => {\n' +
      '    acc[log.severity] ??= [];\n' +
      '    acc[log.severity].push(log.message);\n' +
      '    return acc;\n' +
      '  }, {});\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = JSON.stringify(actual) === JSON.stringify(expected);\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n' +
      'check("basic", groupBySeverity([\n' +
      '  {severity:"critical",message:"breach"},\n' +
      '  {severity:"warning",message:"slow"},\n' +
      '  {severity:"critical",message:"leak"}\n' +
      ']), {critical:["breach","leak"],warning:["slow"]});\n' +
      'check("empty", groupBySeverity([]), {});\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-06',
    title: 'Find the Most Frequent Source IP',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function mostFrequent(items) that returns whichever value appears most often in the ' +
      'array items (ties broken by whichever hit the count first). Finding "the noisiest single ' +
      'source" this way is a real, common first pass over a raw connection log before deeper analysis.',
    starterCode:
      'function mostFrequent(items) {\n' +
      '  // TODO: return the value that appears most often in items\n' +
      '}\n',
    hints: [
      'Keep a running count per value (an object works as a simple counter) as you loop through items.',
      'Track the best value and its count as you go, updating whenever you find a strictly higher count.',
      'for (const item of items) { counts[item] = (counts[item] || 0) + 1; if (counts[item] > bestCount) { best = item; bestCount = counts[item]; } }',
    ],
    solution:
      'function mostFrequent(items) {\n' +
      '  const counts = {};\n' +
      '  let best = items[0];\n' +
      '  let bestCount = 0;\n' +
      '  for (const item of items) {\n' +
      '    counts[item] = (counts[item] || 0) + 1;\n' +
      '    if (counts[item] > bestCount) {\n' +
      '      best = item;\n' +
      '      bestCount = counts[item];\n' +
      '    }\n' +
      '  }\n' +
      '  return best;\n' +
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
      'check("basic", mostFrequent(["1.1.1.1","2.2.2.2","1.1.1.1","1.1.1.1","2.2.2.2"]), "1.1.1.1");\n' +
      'check("single element", mostFrequent(["9.9.9.9"]), "9.9.9.9");\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-07',
    title: 'Deep Clone a Plain Object',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function deepClone(obj) that returns a full deep copy of a plain object or array (nested ' +
      'objects/arrays included) — mutating the clone must never affect the original. You may assume obj only ' +
      'ever contains plain objects, arrays, strings, numbers, booleans, and null (no functions, no Date/Map/ ' +
      'Set, no cyclic references).',
    starterCode:
      'function deepClone(obj) {\n' +
      '  // TODO: return a deep copy of obj (nested objects/arrays included)\n' +
      '}\n',
    hints: [
      'Primitives (string/number/boolean/null/undefined) are already copied by value — just return them as-is.',
      'If obj is an array, map over it and recursively deepClone each element, returning a new array.',
      'If obj is a plain object, build a new object and recursively deepClone each of its values — Object.keys(obj) gives you the keys to iterate.',
    ],
    solution:
      'function deepClone(obj) {\n' +
      '  if (obj === null || typeof obj !== "object") return obj;\n' +
      '  if (Array.isArray(obj)) return obj.map((item) => deepClone(item));\n' +
      '  const result = {};\n' +
      '  for (const key of Object.keys(obj)) {\n' +
      '    result[key] = deepClone(obj[key]);\n' +
      '  }\n' +
      '  return result;\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = JSON.stringify(actual) === JSON.stringify(expected);\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n' +
      'const original = { a: 1, b: { c: 2, d: [3, 4, { e: 5 }] } };\n' +
      'const clone = deepClone(original);\n' +
      'check("clone matches original", clone, original);\n' +
      'clone.b.d[2].e = 999;\n' +
      'check("mutating clone leaves original untouched", original.b.d[2].e, 5);\n' +
      'check("clone reflects its own mutation", clone.b.d[2].e, 999);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-08',
    title: 'Flatten a Nested Array',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function flattenArray(arr) that returns a new, single-level array containing every non-array ' +
      'element from arr, no matter how deeply nested the original arrays were — e.g. [1, [2, [3, [4]], 5]] ' +
      'becomes [1, 2, 3, 4, 5].',
    starterCode:
      'function flattenArray(arr) {\n' +
      '  // TODO: return arr fully flattened, regardless of nesting depth\n' +
      '  return [];\n' +
      '}\n',
    hints: [
      'For each element: if it\'s an array, recursively flatten it and spread the result in; otherwise push it directly.',
      'reduce works nicely here: arr.reduce((flat, item) => flat.concat(Array.isArray(item) ? flattenArray(item) : item), [])',
      'Array.isArray(item) is the check that distinguishes "recurse into this" from "this is a real element."',
    ],
    solution:
      'function flattenArray(arr) {\n' +
      '  return arr.reduce((flat, item) => flat.concat(Array.isArray(item) ? flattenArray(item) : item), []);\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = JSON.stringify(actual) === JSON.stringify(expected);\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n' +
      'check("deeply nested", flattenArray([1, [2, [3, [4]], 5]]), [1, 2, 3, 4, 5]);\n' +
      'check("already flat", flattenArray([1, 2, 3]), [1, 2, 3]);\n' +
      'check("empty array", flattenArray([]), []);\n' +
      'check("nested empty arrays", flattenArray([1, [], [2, []]]), [1, 2]);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-09',
    title: 'Parse a Query String Into an Object',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function parseQueryString(qs) that parses a URL query string (without the leading "?") into a ' +
      'plain object, e.g. "user=alice&role=admin" becomes {user: "alice", role: "admin"}. Both keys and ' +
      'values should be URL-decoded with decodeURIComponent. An empty string should return {}.',
    starterCode:
      'function parseQueryString(qs) {\n' +
      '  // TODO: parse qs into a plain object, URL-decoding keys and values\n' +
      '  return {};\n' +
      '}\n',
    hints: [
      'An empty string should short-circuit to {} immediately — splitting "" on "&" gives [""], not [].',
      'qs.split("&") gives you each "key=value" pair; split each pair on the FIRST "=" only (a value could itself contain "=").',
      'indexOf("=") plus slice() lets you split on just the first occurrence: const eq = pair.indexOf("="); const key = pair.slice(0, eq); const value = pair.slice(eq + 1);',
    ],
    solution:
      'function parseQueryString(qs) {\n' +
      '  if (!qs) return {};\n' +
      '  const result = {};\n' +
      '  for (const pair of qs.split("&")) {\n' +
      '    const eq = pair.indexOf("=");\n' +
      '    const rawKey = eq === -1 ? pair : pair.slice(0, eq);\n' +
      '    const rawValue = eq === -1 ? "" : pair.slice(eq + 1);\n' +
      '    result[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);\n' +
      '  }\n' +
      '  return result;\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = JSON.stringify(actual) === JSON.stringify(expected);\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n' +
      'check("basic", parseQueryString("user=alice&role=admin"), { user: "alice", role: "admin" });\n' +
      'check("url-encoded value", parseQueryString("q=hello%20world"), { q: "hello world" });\n' +
      'check("empty string", parseQueryString(""), {});\n' +
      'check("single pair", parseQueryString("id=42"), { id: "42" });\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-10',
    title: 'Group Array of Objects by a Key',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function groupBy(items, key) that groups an array of plain objects into an object of arrays, ' +
      'keyed by each item\'s value at property key — e.g. grouping log entries by their "severity" field into ' +
      '{low: [...], high: [...]}.',
    starterCode:
      'function groupBy(items, key) {\n' +
      '  // TODO: return an object grouping items by their [key] property\n' +
      '  return {};\n' +
      '}\n',
    hints: [
      'reduce is a natural fit: for each item, look up groupValue = item[key], then push item into groups[groupValue].',
      'If groups[groupValue] doesn\'t exist yet, initialize it to an empty array before pushing.',
      'groups[groupValue] = groups[groupValue] || []; then groups[groupValue].push(item); handles both the "first time seeing this group" and "already exists" cases in two lines.',
    ],
    solution:
      'function groupBy(items, key) {\n' +
      '  const groups = {};\n' +
      '  for (const item of items) {\n' +
      '    const groupValue = item[key];\n' +
      '    groups[groupValue] = groups[groupValue] || [];\n' +
      '    groups[groupValue].push(item);\n' +
      '  }\n' +
      '  return groups;\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = JSON.stringify(actual) === JSON.stringify(expected);\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n' +
      'const alerts = [\n' +
      '  { id: 1, severity: "high" },\n' +
      '  { id: 2, severity: "low" },\n' +
      '  { id: 3, severity: "high" },\n' +
      '];\n' +
      'check("groups by severity", groupBy(alerts, "severity"), {\n' +
      '  high: [{ id: 1, severity: "high" }, { id: 3, severity: "high" }],\n' +
      '  low: [{ id: 2, severity: "low" }],\n' +
      '});\n' +
      'check("empty array", groupBy([], "severity"), {});\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-11',
    title: 'Memoize a Pure Function',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function memoize(fn) that returns a new function wrapping fn: the first time it\'s called with a ' +
      'given set of arguments, it calls fn and caches the result; every subsequent call with the SAME ' +
      'arguments returns the cached result without calling fn again. Assume fn\'s arguments are always ' +
      'JSON-serializable (numbers/strings/booleans/plain objects/arrays), so JSON.stringify is a safe way to ' +
      'build a cache key from them.',
    starterCode:
      'function memoize(fn) {\n' +
      '  // TODO: return a memoized wrapper around fn\n' +
      '  return fn;\n' +
      '}\n',
    hints: [
      'Keep a cache object (or Map) in a closure, created once when memoize(fn) is called — not inside the returned wrapper.',
      'Build a cache key from the arguments with JSON.stringify(args) (using the rest-args array, so multi-argument calls are distinguished from each other too).',
      'On a cache hit, return the stored value without calling fn; on a miss, call fn(...args), store the result under that key, and return it.',
    ],
    solution:
      'function memoize(fn) {\n' +
      '  const cache = {};\n' +
      '  return function (...args) {\n' +
      '    const key = JSON.stringify(args);\n' +
      '    if (key in cache) return cache[key];\n' +
      '    const result = fn(...args);\n' +
      '    cache[key] = result;\n' +
      '    return result;\n' +
      '  };\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = JSON.stringify(actual) === JSON.stringify(expected);\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n' +
      'let calls = 0;\n' +
      'function slowSquare(n) {\n' +
      '  calls++;\n' +
      '  return n * n;\n' +
      '}\n' +
      'const memoSquare = memoize(slowSquare);\n' +
      'check("first call computes correctly", memoSquare(5), 25);\n' +
      'check("second call with same arg returns same result", memoSquare(5), 25);\n' +
      'check("underlying function called only once for repeated arg", calls, 1);\n' +
      'check("different arg still computes", memoSquare(6), 36);\n' +
      'check("underlying function called twice total now", calls, 2);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-fund-12',
    title: 'Deep-Equal Comparison of Two Values',
    difficulty: 'Hard',
    language: 'javascript',
    category: 'Fundamentals',
    prompt:
      'Write function deepEqual(a, b) that returns true if a and b are structurally equal — same primitive ' +
      'value, or (for objects/arrays) the same keys/elements each recursively deep-equal, regardless of ' +
      'whether they are the same object reference. You may assume both only ever contain plain objects, ' +
      'arrays, strings, numbers, booleans, and null.',
    starterCode:
      'function deepEqual(a, b) {\n' +
      '  // TODO: return true if a and b are structurally equal\n' +
      '  return false;\n' +
      '}\n',
    hints: [
      'Start with the easy case: if a === b, they\'re trivially equal (covers identical primitives and identical references).',
      'If either is not a non-null object at that point, they can\'t be equal (one\'s a primitive/null and the other differs, since === already failed).',
      'For two objects: compare Object.keys(a).length to Object.keys(b).length first, then recursively deepEqual every value in a against the same key in b — if any key is missing from b or any pair isn\'t deepEqual, return false.',
    ],
    solution:
      'function deepEqual(a, b) {\n' +
      '  if (a === b) return true;\n' +
      '  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;\n' +
      '  const aKeys = Object.keys(a);\n' +
      '  const bKeys = Object.keys(b);\n' +
      '  if (aKeys.length !== bKeys.length) return false;\n' +
      '  for (const key of aKeys) {\n' +
      '    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;\n' +
      '    if (!deepEqual(a[key], b[key])) return false;\n' +
      '  }\n' +
      '  return true;\n' +
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
      'check("equal primitives", deepEqual(5, 5), true);\n' +
      'check("different primitives", deepEqual(5, 6), false);\n' +
      'check("equal nested objects", deepEqual({ a: 1, b: { c: [1, 2, 3] } }, { a: 1, b: { c: [1, 2, 3] } }), true);\n' +
      'check("different nested value", deepEqual({ a: 1, b: { c: [1, 2, 3] } }, { a: 1, b: { c: [1, 2, 9] } }), false);\n' +
      'check("different key count", deepEqual({ a: 1, b: 2 }, { a: 1 }), false);\n' +
      'check("arrays with same elements", deepEqual([1, 2, 3], [1, 2, 3]), true);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
];
