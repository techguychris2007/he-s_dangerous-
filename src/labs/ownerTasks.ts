import type { CodeTask } from './codeTypes';

/** C#, machine learning and software engineering coding tasks. They are not part of the app bundle:
 *  src/lib/ownerContent.ts fills these lists from the private owner-content bucket, for the owner
 *  accounts only, before any page that reads them is shown. Everyone else sees empty lists. */
export const CSHARP_TASKS: CodeTask[] = [];
export const ML_TASKS: CodeTask[] = [];
export const SE_PYTHON_TASKS: CodeTask[] = [];

export function registerOwnerTasks(tasks: { csharp: CodeTask[]; ml: CodeTask[]; sePython: CodeTask[] }) {
  for (const [target, incoming] of [[CSHARP_TASKS, tasks.csharp], [ML_TASKS, tasks.ml], [SE_PYTHON_TASKS, tasks.sePython]] as const) {
    const known = new Set(target.map(task => task.id));
    target.push(...incoming.filter(task => !known.has(task.id)));
  }
}
