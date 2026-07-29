import { Navigate, useParams, Link } from 'react-router-dom';
import { findBook } from '../data/books';
import PdfViewer from '../components/books/PdfViewer';
import { IconExternal } from '../components/layout/icons';

export default function BookReaderPage() {
  const { bookId } = useParams();
  const book = bookId ? findBook(bookId) : undefined;

  if (!book) return <Navigate to="/library" replace />;

  const fileUrl = `/books/${book.filename}`;

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
      </div>

      <div className="flex-1 min-h-0" style={{ minHeight: '80vh' }}>
        <PdfViewer url={fileUrl} />
      </div>
    </div>
  );
}
