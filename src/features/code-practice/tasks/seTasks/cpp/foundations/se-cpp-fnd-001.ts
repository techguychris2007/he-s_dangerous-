import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Temperature & Parity Helpers

Two small, independent functions in \`solution.cpp\` — a good first Build Portal C++ task: a real local
\`#include\` between files, using only \`<iostream>\`. The in-browser C++ interpreter understands a small,
fixed set of headers (no \`<string>\`/\`<vector>\`/\`<algorithm>\`) — every Build Portal C++ task is written
to fit inside that, on purpose.
`;

const SOLUTION_CPP_STARTER = `int celsiusToFahrenheit(int celsius) {
    // TODO: return the Fahrenheit equivalent of \`celsius\` (integer math is fine):
    //   F = C * 9 / 5 + 32
    return 0;
}

bool isEven(int n) {
    // TODO: return true if n is even, false otherwise
    return false;
}
`;

const SOLUTION_CPP_SOLUTION = `int celsiusToFahrenheit(int celsius) {
    return celsius * 9 / 5 + 32;
}

bool isEven(int n) {
    return n % 2 == 0;
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    cout << "32C in F: " << celsiusToFahrenheit(32) << endl;
    cout << "isEven(7): " << (isEven(7) ? "true" : "false") << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (celsiusToFahrenheit(32) == 89) { passed++; cout << "[PASS] 32C -> F" << endl; }
    else { cout << "[FAIL] 32C -> F: got " << celsiusToFahrenheit(32) << ", expected 89" << endl; }

    total++;
    if (celsiusToFahrenheit(0) == 32) { passed++; cout << "[PASS] 0C -> F" << endl; }
    else { cout << "[FAIL] 0C -> F: got " << celsiusToFahrenheit(0) << ", expected 32" << endl; }

    total++;
    if (isEven(4) == true) { passed++; cout << "[PASS] isEven(4)" << endl; }
    else { cout << "[FAIL] isEven(4): expected true" << endl; }

    total++;
    if (isEven(7) == false) { passed++; cout << "[PASS] isEven(7)" << endl; }
    else { cout << "[FAIL] isEven(7): expected false" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-001',
  title: 'Temperature & Parity Helpers',
  difficulty: 'Easy',
  language: 'cpp',
  track: 'foundations',
  category: 'Types & Operators',
  tags: ['arithmetic', 'includes'],
  prompt:
    'Implement two small functions in `solution.cpp`. `main.cpp` already `#include`s it and calls both ' +
    "— a real local include between two files, the smallest possible multi-file C++ shape. Note: this " +
    "interpreter combines every file into one translation unit before running (no linker in-browser) " +
    "— see the note on the Run panel.",
  hints: [
    'Fahrenheit: `celsius * 9 / 5 + 32` — integer division truncates, which is fine here (32C -> 89F exactly).',
    '`n % 2 == 0` is the whole of isEven — no special-casing negative numbers needed for the test cases here.',
    "main.cpp is already correct and already includes solution.cpp for you — you're only editing solution.cpp.",
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
  targets: [{ id: 'main', label: 'Temperature & Parity', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
