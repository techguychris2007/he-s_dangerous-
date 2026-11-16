import type { LessonDepth } from './types';
import { mergeDepth } from './index';
import { SOFTWARE_ENGINEERING_DEPTH } from './softwareEngineering';
import { SOFTWARE_ENGINEERING_BASICS_DEPTH } from './softwareEngineeringBasics';
import { SOFTWARE_ENGINEERING_PRACTICE_DEPTH } from './softwareEngineeringPractice';

/** Depth for the owner-only software engineering lessons. Never imported by the app: it is applied
 *  before upload to the private owner-content bucket. */
export const SOFTWARE_ENGINEERING_LESSON_DEPTH: Record<string, LessonDepth> = mergeDepth(
  SOFTWARE_ENGINEERING_DEPTH, SOFTWARE_ENGINEERING_BASICS_DEPTH, SOFTWARE_ENGINEERING_PRACTICE_DEPTH,
);
