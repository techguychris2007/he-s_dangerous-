import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Command Byte Decoder

A tiny binary "instruction stream": a sequence of 2-byte commands \`[opcode][argument]\`, decoded and
executed one after another against a running accumulator — the same shape a real bytecode
interpreter or remote-control protocol uses.
`;

const RUNNER_STARTER = `int runCommands(const unsigned char* buffer, int bufferLen) {
    // TODO: process buffer as a sequence of 2-byte commands [opcode][arg] (bufferLen is always a
    // multiple of 2). Starting from an accumulator of 0:
    //   opcode 1 (ADD): accumulator += arg
    //   opcode 2 (SUB): accumulator -= arg
    //   opcode 3 (RESET): accumulator = 0 (arg is ignored)
    //   any other opcode: skip this command (still consumes its 2 bytes, changes nothing)
    // Return the accumulator after processing every command in buffer.
    return 0;
}
`;

const RUNNER_SOLUTION = `int runCommands(const unsigned char* buffer, int bufferLen) {
    int acc = 0;
    for (int pos = 0; pos < bufferLen; pos += 2) {
        unsigned char opcode = buffer[pos];
        unsigned char arg = buffer[pos + 1];
        if (opcode == 1) acc += arg;
        else if (opcode == 2) acc -= arg;
        else if (opcode == 3) acc = 0;
    }
    return acc;
}
`;

const MAIN_CPP = `#include <iostream>
#include "runner.cpp"
using namespace std;

int main() {
    unsigned char buf[4] = {1, 10, 1, 5};
    cout << "result: " << runCommands(buf, 4) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "runner.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    unsigned char buf1[4] = {1, 10, 1, 5};
    total++;
    if (runCommands(buf1, 4) == 15) { passed++; cout << "[PASS] two ADD commands accumulate" << endl; }
    else { cout << "[FAIL] two ADD commands accumulate: got " << runCommands(buf1, 4) << ", expected 15" << endl; }

    unsigned char buf2[4] = {1, 20, 2, 8};
    total++;
    if (runCommands(buf2, 4) == 12) { passed++; cout << "[PASS] ADD then SUB" << endl; }
    else { cout << "[FAIL] ADD then SUB: got " << runCommands(buf2, 4) << ", expected 12" << endl; }

    unsigned char buf3[6] = {1, 50, 3, 0, 1, 7};
    total++;
    if (runCommands(buf3, 6) == 7) { passed++; cout << "[PASS] RESET clears the accumulator mid-stream" << endl; }
    else { cout << "[FAIL] RESET clears the accumulator mid-stream: got " << runCommands(buf3, 6) << ", expected 7" << endl; }

    unsigned char buf4[4] = {99, 100, 1, 3};
    total++;
    if (runCommands(buf4, 4) == 3) { passed++; cout << "[PASS] unknown opcode is skipped, not fatal" << endl; }
    else { cout << "[FAIL] unknown opcode is skipped, not fatal: got " << runCommands(buf4, 4) << endl; }

    unsigned char empty[1];
    total++;
    if (runCommands(empty, 0) == 0) { passed++; cout << "[PASS] empty stream leaves the accumulator at 0" << endl; }
    else { cout << "[FAIL] empty stream leaves the accumulator at 0" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-003',
  title: 'Command Byte Decoder',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'systems',
  category: 'Protocol Decoding',
  tags: ['pointers', 'buffers', 'parsing'],
  prompt: 'Decode a stream of 2-byte [opcode][arg] commands and execute each one against a running accumulator, the way a tiny bytecode interpreter would.',
  hints: [
    '`for (int pos = 0; pos < bufferLen; pos += 2)` walks the stream two bytes at a time — one command per iteration.',
    '`buffer[pos]` is the opcode, `buffer[pos + 1]` is the argument for that same command.',
    'A chain of `if`/`else if` on the opcode value covers ADD/SUB/RESET; falling through all three (an unrecognized opcode) should do nothing at all, not raise an error or stop the loop.',
    'RESET ignores its argument entirely — `acc = 0;` regardless of what `arg` happens to be.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('runner.cpp', RUNNER_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('runner.cpp', RUNNER_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Command Byte Decoder', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
