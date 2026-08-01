import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

const SCALE = 1.4;

export interface PdfViewerHandle {
  scrollToPage: (pageNum: number) => void;
  /** Real extracted text for one page — used by search. Never an approximation. */
  getPageText: (pageNum: number) => Promise<string>;
  /** Same real extraction as getPageText, but grouped into lines by each text item's actual
   *  y-position on the page instead of flattened into one string. Read-aloud uses this (rather
   *  than getPageText) so it can tell a running header/page-number line apart from body text. */
  getPageLines: (pageNum: number) => Promise<string[]>;
  numPages: number;
}

interface PdfViewerProps {
  url: string;
  onPageChange?: (pageNum: number, numPages: number) => void;
}

/** Renders a whole PDF as a continuously-scrollable column of canvases with pdf.js — unlike an
 *  <iframe src="*.pdf">, this never depends on the visitor's browser being configured to open
 *  PDFs inline instead of downloading them. Pages are sized upfront from page 1's dimensions so
 *  the scrollbar doesn't jump around, but only actually rendered (drawn to canvas) once they
 *  scroll near the viewport — rendering all of a 400-page book's canvases eagerly would be slow
 *  and memory-heavy for no benefit. */
const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(function PdfViewer({ url, onPageChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const renderedRef = useRef<Set<number>>(new Set());
  const [numPages, setNumPages] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [editingPage, setEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setNumPages(0);
    setCurrentPage(1);
    renderedRef.current = new Set();
    pageElsRef.current = [];
    const loadingTask = pdfjsLib.getDocument({ url });
    loadingTask.promise
      .then(async (doc) => {
        if (cancelled) return;
        docRef.current = doc;
        const firstPage = await doc.getPage(1);
        if (cancelled) return;
        const viewport = firstPage.getViewport({ scale: SCALE });
        setPageSize({ width: viewport.width, height: viewport.height });
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

  const renderPage = async (index: number) => {
    if (renderedRef.current.has(index) || !docRef.current) return;
    renderedRef.current.add(index);
    const page = await docRef.current.getPage(index + 1);
    const canvas = pageElsRef.current[index]?.querySelector('canvas');
    if (!canvas) return;
    // Render at devicePixelRatio so text stays crisp on HiDPI/Retina displays — without this,
    // the canvas's backing pixel buffer matches CSS pixels 1:1 and the browser has to upscale
    // it for a >1x-density screen, which is exactly what reads as "blurry."
    const dpr = window.devicePixelRatio || 1;
    const cssViewport = page.getViewport({ scale: SCALE });
    const renderViewport = page.getViewport({ scale: SCALE * dpr });
    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;
    canvas.style.width = `${cssViewport.width}px`;
    canvas.style.height = `${cssViewport.height}px`;
    const context = canvas.getContext('2d');
    if (!context) return;
    try {
      await page.render({ canvas, canvasContext: context, viewport: renderViewport }).promise;
    } catch (err) {
      // pdf.js throws RenderingCancelledException by design when the owning document is destroyed
      // mid-render — which happens on every book switch while a page is still rendering (the `url`
      // effect above calls loadingTask.destroy() on cleanup). Expected, not a real error.
      if (!(err instanceof Error && err.name === 'RenderingCancelledException')) throw err;
    }
  };

  useEffect(() => {
    if (status !== 'ready' || !containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.pageIndex);
          if (entry.isIntersecting) {
            renderPage(index);
            if (entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio;
              bestIndex = index;
            }
          }
        }
        if (bestIndex >= 0) {
          setCurrentPage(bestIndex + 1);
          onPageChange?.(bestIndex + 1, numPages);
        }
      },
      // root: null (the browser viewport) — not containerRef.current. The container's CSS asks
      // for its own internal scrollbar (overflow-auto), but its parent chain doesn't actually
      // bound its height, so in practice the whole page/window scrolls, not this div. Using it
      // as the IntersectionObserver root silently broke page-position tracking: entries never
      // changed because the "root" scrolled along with everything else instead of clipping it.
      { root: null, rootMargin: '800px 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const el of pageElsRef.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, numPages]);

  const goToPage = useCallback(
    (pageNum: number) => {
      const clamped = Math.min(Math.max(1, Math.round(pageNum)), Math.max(1, numPages));
      pageElsRef.current[clamped - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [numPages],
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToPage: goToPage,
      getPageText: async (pageNum: number) => {
        if (!docRef.current) return '';
        const page = await docRef.current.getPage(pageNum);
        const content = await page.getTextContent();
        return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      },
      getPageLines: async (pageNum: number) => {
        if (!docRef.current) return [];
        const page = await docRef.current.getPage(pageNum);
        const content = await page.getTextContent();
        // Group text items into lines by their actual y-position on the page — items on the
        // same line share (nearly) the same baseline, so a new y means a new line.
        const lines: string[] = [];
        let currentY: number | null = null;
        let currentLine: string[] = [];
        const flush = () => {
          const text = currentLine.join(' ').replace(/\s+/g, ' ').trim();
          if (text) lines.push(text);
          currentLine = [];
        };
        for (const item of content.items) {
          if (!('str' in item)) continue;
          const y = item.transform[5];
          if (currentY !== null && Math.abs(y - currentY) > 2) flush();
          currentY = y;
          if (item.str) currentLine.push(item.str);
        }
        flush();
        return lines;
      },
      numPages,
    }),
    [numPages, goToPage],
  );

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[var(--color-danger)] p-10">
        Could not load this PDF. Try the download button instead.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={containerRef} className="flex-1 overflow-auto flex flex-col items-center gap-4 py-6 bg-[var(--color-surface-2)]">
        {status === 'loading' && <div className="text-sm text-[var(--color-text-dim)] py-10">Loading book&hellip;</div>}
        {status === 'ready' &&
          Array.from({ length: numPages }).map((_, index) => (
            <div
              key={index}
              ref={(el) => {
                pageElsRef.current[index] = el;
              }}
              data-page-index={index}
              className="shadow-lg rounded bg-white"
              style={{ width: pageSize.width, minHeight: pageSize.height }}
            >
              <canvas className="block" />
            </div>
          ))}
      </div>
      {status === 'ready' && (
        <div className="py-2 flex items-center justify-center gap-1.5 text-xs font-mono text-[var(--color-text-dim)] border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          Page{' '}
          {editingPage ? (
            <input
              type="number"
              min={1}
              max={numPages}
              autoFocus
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => setEditingPage(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  goToPage(Number(pageInput) || currentPage);
                  setEditingPage(false);
                } else if (e.key === 'Escape') {
                  setEditingPage(false);
                }
              }}
              className="w-14 text-center bg-[var(--color-surface-2)] border border-[var(--color-accent)] rounded px-1 py-0.5 text-[var(--color-text)]"
            />
          ) : (
            <button
              onClick={() => {
                setPageInput(String(currentPage));
                setEditingPage(true);
              }}
              className="underline decoration-dotted underline-offset-2 hover:text-[var(--color-accent)]"
              title="Click to jump to a page"
            >
              {currentPage}
            </button>
          )}{' '}
          / {numPages}
        </div>
      )}
    </div>
  );
});

export default PdfViewer;
