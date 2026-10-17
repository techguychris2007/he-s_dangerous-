import type { SiemEntry } from './siemTypes';

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const aliases: Record<string, string[]> = {
  userprincipalname: ['user', 'userprincipalname'],
  'target.event_type': ['eventtype'],
  'metadata.event_type': ['eventtype'],
  'event.category': ['eventtype', 'category'],
};

/** Bounded record filtering for the offline consoles. This does not execute
 * SPL stats, KQL joins or AQL aggregation; reporting pipelines are display only. */
export function matchesRecordQuery(entry: SiemEntry | string, query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  const line = typeof entry === 'string' ? entry : entry.line;
  const metadata = typeof entry === 'string' ? {} : { timestamp: entry.timestamp, severity: entry.severity, eventtype: entry.eventType };
  const text = `${Object.values(metadata).filter(Boolean).join(' ')} ${line}`.toLowerCase();
  if (!/[=|]/.test(q) && text.includes(q.toLowerCase())) return true;
  // Regex must be explicitly delimited; a query pipeline must not turn into
  // regex alternation, and a malformed expression must not match everything.
  if (/^\/.+\/[i]?$/.test(q)) {
    try { return new RegExp(q.slice(1, q.lastIndexOf('/')), 'i').test(text); } catch { return false; }
  }
  const parts = q.split(/\|(?!\|)/);
  let filter = parts[0].replace(/^search\s+/i, '').trim();
  const where = parts.slice(1).filter(part => /^\s*where\s+/i.test(part)).map(part => part.replace(/^\s*where\s+/i, ''));
  // Table names address the selected training dataset; where clauses filter it.
  if (where.length) filter = [parts[0].match(/^[\w]+$/) ? '' : filter, ...where].filter(Boolean).join(' AND ');
  if (!filter) return false;
  if (/\s+OR\s+/i.test(filter)) return filter.split(/\s+OR\s+/i).some(clause => matchesRecordQuery(entry, clause));
  const fields = new Map<string, string[]>();
  const add = (key: string, value: string) => fields.set(key.toLowerCase(), [...(fields.get(key.toLowerCase()) ?? []), value.toLowerCase()]);
  for (const [key, value] of Object.entries(metadata)) if (value) add(key, value);
  for (const match of line.matchAll(/([\w.]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s&]+))/g)) add(match[1], match[2] ?? match[3] ?? match[4]);
  try {
    const parsed: unknown = JSON.parse(line);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) for (const [key, value] of Object.entries(parsed)) if (typeof value === 'string' || typeof value === 'number') add(key, String(value));
  } catch { /* Most fixtures use key=value text rather than JSON. */ }
  let hasCondition = false;
  let failed = false;
  let remaining = filter.replace(/([\w.]+)\s*(==|=~|=|:)\s*(?:"([^"]*)"|'([^']*)'|([^\s|()]+))/g, (_, field: string, operator: string, quoted: string, single: string, bare: string) => {
    hasCondition = true;
    const expected = (quoted ?? single ?? bare).toLowerCase();
    const keys = aliases[field.toLowerCase()] ?? [field.toLowerCase()];
    const values = keys.flatMap(key => fields.get(key) ?? []);
    const matches = operator === '=~'
      ? values.some(value => { try { return new RegExp(expected, 'i').test(value); } catch { return false; } })
      : values.some(value => new RegExp(`^${expected.split('*').map(escape).join('.*')}$`, 'i').test(value));
    if (!matches) failed = true;
    return '';
  });
  if (failed) return false;
  remaining = remaining.replace(/\b(port|host)\s+([\w.:-]+)/gi, (_, kind: string, value: string) => {
    hasCondition = true;
    const pattern = kind.toLowerCase() === 'port' ? `(?:[.:]|port[= :]+)${escape(value)}(?:[ :]|$)` : `(?:^|[^0-9.])${escape(value)}(?:[^0-9.]|$)`;
    if (!new RegExp(pattern, 'i').test(text)) failed = true;
    return '';
  });
  if (failed) return false;
  remaining = remaining.replace(/\bAND\b/gi, '').trim();
  // Quoted phrases are conjunctive with field tests; a matching phrase alone
  // cannot override an incorrect host, account or event ID constraint.
  remaining = remaining.replace(/"([^"]+)"|'([^']+)'/g, (_, double: string, single: string) => {
    hasCondition = true;
    if (!text.includes((double ?? single).toLowerCase())) failed = true;
    return '';
  });
  if (failed) return false;
  const terms = remaining.split(/\s+/).filter(Boolean);
  return terms.length ? terms.every(term => text.includes(term.toLowerCase())) : hasCondition;
}
