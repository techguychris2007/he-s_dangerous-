import type { CodeTask } from '../codeTypes';
import { DEVOPS_WEEK_17 } from './m5-week17';
import { DEVOPS_WEEK_18 } from './m5-week18';
import { DEVOPS_WEEK_19 } from './m5-week19';
import { DEVOPS_WEEK_20 } from './m5-week20';

/** Month 5 of the C# & .NET course: configuration tasks. The learner edits one real file (a
 *  Dockerfile, compose.yaml, a Container Apps manifest, Terraform, a GitHub Actions workflow, a shell
 *  deployment script) and a TypeScript grader reads it through `dw:project`, parses it and asserts on
 *  its structure — see tools/ts-runtime/src/devops.js and runConfigSnippet in src/lib/tsRunner.ts. */
export const DEVOPS_TASKS: CodeTask[] = [...DEVOPS_WEEK_17, ...DEVOPS_WEEK_18, ...DEVOPS_WEEK_19, ...DEVOPS_WEEK_20];

export const DEVOPS_TASK_CATEGORIES = ['Month 5 · Cloud & DevOps'] as const;
