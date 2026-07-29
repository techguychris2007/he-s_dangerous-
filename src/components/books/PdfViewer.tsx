import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

const SCALE = 1.4;

export interface PdfViewerHandle {
  scrollToPage: (pageNum: number) => void;
  /** Real extracted text for one page — used by search and read-aloud. Never an approximation. */
  getPageText: (pageNum: number) => Promise<string>;
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
    await page.render({ canvas, canvasContext: context, viewport: renderViewport }).promise;
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
      { root: containerRef.current, rootMargin: '800px 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const el of pageElsRef.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, numPages]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToPage: (pageNum: number) => {
        pageElsRef.current[pageNum - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      getPageText: async (pageNum: number) => {
        if (!docRef.current) return '';
        const page = await docRef.current.getPage(pageNum);
        const content = await page.getTextContent();
        return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      },
      numPages,
    }),
    [numPages],
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
        <div className="py-2 text-center text-xs font-mono text-[var(--color-text-dim)] border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          Page {currentPage} / {numPages}
        </div>
      )}
    </div>
  );
});

export default PdfViewer;
