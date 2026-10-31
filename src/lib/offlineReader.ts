import { READER_CACHE, READER_FILES } from './offlineReaderAssets';
import type { LibraryPassage } from './librarySearch';

export async function isReaderPrepared(): Promise<boolean> {
  if (!('caches' in globalThis)) return false;
  const cache = await caches.open(READER_CACHE);
  return (await Promise.all(READER_FILES.map(async file => {
    const response = await cache.match(file.url);
    return response?.status === 200 && Number(response.headers.get('X-Dig-Bytes')) >= file.minimum;
  }))).every(Boolean);
}
export async function prepareReader(signal?: AbortSignal, progress?: (message: string) => void): Promise<void> {
  const cache = await caches.open(READER_CACHE);
  for (const file of READER_FILES) {
    signal?.throwIfAborted();
    const existing = await cache.match(file.url);
    if (existing?.status === 200 && Number(existing.headers.get('X-Dig-Bytes')) >= file.minimum) continue;
    progress?.(file.url.includes('onnx') ? 'Preparing dig’s question-answering model (about 65 MB)…' : 'Preparing dig’s offline reading tools…');
    const boundedSignal = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(300000)]);
    const response = await fetch(file.url, { signal: boundedSignal });
    if (!response.ok) throw new Error('The dig reader download was unavailable. Retry while connected.');
    const expected = Number(response.headers.get('Content-Length'));
    const stream = response.body?.getReader();
    if (!stream) throw new Error('The dig reader download was empty.');
    const chunks: Uint8Array[] = [];
    let bytes = 0, lastUpdate = 0;
    for (;;) {
      const part = await stream.read();
      if (part.done) break;
      chunks.push(part.value); bytes += part.value.byteLength;
      if (bytes - lastUpdate > 1024 * 1024) {
        lastUpdate = bytes;
        progress?.(`Preparing dig’s reader: ${(bytes / 1024 / 1024).toFixed(1)} MB${expected ? ` of ${(expected / 1024 / 1024).toFixed(1)} MB` : ''}`);
      }
    }
    if (bytes < file.minimum || expected && bytes !== expected) throw new Error('The dig reader download is incomplete.');
    const data = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
    chunks.length = 0;
    await cache.put(file.url, new Response(data, { headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream', 'X-Dig-Bytes': String(data.byteLength) } }));
  }
  if (!await isReaderPrepared()) throw new Error('The offline reader files could not be verified.');
}

let worker: Worker | undefined;
let sequence = 0;
type Reply = { id: number; answer?: string; passageIndex?: number; error?: string };
const pending = new Map<number, { resolve: (reply: Reply) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
export async function readLibraryAnswer(question: string, passages: LibraryPassage[]): Promise<Reply | null> {
  // No implicit model downloads from a chat request, even when connected.
  if (!await isReaderPrepared()) return null;
  if (!worker) {
    worker = new Worker(new URL('./offlineReader.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<Reply>) => {
      const request = pending.get(event.data.id);
      if (!request) return;
      clearTimeout(request.timer); pending.delete(event.data.id);
      if (event.data.error) request.reject(new Error(event.data.error)); else request.resolve(event.data);
    };
    worker.onerror = () => resetReader();
  }
  const current = worker;
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resetReader(), 45000);
    pending.set(id, { resolve, reject, timer });
    current.postMessage({ id, question, passages });
  });
}
function resetReader() {
  worker?.terminate(); worker = undefined;
  for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('The offline reader did not finish.')); }
  pending.clear();
}
