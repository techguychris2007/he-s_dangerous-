import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Bit Flags

Two functions on raw bits using \`&\`, \`|\`, \`<<\`, \`>>\` — the operators real embedded/systems code
uses to pack multiple true/false flags into a single integer instead of one \`bool\` per flag.
`;

const SOLUTION_CPP_STARTER = `int countSetBits(unsigned int n) {
    // TODO: return how many bits of n are set to 1. countSetBits(7) -> 3 (binary 111).
    return 0;
}

bool isPowerOfTwo(unsigned int n) {
    // TODO: return true if n is a power of two (1, 2, 4, 8, 16, ...). Assume n >= 1.
    // Hint: a power of two has EXACTLY one bit set.
    return false;
}
`;

const SOLUTION_CPP_SOLUTION = `int countSetBits(unsigned int n) {
    int count = 0;
    while (n) {
        count += n & 1;
        n >>= 1;
    }
    return count;
}

bool isPowerOfTwo(unsigned int n) {
    return countSetBits(n) == 1;
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    cout << "countSetBits(7): " << countSetBits(7) << endl;
    cout << "isPowerOfTwo(16): " << (isPowerOfTwo(16) ? "true" : "false") << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (countSetBits(7) == 3) { passed++; cout << "[PASS] countSetBits(7)" << endl; }
    else { cout << "[FAIL] countSetBits(7): got " << countSetBits(7) << ", expected 3" << endl; }

    total++;
    if (countSetBits(8) == 1) { passed++; cout << "[PASS] countSetBits(8)" << endl; }
    else { cout << "[FAIL] countSetBits(8): got " << countSetBits(8) << ", expected 1" << endl; }

    total++;
    if (countSetBits(0) == 0) { passed++; cout << "[PASS] countSetBits(0)" << endl; }
    else { cout << "[FAIL] countSetBits(0)" << endl; }

    total++;
    if (countSetBits(255) == 8) { passed++; cout << "[PASS] countSetBits(255) all bits in a byte" << endl; }
    else { cout << "[FAIL] countSetBits(255): got " << countSetBits(255) << ", expected 8" << endl; }

    total++;
    if (isPowerOfTwo(16) == true) { passed++; cout << "[PASS] 16 is a power of two" << endl; }
    else { cout << "[FAIL] 16 is a power of two" << endl; }

    total++;
    if (isPowerOfTwo(1) == true) { passed++; cout << "[PASS] 1 is a power of two" << endl; }
    else { cout << "[FAIL] 1 is a power of two" << endl; }

    total++;
    if (isPowerOfTwo(6) == false) { passed++; cout << "[PASS] 6 is not a power of two" << endl; }
    else { cout << "[FAIL] 6 is not a power of two" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-011',
  title: 'Bit Flags',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Bit Manipulation',
  tags: ['bitwise', 'unsigned'],
  prompt: 'Count the set bits in an unsigned int and use that to detect powers of two — the operators real embedded code packs flags with.',
  hints: [
    '`n & 1` isolates the lowest bit (0 or 1); `n >>= 1` shifts everything one place right, discarding the bit you just checked.',
    '`while (n)` naturally stops once every bit has been shifted out and `n` becomes 0.',
    "A power of two in binary is a single 1 followed by zeros (1, 10, 100, 1000, ...) — exactly one set bit.",
    '`isPowerOfTwo` can reuse `countSetBits` directly: `return countSetBits(n) == 1;` — no need to reimplement the bit-counting logic.',
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
  targets: [{ id: 'main', label: 'Bit Flags', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
