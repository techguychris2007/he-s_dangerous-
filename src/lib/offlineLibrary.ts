import { BOOKS, type Book } from '../data/books';
import type { AskAiTutorResult } from './aiTutor';
import type { LibraryPassage } from './librarySearch';

const DB = 'darkworld-library-assistance';
const CACHE = 'dw-books-offline-v1';
const VERSION = 2;
interface IndexedBook { id: string; revision: string; bytes: number; hash: string; passages: LibraryPassage[] }
type BookMetadata = Omit<IndexedBook, 'passages'> & { passageCount: number };
export type BookReadiness = 'ready' | 'not-prepared' | 'repair';
export interface PreparationState { running: boolean; message: string; error: string; finished: number; total: number }
let state: PreparationState = { running: false, message: '', error: '', finished: 0, total: 0 };
const listeners = new Set<() => void>();
let controller: AbortController | null = null;
const publish = (next: Partial<PreparationState>) => { state = { ...state, ...next }; for (const listener of listeners) listener(); };
export const getPreparationState = () => state;
export function subscribePreparation(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export const eligibleLibraryBooks = () => BOOKS.filter(book => !!book.filename);
const revision = (book: Book) => `${VERSION}:${book.filename}:${book.fileSizeMb}:${book.title}`;
const urlFor = (book: Book) => new URL('/books/' + book.filename, location.origin).href;

async function database(): Promise<IDBDatabase> {
  if (!('indexedDB' in globalThis)) throw new Error('Offline library storage is unavailable in this browser.');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, VERSION);
    request.onupgradeneeded = () => {
      for (const name of ['books', 'metadata']) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' });
    };
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(new Error('Offline library storage could not be opened. Check browser storage settings.'));
    request.onblocked = () => reject(new Error('Close other DarkWorld tabs and try preparing the library again.'));
  });
}
async function records(): Promise<IndexedBook[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readonly');
    const request = tx.objectStore('books').getAll();
    tx.oncomplete = () => { db.close(); resolve(request.result as IndexedBook[]); };
    tx.onerror = () => { db.close(); reject(new Error('The saved library index could not be read.')); };
  });
}
async function metadata(): Promise<BookMetadata[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const request = tx.objectStore('metadata').getAll();
    tx.oncomplete = () => { db.close(); resolve(request.result as BookMetadata[]); };
    tx.onerror = () => { db.close(); reject(new Error('The saved library status could not be read.')); };
  });
}
async function store(record: IndexedBook): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['books', 'metadata'], 'readwrite');
    tx.objectStore('books').put(record);
    const { passages, ...info } = record;
    tx.objectStore('metadata').put({ ...info, passageCount: passages.length });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error('The library index could not be saved. Free device storage and retry.')); };
  });
}
async function isReady(book: Book, record: BookMetadata | undefined, cache: Cache): Promise<boolean> {
  if (!record || record.revision !== revision(book) || !record.passageCount) return false;
  const response = await cache.match(urlFor(book));
  // New cache entries carry the exact decoded length. Older reader-saved files need preparation.
  return response?.status === 200 && Number(response.headers.get('Content-Length')) === record.bytes && response.headers.get('X-Darkworld-Source-Hash') === record.hash;
}
export async function libraryReadiness(): Promise<Record<string, BookReadiness>> {
  if (!('caches' in globalThis)) throw new Error('This browser does not support offline library storage.');
  const saved = await metadata();
  const cache = await caches.open(CACHE);
  return Object.fromEntries(await Promise.all(eligibleLibraryBooks().map(async book => {
    const record = saved.find(item => item.id === book.id);
    return [book.id, await isReady(book, record, cache) ? 'ready' : record ? 'repair' : 'not-prepared'];
  })));
}
export function cancelLibraryPreparation() { controller?.abort(); }
export async function prepareLibrary(bookIds: string[], repair = false): Promise<void> {
  if (state.running) return;
  const books = eligibleLibraryBooks().filter(book => bookIds.includes(book.id));
  if (!books.length) throw new Error('Choose at least one library book.');
  if (!navigator.onLine) throw new Error('Connect to the internet to prepare or repair offline library assistance.');
  if (!('caches' in globalThis) || !('serviceWorker' in navigator) || !navigator.serviceWorker.controller) throw new Error('Open the installed app or reload the deployed site while online before preparing offline assistance.');
  const current = new AbortController(); controller = current;
  publish({ running: true, error: '', message: 'Checking device storage…', finished: 0, total: books.length });
  try {
    const readiness = await libraryReadiness();
    const pending = books.filter(book => repair || readiness[book.id] !== 'ready');
    const estimate = await navigator.storage?.estimate?.();
    const needed = pending.reduce((sum, book) => sum + Number(book.fileSizeMb ?? 5) * 1024 * 1024 * 1.3, 0);
    if (estimate?.quota && estimate.quota - (estimate.usage ?? 0) < needed) throw new Error('There is not enough device storage for this selection. Choose fewer books or free storage first.');
    try { await navigator.storage?.persist?.(); } catch { /* The browser may decline persistent storage. */ }
    const cache = await caches.open(CACHE);
    const failures: string[] = [];
    const { extractLibraryPdf } = await import('./libraryPdfText');
    for (let index = 0; index < books.length; index++) {
      const book = books[index]; current.signal.throwIfAborted();
      if (!repair && readiness[book.id] === 'ready') { publish({ finished: index + 1 }); continue; }
      try {
        publish({ message: `Downloading ${book.title}…` });
        const cached = repair ? undefined : await cache.match(urlFor(book));
        let response = cached?.status === 200 ? cached : await fetch(urlFor(book), { signal: current.signal });
        if (!response.ok) throw new Error('The PDF download was unavailable.');
        let data = new Uint8Array(await response.arrayBuffer());
        if (new TextDecoder().decode(data.subarray(0, 8)).startsWith('%PDF-') === false) {
          // A broken previous cache entry must never permanently prevent repair.
          response = await fetch(urlFor(book), { signal: current.signal, cache: 'reload' });
          if (!response.ok) throw new Error('The PDF download was unavailable.');
          data = new Uint8Array(await response.arrayBuffer());
        }
        if (!new TextDecoder().decode(data.subarray(0, 8)).startsWith('%PDF-') || !new TextDecoder().decode(data.subarray(-2048)).includes('%%EOF')) throw new Error('The PDF is incomplete. Retry while connected.');
        const bytes = data.length;
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map(byte => byte.toString(16).padStart(2, '0')).join('');
        // PDF.js transfers its buffer to its parsing worker, so keep the exact PDF separately.
        const retained = data.slice();
        const passages = await extractLibraryPdf(data, book.id, book.title, current.signal, (page, total) => {
          if (page === 1 || page % 10 === 0 || page === total) publish({ message: `Indexing ${book.title}: page ${page} of ${total}` });
        });
        current.signal.throwIfAborted();
        await cache.put(urlFor(book), new Response(retained, { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(bytes), 'X-Darkworld-Source-Hash': hash } }));
        current.signal.throwIfAborted();
        await store({ id: book.id, revision: revision(book), bytes, hash, passages });
        const verified = await libraryReadiness();
        if (verified[book.id] !== 'ready') throw new Error('Offline files could not be confirmed. Please retry.');
      } catch (error) {
        if (current.signal.aborted) throw error;
        failures.push(`${book.title}: ${error instanceof Error ? error.message : 'Preparation failed.'}`);
      }
      publish({ finished: index + 1 });
    }
    publish({ message: failures.length ? 'Some books need attention. Completed books remain available.' : 'Your selected books are ready for offline library search.', error: failures.join('\n') });
  } catch (error) {
    publish({ message: current.signal.aborted ? 'Preparation cancelled. Completed books remain available.' : '', error: current.signal.aborted ? '' : error instanceof Error ? error.message : 'Preparation failed.' });
  } finally { controller = null; publish({ running: false }); }
  window.dispatchEvent(new Event('darkworld:offline-library-changed'));
}
export async function removeLibraryIndex(id: string): Promise<void> {
  if (state.running) throw new Error('Wait for preparation to finish or cancel it first.');
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['books', 'metadata'], 'readwrite'); tx.objectStore('books').delete(id); tx.objectStore('metadata').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(new Error('The index could not be removed.')); };
  });
  window.dispatchEvent(new Event('darkworld:offline-library-changed'));
}
export async function searchSavedLibrary(question: string, contextTitle?: string): Promise<AskAiTutorResult> {
  const result = (answer: string): AskAiTutorResult => ({ answer, model: 'Offline library search', sourceMode: 'library' });
  const readiness = await libraryReadiness();
  const books = (await records()).filter(book => readiness[book.id] === 'ready');
  if (!books.length) return result('No searchable books are prepared on this device. Open “Prepare library assistance” while connected, choose a subject pack or books, and finish preparation. Reading PDFs saved without a search index must be prepared once.');
  // Context is used only when a quick action contains no subject, never to override a specific question.
  const { queryTerms } = await import('./librarySearch');
  const effectiveQuestion = queryTerms(question).length ? question : queryTerms(contextTitle ?? '').slice(0, 3).join(' ');
  const worker = new Worker(new URL('./librarySearch.worker.ts', import.meta.url), { type: 'module' });
  const passages = books.flatMap(book => book.passages);
  const found = await new Promise<LibraryPassage[]>((resolve, reject) => {
    const timeout = setTimeout(() => { worker.terminate(); reject(new Error('The library search took too long. Try a more specific question.')); }, 20000);
    worker.onmessage = (event: MessageEvent<{ results?: LibraryPassage[]; error?: string }>) => {
      clearTimeout(timeout); worker.terminate();
      if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.results ?? []);
    };
    worker.onerror = () => { clearTimeout(timeout); worker.terminate(); reject(new Error('Offline search could not start. Reload the app and retry.')); };
    worker.postMessage({ question: effectiveQuestion, passages });
  });
  if (!found.length) return result('I could not find a sufficiently relevant passage in your prepared books. Try a specific term, a shorter question, or prepare another subject pack while online. This mode searches saved sources; it does not generate an explanation.');
  return {
    ...result('These passages from your prepared library may help. They are source excerpts, not a generated explanation. Open a source below to read it here; no page change is needed.'),
    citations: found.map(passage => ({ title: `${passage.title} · PDF page ${passage.page}`, uri: `/#/library/${passage.bookId}`, library: passage })),
  };
}
