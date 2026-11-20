import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Fixed-Format Packet Parser

A classic systems task: parse a small fixed-format binary "packet" — [1 byte type][1 byte length]
[length bytes payload] — out of a raw byte buffer, using pointers and plain arrays instead of any
string/container library (this interpreter doesn't have those — see \`packet.h\`'s comment). This is
exactly the kind of buffer-parsing code real protocol/firmware work is built from.

Fields come back through separate output pointers (\`outType\`/\`outLength\`/\`outPayload\`) rather than a
struct — this in-browser interpreter can't register a user-defined \`struct\`/\`class\` type from source
at all (only its own built-in types work), so every Build Portal C++ task sticks to primitives, arrays,
and pointers.
`;

const PACKET_H = `// A tiny fixed-format "packet": [1 byte type][1 byte length][length bytes payload].
// No <vector>/<string> — AND no struct/class — on purpose: the in-browser C++ interpreter only
// understands a small, fixed set of headers (<iostream>/<cctype>/<cstring>/<cmath>/<cstdio>/<cstdlib>/
// <ctime>/<iomanip>) and can't register a user-defined struct/class type from parsed source at all, so
// every Build Portal C++ task passes data as separate primitives/arrays instead of grouping fields.
#define PACKET_MAX_PAYLOAD 64
`;

const PARSER_CPP_STARTER = `#include "packet.h"

bool parsePacket(const unsigned char* buffer, int bufferLen, unsigned char* outType, unsigned char* outLength, char* outPayload) {
    // TODO: parse \`buffer\` into outType/outLength/outPayload following the [type][length][payload...]
    // format in packet.h.
    //  - Fail (return false) if bufferLen is less than 2 (not even a full header).
    //  - Fail (return false) if the declared length would run past the end of buffer.
    //  - Otherwise set *outType, *outLength, copy \`length\` bytes into outPayload, and return true.
    return false;
}

int sumPayload(const char* payload, int length) {
    // TODO: return the sum of every byte in payload[0..length-1], as an int.
    // Treat each byte as unsigned (0..255), not signed (-128..127) — cast to unsigned char before adding.
    return 0;
}
`;

const PARSER_CPP_SOLUTION = `#include "packet.h"

bool parsePacket(const unsigned char* buffer, int bufferLen, unsigned char* outType, unsigned char* outLength, char* outPayload) {
    if (bufferLen < 2) return false;
    unsigned char type = buffer[0];
    unsigned char length = buffer[1];
    if (2 + (int)length > bufferLen) return false;
    *outType = type;
    *outLength = length;
    for (int i = 0; i < length; i++) {
        outPayload[i] = buffer[2 + i];
    }
    return true;
}

int sumPayload(const char* payload, int length) {
    int total = 0;
    for (int i = 0; i < length; i++) {
        total += (unsigned char)payload[i];
    }
    return total;
}
`;

const MAIN_CPP = `#include <iostream>
#include "packet.h"
#include "parser.cpp"
using namespace std;

int main() {
    unsigned char buf[5] = {0x01, 0x03, 10, 20, 30};
    unsigned char type, length;
    char payload[PACKET_MAX_PAYLOAD];
    if (parsePacket(buf, 5, &type, &length, payload)) {
        cout << "type=" << (int)type << " length=" << (int)length << " sum=" << sumPayload(payload, length) << endl;
    } else {
        cout << "parse failed" << endl;
    }
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "packet.h"
#include "parser.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    unsigned char buf1[5] = {0x01, 0x03, 10, 20, 30};
    unsigned char type1, length1;
    char payload1[PACKET_MAX_PAYLOAD];
    bool ok1 = parsePacket(buf1, 5, &type1, &length1, payload1);
    total++;
    if (ok1 == true) { passed++; cout << "[PASS] parses a valid packet" << endl; }
    else { cout << "[FAIL] parses a valid packet" << endl; }

    total++;
    if (ok1 && type1 == 1) { passed++; cout << "[PASS] type field" << endl; }
    else { cout << "[FAIL] type field" << endl; }

    total++;
    if (ok1 && length1 == 3) { passed++; cout << "[PASS] length field" << endl; }
    else { cout << "[FAIL] length field" << endl; }

    total++;
    if (ok1 && sumPayload(payload1, length1) == 60) { passed++; cout << "[PASS] sumPayload(10+20+30)" << endl; }
    else { cout << "[FAIL] sumPayload(10+20+30): expected 60" << endl; }

    // A single-element brace-initializer (\`unsigned char buf2[1] = {0x01};\`) trips a real JSCPP bug
    // (confirmed directly against the interpreter: any size-1 array with a full initializer list
    // raises a spurious "overflow of -1" error) — declare-then-assign avoids it entirely.
    unsigned char buf2[1];
    buf2[0] = 0x01;
    unsigned char type2, length2;
    char payload2[PACKET_MAX_PAYLOAD];
    bool ok2 = parsePacket(buf2, 1, &type2, &length2, payload2);
    total++;
    if (ok2 == false) { passed++; cout << "[PASS] rejects a too-short buffer" << endl; }
    else { cout << "[FAIL] rejects a too-short buffer" << endl; }

    unsigned char buf3[3] = {0x01, 0x0A, 5};
    unsigned char type3, length3;
    char payload3[PACKET_MAX_PAYLOAD];
    bool ok3 = parsePacket(buf3, 3, &type3, &length3, payload3);
    total++;
    if (ok3 == false) { passed++; cout << "[PASS] rejects an overrun length" << endl; }
    else { cout << "[FAIL] rejects an overrun length" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-001',
  title: 'Fixed-Format Packet Parser',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'systems',
  category: 'Buffers & Parsing',
  tags: ['pointers', 'buffers', 'parsing'],
  prompt:
    'Implement `parsePacket` and `sumPayload` in `parser.cpp` against the fixed wire format documented ' +
    'in `packet.h`. Real buffer-parsing discipline: validate lengths before trusting them, and treat ' +
    'payload bytes as unsigned. Fields come back through separate output pointers, not a struct — see ' +
    "packet.h's comment for why.",
  hints: [
    'Header check: `if (bufferLen < 2) return false;` — you need both the type and length bytes before you can trust anything else.',
    'Overrun check: the payload needs `length` more bytes after the 2-byte header, so reject when `2 + length > bufferLen`.',
    'Copy loop: `for (int i = 0; i < length; i++) outPayload[i] = buffer[2 + i];` — the payload starts right after the header.',
    'sumPayload: cast each byte to `(unsigned char)` before adding — otherwise a byte over 127 gets sign-extended into a negative number.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('packet.h', PACKET_H, { editable: false }),
    pf('parser.cpp', PARSER_CPP_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('packet.h', PACKET_H, { editable: false }),
    pf('parser.cpp', PARSER_CPP_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Packet Parser', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
