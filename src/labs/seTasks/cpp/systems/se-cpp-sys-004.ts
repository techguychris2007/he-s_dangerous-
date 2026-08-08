import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# TLV Decoder

Type-Length-Value framing — \`[1 byte type][1 byte length][length bytes of value]\`, repeated — is
one of the most common ways real protocols (TLS extensions, DNS records, USB descriptors) pack
heterogeneous fields into one buffer without a fixed schema.
`;

const DECODER_STARTER = `int sumValuesOfType(const unsigned char* buffer, int bufferLen, unsigned char targetType) {
    // TODO: walk buffer as a sequence of TLV records [type][length][value bytes...]. For every
    // record whose type == targetType, add up all of ITS value bytes into a running total. Skip
    // (don't sum) records of any other type — but still walk past them correctly. Return the total.
    // Assume the buffer is always well-formed (no truncated trailing record to worry about here).
    return 0;
}

int countRecordsOfType(const unsigned char* buffer, int bufferLen, unsigned char targetType) {
    // TODO: same walk, but return how many records match targetType (not the sum of their values).
    return 0;
}
`;

const DECODER_SOLUTION = `int sumValuesOfType(const unsigned char* buffer, int bufferLen, unsigned char targetType) {
    int pos = 0;
    int total = 0;
    while (pos < bufferLen) {
        unsigned char type = buffer[pos];
        unsigned char length = buffer[pos + 1];
        if (type == targetType) {
            for (int i = 0; i < length; i++) {
                total += buffer[pos + 2 + i];
            }
        }
        pos += 2 + length;
    }
    return total;
}

int countRecordsOfType(const unsigned char* buffer, int bufferLen, unsigned char targetType) {
    int pos = 0;
    int count = 0;
    while (pos < bufferLen) {
        unsigned char type = buffer[pos];
        unsigned char length = buffer[pos + 1];
        if (type == targetType) count++;
        pos += 2 + length;
    }
    return count;
}
`;

const MAIN_CPP = `#include <iostream>
#include "decoder.cpp"
using namespace std;

int main() {
    unsigned char buf[8] = {1, 2, 10, 20, 2, 1, 5, 0};
    cout << "sum of type 1: " << sumValuesOfType(buf, 6, 1) << endl;
    cout << "count of type 1: " << countRecordsOfType(buf, 6, 1) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "decoder.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    unsigned char buf[6] = {1, 2, 10, 20, 2, 1};
    unsigned char buf2[7] = {1, 2, 10, 20, 2, 1, 5};

    total++;
    if (sumValuesOfType(buf2, 7, 1) == 30) { passed++; cout << "[PASS] sums the one type-1 record" << endl; }
    else { cout << "[FAIL] sums the one type-1 record: got " << sumValuesOfType(buf2, 7, 1) << ", expected 30" << endl; }

    total++;
    if (sumValuesOfType(buf2, 7, 2) == 5) { passed++; cout << "[PASS] sums the one type-2 record" << endl; }
    else { cout << "[FAIL] sums the one type-2 record: got " << sumValuesOfType(buf2, 7, 2) << ", expected 5" << endl; }

    total++;
    if (sumValuesOfType(buf2, 7, 99) == 0) { passed++; cout << "[PASS] a type with no matching records sums to 0" << endl; }
    else { cout << "[FAIL] a type with no matching records sums to 0" << endl; }

    unsigned char multi[10] = {1, 1, 5, 1, 1, 7, 2, 1, 3, 0};
    total++;
    if (sumValuesOfType(multi, 9, 1) == 12) { passed++; cout << "[PASS] sums across MULTIPLE records of the same type" << endl; }
    else { cout << "[FAIL] sums across MULTIPLE records of the same type: got " << sumValuesOfType(multi, 9, 1) << ", expected 12" << endl; }

    total++;
    if (countRecordsOfType(multi, 9, 1) == 2) { passed++; cout << "[PASS] counts multiple matching records" << endl; }
    else { cout << "[FAIL] counts multiple matching records: got " << countRecordsOfType(multi, 9, 1) << ", expected 2" << endl; }

    total++;
    if (countRecordsOfType(multi, 9, 2) == 1) { passed++; cout << "[PASS] counts a differently-typed record separately" << endl; }
    else { cout << "[FAIL] counts a differently-typed record separately" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-004',
  title: 'TLV Decoder',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'systems',
  category: 'Protocol Decoding',
  tags: ['pointers', 'buffers', 'parsing'],
  prompt: 'Walk a buffer of Type-Length-Value records, summing (and counting) only the ones matching a requested type — while still correctly skipping past every other record.',
  hints: [
    'Every record is `2 + length` bytes long total (the type byte, the length byte, then that many value bytes) — `pos += 2 + length;` always advances past the CURRENT record, whether or not it matched.',
    'The type check only decides whether to ADD to the total this iteration — it never affects how far `pos` advances afterward.',
    "`for (int i = 0; i < length; i++) total += buffer[pos + 2 + i];` sums a matching record's own value bytes — the `+2` skips past that record's type and length bytes.",
    '`countRecordsOfType` is the same walk with `count++` instead of a value-summing inner loop — copy the walking structure, swap what happens on a match.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('decoder.cpp', DECODER_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('decoder.cpp', DECODER_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'TLV Decoder', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
