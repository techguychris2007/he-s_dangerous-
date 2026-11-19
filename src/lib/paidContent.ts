import { supabase } from './supabaseClient';
import type { LabScenario } from '../labs/types';
import type { LessonMeta, QuizQuestion, TypedQuestion } from '../types';
import type { LabReferenceNote } from '../labs/labReference';
import { renderNode, type LessonNode } from './paidLessonTree';

/** Pro and Max labs and lessons are not in the app bundle. In production the build ships catalogue
 *  stubs (`locked: true`); the full content is in the private `paid-content` Storage bucket
 *  (scripts/publish-paid-content.cjs), which only accounts with the right plan can read
 *  (supabase/migrations/0014_paid_content.sql). This module downloads it on demand and keeps a
 *  device copy per published version. */

export const PAID_CONTENT_BUCKET = 'paid-content';
const CACHE = 'darkworld-paid-content';
const VERSION_KEY = 'darkworld.paidContent.version';

export interface PaidLab { slug: string; plan: 'pro' | 'max'; scenario: LabScenario; reference: LabReferenceNote[] | null }

export interface PaidLesson { id: string; plan: 'pro' | 'max'; tree: LessonNode | LessonNode[] | null; quiz: QuizQuestion[]; questions: TypedQuestion[]; keyTerms: { term: string; meaning: string }[] }

async function openCache(): Promise<Cache | undefined> {
  try { return await globalThis.caches?.open(CACHE); } catch { return undefined; }
}

async function download(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(PAID_CONTENT_BUCKET).download(path);
  if (error || !data) throw new Error(error?.message || 'not found');
  // Content files are stored gzipped (scripts/publish-paid-content.cjs); the manifest is plain JSON.
  if (!path.endsWith('.gz')) return data.text();
  return new Response(data.stream().pipeThrough(new DecompressionStream('gzip'))).text();
}

let versionRequest: Promise<string> | null = null;
function currentVersion(): Promise<string> {
  versionRequest ??= (async () => {
    let stored = '';
    try { stored = localStorage.getItem(VERSION_KEY) ?? ''; } catch { /* storage blocked */ }
    if (!navigator.onLine) return stored;
    try {
      const version = (JSON.parse(await download('manifest.json')) as { version?: string }).version ?? stored;
      try { localStorage.setItem(VERSION_KEY, version); } catch { /* storage blocked */ }
      return version;
    } catch { return stored; }
  })();
  return versionRequest;
}

async function readPaid<T>(path: string): Promise<T> {
  const version = await currentVersion();
  const cache = await openCache();
  const key = `${location.origin}/__paid-content/${encodeURIComponent(version)}/${path}`;
  const hit = version ? await cache?.match(key).catch(() => undefined) : undefined;
  if (hit) return hit.json() as Promise<T>;
  let text: string;
  try { text = await download(path); }
  catch {
    versionRequest = null;
    throw new Error(navigator.onLine
      ? 'This content could not be downloaded. If you just paid, wait a moment and reload; otherwise check that your plan includes it.'
      : 'Connect to the internet to open this for the first time.');
  }
  if (version) await cache?.put(key, new Response(text, { headers: { 'content-type': 'application/json' } })).catch(() => {});
  return JSON.parse(text) as T;
}

const safe = (value: string) => /^[a-z0-9-]+$/i.test(value);

export async function loadPaidLab(slug: string, plan: 'pro' | 'max'): Promise<PaidLab> {
  if (!safe(slug)) throw new Error('Unknown lab.');
  return readPaid<PaidLab>(`${plan}/labs/${slug}.json.gz`);
}

export async function loadPaidLesson(id: string, plan: 'pro' | 'max'): Promise<PaidLesson> {
  if (!safe(id)) throw new Error('Unknown lesson.');
  return readPaid<PaidLesson>(`${plan}/lessons/${id}.json.gz`);
}

/** The full lesson, built from a downloaded paid lesson and its public outline. */
export function unlockedLesson(outline: LessonMeta, paid: PaidLesson): LessonMeta {
  return {
    ...outline,
    locked: false,
    quiz: paid.quiz,
    questions: paid.questions,
    keyTerms: paid.keyTerms,
    Content: function PaidLessonContent() { return renderNode(paid.tree); },
  };
}
