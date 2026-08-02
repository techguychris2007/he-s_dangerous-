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
];
