import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKS, booksInTrack, type Book, type BookTrack } from '../data/books';
import Logo from '../components/layout/Logo';
import { IconBook } from '../components/layout/icons';

const LANGUAGE_LABEL: Record<string, string> = {
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript',
};

const TABS: { value: BookTrack; label: string; blurb: string }[] = [
  {
    value: 'security',
    label: 'Cybersecurity',
    blurb:
      'A guided, self-teaching path — start at #1 and work down, in three phases: get the vocabulary ' +
      'and mental models right, then learn to actually find and exploit real vulnerabilities the way a ' +
      'working penetration tester does, then learn how the other side traces and responds to it.',
  },
  {
    value: 'programming',
    label: 'Programming',
    blurb: 'One respected, free introductory book per language — read in any order.',
  },
];

const STAGE_BLURB: Record<string, string> = {
  'Foundations': 'The vocabulary, risk mental model, and cryptography/identity fundamentals every later book assumes.',
  'Offensive Testing & Ethical Hacking':
    'Hands-on: how real penetration tests are planned and run, and the concrete, numbered techniques for finding ' +
    'real vulnerabilities in real web apps and mobile apps.',
  'Response & Forensics': 'The other side of the same coin — how a real breach gets traced, contained, and recovered from.',
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
  const [track, setTrack] = useState<BookTrack>('security');
  const books = booksInTrack(track);
  const activeTab = TABS.find((t) => t.value === track)!;
  const stageGroups = track === 'security' ? groupByStage(books) : [{ stage: undefined, books }];

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
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <Link to="/code-portal" className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
              <Logo className="w-6 h-6" />
              &larr; Back to Code Portal
            </Link>
            <span className="pill bg-white/10 text-white/80 border border-white/20">Standalone Portal</span>
          </div>
          <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-3">
            Free, Legally Open Books
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Library</h1>
          <p className="text-white/70 max-w-2xl leading-relaxed">
            {BOOKS.length} complete books, cached here as their exact original PDFs — read them right in
            this page, or download a copy to your device. No account or external site required. Every book
            is either a U.S. government work (public domain) or released under a Creative Commons license
            that explicitly permits free copying — see the license badge on each book for details.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        <div className="flex flex-wrap gap-2 mb-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTrack(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                track === tab.value
                  ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-heading)] hover:border-[var(--color-accent)]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-[var(--color-text-dim)] mb-6 max-w-2xl">{activeTab.blurb}</p>

        {stageGroups.map((group, groupIndex) => (
          <div key={group.stage ?? groupIndex} className={groupIndex > 0 ? 'mt-10' : ''}>
            {group.stage && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-xs font-bold shrink-0">
                    {groupIndex + 1}
                  </span>
                  <h2 className="text-base font-bold text-[var(--color-heading)]">{group.stage}</h2>
                </div>
                <p className="text-xs text-[var(--color-text-dim)] max-w-2xl">{STAGE_BLURB[group.stage]}</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-5">
              {group.books.map((book) => (
                <Link
                  key={book.id}
                  to={`/library/${book.id}`}
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {track === 'security' && (
                      <span className="pill bg-[var(--color-heading)] text-[var(--color-bg)] font-bold">#{book.order}</span>
                    )}
                    {book.language && (
                      <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                        {LANGUAGE_LABEL[book.language]}
                      </span>
                    )}
                    <span className="pill bg-[var(--color-surface-2)] text-[var(--color-text-dim)]">{book.license}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                      <IconBook className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-heading)] group-hover:text-[var(--color-accent-dim)] transition-colors">
                        {book.title}
                      </div>
                      <div className="text-xs text-[var(--color-text-dim)] mb-1">{book.subtitle}</div>
                      <div
                        className="text-xs font-mono text-[var(--color-text-dim)]"
                        dangerouslySetInnerHTML={{ __html: book.author }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mt-3">{book.description}</p>
                  <div className="text-xs font-semibold text-[var(--color-accent)] mt-3">Read in portal &rarr;</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
