import type { LabScenario } from '../labs/types';
import type { LabEntry } from './labTypes';
import { LAB_ENTRIES } from './labScenarios';

export type { LabEntry } from './labTypes';

export const LAB_DEPTH_UPGRADES: { id: string; category: LabScenario['category']; originalFlags: number; originalObjectives: number }[] = [];

export const LABS: LabEntry[] = LAB_ENTRIES;

/** Ordered to match the roadmap's actual teaching sequence (see curriculum.ts's MODULES order). */
export const LAB_CATEGORIES = [
  'Linux',
  'Network',
  'Web',
  'Active Directory',
  'Bug Bounty',
  'SOC',
  'Forensics',
  'Cloud',
  'Security+',
  'Binary Analysis',
  'Malware',
  'Security Engineering',
  'API',
  'Cryptography',
  'Mobile',
  'Wireless',
  'IoT',
  'AI Security',
] as const;

/** Maps a teaching module slug to the lab category whose labs should appear on that module's page. */
export const MODULE_TO_LAB_CATEGORY: Record<string, (typeof LAB_CATEGORIES)[number]> = {
  'database-security': 'Network',
  'kali-workstation': 'Linux',
  'evidence-led-validation': 'Network',
  'session-access-boundaries': 'Linux',
  'pre-introduction': 'Security+',
  'pre-computing': 'Linux',
  'pre-networks-web': 'Network',
  'pre-operating-systems': 'Network',
  'pre-scripting-data': 'Web',
  'pre-security-principles': 'Forensics',
  'pre-lab-readiness': 'Security+',
  'advanced-pentest-methodology': 'Network',
  'identity-trust-boundaries': 'API',
  'software-delivery-security': 'Cloud',
  'post-exploitation-host': 'Linux',
  'post-exploitation-operations': 'Network',
  linux: 'Linux',
  recon: 'Network',
  webapp: 'Web',
  redteam: 'Active Directory',
  bugbounty: 'Bug Bounty',
  soc: 'SOC',
  'soc-siem-platforms': 'SOC',
  'soc-detection-engineering': 'SOC',
  'soc-incident-response': 'SOC',
  forensics: 'Forensics',
  cloud: 'Cloud',
  securityplus: 'Security+',
  binaryanalysis: 'Binary Analysis',
  malware: 'Malware',
  secengineering: 'Security Engineering',
  'api-security': 'API',
  'crypto-attacks': 'Cryptography',
  mobile: 'Mobile',
  wireless: 'Wireless',
  iot: 'IoT',
  'ai-security': 'AI Security',
};


export const LABS_MAP = new Map<string, LabEntry>(LABS.map((l) => [l.slug, l]));
export const LABS_BY_SCENARIO_ID = new Map<string, LabEntry>(LABS.map((l) => [l.scenario.id, l]));
export const TOTAL_FLAGS = LABS.reduce((total, entry) => total + entry.scenario.totalFlags, 0);

export const LABS_BY_CATEGORY = new Map<string, LabEntry[]>();
for (const cat of LAB_CATEGORIES) {
  LABS_BY_CATEGORY.set(cat, LABS.filter((l) => l.scenario.category === cat));
}

export function findLab(slugOrScenarioId?: string): LabEntry | undefined {
  if (!slugOrScenarioId) return undefined;
  return LABS_MAP.get(slugOrScenarioId) ?? LABS_BY_SCENARIO_ID.get(slugOrScenarioId);
}

const CATEGORY_ORDER: Record<string, number> = Object.fromEntries(LAB_CATEGORIES.map((c, i) => [c, i]));
const DIFFICULTY_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

/** Stable-sorts labs into the same sequence the roadmap teaches them: category by module order, then Easy Ã¢â€ â€™ Hard within it. */
export function sortLabsByRoadmap(labs: LabEntry[]): LabEntry[] {
  return [...labs].sort((a, b) => {
    const catDiff = (CATEGORY_ORDER[a.scenario.category] ?? 99) - (CATEGORY_ORDER[b.scenario.category] ?? 99);
    if (catDiff !== 0) return catDiff;
    return (DIFFICULTY_ORDER[a.scenario.difficulty] ?? 9) - (DIFFICULTY_ORDER[b.scenario.difficulty] ?? 9);
  });
}

/** The full lab list in roadmap order — the spine the mentor companion walks the learner along. */
export const LABS_IN_ROADMAP_ORDER: LabEntry[] = sortLabsByRoadmap(LABS);

export function labsForCategory(category: string): LabEntry[] {
  return LABS_BY_CATEGORY.get(category) ?? [];
}
