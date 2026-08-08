import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# C-String Basics

C-strings are just \`char\` arrays ending in a \`'\\0'\` byte — no built-in \`.length()\` or \`.upper()\`
like a real \`std::string\` would have (this interpreter doesn't have \`<string>\` at all). Write the
two operations by hand: measuring length, and transforming in place.
`;

const SOLUTION_CPP_STARTER = `int myStrlen(const char* s) {
    // TODO: return the number of characters in s, NOT counting the terminating '\\0'.
    // Don't use the real strlen() from <cstring> — count characters yourself.
    return 0;
}

void toUpperCase(char* s) {
    // TODO: convert every letter in s to uppercase, IN PLACE. Non-letter characters (digits,
    // spaces, punctuation) should be left unchanged. Hint: 'a' - 'A' is the gap between cases.
}
`;

const SOLUTION_CPP_SOLUTION = `int myStrlen(const char* s) {
    int count = 0;
    while (s[count] != '\\0') {
        count++;
    }
    return count;
}

void toUpperCase(char* s) {
    int i = 0;
    while (s[i] != '\\0') {
        if (s[i] >= 'a' && s[i] <= 'z') {
            s[i] = s[i] - ('a' - 'A');
        }
        i++;
    }
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    cout << "myStrlen(\\"hello\\"): " << myStrlen("hello") << endl;
    char msg[20];
    msg[0] = 'h'; msg[1] = 'i'; msg[2] = '\\0';
    toUpperCase(msg);
    cout << "uppercased: " << msg << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (myStrlen("hello") == 5) { passed++; cout << "[PASS] myStrlen('hello')" << endl; }
    else { cout << "[FAIL] myStrlen('hello'): got " << myStrlen("hello") << ", expected 5" << endl; }

    total++;
    if (myStrlen("") == 0) { passed++; cout << "[PASS] myStrlen of empty string" << endl; }
    else { cout << "[FAIL] myStrlen of empty string" << endl; }

    total++;
    if (myStrlen("a") == 1) { passed++; cout << "[PASS] myStrlen of single char" << endl; }
    else { cout << "[FAIL] myStrlen of single char" << endl; }

    char buf1[10];
    buf1[0] = 'h'; buf1[1] = 'i'; buf1[2] = '!'; buf1[3] = '\\0';
    toUpperCase(buf1);
    total++;
    if (buf1[0] == 'H' && buf1[1] == 'I' && buf1[2] == '!' && buf1[3] == '\\0') {
        passed++; cout << "[PASS] uppercases letters, leaves punctuation" << endl;
    } else {
        cout << "[FAIL] uppercases letters, leaves punctuation: got " << buf1 << endl;
    }

    char buf2[10];
    buf2[0] = 'A'; buf2[1] = 'B'; buf2[2] = '\\0';
    toUpperCase(buf2);
    total++;
    if (buf2[0] == 'A' && buf2[1] == 'B') { passed++; cout << "[PASS] already-uppercase string is unchanged" << endl; }
    else { cout << "[FAIL] already-uppercase string is unchanged" << endl; }

    char buf3[10];
    buf3[0] = '4'; buf3[1] = '2'; buf3[2] = '\\0';
    toUpperCase(buf3);
    total++;
    if (buf3[0] == '4' && buf3[1] == '2') { passed++; cout << "[PASS] digits are left unchanged" << endl; }
    else { cout << "[FAIL] digits are left unchanged" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-007',
  title: 'C-String Basics',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Arrays & C-Strings',
  tags: ['c-strings', 'char-arrays'],
  prompt: "Hand-implement string length and in-place uppercasing on a raw char array — there's no <string> in this interpreter, so this is what C-strings actually are underneath.",
  hints: [
    "A C-string ends at the first '\\0' byte — `while (s[count] != '\\0') count++;` walks to it.",
    "An empty string is just `s[0] == '\\0'` immediately, so the loop naturally returns 0 without any special case.",
    "Check `if (s[i] >= 'a' && s[i] <= 'z')` before touching a character — only lowercase letters need converting.",
    "`'a' - 'A'` is the fixed gap between an uppercase and lowercase letter's character codes — subtract it from a lowercase letter to get its uppercase form.",
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
  targets: [{ id: 'main', label: 'C-String Basics', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
