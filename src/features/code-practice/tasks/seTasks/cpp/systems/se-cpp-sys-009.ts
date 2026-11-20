import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Bump Allocator

The simplest possible memory allocator: a fixed block of bytes and one "high-water mark" offset.
Allocating just moves the mark forward by however many bytes were requested; there's no way to free
an individual allocation, only reset everything back to the start at once — real embedded/game-engine
code uses exactly this for "allocate a bunch of stuff, then throw it all away at the end of the frame."

(This interpreter has no \`new\`/\`malloc\` at all — see the Run panel's note — so "allocating" here
means handing back an OFFSET into a fixed array, not a real pointer.)
`;

const ARENA_STARTER = `#define ARENA_SIZE 64

unsigned char arena[ARENA_SIZE];
int bumpOffset = 0;

int arenaAlloc(int numBytes) {
    // TODO: if there isn't enough room left (bumpOffset + numBytes > ARENA_SIZE), return -1
    // WITHOUT changing bumpOffset. Otherwise, remember the CURRENT bumpOffset (that's the start of
    // this allocation), advance bumpOffset by numBytes, and return the offset you remembered.
    return -1;
}

void arenaReset() {
    // TODO: set bumpOffset back to 0, freeing everything at once.
}

int arenaUsed() {
    // TODO: return how many bytes are currently allocated (bumpOffset).
    return 0;
}
`;

const ARENA_SOLUTION = `#define ARENA_SIZE 64

unsigned char arena[ARENA_SIZE];
int bumpOffset = 0;

int arenaAlloc(int numBytes) {
    if (bumpOffset + numBytes > ARENA_SIZE) return -1;
    int start = bumpOffset;
    bumpOffset += numBytes;
    return start;
}

void arenaReset() {
    bumpOffset = 0;
}

int arenaUsed() {
    return bumpOffset;
}
`;

const MAIN_CPP = `#include <iostream>
#include "arena.cpp"
using namespace std;

int main() {
    int a = arenaAlloc(10);
    int b = arenaAlloc(20);
    cout << "a=" << a << " b=" << b << " used=" << arenaUsed() << endl;
    arenaReset();
    cout << "after reset, used=" << arenaUsed() << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "arena.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (arenaAlloc(10) == 0) { passed++; cout << "[PASS] first allocation starts at offset 0" << endl; }
    else { cout << "[FAIL] first allocation starts at offset 0: got " << arenaAlloc(10) << endl; }

    total++;
    if (arenaAlloc(20) == 10) { passed++; cout << "[PASS] second allocation starts right after the first" << endl; }
    else { cout << "[FAIL] second allocation starts right after the first" << endl; }

    total++;
    if (arenaUsed() == 30) { passed++; cout << "[PASS] used bytes tracks total allocated" << endl; }
    else { cout << "[FAIL] used bytes tracks total allocated: got " << arenaUsed() << ", expected 30" << endl; }

    total++;
    if (arenaAlloc(100) == -1) { passed++; cout << "[PASS] an allocation too big to fit is rejected" << endl; }
    else { cout << "[FAIL] an allocation too big to fit is rejected" << endl; }

    total++;
    if (arenaUsed() == 30) { passed++; cout << "[PASS] a rejected allocation does not advance the bump offset" << endl; }
    else { cout << "[FAIL] a rejected allocation does not advance the bump offset: got " << arenaUsed() << endl; }

    total++;
    if (arenaAlloc(34) == 30) { passed++; cout << "[PASS] an allocation that exactly fills the remaining space succeeds" << endl; }
    else { cout << "[FAIL] an allocation that exactly fills the remaining space succeeds" << endl; }

    arenaReset();
    total++;
    if (arenaUsed() == 0) { passed++; cout << "[PASS] reset frees everything" << endl; }
    else { cout << "[FAIL] reset frees everything: got " << arenaUsed() << endl; }

    total++;
    if (arenaAlloc(5) == 0) { passed++; cout << "[PASS] allocation after reset starts from 0 again" << endl; }
    else { cout << "[FAIL] allocation after reset starts from 0 again" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-009',
  title: 'Bump Allocator',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'systems',
  category: 'Arena Allocators',
  tags: ['memory', 'allocators'],
  prompt: "Implement a bump allocator over a fixed byte array: alloc() hands back an offset and moves a high-water mark forward, reset() frees everything at once — no individual frees.",
  hints: [
    'Check `if (bumpOffset + numBytes > ARENA_SIZE) return -1;` FIRST — a rejected allocation must leave `bumpOffset` completely untouched.',
    'Save `bumpOffset` into a local variable BEFORE advancing it — that saved value is the start of this allocation, and what you return.',
    '`arenaReset()` is a single-line reset: `bumpOffset = 0;` — everything "allocated" before is simply overwritable now, nothing is explicitly cleared.',
    'An allocation that exactly uses up the remaining space should still succeed — the check is `>`, not `>=`, so `bumpOffset + numBytes == ARENA_SIZE` is a valid fit.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('arena.cpp', ARENA_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('arena.cpp', ARENA_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Bump Allocator', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
