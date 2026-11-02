import type { ModuleMeta, RoadmapStage } from '../types';
import { curriculumModule } from '../content/curriculumDefinition';
import { DN_FOUNDATIONS_1 } from '../content/dotnet/m0-foundations-1';
import { DN_FOUNDATIONS_2 } from '../content/dotnet/m0-foundations-2';
import { DN_MONTH1_A } from '../content/dotnet/m1-weeks-1-2';
import { DN_MONTH1_B } from '../content/dotnet/m1-weeks-3-4';
import { DN_MONTH2_A } from '../content/dotnet/m2-weeks-5-6';
import { DN_MONTH2_B } from '../content/dotnet/m2-weeks-7-8';

/** C# & .NET Software Engineering: a separate course structured as a six-month, 24-week
 *  engineering programme (C# foundations → ASP.NET Core and databases → architecture → TypeScript and
 *  React → Azure and DevOps → system design and a capstone), preceded by a from-scratch preparation
 *  stage for learners who have never programmed. Each lesson pairs with graded C# tasks that compile
 *  and run in the browser (see src/lib/csharpRunner.ts); each week's assignment is a Build Portal
 *  project. */
export const DN_MODULES: ModuleMeta[] = [
  curriculumModule({
    id: 'dn-prep-basics',
    slug: 'dn-prep-csharp-basics',
    title: 'Prep 1 · C# from Scratch',
    subtitle: 'The .NET toolchain, types, text, decisions and loops',
    description: 'For complete beginners. Install .NET, build and run your first program, read compiler errors, and learn the core of C#: typed variables, decimal for money, strings and interpolation, if and switch expressions, and every kind of loop. Each lesson pairs with two graded C# tasks that compile and run in your browser.',
    sourceBooks: ['The C# Programming Yellow Book (Miles)', 'Microsoft Learn — C#'],
    icon: 'code',
  }, DN_FOUNDATIONS_1),
  curriculumModule({
    id: 'dn-prep-programs',
    slug: 'dn-prep-building-programs',
    title: 'Prep 2 · Building Real Programs',
    subtitle: 'Methods, collections, classes, exceptions, files, JSON and Git',
    description: 'Turn statements into programs: decompose logic into testable methods, choose the right collection, model the world with classes that protect their invariants, fail safely with exceptions, save and reload data as JSON, and track your work with Git. Ends with the Console Library System checkpoint project — the level the six-month programme assumes on day one.',
    sourceBooks: ['Fundamentals of Computer Programming with C# (Nakov)', 'Pro Git'],
    icon: 'layers',
  }, DN_FOUNDATIONS_2),
  curriculumModule({
    id: 'dn-m1-foundations',
    slug: 'dn-month-1-csharp-engineering-foundations',
    title: 'Month 1 · C# & Software Engineering Foundations',
    subtitle: 'Weeks 1–4: professional OOP, advanced C#, clean code and patterns, testing, algorithms and workflow',
    description: 'Week 1 — professional C# and object-oriented design: interfaces, composition, polymorphism and domain modelling (assignment: Library Management Engine). Week 2 — advanced C#: generics, delegates, LINQ in depth, async/await and cancellation (assignment: Order Processing Engine). Week 3 — clean code, SOLID, design patterns and dependency injection (assignment: Rescue the Codebase). Week 4 — testing with xUnit and test doubles, algorithmic complexity, and the branch, pull-request and review workflow (assignment: Tested Engineering Challenge).',
    sourceBooks: ['Microsoft Learn — C# and .NET', 'Refactoring (Fowler)', 'Google Engineering Practices'],
    icon: 'code',
  }, [...DN_MONTH1_A, ...DN_MONTH1_B]),
  curriculumModule({
    id: 'dn-m2-apis',
    slug: 'dn-month-2-aspnet-core-databases-apis',
    title: 'Month 2 · ASP.NET Core, Databases & API Engineering',
    subtitle: 'Weeks 5–8: HTTP and ASP.NET Core, SQL and EF Core, authentication and API security, production-ready APIs',
    description: 'Week 5 — HTTP semantics, REST design and ASP.NET Core Minimal APIs, middleware, DI and configuration (assignment: Task Management API). Week 6 — relational schemas, SQL, indexes, transactions and concurrency, EF Core and Dapper (assignment: Booking Data Platform). Week 7 — password storage, cookies and tokens, JWT validation, policies, object-level authorization and the OWASP API Top 10 (assignment: Secure the Platform). Week 8 — validation and problem details, ETags, idempotency, pagination, OpenAPI, logging, health checks, resilience and integration testing (assignment: Production Readiness).',
    sourceBooks: ['Microsoft Learn — ASP.NET Core & EF Core', 'RFC 9110 / RFC 9457', 'OWASP API Security Top 10'],
    icon: 'database',
  }, [...DN_MONTH2_A, ...DN_MONTH2_B]),
];

export const DN_ROADMAP: RoadmapStage[] = DN_MODULES.map((module) => ({
  title: module.title,
  status: 'available',
  moduleSlug: module.slug,
  sourceBooks: module.sourceBooks,
  track: 'dotnet',
}));

/** Lesson → paired C# Code Portal tasks (two verified tasks per lesson). */
const pairTasks = (lessonPrefix: string, taskPrefix: string, lessons: number) =>
  Array.from({ length: lessons }, (_, i) => [
    `${lessonPrefix}-${i + 1}`,
    [`${taskPrefix}-${String(2 * i + 1).padStart(2, '0')}`, `${taskPrefix}-${String(2 * i + 2).padStart(2, '0')}`],
  ] as const);

export const DN_LESSON_TASKS: Record<string, string[]> = Object.fromEntries([
  ...pairTasks('dn0', 'cs-0', 10),
  ...pairTasks('dn1', 'cs-1', 8),
  ...pairTasks('dn2', 'cs-2', 8),
].map(([lesson, tasks]) => [lesson, [...tasks]]));
