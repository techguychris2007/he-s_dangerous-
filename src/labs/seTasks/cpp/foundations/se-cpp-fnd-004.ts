import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Recursive Math

Two classic recursive functions: a function that calls itself with a smaller input until it hits a
base case. The oldest example in the book, but the base-case-first discipline it teaches applies to
every recursive function you'll ever write.
`;

const SOLUTION_CPP_STARTER = `int factorial(int n) {
    // TODO: return n! (n * (n-1) * ... * 1). Base case: factorial(0) == 1. Use recursion, not a loop.
    return 0;
}

int fibonacci(int n) {
    // TODO: return the nth Fibonacci number (0-indexed: fibonacci(0) == 0, fibonacci(1) == 1,
    // fibonacci(n) == fibonacci(n-1) + fibonacci(n-2)). Use recursion, not a loop.
    return 0;
}
`;

const SOLUTION_CPP_SOLUTION = `int factorial(int n) {
    if (n <= 0) return 1;
    return n * factorial(n - 1);
}

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    cout << "factorial(5): " << factorial(5) << endl;
    cout << "fibonacci(7): " << fibonacci(7) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (factorial(0) == 1) { passed++; cout << "[PASS] factorial(0)" << endl; }
    else { cout << "[FAIL] factorial(0): got " << factorial(0) << ", expected 1" << endl; }

    total++;
    if (factorial(1) == 1) { passed++; cout << "[PASS] factorial(1)" << endl; }
    else { cout << "[FAIL] factorial(1)" << endl; }

    total++;
    if (factorial(5) == 120) { passed++; cout << "[PASS] factorial(5)" << endl; }
    else { cout << "[FAIL] factorial(5): got " << factorial(5) << ", expected 120" << endl; }

    total++;
    if (fibonacci(0) == 0) { passed++; cout << "[PASS] fibonacci(0)" << endl; }
    else { cout << "[FAIL] fibonacci(0)" << endl; }

    total++;
    if (fibonacci(1) == 1) { passed++; cout << "[PASS] fibonacci(1)" << endl; }
    else { cout << "[FAIL] fibonacci(1)" << endl; }

    total++;
    if (fibonacci(7) == 13) { passed++; cout << "[PASS] fibonacci(7)" << endl; }
    else { cout << "[FAIL] fibonacci(7): got " << fibonacci(7) << ", expected 13" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-004',
  title: 'Recursive Math',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Functions & Recursion',
  tags: ['recursion', 'functions'],
  prompt: 'Implement factorial and Fibonacci recursively, each with the base case checked first.',
  hints: [
    'Every recursive function needs a base case checked BEFORE the recursive call — `if (n <= 0) return 1;` for factorial.',
    'The recursive case calls the function with a strictly smaller input: `n * factorial(n - 1)`.',
    'Fibonacci needs TWO base cases (0 and 1), since it recurses two steps back: `fibonacci(n-1) + fibonacci(n-2)`.',
    '`if (n <= 1) return n;` covers both fibonacci(0) -> 0 and fibonacci(1) -> 1 in one line.',
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
  targets: [{ id: 'main', label: 'Recursive Math', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
