import { JS_FUNDAMENTALS_TASKS } from './fundamentals';
import { JS_CRYPTO_TASKS } from './cryptoAndEncoding';
import { JS_OOP_TASKS } from './oop';
import { JS_CAPSTONE_TASKS } from './capstones';
import type { CodeTask } from '../codeTypes';

export const JS_TASKS: CodeTask[] = [...JS_FUNDAMENTALS_TASKS, ...JS_CRYPTO_TASKS, ...JS_OOP_TASKS, ...JS_CAPSTONE_TASKS];

export const JS_TASK_CATEGORIES = ['Fundamentals', 'Cryptography & Encoding', 'OOP & Classes', 'Capstone'] as const;
