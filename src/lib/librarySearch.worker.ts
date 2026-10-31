import { rankPassages, type LibraryPassage } from './librarySearch';
self.onmessage = (event: MessageEvent<{ question: string; passages: LibraryPassage[] }>) => {
  try { self.postMessage({ results: rankPassages(event.data.question, event.data.passages) }); }
  catch { self.postMessage({ error: 'The saved library could not be searched. Repair its indexes while online.' }); }
};
