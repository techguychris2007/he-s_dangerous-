import week13 from './typescript/fullstack/se-ts-m4-001';
import type { ProjectTask } from '../projectTypes';

/** A reference solution file of an earlier project, handed to a later one as a given file. Later
 *  projects import the earlier task module themselves (never through this module, which would
 *  create an import cycle with week 14). */
export function fileOf(task: ProjectTask, path: string): string {
  const file = task.solutionFiles.find((f) => f.path === path);
  if (!file) throw new Error(`${task.id} has no ${path}`);
  return file.content;
}

/** Week 13's reference client, given read-only to the React projects of weeks 14–16 under src/api/. */
const solution = (path: string) => fileOf(week13, path);

export const API_TYPES = solution('src/types.ts');
export const API_HTTP = solution('src/http.ts');
export const API_CLIENT = solution('src/bookingsClient.ts');
export const API_PARSE = solution('src/parse.ts');

/** The in-memory API with a small delay, so the live preview shows real loading states. */
export const API_FAKE = solution('src/fakeApi.ts').replace(
  '  async function fetch(input: string, init: RequestInit = {}): Promise<Response> {\n',
  '  async function fetch(input: string, init: RequestInit = {}): Promise<Response> {\n    await new Promise((resolve) => setTimeout(resolve, 350));\n',
);

/** Messages for every ApiError — the learner writes this in week 14; later weeks receive it. */
export const MESSAGES_SOLUTION = `import type { ApiError } from './api/types';

/** One human sentence per failure, so every screen explains errors the same way. */
export function messageFor(error: ApiError): string {
  switch (error.kind) {
    case 'network': return "Can't reach the server. Check your connection and try again.";
    case 'timeout': return 'The server took too long to respond. Try again.';
    case 'aborted': return '';
    case 'unauthorized': return 'Your session has expired. Sign in again.';
    case 'not-found': return 'That booking no longer exists.';
    case 'conflict': return error.detail;
    case 'validation': return 'Some fields need attention.';
    case 'server': return 'The server had a problem (' + error.status + '). Try again.';
    case 'invalid-response': return "The server sent data this app doesn't understand.";
    default: {
      const unreachable: never = error;
      return unreachable;
    }
  }
}
`;
