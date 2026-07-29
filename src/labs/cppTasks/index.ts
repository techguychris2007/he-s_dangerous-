import { CPP_FUNDAMENTALS_TASKS } from './fundamentals';
import { CPP_CRYPTO_TASKS } from './cryptoAndEncoding';
import type { CodeTask } from '../codeTypes';

export const CPP_TASKS: CodeTask[] = [...CPP_FUNDAMENTALS_TASKS, ...CPP_CRYPTO_TASKS];

export const CPP_TASK_CATEGORIES = ['Fundamentals', 'Cryptography & Encoding'] as const;
