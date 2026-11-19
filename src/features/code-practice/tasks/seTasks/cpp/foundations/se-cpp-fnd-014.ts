import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Math Toolkit

A deeper multi-file chain than the earlier two-file tasks: \`geometry.cpp\` (yours to edit)
\`#include\`s BOTH \`constants.h\` (shared values) AND \`basic_ops.cpp\` (given helper functions), and
\`main.cpp\` then includes \`geometry.cpp\` on top of that — three files deep. The interpreter still
combines everything into one translation unit before running (see the Run panel's note), but the
\`#include\` graph itself is real, and getting it right matters as soon as more than two files are
involved.
`;

const CONSTANTS_H = `// Shared constants for the math toolkit.
const double PI_APPROX = 3.14159;
`;

const BASIC_OPS = `int addInts(int a, int b) {
    return a + b;
}

int multiplyInts(int a, int b) {
    return a * b;
}
`;

const GEOMETRY_STARTER = `#include "constants.h"
#include "basic_ops.cpp"

double circleArea(int radius) {
    // TODO: return PI_APPROX * radius * radius — but compute radius * radius by calling
    // multiplyInts(radius, radius) from basic_ops.cpp, not with the * operator directly.
    return 0.0;
}

int rectanglePerimeter(int width, int height) {
    // TODO: return 2 * (width + height) — but compute width + height by calling
    // addInts(width, height) from basic_ops.cpp, not with the + operator directly.
    return 0;
}
`;

const GEOMETRY_SOLUTION = `#include "constants.h"
#include "basic_ops.cpp"

double circleArea(int radius) {
    return PI_APPROX * multiplyInts(radius, radius);
}

int rectanglePerimeter(int width, int height) {
    return 2 * addInts(width, height);
}
`;

const MAIN_CPP = `#include <iostream>
#include "geometry.cpp"
using namespace std;

int main() {
    cout << "circle area: " << circleArea(3) << endl;
    cout << "rect perimeter: " << rectanglePerimeter(4, 5) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "geometry.cpp"
using namespace std;

bool close(double a, double b) {
    double diff = a - b;
    if (diff < 0) diff = -diff;
    return diff < 0.001;
}

int main() {
    int passed = 0, total = 0;

    total++;
    if (close(circleArea(3), 28.27431)) { passed++; cout << "[PASS] circle area for radius 3" << endl; }
    else { cout << "[FAIL] circle area for radius 3: got " << circleArea(3) << ", expected ~28.27" << endl; }

    total++;
    if (close(circleArea(1), PI_APPROX)) { passed++; cout << "[PASS] circle area for radius 1 equals pi" << endl; }
    else { cout << "[FAIL] circle area for radius 1 equals pi" << endl; }

    total++;
    if (close(circleArea(0), 0.0)) { passed++; cout << "[PASS] circle area for radius 0" << endl; }
    else { cout << "[FAIL] circle area for radius 0" << endl; }

    total++;
    if (rectanglePerimeter(4, 5) == 18) { passed++; cout << "[PASS] rectangle perimeter" << endl; }
    else { cout << "[FAIL] rectangle perimeter: got " << rectanglePerimeter(4, 5) << ", expected 18" << endl; }

    total++;
    if (rectanglePerimeter(1, 1) == 4) { passed++; cout << "[PASS] perimeter of a unit square" << endl; }
    else { cout << "[FAIL] perimeter of a unit square" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-014',
  title: 'Math Toolkit',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Multi-File Organization',
  tags: ['includes', 'modules'],
  prompt: 'Implement two geometry functions in geometry.cpp that reuse shared constants and helper functions pulled in from two OTHER given files — a three-file-deep include chain.',
  hints: [
    'The two `#include`s at the top of geometry.cpp are already there — `PI_APPROX`, `addInts`, and `multiplyInts` are all available to you without writing them yourself.',
    '`circleArea` should call `multiplyInts(radius, radius)` for the squaring step, then multiply that result by `PI_APPROX`.',
    '`rectanglePerimeter` should call `addInts(width, height)` for the sum, then multiply by 2.',
    "main.cpp only includes geometry.cpp — it never mentions constants.h or basic_ops.cpp directly, because geometry.cpp's own includes already pull those in.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('constants.h', CONSTANTS_H, { editable: false }),
    pf('basic_ops.cpp', BASIC_OPS, { editable: false }),
    pf('geometry.cpp', GEOMETRY_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('constants.h', CONSTANTS_H, { editable: false }),
    pf('basic_ops.cpp', BASIC_OPS, { editable: false }),
    pf('geometry.cpp', GEOMETRY_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Math Toolkit', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
