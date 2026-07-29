import { Link } from 'react-router-dom';
import { BOOKS } from '../data/books';
import Logo from '../components/layout/Logo';
import { IconBook } from '../components/layout/icons';

const LANGUAGE_LABEL: Record<string, string> = {
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript',
};

export default function LibraryPage() {
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
            Free, Legally Open Programming Books
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Library</h1>
          <p className="text-white/70 max-w-2xl leading-relaxed">
            {BOOKS.length} complete books, cached here as their exact original PDFs — read them right in
            this page, or download a copy to your device. No account or external site required. Every book
            is released under a Creative Commons license that explicitly permits free copying;
            attribution and a link to support each author is on every reader page.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        <div className="grid sm:grid-cols-2 gap-5">
          {BOOKS.map((book) => (
            <Link
              key={book.id}
              to={`/library/${book.id}`}
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <span className="pill bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
                  {LANGUAGE_LABEL[book.language]}
                </span>
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
    </div>
  );
}
