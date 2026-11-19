import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Bucket Hash

A hand-rolled string hash, reduced into a fixed number of buckets — the core operation behind a
hash table's \`insert\`, done here without any actual table, just the arithmetic that would decide
where an entry goes.
`;

const HASH_STARTER = `int hashString(const char* s) {
    // TODO: compute a hash of the C-string s: start at 0, and for each character, do
    // hash = hash * 31 + (int)c. Stop at the terminating '\\0'. Return the final hash (it's fine —
    // expected, even — for this to overflow int and wrap around for longer strings).
    return 0;
}

int bucketFor(const char* s, int numBuckets) {
    // TODO: return hashString(s) reduced into the range [0, numBuckets). A raw hash can be
    // negative (due to overflow), and a plain % in C++ can return a negative result for a negative
    // left-hand side — make sure the final answer is always >= 0.
    return 0;
}
`;

const HASH_SOLUTION = `int hashString(const char* s) {
    int hash = 0;
    int i = 0;
    while (s[i] != '\\0') {
        hash = hash * 31 + (int)s[i];
        i++;
    }
    return hash;
}

int bucketFor(const char* s, int numBuckets) {
    int h = hashString(s) % numBuckets;
    if (h < 0) h += numBuckets;
    return h;
}
`;

const MAIN_CPP = `#include <iostream>
#include "hash.cpp"
using namespace std;

int main() {
    cout << "hash('cat'): " << hashString("cat") << endl;
    cout << "bucket('cat', 16): " << bucketFor("cat", 16) << endl;
    return 0;
}
`;

const TEST_CODE = `#include <iostream>
#include "hash.cpp"
using namespace std;

int main() {
    int passed = 0, total = 0;

    total++;
    if (hashString("") == 0) { passed++; cout << "[PASS] empty string hashes to 0" << endl; }
    else { cout << "[FAIL] empty string hashes to 0: got " << hashString("") << endl; }

    total++;
    if (hashString("a") == 97) { passed++; cout << "[PASS] single character hashes to its char code" << endl; }
    else { cout << "[FAIL] single character hashes to its char code: got " << hashString("a") << ", expected 97" << endl; }

    total++;
    if (hashString("ab") == 97 * 31 + 98) { passed++; cout << "[PASS] two characters combine with *31" << endl; }
    else { cout << "[FAIL] two characters combine with *31: got " << hashString("ab") << ", expected " << (97 * 31 + 98) << endl; }

    total++;
    if (hashString("cat") == hashString("cat")) { passed++; cout << "[PASS] hashing the same string twice is consistent" << endl; }
    else { cout << "[FAIL] hashing the same string twice is consistent" << endl; }

    total++;
    if (hashString("cat") != hashString("dog")) { passed++; cout << "[PASS] different strings usually hash differently" << endl; }
    else { cout << "[FAIL] different strings usually hash differently" << endl; }

    int b = bucketFor("cat", 16);
    total++;
    if (b >= 0 && b < 16) { passed++; cout << "[PASS] bucketFor stays within [0, numBuckets)" << endl; }
    else { cout << "[FAIL] bucketFor stays within [0, numBuckets): got " << b << endl; }

    total++;
    if (bucketFor("cat", 16) == bucketFor("cat", 16)) { passed++; cout << "[PASS] the same string always lands in the same bucket" << endl; }
    else { cout << "[FAIL] the same string always lands in the same bucket" << endl; }

    cout << "__RESULT__ " << passed << "/" << total << endl;
    return 0;
}
`;

const task: ProjectTask = {
  id: 'se-cpp-sys-006',
  title: 'Bucket Hash',
  difficulty: 'Medium',
  language: 'cpp',
  track: 'systems',
  category: 'Checksums & Hashing',
  tags: ['hashing', 'c-strings'],
  prompt: 'Implement a classic polynomial string hash, then reduce it into a fixed number of buckets — careful with the sign of a negative modulo result.',
  hints: [
    "`hash = hash * 31 + (int)s[i]` for each character, walking until the terminating '\\0' — the classic \"multiply-and-add\" rolling hash.",
    'An empty string never enters the loop, leaving the hash at its starting value of 0.',
    "In C++, `%` can return a NEGATIVE result when its left operand is negative — `hashString(s) % numBuckets` might come back negative even though `numBuckets` is positive, since the raw hash can overflow into negative territory for longer strings.",
    "`if (h < 0) h += numBuckets;` after the modulo pulls a negative result back into the valid `[0, numBuckets)` range — adding `numBuckets` to a small negative number lands it in exactly the right spot.",
  ],
  files: [
    pf('README.md', README, { editable: false }),
    pf('hash.cpp', HASH_STARTER),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  solutionFiles: [
    pf('README.md', README, { editable: false }),
    pf('hash.cpp', HASH_SOLUTION),
    pf('main.cpp', MAIN_CPP, { editable: false }),
  ],
  targets: [{ id: 'main', label: 'Bucket Hash', kind: 'cpp', entry: 'main.cpp', testCode: TEST_CODE }],
};

export default task;
