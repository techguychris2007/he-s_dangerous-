import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

interface PdfViewerProps {
  url: string;
}

/** Renders a PDF page-by-page onto a canvas with pdf.js, entirely under our own control — unlike
 *  an <iframe src="*.pdf">, this never depends on the visitor's browser being configured to open
 *  PDFs inline instead of downloading them, so reading always happens on this page. */
export default function PdfViewer({ url }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPageNum(1);
    const loadingTask = pdfjsLib.getDocument({ url });
    loadingTask.promise
      .then((doc) => {
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (status !== 'ready' || !docRef.current || !canvasRef.current) return;
    let cancelled = false;
    docRef.current.getPage(pageNum).then((page) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const viewport = page.getViewport({ scale: 1.4 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (!context) return;
      page.render({ canvas, canvasContext: context, viewport });
    });
    return () => {
      cancelled = true;
    };
  }, [status, pageNum]);

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[var(--color-danger)] p-10">
        Could not load this PDF. Try the download button instead.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex-1 w-full overflow-auto flex justify-center py-6 bg-[var(--color-surface-2)]">
        {status === 'loading' ? (
          <div className="text-sm text-[var(--color-text-dim)] py-10">Loading book&hellip;</div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg rounded" />
        )}
      </div>
      {status === 'ready' && (
        <div className="flex items-center gap-4 py-3 border-t border-[var(--color-border)] w-full justify-center bg-[var(--color-surface)]">
          <button
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition-colors"
          >
            &larr; Prev
          </button>
          <span className="text-sm font-mono text-[var(--color-text-dim)]">
            Page {pageNum} / {numPages}
          </span>
          <button
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-2)] transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
