import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Pointer-Based Array Ops

Walk an array using pointer increment (\`p++\`) instead of \`[]\` indexing, and copy one array's
contents into another entirely through pointer arithmetic.

(This interpreter's pointer support has a real gap worth knowing about: comparing two pointers with
anything other than \`==\` — \`!=\`, \`<\`, or subtracting one pointer from another — crashes it outright.
So instead of the usual \`for (int* p = start; p != end; p++)\` idiom, the loop below pairs \`p++\` with
a plain \`int\` counter instead of a second pointer.)
`;

const SOLUTION_CPP_STARTER = `int maxViaPointer(int* arr, int n) {
    // TODO: return the largest value among arr's first n elements. Walk the array using pointer
    // increment (start a pointer at arr, p++ each step) rather than arr[i] indexing — but count
    // your steps with a plain int, not by comparing the pointer to an end pointer.
    return 0;
}

void copyArray(int* dest, const int* src, int n) {
    // TODO: copy the first n elements of src into dest, using pointer arithmetic (not [] indexing).
}
`;

const SOLUTION_CPP_SOLUTION = `int maxViaPointer(int* arr, int n) {
    int best = *arr;
    int* p = arr;
    for (int i = 0; i < n; i++) {
        if (*p > best) best = *p;
        p++;
    }
    return best;
}

void copyArray(int* dest, const int* src, int n) {
    for (int i = 0; i < n; i++) {
        *(dest + i) = *(src + i);
    }
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int arr[5] = {3, 7, 2, 9, 4};
    cout << "max: " << maxViaPointer(arr, 5) << endl;
    int dest[5];
    copyArray(dest, arr, 5);
    for (int i = 0; i < 5; i++) cout << dest[i] << " ";
    cout << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    int arr[5] = {3, 7, 2, 9, 4};
    total++;
    if (maxViaPointer(arr, 5) == 9) { passed++; cout << "[PASS] finds the max" << endl; }
    else { cout << "[FAIL] finds the max: got " << maxViaPointer(arr, 5) << ", expected 9" << endl; }

    int single[1];
    single[0] = 42;
    total++;
    if (maxViaPointer(single, 1) == 42) { passed++; cout << "[PASS] max of a single-element array" << endl; }
    else { cout << "[FAIL] max of a single-element array" << endl; }

    int partial[5] = {1, 100, 2, 3, 4};
    total++;
    if (maxViaPointer(partial, 2) == 100) { passed++; cout << "[PASS] respects the count boundary" << endl; }
    else { cout << "[FAIL] respects the count boundary: got " << maxViaPointer(partial, 2) << ", expected 100" << endl; }

    int src[4] = {5, 6, 7, 8};
    int dest[4];
    copyArray(dest, src, 4);
    total++;
    if (dest[0] == 5 && dest[1] == 6 && dest[2] == 7 && dest[3] == 8) {
        passed++; cout << "[PASS] copies all elements" << endl;
    } else {
        cout << "[FAIL] copies all elements" << endl;
    }

    src[0] = 999;
    total++;
    if (dest[0] == 5) { passed++; cout << "[PASS] copy is independent of the source afterward" << endl; }
    else { cout << "[FAIL] copy is independent of the source afterward" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-009',
  title: 'Pointer-Based Array Ops',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'foundations',
  category: 'Pointers',
  tags: ['pointers', 'pointer-arithmetic'],
  prompt: "Walk an array with pointer increment instead of indexing, and copy one array into another entirely through pointer arithmetic. Note: this interpreter can't compare two pointers with != or <, so the walk pairs p++ with an int counter instead of an end pointer.",
  hints: [
    'Start a pointer at the array\'s first element (`int* p = arr;`), then step it forward one element at a time with `p++` inside the loop.',
    'Use a plain `for (int i = 0; i < n; i++)` to count the steps — comparing `p` against a second pointer (`p != end`) is NOT supported here, only `p == other` works.',
    'Compare `*p > best` each step and update `best` — same logic as an index-based max, just through a pointer.',
    '`*(dest + i) = *(src + i);` inside a plain `for (int i = 0; i < n; i++)` loop copies element by element — it\'s the pointer-arithmetic spelling of `dest[i] = src[i];`.',
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
  targets: [{ id: 'main', label: 'Pointer-Based Array Ops', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
