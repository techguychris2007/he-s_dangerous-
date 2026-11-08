import type { ModuleMeta, RoadmapStage } from '../types';
import { curriculumModule } from '../content/curriculumDefinition';
import { DN_FOUNDATIONS_1 } from '../content/dotnet/m0-foundations-1';
import { DN_FOUNDATIONS_2 } from '../content/dotnet/m0-foundations-2';
import { DN_MONTH1_A } from '../content/dotnet/m1-weeks-1-2';
import { DN_MONTH1_B } from '../content/dotnet/m1-weeks-3-4';
import { DN_MONTH2_A } from '../content/dotnet/m2-weeks-5-6';
import { DN_MONTH2_B } from '../content/dotnet/m2-weeks-7-8';
import { DN_MONTH3_A } from '../content/dotnet/m3-weeks-9-10';
import { DN_MONTH3_B } from '../content/dotnet/m3-weeks-11-12';
import { DN_MONTH4_A } from '../content/dotnet/m4-weeks-13-14';
import { DN_MONTH4_B } from '../content/dotnet/m4-weeks-15-16';
import { DN_MONTH5_A } from '../content/dotnet/m5-weeks-17-18';
import { DN_MONTH5_B } from '../content/dotnet/m5-weeks-19-20';

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
  curriculumModule({
    id: 'dn-m3-architecture',
    slug: 'dn-month-3-architecture-ddd-events',
    title: 'Month 3 · Software Architecture & Distributed Thinking',
    subtitle: 'Weeks 9–12: clean architecture and CQRS, DDD and modular monoliths, event-driven systems, reliability engineering',
    description: 'Week 9 — layers, the dependency rule, ports and adapters, vertical slices and CQRS (assignment: Architecture Refactor). Week 10 — ubiquitous language, bounded contexts, aggregates and invariants, and modular monoliths with enforced boundaries (assignment: Commerce Platform). Week 11 — commands and events, brokers and delivery guarantees, contract evolution, the transactional outbox, idempotent consumers and sagas (assignment: Event-Driven Order Workflow). Week 12 — SLOs and error budgets, retries with jitter, timeouts, circuit breakers, bulkheads, idempotency keys and reconciliation (assignment: The Payment Failure Challenge).',
    sourceBooks: ['Architect Modern Web Applications with ASP.NET Core and Azure', '.NET Microservices: Architecture for Containerized .NET Applications', 'Azure Architecture Center — Cloud Design Patterns', 'Google SRE book'],
    icon: 'layers',
  }, [...DN_MONTH3_A, ...DN_MONTH3_B]),
  curriculumModule({
    id: 'dn-m4-frontend',
    slug: 'dn-month-4-typescript-react',
    title: 'Month 4 · TypeScript & React Engineering',
    subtitle: 'Weeks 13–16: TypeScript engineering, React fundamentals, production React, frontend architecture and quality',
    description: 'Week 13 — TypeScript for C# engineers: structural types, unions and narrowing, generics, parsing untrusted JSON and a typed fetch client (assignment: TypeScript Client). Week 14 — React fundamentals: components, props and state, lists and forms, effects without races, loading, empty and error states, custom hooks (assignment: Build the Client). Week 15 — production React: routing, sessions in a typed reducer and context, protected routes and safe redirects, session expiry, error summaries and focus management, optimistic updates with rollback, accessible dialogs and error boundaries (assignment: Production Features). Week 16 — frontend architecture and quality: homes for every kind of state, reducers, feature boundaries, measured performance, the testing trophy, mutation testing, CI and code review (assignment: Frontend Engineering Review). Every task is type-checked in strict mode and graded with Vitest-style tests in the browser; React work is tested the way users meet it, by role and label.',
    sourceBooks: ['TypeScript Handbook', 'Full Stack Open (parts 0–2, 5–7, 9)', 'react.dev', 'TypeScript Deep Dive'],
    icon: 'web',
  }, [...DN_MONTH4_A, ...DN_MONTH4_B]),
  curriculumModule({
    id: 'dn-m5-cloud',
    slug: 'dn-month-5-cloud-devops',
    title: 'Month 5 · Cloud, DevOps & Delivery',
    subtitle: 'Weeks 17–20: containers, Azure, infrastructure as code, CI/CD and observability',
    description: 'Week 17 — containers for .NET: images and layers, multi-stage Dockerfiles, non-root images, secrets kept out of layers, graceful shutdown, and Docker Compose with health-gated start-up, migrations, segmented networks and secrets (assignment: Containerize Everything). Week 18 — Azure: resources and regions, choosing a compute platform, managed identities, least-privilege RBAC, Key Vault, re-runnable CLI scripts, and Azure Container Apps with Key Vault secrets, probes, scaling and canary releases across revisions (assignment: Cloud Deployment). Week 19 — infrastructure as code with Terraform: pinned providers, validated variables, references and the dependency graph, the plan as a review, remote state with locking, modules and per-environment roots, lifecycle protections and generated secrets (assignment: Rebuild the Cloud). Week 20 — CI/CD and observability: a hardened GitHub Actions CI workflow, OpenID Connect sign-in to Azure, build-once promotion through approved environments with smoke tests, structured logging, OpenTelemetry traces and metrics, the Collector and Aspire dashboard, and SLO burn-rate alerts (assignment: No Manual Deployment). Every Dockerfile, compose.yaml, script, manifest, Terraform file and workflow you write is parsed and checked in your browser; these exercises do not provision real cloud resources.',
    sourceBooks: ['Docker documentation', 'Microsoft Learn — .NET containers and Azure Container Apps', 'Terraform documentation', 'GitHub Actions documentation', 'OpenTelemetry documentation', 'Google SRE workbook'],
    icon: 'layers',
  }, [...DN_MONTH5_A, ...DN_MONTH5_B]),
];

export const DN_ROADMAP: RoadmapStage[] = DN_MODULES.map((module) => ({
  title: module.title,
  status: 'available',
  moduleSlug: module.slug,
  sourceBooks: module.sourceBooks,
  track: 'dotnet',
}));

/** Lesson → paired Code Portal tasks (two verified tasks per lesson: C#, TypeScript, or Month 5's configuration tasks). */
const pairTasks = (lessonPrefix: string, taskPrefix: string, lessons: number) =>
  Array.from({ length: lessons }, (_, i) => [
    `${lessonPrefix}-${i + 1}`,
    [`${taskPrefix}-${String(2 * i + 1).padStart(2, '0')}`, `${taskPrefix}-${String(2 * i + 2).padStart(2, '0')}`],
  ] as const);

export const DN_LESSON_TASKS: Record<string, string[]> = Object.fromEntries([
  ...pairTasks('dn0', 'cs-0', 10),
  ...pairTasks('dn1', 'cs-1', 8),
  ...pairTasks('dn2', 'cs-2', 8),
  ...pairTasks('dn3', 'cs-3', 8),
  ...pairTasks('dn4', 'ts-4', 8),
  ...pairTasks('dn5', 'ops-5', 8),
].map(([lesson, tasks]) => [lesson, [...tasks]]));
