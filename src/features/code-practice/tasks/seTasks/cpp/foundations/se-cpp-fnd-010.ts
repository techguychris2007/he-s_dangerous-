import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Student Records via Parallel Arrays

This interpreter can't register a user-defined \`struct\` (see the Run panel's note) — so instead of
one array of "student" records, real code here uses several arrays of the SAME length, one per
field, kept in sync by a shared index. \`ids[i]\`/\`scores[i]\` together describe student \`i\`. This is
a genuinely common technique in performance-sensitive C (and even C++, under the name
"structure-of-arrays") when you want tightly-packed, cache-friendly data.
`;

const SOLUTION_CPP_STARTER = `int findScoreById(int* ids, int* scores, int n, int targetId) {
    // TODO: find the index i where ids[i] == targetId, and return scores[i]. Return -1 if
    // targetId isn't in ids at all.
    return -1;
}

double averageScore(int* scores, int n) {
    // TODO: return the average of scores[0..n-1] as a double. Assume n >= 1.
    return 0.0;
}
`;

const SOLUTION_CPP_SOLUTION = `int findScoreById(int* ids, int* scores, int n, int targetId) {
    for (int i = 0; i < n; i++) {
        if (ids[i] == targetId) return scores[i];
    }
    return -1;
}

double averageScore(int* scores, int n) {
    int total = 0;
    for (int i = 0; i < n; i++) {
        total += scores[i];
    }
    return (double)total / n;
}
`;

const MAIN_CPP = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int ids[3] = {101, 102, 103};
    int scores[3] = {85, 92, 78};
    cout << "score for id 102: " << findScoreById(ids, scores, 3, 102) << endl;
    cout << "average: " << averageScore(scores, 3) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "solution.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    int ids[4] = {101, 102, 103, 104};
    int scores[4] = {85, 92, 78, 60};

    total++;
    if (findScoreById(ids, scores, 4, 102) == 92) { passed++; cout << "[PASS] finds score by matching id" << endl; }
    else { cout << "[FAIL] finds score by matching id: got " << findScoreById(ids, scores, 4, 102) << ", expected 92" << endl; }

    total++;
    if (findScoreById(ids, scores, 4, 101) == 85) { passed++; cout << "[PASS] finds the first record" << endl; }
    else { cout << "[FAIL] finds the first record" << endl; }

    total++;
    if (findScoreById(ids, scores, 4, 104) == 60) { passed++; cout << "[PASS] finds the last record" << endl; }
    else { cout << "[FAIL] finds the last record" << endl; }

    total++;
    if (findScoreById(ids, scores, 4, 999) == -1) { passed++; cout << "[PASS] missing id returns -1" << endl; }
    else { cout << "[FAIL] missing id returns -1: got " << findScoreById(ids, scores, 4, 999) << endl; }

    total++;
    if (averageScore(scores, 4) == 78.75) { passed++; cout << "[PASS] computes the average" << endl; }
    else { cout << "[FAIL] computes the average: got " << averageScore(scores, 4) << ", expected 78.75" << endl; }

    int oneScore[1];
    oneScore[0] = 50;
    total++;
    if (averageScore(oneScore, 1) == 50.0) { passed++; cout << "[PASS] average of a single score" << endl; }
    else { cout << "[FAIL] average of a single score" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-fnd-010',
  title: 'Student Records via Parallel Arrays',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'foundations',
  category: 'Parallel Arrays',
  tags: ['arrays', 'parallel-arrays'],
  prompt: 'Look up a score by id and compute an average across two same-length arrays kept in sync by a shared index — the struct-free way to model "records" here.',
  hints: [
    'Both functions share the same loop shape: walk `i` from 0 to `n-1`, and `ids[i]`/`scores[i]` are always the same student\'s two fields.',
    'In `findScoreById`, check `if (ids[i] == targetId)` and immediately `return scores[i]` — no need to keep searching once you\'ve found it.',
    'If the loop finishes without finding a match, `return -1;` after it.',
    'For the average, sum into an `int total`, then cast to `double` ONLY at the final division — `(double)total / n` — so the result keeps its fractional part instead of truncating.',
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
  targets: [{ id: 'main', label: 'Student Records', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
