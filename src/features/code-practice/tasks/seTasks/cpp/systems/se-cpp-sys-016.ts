import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Mini Telemetry Protocol (Capstone)

Everything from this batch, combined into one real (if tiny) protocol: a stream of framed packets
\`[0xAA start byte][length][payload bytes...][XOR checksum]\`, walked one frame at a time. A frame
whose checksum doesn't match is corrupted — skipped, not counted toward the running total — but the
stream keeps going, because a real telemetry receiver can't afford to stop just because one packet
got garbled in transit.
`;

const TELEMETRY_STARTER = `const unsigned char START_BYTE = 0xAA;

int processTelemetry(const unsigned char* buffer, int bufferLen, int* outValidCount, int* outCorruptCount) {
    // TODO: walk buffer one frame at a time. Each frame is:
    //   [START_BYTE][length][length payload bytes][1 checksum byte]
    // At each position:
    //  - if buffer[pos] != START_BYTE, the stream is desynced — stop processing entirely (break
    //    out of the loop) and return whatever sum you've accumulated so far.
    //  - otherwise: length = buffer[pos + 1]. Compute the XOR of the length payload bytes
    //    (buffer[pos + 2] .. buffer[pos + 2 + length - 1]). Compare it to the checksum byte at
    //    buffer[pos + 2 + length].
    //     - if they match: add every payload byte to a running sum, and increment *outValidCount.
    //     - if they don't: increment *outCorruptCount instead (don't add anything to the sum).
    //  - either way (valid or corrupt), advance pos by (3 + length) — that's the total size of
    //    this frame (start + length byte + payload + checksum byte) — and continue to the next frame.
    // Return the running sum once the whole buffer has been walked (or the stream desynced).
    *outValidCount = 0;
    *outCorruptCount = 0;
    return 0;
}
`;

const TELEMETRY_SOLUTION = `const unsigned char START_BYTE = 0xAA;

int processTelemetry(const unsigned char* buffer, int bufferLen, int* outValidCount, int* outCorruptCount) {
    *outValidCount = 0;
    *outCorruptCount = 0;
    int sum = 0;
    int pos = 0;

    while (pos < bufferLen) {
        if (buffer[pos] != START_BYTE) break;

        int length = buffer[pos + 1];
        unsigned char checksum = 0;
        for (int i = 0; i < length; i++) {
            checksum ^= buffer[pos + 2 + i];
        }

        unsigned char storedChecksum = buffer[pos + 2 + length];
        if (checksum == storedChecksum) {
            for (int i = 0; i < length; i++) {
                sum += buffer[pos + 2 + i];
            }
            (*outValidCount)++;
        } else {
            (*outCorruptCount)++;
        }

        pos += 3 + length;
    }

    return sum;
}
`;

const MAIN_CPP = `#include <iostream>
#include "telemetry.cpp"
using namespace std;

int main() {
    unsigned char buf[9] = {0xAA, 2, 10, 20, 30, 0xAA, 1, 5, 5};
    int validCount, corruptCount;
    int sum = processTelemetry(buf, 9, &validCount, &corruptCount);
    cout << "sum=" << sum << " valid=" << validCount << " corrupt=" << corruptCount << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "telemetry.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;
    int validCount, corruptCount;

    unsigned char single[5] = {0xAA, 2, 10, 20, 30};
    int sum1 = processTelemetry(single, 5, &validCount, &corruptCount);
    total++;
    if (sum1 == 30) { passed++; cout << "[PASS] a single valid frame sums its payload" << endl; }
    else { cout << "[FAIL] a single valid frame sums its payload: got " << sum1 << ", expected 30" << endl; }
    total++;
    if (validCount == 1 && corruptCount == 0) { passed++; cout << "[PASS] one valid frame is counted correctly" << endl; }
    else { cout << "[FAIL] one valid frame is counted correctly: valid=" << validCount << " corrupt=" << corruptCount << endl; }

    unsigned char corrupted[6] = {0xAA, 3, 1, 2, 3, 99};
    int sum2 = processTelemetry(corrupted, 6, &validCount, &corruptCount);
    total++;
    if (sum2 == 0) { passed++; cout << "[PASS] a corrupted frame's payload is NOT added to the sum" << endl; }
    else { cout << "[FAIL] a corrupted frame's payload is NOT added to the sum: got " << sum2 << endl; }
    total++;
    if (validCount == 0 && corruptCount == 1) { passed++; cout << "[PASS] a bad checksum is counted as corrupt, not valid" << endl; }
    else { cout << "[FAIL] a bad checksum is counted as corrupt, not valid: valid=" << validCount << " corrupt=" << corruptCount << endl; }

    unsigned char stream[19] = {
        0xAA, 2, 10, 20, 30,
        0xAA, 1, 5, 5,
        0xAA, 3, 1, 2, 3, 99,
        0xAA, 1, 100, 100
    };
    int sum3 = processTelemetry(stream, 19, &validCount, &corruptCount);
    total++;
    if (sum3 == 135) { passed++; cout << "[PASS] a multi-frame stream sums only the valid frames" << endl; }
    else { cout << "[FAIL] a multi-frame stream sums only the valid frames: got " << sum3 << ", expected 135" << endl; }
    total++;
    if (validCount == 3) { passed++; cout << "[PASS] counts 3 valid frames across the stream" << endl; }
    else { cout << "[FAIL] counts 3 valid frames across the stream: got " << validCount << endl; }
    total++;
    if (corruptCount == 1) { passed++; cout << "[PASS] counts the 1 corrupted frame in the middle" << endl; }
    else { cout << "[FAIL] counts the 1 corrupted frame in the middle: got " << corruptCount << endl; }
    total++;
    if (validCount + corruptCount == 4) { passed++; cout << "[PASS] processing keeps going PAST the corrupted frame to the ones after it" << endl; }
    else { cout << "[FAIL] processing keeps going PAST the corrupted frame to the ones after it: got " << (validCount + corruptCount) << " total frames" << endl; }

    unsigned char desynced[3] = {0x00, 1, 2};
    int sum4 = processTelemetry(desynced, 3, &validCount, &corruptCount);
    total++;
    if (sum4 == 0 && validCount == 0 && corruptCount == 0) { passed++; cout << "[PASS] a stream with no valid start byte processes nothing" << endl; }
    else { cout << "[FAIL] a stream with no valid start byte processes nothing" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-016',
  title: 'Mini Telemetry Protocol',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'systems',
  category: 'Capstones',
  tags: ['capstone', 'buffers', 'checksums', 'parsing'],
  prompt:
    'Combine framing, checksums, and running counters into one real protocol handler: walk a stream ' +
    'of [start][length][payload][checksum] frames, skipping corrupted ones without losing sync on the ' +
    'ones that follow.',
  hints: [
    'Check the start byte FIRST each iteration — `if (buffer[pos] != START_BYTE) break;` — this is what stops the whole loop cleanly on a desynced stream instead of reading garbage as if it were a frame.',
    'Compute the checksum the exact same way the earlier XOR Checksum task did — XOR every payload byte together — then compare it against the stored checksum byte that comes right after the payload.',
    'The valid/corrupt branch only decides whether to ADD to the sum and which counter to bump — it does NOT change how far `pos` advances afterward. Both paths still know the frame\'s total size.',
    '`pos += 3 + length;` (start byte + length byte + checksum byte = 3, plus however many payload bytes) is what lets the loop correctly resume at the NEXT frame — even right after a corrupted one.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('telemetry.cpp', TELEMETRY_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('telemetry.cpp', TELEMETRY_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Mini Telemetry Protocol', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
