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
];
