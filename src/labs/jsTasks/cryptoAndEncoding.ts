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
];
