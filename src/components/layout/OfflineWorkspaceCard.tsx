import { useEffect, useState, useSyncExternalStore } from 'react';
import DigAvatar from '../characters/DigAvatar';
import { eligibleLibraryBooks, libraryReadiness, type BookReadiness } from '../../lib/offlineLibrary';
import { cancelOfflineWorkspace, getOfflineWorkspaceState, prepareOfflineWorkspace, refreshOfflineWorkspace, subscribeOfflineWorkspace } from '../../lib/offlineWorkspace';
import '../books/offline-library.css';

export default function OfflineWorkspaceCard({ compact = false }: { compact?: boolean }) {
  const state = useSyncExternalStore(subscribeOfflineWorkspace, getOfflineWorkspaceState, getOfflineWorkspaceState);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [books, setBooks] = useState<Record<string, BookReadiness>>({});
  const eligible = eligibleLibraryBooks();
  const size = eligible.reduce((total, book) => total + Number(book.fileSizeMb ?? 0), 0);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void refreshOfflineWorkspace();
      void libraryReadiness().then(value => { if (active) setBooks(value); }).catch(() => {});
    };
    refresh();
    window.addEventListener('darkworld:offline-library-changed', refresh);
    return () => { active = false; window.removeEventListener('darkworld:offline-library-changed', refresh); };
  }, [state.running]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  const ready = state.python && state.reader && state.readyBooks === state.totalBooks;
  const contents = <div className="offline-library-card__body offline-workspace">
    <div className="offline-workspace__intro"><DigAvatar size={54} thinking={state.running}/><div><strong>One preparation. Your whole offline workspace.</strong><p>Python, NumPy, pandas, dig’s question-answering model and all {eligible.length} in-library books for dig. No subject selection is needed.</p></div></div>
    <p className="offline-library-card__note">Approximately {size.toFixed(1)} MB of PDFs, plus approximately 90 MB for dig’s reader, Python and search indexes. Downloads start only when you choose Prepare. Books that are available only on external websites still require internet.</p>
    <ul className="offline-workspace__checks" aria-label="Offline readiness"><li><span aria-hidden="true">{state.python ? '✓' : '○'}</span>Python coding {state.python ? 'ready' : 'not yet prepared'}</li><li><span aria-hidden="true">{state.reader ? '✓' : '○'}</span>dig question answering {state.reader ? 'ready' : 'not yet prepared'}</li><li><span aria-hidden="true">{state.readyBooks === state.totalBooks ? '✓' : '○'}</span>dig library: {state.readyBooks} of {state.totalBooks} books ready</li></ul>
    <div className="offline-library-card__actions"><button type="button" disabled={!online || state.running || state.phase === 'checking'} onClick={() => void prepareOfflineWorkspace()}>{state.running ? 'Preparing offline workspace…' : ready ? 'Check offline readiness' : 'Prepare coding + full library'}</button>{state.running && <button type="button" onClick={cancelOfflineWorkspace}>Stop preparation</button>}</div>
    {!online && <p>Connect to finish preparation. Prepared coding files and indexed books remain available offline.</p>}
    {state.message && <div role="status"><p>{state.message}</p>{state.running && state.phase === 'library' && <progress aria-label="Library books processed" value={state.processedBooks} max={state.totalBooks || 1}/>}</div>}
    {state.error && <p role="alert" className="offline-library-card__error">{state.error}</p>}
    <details className="offline-workspace__books"><summary>Included books and recovery options</summary><p className="offline-library-card__note">Completed downloads are reused when you continue preparation. Browser storage can be cleared or evicted; readiness is checked against real files and indexes.</p><ul>{eligible.map(book => <li key={book.id}><span>{book.title}</span><small>{books[book.id] === 'ready' ? 'Ready' : books[book.id] === 'repair' ? 'Needs repair' : 'Not indexed'}</small></li>)}</ul><button type="button" disabled={!online || state.running} onClick={() => void prepareOfflineWorkspace(true)}>Rebuild the full library</button><small>Rebuilding downloads the PDFs again. Existing coding files and your learning progress are kept.</small></details>
    <small>Offline dig answers from saved book text, using its prepared reader when available. Hosted AI explanations, account sync, live rankings and external sites require internet. This preparation does not change lab answers or progress.</small>
  </div>;
  if (compact) return <details className="offline-library-card offline-library-card--compact"><summary><strong>Prepare offline workspace</strong><span>{ready ? 'Ready on this device' : `${state.readyBooks}/${state.totalBooks} books ready`}</span></summary>{contents}</details>;
  return <section className="offline-library-card" aria-label="Offline workspace preparation"><header className="offline-workspace__heading"><strong>Offline workspace preparation</strong><span>{ready ? 'Ready on this device' : 'Coding + dig library'}</span></header>{contents}</section>;
}
