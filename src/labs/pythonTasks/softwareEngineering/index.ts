import type { CodeTask } from '../../codeTypes';
import { SE_M1_TASKS } from './m1';
import { SE_M2_TASKS } from './m2';
import { SE_M3_TASKS } from './m3';
import { SE_M4_TASKS } from './m4';
import { SE_M5_TASKS } from './m5';

/** Coding practice for the Software Engineering track, verified by scripts/check-se-tasks.cjs. */
export const SE_TASKS: CodeTask[] = [...SE_M1_TASKS, ...SE_M2_TASKS, ...SE_M3_TASKS, ...SE_M4_TASKS, ...SE_M5_TASKS];
