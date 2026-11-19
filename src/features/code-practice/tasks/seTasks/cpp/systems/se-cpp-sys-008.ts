import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Overwrite-Mode Ring Buffer

A logging/telemetry-style ring buffer: instead of rejecting a push once full (like the earlier ring
buffer task), it silently overwrites the OLDEST entry to make room — you never lose the newest data,
only the oldest, which is exactly the tradeoff a fixed-size log-tail or sensor history needs.
`;

const RING_STARTER = `#define CAPACITY 4

int ringData[CAPACITY];
int ringHead = 0;
int ringTail = 0;
int ringCount = 0;

void ringPush(int value) {
    // TODO: store value at ringData[ringTail], advance ringTail = (ringTail + 1) % CAPACITY.
    // If the ring was ALREADY full (ringCount == CAPACITY) before this push, the oldest entry just
    // got overwritten — advance ringHead the same way too, so it no longer points at the
    // (now-gone) oldest entry. Otherwise, increment ringCount.
}

int ringSize() {
    // TODO: return ringCount.
    return 0;
}

bool ringPop(int* outValue) {
    // TODO: if ringCount == 0, return false. Otherwise set *outValue = ringData[ringHead], advance
    // ringHead = (ringHead + 1) % CAPACITY, decrement ringCount, return true.
    return false;
}
`;

const RING_SOLUTION = `#define CAPACITY 4

int ringData[CAPACITY];
int ringHead = 0;
int ringTail = 0;
int ringCount = 0;

void ringPush(int value) {
    bool wasFull = (ringCount == CAPACITY);
    ringData[ringTail] = value;
    ringTail = (ringTail + 1) % CAPACITY;
    if (wasFull) {
        ringHead = (ringHead + 1) % CAPACITY;
    } else {
        ringCount++;
    }
}

int ringSize() {
    return ringCount;
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
    for (int i = 1; i <= 6; i++) ringPush(i);
    cout << "size: " << ringSize() << endl;
    int value;
    ringPop(&value);
    cout << "oldest remaining: " << value << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "ring.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;
    int value;

    ringPush(1);
    ringPush(2);
    total++;
    if (ringSize() == 2) { passed++; cout << "[PASS] size tracks pushes below capacity" << endl; }
    else { cout << "[FAIL] size tracks pushes below capacity: got " << ringSize() << endl; }

    ringPush(3);
    ringPush(4);
    total++;
    if (ringSize() == 4) { passed++; cout << "[PASS] size caps at CAPACITY once full" << endl; }
    else { cout << "[FAIL] size caps at CAPACITY once full: got " << ringSize() << endl; }

    ringPush(5);
    total++;
    if (ringSize() == 4) { passed++; cout << "[PASS] pushing beyond capacity does not grow size further" << endl; }
    else { cout << "[FAIL] pushing beyond capacity does not grow size further: got " << ringSize() << endl; }

    ringPop(&value);
    total++;
    if (value == 2) { passed++; cout << "[PASS] the overwritten entry (1) is really gone — oldest surviving is 2" << endl; }
    else { cout << "[FAIL] the overwritten entry (1) is really gone: got " << value << ", expected 2" << endl; }

    ringPop(&value);
    ringPop(&value);
    total++;
    if (value == 4) { passed++; cout << "[PASS] remaining order after the overwrite is still correct" << endl; }
    else { cout << "[FAIL] remaining order after the overwrite is still correct: got " << value << ", expected 4" << endl; }

    ringPop(&value);
    total++;
    if (value == 5) { passed++; cout << "[PASS] the newest pushed value survives and comes out last" << endl; }
    else { cout << "[FAIL] the newest pushed value survives and comes out last: got " << value << ", expected 5" << endl; }

    total++;
    if (ringSize() == 0) { passed++; cout << "[PASS] size returns to 0 once fully drained" << endl; }
    else { cout << "[FAIL] size returns to 0 once fully drained: got " << ringSize() << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-008',
  title: 'Overwrite-Mode Ring Buffer',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'systems',
  category: 'Ring Buffers',
  tags: ['ring-buffer', 'arrays'],
  prompt: 'Build a ring buffer that overwrites its oldest entry instead of rejecting a push once full — the shape a fixed-size log tail or sensor history buffer needs.',
  hints: [
    'Check whether the ring was ALREADY full BEFORE writing the new value — `bool wasFull = (ringCount == CAPACITY);` — you need to know this to decide what happens to `ringHead`.',
    'The write itself and advancing `ringTail` happen unconditionally, full or not — only what happens to `ringHead`/`ringCount` afterward depends on `wasFull`.',
    'If it was already full, the value that used to be at the old `ringTail` position (now overwritten) WAS the oldest entry — so `ringHead` has to advance too, to stop pointing at data that no longer exists.',
    'If it wasn\'t full, nothing was overwritten — just grow `ringCount` by one, same as the reject-when-full version.',
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
  targets: [{ id: 'main', label: 'Overwrite-Mode Ring Buffer', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
