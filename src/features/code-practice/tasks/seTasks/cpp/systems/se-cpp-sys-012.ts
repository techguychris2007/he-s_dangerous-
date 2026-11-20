import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Escape-Aware Character Counter

A tiny two-state parser: walking a C-string that may contain backslash-escaped characters (\`\\\\n\`,
\`\\\\t\`, etc. — the backslash marks "the next character is literal, don't treat it specially"), and
counting how many characters would remain after unescaping, without actually building the unescaped
string. The same NORMAL/ESCAPED state-tracking real tokenizers use to walk quoted strings correctly.
`;

const COUNTER_STARTER = `const int NORMAL = 0;
const int ESCAPED = 1;

int countEffectiveChars(const char* s) {
    // TODO: walk s character by character, tracking a state (start in NORMAL):
    //  - in NORMAL state: if the current character is a backslash, switch to ESCAPED state WITHOUT
    //    counting this character. Otherwise, count it and stay in NORMAL state.
    //  - in ESCAPED state: count the current character (it's the literal that followed the
    //    backslash), then switch back to NORMAL state.
    // A backslash with nothing after it (state ends as ESCAPED when the string terminates)
    // contributes nothing further — this falls out naturally if you stop at the string's '\\0'.
    return 0;
}
`;

const COUNTER_SOLUTION = `const int NORMAL = 0;
const int ESCAPED = 1;

int countEffectiveChars(const char* s) {
    int state = NORMAL;
    int count = 0;
    int i = 0;
    while (s[i] != '\\0') {
        if (state == NORMAL) {
            if (s[i] == '\\\\') {
                state = ESCAPED;
            } else {
                count++;
            }
        } else {
            count++;
            state = NORMAL;
        }
        i++;
    }
    return count;
}
`;

const MAIN_CPP = `#include <iostream>
#include "counter.cpp"
using namespace std;

int main() {
    cout << countEffectiveChars("hello") << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "counter.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (countEffectiveChars("hello") == 5) { passed++; cout << "[PASS] a plain string with no escapes counts every character" << endl; }
    else { cout << "[FAIL] a plain string with no escapes counts every character: got " << countEffectiveChars("hello") << endl; }

    total++;
    if (countEffectiveChars("") == 0) { passed++; cout << "[PASS] an empty string counts as 0" << endl; }
    else { cout << "[FAIL] an empty string counts as 0" << endl; }

    total++;
    if (countEffectiveChars("ab\\\\ncd") == 5) { passed++; cout << "[PASS] a single escape drops the backslash but keeps the escaped char" << endl; }
    else { cout << "[FAIL] a single escape drops the backslash but keeps the escaped char: got " << countEffectiveChars("ab\\\\ncd") << ", expected 5" << endl; }

    total++;
    if (countEffectiveChars("a\\\\\\\\b") == 3) { passed++; cout << "[PASS] an escaped backslash counts as one literal character" << endl; }
    else { cout << "[FAIL] an escaped backslash counts as one literal character: got " << countEffectiveChars("a\\\\\\\\b") << ", expected 3" << endl; }

    total++;
    if (countEffectiveChars("ab\\\\") == 2) { passed++; cout << "[PASS] a trailing lone backslash contributes nothing" << endl; }
    else { cout << "[FAIL] a trailing lone backslash contributes nothing: got " << countEffectiveChars("ab\\\\") << ", expected 2" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-012',
  title: 'Escape-Aware Character Counter',
  difficulty: 'Hard',
  language: 'cpp',
  track: 'systems',
  category: 'State Machines',
  tags: ['state-machines', 'c-strings'],
  prompt: 'Walk a C-string with a two-state (NORMAL/ESCAPED) parser, counting how many characters would remain after resolving backslash escapes — without building the unescaped string.',
  hints: [
    'The state only ever changes in ONE direction per character: NORMAL can move to ESCAPED (on a backslash), and ESCAPED always moves back to NORMAL (on the very next character, whatever it is).',
    'A backslash in NORMAL state is the only character that does NOT get counted — it "consumes itself" to flip the state instead.',
    'In ESCAPED state, the current character is always counted (it\'s the literal the backslash was protecting), regardless of what it actually is — even if it\'s ANOTHER backslash.',
    'A backslash right before the terminating \'\\0\' flips to ESCAPED state but the loop ends before anything gets counted in that state — that\'s exactly why a trailing lone backslash naturally contributes nothing, with no special-case code needed.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('counter.cpp', COUNTER_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('counter.cpp', COUNTER_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Escape-Aware Character Counter', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
