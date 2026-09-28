import { CPP_FUNDAMENTALS_TASKS } from './fundamentals';
import { CPP_CRYPTO_TASKS } from './cryptoAndEncoding';
import { CPP_CAPSTONE_TASKS } from './capstones';
import type { CodeTask } from '../codeTypes';

export const CPP_TASKS: CodeTask[] = [...CPP_FUNDAMENTALS_TASKS, ...CPP_CRYPTO_TASKS, ...CPP_CAPSTONE_TASKS];

export const CPP_TASK_CATEGORIES = ['Fundamentals', 'Cryptography & Encoding', 'Capstone'] as const;
