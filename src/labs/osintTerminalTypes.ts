import type { ObjectiveStep } from './types';

export type OsintTool = 'shodan' | 'sherlock' | 'maltego' | 'eyewitness' | 'theharvester';

/** One "beat" of terminal output revealed together after a delay. Real recon tools don't dump
 *  everything instantly — sometimes a single result trickles in (a live per-site check), sometimes a
 *  whole batch lands at once (a single API response). Mixing chunk sizes/delays within and across
 *  labs is what makes the simulated pacing feel like a real tool instead of a static dump. */
export interface OsintOutputChunk {
  lines: string[];
  /** ms to wait after the previous chunk (or the command echo, for the first chunk) before revealing this one */
  delayMs: number;
}

/** One real command this lab recognizes. `match` is tested against the learner's trimmed input —
 *  write it loosely enough to accept minor real-world flag variations (e.g. -b all vs -b google,bing). */
export interface OsintCommandStep {
  match: RegExp;
  chunks: OsintOutputChunk[];
}

export interface OsintLabScenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tool: OsintTool;
  /** shown in the terminal header, e.g. "attacker@kali" */
  datasetLabel: string;
  briefing: string;
  objectives: ObjectiveStep[];
  /** the exact real commands to type, in order — shown progressively like the terminal lab's hint system */
  hints: string[];
  totalFlags: number;
  commands: OsintCommandStep[];
}

const FLAG_RE = /flag\{[^}]+\}/i;

export function extractFlag(line: string): string | null {
  const m = line.match(FLAG_RE);
  return m ? m[0] : null;
}
