import { queryTerms, type LibraryPassage } from './librarySearch';

export interface LibraryTurn { role: 'user' | 'assistant'; content: string }
export interface LibraryQuestionContext { title?: string; text?: string; page?: number; history?: LibraryTurn[] }

/** Resolve short follow-ups against the last question, without carrying an old topic into a new one. */
export function resolveLibraryQuestion(question: string, context: LibraryQuestionContext = {}): string {
  const q = question.trim().slice(0, 1800);
  const users = context.history?.filter(turn => turn.role === 'user') ?? [];
  const previous = [...users].reverse().find(turn => !/\b(it|its|they|them|that|those|this)\b/i.test(turn.content) && queryTerms(turn.content).length)?.content ?? users.at(-1)?.content;
  const followUp = /\b(it|its|they|them|that|those|this|one|another|simpler|more detail|another example)\b/i.test(q);
  const generic = !queryTerms(q).length;
  const subject = previous && (followUp || generic) ? previous.slice(0, 500) : context.title;
  return subject && (followUp || generic) ? `${q}\nTopic: ${subject}` : q;
}

/** Compact source wording, retaining complete sentences; never invent an explanation. */
export function sourceAnswer(question: string, passages: LibraryPassage[]): { answer: string; sources: LibraryPassage[] } {
  if (!passages.length) return { answer: 'I couldn’t find an answer in your prepared books. Which topic or book do you mean?', sources: [] };
  const terms = queryTerms(question);
  const candidates = passages.flatMap((source, sourceIndex) => {
    const text = source.text.replace(/([a-z])-\s*\n\s*([a-z])/gi, '$1$2').replace(/\s+/g, ' ').trim();
    const sentences = text.match(/[^.!?]+(?:[.!?](?=\s|$)|$)/g) ?? [text];
    return sentences.map((sentence, index) => ({ source, sentence: sentence.trim(), index, sourceIndex, score: terms.filter(term => sentence.toLowerCase().includes(term)).length }));
  }).filter(item => item.sentence.length >= 35 && item.sentence.length <= 650 && item.score > 0);
  candidates.sort((a, b) => b.score - a.score || a.sourceIndex - b.sourceIndex || a.index - b.index);
  const picked = candidates.slice(0, /\b(compare|difference|versus|vs)\b/i.test(question) ? 3 : 2);
  if (!picked.length) return { answer: 'I found related material, but no clear answer to that question. Could you rephrase it?', sources: passages.slice(0, 1) };
  const unique = picked.filter((item, i, all) => all.findIndex(other => other.sentence === item.sentence) === i);
  return { answer: unique.map(item => item.sentence).join('\n\n'), sources: [...new Set(unique.map(item => item.source))] };
}

export function supportedSpan(answer: string, score: number, passage: LibraryPassage): boolean {
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();
  return score >= .3 && answer.trim().length >= 3 && answer.length <= 700 && normalize(passage.text).includes(normalize(answer));
}

/** Give the neural reader a self-contained follow-up rather than two competing questions. */
export function readerQuestion(question: string): string {
  const [current, previous] = question.split('\nTopic:');
  if (!previous) return current;
  const subject = previous.trim().replace(/^(?:what (?:is|are)|explain|tell me about)\s+/i, '').replace(/[?.!]$/, '').trim();
  if (/\b(it|this|that|they|them)\b/i.test(current)) return current.replace(/\b(it|this|that|they|them)\b/gi, subject);
  return `${current.replace(/[?!.]$/, '')} about ${subject}?`;
}
