import type { CodeTask } from '../codeTypes';
import { enrichCodeTasks } from '../enrichCodeTasks';
import { CSHARP_FOUNDATION_TASKS } from './m0';
import { CSHARP_MONTH1_A_TASKS } from './m1a';
import { CSHARP_MONTH1_B_TASKS } from './m1b';
import { CSHARP_MONTH2_A_TASKS } from './m2a';
import { CSHARP_MONTH2_B_TASKS } from './m2b';
import { CSHARP_MONTH3_A_TASKS } from './m3a';
import { CSHARP_MONTH3_B_TASKS } from './m3b';

const RAW_CSHARP_TASKS: CodeTask[] = [...CSHARP_FOUNDATION_TASKS, ...CSHARP_MONTH1_A_TASKS, ...CSHARP_MONTH1_B_TASKS, ...CSHARP_MONTH2_A_TASKS, ...CSHARP_MONTH2_B_TASKS, ...CSHARP_MONTH3_A_TASKS, ...CSHARP_MONTH3_B_TASKS];

export const CSHARP_TASKS: CodeTask[] = enrichCodeTasks(RAW_CSHARP_TASKS);

export const CSHARP_TASK_CATEGORIES = ['C# Foundations', 'Month 1 · C# Engineering', 'Month 2 · APIs & Data', 'Month 3 · Architecture'] as const;
