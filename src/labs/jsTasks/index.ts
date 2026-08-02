import { JS_FUNDAMENTALS_TASKS } from './fundamentals';
import { JS_CRYPTO_TASKS } from './cryptoAndEncoding';
import { JS_OOP_TASKS } from './oop';
import type { CodeTask } from '../codeTypes';

export const JS_TASKS: CodeTask[] = [...JS_FUNDAMENTALS_TASKS, ...JS_CRYPTO_TASKS, ...JS_OOP_TASKS];

export const JS_TASK_CATEGORIES = ['Fundamentals', 'Cryptography & Encoding', 'OOP & Classes'] as const;
