import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Struct-Free Record Serialization

Serialize a set of "records" (an id and a value, kept as parallel arrays — no struct, see the Run
panel's note) into one flat byte buffer, and deserialize that buffer back into the same two arrays —
a real round-trip, the way a tiny save-file or network payload format works.
`;

const SERIALIZE_STARTER = `int serializeRecords(const int* ids, const int* values, int count, unsigned char* outBuffer) {
    // TODO: for each record i (0 to count-1), write 4 bytes into outBuffer: ids[i] as ONE byte
    // (assume every id fits in 0-255), then values[i] as ONE byte (assume it also fits in 0-255).
    // So each record takes exactly 2 bytes in outBuffer, in order: [id0][value0][id1][value1]...
    // Return the total number of bytes written (count * 2).
    return 0;
}

int deserializeRecords(const unsigned char* buffer, int bufferLen, int* outIds, int* outValues) {
    // TODO: reverse serializeRecords — read pairs of bytes from buffer, writing the id into
    // outIds[i] and the value into outValues[i] for each record i. Return how many records were
    // read (bufferLen / 2 — assume bufferLen is always even).
    return 0;
}
`;

const SERIALIZE_SOLUTION = `int serializeRecords(const int* ids, const int* values, int count, unsigned char* outBuffer) {
    for (int i = 0; i < count; i++) {
        outBuffer[i * 2] = (unsigned char)ids[i];
        outBuffer[i * 2 + 1] = (unsigned char)values[i];
    }
    return count * 2;
}

int deserializeRecords(const unsigned char* buffer, int bufferLen, int* outIds, int* outValues) {
    int recordCount = bufferLen / 2;
    for (int i = 0; i < recordCount; i++) {
        outIds[i] = (int)buffer[i * 2];
        outValues[i] = (int)buffer[i * 2 + 1];
    }
    return recordCount;
}
`;

const MAIN_CPP = `#include <iostream>
#include "serialize.cpp"
using namespace std;

int main() {
    int ids[3] = {1, 2, 3};
    int values[3] = {10, 20, 30};
    unsigned char buf[6];
    int written = serializeRecords(ids, values, 3, buf);

    int outIds[3];
    int outValues[3];
    int recordCount = deserializeRecords(buf, written, outIds, outValues);
    cout << "round-tripped " << recordCount << " records; first id=" << outIds[0] << " value=" << outValues[0] << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "serialize.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    int ids[3] = {1, 2, 3};
    int values[3] = {10, 20, 30};
    unsigned char buf[6];
    int written = serializeRecords(ids, values, 3, buf);

    total++;
    if (written == 6) { passed++; cout << "[PASS] writes 2 bytes per record" << endl; }
    else { cout << "[FAIL] writes 2 bytes per record: got " << written << ", expected 6" << endl; }

    total++;
    if (buf[0] == 1 && buf[1] == 10) { passed++; cout << "[PASS] first record serializes as [id][value]" << endl; }
    else { cout << "[FAIL] first record serializes as [id][value]: got " << (int)buf[0] << " " << (int)buf[1] << endl; }

    total++;
    if (buf[4] == 3 && buf[5] == 30) { passed++; cout << "[PASS] the last record lands at the right offset" << endl; }
    else { cout << "[FAIL] the last record lands at the right offset: got " << (int)buf[4] << " " << (int)buf[5] << endl; }

    int outIds[3];
    int outValues[3];
    int recordCount = deserializeRecords(buf, written, outIds, outValues);

    total++;
    if (recordCount == 3) { passed++; cout << "[PASS] deserializes the correct number of records" << endl; }
    else { cout << "[FAIL] deserializes the correct number of records: got " << recordCount << endl; }

    total++;
    if (outIds[0] == 1 && outIds[1] == 2 && outIds[2] == 3) { passed++; cout << "[PASS] ids round-trip correctly" << endl; }
    else { cout << "[FAIL] ids round-trip correctly: got " << outIds[0] << " " << outIds[1] << " " << outIds[2] << endl; }

    total++;
    if (outValues[0] == 10 && outValues[1] == 20 && outValues[2] == 30) { passed++; cout << "[PASS] values round-trip correctly" << endl; }
    else { cout << "[FAIL] values round-trip correctly: got " << outValues[0] << " " << outValues[1] << " " << outValues[2] << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-015',
  title: 'Struct-Free Record Serialization',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'systems',
  category: 'Serialization',
  tags: ['serialization', 'buffers'],
  prompt: 'Serialize parallel id/value arrays into a flat byte buffer, and deserialize that buffer back — a real round-trip, without ever using a struct to group the fields.',
  hints: [
    'Each record occupies 2 bytes at `outBuffer[i * 2]` (the id) and `outBuffer[i * 2 + 1]` (the value) — the `* 2` is what spaces consecutive records apart correctly.',
    'Cast to `(unsigned char)` when writing — the ids/values are `int`s, but the buffer holds bytes.',
    'Deserializing is the same indexing scheme in reverse: `recordCount = bufferLen / 2`, then read `buffer[i * 2]` into `outIds[i]` and `buffer[i * 2 + 1]` into `outValues[i]`.',
    'Cast back to `(int)` when reading — you\'re pulling a byte-sized value back out into a wider int.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('serialize.cpp', SERIALIZE_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('serialize.cpp', SERIALIZE_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Struct-Free Record Serialization', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
