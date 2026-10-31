/** Deterministic, extractive search. No generated explanations or fabricated references. */
export interface LibraryPassage {
  bookId: string;
  title: string;
  page: number;
  text: string;
}
const STOP = new Set('a an the is are was were be been being to of for in on at and or with from by as it its this that these those i me my you your we our what why how when where which who please explain understand help about can could would should does do did give show tell lesson concept lab testing level hint example simpler terms practical question check understanding context idea research plain real analogy page book summarize summary takeaways key'.split(' '));
const SYNONYMS: Record<string, string[]> = {
  ssh: ['secure', 'shell'], dns: ['domain', 'name'], tcp: ['transmission', 'control'],
  acl: ['access', 'control'], ml: ['machine', 'learning'], ai: ['artificial', 'intelligence'],
  overfitting: ['overfit', 'generalization'], permissions: ['permission'], debugging: ['debug', 'bug'],
  encryption: ['encrypt', 'cipher'], authentication: ['authenticate', 'identity'],
  recursion: ['recursive'],
};
export function queryTerms(text: string): string[] {
  return [...new Set((text.toLowerCase().match(/[a-z][a-z0-9+#.-]*/g) ?? []).filter(t => t.length > 1 && !STOP.has(t)))].slice(0, 24);
}
export function pagePassages(bookId: string, title: string, page: number, text: string): LibraryPassage[] {
  const lines = text.replace(/\r/g, '').split('\n').map(line => line.trimEnd());
  const chunks: LibraryPassage[] = [];
  let buffer: string[] = [];
  let words = 0;
  const flush = () => {
    const content = buffer.join('\n').trim();
    if (content.length >= 100 && /[a-z]{3}/i.test(content)) chunks.push({ bookId, title, page, text: content });
    buffer = []; words = 0;
  };
  for (const line of lines) {
    const count = line.trim().split(/\s+/).length;
    if (words + count > 190 && words > 0) flush();
    buffer.push(line); words += count;
  }
  flush();
  return chunks;
}
export function rankPassages(question: string, passages: LibraryPassage[]): LibraryPassage[] {
  const terms = queryTerms(question);
  if (!terms.length) return [];
  const expanded = new Set(terms.flatMap(term => SYNONYMS[term] ?? []));
  const documents = passages.filter(p => {
    const lines = p.text.split('\n').filter(line => line.trim());
    // Dot leaders and dense page-number listings are navigation, not explanations.
    const listingLines = lines.filter(line => /(?:\.\s*){4,}/.test(line) || /(?:\b\d{1,4},?\s+){3,}\d{1,4}\s*$/.test(line));
    return listingLines.length / Math.max(1, lines.length) < .25;
  }).map(p => {
    const tokens = p.text.toLowerCase().match(/[a-z][a-z0-9+#.-]*/g) ?? [];
    const frequencies = new Map<string, number>();
    for (const word of tokens) frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
    return { p, frequencies, length: tokens.length };
  });
  const average = documents.reduce((sum, doc) => sum + doc.length, 0) / Math.max(1, documents.length);
  const allTerms = [...new Set([...terms, ...expanded])];
  const df = new Map(allTerms.map(term => [term, documents.filter(doc => doc.frequencies.has(term)).length]));
  const results = documents.map(doc => {
    const matched = terms.filter(t => doc.frequencies.has(t));
    const synonymHits = [...expanded].filter(t => doc.frequencies.has(t));
    // Several unrelated high-frequency words are not evidence of a useful passage.
    const coverage = matched.length / terms.length;
    const expandedOnly = terms.length === 1 && synonymHits.length >= 2;
    if ((!matched.length && !expandedOnly) || (terms.length > 2 && coverage < .45)) return { p: doc.p, score: 0 };
    let score = 0;
    for (const term of [...matched, ...synonymHits]) {
      const tf = doc.frequencies.get(term) ?? 0;
      const count = df.get(term) ?? 0;
      const idf = Math.log(1 + (documents.length - count + .5) / (count + .5));
      score += idf * (tf * 2.2 / (tf + 1.2 * (.25 + .75 * doc.length / Math.max(1, average)))) * (terms.includes(term) ? 1 : .25);
    }
    const headingMatch = terms.some(term => doc.p.text.slice(0, 100).toLowerCase().includes(term));
    return { p: doc.p, score: score * (expandedOnly ? .5 : coverage) * (headingMatch ? 1.2 : 1) };
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  return results.filter(result => {
    const key = `${result.p.bookId}:${result.p.page}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 3).map(result => result.p);
}
