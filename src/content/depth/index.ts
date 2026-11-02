import type { CurriculumLesson } from '../curriculumDefinition';
import type { LessonDepth } from './types';
import { PRE_SECURITY_DEPTH } from './preSecurity';
import { DEFENSIVE_DEPTH } from './defensive';
import { ADVANCED_DEPTH } from './advanced';
import { INTERMEDIATE_DEPTH } from './intermediate';
import { SOFTWARE_ENGINEERING_DEPTH } from './softwareEngineering';
import { SOFTWARE_ENGINEERING_BASICS_DEPTH } from './softwareEngineeringBasics';
import { SOFTWARE_ENGINEERING_PRACTICE_DEPTH } from './softwareEngineeringPractice';
import { KALI_WORKSTATION_DEPTH } from './kaliWorkstation';

/** Combines depth sources so one lesson can draw from several (for example a plain-English opening in
 *  one file and worked practice in another) instead of the later source replacing the earlier one. */
function mergeDepth(...sources: Record<string, LessonDepth>[]): Record<string, LessonDepth> {
  const merged: Record<string, LessonDepth> = {};
  for (const source of sources) {
    for (const [id, depth] of Object.entries(source)) {
      const prior = merged[id] ?? {};
      merged[id] = {
        keyTerms: [...(prior.keyTerms ?? []), ...(depth.keyTerms ?? [])],
        before: [...(prior.before ?? []), ...(depth.before ?? [])],
        after: [...(prior.after ?? []), ...(depth.after ?? [])],
      };
    }
  }
  return merged;
}

export const LESSON_DEPTH: Record<string, LessonDepth> = mergeDepth(
  PRE_SECURITY_DEPTH, KALI_WORKSTATION_DEPTH, DEFENSIVE_DEPTH, ADVANCED_DEPTH, INTERMEDIATE_DEPTH,
  SOFTWARE_ENGINEERING_DEPTH, SOFTWARE_ENGINEERING_BASICS_DEPTH, SOFTWARE_ENGINEERING_PRACTICE_DEPTH,
);

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
