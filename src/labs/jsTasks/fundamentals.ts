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
];
