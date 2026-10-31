import { useEffect, useState, useSyncExternalStore } from 'react';
import './offline-library.css';
import { cancelLibraryPreparation, eligibleLibraryBooks, getPreparationState, libraryReadiness, prepareLibrary, removeLibraryIndex, subscribePreparation, type BookReadiness } from '../../lib/offlineLibrary';

const PACKS = [['security', 'Cybersecurity'], ['programming', 'Programming'], ['machine-learning', 'Machine Learning']] as const;
export default function OfflineLibraryCard({ compact = false }: { compact?: boolean }) {
  const preparation = useSyncExternalStore(subscribePreparation, getPreparationState, getPreparationState);
  const [selected, setSelected] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<Record<string, BookReadiness>>({});
  const [online, setOnline] = useState(() => navigator.onLine);
  const [error, setError] = useState('');
  const [usedMb, setUsedMb] = useState<number | null>(null);
  const books = eligibleLibraryBooks();
  useEffect(() => {
    let active = true;
    const refresh = () => { void libraryReadiness().then(value => { if (active) { setReadiness(value); setError(''); } }).catch(error => { if (active) setError(error.message); }); };
    refresh();
    window.addEventListener('darkworld:offline-library-changed', refresh);
    void navigator.storage?.estimate?.().then(value => { if (active) setUsedMb(Math.round((value.usage ?? 0) / 1024 / 1024)); }).catch(() => {});
    return () => { active = false; window.removeEventListener('darkworld:offline-library-changed', refresh); };
  }, [preparation.running]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  const toggle = (ids: string[], checked: boolean) => setSelected(current => checked ? [...new Set([...current, ...ids])] : current.filter(id => !ids.includes(id)));
  const size = books.filter(book => selected.includes(book.id)).reduce((sum, book) => sum + Number(book.fileSizeMb ?? 0), 0);
  const readyCount = Object.values(readiness).filter(value => value === 'ready').length;
  const start = async (repair = false) => { setError(''); try { await prepareLibrary(selected, repair); } catch (error) { setError(error instanceof Error ? error.message : 'Preparation failed.'); } };
  return <details className={`offline-library-card ${compact ? 'offline-library-card--compact' : ''}`}>
    <summary><strong>Prepare library assistance</strong><span>{readyCount} {readyCount === 1 ? 'book' : 'books'} ready</span></summary>
    <div className="offline-library-card__body">
      <p>Prepare selected books while connected. Offline chat searches their text and shows cited passages here. No AI model is downloaded.</p>
      <p className="offline-library-card__note">Only in-library PDFs are eligible. External books, documentation and repositories require internet. Indexing a large pack can take several minutes.</p>
      {PACKS.map(([track, label]) => {
        const pack = books.filter(book => book.track === track);
        return <fieldset key={track} disabled={preparation.running}><legend>{label}</legend>
          <label className="offline-library-card__select"><input type="checkbox" checked={pack.length > 0 && pack.every(book => selected.includes(book.id))} onChange={event => toggle(pack.map(book => book.id), event.target.checked)} /> Select subject pack · {pack.length} {pack.length === 1 ? 'book' : 'books'}</label>
          {pack.map(book => <div key={book.id} className="offline-library-card__book">
            <label><input type="checkbox" checked={selected.includes(book.id)} onChange={event => toggle([book.id], event.target.checked)} /><span>{book.title}<small>{book.fileSizeMb} MB · {readiness[book.id] === 'ready' ? 'Ready' : readiness[book.id] === 'repair' ? 'Needs repair' : 'Not indexed'}</small></span></label>
            {readiness[book.id] === 'ready' && <button type="button" onClick={async () => {
              try { await removeLibraryIndex(book.id); setReadiness(await libraryReadiness()); } catch (error) { setError(error instanceof Error ? error.message : 'Could not remove index.'); }
            }}>Remove index</button>}
          </div>)}
        </fieldset>;
      })}
      <p>{selected.length} selected · approximately {size.toFixed(1)} MB of PDFs, plus search indexes.{usedMb !== null && ` App storage currently used: ${usedMb} MB.`}</p>
      <div className="offline-library-card__actions"><button type="button" disabled={!online || !selected.length || preparation.running} onClick={() => void start()}>Prepare selected books</button><button type="button" disabled={!online || !selected.length || preparation.running} onClick={() => void start(true)}>Repair selected books</button>{preparation.running && <button type="button" onClick={cancelLibraryPreparation}>Cancel</button>}</div>
      {!online && <p>Connect to prepare more books. Already prepared books remain searchable.</p>}
      {(preparation.message || preparation.running) && <div role="status"><p>{preparation.message}</p>{preparation.running && <progress aria-label="Books prepared" value={preparation.finished} max={preparation.total || 1} />}</div>}
      {(error || preparation.error) && <p role="alert" className="offline-library-card__error">{error || preparation.error}</p>}
      <small>Browser storage can be cleared or evicted. Readiness is checked against saved files and indexes. Removing an index keeps the reading PDF.</small>
    </div>
  </details>;
}
