import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Traffic Light State Machine

The simplest real state machine: a fixed cycle of states, one function that computes "what comes
next" with no side effects, and a separate function that actually advances the light — the same
split real embedded firmware uses between "pure transition logic" and "the thing that owns state."

(No \`enum\` here — this interpreter can't register one, see the Run panel's note — so the three
states are plain \`const int\` constants instead.)
`;

const LIGHT_STARTER = `const int RED = 0;
const int GREEN = 1;
const int YELLOW = 2;

int currentLight = RED;

int nextState(int state) {
    // TODO: RED -> GREEN, GREEN -> YELLOW, YELLOW -> RED. Return the given state unchanged for any
    // other input (defensive default).
    return state;
}

void advance() {
    // TODO: set currentLight = nextState(currentLight).
}
`;

const LIGHT_SOLUTION = `const int RED = 0;
const int GREEN = 1;
const int YELLOW = 2;

int currentLight = RED;

int nextState(int state) {
    if (state == RED) return GREEN;
    if (state == GREEN) return YELLOW;
    if (state == YELLOW) return RED;
    return state;
}

void advance() {
    currentLight = nextState(currentLight);
}
`;

const MAIN_CPP = `#include <iostream>
#include "light.cpp"
using namespace std;

int main() {
    cout << "start: " << currentLight << endl;
    advance();
    cout << "after 1 advance: " << currentLight << endl;
    advance();
    cout << "after 2 advances: " << currentLight << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "light.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (nextState(RED) == GREEN) { passed++; cout << "[PASS] RED -> GREEN" << endl; }
    else { cout << "[FAIL] RED -> GREEN: got " << nextState(RED) << endl; }

    total++;
    if (nextState(GREEN) == YELLOW) { passed++; cout << "[PASS] GREEN -> YELLOW" << endl; }
    else { cout << "[FAIL] GREEN -> YELLOW: got " << nextState(GREEN) << endl; }

    total++;
    if (nextState(YELLOW) == RED) { passed++; cout << "[PASS] YELLOW -> RED" << endl; }
    else { cout << "[FAIL] YELLOW -> RED: got " << nextState(YELLOW) << endl; }

    total++;
    if (currentLight == RED) { passed++; cout << "[PASS] starts at RED" << endl; }
    else { cout << "[FAIL] starts at RED" << endl; }

    advance();
    total++;
    if (currentLight == GREEN) { passed++; cout << "[PASS] advance() moves the actual state forward" << endl; }
    else { cout << "[FAIL] advance() moves the actual state forward: got " << currentLight << endl; }

    advance();
    advance();
    total++;
    if (currentLight == RED) { passed++; cout << "[PASS] the cycle returns to RED after 3 advances" << endl; }
    else { cout << "[FAIL] the cycle returns to RED after 3 advances: got " << currentLight << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-011',
  title: 'Traffic Light State Machine',
  difficulty: 'Easy',
  language: 'cpp',
  track: 'systems',
  category: 'State Machines',
  tags: ['state-machines'],
  prompt: 'Implement a fixed-cycle state machine: a pure transition function (state in, next state out) plus a separate function that actually advances the stored state.',
  hints: [
    'Three states, `const int` constants standing in for what would be an enum in real C++: RED=0, GREEN=1, YELLOW=2.',
    '`nextState` is a chain of `if` checks against each named constant — RED returns GREEN, GREEN returns YELLOW, YELLOW returns RED.',
    'The fallback `return state;` at the end handles any unrecognized input defensively — it should never actually trigger for a valid state, but it\'s there so the function always returns something sensible.',
    '`advance()` is a one-liner: `currentLight = nextState(currentLight);` — it\'s the ONLY place that\'s allowed to change `currentLight`, keeping the pure transition logic separate from the actual state mutation.',
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('light.cpp', LIGHT_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('light.cpp', LIGHT_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Traffic Light State Machine', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
