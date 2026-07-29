import type { CodeTask } from '../codeTypes';

export const CPP_CRYPTO_TASKS: CodeTask[] = [
  {
    id: 'cpp-crypto-01',
    title: 'Caesar Cipher Encode',
    difficulty: 'Medium',
    language: 'cpp',
    category: 'Cryptography & Encoding',
    prompt:
      'Write void caesarEncode(char* text, int shift) that shifts every letter in text by shift ' +
      'positions through the alphabet, wrapping from z back to a (and Z back to A), and leaves ' +
      'digits/punctuation/spaces untouched. It is one of the oldest ciphers there is — and still the ' +
      'first thing worth understanding before anything modern, since every substitution cipher is a ' +
      'variation on this same idea.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'void caesarEncode(char* text, int shift) {\n' +
      '    // TODO: shift each letter in text by `shift` positions, wrapping a-z and A-Z;\n' +
      '    // leave non-letters untouched\n' +
      '}\n',
    hints: [
      'Walk the string with a for loop until you hit \'\\0\', same as any C-string traversal.',
      'Only touch characters in the ranges a-z and A-Z — check with c >= \'a\' && c <= \'z\' (and the same for A-Z).',
      "Wrap with modulo: 'a' + (c - 'a' + shift) % 26 maps any shift back into a-z, even when it overflows past 'z'.",
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'void caesarEncode(char* text, int shift) {\n' +
      '    for (int i = 0; text[i] != \'\\0\'; i++) {\n' +
      '        char c = text[i];\n' +
      '        if (c >= \'a\' && c <= \'z\') {\n' +
      '            text[i] = \'a\' + (c - \'a\' + shift) % 26;\n' +
      '        } else if (c >= \'A\' && c <= \'Z\') {\n' +
      '            text[i] = \'A\' + (c - \'A\' + shift) % 26;\n' +
      '        }\n' +
      '    }\n' +
      '}\n',
    testCode:
      'bool charEquals(char* a, char* b) {\n' +
      '    int i = 0;\n' +
      '    while (a[i] != \'\\0\' && b[i] != \'\\0\') {\n' +
      '        if (a[i] != b[i]) return false;\n' +
      '        i++;\n' +
      '    }\n' +
      '    return a[i] == \'\\0\' && b[i] == \'\\0\';\n' +
      '}\n' +
      'int __passed = 0;\n' +
      'int __total = 0;\n' +
      'void check(const char* name, char* actual, char* expected) {\n' +
      '    __total++;\n' +
      '    bool ok = charEquals(actual, expected);\n' +
      '    if (ok) __passed++;\n' +
      '    cout << (ok ? "[PASS] " : "[FAIL] ") << name << ": got " << actual << ", expected " << expected << endl;\n' +
      '}\n' +
      'int main() {\n' +
      '    char m1[] = "Attack At Dawn";\n' +
      '    char e1[] = "Dwwdfn Dw Gdzq";\n' +
      '    caesarEncode(m1, 3);\n' +
      '    check("basic shift 3", m1, e1);\n\n' +
      '    char m2[] = "xyz";\n' +
      '    char e2[] = "abc";\n' +
      '    caesarEncode(m2, 3);\n' +
      '    check("wraparound", m2, e2);\n\n' +
      '    char m3[] = "Test-123!";\n' +
      '    char e3[] = "Whvw-123!";\n' +
      '    caesarEncode(m3, 3);\n' +
      '    check("non-letters unchanged", m3, e3);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
];
