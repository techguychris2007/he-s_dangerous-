import { eligibleLibraryBooks, libraryReadiness, prepareLibrary, getPreparationState, subscribePreparation, cancelLibraryPreparation } from './offlineLibrary';
import { isReaderPrepared, prepareReader } from './offlineReader';
import { isCodingPrepared, prepareCoding, requireOfflineApp } from './offlineCoding';

export interface OfflineWorkspaceState {
  running: boolean;
  phase: 'checking' | 'idle' | 'coding' | 'reader' | 'library' | 'ready' | 'partial' | 'cancelled' | 'error';
  python: boolean;
  reader: boolean;
  readyBooks: number;
  totalBooks: number;
  processedBooks: number;
  message: string;
  error: string;
}
let state: OfflineWorkspaceState = { running: false, phase: 'checking', python: false, reader: false, readyBooks: 0, totalBooks: eligibleLibraryBooks().length, processedBooks: 0, message: '', error: '' };
const listeners = new Set<() => void>();
const publish = (change: Partial<OfflineWorkspaceState>) => { state = { ...state, ...change }; for (const listener of listeners) listener(); };
export const getOfflineWorkspaceState = () => state;
export function subscribeOfflineWorkspace(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
let checking: Promise<void> | null = null;
let preparing: Promise<void> | null = null;
let cancelled = false;
let readerController: AbortController | undefined;

export function refreshOfflineWorkspace(): Promise<void> {
  if (checking) return checking;
  checking = (async () => {
    try {
      const [python, reader, books] = await Promise.all([isCodingPrepared(), isReaderPrepared(), libraryReadiness()]);
      const eligible = eligibleLibraryBooks();
      const readyBooks = eligible.filter(book => books[book.id] === 'ready').length;
      const ready = python && reader && readyBooks === eligible.length;
      publish({ python, reader, readyBooks, totalBooks: eligible.length, ...(!state.running && ['checking', 'idle', 'ready'].includes(state.phase) ? { phase: ready ? 'ready' as const : 'idle' as const } : {}) });
    } catch (error) {
      if (!state.running) publish({ phase: 'error', error: error instanceof Error ? error.message : 'Offline storage could not be checked.' });
    }
  })().finally(() => { checking = null; });
  return checking;
}
export function cancelOfflineWorkspace() {
  if (!state.running) return;
  cancelled = true;
  cancelLibraryPreparation();
  readerController?.abort();
  publish({ message: state.phase === 'coding' ? 'Stopping after the current Python download finishes. Prepared files will be kept.' : 'Stopping preparation. Completed books will be kept.' });
}
export function prepareOfflineWorkspace(repair = false): Promise<void> {
  if (preparing) return preparing;
  cancelled = false;
  preparing = run(repair).finally(() => { preparing = null; });
  return preparing;
}
async function run(repair: boolean): Promise<void> {
  const errors: string[] = [];
  publish({ running: true, phase: 'coding', message: 'Checking the app and device storage…', error: '', processedBooks: 0 });
  try {
    if (!navigator.onLine) throw new Error('Connect once to prepare offline coding and the full library. Already prepared files remain available.');
    await requireOfflineApp();
    await refreshOfflineWorkspace();
    const books = eligibleLibraryBooks();
    const estimate = await navigator.storage?.estimate?.();
    const statuses = await libraryReadiness();
    const needed = books.filter(book => repair || statuses[book.id] !== 'ready').reduce((sum, book) => sum + Number(book.fileSizeMb ?? 5) * 1024 * 1024 * 1.3, 0) + (state.python ? 0 : 100 * 1024 * 1024) + (state.reader ? 0 : 100 * 1024 * 1024);
    if (estimate?.quota && estimate.quota - (estimate.usage ?? 0) < needed) throw new Error('There is not enough device storage for the full offline workspace. Free storage and retry; existing files will be kept.');
    if (cancelled) return;
    if (!state.python) {
      publish({ phase: 'coding', message: 'Preparing Python, NumPy and pandas…' });
      try { await prepareCoding(); } catch (error) { errors.push('Python: ' + (error instanceof Error ? error.message : 'Preparation failed.')); }
      publish({ python: await isCodingPrepared() });
    }
    if (cancelled) return;
    if (!state.reader) {
      publish({ phase: 'reader', message: 'Preparing dig’s offline question-answering model…' });
      readerController = new AbortController();
      try { await prepareReader(readerController.signal, message => publish({ message })); }
      catch (error) { if (!cancelled) errors.push('dig reader: ' + (error instanceof Error ? error.message : 'Preparation failed.')); }
      finally { readerController = undefined; }
      publish({ reader: await isReaderPrepared() });
    }
    if (cancelled) return;
    publish({ phase: 'library', message: `Preparing all ${books.length} library books for dig…` });
    const unsubscribe = subscribePreparation(() => {
      const library = getPreparationState();
      publish({ processedBooks: library.finished, message: cancelled ? 'Stopping preparation. Completed books will be kept.' : library.message });
    });
    try {
      await prepareLibrary(books.map(book => book.id), repair);
      const library = getPreparationState();
      if (library.error) errors.push(library.error);
    } finally { unsubscribe(); }
    await refreshOfflineWorkspace();
  } catch (error) { errors.push(error instanceof Error ? error.message : 'Offline preparation failed.'); }
  finally {
    await refreshOfflineWorkspace();
    const complete = state.python && state.reader && state.readyBooks === state.totalBooks;
    publish({ running: false, phase: cancelled ? 'cancelled' : complete ? 'ready' : state.python || state.reader || state.readyBooks ? 'partial' : 'error', message: cancelled ? 'Preparation stopped. Completed downloads and indexes are kept; continue when you are ready.' : complete ? 'Offline workspace ready: coding tools, dig’s question-answering model and every eligible library book are prepared on this device.' : 'Preparation is incomplete. Finished downloads are kept; retry to continue.', error: errors.join('\n') });
  }
}
