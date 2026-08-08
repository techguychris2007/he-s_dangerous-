import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Fixed-Size Ring Buffer

A circular queue backed by a fixed array — \`head\`/\`tail\` indices wrap around with \`%\` instead of
the array ever growing, and a separate \`count\` tracks how full it is (since \`head == tail\` alone
can't tell empty from completely full). Rejects a push once full; rejects a pop once empty.
`;

const RING_STARTER = `#define CAPACITY 4

int ringData[CAPACITY];
int ringHead = 0;
int ringTail = 0;
int ringCount = 0;

bool ringPush(int value) {
    // TODO: if ringCount == CAPACITY, the buffer is full — return false, don't store anything.
    // Otherwise: store value at ringData[ringTail], advance ringTail = (ringTail + 1) % CAPACITY,
    // increment ringCount, return true.
    return false;
}

bool ringPop(int* outValue) {
    // TODO: if ringCount == 0, the buffer is empty — return false, don't touch *outValue.
    // Otherwise: set *outValue = ringData[ringHead], advance ringHead = (ringHead + 1) % CAPACITY,
    // decrement ringCount, return true.
    return false;
}
`;

const RING_SOLUTION = `#define CAPACITY 4

int ringData[CAPACITY];
int ringHead = 0;
int ringTail = 0;
int ringCount = 0;

bool ringPush(int value) {
    if (ringCount == CAPACITY) return false;
    ringData[ringTail] = value;
    ringTail = (ringTail + 1) % CAPACITY;
    ringCount++;
    return true;
}

bool ringPop(int* outValue) {
    if (ringCount == 0) return false;
    *outValue = ringData[ringHead];
    ringHead = (ringHead + 1) % CAPACITY;
    ringCount--;
    return true;
}
`;

const MAIN_CPP = `#include <iostream>
#include "ring.cpp"
using namespace std;

int main() {
    ringPush(10);
    ringPush(20);
    int value;
    ringPop(&value);
    cout << "popped: " << value << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "ring.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;
    int value;

    total++;
    if (ringPop(&value) == false) { passed++; cout << "[PASS] popping an empty ring fails" << endl; }
    else { cout << "[FAIL] popping an empty ring fails" << endl; }

    total++;
    if (ringPush(1) && ringPush(2) && ringPush(3) && ringPush(4)) { passed++; cout << "[PASS] fills to exactly CAPACITY" << endl; }
    else { cout << "[FAIL] fills to exactly CAPACITY" << endl; }

    total++;
    if (ringPush(5) == false) { passed++; cout << "[PASS] a push beyond capacity is rejected" << endl; }
    else { cout << "[FAIL] a push beyond capacity is rejected" << endl; }

    ringPop(&value);
    total++;
    if (value == 1) { passed++; cout << "[PASS] pop returns values in FIFO order" << endl; }
    else { cout << "[FAIL] pop returns values in FIFO order: got " << value << ", expected 1" << endl; }

    total++;
    if (ringPush(5) == true) { passed++; cout << "[PASS] a push after freeing a slot succeeds (wraps around)" << endl; }
    else { cout << "[FAIL] a push after freeing a slot succeeds (wraps around)" << endl; }

    ringPop(&value);
    ringPop(&value);
    ringPop(&value);
    total++;
    if (value == 4) { passed++; cout << "[PASS] FIFO order holds through the wrap-around" << endl; }
    else { cout << "[FAIL] FIFO order holds through the wrap-around: got " << value << ", expected 4" << endl; }

    ringPop(&value);
    total++;
    if (value == 5) { passed++; cout << "[PASS] the wrapped-in value comes out last, still in order" << endl; }
    else { cout << "[FAIL] the wrapped-in value comes out last, still in order: got " << value << ", expected 5" << endl; }

    total++;
    if (ringPop(&value) == false) { passed++; cout << "[PASS] the ring is empty again after draining it" << endl; }
    else { cout << "[FAIL] the ring is empty again after draining it" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-007',
  title: 'Fixed-Size Ring Buffer',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'systems',
  category: 'Ring Buffers',
  tags: ['ring-buffer', 'arrays'],
  prompt: 'Implement push/pop on a circular queue backed by a fixed array — indices wrap with %, a separate count distinguishes empty from full, push rejects once full, pop rejects once empty.',
  hints: [
    'Check the reject condition FIRST in both functions — `ringCount == CAPACITY` for push, `ringCount == 0` for pop — and return false immediately, before touching any data.',
    '`ringTail = (ringTail + 1) % CAPACITY;` is what makes the index wrap back to 0 instead of running off the end of the array — same pattern for `ringHead` in pop.',
    '`ringCount` is tracked completely separately from `ringHead`/`ringTail` — with only two indices, `head == tail` would be ambiguous between "totally empty" and "totally full," so the count is what actually answers that question.',
    'Push writes to `ringTail` then advances it; pop reads from `ringHead` then advances it — the two ends move independently, which is exactly what makes this FIFO (the oldest pushed value is always the next one popped).',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('ring.cpp', RING_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('ring.cpp', RING_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Fixed-Size Ring Buffer', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
