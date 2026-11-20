import type { CodeTask } from './codeTypes';

// Keep authored assignments intact. Comment padding is not additional lab content.
export const enrichCodeTask = (task: CodeTask): CodeTask => task;
export const enrichCodeTasks = (tasks: CodeTask[]): CodeTask[] => tasks.map(enrichCodeTask);
