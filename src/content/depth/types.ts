import type { CurriculumLesson } from '../curriculumDefinition';

type Section = CurriculumLesson['sections'][number];

/** Beginner depth added to an existing lesson: vocabulary, a plain-English opening that comes before
 *  the technical sections, and worked examples that come after them. Merged in curriculumModule. */
export interface LessonDepth {
  keyTerms?: { term: string; meaning: string }[];
  before?: Section[];
  after?: Section[];
}
