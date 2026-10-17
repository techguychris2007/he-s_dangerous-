import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { findBook, booksInTrack } from '../data/books';
import PdfViewer, { type PdfViewerHandle } from '../components/books/PdfViewer';
import AiReadingCompanion from '../components/books/AiReadingCompanion';
import { IconBook, IconCheck, IconDownload, IconExternal, IconFlask, IconSearch } from '../components/layout/icons';
import { SECURITY_TASKS, BOOK_LAB_TASK_IDS } from '../labs/securityTasks';

/** Runs the search across pages with limited concurrency instead of one-at-a-time (too slow for a
 *  300+ page book) or all-at-once (hundreds of simultaneous pdf.js calls at once). */
async function searchAllPages(viewer: PdfViewerHandle, query: string, onProgress: (done: number, total: number) => void, shouldStop: () => boolean) {
  const total = viewer.numPages;
  const lowerQuery = query.toLowerCase();
  const matches: number[] = [];
  const CONCURRENCY = 12;
  let done = 0;
  for (let start = 1; start <= total; start += CONCURRENCY) {
    if (shouldStop()) return [];
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
  const localPdfUrl = book?.filename ? '/books/' + book.filename : null;
  const viewerRef = useRef<PdfViewerHandle>(null);
  const [offlineBookState, setOfflineBookState] = useState<'checking' | 'ready' | 'saved' | 'saving' | 'error' | 'unsupported'>('checking');
  const [offlineBookMessage, setOfflineBookMessage] = useState('');
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
    };
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<number[] | null>(null);
  const [searchError, setSearchError] = useState('');
  const searchRunRef = useRef(0);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [readState, setReadState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const stopRef = useRef(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [numPagesLoaded, setNumPagesLoaded] = useState(0);
  const [startPageInput, setStartPageInput] = useState('1');
  const startInputFocusedRef = useRef(false);
  useEffect(() => {
    if (!startInputFocusedRef.current) setStartPageInput(String(currentPage || 1));
  }, [currentPage]);

  // Cross-page repetition detector for read-aloud: a running header/footer (book title, version
  // stamp, bare page number) appears as the first or last line of many pages in a row. The first
  // time such a line is seen it's read once; the moment it repeats, it's remembered as boilerplate
  // and skipped on every later page — so the listener hears the book's actual prose, not "OWASP
  // Application Security Verification Standard, page 47" read out before every paragraph.
  const lineFreqRef = useRef<Map<string, number>>(new Map());
  const boilerplateRef = useRef<Set<string>>(new Set());
  const BARE_PAGE_NUMBER_RE = /^[ivxlcdm\d]{1,6}$/i;
  const filterReadingLines = (lines: string[]): string[] => {
    if (lines.length === 0) return lines;
    const candidateIdxs = Array.from(new Set([0, lines.length - 1]));
    const toDrop = new Set<number>();
    for (const idx of candidateIdxs) {
      const line = lines[idx]?.trim();
      if (!line) {
        toDrop.add(idx);
        continue;
      }
      if (BARE_PAGE_NUMBER_RE.test(line)) {
        toDrop.add(idx);
        continue;
      }
      if (boilerplateRef.current.has(line)) {
        toDrop.add(idx);
        continue;
      }
      const count = (lineFreqRef.current.get(line) ?? 0) + 1;
      lineFreqRef.current.set(line, count);
      if (count >= 2) {
        boilerplateRef.current.add(line);
        toDrop.add(idx);
      }
    }
    return lines.filter((_, i) => !toDrop.has(i));
  };

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const currentBookIdRef = useRef(bookId);
  useEffect(() => {
    // reset per-book state when navigating between books
    currentBookIdRef.current = bookId;
    searchRunRef.current++;
    stopRef.current = true;
    window.speechSynthesis.cancel();
    setReadState('idle');
    setResults(null);
    setSearchError('');
    setQuery('');
    setSearchOpen(false);
    setSearching(false);
    setSearchProgress({ done: 0, total: 0 });
    setCurrentPage(1);
    setNumPagesLoaded(0);
    setStartPageInput('1');
    lineFreqRef.current = new Map();
    boilerplateRef.current = new Set();
  }, [bookId]);

  useEffect(() => {
    let cancelled = false;
    setOfflineBookMessage('');
    if (!localPdfUrl || !('caches' in window)) {
      setOfflineBookState('unsupported');
      return () => { cancelled = true; };
    }
    setOfflineBookState('checking');
    void caches.open('dw-books-offline-v1')
      .then(cache => cache.match(new URL(localPdfUrl, window.location.href)))
      .then(response => {
        if (!cancelled) setOfflineBookState(response?.status === 200 ? 'saved' : 'ready');
      })
      .catch(() => { if (!cancelled) setOfflineBookState('ready'); });
    return () => { cancelled = true; };
  }, [localPdfUrl]);

  if (!book) return <Navigate to="/library" replace />;
  if (!book.filename) {
    const siblings = booksInTrack(book.track);
    const index = siblings.findIndex((b) => b.id === book.id);
    const prevBook = index > 0 ? siblings[index - 1] : undefined;
    const nextBook = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div
          className="relative overflow-hidden border-b border-[var(--color-border)]"
          style={{ background: 'linear-gradient(180deg, var(--color-navy) 0%, var(--color-navy-dim) 100%)' }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <Link to={`/library?track=${book.track}`} className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              &larr; Back to Library
            </Link>
            <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8 items-end">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.track === 'security' && <span className="pill bg-white text-[var(--color-navy)] font-bold">#{book.order}</span>}
                  {book.stage && <span className="pill bg-white/10 text-white/80 border border-white/20">{book.stage}</span>}
                  <span className="pill bg-[var(--color-warn)]/20 text-[var(--color-warn)] border border-[var(--color-warn)]/30">
                    Official source required
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.05em] text-white mb-3">{book.title}</h1>
                <p className="text-white/70 text-base leading-7 max-w-3xl">{book.subtitle}</p>
                <p className="text-white/55 text-sm mt-3 font-mono" dangerouslySetInnerHTML={{ __html: book.author }} />
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 flex items-center justify-center mb-4">
                  <IconBook className="w-7 h-7 text-[var(--color-accent-dim)]" />
                </div>
                <div className="text-xs uppercase tracking-[0.16em] text-white/50 mb-2">Availability</div>
                <p className="text-sm text-white/75 leading-6">
                  This title is listed in the roadmap, but it is not cached because the catalog does not have a redistributable PDF to serve safely.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <div className="premium-card rounded-3xl p-6 sm:p-8">
              <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--color-heading)] mb-3">Why this opens from the official source</h2>
              <p className="text-sm sm:text-base text-[var(--color-text-dim)] leading-7 mb-5">{book.description}</p>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-dim)] mb-2">Caching policy</div>
                <p className="text-sm text-[var(--color-text-dim)] leading-6">
                  DarkWorld caches books only when the source is public domain or the license clearly permits redistribution of the exact file. For this title, the safe path is to keep the learner in the Library for context, then send them to the official publisher, author, or project page.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={book.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-bold text-white hover:brightness-110 transition"
                >
                  Open official source <IconExternal className="w-4 h-4" />
                </a>
                <a
                  href={book.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-bold text-[var(--color-heading)] hover:border-[var(--color-accent)]/60 transition"
                >
                  View license/source note <IconExternal className="w-4 h-4" />
                </a>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="premium-card rounded-3xl p-5">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-dim)] mb-3">Reader status</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-warn)]/15 border border-[var(--color-warn)]/30 flex items-center justify-center">
                    <IconExternal className="w-5 h-5 text-[var(--color-warn)]" />
                  </div>
                  <div>
                    <div className="font-black text-[var(--color-heading)]">Not cached</div>
                    <div className="text-xs text-[var(--color-text-dim)]">Use the official source</div>
                  </div>
                </div>
              </div>
              <div className="premium-card rounded-3xl p-5">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-dim)] mb-3">Roadmap position</div>
                <p className="text-sm text-[var(--color-text-dim)] leading-6">
                  {book.stage ? `${book.stage}, book #${book.order}.` : `Programming shelf, book #${book.order}.`} Return here after reading to continue the sequence.
                </p>
              </div>
            </aside>
          </div>

          {(prevBook || nextBook) && (
            <div className="mt-6 premium-card rounded-3xl p-5 flex items-center justify-between gap-4 text-sm">
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
          )}
        </div>
      </div>
    );
  }

  const fileUrl = `/books/${book.filename}`;
  const siblings = booksInTrack(book.track);
  const index = siblings.findIndex((b) => b.id === book.id);
  const prevBook = index > 0 ? siblings[index - 1] : undefined;
  const nextBook = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;
  const bookLabs = (BOOK_LAB_TASK_IDS[book.id] ?? [])
    .map((taskId) => SECURITY_TASKS.find((t) => t.id === taskId))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const saveBookForOffline = async () => {
    if (!localPdfUrl || offlineBookState === 'saving' || !('caches' in window)) return;
    if (!online) {
      setOfflineBookState('error');
      setOfflineBookMessage('Connect to the internet once to save this book for offline reading.');
      return;
    }
    setOfflineBookState('saving');
    setOfflineBookMessage('');
    try {
      const response = await fetch(localPdfUrl, { credentials: 'same-origin' });
      if (response.status !== 200 || !response.ok || !response.headers.get('content-type')?.includes('pdf')) {
        throw new Error('The PDF could not be downloaded completely.');
      }
      const cache = await caches.open('dw-books-offline-v1');
      await cache.put(new URL(localPdfUrl, window.location.href), response.clone());
      setOfflineBookState('saved');
      setOfflineBookMessage('Saved in this browser. You can read this book offline on this device.');
    } catch {
      setOfflineBookState('error');
      setOfflineBookMessage('Could not save the book. Check your connection or available device storage and try again.');
    }
  };

  const runSearch = async () => {
    if (!viewerRef.current || !query.trim() || searching) return;
    if (!viewerRef.current.numPages) {
      setSearchError('Wait for the book to finish loading, then try your search again.');
      return;
    }
    const searchRun = ++searchRunRef.current;
    // viewerRef points at the same PdfViewer instance across book navigation (it isn't remounted),
    // so a search that's still in flight when the visitor jumps to another book would otherwise keep
    // reading that new book's pages under the old query and silently overwrite this book's search
    // state once it resolves. Guard every state write with a check that we're still on the book the
    // search was started for.
    const requestedBookId = bookId;
    setSearching(true);
    setSearchError('');
    setSearchProgress({ done: 0, total: viewerRef.current.numPages });
    setResults(null);
    try {
      const matches = await searchAllPages(viewerRef.current, query.trim(), (done, total) => {
        if (currentBookIdRef.current !== requestedBookId || searchRun !== searchRunRef.current) return;
        setSearchProgress({ done, total });
      }, () => currentBookIdRef.current !== requestedBookId || searchRun !== searchRunRef.current);
      if (currentBookIdRef.current === requestedBookId && searchRun === searchRunRef.current) setResults(matches);
    } catch {
      if (currentBookIdRef.current === requestedBookId && searchRun === searchRunRef.current) setSearchError('Some pages could not be searched. Please retry after the book loads.');
    } finally {
      if (currentBookIdRef.current === requestedBookId && searchRun === searchRunRef.current) setSearching(false);
    }
  };

  const speakPage = async (pageNum: number): Promise<void> => {
    if (!viewerRef.current || stopRef.current) return;
    viewerRef.current.scrollToPage(pageNum);
    const lines = await viewerRef.current.getPageLines(pageNum);
    const text = filterReadingLines(lines).join(' ');
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
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to={`/library?track=${book.track}`} className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-1 inline-block">
              &larr; Back to Library
            </Link>
            <h1 className="text-lg font-bold text-[var(--color-heading)]">{book.title}</h1>
            <p className="text-xs text-[var(--color-text-dim)]" dangerouslySetInnerHTML={{ __html: `${book.subtitle} — ${book.author}` }} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={saveBookForOffline}
                disabled={offlineBookState === 'checking' || offlineBookState === 'saving' || offlineBookState === 'unsupported' || offlineBookState === 'saved' || !online}
              className="px-3.5 py-2 rounded-lg border border-[var(--color-gold)]/45 bg-[var(--color-gold-soft)] text-sm font-semibold text-[var(--color-gold-dim)] hover:brightness-105 disabled:cursor-default disabled:opacity-80 transition"
            >
              <span className="inline-flex items-center gap-1.5">
                {offlineBookState === 'saved' ? <IconCheck className="w-4 h-4" /> : <IconDownload className="w-4 h-4" />}
                {offlineBookState === 'checking' ? 'Checking…' : offlineBookState === 'saving' ? 'Saving…' : offlineBookState === 'saved' ? 'Saved offline' : offlineBookState === 'unsupported' ? 'Offline save unavailable' : offlineBookState === 'error' ? 'Retry offline save' : 'Save for offline'}
              </span>
            </button>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-pressed={searchOpen}
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
              <span className="inline-flex items-center gap-1.5"><IconDownload className="w-4 h-4" /> Download PDF ({book.fileSizeMb} MB)</span>
            </a>
          </div>
        </div>
        {offlineBookMessage && <p role="status" aria-live="polite" className="max-w-6xl mx-auto mt-2 text-xs text-[var(--color-text-dim)]">{offlineBookMessage}</p>}

        {/* Copyright & attribution notice — required by every license on this shelf, and the
            clearest signal to any visitor (including the rights holder) that this is a licensed
            copy, not a claim of ownership. */}
        <div className="max-w-6xl mx-auto mt-3 pt-3 border-t border-[var(--color-border)]">
          <p className="text-2xs text-[var(--color-text-dim)] leading-relaxed">
            This book was written by <span dangerouslySetInnerHTML={{ __html: book.author }} />. Copyright remains with
            the original author{book.track === 'security' ? '/publisher' : ''}; this site does not claim ownership of
            this work. Distributed under the{' '}
            <a href={book.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-heading)]">
              {book.license}
            </a>{' '}
            license. Official source:{' '}
            <a href={book.officialUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-heading)]">
              {book.officialUrl}
            </a>
            .
          </p>
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
            <>
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)]">
                from page
                <input
                  type="number"
                  min={1}
                  max={numPagesLoaded || undefined}
                  value={startPageInput}
                  onChange={(e) => setStartPageInput(e.target.value)}
                  onFocus={() => {
                    startInputFocusedRef.current = true;
                  }}
                  onBlur={() => {
                    startInputFocusedRef.current = false;
                  }}
                  className="w-16 text-center bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-1.5 py-1.5 text-[var(--color-text)]"
                />
              </label>
              <button
                onClick={() => {
                  const total = viewerRef.current?.numPages ?? numPagesLoaded;
                  const start = Math.min(Math.max(1, Math.round(Number(startPageInput)) || 1), Math.max(1, total));
                  startReading(start);
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:brightness-110 transition"
              >
                &#9654; Start reading
              </button>
            </>
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
          <span className="text-2xs text-[var(--color-text-dim)] basis-full">
            Reads page by page and follows along automatically, skipping repeated headers/footers and bare
            page numbers so you hear the actual text. Pick a page above (defaults to wherever you're
            scrolled to), or click the page number in the viewer below to jump anywhere directly. Voices
            shown are whatever your browser/OS provides — availability of specific British/American voices
            depends on your device.
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
              {searchError && <p role="alert" className="text-sm text-[var(--color-danger)]">{searchError}</p>}
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

      {bookLabs.length > 0 && (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <IconFlask className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-xs font-bold text-[var(--color-heading)] uppercase tracking-wide">
                Real-world labs for this book
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-dim)] mb-3">
              Not simulations — real code running live in your browser, putting this book's concepts to
              work: cracking real ciphertext, hashing real evidence, running a real SQL injection against a
              real database.
            </p>
            <div className="flex flex-wrap gap-2">
              {bookLabs.map((lab) => (
                <Link
                  key={lab.id}
                  to={`/code-task/${lab.id}`}
                  className="pill bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {lab.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0" style={{ minHeight: '80vh' }}>
        <PdfViewer
          ref={viewerRef}
          url={fileUrl}
          onPageChange={(page, total) => {
            setCurrentPage(page);
            setNumPagesLoaded(total);
          }}
        />
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

      <AiReadingCompanion key={book.id} bookTitle={book.title} currentPage={currentPage} viewerRef={viewerRef} />
    </div>
  );
}
