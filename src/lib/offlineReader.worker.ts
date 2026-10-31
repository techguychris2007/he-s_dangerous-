import { env, pipeline } from '@huggingface/transformers';
import { READER_CACHE, READER_MODEL, READER_REVISION, wasmUrl, runtimeUrl } from './offlineReaderAssets';
import { supportedSpan, readerQuestion } from './libraryQuestion';
import { rankPassages, type LibraryPassage } from './librarySearch';

interface ReaderSpan { answer: string; score: number }
type Reader = (question: string, context: string) => Promise<ReaderSpan | ReaderSpan[]>;
let reader: Promise<Reader> | undefined;
async function loadReader(): Promise<Reader> {
  const cache = await caches.open(READER_CACHE);
  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.useBrowserCache = false;
  env.useCustomCache = true;
  env.customCache = cache;
  env.backends.onnx.wasm!.numThreads = 1;
  env.backends.onnx.wasm!.proxy = false;
  env.backends.onnx.wasm!.wasmPaths = { mjs: runtimeUrl, wasm: wasmUrl };
  const binary = await cache.match(wasmUrl);
  if (!binary) throw new Error('Prepare dig’s offline reader first.');
  env.backends.onnx.wasm!.wasmBinary = await binary.arrayBuffer();
  const createReader = pipeline as unknown as (task: 'question-answering', model: string, options: Record<string, unknown>) => Promise<Reader>;
  return createReader('question-answering', READER_MODEL, { revision: READER_REVISION, dtype: 'q8', device: 'wasm', local_files_only: true });
}
// Serial inference avoids parallel model sessions and unnecessary memory use.
let queue = Promise.resolve();
self.onmessage = (event: MessageEvent<{ id: number; question: string; passages: LibraryPassage[] }>) => {
  queue = queue.then(async () => {
    try {
      const qa = await (reader ??= loadReader().catch(error => { reader = undefined; throw error; }));
      let best: { answer: string; score: number; passageIndex: number } | undefined;
      const relevant = rankPassages(event.data.question, event.data.passages);
      for (const passage of relevant.slice(0, 3)) {
        const passageIndex = event.data.passages.indexOf(passage);
        const result = await qa(readerQuestion(event.data.question).slice(0, 800), passage.text.replace(/\s+/g, ' ').slice(0, 2400));
        const item = Array.isArray(result) ? result[0] : result;
        if (item && supportedSpan(item.answer, item.score, passage) && (!best || item.score > best.score)) best = { answer: item.answer, score: item.score, passageIndex };
      }
      self.postMessage({ id: event.data.id, ...(best ?? {}) });
    } catch { self.postMessage({ id: event.data.id, error: 'The offline reader is unavailable. Your saved books remain searchable.' }); }
  });
};
