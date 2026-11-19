import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Variable-Length Field Reader

Unlike the single fixed-format packet from the earlier task, this buffer holds a SEQUENCE of
records back to back: \`[1 byte length][length bytes of data]\`, repeated until the buffer runs out.
Real protocols (and most binary file formats) are read exactly this way — walk forward by however
much the last record said to skip.
`;

const PARSER_STARTER = `int countRecords(const unsigned char* buffer, int bufferLen) {
    // TODO: walk the buffer from the start. At each position, the byte there is a record's length;
    // skip forward by 1 (the length byte itself) + that many bytes (the record's data). Count how
    // many complete records you pass. Stop when you reach the end of the buffer exactly, OR when a
    // record's declared length would run past the end (a malformed trailing record — don't count it).
    return 0;
}

int sumRecordBytes(const unsigned char* buffer, int bufferLen) {
    // TODO: same walk as countRecords, but instead return the sum of every DATA byte across every
    // complete record (not the length bytes themselves, and not any malformed trailing record).
    return 0;
}
`;

const PARSER_SOLUTION = `int countRecords(const unsigned char* buffer, int bufferLen) {
    int pos = 0;
    int count = 0;
    while (pos < bufferLen) {
        int len = buffer[pos];
        if (pos + 1 + len > bufferLen) break;
        pos += 1 + len;
        count++;
    }
    return count;
}

int sumRecordBytes(const unsigned char* buffer, int bufferLen) {
    int pos = 0;
    int total = 0;
    while (pos < bufferLen) {
        int len = buffer[pos];
        if (pos + 1 + len > bufferLen) break;
        for (int i = 0; i < len; i++) {
            total += buffer[pos + 1 + i];
        }
        pos += 1 + len;
    }
    return total;
}
`;

const MAIN_CPP = `#include <iostream>
#include "parser.cpp"
using namespace std;

int main() {
    unsigned char buf[7] = {2, 10, 20, 1, 30, 0};
    cout << "records: " << countRecords(buf, 5) << endl;
    cout << "sum: " << sumRecordBytes(buf, 5) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "parser.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    unsigned char buf1[5] = {2, 10, 20, 1, 30};
    total++;
    if (countRecords(buf1, 5) == 2) { passed++; cout << "[PASS] counts two well-formed records" << endl; }
    else { cout << "[FAIL] counts two well-formed records: got " << countRecords(buf1, 5) << ", expected 2" << endl; }

    total++;
    if (sumRecordBytes(buf1, 5) == 60) { passed++; cout << "[PASS] sums only the data bytes" << endl; }
    else { cout << "[FAIL] sums only the data bytes: got " << sumRecordBytes(buf1, 5) << ", expected 60" << endl; }

    unsigned char buf2[1];
    buf2[0] = 0;
    total++;
    if (countRecords(buf2, 1) == 1) { passed++; cout << "[PASS] a zero-length record still counts" << endl; }
    else { cout << "[FAIL] a zero-length record still counts" << endl; }

    unsigned char empty[1];
    total++;
    if (countRecords(empty, 0) == 0) { passed++; cout << "[PASS] an empty buffer has no records" << endl; }
    else { cout << "[FAIL] an empty buffer has no records" << endl; }

    unsigned char malformed[2] = {5, 1};
    total++;
    if (countRecords(malformed, 2) == 0) { passed++; cout << "[PASS] a truncated trailing record is not counted" << endl; }
    else { cout << "[FAIL] a truncated trailing record is not counted: got " << countRecords(malformed, 2) << endl; }

    unsigned char mixed[3] = {0, 0, 5};
    total++;
    if (countRecords(mixed, 3) == 2) { passed++; cout << "[PASS] well-formed records before a truncated one still count" << endl; }
    else { cout << "[FAIL] well-formed records before a truncated one still count: got " << countRecords(mixed, 3) << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-002',
  title: 'Variable-Length Field Reader',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'systems',
  category: 'Buffers & Parsing',
  tags: ['pointers', 'buffers', 'parsing'],
  prompt: 'Walk a buffer containing a sequence of [length][data] records back to back, stopping cleanly at a truncated trailing record instead of reading past the end.',
  hints: [
    'Track `pos` starting at 0; each record\'s length byte is `buffer[pos]`, and the record itself spans `1 + len` bytes total (the length byte plus its data).',
    'Check `if (pos + 1 + len > bufferLen) break;` BEFORE processing the record — this is what rejects a truncated trailing record instead of reading past the buffer.',
    'Advance with `pos += 1 + len;` after a valid record, whether you\'re counting or summing.',
    'For `sumRecordBytes`, the inner loop over a record\'s own data bytes reads `buffer[pos + 1 + i]` for `i` from 0 to `len - 1` — the `+1` skips past that record\'s own length byte.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('parser.cpp', PARSER_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('parser.cpp', PARSER_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Variable-Length Field Reader', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
