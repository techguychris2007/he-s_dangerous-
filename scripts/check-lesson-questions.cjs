// Every lesson ends TryHackMe-style: at least two typed-answer questions whose answers are short enough
// to type, accept their own answer and accepted variants, and never repeat within a lesson. The question
// bank may only reference real lessons. (Answer-in-lesson-text checks run at authoring time.)
require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { MODULES } = require('../src/data/curriculum.ts');
const { QUESTION_BANK } = require('../src/data/questionBank/index.ts');
const { lessonQuestions, isCorrectAnswer, normaliseAnswer, answerMask, isCapturedFlag } = require('../src/data/lessonQuestions.ts');

const lessonIds = new Set(MODULES.flatMap((m) => m.lessons.map((l) => l.id)));
for (const id of Object.keys(QUESTION_BANK)) assert.ok(lessonIds.has(id), `question bank references unknown lesson ${id}`);

let questions = 0;
for (const mod of MODULES) {
  for (const lesson of mod.lessons) {
    const qs = lessonQuestions(lesson);
    assert.ok(qs.length >= 2, `${lesson.id} needs two typed questions, has ${qs.length}`);
    const prompts = new Set();
    for (const q of qs) {
      assert.ok(q.prompt.trim().length > 10, `${lesson.id}: prompt too short`);
      assert.ok(!prompts.has(q.prompt), `${lesson.id}: duplicate prompt`);
      prompts.add(q.prompt);
      assert.ok(q.answer.length <= 50 && q.answer.split(/\s+/).length <= 6, `${lesson.id}: answer not typeable: ${q.answer}`);
      assert.ok(normaliseAnswer(q.answer).length > 0, `${lesson.id}: answer normalises to nothing: ${q.answer}`);
      assert.ok(isCorrectAnswer(q, q.answer), `${lesson.id}: answer rejected: ${q.answer}`);
      assert.ok(isCorrectAnswer(q, `  ${q.answer.toUpperCase()}  `), `${lesson.id}: case/space-insensitive match failed`);
      for (const alt of q.accept ?? []) assert.ok(isCorrectAnswer(q, alt), `${lesson.id}: accepted variant rejected: ${alt}`);
      assert.ok(!isCorrectAnswer(q, ''), `${lesson.id}: empty answer accepted`);
      assert.ok(!isCorrectAnswer(q, 'definitely-not-the-answer'), `${lesson.id}: wrong answer accepted`);
      assert.equal(answerMask(q.answer).length, q.answer.length);
      questions++;
    }
  }
}
assert.ok(isCapturedFlag(['flag{abc}'], ' FLAG{abc} '));
assert.ok(!isCapturedFlag(['flag{abc}'], 'flag{abd}'));
assert.ok(!isCapturedFlag([], 'flag{abc}'));
console.log(`Lesson tasks: ${lessonIds.size} lessons, ${questions} typed questions validated; flags accepted only when captured.`);
