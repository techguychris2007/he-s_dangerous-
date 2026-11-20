import type { CodeTask } from '../codeTypes';

/** Capstone-tier C++ tasks: real multi-function tools, built — like every C++ task in this catalog —
 *  entirely from the subset JSCPP (the in-browser interpreter) actually supports: fixed-size arrays,
 *  functions, primitive types, and C-style (char*) strings. No structs, no STL, no dynamic allocation —
 *  see fundamentals.ts's header comment. Bigger in scope and test surface than the other C++ tasks, but
 *  built from the exact same constrained toolset, not an exception to it. */
export const CPP_CAPSTONE_TASKS: CodeTask[] = [
  {
    id: 'cpp-capstone-01',
    title: 'Capstone: Caesar Cipher Cracker',
    difficulty: 'Hard',
    language: 'cpp',
    category: 'Capstone',
    prompt:
      'Build an automatic Caesar-cipher cracker using frequency analysis — the same real technique that ' +
      'breaks any Caesar-shifted message without ever knowing the key, because \'e\' is reliably the most ' +
      'common letter in English text of any real length, no matter how it\'s been shifted.\n\n' +
      'Write three functions:\n\n' +
      '1. int mostFrequentLetter(const char* text) — count occurrences of each letter a-z (treating ' +
      'upper and lowercase as the same letter), and return the index (0 for \'a\', 1 for \'b\', ... 25 ' +
      'for \'z\') of whichever occurs most. Ignore all non-letter characters entirely.\n\n' +
      '2. void caesarDecode(char* text, int shift) — decode text IN PLACE by shifting every letter ' +
      'BACKWARD by shift positions, wrapping z back past a (and Z past A) exactly like encoding, just ' +
      'in reverse. Leave non-letters untouched.\n\n' +
      '3. void crackCaesar(char* ciphertext) — find the ciphertext\'s most frequent letter, assume IT is ' +
      'the shifted version of \'e\' (the true most-common English letter), work out what shift value ' +
      'would explain that, and call caesarDecode with that shift to decrypt the message in place.',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int mostFrequentLetter(const char* text) {\n' +
      '    // TODO: count occurrences of each letter a-z (case-insensitive) in a 26-slot counts array,\n' +
      '    // then return the index (0-25) of the highest count\n' +
      '    return 0;\n' +
      '}\n\n' +
      'void caesarDecode(char* text, int shift) {\n' +
      '    // TODO: shift each letter in text BACKWARD by `shift` positions in place, wrapping a-z and A-Z;\n' +
      '    // leave non-letters untouched\n' +
      '}\n\n' +
      'void crackCaesar(char* ciphertext) {\n' +
      '    // TODO: find the most frequent letter\'s index, work out the shift that would make it \'e\',\n' +
      '    // and call caesarDecode with that shift\n' +
      '}\n',
    hints: [
      'mostFrequentLetter: declare int counts[26] and zero it with a loop first — C++ does not zero-initialize a plain local array for you.',
      'For each letter, normalize case first (c >= \'A\' && c <= \'Z\' means the same letter as c - \'A\' + \'a\'), then counts[c - \'a\']++ once you know it\'s lowercase-normalized.',
      'Track the best index with a simple scan: start best = 0, then for j = 1 to 25, if counts[j] > counts[best], best = j.',
      'caesarDecode is caesarEncode with the shift subtracted instead of added — the classic negative-safe wraparound is (c - \'a\' - shift) % 26 + 26) % 26, since C++\'s % can return a negative result for a negative left-hand side.',
      'crackCaesar: let eIndex = \'e\' - \'a\' (4). The ciphertext\'s most frequent letter (call it m) is really \'e\' shifted forward by the encryption shift — so shift = ((m - eIndex) % 26 + 26) % 26, and calling caesarDecode(ciphertext, shift) undoes exactly that shift.',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int mostFrequentLetter(const char* text) {\n' +
      '    int counts[26];\n' +
      '    for (int i = 0; i < 26; i++) counts[i] = 0;\n' +
      '    int i = 0;\n' +
      '    while (text[i] != \'\\0\') {\n' +
      '        char c = text[i];\n' +
      '        if (c >= \'a\' && c <= \'z\') counts[c - \'a\']++;\n' +
      '        else if (c >= \'A\' && c <= \'Z\') counts[c - \'A\']++;\n' +
      '        i++;\n' +
      '    }\n' +
      '    int best = 0;\n' +
      '    for (int j = 1; j < 26; j++) {\n' +
      '        if (counts[j] > counts[best]) best = j;\n' +
      '    }\n' +
      '    return best;\n' +
      '}\n\n' +
      'void caesarDecode(char* text, int shift) {\n' +
      '    for (int i = 0; text[i] != \'\\0\'; i++) {\n' +
      '        char c = text[i];\n' +
      '        if (c >= \'a\' && c <= \'z\') {\n' +
      '            text[i] = \'a\' + ((c - \'a\' - shift) % 26 + 26) % 26;\n' +
      '        } else if (c >= \'A\' && c <= \'Z\') {\n' +
      '            text[i] = \'A\' + ((c - \'A\' - shift) % 26 + 26) % 26;\n' +
      '        }\n' +
      '    }\n' +
      '}\n\n' +
      'void crackCaesar(char* ciphertext) {\n' +
      '    int mostCommon = mostFrequentLetter(ciphertext);\n' +
      '    int eIndex = \'e\' - \'a\';\n' +
      '    int shift = ((mostCommon - eIndex) % 26 + 26) % 26;\n' +
      '    caesarDecode(ciphertext, shift);\n' +
      '}\n',
    testCode:
      'bool charEquals(char* a, char* b) {\n' +
      '    int i = 0;\n' +
      '    while (a[i] != \'\\0\' && b[i] != \'\\0\') {\n' +
      '        if (a[i] != b[i]) return false;\n' +
      '        i++;\n' +
      '    }\n' +
      '    return a[i] == \'\\0\' && b[i] == \'\\0\';\n' +
      '}\n' +
      'int __passed = 0;\n' +
      'int __total = 0;\n' +
      'void checkInt(const char* name, int actual, int expected) {\n' +
      '    __total++;\n' +
      '    bool ok = actual == expected;\n' +
      '    if (ok) __passed++;\n' +
      '    cout << (ok ? "[PASS] " : "[FAIL] ") << name << ": got " << actual << ", expected " << expected << endl;\n' +
      '}\n' +
      'void checkStr(const char* name, char* actual, char* expected) {\n' +
      '    __total++;\n' +
      '    bool ok = charEquals(actual, expected);\n' +
      '    if (ok) __passed++;\n' +
      '    cout << (ok ? "[PASS] " : "[FAIL] ") << name << ": got " << actual << ", expected " << expected << endl;\n' +
      '}\n' +
      'int main() {\n' +
      '    char t1[] = "eeeeeeeeee the quick brown fox jumps over the lazy dog";\n' +
      '    checkInt("finds e as most frequent letter", mostFrequentLetter(t1), 4);\n\n' +
      '    char d1[] = "Dwwdfn Dw Gdzq";\n' +
      '    char e1[] = "Attack At Dawn";\n' +
      '    caesarDecode(d1, 3);\n' +
      '    checkStr("caesarDecode reverses a shift-3 encoding", d1, e1);\n\n' +
      '    char d2[] = "abc";\n' +
      '    char e2[] = "xyz";\n' +
      '    caesarDecode(d2, 3);\n' +
      '    checkStr("caesarDecode wraps around correctly", d2, e2);\n\n' +
      '    char cipher1[] = "hhhhhhhhhh wkh txlfn eurzq ira mxpsv ryhu wkh odcb grj";\n' +
      '    char plain1[] = "eeeeeeeeee the quick brown fox jumps over the lazy dog";\n' +
      '    crackCaesar(cipher1);\n' +
      '    checkStr("crackCaesar recovers a shift-3 message with no known key", cipher1, plain1);\n\n' +
      '    char cipher2[] = "iiiiiiiiii xli uymgo fvsar jsb nyqtw sziv xli pedc hsk";\n' +
      '    char plain2[] = "eeeeeeeeee the quick brown fox jumps over the lazy dog";\n' +
      '    crackCaesar(cipher2);\n' +
      '    checkStr("crackCaesar also recovers a different shift with no hint at all", cipher2, plain2);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
  {
    id: 'cpp-capstone-02',
    title: 'Capstone: Password Strength Analyzer',
    difficulty: 'Hard',
    language: 'cpp',
    category: 'Capstone',
    prompt:
      'Build a small password-strength analyzer combining the two checks any real one actually starts ' +
      'from: character-class diversity, and a common-password blocklist (checking against a known-bad ' +
      'list catches "Password1!" instantly, something character-class rules alone would score highly).\n\n' +
      'Write three functions:\n\n' +
      '1. int categoryCount(const char* pw) — returns how many of these 4 categories appear at least ' +
      'once anywhere in pw: lowercase letters, uppercase letters, digits, and "special" characters ' +
      '(anything that is not a letter and not a digit). Result is always between 0 and 4.\n\n' +
      '2. bool isCommonPassword(const char* pw) — returns true if pw exactly matches any entry in this ' +
      'fixed list of 5 known-bad passwords: "password", "123456", "qwerty", "letmein", "admin".\n\n' +
      '3. int strengthScore(const char* pw) — if isCommonPassword(pw) is true, return 0 immediately, no ' +
      'matter what else is true about it. Otherwise: start at 0, add 2 if pw is at least 8 characters ' +
      'long, add 1 MORE (so 3 total) if it\'s at least 12 characters long, then add categoryCount(pw). ' +
      'Maximum possible score is 7 (3 for length + 4 for every category present).',
    starterCode:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int strlenC(const char* s) {\n' +
      '    int i = 0;\n' +
      '    while (s[i] != \'\\0\') i++;\n' +
      '    return i;\n' +
      '}\n\n' +
      'int strcmpArr(const char* a, const char* b) {\n' +
      '    int i = 0;\n' +
      '    while (a[i] != \'\\0\' && b[i] != \'\\0\') { if (a[i] != b[i]) return a[i] - b[i]; i++; }\n' +
      '    return a[i] - b[i];\n' +
      '}\n\n' +
      'int categoryCount(const char* pw) {\n' +
      '    // TODO: track whether lowercase / uppercase / digit / special each appear at least once,\n' +
      '    // then return how many of those 4 booleans are true\n' +
      '    return 0;\n' +
      '}\n\n' +
      'bool isCommonPassword(const char* pw) {\n' +
      '    // TODO: check pw against the fixed list of 5 common passwords using strcmpArr\n' +
      '    return false;\n' +
      '}\n\n' +
      'int strengthScore(const char* pw) {\n' +
      '    // TODO: 0 immediately if isCommonPassword; otherwise length bonus (2 for >=8, +1 more for\n' +
      '    // >=12) plus categoryCount\n' +
      '    return 0;\n' +
      '}\n',
    hints: [
      'categoryCount: declare 4 bool flags, all starting false, then walk the string once — for each char, check which of the 4 ranges it falls in (a-z, A-Z, 0-9, else) and set the matching flag true. Anything not a letter and not a digit counts as "special", including spaces and punctuation.',
      'After the walk, count how many of the 4 flags are true with a plain if-chain: count += hasLower ? 1 : 0 (or just if (hasLower) count++;) for each.',
      'isCommonPassword: declare char common[5][20] = {"password", "123456", "qwerty", "letmein", "admin"}; and loop i from 0 to 4, returning true the moment strcmpArr(pw, common[i]) == 0.',
      'strengthScore: check isCommonPassword FIRST and return 0 immediately if true — do not add any other points in that case, even if the password happens to also be long or mixed-case.',
      'For the length bonus: if (strlenC(pw) >= 8) score += 2; then separately if (strlenC(pw) >= 12) score += 1; — these two checks are independent (a 12-char password gets both, a 9-char password only gets the first).',
    ],
    solution:
      '#include <iostream>\n' +
      'using namespace std;\n\n' +
      'int strlenC(const char* s) {\n' +
      '    int i = 0;\n' +
      '    while (s[i] != \'\\0\') i++;\n' +
      '    return i;\n' +
      '}\n\n' +
      'int strcmpArr(const char* a, const char* b) {\n' +
      '    int i = 0;\n' +
      '    while (a[i] != \'\\0\' && b[i] != \'\\0\') { if (a[i] != b[i]) return a[i] - b[i]; i++; }\n' +
      '    return a[i] - b[i];\n' +
      '}\n\n' +
      'int categoryCount(const char* pw) {\n' +
      '    bool hasLower = false, hasUpper = false, hasDigit = false, hasSpecial = false;\n' +
      '    int i = 0;\n' +
      '    while (pw[i] != \'\\0\') {\n' +
      '        char c = pw[i];\n' +
      '        if (c >= \'a\' && c <= \'z\') hasLower = true;\n' +
      '        else if (c >= \'A\' && c <= \'Z\') hasUpper = true;\n' +
      '        else if (c >= \'0\' && c <= \'9\') hasDigit = true;\n' +
      '        else hasSpecial = true;\n' +
      '        i++;\n' +
      '    }\n' +
      '    int count = 0;\n' +
      '    if (hasLower) count++;\n' +
      '    if (hasUpper) count++;\n' +
      '    if (hasDigit) count++;\n' +
      '    if (hasSpecial) count++;\n' +
      '    return count;\n' +
      '}\n\n' +
      'bool isCommonPassword(const char* pw) {\n' +
      '    char common[5][20] = {"password", "123456", "qwerty", "letmein", "admin"};\n' +
      '    for (int i = 0; i < 5; i++) {\n' +
      '        if (strcmpArr(pw, common[i]) == 0) return true;\n' +
      '    }\n' +
      '    return false;\n' +
      '}\n\n' +
      'int strengthScore(const char* pw) {\n' +
      '    if (isCommonPassword(pw)) return 0;\n' +
      '    int score = 0;\n' +
      '    int len = strlenC(pw);\n' +
      '    if (len >= 8) score += 2;\n' +
      '    if (len >= 12) score += 1;\n' +
      '    score += categoryCount(pw);\n' +
      '    return score;\n' +
      '}\n',
    testCode:
      'int __passed = 0;\n' +
      'int __total = 0;\n' +
      'void checkInt(const char* name, int actual, int expected) {\n' +
      '    __total++;\n' +
      '    bool ok = actual == expected;\n' +
      '    if (ok) __passed++;\n' +
      '    cout << (ok ? "[PASS] " : "[FAIL] ") << name << ": got " << actual << ", expected " << expected << endl;\n' +
      '}\n' +
      'void checkBool(const char* name, bool actual, bool expected) {\n' +
      '    __total++;\n' +
      '    bool ok = actual == expected;\n' +
      '    if (ok) __passed++;\n' +
      '    cout << (ok ? "[PASS] " : "[FAIL] ") << name << ": got " << actual << ", expected " << expected << endl;\n' +
      '}\n' +
      'int main() {\n' +
      '    checkInt("categoryCount: all 4 categories present", categoryCount("abcXYZ123!@#"), 4);\n' +
      '    checkInt("categoryCount: lowercase only", categoryCount("abcdef"), 1);\n' +
      '    checkInt("categoryCount: letters and digits only", categoryCount("abc123"), 2);\n\n' +
      '    checkBool("isCommonPassword: exact match", isCommonPassword("qwerty"), true);\n' +
      '    checkBool("isCommonPassword: not in the list", isCommonPassword("Xk9!mQ2p"), false);\n\n' +
      '    checkInt("strengthScore: common password scores 0 no matter what", strengthScore("password"), 0);\n' +
      '    checkInt("strengthScore: short single-category password", strengthScore("abc"), 1);\n' +
      '    checkInt("strengthScore: 8+ chars, 1 category", strengthScore("abcdefgh"), 3);\n' +
      '    checkInt("strengthScore: 9 chars, 3 categories", strengthScore("Abcdefgh1"), 5);\n' +
      '    checkInt("strengthScore: 12+ chars, all 4 categories (max score)", strengthScore("Abcdefgh12!@"), 7);\n\n' +
      '    cout << "__RESULT__ " << __passed << "/" << __total << endl;\n' +
      '    return 0;\n' +
      '}\n',
  },
];
