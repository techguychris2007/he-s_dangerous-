import { useSyncExternalStore } from 'react';
import { supabase } from '../../../shared/lib/supabaseClient';
import type { CurriculumLesson } from '../../curriculum/content/curriculumDefinition';
import type { ModuleMeta, RoadmapStage } from '../../../shared/types/domain';
import type { CodeTask } from '../../code-practice/tasks/codeTypes';
import type { ProjectTask } from '../../code-practice/tasks/projectTypes';
import type { MlLesson } from '../../curriculum/data/mlLessons/types';

/** The machine learning, C# & .NET and software engineering content is not in the app bundle. It is
 *  published to the private `owner-content` Storage bucket (scripts/publish-owner-content.cjs), which
 *  only the owner accounts can read (supabase/migrations/0012_owner_content.sql). This module
 *  downloads it for those accounts, keeps a device copy for offline use, and registers it with the
 *  curriculum, task and lesson lists. */

export const OWNER_CONTENT_BUCKET = 'owner-content';
export const OWNER_CONTENT_CACHE = 'darkworld-owner-content';
const VERSION_KEY = 'darkworld.ownerContent.version';

export interface OwnerContentBundle {
  version: string;
  curriculum: { modules: { meta: Omit<ModuleMeta, 'lessons' | 'status'>; lessons: CurriculumLesson[] }[]; roadmap: RoadmapStage[] };
  tasks: { csharp: CodeTask[]; ml: CodeTask[]; sePython: CodeTask[] };
  mlLessons: MlLesson[];
}

type Status = 'idle' | 'loading' | 'ready' | 'unavailable';
let state: { status: Status; error: string } = { status: 'idle', error: '' };
const listeners = new Set<() => void>();
const setState = (next: typeof state) => { state = next; listeners.forEach(listener => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useOwnerContent() { return useSyncExternalStore(subscribe, () => state); }

const cacheKey = (version: string, path: string) => `${location.origin}/__owner-content/${encodeURIComponent(version)}/${path}`;

async function openCache(): Promise<Cache | undefined> {
  try { return await globalThis.caches?.open(OWNER_CONTENT_CACHE); } catch { return undefined; }
}

async function fetchText(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(OWNER_CONTENT_BUCKET).download(path);
  if (error || !data) throw new Error(error?.message || `Could not download ${path}.`);
  return data.text();
}

/** Reads a published file for this version, from the device copy when present. */
async function readVersioned<T>(version: string, path: string): Promise<T> {
  const cache = await openCache();
  const key = cacheKey(version, path);
  const hit = await cache?.match(key).catch(() => undefined);
  if (hit) return hit.json() as Promise<T>;
  const text = await fetchText(path);
  await cache?.put(key, new Response(text, { headers: { 'content-type': 'application/json' } })).catch(() => {});
  return JSON.parse(text) as T;
}

let versionRequest: Promise<string | undefined> | null = null;
/** The published version: the live manifest when online, otherwise the last version seen here. */
function currentVersion(): Promise<string | undefined> {
  versionRequest ??= (async () => {
    let stored: string | undefined;
    try { stored = localStorage.getItem(VERSION_KEY) ?? undefined; } catch { /* storage blocked */ }
    if (!navigator.onLine) return stored;
    try {
      const manifest = JSON.parse(await fetchText('manifest.json')) as { version?: string };
      if (!manifest.version) return stored;
      try { localStorage.setItem(VERSION_KEY, manifest.version); } catch { /* storage blocked */ }
      return manifest.version;
    } catch { return stored; }
  })();
  return versionRequest;
}

let loading: Promise<void> | null = null;
/** Downloads and registers the owner content once per session. Only call it for owner accounts. */
export function loadOwnerContent(): Promise<void> {
  loading ??= (async () => {
    setState({ status: 'loading', error: '' });
    try {
      const version = await currentVersion();
      if (!version) throw new Error(navigator.onLine ? 'No owner content has been published yet.' : 'Connect once to download the owner content.');
      const bundle = await readVersioned<OwnerContentBundle>(version, 'bundle.json');
      await registerBundle(bundle);
      void pruneOldVersions(version);
      setState({ status: 'ready', error: '' });
    } catch (error) {
      loading = null; versionRequest = null;
      setState({ status: 'unavailable', error: error instanceof Error ? error.message : 'Owner content could not load.' });
    }
  })();
  return loading;
}

async function registerBundle(bundle: OwnerContentBundle) {
  const [{ curriculumModule }, { registerOwnerCurriculum }, { registerOwnerTasks }, { registerMlLessons }] = await Promise.all([
    import('../../curriculum/content/curriculumDefinition'),
    import('../../curriculum/data/curriculum'),
    import('../../code-practice/tasks/ownerTasks'),
    import('../../curriculum/data/ownerMlLessons'),
  ]);
  registerOwnerCurriculum(bundle.curriculum.modules.map(({ meta, lessons }) => curriculumModule(meta, lessons)), bundle.curriculum.roadmap);
  registerOwnerTasks(bundle.tasks);
  registerMlLessons(bundle.mlLessons);
}

async function pruneOldVersions(version: string) {
  const cache = await openCache();
  const keep = cacheKey(version, '');
  for (const request of await cache?.keys().catch(() => []) ?? []) if (!request.url.startsWith(keep)) await cache?.delete(request).catch(() => false);
}

/** One Build project's files, tests and reference solution. */
export async function loadOwnerProject(id: string): Promise<ProjectTask | undefined> {
  if (!/^[a-z0-9-]+$/.test(id)) return undefined;
  const version = await currentVersion();
  if (!version) return undefined;
  try { return await readVersioned<ProjectTask>(version, `projects/${id}.json`); } catch { return undefined; }
}
