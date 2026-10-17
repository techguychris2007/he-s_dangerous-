import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BOOKS, booksInTrack, type Book, type BookTrack } from '../data/books';
import Logo from '../components/layout/Logo';
import { IconBook, IconCheck, IconDownload, IconExternal, IconSearch, IconX } from '../components/layout/icons';

type OfflineBookStatus = 'checking' | 'ready' | 'saving' | 'saved' | 'removing' | 'error' | 'unsupported';

const LANGUAGE_LABEL: Record<string, string> = {
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript',
  rust: 'Rust',
};

const TABS: { value: BookTrack; label: string; blurb: string }[] = [
  {
    value: 'security',
    label: 'Cybersecurity',
    blurb:
      'A guided, self-teaching path — start at #1 and work down, in six stages: get the vocabulary and ' +
      'risk mental models right, learn how organizations govern and plan for risk, harden real systems and ' +
      'networks, learn to find and exploit real vulnerabilities the way a working penetration tester does, ' +
      'then learn how the other side traces and responds to a breach, and finish with advanced, specialized ' +
      'engineering topics.',
  },
  {
    value: 'programming',
    label: 'Programming',
    blurb: 'One respected, free introductory book per language — read in any order.',
  },
];

const STAGE_BLURB: Record<string, string> = {
  'Foundations': 'The vocabulary, risk mental model, and cryptography/identity fundamentals every later book assumes.',
  'Governance & Risk Management':
    'How organizations actually decide what to protect and how much risk is acceptable — assessing risk, ' +
    'running it through a formal framework, and selecting from a master catalog of controls.',
  'Network & Systems Hardening':
    'The hands-on defensive work of locking down what you already run — firewalls, servers, wireless, ' +
    'key management, and the logging that makes all of it visible.',
  'Offensive Testing & Ethical Hacking':
    'Hands-on: how real penetration tests are planned and run, and the concrete, numbered techniques for finding ' +
    'real vulnerabilities in real web apps and mobile apps.',
  'Response & Forensics': 'The other side of the same coin — how a real breach gets traced, contained, and recovered from.',
  'Advanced & Specialized Security Engineering':
    'Capstone topics for going deeper: industrial control systems, zero trust architecture, configuration ' +
    'management, secure-by-design systems engineering, secure software development, and a real reference ' +
    'architecture for ransomware defense.',
};

function groupByStage(books: Book[]): { stage: string | undefined; books: Book[] }[] {
  const groups: { stage: string | undefined; books: Book[] }[] = [];
  for (const book of books) {
    const last = groups[groups.length - 1];
    if (last && last.stage === book.stage) {
      last.books.push(book);
    } else {
      groups.push({ stage: book.stage, books: [book] });
    }
  }
  return groups;
}

export default function LibraryPage() {
  const [params, setParams] = useSearchParams();
  const [offlineStates, setOfflineStates] = useState<Record<string, OfflineBookStatus>>({});
  const [online, setOnline] = useState(() => navigator.onLine);
  const track: BookTrack = params.get('track') === 'programming' ? 'programming' : 'security';
  const search = params.get('q') ?? '';
  const setTrack = (value: BookTrack) => setParams(previous => {
    const next = new URLSearchParams(previous);
    next.set('track', value);
    next.delete('q');
    return next;
  });
  const setSearch = (value: string) => setParams(previous => {
    const next = new URLSearchParams(previous);
    if (value) next.set('q', value); else next.delete('q');
    return next;
  }, { replace: true });
  const books = booksInTrack(track);
  const activeTab = TABS.find((t) => t.value === track)!;
  const cachedBooks = books.filter((book) => Boolean(book.filename)).length;
  const externalBooks = books.length - cachedBooks;
  const searchText = search.trim().toLowerCase();
  const visibleBooks = useMemo(
    () =>
      books.filter((book) => {
        if (!searchText) return true;
        const haystack = `${book.title} ${book.subtitle} ${book.author} ${book.stage ?? ''} ${book.language ?? ''} ${book.description}`.toLowerCase();
        return haystack.includes(searchText);
      }),
    [books, searchText],
  );
  const stageGroups = track === 'security' ? groupByStage(visibleBooks) : [{ stage: undefined, books: visibleBooks }];
  const savedOfflineCount = books.filter((book) => offlineStates[book.id] === 'saved').length;

  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    let cancelled = false;
    const pdfBooks = BOOKS.filter((book) => Boolean(book.filename));
    if (!('caches' in window)) {
      setOfflineStates(Object.fromEntries(pdfBooks.map((book) => [book.id, 'unsupported' as const])));
      return () => {
        cancelled = true;
        window.removeEventListener('online', updateNetwork);
        window.removeEventListener('offline', updateNetwork);
      };
    }
    void caches.open('dw-books-offline-v1').then(async (cache) => {
      const entries = await Promise.all(pdfBooks.map(async (book) => {
        const url = new URL('/books/' + book.filename, window.location.href);
        return [book.id, await cache.match(url) ? 'saved' : 'ready'] as const;
      }));
      if (!cancelled) setOfflineStates(Object.fromEntries(entries) as Record<string, OfflineBookStatus>);
    }).catch(() => {
      if (!cancelled) setOfflineStates(Object.fromEntries(pdfBooks.map((book) => [book.id, 'ready' as const])));
    });
    return () => {
      cancelled = true;
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
    };
  }, []);

  const saveBookOffline = async (book: Book) => {
    if (!book.filename) return;
    if (!('caches' in window)) {
      setOfflineStates((current) => ({ ...current, [book.id]: 'unsupported' }));
      return;
    }
    if (!online) {
      setOfflineStates((current) => ({ ...current, [book.id]: 'error' }));
      return;
    }
    setOfflineStates((current) => ({ ...current, [book.id]: 'saving' }));
    try {
      const url = '/books/' + book.filename;
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok || response.status !== 200 || !response.headers.get('content-type')?.toLowerCase().includes('pdf')) {
        throw new Error('The PDF could not be stored.');
      }
      const cache = await caches.open('dw-books-offline-v1');
      await cache.put(new URL(url, window.location.href), response.clone());
      setOfflineStates((current) => ({ ...current, [book.id]: 'saved' }));
    } catch {
      setOfflineStates((current) => ({ ...current, [book.id]: 'error' }));
    }
  };

  const removeBookOffline = async (book: Book) => {
    if (!book.filename || !('caches' in window)) return;
    setOfflineStates((current) => ({ ...current, [book.id]: 'removing' }));
    try {
      const cache = await caches.open('dw-books-offline-v1');
      await cache.delete(new URL('/books/' + book.filename, window.location.href));
      setOfflineStates((current) => ({ ...current, [book.id]: 'ready' }));
    } catch {
      setOfflineStates((current) => ({ ...current, [book.id]: 'error' }));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div
        className="portal-masthead relative overflow-hidden border-b border-[var(--color-border)]"
        style={{ background: 'var(--color-navy)' }}
      >
<div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-2">
            <Link to="/code-portal" className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
              <Logo className="w-6 h-6" />
              &larr; Back to Code Portal
            </Link>
            <span className="pill bg-white/10 text-white/80 border border-white/20">Standalone Portal</span>
          </div>
          <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-2 sm:mb-3">
            Free, Legally Open Books
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.05em] text-white mb-2 sm:mb-3">Library</h1>
          <p className="text-white/75 text-sm sm:text-base max-w-3xl leading-7">
            {BOOKS.length} books, curated the same way: every one is either a U.S. government work (public
            domain) or released under a license that explicitly permits free copying — see the license
            badge on each. Titles with an in-library PDF open in the reader; choose which PDFs to save on
            this device for offline reading. Books without a distributable PDF show their license, source,
            and official reading option before opening the publisher's site.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-black text-white">{books.length}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/55">This shelf</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-black text-white">{cachedBooks}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/55">In-library PDFs</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-black text-white">{savedOfflineCount}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/55">Saved on device</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-black text-white">{externalBooks}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/55">Official sources</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="premium-card rounded-3xl p-4 sm:p-5 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setTrack(tab.value);
                    }}
                    aria-pressed={track === tab.value}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                      track === tab.value
                        ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-[var(--color-text-dim)] max-w-2xl leading-6">{activeTab.blurb}</p>
            </div>
            <div className="relative w-full lg:w-80">
              <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, topic, author..."
                aria-label="Search library"
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-heading)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-[var(--color-accent)]/70 focus:ring-4 focus:ring-[var(--color-accent)]/10 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear library search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface-2)]"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {visibleBooks.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-text-dim)]">
            No books match &ldquo;{search}&rdquo;.<button onClick={() => setSearch('')} className="mt-3 block mx-auto font-semibold text-[var(--color-accent-dim)] underline">Clear search</button>
          </div>
        )}
        {stageGroups.map((group, groupIndex) => (
          <div key={group.stage ?? groupIndex} className={groupIndex > 0 ? 'mt-10' : ''}>
            {group.stage && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold shrink-0">
                    {groupByStage(books).findIndex(item => item.stage === group.stage) + 1}
                  </span>
                  <h2 className="text-base font-bold text-[var(--color-heading)]">{group.stage}</h2>
                </div>
                <p className="text-xs text-[var(--color-text-dim)] max-w-2xl">{STAGE_BLURB[group.stage]}</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-5">
              {group.books.map((book) => {
                const isExternal = !book.filename;
                const cardContent = (
                  <>
                    <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                      {track === 'security' && (
                        <span className="pill bg-[var(--color-heading)] text-[var(--color-bg)] font-bold">#{book.order}</span>
                      )}
                      {book.language && (
                        <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                          {LANGUAGE_LABEL[book.language]}
                        </span>
                      )}
                      <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{book.license}</span>
                      {isExternal && (
                        <span className="pill bg-[var(--color-warn)]/15 text-[var(--color-warn)] border border-[var(--color-warn)]/30 flex items-center gap-1">
                          <IconExternal className="w-3 h-3" /> Official source
                        </span>
                      )}
                      {!isExternal && (
                        <span className="pill bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30 flex items-center gap-1">
                          <IconBook className="w-3 h-3" /> In-library PDF
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center shrink-0 shadow-inner">
                        <IconBook className="w-5 h-5 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <div className="font-black tracking-[-0.02em] text-[var(--color-heading)] group-hover:text-[var(--color-accent-dim)] transition-colors">
                          {book.title}
                        </div>
                        <div className="text-xs text-[var(--color-text-dim)] mb-1 leading-5">{book.subtitle}</div>
                        <div
                          className="text-xs font-mono text-[var(--color-text-dim)]"
                          dangerouslySetInnerHTML={{ __html: book.author }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-[var(--color-text-dim)] leading-6 mt-4">{book.description}</p>
                    <div className="text-xs font-bold text-[var(--color-accent)] mt-4 flex items-center gap-1">
                      {isExternal ? (
                        <>
                          View source details &rarr;
                        </>
                      ) : (
                        <>Read in portal &rarr;</>
                      )}
                    </div>
                  </>
                );
                const saveState = offlineStates[book.id] ?? 'checking';
                return (
                  <article key={book.id} className="group premium-card premium-card-hover flex flex-col rounded-3xl p-5">
                    <Link to={`/library/${book.id}`} className="block flex-1">
                      {cardContent}
                    </Link>
                    {!isExternal && (
                      <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            saveState === 'saved' ? 'text-[var(--color-success)]' : 'text-[var(--color-text-dim)]'
                          }`}>
                            {saveState === 'saved' ? <IconCheck className="h-3.5 w-3.5" /> : <IconDownload className="h-3.5 w-3.5" />}
                            {saveState === 'checking' ? 'Checking device storage…' : saveState === 'saved' ? 'Available offline' : saveState === 'saving' ? 'Saving PDF…' : saveState === 'removing' ? 'Removing saved copy…' : saveState === 'unsupported' ? 'Offline storage unavailable' : `${book.fileSizeMb} MB PDF`}
                          </span>
                          <button
                            type="button"
                            onClick={() => void (saveState === 'saved' ? removeBookOffline(book) : saveBookOffline(book))}
                            disabled={saveState === 'checking' || saveState === 'saving' || saveState === 'removing' || saveState === 'unsupported' || (!online && saveState !== 'saved')}
                            aria-label={saveState === 'saved' ? `Remove ${book.title} from offline storage` : `Save ${book.title} for offline reading`}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] transition hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            {saveState === 'saved' ? 'Remove offline' : saveState === 'saving' ? 'Saving…' : saveState === 'removing' ? 'Removing…' : saveState === 'error' ? 'Retry save' : 'Save offline'}
                          </button>
                        </div>
                        {saveState === 'error' && (
                          <p role="status" className="mt-2 text-xs leading-5 text-[var(--color-warn)]">
                            {online ? 'The PDF could not be stored. Check available device storage and retry.' : 'Connect to the internet once to save this PDF for offline reading.'}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
