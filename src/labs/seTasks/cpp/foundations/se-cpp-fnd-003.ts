import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Loop Patterns

Two \`while\`/\`for\` loop functions on plain integers: peeling off digits one at a time, and counting
divisors by brute force.
`;

const SOLUTION_CPP_STARTER = `int sumDigits(int n) {
    // TODO: return the sum of the decimal digits of n (assume n >= 0). sumDigits(1234) -> 10.
    return 0;
}

int countDivisors(int n) {
    // TODO: return how many positive integers from 1 to n (inclusive) evenly divide n.
    // countDivisors(6) -> 4 (1, 2, 3, 6). Assume n >= 1.
    return 0;
}
`;

const SOLUTION_CPP_SOLUTION = `int sumDigits(int n) {
    int total = 0;
    while (n > 0) {
        total += n % 10;
        n /= 10;
    }
    return total;
}

int countDivisors(int n) {
    int count = 0;
    for (int i = 1; i <= n; i++) {
        if (n % i == 0) count++;
    }
    return count;
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    cout << "sumDigits(1234): " << sumDigits(1234) << endl;
    cout << "countDivisors(6): " << countDivisors(6) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (sumDigits(1234) == 10) { passed++; cout << "[PASS] sumDigits(1234)" << endl; }
    else { cout << "[FAIL] sumDigits(1234): got " << sumDigits(1234) << ", expected 10" << endl; }

    total++;
    if (sumDigits(0) == 0) { passed++; cout << "[PASS] sumDigits(0)" << endl; }
    else { cout << "[FAIL] sumDigits(0)" << endl; }

    total++;
    if (sumDigits(7) == 7) { passed++; cout << "[PASS] sumDigits(7) single digit" << endl; }
    else { cout << "[FAIL] sumDigits(7)" << endl; }

    total++;
    if (countDivisors(6) == 4) { passed++; cout << "[PASS] countDivisors(6)" << endl; }
    else { cout << "[FAIL] countDivisors(6): got " << countDivisors(6) << ", expected 4" << endl; }

    total++;
    if (countDivisors(1) == 1) { passed++; cout << "[PASS] countDivisors(1)" << endl; }
    else { cout << "[FAIL] countDivisors(1)" << endl; }

    total++;
    if (countDivisors(7) == 2) { passed++; cout << "[PASS] countDivisors(7) prime" << endl; }
    else { cout << "[FAIL] countDivisors(7): got " << countDivisors(7) << ", expected 2" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-003',
  title: 'Loop Patterns',
  difficulty: 'Easy',
  language: 'cpp',
  track: 'foundations',
  category: 'Control-Flow',
  tags: ['loops', 'while', 'for'],
  prompt: 'Two loop-based functions: peel digits off an integer one at a time with `while`, and brute-force count divisors with `for`.',
  hints: [
    '`n % 10` gets the last digit, `n /= 10` drops it — repeat in a `while (n > 0)` loop, accumulating the sum.',
    'sumDigits(0) should return 0 — the `while (n > 0)` loop already handles this correctly by never running.',
    'countDivisors is a straight `for (int i = 1; i <= n; i++)` checking `if (n % i == 0) count++;`.',
    'A prime number has exactly 2 divisors (1 and itself) — that\'s a good sanity check once your loop is right.',
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
  targets: [{ id: 'main', label: 'Loop Patterns', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
