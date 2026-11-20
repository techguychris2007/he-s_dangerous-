import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Bit Packing

Combine two bytes into one 16-bit-ish value with shifts, then pull them back apart — the same
technique real binary protocols and file formats use to pack multiple fields into one integer.

(Watch the type of what you're shifting: this interpreter does NOT automatically widen an
\`unsigned char\` to \`int\` before a \`<<\`, so \`high << 8\` on a byte-sized value can overflow its own
narrow type before the shift ever produces something meaningful. Cast to \`int\` first.)
`;

const SOLUTION_CPP_STARTER = `int packBytes(unsigned char high, unsigned char low) {
    // TODO: combine high and low into one int where high occupies bits 8-15 and low occupies bits
    // 0-7. packBytes(0x01, 0x02) -> 0x0102 (258 in decimal).
    // Cast high to (int) BEFORE shifting — shifting it while it's still unsigned char can overflow
    // that narrow 8-bit type instead of producing the wider result you want.
    return 0;
}

unsigned char getByte(int packed, int index) {
    // TODO: index 0 means the LOW byte (bits 0-7), index 1 means the HIGH byte (bits 8-15).
    // getByte(0x0102, 0) -> 0x02, getByte(0x0102, 1) -> 0x01.
    return 0;
}
`;

const SOLUTION_CPP_SOLUTION = `int packBytes(unsigned char high, unsigned char low) {
    return ((int)high << 8) | low;
}

unsigned char getByte(int packed, int index) {
    if (index == 0) return packed & 0xFF;
    return (packed >> 8) & 0xFF;
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int packed = packBytes(0x01, 0x02);
    cout << "packed: " << packed << endl;
    cout << "low: " << (int)getByte(packed, 0) << ", high: " << (int)getByte(packed, 1) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (packBytes(0x01, 0x02) == 0x0102) { passed++; cout << "[PASS] packs high and low bytes" << endl; }
    else { cout << "[FAIL] packs high and low bytes: got " << packBytes(0x01, 0x02) << ", expected " << 0x0102 << endl; }

    total++;
    if (packBytes(0xFF, 0xFF) == 0xFFFF) { passed++; cout << "[PASS] packs max bytes" << endl; }
    else { cout << "[FAIL] packs max bytes: got " << packBytes(0xFF, 0xFF) << ", expected " << 0xFFFF << endl; }

    total++;
    if (packBytes(0x00, 0x00) == 0) { passed++; cout << "[PASS] packs zero bytes" << endl; }
    else { cout << "[FAIL] packs zero bytes" << endl; }

    total++;
    if (getByte(0x0102, 0) == 0x02) { passed++; cout << "[PASS] extracts low byte" << endl; }
    else { cout << "[FAIL] extracts low byte: got " << (int)getByte(0x0102, 0) << ", expected " << 0x02 << endl; }

    total++;
    if (getByte(0x0102, 1) == 0x01) { passed++; cout << "[PASS] extracts high byte" << endl; }
    else { cout << "[FAIL] extracts high byte: got " << (int)getByte(0x0102, 1) << ", expected " << 0x01 << endl; }

    total++;
    int roundTrip = packBytes(0x12, 0x34);
    if (getByte(roundTrip, 1) == 0x12 && getByte(roundTrip, 0) == 0x34) {
        passed++; cout << "[PASS] pack then unpack round-trips" << endl;
    } else {
        cout << "[FAIL] pack then unpack round-trips" << endl;
    }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-012',
  title: 'Bit Packing',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Bit Manipulation',
  tags: ['bitwise', 'shifts'],
  prompt: 'Pack two bytes into one integer with shifts and OR, then unpack them back apart — the technique behind real binary protocols and file formats.',
  hints: [
    '`((int)high << 8)` moves the high byte up into bits 8-15, leaving the low 8 bits as zero — then `| low` fills those in. Cast to `int` before shifting; shifting `high` while it\'s still `unsigned char` can overflow that narrow type.',
    '`0xFF` is a byte-shaped mask (binary 11111111) — `packed & 0xFF` keeps only the lowest 8 bits, discarding everything above them.',
    'For the high byte, shift DOWN first, then mask: `(packed >> 8) & 0xFF` — masking is still needed in case there were even higher bits set.',
    'A round-trip test (pack, then unpack both bytes back out) is the fastest way to sanity-check both functions agree with each other.',
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
  targets: [{ id: 'main', label: 'Bit Packing', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
