import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Integer-Only Percentage Calculator

Computing a percentage with plain integer math, scaled up before dividing instead of ever touching
a \`float\` — the same discipline real firmware uses on hardware with no floating-point unit at all.
The result is a percentage scaled by 100 (so "12.34%" comes back as the integer 1234), keeping one
extra digit of precision without ever using a fraction.
`;

const PERCENT_STARTER = `int percentScaled(int part, int whole) {
    // TODO: return (part / whole) as a percentage, SCALED BY 100 — so if part is exactly half of
    // whole, return 5000 (meaning 50.00%). Multiply BEFORE dividing to avoid losing precision to
    // integer truncation. Return 0 if whole is 0 (avoid dividing by zero).
    return 0;
}

int applyDiscountScaled(int priceCents, int discountPercentScaled) {
    // TODO: priceCents is a price in cents (e.g. 1999 for $19.99). discountPercentScaled is a
    // percentage scaled by 100 (e.g. 2500 for 25%). Return the price in cents AFTER applying the
    // discount, rounded down to the nearest cent.
    return 0;
}
`;

const PERCENT_SOLUTION = `int percentScaled(int part, int whole) {
    if (whole == 0) return 0;
    return (part * 10000) / whole;
}

int applyDiscountScaled(int priceCents, int discountPercentScaled) {
    int discountCents = (priceCents * discountPercentScaled) / 10000;
    return priceCents - discountCents;
}
`;

const MAIN_CPP = `#include <iostream>
#include "percent.cpp"
using namespace std;

int main() {
    cout << "50% as scaled: " << percentScaled(1, 2) << endl;
    cout << "after 25% off $19.99: " << applyDiscountScaled(1999, 2500) << " cents" << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "percent.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (percentScaled(1, 2) == 5000) { passed++; cout << "[PASS] half is 50.00% (5000 scaled)" << endl; }
    else { cout << "[FAIL] half is 50.00% (5000 scaled): got " << percentScaled(1, 2) << ", expected 5000" << endl; }

    total++;
    if (percentScaled(1, 4) == 2500) { passed++; cout << "[PASS] a quarter is 25.00%" << endl; }
    else { cout << "[FAIL] a quarter is 25.00%: got " << percentScaled(1, 4) << endl; }

    total++;
    if (percentScaled(1, 3) == 3333) { passed++; cout << "[PASS] a third truncates to 33.33%, not rounds" << endl; }
    else { cout << "[FAIL] a third truncates to 33.33%, not rounds: got " << percentScaled(1, 3) << ", expected 3333" << endl; }

    total++;
    if (percentScaled(5, 0) == 0) { passed++; cout << "[PASS] dividing by zero returns 0 instead of crashing" << endl; }
    else { cout << "[FAIL] dividing by zero returns 0 instead of crashing" << endl; }

    total++;
    if (applyDiscountScaled(1000, 2500) == 750) { passed++; cout << "[PASS] 25% off 1000 cents is 750 cents" << endl; }
    else { cout << "[FAIL] 25% off 1000 cents is 750 cents: got " << applyDiscountScaled(1000, 2500) << endl; }

    total++;
    if (applyDiscountScaled(1999, 0) == 1999) { passed++; cout << "[PASS] a 0% discount leaves the price unchanged" << endl; }
    else { cout << "[FAIL] a 0% discount leaves the price unchanged: got " << applyDiscountScaled(1999, 0) << endl; }

    total++;
    if (applyDiscountScaled(1000, 10000) == 0) { passed++; cout << "[PASS] a 100% discount brings the price to 0" << endl; }
    else { cout << "[FAIL] a 100% discount brings the price to 0: got " << applyDiscountScaled(1000, 10000) << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-014',
  title: 'Integer-Only Percentage Calculator',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'systems',
  category: 'Fixed-Point Numerics',
  tags: ['fixed-point', 'integer-math'],
  prompt: 'Compute percentages (and apply a percentage discount to a price) using only integer arithmetic, scaled by 100 for two extra digits of precision — no floats anywhere.',
  hints: [
    '`(part * 10000) / whole` — scaling by 10000 (not 100) buys you the percentage AND its two decimal places in one integer: half is `5000`, meaning "50.00%."',
    'Multiply by the scale factor BEFORE dividing — `part / whole` first would already have truncated to 0 for most fractions, throwing away the precision you\'re trying to keep.',
    'Guard the zero-whole case first: `if (whole == 0) return 0;` — before attempting the division.',
    '`applyDiscountScaled`: compute the discount amount first (`(priceCents * discountPercentScaled) / 10000`), then subtract it from the original price — don\'t try to compute the discounted price in one combined expression.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('percent.cpp', PERCENT_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('percent.cpp', PERCENT_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Integer-Only Percentage Calculator', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
