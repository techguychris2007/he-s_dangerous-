import type { CodeTask } from '../codeTypes';
import { TS_MONTH4_A_TASKS } from './m4a';
import { TS_MONTH4_B_WEEK15 } from './m4b';
import { TS_MONTH4_B_WEEK16 } from './m4b-quality';

/** Month 4 of the C# & .NET course: TypeScript and React tasks. Each task is a module
 *  (solution.ts or solution.tsx) graded by a separate Vitest-style test module that the strict
 *  TypeScript compiler checks together with it — see src/lib/tsRunner.ts. */
export const TS_TASKS: CodeTask[] = [...TS_MONTH4_A_TASKS, ...TS_MONTH4_B_WEEK15, ...TS_MONTH4_B_WEEK16];

export const TS_TASK_CATEGORIES = ['Month 4 · TypeScript & React'] as const;
