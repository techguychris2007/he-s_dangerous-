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
import { redteamToolsLabs } from '../labs/scenarios/redteam-tools-pack';
import { databaseIntrusionLabs } from '../labs/scenarios/database-intrusion-pack';
import { offensiveExpansionLabs } from '../labs/scenarios/offensive-expansion-pack';
import { webSessionSecurityLabs } from '../labs/scenarios/web-session-security-pack';
import { socialEngineeringAnalysisLabs } from '../labs/scenarios/social-engineering-analysis-pack';
import { leakedNsaToolsLabs } from '../labs/scenarios/leaked-nsa-tools-pack';
import { socRealworldIncidentsLabs } from '../labs/scenarios/soc-realworld-incidents-pack';
import { offensiveBatch2Labs } from '../labs/scenarios/offensive-batch-2-pack';
import { offensiveBatch3Labs } from '../labs/scenarios/offensive-batch-3-pack';
import { offensiveFreshAttacksLabs } from '../labs/scenarios/offensive-fresh-attacks-pack';
import { offensiveFreshAttacksLabs2 } from '../labs/scenarios/offensive-fresh-attacks-pack-2';
import { offensiveFreshAttacksLabs3 } from '../labs/scenarios/offensive-fresh-attacks-pack-3';
import { offensiveFreshAttacksLabs4 } from '../labs/scenarios/offensive-fresh-attacks-pack-4';
import { offensiveFreshAttacksLabs5 } from '../labs/scenarios/offensive-fresh-attacks-pack-5';
import { apiCryptoLabs } from '../labs/scenarios/api-crypto-pack';
import { apiCryptoLabs2 } from '../labs/scenarios/api-crypto-pack-2';
import { cryptoBinaryForensicsLabs } from '../labs/scenarios/crypto-binary-forensics-pack';
import { apiCryptoCloudLabs } from '../labs/scenarios/api-crypto-cloud-pack';
import { realismBatchLabs } from '../labs/scenarios/realism-batch-pack';
import { cryptoApiAdForensicsLabs } from '../labs/scenarios/crypto-api-ad-forensics-pack';
import { batch8MixedLabs } from '../labs/scenarios/batch8-mixed-pack';
import { batch9MixedLabs } from '../labs/scenarios/batch9-mixed-pack';
import { batch10MixedLabs } from '../labs/scenarios/batch10-mixed-pack';
import { adCloudAdvancedLabs2 } from '../labs/scenarios/ad-cloud-advanced-pack-2';
import { batch11MixedLabs } from '../labs/scenarios/batch11-mixed-pack';
import { batch12MixedLabs } from '../labs/scenarios/batch12-mixed-pack';
import { batch13MixedLabs } from '../labs/scenarios/batch13-mixed-pack';
import { batch14MixedLabs } from '../labs/scenarios/batch14-mixed-pack';
import { batch15MixedLabs } from '../labs/scenarios/batch15-mixed-pack';
import { batch16MixedLabs } from '../labs/scenarios/batch16-mixed-pack';
import { batch17MixedLabs } from '../labs/scenarios/batch17-mixed-pack';
import { batch18GtfobinsLabs } from '../labs/scenarios/batch18-gtfobins-pack';
import { batch18MixedLabs } from '../labs/scenarios/batch18-mixed-pack';
import { batch19NetworkLabs } from '../labs/scenarios/batch19-network-pack';
import { batch19MixedLabs } from '../labs/scenarios/batch19-mixed-pack';
import { batch20CloudLabs } from '../labs/scenarios/batch20-cloud-pack';
import { batch20ForensicsLabs } from '../labs/scenarios/batch20-forensics-pack';
import { batch20MixedLabsA } from '../labs/scenarios/batch20-mixed-pack-a';
import { batch20NetworkLabs } from '../labs/scenarios/batch20-network-pack';
import { batch20SocLabs } from '../labs/scenarios/batch20-soc-pack';
import { batch20WebMalwareLabs } from '../labs/scenarios/batch20-web-malware-pack';
import { batch21CryptoApiLabs } from '../labs/scenarios/batch21-crypto-api-pack';
import { batch21SecplusSecengineeringLabs } from '../labs/scenarios/batch21-secplus-secengineering-pack';
import { batch21BinaryBugbountyLabs } from '../labs/scenarios/batch21-binary-bugbounty-pack';
import { mobileLabs } from '../labs/scenarios/mobile-pack';
import { wirelessLabs } from '../labs/scenarios/wireless-pack';
import { iotLabs } from '../labs/scenarios/iot-pack';
import { mobileLabs2 } from '../labs/scenarios/mobile-pack-2';
import { wirelessLabs2 } from '../labs/scenarios/wireless-pack-2';
import { aiSecurityLabs } from '../labs/scenarios/ai-security-pack';
import { aiSecurityLabs2 } from '../labs/scenarios/ai-security-pack-2';
import { metasploitLabs } from '../labs/scenarios/metasploit-pack';
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
  ...toEntries(redteamToolsLabs),
  ...toEntries(databaseIntrusionLabs),
  ...toEntries(offensiveExpansionLabs),
  ...toEntries(webSessionSecurityLabs),
  ...toEntries(socialEngineeringAnalysisLabs),
  ...toEntries(leakedNsaToolsLabs),
  ...toEntries(socRealworldIncidentsLabs),
  ...toEntries(offensiveBatch2Labs),
  ...toEntries(offensiveBatch3Labs),
  ...toEntries(offensiveFreshAttacksLabs),
  ...toEntries(offensiveFreshAttacksLabs2),
  ...toEntries(offensiveFreshAttacksLabs3),
  ...toEntries(offensiveFreshAttacksLabs4),
  ...toEntries(offensiveFreshAttacksLabs5),
  ...toEntries(apiCryptoLabs),
  ...toEntries(apiCryptoLabs2),
  ...toEntries(cryptoBinaryForensicsLabs),
  ...toEntries(apiCryptoCloudLabs),
  ...toEntries(realismBatchLabs),
  ...toEntries(cryptoApiAdForensicsLabs),
  ...toEntries(batch8MixedLabs),
  ...toEntries(batch9MixedLabs),
  ...toEntries(batch10MixedLabs),
  ...toEntries(adCloudAdvancedLabs2),
  ...toEntries(batch11MixedLabs),
  ...toEntries(batch12MixedLabs),
  ...toEntries(batch13MixedLabs),
  ...toEntries(batch14MixedLabs),
  ...toEntries(batch15MixedLabs),
  ...toEntries(batch16MixedLabs),
  ...toEntries(batch17MixedLabs),
  ...toEntries(batch18GtfobinsLabs),
  ...toEntries(batch18MixedLabs),
  ...toEntries(batch19NetworkLabs),
  ...toEntries(batch19MixedLabs),
  ...toEntries(batch20CloudLabs),
  ...toEntries(batch20ForensicsLabs),
  ...toEntries(batch20MixedLabsA),
  ...toEntries(batch20NetworkLabs),
  ...toEntries(batch20SocLabs),
  ...toEntries(batch20WebMalwareLabs),
  ...toEntries(batch21CryptoApiLabs),
  ...toEntries(batch21SecplusSecengineeringLabs),
  ...toEntries(batch21BinaryBugbountyLabs),
  ...toEntries(mobileLabs),
  ...toEntries(wirelessLabs),
  ...toEntries(iotLabs),
  ...toEntries(mobileLabs2),
  ...toEntries(wirelessLabs2),
  ...toEntries(aiSecurityLabs),
  ...toEntries(aiSecurityLabs2),
  ...toEntries(metasploitLabs),
];

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

export function findLab(slug?: string): LabEntry | undefined {
  return LABS.find((l) => l.slug === slug);
}

const CATEGORY_ORDER: Record<string, number> = Object.fromEntries(LAB_CATEGORIES.map((c, i) => [c, i]));
const DIFFICULTY_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

/** Stable-sorts labs into the same sequence the roadmap teaches them: category by module order, then Easy → Hard within it. */
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
  return LABS.filter((l) => l.scenario.category === category);
}
