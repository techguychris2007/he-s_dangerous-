import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Word Frequency Counter

A small, genuinely useful text-processing algorithm: count word frequencies in a block of text and
return the top N, breaking ties alphabetically so the result is deterministic.
`;

const STARTER = `def top_n_words(text, n):
    """Split \`text\` into lowercase words (split on whitespace; strip punctuation from each word's
    ends), count how many times each appears, and return a list of the top \`n\` (word, count) tuples
    sorted by count DESCENDING, then word ALPHABETICALLY ascending for ties."""
    # TODO
    pass
`;

const SOLUTION = `import string


def top_n_words(text, n):
    counts = {}
    for raw_word in text.lower().split():
        word = raw_word.strip(string.punctuation)
        if not word:
            continue
        counts[word] = counts.get(word, 0) + 1

    ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return ranked[:n]
`;

const TEST_CODE = `from word_freq import top_n_words

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

text = "the quick brown fox jumps over the lazy dog. The dog barks!"
result = top_n_words(text, 3)
__check__("top word is 'the' with count 3", result[0], ("the", 3))
__check__("second word is 'dog' with count 2", result[1], ("dog", 2))
__check__("returns exactly n results", len(result), 3)

tie_text = "b a c a b c"
tie_result = top_n_words(tie_text, 3)
__check__("ties broken alphabetically", tie_result, [("a", 2), ("b", 2), ("c", 2)])

__check__("n larger than distinct words returns all of them", len(top_n_words("one two", 10)), 2)
__check__("punctuation stripped from word ends", top_n_words("hello, hello!", 1), [("hello", 2)])
__check__("empty text returns empty list", top_n_words("", 3), [])

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-020',
  title: 'Word Frequency Counter',
  difficulty: 'Medium',
  language: 'python',
  track: 'foundations',
  category: 'Algorithms in Practice',
  tags: ['algorithms', 'strings', 'sorting'],
  prompt: 'Count word frequencies in a block of text and return the top N, with deterministic alphabetical tie-breaking.',
  hints: [
    '`text.lower().split()` gets you lowercase whitespace-separated tokens; `word.strip(string.punctuation)` trims leading/trailing punctuation from each one (needs `import string`).',
    'Skip a token entirely with `continue` if stripping punctuation leaves it empty (e.g. a token that was just "!").',
    'Build counts the same way as any frequency dict: `counts[word] = counts.get(word, 0) + 1`.',
    'The sort key is the trick: `sorted(counts.items(), key=lambda item: (-item[1], item[0]))` sorts by count descending (negate it) and word ascending, in one pass — then slice `[:n]`.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('word_freq.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('word_freq.py', SOLUTION)],
  targets: [{ id: 'main', label: 'Word Frequency Counter', kind: 'python', entry: 'word_freq.py', testCode: TEST_CODE }],
};

export default task;
