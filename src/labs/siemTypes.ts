import type { ObjectiveStep } from './types';

export type SiemTool =
  | 'suricata'
  | 'chronicle'
  | 'tcpdump'
  | 'splunk'
  | 'sentinel'
  | 'qradar'
  | 'elastic'
  | 'shodan'
  | 'sherlock'
  | 'maltego'
  | 'eyewitness'
  | 'theharvester';

/** A single raw record the analyst is investigating — an IDS alert, a UDM log event, or a packet line.
 *  The tool-specific console renders this generically; only the "line" text is ever pattern-matched. */
export interface SiemEntry {
  /** what actually gets searched/filtered against the analyst's query (case-insensitive substring or regex) */
  line: string;
  /** Suricata only: drives the severity badge color */
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  /** Chronicle only: short event-type label shown as a column/tag */
  eventType?: string;
  /** shared: an ISO-ish timestamp string shown as a column */
  timestamp?: string;
}

export interface SiemLabScenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tool: SiemTool;
  /** the label shown in the tool's header, e.g. "eve.json — 2,847 alerts (last 24h)" */
  datasetLabel: string;
  briefing: string;
  objectives: ObjectiveStep[];
  /** each hint is the exact query/filter string to type into the tool for that step */
  hints: string[];
  totalFlags: number;
  entries: SiemEntry[];
}

const FLAG_RE = /flag\{[^}]+\}/i;

const IGNORED_KEYWORDS = new Set([
  'select',
  '*',
  'from',
  'where',
  'and',
  'or',
  'in',
  'last',
  'hours',
  'minutes',
  'index',
  'sourcetype',
  'category',
  'event',
  'proto',
  'bpf',
  'filter',
  'tcpdump',
  '-r',
  '-n',
  '-i',
  'find',
  'search',
]);

/** Case-insensitive smart query match supporting BPF filters (port, host), SPL/KQL field matching,
 *  quotes, regex, and forgiving substring search across all entry properties. */
export function matchesQuery(entryOrLine: SiemEntry | string, query: string): boolean {
  const q = query.trim();
  if (!q) return false;

  const rawLine = typeof entryOrLine === 'string' ? entryOrLine : entryOrLine.line;
  const eventType = typeof entryOrLine === 'object' ? (entryOrLine.eventType ?? '') : '';
  const severity = typeof entryOrLine === 'object' ? (entryOrLine.severity ?? '') : '';
  const timestamp = typeof entryOrLine === 'object' ? (entryOrLine.timestamp ?? '') : '';
  const fullText = `${timestamp} ${severity} ${eventType} ${rawLine}`.toLowerCase();
  const lowerQ = q.toLowerCase();

  // 1. Exact or direct substring match across full text
  if (fullText.includes(lowerQ)) return true;

  // 2. Direct regex match on rawLine or fullText
  try {
    if (new RegExp(q, 'i').test(fullText)) return true;
  } catch {
    // ignore regex syntax error
  }

  // 3. Extract quoted strings or values: e.g. target.event_type = "SWIFT_TRANSFER" -> SWIFT_TRANSFER
  const quotedMatches = q.match(/"([^"]+)"|'([^']+)'/g);
  if (quotedMatches && quotedMatches.length > 0) {
    const allQuotedMatch = quotedMatches.every((quoted) => {
      const unquoted = quoted.slice(1, -1).toLowerCase();
      return fullText.includes(unquoted);
    });
    if (allQuotedMatch) return true;
  }

  // 4. Handle tool-specific BPF filters:
  // e.g. "port 53" or "port:53" or "port=53"
  const portMatch = q.match(/\bport[:=\s]+(\d+)\b/i);
  if (
    portMatch &&
    (fullText.includes(`.${portMatch[1]}:`) ||
      fullText.includes(`:${portMatch[1]}`) ||
      fullText.includes(`port ${portMatch[1]}`) ||
      fullText.includes(`port=${portMatch[1]}`))
  ) {
    return true;
  }

  // e.g. "host 185.220.101.47" -> check IP "185.220.101.47"
  const hostMatch = q.match(/\b(?:host|ip)[:=\s]+([0-9a-zA-Z.-]+)/i);
  if (hostMatch && fullText.includes(hostMatch[1].toLowerCase())) {
    return true;
  }

  // e.g. KQL / SPL / AQL field-value assignment: field = "value" or field: value or field == value or field=value
  const fieldValMatches = Array.from(q.matchAll(/([a-zA-Z0-9_.]+)\s*(?:==|=|:|=~)\s*["']?([^"'\s|]+)["']?/g));
  if (fieldValMatches.length > 0) {
    const allFieldValuesMatch = fieldValMatches.every(([, field, val]) => {
      const lowerVal = val.toLowerCase();
      const lowerField = field.toLowerCase();
      return fullText.includes(lowerVal) || fullText.includes(lowerField);
    });
    if (allFieldValuesMatch) return true;
  }

  // 5. Pipe commands (e.g. `sourcetype=auth "Failed password" | stats count by user`)
  if (q.includes('|')) {
    const beforePipe = q.split('|')[0].trim();
    if (beforePipe && matchesQuery(entryOrLine, beforePipe)) return true;
  }

  // 6. Token matching: split query into tokens (ignoring common SQL/KQL/SPL boilerplate keywords)
  const tokens = q
    .replace(/[=~:><;"'|()]/g, ' ')
    .split(/\s+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 1 && !IGNORED_KEYWORDS.has(t));

  if (tokens.length > 0 && tokens.every((token) => fullText.includes(token))) {
    return true;
  }

  return false;
}

export function extractFlag(line: string): string | null {
  const m = line.match(FLAG_RE);
  return m ? m[0] : null;
}
