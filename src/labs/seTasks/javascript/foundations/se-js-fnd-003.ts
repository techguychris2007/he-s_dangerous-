import { pf, type ProjectTask } from '../../../projectTypes';

const README = `# String Utilities

Three small string-manipulation functions — loops (via array methods), indexing, and string
methods, still no collections beyond the strings themselves.
`;

const STARTER = `function reverseWords(sentence) {
  // TODO: reverse the ORDER of words (not the letters). "a b c" -> "c b a"
}

function isPalindrome(word) {
  // TODO: true if word reads the same forwards and backwards, case-insensitive
}

function titleCaseWords(sentence) {
  // TODO: capitalize the first letter of every word, lowercase the rest. "hello WORLD" -> "Hello World"
}

module.exports = { reverseWords, isPalindrome, titleCaseWords };
`;

const SOLUTION = `function reverseWords(sentence) {
  return sentence.split(' ').reverse().join(' ');
}

function isPalindrome(word) {
  const lowered = word.toLowerCase();
  return lowered === lowered.split('').reverse().join('');
}

function titleCaseWords(sentence) {
  return sentence
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

module.exports = { reverseWords, isPalindrome, titleCaseWords };
`;

const TEST_CODE = `const { reverseWords, isPalindrome, titleCaseWords } = require('./strings');

let passed = 0, total = 0;
function check(name, actual, expected) {
  total++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + name + (ok ? '' : ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected)));
}

check('reverse three words', reverseWords('a b c'), 'c b a');
check('reverse single word', reverseWords('hello'), 'hello');
check('palindrome true', isPalindrome('Racecar'), true);
check('palindrome false', isPalindrome('python'), false);
check('palindrome even length', isPalindrome('noon'), true);
check('title case mixed', titleCaseWords('hello WORLD'), 'Hello World');
check('title case multi', titleCaseWords('the quick BROWN fox'), 'The Quick Brown Fox');

console.log('__RESULT__ ' + passed + '/' + total);
`;

const task: ProjectTask = {
  id: 'se-js-fnd-003',
  title: 'String Utilities',
  difficulty: 'Easy',
  language: 'javascript',
  track: 'foundations',
  category: 'Language Core',
  tags: ['strings', 'array-methods'],
  prompt: "Three string-manipulation functions built on JavaScript's array methods and string methods.",
  hints: [
    '`sentence.split(\' \')` gives you an array of words; `.reverse()` reverses it in place, then `.join(\' \')` puts it back together.',
    '`word.split(\'\').reverse().join(\'\')` reverses a string — compare it to the lowercased original.',
    'Lowercase before comparing in `isPalindrome`, so "Racecar" still counts.',
    '`w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()` capitalizes one word — `.map()` that over the split sentence, then rejoin.',
  ],
  files: [pf('README.md', README, { editable: false }), pf('strings.js', STARTER)],
  solutionFiles: [pf('README.md', README, { editable: false }), pf('strings.js', SOLUTION)],
  targets: [{ id: 'main', label: 'String Utilities', kind: 'node-js', entry: 'strings.js', testCode: TEST_CODE }],
};

export default task;
