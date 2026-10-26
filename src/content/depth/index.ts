import type { CurriculumLesson } from '../curriculumDefinition';
import type { LessonDepth } from './types';
import { PRE_SECURITY_DEPTH } from './preSecurity';
import { DEFENSIVE_DEPTH } from './defensive';
import { ADVANCED_DEPTH } from './advanced';
import { INTERMEDIATE_DEPTH } from './intermediate';

export const LESSON_DEPTH: Record<string, LessonDepth> = { ...PRE_SECURITY_DEPTH, ...DEFENSIVE_DEPTH, ...ADVANCED_DEPTH, ...INTERMEDIATE_DEPTH };

/** Adds beginner depth to a lesson: extra vocabulary, a plain-English opening before the technical
 *  sections and worked examples after them. Lessons without an entry are returned unchanged. */
export function withDepth(lesson: CurriculumLesson): CurriculumLesson {
  const depth = LESSON_DEPTH[lesson.id];
  if (!depth) return lesson;
  const known = new Set((lesson.keyTerms ?? []).map((k) => k.term.toLowerCase()));
  return {
    ...lesson,
    keyTerms: [...(lesson.keyTerms ?? []), ...(depth.keyTerms ?? []).filter((k) => !known.has(k.term.toLowerCase()))],
    sections: [...(depth.before ?? []), ...lesson.sections, ...(depth.after ?? [])],
  };
}
