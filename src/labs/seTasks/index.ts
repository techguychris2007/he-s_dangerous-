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
};

export function seCategoriesFor(language: SeLanguage, track: SeTrack): string[] {
  return Array.from(new Set(SE_TASK_INDEX.filter((t) => t.language === language && t.track === track).map((t) => t.category)));
}

// Vite-native lazy loading: one glob entry per task module. Each task file is authored as
// `<its own id>.ts` (see e.g. python/foundations/se-py-fnd-001.ts) specifically so the id -> loader
// mapping can be derived from the filename alone, without importing every module up front just to
// read its `.id` field — that would defeat the entire purpose of splitting content out of taskIndex.ts.
const loaders = import.meta.glob<{ default: ProjectTask }>('./{python,javascript,cpp}/**/*.ts');

let idToLoader: Map<string, () => Promise<{ default: ProjectTask }>> | null = null;

function buildLoaderIndex() {
  const map = new Map<string, () => Promise<{ default: ProjectTask }>>();
  for (const [path, loader] of Object.entries(loaders)) {
    const base = path.split('/').pop()?.replace(/\.ts$/, '');
    if (base) map.set(base, loader);
  }
  idToLoader = map;
}

/** Loads one task's full body (files/solutionFiles/targets) on demand. Returns undefined for an
 *  unknown id rather than throwing, so callers can redirect instead of crashing. */
export async function getSeTask(id: string): Promise<ProjectTask | undefined> {
  if (!idToLoader) buildLoaderIndex();
  const loader = idToLoader!.get(id);
  if (!loader) return undefined;
  const mod = await loader();
  return mod.default;
}
