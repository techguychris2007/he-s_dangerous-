import * as pdfjs from 'pdfjs-dist';
import { pagePassages, type LibraryPassage } from './librarySearch';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

export async function extractLibraryPdf(data: Uint8Array, bookId: string, title: string, signal: AbortSignal, onPage: (page: number, total: number) => void): Promise<LibraryPassage[]> {
  const loading = pdfjs.getDocument({ data });
  const abort = () => { void loading.destroy(); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    signal.throwIfAborted();
    const doc = await loading.promise;
    const passages: LibraryPassage[] = [];
    for (let page = 1; page <= doc.numPages; page++) {
      signal.throwIfAborted();
      const pdfPage = await doc.getPage(page);
      const content = await pdfPage.getTextContent();
      let text = '';
      for (const item of content.items) {
        if ('str' in item) text += item.str + (item.hasEOL ? '\n' : ' ');
      }
      passages.push(...pagePassages(bookId, title, page, text));
      pdfPage.cleanup();
      onPage(page, doc.numPages);
      // PDF parsing already uses PDF.js's worker. Yield between pages to keep editors responsive.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (!passages.length) throw new Error('This PDF has no readable text. Image-only books are not supported for offline search.');
    return passages;
  } finally {
    signal.removeEventListener('abort', abort);
    await loading.destroy();
  }
}
