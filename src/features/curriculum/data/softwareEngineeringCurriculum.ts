import type { ModuleMeta, RoadmapStage } from '../../../shared/types/domain';
import { curriculumModule, type CurriculumLesson } from '../content/curriculumDefinition';
import { withDepth } from '../content/depth';
import { SOFTWARE_ENGINEERING_LESSON_DEPTH } from '../content/depth/ownerDepth';
import { SE_BASICS_MODULE } from '../content/software-engineering/m0-programming-basics';
import { SE_OOP_MODULE } from '../content/software-engineering/m0-programs-and-oop';
import { SE_MODULE_1 } from '../content/software-engineering/m1-engineering-mindset';
import { SE_MODULE_2 } from '../content/software-engineering/m2-construction';
import { SE_MODULE_3 } from '../content/software-engineering/m3-testing';
import { SE_MODULE_4 } from '../content/software-engineering/m4-design';
import { SE_MODULE_5 } from '../content/software-engineering/m5-data-systems';
import { SE_MODULE_6 } from '../content/software-engineering/m6-secure-engineering';

const SOURCES = ['SWEBOK Guide V4.0', 'Software Engineering at Google'];

/** Programming for Software Engineering: a SWEBOK V4-aligned track, separate from the
 *  security-focused programming path, with verified coding tasks paired to every lesson. It starts
 *  from zero — variables through object-oriented programming — before any professional practice. */
const RAW_SE_MODULE_SOURCES: { meta: Omit<ModuleMeta, 'lessons' | 'status'>; lessons: CurriculumLesson[] }[] = [
  { meta: {
    id: 'se-programming-basics',
    slug: 'se-programming-basics',
    title: 'SE 1 · Programming Basics',
    subtitle: 'Variables, types, strings, decisions, loops, collections and functions — from zero',
    description: 'Start here if you have never programmed. Write and run your first Python program, store values in variables, work with text, make decisions with if, repeat work with loops, organise data in lists and dictionaries, and package steps into functions. Every idea comes with an everyday comparison, a small example and two graded coding tasks.',
    sourceBooks: ['Python Tutorial (python.org)', 'Think Python (Downey)'],
    icon: 'python',
  }, lessons: SE_BASICS_MODULE },
  { meta: {
    id: 'se-programs-oop',
    slug: 'se-programs-oop',
    title: 'SE 2 · Building Programs & Object-Oriented Programming',
    subtitle: 'Errors, files, modules, classes, encapsulation, inheritance and composition',
    description: 'Turn scripts into real programs: read error messages and handle bad input, save data to files and JSON, split code into modules, and then learn object-oriented programming step by step — classes and objects, properties that keep data valid, and inheritance, polymorphism and composition.',
    sourceBooks: ['Python Tutorial (python.org)', 'Think Python (Downey)'],
    icon: 'code',
  }, lessons: SE_OOP_MODULE },
  { meta: {
    id: 'se-foundations',
    slug: 'se-foundations',
    title: 'SE 3 · The Engineering Mindset & Toolchain',
    subtitle: 'Programming over time, Git workflows, scientific debugging and requirements',
    description: 'Start thinking like a professional engineer: why code that lives for years needs different habits, how to use Git the way strong teams do, how to debug with a method instead of guesswork, and how to turn vague requests into testable acceptance criteria.',
    sourceBooks: [...SOURCES, 'Pro Git', 'The Debugging Book'],
    icon: 'route',
  }, lessons: SE_MODULE_1 },
  { meta: {
    id: 'se-construction',
    slug: 'se-construction',
    title: 'SE 4 · Software Construction',
    subtitle: 'Specifications, abstract data types, error handling and refactoring',
    description: 'Build code other people can rely on: precise specifications and contracts, abstract data types that protect their invariants, error handling that fails fast and fails safely, and refactoring in small, test-protected steps.',
    sourceBooks: [...SOURCES, 'MIT 6.102 Software Construction', 'Refactoring (Fowler)'],
    icon: 'code',
  }, lessons: SE_MODULE_2 },
  { meta: {
    id: 'se-testing',
    slug: 'se-testing',
    title: 'SE 5 · Testing & Quality',
    subtitle: 'Test design, pytest and test doubles, property-based and integration testing, TDD and review',
    description: 'Learn to choose the few tests that find most bugs, design code that is easy to test, let the computer generate edge cases, test real collaborators together, and build a quality culture with TDD, code review and automated gates. Two coding tasks grade your tests with mutation testing.',
    sourceBooks: [...SOURCES, 'MIT 6.102 Software Construction', 'The Practical Test Pyramid'],
    icon: 'bug',
  }, lessons: SE_MODULE_3 },
  { meta: {
    id: 'se-design',
    slug: 'se-design',
    title: 'SE 6 · Design & Architecture',
    subtitle: 'Design principles, patterns, architecture styles, decision records and API design',
    description: 'Make change cheap: coupling, cohesion, SOLID and information hiding; the patterns worth knowing; architecture styles chosen from quality attributes and recorded in ADRs; fitness functions that stop erosion; and HTTP APIs with correct semantics, problem-details errors, cursor pagination and idempotent writes.',
    sourceBooks: [...SOURCES, 'Architecture Decision Records', 'RFC 9110 / RFC 9457'],
    icon: 'layers',
  }, lessons: SE_MODULE_4 },
  { meta: {
    id: 'se-data-systems',
    slug: 'se-data-systems',
    title: 'SE 7 · Data, Concurrency & Distributed Systems',
    subtitle: 'Transactions and indexes, concurrency control, resilience patterns and performance',
    description: 'Keep data correct and systems up under load: schemas, indexes and isolation levels; optimistic locking and N+1 fixes; threads, asyncio, the GIL and deadlock prevention; timeouts, jittered retries, circuit breakers and the transactional outbox; and performance work driven by profiles, percentiles and Little\'s law.',
    sourceBooks: [...SOURCES, 'Designing Data-Intensive Applications', 'Amazon Builders\' Library'],
    icon: 'database',
  }, lessons: SE_MODULE_5 },
  { meta: {
    id: 'se-secure-engineering',
    slug: 'se-secure-engineering',
    title: 'SE 8 · Secure Software Engineering',
    subtitle: 'Threat models and requirements, injection, secrets and passwords, and the software supply chain',
    description: 'Build security in the way you build correctness: model threats with STRIDE and set testable requirements with OWASP ASVS; fix SQL injection, command injection and path traversal with the safe API, shown side by side with the vulnerable code and mapped to CWE; keep secrets out of code and logs and store passwords properly; and make dependencies and builds verifiable with lock files, hashes, SBOMs, SLSA and KEV-aware release gates.',
    sourceBooks: [...SOURCES, 'OWASP ASVS 5.0', 'NIST SP 800-218 (SSDF)', 'SLSA v1.2', '2025 CWE Top 25'],
    icon: 'shield',
  }, lessons: SE_MODULE_6 },
];

/** Lessons with their beginner depth already applied, ready to upload as plain data. */
export const SE_MODULE_SOURCES = RAW_SE_MODULE_SOURCES.map(({ meta, lessons }) => ({ meta, lessons: lessons.map((lesson) => withDepth(lesson, SOFTWARE_ENGINEERING_LESSON_DEPTH)) }));

export const SE_MODULES: ModuleMeta[] = SE_MODULE_SOURCES.map(({ meta, lessons }) => curriculumModule(meta, lessons));

export const SE_ROADMAP: RoadmapStage[] = SE_MODULES.map((module) => ({
  title: module.title,
  status: 'available',
  moduleSlug: module.slug,
  sourceBooks: module.sourceBooks,
  track: 'software',
}));

export { SE_LESSON_TASKS } from './ownerLessonTasks';
