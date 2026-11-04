import { PYTHON_TASKS } from './pythonTasks';
import { CSHARP_TASKS } from './csharpTasks';
import { TS_TASKS } from './typescriptTasks';

/** Code Portal tasks that lessons can embed as their paired practice (Python for the security and
 *  software-engineering tracks, C# for the .NET course). */
export const LESSON_CODE_TASKS = [...PYTHON_TASKS, ...CSHARP_TASKS, ...TS_TASKS];
