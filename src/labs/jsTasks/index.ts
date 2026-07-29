import { JS_FUNDAMENTALS_TASKS } from './fundamentals';
import { JS_CRYPTO_TASKS } from './cryptoAndEncoding';
import type { CodeTask } from '../codeTypes';

export const JS_TASKS: CodeTask[] = [...JS_FUNDAMENTALS_TASKS, ...JS_CRYPTO_TASKS];

export const JS_TASK_CATEGORIES = ['Fundamentals', 'Cryptography & Encoding'] as const;
