const assert = require('node:assert/strict');
require('./register-typescript.cjs');
const { rankPassages, pagePassages, queryTerms } = require('../src/lib/librarySearch.ts');
const docs = [
  { bookId: 'python', title: 'Python reference', page: 12, text: 'A recursive function calls itself. Recursion needs a base case to stop the repeated calls. Each recursive call handles a smaller version of the original problem.' },
  { bookId: 'python', title: 'Python reference', page: 12, text: 'Recursion can solve a smaller problem and combine the answers. The base case prevents endless recursion.' },
  { bookId: 'security', title: 'Security reference', page: 48, text: 'The Secure Shell protocol uses cryptographic host keys to authenticate a server. A client should verify the host identity before sending credentials across the network.' },
  { bookId: 'ml', title: 'ML reference', page: 27, text: 'Overfitting occurs when a model learns training noise instead of general patterns. Validation data helps estimate how well the model will generalize to unseen examples.' },
  { bookId: 'python', title: 'Python reference', page: 2, text: 'Recursion . . . . . . . . . . . . . . . . 43\nInfinite recursion . . . . . . . . . . . . . . . 44\nRecursive functions . . . . . . . . . . . . . . 45' },
];
assert.equal(rankPassages('What is recursion?', docs)[0].page, 12);
assert.equal(rankPassages('SSH', docs)[0].bookId, 'security');
assert.equal(rankPassages('Explain overfitting and validation', docs)[0].bookId, 'ml');
assert.equal(rankPassages('What is the current weather in Accra?', docs).length, 0);
assert.equal(rankPassages('please explain this lesson', docs).length, 0);
assert.equal(rankPassages('', docs).length, 0);
assert.equal(rankPassages('recursion base case', docs).filter(p => p.bookId === 'python').length, 1, 'Deduplicate same-page sources');
for (const source of rankPassages('recursion', docs)) assert.ok(docs.some(p => p.text === source.text && p.page === source.page), 'Source wording and pages must be real');
const text = ('A recursive function calls itself until a base case is reached.\n').repeat(25);
const chunks = pagePassages('python', 'Python reference', 5, text);
assert.ok(chunks.length > 1);
assert.ok(chunks.every(p => p.page === 5 && p.bookId === 'python' && p.text.length >= 100));
assert.equal(pagePassages('scanned', 'Scanned PDF', 1, '').length, 0);
assert.ok(!queryTerms('Help me understand SSH in the context of this lesson. Explain the idea and show a practical example.').includes('lesson'));
console.log('Offline retrieval passed: relevant ranking, acronym expansion, abstention, real source text/pages, chunking and source deduplication.');

const { resolveLibraryQuestion, sourceAnswer, supportedSpan } = require('../src/lib/libraryQuestion.ts');
const history = [{role:'user',content:'What is recursion?'},{role:'assistant',content:'A recursive function calls itself.'}];
assert.ok(resolveLibraryQuestion('Why does it need a base case?',{history}).includes('Topic: What is recursion?'));
assert.equal(resolveLibraryQuestion('What is DNS?',{history}), 'What is DNS?', 'A new subject replaces the earlier subject');
assert.ok(resolveLibraryQuestion('Explain this page.',{title:'SSH host keys'}).includes('SSH host keys'));
const direct = sourceAnswer('What is recursion?',docs.slice(0,1));
assert.ok(direct.answer.includes('recursive') || direct.answer.includes('Recursion'));
assert.ok(direct.answer.length < 500 && !direct.answer.includes('These passages'));
for(const sentence of direct.answer.split('\n\n')) assert.ok(docs[0].text.includes(sentence), 'Answers must retain actual source wording');
assert.equal(supportedSpan('a base case',.9,docs[0]),true);
assert.equal(supportedSpan('a magic timer',.9,docs[0]),false,'Reject fabricated model spans');
assert.equal(supportedSpan('base case',.01,docs[0]),false,'Reject low-confidence spans');
assert.equal(rankPassages('Could you tell me how SSH works and why I should verify identity?',docs)[0].bookId,'security');
console.log('Book answers passed: conversational follow-ups, topic changes, compact direct answers and supported model spans.');
