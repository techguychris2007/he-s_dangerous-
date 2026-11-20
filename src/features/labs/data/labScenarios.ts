// Every lab scenario, assembled from the scenario packs. Only src/features/labs/data/labs.ts imports this.
// The production build replaces this module with a generated one in which Pro and Max labs are
// catalogue stubs (title, category, difficulty, flag count); their full scenarios are published to
// the private `paid-content` bucket (scripts/paid-content.cjs, src/features/billing/lib/paidContent.ts).
import type { LabEntry } from './labTypes';
import { linuxFundamentalsLab } from '../scenarios/linux-fundamentals';
import { addCloudLabTeaching } from './cloudLabTeaching';
import { wirelessPasswordReuseLab } from '../scenarios/wireless-password-reuse-pack';
import { msfVsftpdChainLab } from '../scenarios/msf-vsftpd-chain-pack';
import { networkReconLab } from '../scenarios/network-recon';
import { enumBruteforceLab } from '../scenarios/enum-bruteforce';
import { capstoneBoxLab } from '../scenarios/capstone-box';
import { linuxPrivescLabs } from '../scenarios/linux-privesc-pack';
import { networkServiceLabs } from '../scenarios/network-services-pack';
import { webVulnLabs } from '../scenarios/web-vulns-pack';
import { adRedteamLabs } from '../scenarios/ad-redteam-pack';
import { bugBountyLabs } from '../scenarios/bugbounty-recon-pack';
import { socLabs } from '../scenarios/soc-threat-hunting-pack';
import { forensicsLabs } from '../scenarios/digital-forensics-pack';
import { cloudSecurityLabs } from '../scenarios/cloud-security-pack';
import { intenseRealWorldLabs } from '../scenarios/intense-realworld-pack';
import { adAdvancedLabs } from '../scenarios/ad-advanced-pack';
import { bugBountyAdvancedLabs } from '../scenarios/bugbounty-advanced-pack';
import { cloudAdvancedLabs } from '../scenarios/cloud-advanced-pack';
import { socAdvancedLabs } from '../scenarios/soc-advanced-pack';
import { forensicsAdvancedLabs } from '../scenarios/forensics-advanced-pack';
import { securityPlusLabs } from '../scenarios/securityplus-pack';
import { binaryAnalysisLabs } from '../scenarios/binaryanalysis-pack';
import { malwareAnalysisLabs } from '../scenarios/malware-pack';
import { secEngineeringLabs } from '../scenarios/secengineering-pack';
import { secEngineeringAdvancedLabs } from '../scenarios/secengineering-advanced-pack';
import { securityPlusAdvancedLabs } from '../scenarios/securityplus-advanced-pack';
import { binaryAnalysisAdvancedLabs } from '../scenarios/binaryanalysis-advanced-pack';
import { malwareAdvancedLabs } from '../scenarios/malware-advanced-pack';
import { currentThreatsLabs } from '../scenarios/current-threats-pack';
import { modernAttackChainsLabs } from '../scenarios/modern-attack-chains-pack';
import { redteamToolsLabs } from '../scenarios/redteam-tools-pack';
import { databaseIntrusionLabs } from '../scenarios/database-intrusion-pack';
import { offensiveExpansionLabs } from '../scenarios/offensive-expansion-pack';
import { webSessionSecurityLabs } from '../scenarios/web-session-security-pack';
import { socialEngineeringAnalysisLabs } from '../scenarios/social-engineering-analysis-pack';
import { leakedNsaToolsLabs } from '../scenarios/leaked-nsa-tools-pack';
import { socRealworldIncidentsLabs } from '../scenarios/soc-realworld-incidents-pack';
import { offensiveBatch2Labs } from '../scenarios/offensive-batch-2-pack';
import { offensiveBatch3Labs } from '../scenarios/offensive-batch-3-pack';
import { offensiveFreshAttacksLabs } from '../scenarios/offensive-fresh-attacks-pack';
import { offensiveFreshAttacksLabs2 } from '../scenarios/offensive-fresh-attacks-pack-2';
import { offensiveFreshAttacksLabs3 } from '../scenarios/offensive-fresh-attacks-pack-3';
import { offensiveFreshAttacksLabs4 } from '../scenarios/offensive-fresh-attacks-pack-4';
import { offensiveFreshAttacksLabs5 } from '../scenarios/offensive-fresh-attacks-pack-5';
import { apiCryptoLabs } from '../scenarios/api-crypto-pack';
import { apiCryptoLabs2 } from '../scenarios/api-crypto-pack-2';
import { cryptoBinaryForensicsLabs } from '../scenarios/crypto-binary-forensics-pack';
import { apiCryptoCloudLabs } from '../scenarios/api-crypto-cloud-pack';
import { realismBatchLabs } from '../scenarios/realism-batch-pack';
import { cryptoApiAdForensicsLabs } from '../scenarios/crypto-api-ad-forensics-pack';
import { batch8MixedLabs } from '../scenarios/batch8-mixed-pack';
import { batch9MixedLabs } from '../scenarios/batch9-mixed-pack';
import { batch10MixedLabs } from '../scenarios/batch10-mixed-pack';
import { adCloudAdvancedLabs2 } from '../scenarios/ad-cloud-advanced-pack-2';
import { batch11MixedLabs } from '../scenarios/batch11-mixed-pack';
import { batch12MixedLabs } from '../scenarios/batch12-mixed-pack';
import { batch13MixedLabs } from '../scenarios/batch13-mixed-pack';
import { batch14MixedLabs } from '../scenarios/batch14-mixed-pack';
import { batch15MixedLabs } from '../scenarios/batch15-mixed-pack';
import { batch16MixedLabs } from '../scenarios/batch16-mixed-pack';
import { batch17MixedLabs } from '../scenarios/batch17-mixed-pack';
import { batch18GtfobinsLabs } from '../scenarios/batch18-gtfobins-pack';
import { batch18MixedLabs } from '../scenarios/batch18-mixed-pack';
import { batch19NetworkLabs } from '../scenarios/batch19-network-pack';
import { batch19MixedLabs } from '../scenarios/batch19-mixed-pack';
import { batch20CloudLabs } from '../scenarios/batch20-cloud-pack';
import { batch20ForensicsLabs } from '../scenarios/batch20-forensics-pack';
import { batch20MixedLabsA } from '../scenarios/batch20-mixed-pack-a';
import { batch20NetworkLabs } from '../scenarios/batch20-network-pack';
import { batch20SocLabs } from '../scenarios/batch20-soc-pack';
import { batch20WebMalwareLabs } from '../scenarios/batch20-web-malware-pack';
import { batch21CryptoApiLabs } from '../scenarios/batch21-crypto-api-pack';
import { batch21SecplusSecengineeringLabs } from '../scenarios/batch21-secplus-secengineering-pack';
import { batch21BinaryBugbountyLabs } from '../scenarios/batch21-binary-bugbounty-pack';
import { mobileLabs } from '../scenarios/mobile-pack';
import { wirelessLabs } from '../scenarios/wireless-pack';
import { iotLabs } from '../scenarios/iot-pack';
import { mobileLabs2 } from '../scenarios/mobile-pack-2';
import { wirelessLabs2 } from '../scenarios/wireless-pack-2';
import { aiSecurityLabs } from '../scenarios/ai-security-pack';
import { aiSecurityLabs2 } from '../scenarios/ai-security-pack-2';
import { mobileLabs3 } from '../scenarios/mobile-pack-3';
import { wirelessLabs3 } from '../scenarios/wireless-pack-3';
import { iotLabs2 } from '../scenarios/iot-pack-2';
import { iotLabs3 } from '../scenarios/iot-pack-3';
import { aiSecurityLabs3 } from '../scenarios/ai-security-pack-3';
import { metasploitLabs } from '../scenarios/metasploit-pack';
import { batch26MixedLabs } from '../scenarios/batch26-mixed-pack';
import { metasploitLabs2 } from '../scenarios/metasploit-pack-2';
import { metasploitLabs3 } from '../scenarios/metasploit-pack-3';
import { malwareCapstoneLabs } from '../scenarios/malware-capstone-pack';
import { linuxCapstoneLabs } from '../scenarios/capstone-linux-pack';
import { networkCapstoneLabs } from '../scenarios/capstone-network-pack';
import { webCapstoneLabs } from '../scenarios/capstone-web-pack';
import { guidedPentestLabs } from '../scenarios/guided-pentest-pack';
import { guidedPentestLabs2 } from '../scenarios/guided-pentest-pack-2';
import { guidedPentestLabs3 } from '../scenarios/guided-pentest-pack-3';
import { guidedPentestLabs4 } from '../scenarios/guided-pentest-pack-4';
import { guidedPentestLabs5 } from '../scenarios/guided-pentest-pack-5';
import { guidedPentestLabs6 } from '../scenarios/guided-pentest-pack-6';
import { guidedPentestLabs7 } from '../scenarios/guided-pentest-pack-7';
import { guidedPentestLabs8 } from '../scenarios/guided-pentest-pack-8';
import { guidedPentestLabs9 } from '../scenarios/guided-pentest-pack-9';
import { guidedPentestLabs10 } from '../scenarios/guided-pentest-pack-10';
import { guidedPentestLabs11 } from '../scenarios/guided-pentest-pack-11';
import { adCapstoneLabs } from '../scenarios/capstone-ad-pack';
import { bugBountyCapstoneLabs } from '../scenarios/capstone-bugbounty-pack';
import { cloudCapstoneLabs } from '../scenarios/capstone-cloud-pack';
import { socCapstoneLabs } from '../scenarios/capstone-soc-pack';
import { forensicsCapstoneLabs } from '../scenarios/capstone-forensics-pack';
import { securityPlusCapstoneLabs } from '../scenarios/capstone-securityplus-pack';
import { binaryAnalysisCapstoneLabs } from '../scenarios/capstone-binaryanalysis-pack';
import { secEngineeringCapstoneLabs } from '../scenarios/capstone-secengineering-pack';
import { apiCapstoneLabs } from '../scenarios/capstone-api-pack';
import { cryptoCapstoneLabs } from '../scenarios/capstone-crypto-pack';
import { mobileCapstoneLabs } from '../scenarios/capstone-mobile-pack';
import { wirelessCapstoneLabs } from '../scenarios/capstone-wireless-pack';
import { iotCapstoneLabs } from '../scenarios/capstone-iot-pack';
import { aiSecurityCapstoneLabs } from '../scenarios/capstone-aisecurity-pack';
import { batch22SocSiemDetectionIrLabs } from '../scenarios/batch22-soc-siem-detection-ir';
import { batch22ForensicsCompletionLabs } from '../scenarios/batch22-forensics-completion';
import { batch22MobileWirelessIotLabs } from '../scenarios/batch22-mobile-wireless-iot-part1';
import { batch22AiCloudNetworkLabs } from '../scenarios/batch22-ai-cloud-network-final';
import { pySocExtensionLabs } from '../scenarios/py-soc-extension-pack';
import type { LabScenario } from '../engine/types';
import { advancedOffensiveCampaigns } from '../scenarios/advanced-offensive-campaigns';
import { visualPentestLabs } from '../scenarios/visual-pentest-labs';
import { preSecurityLabs } from '../scenarios/pre-security-labs';
import { phpOctober2026Labs } from '../scenarios/php-october-2026-rce';
import { narrativeFor } from '../engine/narratives';


function toEntries(scenarios: LabScenario[]): LabEntry[] {
  return scenarios.map((scenario) => ({
    scenario: scenario.narrative ? scenario : { ...scenario, narrative: narrativeFor(scenario) },
    slug: scenario.id,
  }));
}

const ORIGINAL_LABS: LabEntry[] = [
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
  ...toEntries(mobileLabs3),
  ...toEntries(wirelessLabs3),
  ...toEntries(iotLabs2),
  ...toEntries(iotLabs3),
  ...toEntries(aiSecurityLabs3),
  ...toEntries(batch26MixedLabs),
  ...toEntries(metasploitLabs2),
  ...toEntries(metasploitLabs3),
  ...toEntries(malwareCapstoneLabs),
  ...toEntries(linuxCapstoneLabs),
  ...toEntries(networkCapstoneLabs),
  ...toEntries(webCapstoneLabs),
  ...toEntries(guidedPentestLabs),
  ...toEntries(guidedPentestLabs2),
  ...toEntries(guidedPentestLabs3),
  ...toEntries(guidedPentestLabs4),
  ...toEntries(guidedPentestLabs5),
  ...toEntries(guidedPentestLabs6),
  ...toEntries(guidedPentestLabs7),
  ...toEntries(guidedPentestLabs8),
  ...toEntries(guidedPentestLabs9),
  ...toEntries(guidedPentestLabs10),
  ...toEntries(guidedPentestLabs11),
  ...toEntries(adCapstoneLabs),
  ...toEntries(bugBountyCapstoneLabs),
  ...toEntries(cloudCapstoneLabs),
  ...toEntries(socCapstoneLabs),
  ...toEntries(forensicsCapstoneLabs),
  ...toEntries(securityPlusCapstoneLabs),
  ...toEntries(binaryAnalysisCapstoneLabs),
  ...toEntries(secEngineeringCapstoneLabs),
  ...toEntries(apiCapstoneLabs),
  ...toEntries(cryptoCapstoneLabs),
  ...toEntries(mobileCapstoneLabs),
  ...toEntries(wirelessCapstoneLabs),
  ...toEntries(iotCapstoneLabs),
  ...toEntries(aiSecurityCapstoneLabs),
  ...toEntries(batch22SocSiemDetectionIrLabs),
  ...toEntries(batch22ForensicsCompletionLabs),
  ...toEntries(batch22MobileWirelessIotLabs),
  ...toEntries(batch22AiCloudNetworkLabs),
  ...toEntries(pySocExtensionLabs),
  ...toEntries([wirelessPasswordReuseLab, msfVsftpdChainLab]),
];

const ALL: LabEntry[] = [
  ...ORIGINAL_LABS,
  ...toEntries(preSecurityLabs),
  ...toEntries(advancedOffensiveCampaigns),
  ...toEntries(visualPentestLabs),
  ...toEntries(phpOctober2026Labs),
];

for (const entry of ALL) addCloudLabTeaching(entry.scenario);

export const LAB_ENTRIES: LabEntry[] = ALL;
