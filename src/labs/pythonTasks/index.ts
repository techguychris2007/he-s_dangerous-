import { PYTHON_FUNDAMENTALS_TASKS } from './fundamentals';
import { PYTHON_CRYPTO_TASKS } from './cryptoAndEncoding';
import { PYTHON_OOP_TASKS } from './oop';
import { PYTHON_ADVANCED_TASKS } from './advanced';
import { PYTHON_CAPSTONE_TASKS } from './capstones';
import type { CodeTask } from '../codeTypes';

export const PYTHON_TASKS: CodeTask[] = [
  ...PYTHON_FUNDAMENTALS_TASKS,
  ...PYTHON_CRYPTO_TASKS,
  ...PYTHON_OOP_TASKS,
  ...PYTHON_ADVANCED_TASKS,
  ...PYTHON_CAPSTONE_TASKS,
];

export const PYTHON_TASK_CATEGORIES = ['Fundamentals', 'Cryptography & Encoding', 'OOP', 'Advanced', 'Capstone'] as const;
