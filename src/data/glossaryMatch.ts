import { GLOSSARY, type GlossaryEntry } from './glossary';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One compiled pattern per entry: all spellings, with letter/digit boundaries on both sides. */
const COMPILED = GLOSSARY.map((entry) => {
  const spellings = [entry.term, ...(entry.match ?? [])].sort((a, b) => b.length - a.length).map(escape);
  return { entry, re: new RegExp(`(?<![A-Za-z0-9])(?:${spellings.join('|')})(?![A-Za-z0-9])`, entry.cs ? '' : 'i') };
});

/** Glossary entries used in `text`, in order of first appearance. Domain-scoped entries (e.g. ML)
 *  only match when their domain is in `domains`, so common ML words like "model" don't show their ML
 *  definition on security lessons. `exclude` drops terms the content already defines itself. */
export function findGlossaryTerms(text: string, exclude: string[] = [], limit = 8, domains: string[] = []): GlossaryEntry[] {
  const skip = new Set(exclude.map((t) => t.toLowerCase()));
  const hits: { entry: GlossaryEntry; at: number }[] = [];
  for (const { entry, re } of COMPILED) {
    if (entry.domain && !domains.includes(entry.domain)) continue;
    if ([entry.term, ...(entry.match ?? [])].some((t) => skip.has(t.toLowerCase()))) continue;
    const m = re.exec(text);
    if (m) hits.push({ entry, at: m.index });
  }
  return hits.sort((a, b) => a.at - b.at).slice(0, limit).map((h) => h.entry);
}
