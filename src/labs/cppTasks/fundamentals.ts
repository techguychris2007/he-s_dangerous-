import type { CodeTask } from '../codeTypes';

/** C++ fundamentals through a security lens, using the subset of C++ the in-browser interpreter
 *  (JSCPP) actually supports: primitive types, arrays, functions, control flow, and C-style
 *  (char*) strings — no std::string/std::vector/classes, so tasks are written accordingly. */
export const CPP_FUNDAMENTALS_TASKS: CodeTask[] = [
  {
    id: 'cpp-fund-01',
    title: 'Total Bytes Transferred',
    difficulty: 'Easy',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write int totalBytes(int sizes[], int n) that returns the sum of the first n elements of ' +
      'sizes — the total bytes moved across a set of logged packets or file transfers. This kind ' +
      'of running total is the base of almost every bandwidth or data-exfiltration monitor.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int totalBytes(int sizes[], int n) {\n' +
      '    // TODO: return the sum of the first n elements of sizes\n' +
      '    return 0;\n' +
      '}\n',
    hints: [
      'Loop from i = 0 to n - 1, adding sizes[i] to a running total each time.',
      'Declare the total as int and initialize it to 0 before the loop.',
      'Return the total after the loop finishes — no need for anything fancier than a for loop.',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int totalBytes(int sizes[], int n) {\n' +
      '    int total = 0;\n' +
      '    for (int i = 0; i < n; i++) {\n' +
      '        total += sizes[i];\n' +
      '    }\n' +
      '    return total;\n' +
      '}\n',
    testCode:
      'int __passed = 0;\n' +
      'int __total = 0;\n' +
      'void check(const char* name, int actual, int expected) {\n' +
      '    __total++;\n' +
      '    bool ok = actual == expected;\n' +
      '    if (ok) __passed++;\n' +
      '    cout << (ok ? "[PASS] " : "[FAIL] ") << name << ": got " << actual << ", expected " << expected << endl;\n' +
      '}\n' +
      'int main() {\n' +
      '    int a1[4] = {120, 340, 560, 80};\n' +
      '    check("basic", totalBytes(a1, 4), 1100);\n\n' +
      '    int a2[2] = {0, 0};\n' +
      '    check("all zero", totalBytes(a2, 2), 0);\n\n' +
      '    int a3[5] = {1000, 2000, 3000, 4000, 5000};\n' +
      '    check("larger set", totalBytes(a3, 5), 15000);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
  {
    id: 'cpp-fund-02',
    title: 'Reverse a Token In Place',
    difficulty: 'Easy',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write void reverseInPlace(char* s) that reverses a null-terminated C-string in place — no ' +
      'return value, modify the array s points to directly. Some log shippers use a reversed token ' +
      'as a cheap, fast obfuscation step before writing it to disk; this is the primitive that makes it work.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'void reverseInPlace(char* s) {\n' +
      '    // TODO: reverse the null-terminated C-string s in place\n' +
      '}\n',
    hints: [
      'Find the length first by walking forward until you hit the \'\\0\' terminator.',
      'Swap characters from both ends moving inward: s[i] with s[len-1-i], for i from 0 to len/2.',
      'Use a temporary char to hold one value during each swap — no extra array needed.',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'void reverseInPlace(char* s) {\n' +
      '    int len = 0;\n' +
      '    while (s[len] != \'\\0\') len++;\n' +
      '    for (int i = 0; i < len / 2; i++) {\n' +
      '        char tmp = s[i];\n' +
      '        s[i] = s[len - 1 - i];\n' +
      '        s[len - 1 - i] = tmp;\n' +
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
      '    char s1[] = "hello";\n' +
      '    char e1[] = "olleh";\n' +
      '    reverseInPlace(s1);\n' +
      '    check("basic", s1, e1);\n\n' +
      '    char s2[] = "a";\n' +
      '    char e2[] = "a";\n' +
      '    reverseInPlace(s2);\n' +
      '    check("single char", s2, e2);\n\n' +
      '    char s3[] = "abcd";\n' +
      '    char e3[] = "dcba";\n' +
      '    reverseInPlace(s3);\n' +
      '    check("even length", s3, e3);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
];
