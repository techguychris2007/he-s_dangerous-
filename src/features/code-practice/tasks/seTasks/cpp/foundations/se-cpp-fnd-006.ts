import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Array Manipulation

Two functions that operate on a plain \`int\` array by index: reversing it in place (no return
value, the caller's array itself changes) and a linear search for a value.
`;

const SOLUTION_CPP_STARTER = `void reverseArray(int* arr, int n) {
    // TODO: reverse arr's elements IN PLACE (don't return a new array — mutate arr itself).
    // Swap the first and last elements, then the second and second-to-last, working inward.
}

bool containsValue(int* arr, int n, int target) {
    // TODO: return true if target appears anywhere in arr[0..n-1], false otherwise.
    return false;
}
`;

const SOLUTION_CPP_SOLUTION = `void reverseArray(int* arr, int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}

bool containsValue(int* arr, int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) return true;
    }
    return false;
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    reverseArray(arr, 5);
    for (int i = 0; i < 5; i++) cout << arr[i] << " ";
    cout << endl;
    cout << "contains 3: " << (containsValue(arr, 5, 3) ? "true" : "false") << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    int arr[5] = {1, 2, 3, 4, 5};
    reverseArray(arr, 5);
    total++;
    if (arr[0] == 5 && arr[1] == 4 && arr[2] == 3 && arr[3] == 2 && arr[4] == 1) {
        passed++; cout << "[PASS] reverses odd-length array" << endl;
    } else {
        cout << "[FAIL] reverses odd-length array: got " << arr[0] << " " << arr[1] << " " << arr[2] << " " << arr[3] << " " << arr[4] << endl;
    }

    int arr2[4] = {10, 20, 30, 40};
    reverseArray(arr2, 4);
    total++;
    if (arr2[0] == 40 && arr2[3] == 10) { passed++; cout << "[PASS] reverses even-length array" << endl; }
    else { cout << "[FAIL] reverses even-length array" << endl; }

    int single[1];
    single[0] = 99;
    reverseArray(single, 1);
    total++;
    if (single[0] == 99) { passed++; cout << "[PASS] reversing a single element is a no-op" << endl; }
    else { cout << "[FAIL] reversing a single element is a no-op" << endl; }

    int data[5] = {3, 7, 2, 9, 4};
    total++;
    if (containsValue(data, 5, 9) == true) { passed++; cout << "[PASS] contains an existing value" << endl; }
    else { cout << "[FAIL] contains an existing value" << endl; }

    total++;
    if (containsValue(data, 5, 100) == false) { passed++; cout << "[PASS] does not contain a missing value" << endl; }
    else { cout << "[FAIL] does not contain a missing value" << endl; }

    total++;
    if (containsValue(data, 5, 3) == true) { passed++; cout << "[PASS] contains the first element" << endl; }
    else { cout << "[FAIL] contains the first element" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-006',
  title: 'Array Manipulation',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Arrays & C-Strings',
  tags: ['arrays', 'in-place'],
  prompt: 'Reverse an int array in place with a two-pointer swap, and write a linear search that checks whether a value is present.',
  hints: [
    'Two indices moving toward each other: `left = 0`, `right = n - 1`, `while (left < right)` swap and step both inward.',
    'A 3-line swap needs a temp variable: `int temp = arr[left]; arr[left] = arr[right]; arr[right] = temp;`.',
    'A size-1 array should come back unchanged — `left < right` is already false when `n == 1` (0 < 0), so the loop correctly never runs.',
    '`containsValue` is a plain linear scan: `for (int i = 0; i < n; i++) if (arr[i] == target) return true;`, then `return false;` after the loop.',
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
  targets: [{ id: 'main', label: 'Array Manipulation', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
