import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Fixed-Slot Object Pool

Unlike the bump allocator, this one supports individual frees: a fixed number of numbered "slots"
handed out and returned via a simple free-list (a stack of available slot numbers) — the pattern
real game engines and embedded systems use to avoid allocating/freeing memory at all once startup
is done, reusing the same fixed slots over and over.
`;

const POOL_STARTER = `#define POOL_SIZE 4

bool slotInUse[POOL_SIZE];

int poolAcquire() {
    // TODO: find the lowest-numbered slot (0 to POOL_SIZE-1) where slotInUse[i] is false, mark it
    // true, and return i. Return -1 if every slot is already in use.
    return -1;
}

bool poolRelease(int slot) {
    // TODO: if slot is out of range (< 0 or >= POOL_SIZE), or slotInUse[slot] is already false
    // (double-free), return false. Otherwise mark slotInUse[slot] = false and return true.
    return false;
}

int poolFreeCount() {
    // TODO: return how many slots currently have slotInUse[i] == false.
    return 0;
}
`;

const POOL_SOLUTION = `#define POOL_SIZE 4

bool slotInUse[POOL_SIZE];

int poolAcquire() {
    for (int i = 0; i < POOL_SIZE; i++) {
        if (!slotInUse[i]) {
            slotInUse[i] = true;
            return i;
        }
    }
    return -1;
}

bool poolRelease(int slot) {
    if (slot < 0 || slot >= POOL_SIZE) return false;
    if (!slotInUse[slot]) return false;
    slotInUse[slot] = false;
    return true;
}

int poolFreeCount() {
    int count = 0;
    for (int i = 0; i < POOL_SIZE; i++) {
        if (!slotInUse[i]) count++;
    }
    return count;
}
`;

const MAIN_CPP = `#include <iostream>
#include "pool.cpp"
using namespace std;

int main() {
    int a = poolAcquire();
    int b = poolAcquire();
    cout << "a=" << a << " b=" << b << " free=" << poolFreeCount() << endl;
    poolRelease(a);
    cout << "after release, free=" << poolFreeCount() << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "pool.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (poolFreeCount() == 4) { passed++; cout << "[PASS] starts with every slot free" << endl; }
    else { cout << "[FAIL] starts with every slot free: got " << poolFreeCount() << endl; }

    total++;
    if (poolAcquire() == 0) { passed++; cout << "[PASS] first acquire returns the lowest free slot" << endl; }
    else { cout << "[FAIL] first acquire returns the lowest free slot" << endl; }

    total++;
    if (poolAcquire() == 1) { passed++; cout << "[PASS] second acquire returns the next lowest" << endl; }
    else { cout << "[FAIL] second acquire returns the next lowest" << endl; }

    total++;
    if (poolFreeCount() == 2) { passed++; cout << "[PASS] free count reflects two acquired slots" << endl; }
    else { cout << "[FAIL] free count reflects two acquired slots: got " << poolFreeCount() << endl; }

    poolAcquire();
    poolAcquire();
    total++;
    if (poolAcquire() == -1) { passed++; cout << "[PASS] acquiring from an exhausted pool fails" << endl; }
    else { cout << "[FAIL] acquiring from an exhausted pool fails" << endl; }

    total++;
    if (poolRelease(1) == true) { passed++; cout << "[PASS] releasing an in-use slot succeeds" << endl; }
    else { cout << "[FAIL] releasing an in-use slot succeeds" << endl; }

    total++;
    if (poolRelease(1) == false) { passed++; cout << "[PASS] releasing an already-free slot (double-free) fails" << endl; }
    else { cout << "[FAIL] releasing an already-free slot (double-free) fails" << endl; }

    total++;
    if (poolRelease(99) == false) { passed++; cout << "[PASS] releasing an out-of-range slot fails" << endl; }
    else { cout << "[FAIL] releasing an out-of-range slot fails" << endl; }

    total++;
    if (poolAcquire() == 1) { passed++; cout << "[PASS] a released slot becomes available to acquire again" << endl; }
    else { cout << "[FAIL] a released slot becomes available to acquire again" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-010',
  title: 'Fixed-Slot Object Pool',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'systems',
  category: 'Arena Allocators',
  tags: ['memory', 'allocators'],
  prompt: 'Implement acquire/release over a fixed number of numbered slots — a simple used/free flag array standing in for a real object pool, including rejecting a double-free.',
  hints: [
    '`poolAcquire` scans from slot 0 upward and returns the first one where `slotInUse[i]` is false — marking it true along the way, before returning.',
    'If the loop finishes without finding a free slot, `return -1;` after it — every slot is taken.',
    '`poolRelease` has TWO separate reasons to fail: an out-of-range index, or a slot that\'s already free (a double-free) — check both before actually clearing the flag.',
    '`poolFreeCount` is a simple counting loop over every slot — count how many have `slotInUse[i] == false`.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('pool.cpp', POOL_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('pool.cpp', POOL_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Fixed-Slot Object Pool', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
