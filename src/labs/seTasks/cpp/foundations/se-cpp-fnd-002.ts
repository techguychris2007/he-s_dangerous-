import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Grade & Leap Year Classifiers

Two independent branching functions — an \`if\`/\`else if\` chain and a leap-year rule that needs
three conditions combined correctly. Pure control flow, no arrays or pointers yet.
`;

const SOLUTION_CPP_STARTER = `char letterGrade(int score) {
    // TODO: return 'A' for score >= 90, 'B' for >= 80, 'C' for >= 70, 'D' for >= 60, else 'F'.
    return 'F';
}

bool isLeapYear(int year) {
    // TODO: a year is a leap year if it's divisible by 4, EXCEPT century years (divisible by 100)
    // which are only leap years if also divisible by 400.
    // Examples: 2000 -> true, 1900 -> false, 2024 -> true, 2023 -> false.
    return false;
}
`;

const SOLUTION_CPP_SOLUTION = `char letterGrade(int score) {
    if (score >= 90) return 'A';
    else if (score >= 80) return 'B';
    else if (score >= 70) return 'C';
    else if (score >= 60) return 'D';
    else return 'F';
}

bool isLeapYear(int year) {
    if (year % 400 == 0) return true;
    if (year % 100 == 0) return false;
    return year % 4 == 0;
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    cout << "Grade for 85: " << letterGrade(85) << endl;
    cout << "Is 2000 a leap year? " << (isLeapYear(2000) ? "true" : "false") << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (letterGrade(95) == 'A') { passed++; cout << "[PASS] grade 95 is A" << endl; }
    else { cout << "[FAIL] grade 95 is A" << endl; }

    total++;
    if (letterGrade(72) == 'C') { passed++; cout << "[PASS] grade 72 is C" << endl; }
    else { cout << "[FAIL] grade 72 is C" << endl; }

    total++;
    if (letterGrade(50) == 'F') { passed++; cout << "[PASS] grade 50 is F" << endl; }
    else { cout << "[FAIL] grade 50 is F" << endl; }

    total++;
    if (letterGrade(90) == 'A') { passed++; cout << "[PASS] boundary 90 is A" << endl; }
    else { cout << "[FAIL] boundary 90 is A" << endl; }

    total++;
    if (isLeapYear(2000) == true) { passed++; cout << "[PASS] 2000 is a leap year" << endl; }
    else { cout << "[FAIL] 2000 is a leap year" << endl; }

    total++;
    if (isLeapYear(1900) == false) { passed++; cout << "[PASS] 1900 is not a leap year" << endl; }
    else { cout << "[FAIL] 1900 is not a leap year" << endl; }

    total++;
    if (isLeapYear(2024) == true) { passed++; cout << "[PASS] 2024 is a leap year" << endl; }
    else { cout << "[FAIL] 2024 is a leap year" << endl; }

    total++;
    if (isLeapYear(2023) == false) { passed++; cout << "[PASS] 2023 is not a leap year" << endl; }
    else { cout << "[FAIL] 2023 is not a leap year" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-002',
  title: 'Grade & Leap Year Classifiers',
  difficulty: 'Easy',
  language: 'cpp',
  track: 'foundations',
  category: 'Control-Flow',
  tags: ['conditionals', 'branching'],
  prompt: 'Implement a letter-grade classifier (if/else if chain) and a leap-year rule that needs three conditions combined in the right order.',
  hints: [
    'Order the `else if` chain from highest threshold to lowest so each boundary only needs one comparison.',
    'The boundaries are inclusive (">= 90" is A) — score 90 exactly should land in A, not B.',
    'Check divisibility by 400 FIRST (always a leap year), then by 100 (never a leap year if only this matches), then by 4 (leap year otherwise) — that order matters, since 2000 is divisible by all three.',
    '`year % 400 == 0` catches century leap years before the `% 100` check would wrongly reject them.',
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
  targets: [{ id: 'main', label: 'Grade & Leap Year', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
