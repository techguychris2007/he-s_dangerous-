import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { findBook, booksInTrack } from '../data/books';
import PdfViewer, { type PdfViewerHandle } from '../components/books/PdfViewer';
import { IconExternal, IconSearch } from '../components/layout/icons';

/** Runs the search across pages with limited concurrency instead of one-at-a-time (too slow for a
 *  300+ page book) or all-at-once (hundreds of simultaneous pdf.js calls at once). */
async function searchAllPages(viewer: PdfViewerHandle, query: string, onProgress: (done: number, total: number) => void) {
  const total = viewer.numPages;
  const lowerQuery = query.toLowerCase();
  const matches: number[] = [];
  const CONCURRENCY = 12;
  let done = 0;
  for (let start = 1; start <= total; start += CONCURRENCY) {
    const pageNums = Array.from({ length: Math.min(CONCURRENCY, total - start + 1) }, (_, i) => start + i);
    await Promise.all(
      pageNums.map(async (p) => {
        const text = await viewer.getPageText(p);
        if (text.toLowerCase().includes(lowerQuery)) matches.push(p);
        done++;
        onProgress(done, total);
      }),
    );
  }
  return matches.sort((a, b) => a - b);
}

export default function BookReaderPage() {
  const { bookId } = useParams();
  const book = bookId ? findBook(bookId) : undefined;
  const viewerRef = useRef<PdfViewerHandle>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<number[] | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [readState, setReadState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const stopRef = useRef(false);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    // reset per-book state when navigating between books
    stopRef.current = true;
    window.speechSynthesis.cancel();
    setReadState('idle');
    setResults(null);
    setQuery('');
    setSearchOpen(false);
  }, [bookId]);

  if (!book) return <Navigate to="/library" replace />;

  const fileUrl = `/books/${book.filename}`;
  const siblings = booksInTrack(book.track);
  const index = siblings.findIndex((b) => b.id === book.id);
  const prevBook = index > 0 ? siblings[index - 1] : undefined;
  const nextBook = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  const runSearch = async () => {
    if (!viewerRef.current || !query.trim()) return;
    setSearching(true);
    setSearchProgress({ done: 0, total: viewerRef.current.numPages });
    setResults(null);
    const matches = await searchAllPages(viewerRef.current, query.trim(), (done, total) => setSearchProgress({ done, total }));
    setResults(matches);
    setSearching(false);
  };

  const speakPage = async (pageNum: number): Promise<void> => {
    if (!viewerRef.current || stopRef.current) return;
    viewerRef.current.scrollToPage(pageNum);
    const text = await viewerRef.current.getPageText(pageNum);
    if (stopRef.current) return;
    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text.trim() || '.');
      const voice = voices.find((v) => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  const startReading = async (fromPage: number) => {
    stopRef.current = false;
    setReadState('playing');
    const total = viewerRef.current?.numPages ?? 0;
    for (let p = fromPage; p <= total; p++) {
      if (stopRef.current) break;
      await speakPage(p);
    }
    if (!stopRef.current) setReadState('idle');
  };

  const pauseReading = () => {
    window.speechSynthesis.pause();
    setReadState('paused');
  };
  const resumeReading = () => {
    window.speechSynthesis.resume();
    setReadState('playing');
  };
  const stopReading = () => {
    stopRef.current = true;
    window.speechSynthesis.cancel();
    setReadState('idle');
  };

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const voiceChoices = englishVoices.length > 0 ? englishVoices : voices;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/library" className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-1 inline-block">
              &larr; Back to Library
            </Link>
            <h1 className="text-lg font-bold text-[var(--color-heading)]">{book.title}</h1>
            <p className="text-xs text-[var(--color-text-dim)]" dangerouslySetInnerHTML={{ __html: `${book.subtitle} — ${book.author}` }} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className={`pill flex items-center gap-1 border ${
                searchOpen
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-2)] border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-heading)]'
              }`}
            >
              <IconSearch className="w-3 h-3" /> Find in book
            </button>
            <a
              href={book.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)] flex items-center gap-1 hover:text-[var(--color-heading)]"
            >
              {book.license} <IconExternal className="w-3 h-3" />
            </a>
            <a
              href={book.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)] flex items-center gap-1 hover:text-[var(--color-heading)]"
            >
              Support the author <IconExternal className="w-3 h-3" />
            </a>
            <a
              href={fileUrl}
              download={book.filename}
              className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 transition"
            >
              Download PDF ({book.fileSizeMb} MB)
            </a>
          </div>
        </div>

        {/* Read-aloud controls */}
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
          <span className="text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-wide">Read aloud</span>
          <select
            value={voiceURI}
            onChange={(e) => setVoiceURI(e.target.value)}
            className="text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-[var(--color-text)] max-w-[220px]"
          >
            <option value="">Browser default voice</option>
            {voiceChoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          {readState === 'idle' && (
            <button
              onClick={() => startReading(1)}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110 transition"
            >
              &#9654; Read from start
            </button>
          )}
          {readState === 'playing' && (
            <>
              <button onClick={pauseReading} className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)]">
                &#10073;&#10073; Pause
              </button>
              <button onClick={stopReading} className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)]">
                &#9632; Stop
              </button>
            </>
          )}
          {readState === 'paused' && (
            <>
              <button onClick={resumeReading} className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110">
                &#9654; Resume
              </button>
              <button onClick={stopReading} className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-2)]">
                &#9632; Stop
              </button>
            </>
          )}
          <span className="text-[11px] text-[var(--color-text-dim)]">
            Reads page by page and follows along automatically. Voices shown are whatever your browser/OS
            provides — availability of specific British/American voices depends on your device.
          </span>
        </div>

        {/* Search panel */}
        {searchOpen && (
          <div className="max-w-6xl mx-auto flex flex-wrap items-start gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="e.g. decrypt data"
                className="text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[var(--color-text)] w-64"
              />
              <button
                onClick={runSearch}
                disabled={searching || !query.trim()}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110 disabled:opacity-50"
              >
                Search
              </button>
            </div>
            <div className="flex-1 min-w-[200px]">
              {searching && (
                <span className="text-xs text-[var(--color-text-dim)] font-mono">
                  Searching page {searchProgress.done}/{searchProgress.total}&hellip;
                </span>
              )}
              {!searching && results !== null && results.length === 0 && (
                <span className="text-xs text-[var(--color-text-dim)]">No matches found.</span>
              )}
              {!searching && results !== null && results.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-[var(--color-text-dim)]">{results.length} page(s):</span>
                  {results.map((p) => (
                    <button
                      key={p}
                      onClick={() => viewerRef.current?.scrollToPage(p)}
                      className="px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-text)] hover:border-[var(--color-accent)]"
                    >
                      p.{p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0" style={{ minHeight: '80vh' }}>
        <PdfViewer ref={viewerRef} url={fileUrl} />
      </div>

      {book.track === 'security' && (prevBook || nextBook) && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 text-sm">
            {prevBook ? (
              <Link to={`/library/${prevBook.id}`} className="text-[var(--color-text-dim)] hover:text-[var(--color-heading)] transition-colors">
                &larr; #{prevBook.order} {prevBook.title}
              </Link>
            ) : (
              <span />
            )}
            {nextBook ? (
              <Link to={`/library/${nextBook.id}`} className="font-semibold text-[var(--color-accent)] hover:underline text-right">
                Next: #{nextBook.order} {nextBook.title} &rarr;
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
