import type { ObjectiveStep } from './types';

export type SiemTool = 'suricata' | 'chronicle' | 'tcpdump' | 'splunk' | 'sentinel' | 'qradar' | 'elastic';

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

/** Case-insensitive substring match, falling back to literal text if the query isn't valid regex —
 *  mirrors the same forgiving matching behavior used by the terminal's grep implementation. */
export function matchesQuery(line: string, query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  try {
    return new RegExp(q, 'i').test(line);
  } catch {
    return line.toLowerCase().includes(q.toLowerCase());
  }
}

export function extractFlag(line: string): string | null {
  const m = line.match(FLAG_RE);
  return m ? m[0] : null;
}
