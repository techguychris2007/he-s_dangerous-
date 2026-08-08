import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# String Utilities

Three small string-manipulation functions — loops, indexing, and string methods, still no
collections beyond the strings themselves.
`;

const STARTER = `def reverse_words(sentence):
    """Reverse the ORDER of words in \`sentence\` (not the letters). "a b c" -> "c b a"."""
    # TODO
    pass


def is_palindrome(word):
    """Return True if \`word\` reads the same forwards and backwards, case-insensitive."""
    # TODO
    pass


def title_case_words(sentence):
    """Capitalize the first letter of every word, lowercase the rest. "hello WORLD" -> "Hello World"."""
    # TODO
    pass
`;

const SOLUTION = `def reverse_words(sentence):
    return ' '.join(sentence.split()[::-1])


def is_palindrome(word):
    lowered = word.lower()
    return lowered == lowered[::-1]


def title_case_words(sentence):
    return ' '.join(w.capitalize() for w in sentence.split())
`;

const TEST_CODE = `from strings import reverse_words, is_palindrome, title_case_words

__results__ = []
def __check__(name, actual, expected):
    __results__.append((name, actual == expected, actual, expected))

__check__("reverse three words", reverse_words("a b c"), "c b a")
__check__("reverse single word", reverse_words("hello"), "hello")
__check__("palindrome true", is_palindrome("Racecar"), True)
__check__("palindrome false", is_palindrome("python"), False)
__check__("palindrome even length", is_palindrome("noon"), True)
__check__("title case mixed", title_case_words("hello WORLD"), "Hello World")
__check__("title case multi", title_case_words("the quick BROWN fox"), "The Quick Brown Fox")

for name, ok, actual, expected in __results__:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}: got {actual!r}, expected {expected!r}")
print(f"__RESULT__ {sum(1 for _,ok,_,_ in __results__ if ok)}/{len(__results__)}")
`;

const task: ProjectTask = {
  id: 'se-py-fnd-003',
  title: 'String Utilities',
  difficulty: 'Easy',
  language: 'python',
  track: 'foundations',
  category: 'Language Core',
  tags: ['strings', 'slicing'],
  prompt: 'Three string-manipulation functions built on Python\'s slicing and string methods.',
  hints: [
    '`sentence.split()` gives you a list of words; `[::-1]` reverses any sequence, then `" ".join(...)` puts it back together.',
    'A slice like `word[::-1]` reverses a string in one step — compare it to the lowercased original.',
    'Remember to lowercase before comparing in `is_palindrome`, so "Racecar" still counts.',
    '`str.capitalize()` uppercases the first letter and lowercases the rest of a single word — apply it per word, then rejoin.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('strings.py', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('strings.py', SOLUTION)],
  targets: [{ id: 'main', label: 'String Utilities', kind: 'python', entry: 'strings.py', testCode: TEST_CODE }],
};

export default task;
