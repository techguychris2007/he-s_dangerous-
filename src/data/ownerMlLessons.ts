import type { MlLesson } from './mlLessons/types';

/** Machine learning lessons. They are not part of the app bundle: src/lib/ownerContent.ts fills this
 *  list from the private owner-content bucket for the owner accounts only. */
export const ML_LESSONS: MlLesson[] = [];

export function registerMlLessons(lessons: MlLesson[]) {
  const known = new Set(ML_LESSONS.map(lesson => lesson.id));
  ML_LESSONS.push(...lessons.filter(lesson => !known.has(lesson.id)));
}

export function findMlLesson(id: string): MlLesson | undefined {
  return ML_LESSONS.find((lesson) => lesson.id === id);
}
