import { SE_TASK_INDEX, type SeTaskMeta } from './taskIndex';
import type { ProjectTask, SeLanguage, SeTrack } from '../projectTypes';

export { SE_TASK_INDEX };
export type { SeTaskMeta };

/** Python/JS cover foundations through a real (decoupled, see projectTypes.ts) full-stack story; C++
 *  has no realistic frontend, so it gets 'systems' instead of 'fullstack' — see cppProjectRunner.ts
 *  for exactly why (JSCPP's real, verified capability limits). */
export const SE_TRACKS: Record<SeLanguage, SeTrack[]> = {
  python: ['foundations', 'backend', 'fullstack'],
  javascript: ['foundations', 'backend', 'fullstack'],
  cpp: ['foundations', 'systems'],
  csharp: ['foundations', 'backend'],
  typescript: ['fullstack'],
};

export function seCategoriesFor(language: SeLanguage, track: SeTrack): string[] {
  return Array.from(new Set(SE_TASK_INDEX.filter((t) => t.language === language && t.track === track).map((t) => t.category)));
}

/** Loads one project's full body (files/solutionFiles/targets) on demand from the private
 *  owner-content bucket (src/lib/ownerContent.ts); project bodies are not part of the app bundle.
 *  Returns undefined for an unknown id or when this account cannot read it, so callers redirect. */
export async function getSeTask(id: string): Promise<ProjectTask | undefined> {
  const { loadOwnerProject } = await import('../../lib/ownerContent');
  return loadOwnerProject(id);
}
