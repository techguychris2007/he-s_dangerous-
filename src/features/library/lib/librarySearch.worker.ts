import { indexPassages, rankIndexed, type LibraryIndex, type LibraryPassage } from './librarySearch';
// The index lives as long as this worker, so after the first question each search only scores pages.
let index: LibraryIndex | undefined;
let indexKey = '';
self.onmessage = (event: MessageEvent<{ id: number; key: string; question: string; passages?: LibraryPassage[] }>) => {
  const { id, key, question, passages } = event.data;
  try {
    if (passages) { index = indexPassages(passages); indexKey = key; }
    if (!index || indexKey !== key) { self.postMessage({ id, needsPassages: true }); return; }
    self.postMessage({ id, results: rankIndexed(question, index) });
  }
  catch { self.postMessage({ id, error: 'The saved library could not be searched. Repair its indexes while online.' }); }
};
