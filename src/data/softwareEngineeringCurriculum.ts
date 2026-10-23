import type { ModuleMeta, RoadmapStage } from '../types';
import { curriculumModule } from '../content/curriculumDefinition';
import { SE_MODULE_1 } from '../content/software-engineering/m1-engineering-mindset';
import { SE_MODULE_2 } from '../content/software-engineering/m2-construction';
import { SE_MODULE_3 } from '../content/software-engineering/m3-testing';
import { SE_MODULE_4 } from '../content/software-engineering/m4-design';
import { SE_MODULE_5 } from '../content/software-engineering/m5-data-systems';

const SOURCES = ['SWEBOK Guide V4.0', 'Software Engineering at Google'];

/** Programming for Software Engineering: a SWEBOK V4-aligned track, separate from the
 *  security-focused programming path, with verified coding tasks paired to every lesson. */
export const SE_MODULES: ModuleMeta[] = [
  curriculumModule({
    id: 'se-foundations',
    slug: 'se-foundations',
    title: 'SE 1 · The Engineering Mindset & Toolchain',
    subtitle: 'Programming over time, Git workflows, scientific debugging and requirements',
    description: 'Start thinking like a professional engineer: why code that lives for years needs different habits, how to use Git the way strong teams do, how to debug with a method instead of guesswork, and how to turn vague requests into testable acceptance criteria.',
    sourceBooks: [...SOURCES, 'Pro Git', 'The Debugging Book'],
    icon: 'route',
  }, SE_MODULE_1),
  curriculumModule({
    id: 'se-construction',
    slug: 'se-construction',
    title: 'SE 2 · Software Construction',
    subtitle: 'Specifications, abstract data types, error handling and refactoring',
    description: 'Build code other people can rely on: precise specifications and contracts, abstract data types that protect their invariants, error handling that fails fast and fails safely, and refactoring in small, test-protected steps.',
    sourceBooks: [...SOURCES, 'MIT 6.102 Software Construction', 'Refactoring (Fowler)'],
    icon: 'code',
  }, SE_MODULE_2),
  curriculumModule({
    id: 'se-testing',
    slug: 'se-testing',
    title: 'SE 3 · Testing & Quality',
    subtitle: 'Test design, pytest and test doubles, property-based and integration testing, TDD and review',
    description: 'Learn to choose the few tests that find most bugs, design code that is easy to test, let the computer generate edge cases, test real collaborators together, and build a quality culture with TDD, code review and automated gates. Two coding tasks grade your tests with mutation testing.',
    sourceBooks: [...SOURCES, 'MIT 6.102 Software Construction', 'The Practical Test Pyramid'],
    icon: 'bug',
  }, SE_MODULE_3),
  curriculumModule({
    id: 'se-design',
    slug: 'se-design',
    title: 'SE 4 · Design & Architecture',
    subtitle: 'Design principles, patterns, architecture styles, decision records and API design',
    description: 'Make change cheap: coupling, cohesion, SOLID and information hiding; the patterns worth knowing; architecture styles chosen from quality attributes and recorded in ADRs; fitness functions that stop erosion; and HTTP APIs with correct semantics, problem-details errors, cursor pagination and idempotent writes.',
    sourceBooks: [...SOURCES, 'Architecture Decision Records', 'RFC 9110 / RFC 9457'],
    icon: 'layers',
  }, SE_MODULE_4),
  curriculumModule({
    id: 'se-data-systems',
    slug: 'se-data-systems',
    title: 'SE 5 · Data, Concurrency & Distributed Systems',
    subtitle: 'Transactions and indexes, concurrency control, resilience patterns and performance',
    description: 'Keep data correct and systems up under load: schemas, indexes and isolation levels; optimistic locking and N+1 fixes; threads, asyncio, the GIL and deadlock prevention; timeouts, jittered retries, circuit breakers and the transactional outbox; and performance work driven by profiles, percentiles and Little\'s law.',
    sourceBooks: [...SOURCES, 'Designing Data-Intensive Applications', 'Amazon Builders\' Library'],
    icon: 'database',
  }, SE_MODULE_5),
];

export const SE_ROADMAP: RoadmapStage[] = SE_MODULES.map((module) => ({
  title: module.title,
  status: 'available',
  moduleSlug: module.slug,
  sourceBooks: module.sourceBooks,
  track: 'software',
}));

/** Lesson → paired Code Portal tasks (two verified tasks per lesson). */
export const SE_LESSON_TASKS: Record<string, string[]> = {
  'swe-1': ['se-swe-01', 'se-swe-02'],
  'swe-2': ['se-swe-03', 'se-swe-04'],
  'swe-3': ['se-swe-05', 'se-swe-06'],
  'swe-4': ['se-swe-07', 'se-swe-08'],
  'swe-5': ['se-swe-09', 'se-swe-10'],
  'swe-6': ['se-swe-11', 'se-swe-12'],
  'swe-7': ['se-swe-13', 'se-swe-14'],
  'swe-8': ['se-swe-15', 'se-swe-16'],
  'swe-9': ['se-swe-17', 'se-swe-18'],
  'swe-10': ['se-swe-19', 'se-swe-20'],
  'swe-11': ['se-swe-21', 'se-swe-22'],
  'swe-12': ['se-swe-23', 'se-swe-24'],
  'swe-13': ['se-swe-25', 'se-swe-26'],
  'swe-14': ['se-swe-27', 'se-swe-28'],
  'swe-15': ['se-swe-29', 'se-swe-30'],
  'swe-16': ['se-swe-31', 'se-swe-32'],
  'swe-17': ['se-swe-33', 'se-swe-34'],
  'swe-18': ['se-swe-35', 'se-swe-36'],
  'swe-19': ['se-swe-37', 'se-swe-38', 'se-swe-39'],
  'swe-20': ['se-swe-40', 'se-swe-41'],
};
