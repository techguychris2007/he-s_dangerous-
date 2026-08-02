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
  {
    id: 'cpp-fund-03',
    title: 'Sum of Digits',
    difficulty: 'Easy',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write int sumOfDigits(int n) that returns the sum of the decimal digits of a non-negative integer n ' +
      '(e.g. 4821 -> 4+8+2+1 = 15). This is the same digit-extraction loop used by the Luhn card-number ' +
      'checksum taught elsewhere on this platform.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int sumOfDigits(int n) {\n' +
      '    // TODO: return the sum of the decimal digits of n\n' +
      '    return 0;\n' +
      '}\n',
    hints: [
      'n % 10 gives the last digit; n / 10 (integer division) drops it.',
      'Loop while n > 0, adding n % 10 to a running total and reassigning n = n / 10 each time.',
      'n == 0 should return 0 — the loop condition n > 0 already handles this correctly without a special case.',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int sumOfDigits(int n) {\n' +
      '    int total = 0;\n' +
      '    while (n > 0) {\n' +
      '        total += n % 10;\n' +
      '        n /= 10;\n' +
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
      '    check("basic", sumOfDigits(4821), 15);\n' +
      '    check("single digit", sumOfDigits(7), 7);\n' +
      '    check("zero", sumOfDigits(0), 0);\n' +
      '    check("repeated digits", sumOfDigits(1111), 4);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
  {
    id: 'cpp-fund-04',
    title: 'Check if a Number Is Prime',
    difficulty: 'Easy',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write bool isPrime(int n) that returns true if n is a prime number, false otherwise. Handle n <= 1 ' +
      '(never prime) correctly. For efficiency, only test divisors up to and including the square root of n.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'bool isPrime(int n) {\n' +
      '    // TODO: return true if n is prime, false otherwise\n' +
      '    return false;\n' +
      '}\n',
    hints: [
      'n <= 1 is never prime — return false immediately for those.',
      'Loop a candidate divisor i from 2 while i * i <= n — that\'s the same bound as sqrt(n) without needing <cmath>.',
      'If n % i == 0 for any tested i, n is not prime — return false right away. If the loop finishes with no divisor found, n is prime.',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'bool isPrime(int n) {\n' +
      '    if (n <= 1) return false;\n' +
      '    for (int i = 2; i * i <= n; i++) {\n' +
      '        if (n % i == 0) return false;\n' +
      '    }\n' +
      '    return true;\n' +
      '}\n',
    testCode:
      'int __passed = 0;\n' +
      'int __total = 0;\n' +
      'void check(const char* name, bool actual, bool expected) {\n' +
      '    __total++;\n' +
      '    bool ok = actual == expected;\n' +
      '    if (ok) __passed++;\n' +
      '    cout << (ok ? "[PASS] " : "[FAIL] ") << name << ": got " << actual << ", expected " << expected << endl;\n' +
      '}\n' +
      'int main() {\n' +
      '    check("2 is prime", isPrime(2), true);\n' +
      '    check("17 is prime", isPrime(17), true);\n' +
      '    check("1 is not prime", isPrime(1), false);\n' +
      '    check("0 is not prime", isPrime(0), false);\n' +
      '    check("negative is not prime", isPrime(-5), false);\n' +
      '    check("9 is not prime", isPrime(9), false);\n' +
      '    check("97 is prime", isPrime(97), true);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
  {
    id: 'cpp-fund-05',
    title: 'Find the Maximum in an Array',
    difficulty: 'Easy',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write int findMax(int values[], int n) that returns the largest value among the first n elements of ' +
      'values. You may assume n is always at least 1.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int findMax(int values[], int n) {\n' +
      '    // TODO: return the largest of the first n elements of values\n' +
      '    return 0;\n' +
      '}\n',
    hints: [
      'Start with best = values[0], then scan the rest — don\'t start at 0, since values could contain negative numbers.',
      'Loop i from 1 to n - 1, updating best whenever values[i] > best.',
      'Return best after the loop.',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int findMax(int values[], int n) {\n' +
      '    int best = values[0];\n' +
      '    for (int i = 1; i < n; i++) {\n' +
      '        if (values[i] > best) best = values[i];\n' +
      '    }\n' +
      '    return best;\n' +
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
      '    int a1[5] = {3, 7, 2, 9, 4};\n' +
      '    check("basic", findMax(a1, 5), 9);\n\n' +
      '    int a2[1];\n' +
      '    a2[0] = 42;\n' +
      '    check("single element", findMax(a2, 1), 42);\n\n' +
      '    int a3[4] = {-5, -1, -9, -3};\n' +
      '    check("all negative", findMax(a3, 4), -1);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
  {
    id: 'cpp-fund-06',
    title: 'Bubble Sort an Integer Array',
    difficulty: 'Medium',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write void bubbleSort(int values[], int n) that sorts the first n elements of values in ascending ' +
      'order, in place, using the bubble sort algorithm (repeatedly compare and swap adjacent out-of-order ' +
      'elements). No return value — modify the array directly.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'void bubbleSort(int values[], int n) {\n' +
      '    // TODO: sort the first n elements of values in ascending order, in place\n' +
      '}\n',
    hints: [
      'An outer loop runs n-1 passes; an inner loop compares each adjacent pair and swaps if the left one is bigger.',
      'Inner loop: for (int j = 0; j < n - 1 - i; j++) — shrinking the inner range each pass is an optimization, but a full n-1 inner loop every pass also works correctly.',
      'Swap with a temporary variable: int tmp = values[j]; values[j] = values[j+1]; values[j+1] = tmp;',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'void bubbleSort(int values[], int n) {\n' +
      '    for (int i = 0; i < n - 1; i++) {\n' +
      '        for (int j = 0; j < n - 1 - i; j++) {\n' +
      '            if (values[j] > values[j + 1]) {\n' +
      '                int tmp = values[j];\n' +
      '                values[j] = values[j + 1];\n' +
      '                values[j + 1] = tmp;\n' +
      '            }\n' +
      '        }\n' +
      '    }\n' +
      '}\n',
    testCode:
      'bool arraysEqual(int a[], int b[], int n) {\n' +
      '    for (int i = 0; i < n; i++) {\n' +
      '        if (a[i] != b[i]) return false;\n' +
      '    }\n' +
      '    return true;\n' +
      '}\n' +
      'int __passed = 0;\n' +
      'int __total = 0;\n' +
      'void check(const char* name, int actual[], int expected[], int n) {\n' +
      '    __total++;\n' +
      '    bool ok = arraysEqual(actual, expected, n);\n' +
      '    if (ok) __passed++;\n' +
      '    cout << (ok ? "[PASS] " : "[FAIL] ") << name << endl;\n' +
      '}\n' +
      'int main() {\n' +
      '    int a1[5] = {5, 3, 8, 1, 2};\n' +
      '    int e1[5] = {1, 2, 3, 5, 8};\n' +
      '    bubbleSort(a1, 5);\n' +
      '    check("basic", a1, e1, 5);\n\n' +
      '    int a2[4] = {1, 2, 3, 4};\n' +
      '    int e2[4] = {1, 2, 3, 4};\n' +
      '    bubbleSort(a2, 4);\n' +
      '    check("already sorted", a2, e2, 4);\n\n' +
      '    int a3[3] = {9, 5, 1};\n' +
      '    int e3[3] = {1, 5, 9};\n' +
      '    bubbleSort(a3, 3);\n' +
      '    check("reverse sorted", a3, e3, 3);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
  {
    id: 'cpp-fund-07',
    title: 'Count Vowels in a C-String',
    difficulty: 'Easy',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write int countVowels(char* s) that returns the number of vowels (a, e, i, o, u — either case) in the ' +
      'null-terminated C-string s.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int countVowels(char* s) {\n' +
      '    // TODO: return the count of a/e/i/o/u characters (either case) in s\n' +
      '    return 0;\n' +
      '}\n',
    hints: [
      'Walk the string with a while loop until you hit the \'\\0\' terminator.',
      'For each character, check if it equals any of \'a\',\'e\',\'i\',\'o\',\'u\',\'A\',\'E\',\'I\',\'O\',\'U\'.',
      'A single long || chain of equality checks works fine here — no need for anything cleverer.',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int countVowels(char* s) {\n' +
      '    int count = 0;\n' +
      '    int i = 0;\n' +
      '    while (s[i] != \'\\0\') {\n' +
      '        char c = s[i];\n' +
      '        if (c == \'a\' || c == \'e\' || c == \'i\' || c == \'o\' || c == \'u\' ||\n' +
      '            c == \'A\' || c == \'E\' || c == \'I\' || c == \'O\' || c == \'U\') {\n' +
      '            count++;\n' +
      '        }\n' +
      '        i++;\n' +
      '    }\n' +
      '    return count;\n' +
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
      '    char s1[] = "hello world";\n' +
      '    check("basic", countVowels(s1), 3);\n\n' +
      '    char s2[] = "SECURITY";\n' +
      '    check("uppercase", countVowels(s2), 3);\n\n' +
      '    char s3[] = "xyz";\n' +
      '    check("no vowels", countVowels(s3), 0);\n\n' +
      '    char s4[] = "aeiou";\n' +
      '    check("all vowels", countVowels(s4), 5);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
  {
    id: 'cpp-fund-08',
    title: 'Count Set Bits (Hamming Weight)',
    difficulty: 'Medium',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write int countSetBits(unsigned int n) that returns the number of 1-bits in the binary representation ' +
      'of n (its Hamming weight) — the same operation used to compare permission bitmasks or count differing ' +
      'bits between two hashes.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int countSetBits(unsigned int n) {\n' +
      '    // TODO: return the number of 1-bits in n\n' +
      '    return 0;\n' +
      '}\n',
    hints: [
      'Check the lowest bit with n & 1, then shift right with n = n >> 1, repeating until n reaches 0.',
      'Add 1 to a counter every time the lowest bit is 1.',
      'This naturally handles n == 0 (loop body never runs, count stays 0).',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int countSetBits(unsigned int n) {\n' +
      '    int count = 0;\n' +
      '    while (n > 0) {\n' +
      '        if ((n & 1) == 1) count++;\n' +
      '        n = n >> 1;\n' +
      '    }\n' +
      '    return count;\n' +
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
      '    check("zero", countSetBits(0), 0);\n' +
      '    check("one", countSetBits(1), 1);\n' +
      '    check("seven (0b111)", countSetBits(7), 3);\n' +
      '    check("eight (0b1000)", countSetBits(8), 1);\n' +
      '    check("255 (0b11111111)", countSetBits(255), 8);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
  {
    id: 'cpp-fund-09',
    title: 'Binary Search in a Sorted Array',
    difficulty: 'Medium',
    language: 'cpp',
    category: 'Fundamentals',
    prompt:
      'Write int binarySearch(int values[], int n, int target) that returns the index of target within the ' +
      'ascending-sorted array values (first n elements), or -1 if target is not present. Use the classic ' +
      'halve-the-search-space binary search, not a linear scan.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int binarySearch(int values[], int n, int target) {\n' +
      '    // TODO: return the index of target, or -1 if not found -- use binary search\n' +
      '    return -1;\n' +
      '}\n',
    hints: [
      'Keep low = 0 and high = n - 1, and loop while low <= high.',
      'mid = (low + high) / 2 — if values[mid] == target, you\'re done; if values[mid] < target, search the right half (low = mid + 1); otherwise search the left half (high = mid - 1).',
      'If the loop ends without finding target, return -1.',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int binarySearch(int values[], int n, int target) {\n' +
      '    int low = 0;\n' +
      '    int high = n - 1;\n' +
      '    while (low <= high) {\n' +
      '        int mid = (low + high) / 2;\n' +
      '        if (values[mid] == target) return mid;\n' +
      '        if (values[mid] < target) low = mid + 1;\n' +
      '        else high = mid - 1;\n' +
      '    }\n' +
      '    return -1;\n' +
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
      '    int a1[6] = {1, 3, 5, 7, 9, 11};\n' +
      '    check("found middle", binarySearch(a1, 6, 7), 3);\n' +
      '    check("found first", binarySearch(a1, 6, 1), 0);\n' +
      '    check("found last", binarySearch(a1, 6, 11), 5);\n' +
      '    check("not present", binarySearch(a1, 6, 4), -1);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
];
