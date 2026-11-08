import { PYTHON_TASKS } from './pythonTasks';
import { CSHARP_TASKS } from './csharpTasks';
import { TS_TASKS } from './typescriptTasks';
import { DEVOPS_TASKS } from './devopsTasks';

/** Code Portal tasks that lessons can embed as their paired practice (Python for the security and
 *  software-engineering tracks, C# and TypeScript for the .NET course, plus its Month 5 configuration tasks). */
export const LESSON_CODE_TASKS = [...PYTHON_TASKS, ...CSHARP_TASKS, ...TS_TASKS, ...DEVOPS_TASKS];
