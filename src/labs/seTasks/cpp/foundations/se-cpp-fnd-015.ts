import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Selection Sort

A full sorting algorithm implemented by hand on a plain int array — find the minimum of the
unsorted remainder and swap it into place, one position at a time.
`;

const SOLUTION_CPP_STARTER = `void selectionSort(int* arr, int n) {
    // TODO: sort arr IN PLACE, ascending, using selection sort: for each position i from 0 to n-2,
    // find the index of the smallest value in arr[i..n-1], then swap it into position i.
}

bool isSorted(int* arr, int n) {
    // TODO: return true if arr is sorted ascending (arr[i] <= arr[i+1] for every adjacent pair).
    return false;
}
`;

const SOLUTION_CPP_SOLUTION = `void selectionSort(int* arr, int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) minIndex = j;
        }
        int temp = arr[i];
        arr[i] = arr[minIndex];
        arr[minIndex] = temp;
    }
}

bool isSorted(int* arr, int n) {
    for (int i = 0; i < n - 1; i++) {
        if (arr[i] > arr[i + 1]) return false;
    }
    return true;
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int arr[5] = {5, 2, 8, 1, 9};
    selectionSort(arr, 5);
    for (int i = 0; i < 5; i++) cout << arr[i] << " ";
    cout << endl;
    cout << "isSorted: " << (isSorted(arr, 5) ? "true" : "false") << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    int arr[6] = {5, 2, 8, 1, 9, 3};
    selectionSort(arr, 6);
    total++;
    if (arr[0] == 1 && arr[1] == 2 && arr[2] == 3 && arr[3] == 5 && arr[4] == 8 && arr[5] == 9) {
        passed++; cout << "[PASS] sorts ascending" << endl;
    } else {
        cout << "[FAIL] sorts ascending: got " << arr[0] << " " << arr[1] << " " << arr[2] << " " << arr[3] << " " << arr[4] << " " << arr[5] << endl;
    }

    int already[4] = {1, 2, 3, 4};
    selectionSort(already, 4);
    total++;
    if (already[0] == 1 && already[3] == 4) { passed++; cout << "[PASS] already-sorted input stays sorted" << endl; }
    else { cout << "[FAIL] already-sorted input stays sorted" << endl; }

    int single[1];
    single[0] = 7;
    selectionSort(single, 1);
    total++;
    if (single[0] == 7) { passed++; cout << "[PASS] single-element array is a no-op" << endl; }
    else { cout << "[FAIL] single-element array is a no-op" << endl; }

    int dupes[5] = {3, 1, 3, 2, 1};
    selectionSort(dupes, 5);
    total++;
    if (dupes[0] == 1 && dupes[1] == 1 && dupes[2] == 2 && dupes[3] == 3 && dupes[4] == 3) {
        passed++; cout << "[PASS] handles duplicate values" << endl;
    } else {
        cout << "[FAIL] handles duplicate values" << endl;
    }

    int sortedArr[4] = {1, 2, 3, 4};
    total++;
    if (isSorted(sortedArr, 4) == true) { passed++; cout << "[PASS] isSorted true on sorted array" << endl; }
    else { cout << "[FAIL] isSorted true on sorted array" << endl; }

    int unsortedArr[4] = {1, 3, 2, 4};
    total++;
    if (isSorted(unsortedArr, 4) == false) { passed++; cout << "[PASS] isSorted false on unsorted array" << endl; }
    else { cout << "[FAIL] isSorted false on unsorted array" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-015',
  title: 'Selection Sort',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Algorithms by Hand',
  tags: ['sorting', 'algorithms'],
  prompt: 'Implement selection sort by hand on a raw int array, plus a checker that verifies an array is actually sorted.',
  hints: [
    'Outer loop `for (int i = 0; i < n - 1; i++)` fixes one position at a time; the last element needs no pass of its own, since everything else is already in place by then.',
    'Inner loop finds the SMALLEST remaining value\'s index (not the value itself) — track `minIndex`, starting at `i`, and update it whenever `arr[j] < arr[minIndex]`.',
    'After the inner loop, swap `arr[i]` and `arr[minIndex]` using a temp variable — same 3-line swap pattern as any other array swap.',
    '`isSorted` only needs to check adjacent pairs: if any `arr[i] > arr[i + 1]`, it\'s not sorted — otherwise it is.',
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
  targets: [{ id: 'main', label: 'Selection Sort', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
