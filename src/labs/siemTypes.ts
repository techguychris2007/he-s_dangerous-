import type { ObjectiveStep } from './types';
import type { InvestigationCase } from './investigation';

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
  evidenceId?: string;
  /** what actually gets searched/filtered against the analyst's query (case-insensitive substring or regex) */
  line: string;
  /** Suricata only: drives the severity badge color */
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  /** Chronicle only: short event-type label shown as a column/tag */
  eventType?: string;
  /** shared: an ISO-ish timestamp string shown as a column */
  timestamp?: string;
}

/** Optional story wrapper that turns a SIEM lab into a gamified narrative investigation.
 *  When present, the lab page renders a cinematic story header and replaces the dry "Lab Guide"
 *  title with "Your Mission". */
export interface SiemNarrative {
  /** Short story title / hook — shown prominently above the briefing */
  hook: string;
  /** The victim/protagonist name */
  victim: string;
  /** 1-2 sentence scene-setter shown as a story paragraph */
  scene: string;
  /** The analyst's mission — what they are being asked to do */
  mission: string;
  /** Short chapter tags shown as pills — each maps to one investigation phase */
  chapters: string[];
  /** Optional emoji or icon character displayed alongside the victim name */
  emoji?: string;
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
  /** When present, the lab is rendered as a gamified story investigation instead of a plain guide */
  narrative?: SiemNarrative;
  investigation?: InvestigationCase;
}

const FLAG_RE = /flag\{[^}]+\}/i;

/** Filter the selected offline training records; see the supported subset in siemQuery. */
export { matchesRecordQuery as matchesQuery } from './siemQuery';

export function extractFlag(line: string): string | null {
  const m = line.match(FLAG_RE);
  return m ? m[0] : null;
}
