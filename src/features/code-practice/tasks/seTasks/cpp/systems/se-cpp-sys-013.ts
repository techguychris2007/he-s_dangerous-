import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Q8.8 Fixed-Point Conversion

Real embedded/DSP code often avoids floating point entirely, representing fractional values as a
plain \`int\` scaled by a fixed power of two — "Q8.8" means 8 integer bits and 8 fractional bits, so
multiplying a real value by 256 (2^8) and truncating to an int gives you a fixed-point
representation that adds/subtracts with ordinary integer arithmetic.
`;

const FIXED_STARTER = `const int SCALE = 256;

int toFixed(int wholePart, int numerator, int denominator) {
    // TODO: return the Q8.8 fixed-point representation of (wholePart + numerator/denominator).
    // wholePart * SCALE covers the integer part; the fractional part is (numerator * SCALE) /
    // denominator. Add them together. Assume wholePart >= 0 and 0 <= numerator < denominator.
    return 0;
}

int fixedToWhole(int fixedValue) {
    // TODO: return just the integer part of a Q8.8 value (throw away the fraction).
    return 0;
}

int addFixed(int a, int b) {
    // TODO: add two Q8.8 values together. (Hint: this is simpler than it sounds.)
    return 0;
}
`;

const FIXED_SOLUTION = `const int SCALE = 256;

int toFixed(int wholePart, int numerator, int denominator) {
    return wholePart * SCALE + (numerator * SCALE) / denominator;
}

int fixedToWhole(int fixedValue) {
    return fixedValue / SCALE;
}

int addFixed(int a, int b) {
    return a + b;
}
`;

const MAIN_CPP = `#include <iostream>
#include "fixed.cpp"
using namespace std;

int main() {
    int half = toFixed(0, 1, 2);
    int oneAndQuarter = toFixed(1, 1, 4);
    cout << "half=" << half << " oneAndQuarter=" << oneAndQuarter << endl;
    cout << "sum whole part: " << fixedToWhole(addFixed(half, oneAndQuarter)) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "fixed.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (toFixed(1, 0, 1) == 256) { passed++; cout << "[PASS] a whole number scales by 256" << endl; }
    else { cout << "[FAIL] a whole number scales by 256: got " << toFixed(1, 0, 1) << ", expected 256" << endl; }

    total++;
    if (toFixed(0, 1, 2) == 128) { passed++; cout << "[PASS] one half is 128 in Q8.8" << endl; }
    else { cout << "[FAIL] one half is 128 in Q8.8: got " << toFixed(0, 1, 2) << ", expected 128" << endl; }

    total++;
    if (toFixed(1, 1, 4) == 320) { passed++; cout << "[PASS] 1.25 combines a whole part and a fraction" << endl; }
    else { cout << "[FAIL] 1.25 combines a whole part and a fraction: got " << toFixed(1, 1, 4) << ", expected 320" << endl; }

    total++;
    if (fixedToWhole(320) == 1) { passed++; cout << "[PASS] fixedToWhole truncates the fraction" << endl; }
    else { cout << "[FAIL] fixedToWhole truncates the fraction: got " << fixedToWhole(320) << ", expected 1" << endl; }

    total++;
    if (fixedToWhole(128) == 0) { passed++; cout << "[PASS] a pure fraction has a whole part of 0" << endl; }
    else { cout << "[FAIL] a pure fraction has a whole part of 0" << endl; }

    total++;
    if (addFixed(128, 128) == 256) { passed++; cout << "[PASS] half plus half is a whole one" << endl; }
    else { cout << "[FAIL] half plus half is a whole one: got " << addFixed(128, 128) << ", expected 256" << endl; }

    total++;
    if (fixedToWhole(addFixed(toFixed(0, 1, 2), toFixed(1, 1, 4))) == 1) { passed++; cout << "[PASS] chained conversions still work" << endl; }
    else { cout << "[FAIL] chained conversions still work: got " << fixedToWhole(addFixed(toFixed(0, 1, 2), toFixed(1, 1, 4))) << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-013',
  title: 'Q8.8 Fixed-Point Conversion',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'systems',
  category: 'Fixed-Point Numerics',
  tags: ['fixed-point', 'integer-math'],
  prompt: 'Convert whole-number-plus-fraction values into a Q8.8 fixed-point integer representation (scaled by 256), and back — the way embedded/DSP code avoids floating point entirely.',
  hints: [
    '`wholePart * SCALE` handles the integer part — multiplying by 256 shifts it into the same "scaled" space the fractional part lives in.',
    '`(numerator * SCALE) / denominator` computes the fractional part\'s scaled value — multiply BEFORE dividing, or you\'ll lose precision to integer truncation.',
    '`fixedToWhole` just divides back out: `fixedValue / SCALE` — integer division naturally truncates any fractional remainder, which is exactly "throw away the fraction."',
    'Two Q8.8 values add with ordinary `+` — that\'s the entire point of fixed-point representation: once everything is scaled the same way, normal integer arithmetic just works.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('fixed.cpp', FIXED_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('fixed.cpp', FIXED_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Q8.8 Fixed-Point Conversion', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
