import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# GCD & Palindrome Check, Recursively

Two more recursive functions, one classic (Euclid's algorithm) and one over a C-string using index
bounds as the base case instead of a numeric one.
`;

const SOLUTION_CPP_STARTER = `int gcd(int a, int b) {
    // TODO: Euclid's algorithm, recursively. Base case: gcd(a, 0) == a. Recursive case:
    // gcd(a, b) == gcd(b, a % b).
    return 0;
}

bool isPalindromeRange(const char* s, int start, int end) {
    // TODO: return true if s[start..end] (inclusive) reads the same forwards and backwards.
    // Base case: start >= end means there's nothing left to compare, so it's a palindrome.
    // Recursive case: s[start] must equal s[end], AND the inner range (start+1, end-1) must also
    // be a palindrome.
    return false;
}
`;

const SOLUTION_CPP_SOLUTION = `int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}

bool isPalindromeRange(const char* s, int start, int end) {
    if (start >= end) return true;
    if (s[start] != s[end]) return false;
    return isPalindromeRange(s, start + 1, end - 1);
}
`;

const MAIN_CPP = `#include <iostream>
#include <cstring>
#include "solution.cpp"
using namespace std;

int main() {
    cout << "gcd(48, 18): " << gcd(48, 18) << endl;
    const char* word = "level";
    cout << "isPalindromeRange(\\"level\\"): " << (isPalindromeRange(word, 0, strlen(word) - 1) ? "true" : "false") << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include <cstring>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (gcd(48, 18) == 6) { passed++; cout << "[PASS] gcd(48, 18)" << endl; }
    else { cout << "[FAIL] gcd(48, 18): got " << gcd(48, 18) << ", expected 6" << endl; }

    total++;
    if (gcd(17, 5) == 1) { passed++; cout << "[PASS] gcd of coprime numbers" << endl; }
    else { cout << "[FAIL] gcd(17, 5)" << endl; }

    total++;
    if (gcd(10, 0) == 10) { passed++; cout << "[PASS] gcd(10, 0) base case" << endl; }
    else { cout << "[FAIL] gcd(10, 0)" << endl; }

    const char* level = "level";
    total++;
    if (isPalindromeRange(level, 0, strlen(level) - 1) == true) { passed++; cout << "[PASS] 'level' is a palindrome" << endl; }
    else { cout << "[FAIL] 'level' is a palindrome" << endl; }

    const char* hello = "hello";
    total++;
    if (isPalindromeRange(hello, 0, strlen(hello) - 1) == false) { passed++; cout << "[PASS] 'hello' is not a palindrome" << endl; }
    else { cout << "[FAIL] 'hello' is not a palindrome" << endl; }

    const char* a = "a";
    total++;
    if (isPalindromeRange(a, 0, 0) == true) { passed++; cout << "[PASS] single character is a palindrome" << endl; }
    else { cout << "[FAIL] single character is a palindrome" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-005',
  title: 'GCD & Palindrome Check, Recursively',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Functions & Recursion',
  tags: ['recursion', 'c-strings'],
  prompt: "Implement Euclid's GCD algorithm and a recursive palindrome check that shrinks a C-string's index range on each call instead of counting down a number.",
  hints: [
    "Euclid's algorithm: `if (b == 0) return a;` is the base case, `gcd(b, a % b)` is the recursive step.",
    'The palindrome check\'s "size" shrinking toward the base case is the gap between `start` and `end`, not a plain integer — each recursive call moves both inward by one.',
    '`if (start >= end) return true;` covers both the empty range and a single leftover character.',
    'Check `s[start] != s[end]` first and return false immediately on a mismatch — only recurse inward when the outer pair actually matches.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('solution.cpp', SOLUTION_CPP_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('solution.cpp', SOLUTION_CPP_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'GCD & Palindrome', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
