import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# XOR Checksum

The simplest checksum there is: XOR every byte together. Cheap enough to compute on every packet in
real embedded/networking code, and — like real checksums — it can't catch every possible
corruption, just most single-byte errors. Compute it, and verify a buffer against an expected value.
`;

const CHECKSUM_STARTER = `unsigned char computeChecksum(const unsigned char* buffer, int bufferLen) {
    // TODO: XOR every byte in buffer together (starting from 0) and return the result.
    return 0;
}

bool verifyChecksum(const unsigned char* buffer, int bufferLen, unsigned char expected) {
    // TODO: return true if computeChecksum(buffer, bufferLen) == expected.
    return false;
}
`;

const CHECKSUM_SOLUTION = `unsigned char computeChecksum(const unsigned char* buffer, int bufferLen) {
    unsigned char checksum = 0;
    for (int i = 0; i < bufferLen; i++) {
        checksum ^= buffer[i];
    }
    return checksum;
}

bool verifyChecksum(const unsigned char* buffer, int bufferLen, unsigned char expected) {
    return computeChecksum(buffer, bufferLen) == expected;
}
`;

const MAIN_CPP = `#include <iostream>
#include "checksum.cpp"
using namespace std;

int main() {
    unsigned char buf[3] = {0x01, 0x02, 0x03};
    unsigned char sum = computeChecksum(buf, 3);
    cout << "checksum: " << (int)sum << endl;
    cout << "verifies: " << (verifyChecksum(buf, 3, sum) ? "true" : "false") << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "checksum.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    unsigned char buf1[3] = {0x01, 0x02, 0x03};
    total++;
    if (computeChecksum(buf1, 3) == 0x00) { passed++; cout << "[PASS] 1 ^ 2 ^ 3 == 0" << endl; }
    else { cout << "[FAIL] 1 ^ 2 ^ 3 == 0: got " << (int)computeChecksum(buf1, 3) << endl; }

    unsigned char buf2[4] = {0xFF, 0x0F, 0x01, 0x01};
    total++;
    if (computeChecksum(buf2, 4) == 0xF0) { passed++; cout << "[PASS] mixed bytes XOR correctly" << endl; }
    else { cout << "[FAIL] mixed bytes XOR correctly: got " << (int)computeChecksum(buf2, 4) << ", expected " << (int)0xF0 << endl; }

    unsigned char single[1];
    single[0] = 0x42;
    total++;
    if (computeChecksum(single, 1) == 0x42) { passed++; cout << "[PASS] a single byte is its own checksum" << endl; }
    else { cout << "[FAIL] a single byte is its own checksum" << endl; }

    unsigned char empty[1];
    total++;
    if (computeChecksum(empty, 0) == 0x00) { passed++; cout << "[PASS] an empty buffer checksums to 0" << endl; }
    else { cout << "[FAIL] an empty buffer checksums to 0" << endl; }

    total++;
    if (verifyChecksum(buf2, 4, 0xF0) == true) { passed++; cout << "[PASS] verifyChecksum accepts the correct value" << endl; }
    else { cout << "[FAIL] verifyChecksum accepts the correct value" << endl; }

    total++;
    if (verifyChecksum(buf2, 4, 0x00) == false) { passed++; cout << "[PASS] verifyChecksum rejects a wrong value" << endl; }
    else { cout << "[FAIL] verifyChecksum rejects a wrong value" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-005',
  title: 'XOR Checksum',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'systems',
  category: 'Checksums & Hashing',
  tags: ['bitwise', 'checksums'],
  prompt: "Compute an XOR checksum across a buffer, then write a verify function that checks a buffer against an expected checksum — real (if simple) integrity checking.",
  hints: [
    'Start `checksum = 0` and XOR (`^=`) every byte into it in a single `for` loop — order doesn\'t matter for XOR, only that every byte gets included exactly once.',
    'A single-byte buffer checksums to that byte itself — XORing 0 with anything returns that thing unchanged, so this falls out of the loop naturally without any special case.',
    'An empty buffer (`bufferLen == 0`) never enters the loop at all, leaving the checksum at its starting value of 0.',
    '`verifyChecksum` is a one-line wrapper: recompute the checksum and compare it to `expected` — no separate verification logic needed.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('checksum.cpp', CHECKSUM_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('checksum.cpp', CHECKSUM_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'XOR Checksum', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
