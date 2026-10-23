import type { LessonMeta, TypedQuestion } from '../types';
import { QUESTION_BANK } from './questionBank';

/** Shortest answers that are reasonable to type exactly (THM-style "Answer format: *** ****"). */
const MAX_ANSWER_CHARS = 30;
const MAX_ANSWER_WORDS = 4;
export const QUESTIONS_PER_LESSON = 2;

const typeable = (answer: string) => answer.length <= MAX_ANSWER_CHARS && answer.trim().split(/\s+/).length <= MAX_ANSWER_WORDS;

/** The typed questions that close a lesson: authored ones first, then the lesson's own vocabulary
 *  ("which term means …"). Old multiple-choice answers are full sentences, so they are never reused. */
export function lessonQuestions(lesson: LessonMeta): TypedQuestion[] {
  const picked: TypedQuestion[] = [...(lesson.questions ?? QUESTION_BANK[lesson.id] ?? [])];
  const terms = (lesson.keyTerms ?? []).filter((t) => typeable(t.term));
  for (const t of terms) {
    if (picked.length >= QUESTIONS_PER_LESSON) break;
    if (picked.some((p) => normaliseAnswer(p.answer) === normaliseAnswer(t.term))) continue;
    picked.push({ prompt: `Which term from this lesson means: "${t.meaning.replace(/\.$/, '')}"?`, answer: t.term });
  }
  return picked.slice(0, QUESTIONS_PER_LESSON);
}

/** Lower-case, drop punctuation, leading articles and repeated spaces so "The SYN flag." == "syn flag". */
export function normaliseAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .replace(/[.]+$/g, '')
    .replace(/^(the|a|an)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCorrectAnswer(question: TypedQuestion, attempt: string): boolean {
  const given = normaliseAnswer(attempt);
  if (!given) return false;
  return [question.answer, ...(question.accept ?? [])].some((ok) => normaliseAnswer(ok) === given);
}

/** THM answer-format mask: every letter or digit becomes "*", spaces and symbols stay. */
export function answerMask(answer: string): string {
  return answer.replace(/[A-Za-z0-9]/g, '*');
}

/** A submitted flag counts only if it is one the learner actually captured in that lab. */
export function isCapturedFlag(captured: readonly string[], attempt: string): boolean {
  const given = attempt.trim().toLowerCase();
  return given.length > 0 && captured.some((flag) => flag.trim().toLowerCase() === given);
}
