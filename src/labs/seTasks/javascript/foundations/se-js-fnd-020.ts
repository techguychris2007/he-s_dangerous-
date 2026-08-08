import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# Word Frequency Counter

A small, genuinely useful text-processing algorithm: count word frequencies in a block of text and
return the top N, breaking ties alphabetically so the result is deterministic.
`;

const STARTER = `function topNWords(text, n) {
  // TODO: split text into lowercase words (split on whitespace; strip punctuation from each word's
  // ends), count how many times each appears, and return an array of the top n [word, count] pairs
  // sorted by count DESCENDING, then word ALPHABETICALLY ascending for ties.
}

module.exports = { topNWords };
`;

const SOLUTION = `function topNWords(text, n) {
  const counts = {};
  for (const rawWord of text.toLowerCase().split(/\\s+/)) {
    const word = rawWord.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
    if (!word) continue;
    counts[word] = (counts[word] || 0) + 1;
  }

  const ranked = Object.entries(counts).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  });
  return ranked.slice(0, n);
}

module.exports = { topNWords };
`;

const TEST_CODE = `const { topNWords } = require('./word_freq');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

const text = 'the quick brown fox jumps over the lazy dog. The dog barks!';
const result = topNWords(text, 3);
check("top word is 'the' with count 3", result[0], ['the', 3]);
check("second word is 'dog' with count 2", result[1], ['dog', 2]);
check('returns exactly n results', result.length, 3);

const tieText = 'b a c a b c';
const tieResult = topNWords(tieText, 3);
check('ties broken alphabetically', tieResult, [['a', 2], ['b', 2], ['c', 2]]);

check('n larger than distinct words returns all of them', topNWords('one two', 10).length, 2);
check('punctuation stripped from word ends', topNWords('hello, hello!', 1), [['hello', 2]]);
check('empty text returns empty array', topNWords('', 3), []);

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-020',
  title: 'Word Frequency Counter',
  difficulty: 'Medium',
  language: 'javascript',
  track: 'foundations',
  category: 'Algorithms in Practice',
  tags: ['algorithms', 'strings', 'sorting'],
  prompt: 'Count word frequencies in a block of text and return the top N, with deterministic alphabetical tie-breaking.',
  hints: [
    '`text.toLowerCase().split(/\\s+/)` gets you lowercase whitespace-separated tokens; a regex like `/^[^a-z0-9]+|[^a-z0-9]+$/g` strips leading/trailing punctuation from each one.',
    "Skip a token entirely with `continue` if stripping punctuation leaves it empty (e.g. a token that was just \"!\").",
    'Build counts the same way as any frequency object: `counts[word] = (counts[word] || 0) + 1`.',
    '`Object.entries(counts).sort((a, b) => b[1] - a[1] || ...)` sorts by count descending, then falls back to comparing the word strings alphabetically for ties — then `.slice(0, n)`.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('word_freq.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('word_freq.js', SOLUTION)],
  targets: [{ id: 'main', label: 'Word Frequency Counter', kind: 'node-js', entry: 'word_freq.js', testCode: TEST_CODE }],
};

export default task;
