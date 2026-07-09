import { linuxFundamentalsLab } from '../labs/scenarios/linux-fundamentals';
import { networkReconLab } from '../labs/scenarios/network-recon';
import { enumBruteforceLab } from '../labs/scenarios/enum-bruteforce';
import { capstoneBoxLab } from '../labs/scenarios/capstone-box';
import { linuxPrivescLabs } from '../labs/scenarios/linux-privesc-pack';
import { networkServiceLabs } from '../labs/scenarios/network-services-pack';
import { webVulnLabs } from '../labs/scenarios/web-vulns-pack';
import { adRedteamLabs } from '../labs/scenarios/ad-redteam-pack';
import { bugBountyLabs } from '../labs/scenarios/bugbounty-recon-pack';
import { socLabs } from '../labs/scenarios/soc-threat-hunting-pack';
import { forensicsLabs } from '../labs/scenarios/digital-forensics-pack';
import { cloudSecurityLabs } from '../labs/scenarios/cloud-security-pack';
import { intenseRealWorldLabs } from '../labs/scenarios/intense-realworld-pack';
import { adAdvancedLabs } from '../labs/scenarios/ad-advanced-pack';
import { bugBountyAdvancedLabs } from '../labs/scenarios/bugbounty-advanced-pack';
import { cloudAdvancedLabs } from '../labs/scenarios/cloud-advanced-pack';
import { socAdvancedLabs } from '../labs/scenarios/soc-advanced-pack';
import { forensicsAdvancedLabs } from '../labs/scenarios/forensics-advanced-pack';
import { securityPlusLabs } from '../labs/scenarios/securityplus-pack';
import { binaryAnalysisLabs } from '../labs/scenarios/binaryanalysis-pack';
import { malwareAnalysisLabs } from '../labs/scenarios/malware-pack';
import { secEngineeringLabs } from '../labs/scenarios/secengineering-pack';
import { secEngineeringAdvancedLabs } from '../labs/scenarios/secengineering-advanced-pack';
import { securityPlusAdvancedLabs } from '../labs/scenarios/securityplus-advanced-pack';
import { binaryAnalysisAdvancedLabs } from '../labs/scenarios/binaryanalysis-advanced-pack';
import { malwareAdvancedLabs } from '../labs/scenarios/malware-advanced-pack';
import { currentThreatsLabs } from '../labs/scenarios/current-threats-pack';
import { modernAttackChainsLabs } from '../labs/scenarios/modern-attack-chains-pack';
import type { LabScenario } from '../labs/types';

export interface LabEntry {
  scenario: LabScenario;
  slug: string;
}

function toEntries(scenarios: LabScenario[]): LabEntry[] {
  return scenarios.map((scenario) => ({ scenario, slug: scenario.id }));
}

export const LABS: LabEntry[] = [
  ...toEntries([linuxFundamentalsLab, networkReconLab, enumBruteforceLab, capstoneBoxLab]),
  ...toEntries(linuxPrivescLabs),
  ...toEntries(networkServiceLabs),
  ...toEntries(webVulnLabs),
  ...toEntries(adRedteamLabs),
  ...toEntries(bugBountyLabs),
  ...toEntries(socLabs),
  ...toEntries(forensicsLabs),
  ...toEntries(cloudSecurityLabs),
  ...toEntries(intenseRealWorldLabs),
  ...toEntries(adAdvancedLabs),
  ...toEntries(bugBountyAdvancedLabs),
  ...toEntries(cloudAdvancedLabs),
  ...toEntries(socAdvancedLabs),
  ...toEntries(forensicsAdvancedLabs),
  ...toEntries(securityPlusLabs),
  ...toEntries(binaryAnalysisLabs),
  ...toEntries(malwareAnalysisLabs),
  ...toEntries(secEngineeringLabs),
  ...toEntries(secEngineeringAdvancedLabs),
  ...toEntries(securityPlusAdvancedLabs),
  ...toEntries(binaryAnalysisAdvancedLabs),
  ...toEntries(malwareAdvancedLabs),
  ...toEntries(currentThreatsLabs),
  ...toEntries(modernAttackChainsLabs),
];

export const LAB_CATEGORIES = [
  'Linux',
  'Network',
  'Web',
  'Active Directory',
  'Bug Bounty',
  'Cloud',
  'SOC',
  'Forensics',
  'Security+',
  'Binary Analysis',
  'Malware',
  'Security Engineering',
] as const;

/** Maps a teaching module slug to the lab category whose labs should appear on that module's page. */
export const MODULE_TO_LAB_CATEGORY: Record<string, (typeof LAB_CATEGORIES)[number]> = {
  linux: 'Linux',
  recon: 'Network',
  webapp: 'Web',
  redteam: 'Active Directory',
  bugbounty: 'Bug Bounty',
  soc: 'SOC',
  forensics: 'Forensics',
  cloud: 'Cloud',
  securityplus: 'Security+',
  binaryanalysis: 'Binary Analysis',
  malware: 'Malware',
  secengineering: 'Security Engineering',
};

export function findLab(slug?: string): LabEntry | undefined {
  return LABS.find((l) => l.slug === slug);
}

export function labsForCategory(category: string): LabEntry[] {
  return LABS.filter((l) => l.scenario.category === category);
}
