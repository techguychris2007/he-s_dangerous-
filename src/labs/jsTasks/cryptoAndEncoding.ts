import type { CodeTask } from '../codeTypes';

export const JS_CRYPTO_TASKS: CodeTask[] = [
  {
    id: 'js-crypto-01',
    title: 'Caesar Cipher Encode',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Cryptography & Encoding',
    prompt:
      'Write function caesarEncode(text, shift) that returns a new string with every letter shifted ' +
      'by shift positions through the alphabet, wrapping from z back to a (and Z back to A), leaving ' +
      'digits/punctuation/spaces untouched. It is one of the oldest ciphers there is — and still the ' +
      'first thing worth understanding before anything modern, since every substitution cipher is a ' +
      'variation on this same idea.',
    starterCode:
      'function caesarEncode(text, shift) {\n' +
      '  // TODO: return text with each letter shifted by `shift` positions, wrapping a-z and A-Z;\n' +
      '  // leave non-letters untouched\n' +
      '}\n',
    hints: [
      'Build the result character by character — text.split("").map(c => ...).join("") is a clean way to do it.',
      'Only touch characters in the ranges a-z and A-Z; check with c >= "a" && c <= "z" (and the same for A-Z).',
      'Wrap with modulo on the char code: charCode("a") + (charCode(c) - charCode("a") + shift) % 26, then String.fromCharCode(...) it back.',
    ],
    solution:
      'function caesarEncode(text, shift) {\n' +
      '  return text\n' +
      '    .split("")\n' +
      '    .map((c) => {\n' +
      '      if (c >= "a" && c <= "z") {\n' +
      '        return String.fromCharCode(97 + ((c.charCodeAt(0) - 97 + shift) % 26));\n' +
      '      }\n' +
      '      if (c >= "A" && c <= "Z") {\n' +
      '        return String.fromCharCode(65 + ((c.charCodeAt(0) - 65 + shift) % 26));\n' +
      '      }\n' +
      '      return c;\n' +
      '    })\n' +
      '    .join("");\n' +
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
      'check("basic shift 3", caesarEncode("Attack At Dawn", 3), "Dwwdfn Dw Gdzq");\n' +
      'check("wraparound", caesarEncode("xyz", 3), "abc");\n' +
      'check("non-letters unchanged", caesarEncode("Test-123!", 3), "Whvw-123!");\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-crypto-02',
    title: 'Base64-Encode a Credential Pair',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Cryptography & Encoding',
    prompt:
      'Write function encodeCredential(username, password) that returns the base64 encoding of ' +
      '"username:password" — exactly what an HTTP Basic Auth header carries after "Authorization: ' +
      'Basic ". Recognizing that Basic Auth is base64 (an encoding, not encryption — trivially ' +
      'reversible) is exactly why it\'s considered unsafe over plain HTTP.',
    starterCode:
      'function encodeCredential(username, password) {\n' +
      '  // TODO: return base64("username:password")\n' +
      '}\n',
    hints: [
      'Basic Auth\'s payload is always the literal string "username:password" before encoding — build that string first.',
      'The browser/Worker global btoa(str) base64-encodes a plain string directly — no library needed.',
      'Put it together: btoa(`${username}:${password}`)',
    ],
    solution:
      'function encodeCredential(username, password) {\n' +
      '  return btoa(`${username}:${password}`);\n' +
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
      'check("basic", encodeCredential("admin", "secret123"), btoa("admin:secret123"));\n' +
      'check("round-trips through atob", atob(encodeCredential("bob", "hunter2")), "bob:hunter2");\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-crypto-03',
    title: 'A Single-Byte XOR Cipher',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Cryptography & Encoding',
    prompt:
      'Write function xorCipher(text, key) that XORs each character of text against the corresponding ' +
      'character of key (repeating key as needed) and returns the result as a new string. XOR ciphers ' +
      'are the building block behind real malware C2 traffic obfuscation and CTF crypto challenges — ' +
      'and the reason they\'re "cipher" and not "encryption": XOR is its own inverse, so running the ' +
      'exact same function again with the same key recovers the original text.',
    starterCode:
      'function xorCipher(text, key) {\n' +
      '  // TODO: XOR each char of text against key (repeating key as needed), return the result string\n' +
      '}\n',
    hints: [
      'text.charCodeAt(i) gets a character\'s numeric code; String.fromCharCode(n) converts a number back to a character.',
      'The XOR operator in JS is ^ — combine a text char code with a key char code using it.',
      'Repeat the key by indexing it with i % key.length: key.charCodeAt(i % key.length)',
    ],
    solution:
      'function xorCipher(text, key) {\n' +
      '  let result = "";\n' +
      '  for (let i = 0; i < text.length; i++) {\n' +
      '    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));\n' +
      '  }\n' +
      '  return result;\n' +
      '}\n',
    testCode:
      'let __passed = 0;\n' +
      'let __total = 0;\n' +
      'function check(name, actual, expected) {\n' +
      '  __total++;\n' +
      '  const ok = actual === expected;\n' +
      '  if (ok) __passed++;\n' +
      '  console.log((ok ? "[PASS] " : "[FAIL] ") + name + ": got " + JSON.stringify(actual) + ", expected " + JSON.stringify(expected));\n' +
      '}\n' +
      'check("self-inverse round trip", xorCipher(xorCipher("hello world", "key"), "key"), "hello world");\n' +
      'check("not a no-op", xorCipher("hello", "key") !== "hello", true);\n' +
      'check("empty text", xorCipher("", "key"), "");\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-crypto-04',
    title: 'Hex-Encode a Byte Array',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Cryptography & Encoding',
    prompt:
      'Write function bytesToHex(bytes) that takes an array of numbers (each 0-255) and returns their ' +
      'lowercase two-digit hex representation concatenated together, e.g. [0, 255, 16] -> "00ff10". ' +
      'This is exactly how every hash digest (MD5, SHA-256), memory dump, and packet capture byte you\'ve ' +
      'ever seen printed as a string got that way.',
    starterCode:
      'function bytesToHex(bytes) {\n' +
      '  // TODO: return the lowercase, zero-padded hex string for the given byte array\n' +
      '}\n',
    hints: [
      'A number\'s .toString(16) method returns its hexadecimal representation as a string.',
      'A single byte can produce a 1-character hex string (e.g. 15 -> "f") — pad it to 2 with .padStart(2, "0").',
      'bytes.map(b => b.toString(16).padStart(2, "0")).join("") does the whole conversion in one line.',
    ],
    solution:
      'function bytesToHex(bytes) {\n' +
      '  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");\n' +
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
      'check("basic", bytesToHex([0, 255, 16]), "00ff10");\n' +
      'check("single low byte needs padding", bytesToHex([171]), "ab");\n' +
      'check("empty", bytesToHex([]), "");\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-crypto-05',
    title: 'A Generalized ROT-N Cipher',
    difficulty: 'Medium',
    language: 'javascript',
    category: 'Cryptography & Encoding',
    prompt:
      'Write function rotN(text, n) that shifts every letter in text by n positions through the alphabet ' +
      '(wrapping z back to a, Z back to A), leaving non-letters untouched — a generalized Caesar cipher where ' +
      'n can be any integer, including negative values (a negative shift rotates backwards) and values ' +
      'greater than 26 (which should wrap around correctly, same as ROT13 is just rotN(text, 13)).',
    starterCode:
      'function rotN(text, n) {\n' +
      '  // TODO: shift every letter in text by n positions, wrapping a-z and A-Z; leave non-letters untouched\n' +
      '  return text;\n' +
      '}\n',
    hints: [
      'Normalize n first so it\'s always a positive value mod 26: const shift = ((n % 26) + 26) % 26 — this handles negative n correctly too.',
      'Build the result character by character, checking if each char is lowercase (a-z) or uppercase (A-Z) before shifting it; leave anything else unchanged.',
      'For a lowercase letter c: String.fromCharCode(((c.charCodeAt(0) - 97 + shift) % 26) + 97) — the same idea works for uppercase using 65 instead of 97.',
    ],
    solution:
      'function rotN(text, n) {\n' +
      '  const shift = ((n % 26) + 26) % 26;\n' +
      '  let result = "";\n' +
      '  for (const c of text) {\n' +
      '    const code = c.charCodeAt(0);\n' +
      '    if (code >= 97 && code <= 122) {\n' +
      '      result += String.fromCharCode(((code - 97 + shift) % 26) + 97);\n' +
      '    } else if (code >= 65 && code <= 90) {\n' +
      '      result += String.fromCharCode(((code - 65 + shift) % 26) + 65);\n' +
      '    } else {\n' +
      '      result += c;\n' +
      '    }\n' +
      '  }\n' +
      '  return result;\n' +
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
      'check("basic shift 3", rotN("abc", 3), "def");\n' +
      'check("wraparound", rotN("xyz", 3), "abc");\n' +
      'check("rot13 is its own inverse", rotN(rotN("Attack At Dawn", 13), 13), "Attack At Dawn");\n' +
      'check("negative shift", rotN("def", -3), "abc");\n' +
      'check("shift greater than 26 wraps", rotN("abc", 29), "def");\n' +
      'check("non-letters untouched", rotN("a-1!", 1), "b-1!");\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
  {
    id: 'js-crypto-06',
    title: 'Compute a Simple Checksum (Sum of Char Codes Mod 256)',
    difficulty: 'Easy',
    language: 'javascript',
    category: 'Cryptography & Encoding',
    prompt:
      'Write function simpleChecksum(s) that returns the sum of every character\'s char code in string s, ' +
      'taken mod 256 — a cheap, fast integrity check (not a real hash) used by some legacy protocols to catch ' +
      'accidental corruption.',
    starterCode:
      'function simpleChecksum(s) {\n' +
      '  // TODO: return the sum of char codes in s, mod 256\n' +
      '  return 0;\n' +
      '}\n',
    hints: [
      's.charCodeAt(i) gives the char code of the character at position i.',
      'Loop through every character, adding its char code to a running total.',
      'Apply % 256 to the FINAL total, not on each step — either works mathematically, but applying it once at the end is simpler.',
    ],
    solution:
      'function simpleChecksum(s) {\n' +
      '  let total = 0;\n' +
      '  for (let i = 0; i < s.length; i++) {\n' +
      '    total += s.charCodeAt(i);\n' +
      '  }\n' +
      '  return total % 256;\n' +
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
      'check("empty string", simpleChecksum(""), 0);\n' +
      'check("single char", simpleChecksum("A"), 65);\n' +
      'check("wraps past 256", simpleChecksum("AAAAA"), (65 * 5) % 256);\n' +
      'check("mixed string", simpleChecksum("abc"), (97 + 98 + 99) % 256);\n' +
      'console.log("__RESULT__ " + __passed + "/" + __total);\n',
  },
];
