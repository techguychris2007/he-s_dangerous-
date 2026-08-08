import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Pointer Basics

Pointers are the only by-reference mechanism this interpreter supports (no C++ references at all —
see the Run panel's note). The classic pointer-swap function, plus reading an array through a raw
pointer instead of \`[]\` indexing.
`;

const SOLUTION_CPP_STARTER = `void swapInts(int* a, int* b) {
    // TODO: swap the values POINTED TO by a and b (not the pointers themselves).
}

int pointerWalk(int* arr, int index) {
    // TODO: return the value at arr[index], but using pointer arithmetic (*(arr + index)) instead
    // of the [] operator.
    return 0;
}
`;

const SOLUTION_CPP_SOLUTION = `void swapInts(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int pointerWalk(int* arr, int index) {
    return *(arr + index);
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int x = 1, y = 2;
    swapInts(&x, &y);
    cout << "x=" << x << " y=" << y << endl;
    int arr[4] = {10, 20, 30, 40};
    cout << "pointerWalk(arr, 2): " << pointerWalk(arr, 2) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    int x = 1, y = 2;
    swapInts(&x, &y);
    total++;
    if (x == 2 && y == 1) { passed++; cout << "[PASS] swapInts swaps values" << endl; }
    else { cout << "[FAIL] swapInts swaps values: got x=" << x << " y=" << y << endl; }

    int a = 5, b = 5;
    swapInts(&a, &b);
    total++;
    if (a == 5 && b == 5) { passed++; cout << "[PASS] swapping equal values is a no-op" << endl; }
    else { cout << "[FAIL] swapping equal values is a no-op" << endl; }

    int arr[5] = {10, 20, 30, 40, 50};
    total++;
    if (pointerWalk(arr, 0) == 10) { passed++; cout << "[PASS] pointerWalk at index 0" << endl; }
    else { cout << "[FAIL] pointerWalk at index 0" << endl; }

    total++;
    if (pointerWalk(arr, 2) == 30) { passed++; cout << "[PASS] pointerWalk at index 2" << endl; }
    else { cout << "[FAIL] pointerWalk at index 2: got " << pointerWalk(arr, 2) << ", expected 30" << endl; }

    total++;
    if (pointerWalk(arr, 4) == 50) { passed++; cout << "[PASS] pointerWalk at last index" << endl; }
    else { cout << "[FAIL] pointerWalk at last index" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-008',
  title: 'Pointer Basics',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Pointers',
  tags: ['pointers', 'dereferencing'],
  prompt: 'The classic pointer-swap function, plus reading an array element through pointer arithmetic instead of the [] operator.',
  hints: [
    '`*a` and `*b` dereference the pointers to get at the actual int values — swap those, exactly like swapping two variables, just through an extra `*`.',
    "`int temp = *a; *a = *b; *b = temp;` is the whole function — three lines, same shape as any variable swap.",
    '`*(arr + index)` is literally what `arr[index]` compiles down to — pointer arithmetic first (`arr + index` moves the pointer forward by `index` elements), then dereference with `*`.',
    'An array name used as a pointer already points at its first element, so `arr + 0` is just `arr` itself.',
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
  targets: [{ id: 'main', label: 'Pointer Basics', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
