import { linuxFundamentalsLab } from '../labs/scenarios/linux-fundamentals';
import { addCloudLabTeaching } from './cloudLabTeaching';
import { wirelessPasswordReuseLab } from '../labs/scenarios/wireless-password-reuse-pack';
import { msfVsftpdChainLab } from '../labs/scenarios/msf-vsftpd-chain-pack';
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
import { mobileLabs3 } from '../labs/scenarios/mobile-pack-3';
import { wirelessLabs3 } from '../labs/scenarios/wireless-pack-3';
import { iotLabs2 } from '../labs/scenarios/iot-pack-2';
import { iotLabs3 } from '../labs/scenarios/iot-pack-3';
import { aiSecurityLabs3 } from '../labs/scenarios/ai-security-pack-3';
import { metasploitLabs } from '../labs/scenarios/metasploit-pack';
import { batch26MixedLabs } from '../labs/scenarios/batch26-mixed-pack';
import { metasploitLabs2 } from '../labs/scenarios/metasploit-pack-2';
import { metasploitLabs3 } from '../labs/scenarios/metasploit-pack-3';
import { malwareCapstoneLabs } from '../labs/scenarios/malware-capstone-pack';
import { linuxCapstoneLabs } from '../labs/scenarios/capstone-linux-pack';
import { networkCapstoneLabs } from '../labs/scenarios/capstone-network-pack';
import { webCapstoneLabs } from '../labs/scenarios/capstone-web-pack';
import { guidedPentestLabs } from '../labs/scenarios/guided-pentest-pack';
import { guidedPentestLabs2 } from '../labs/scenarios/guided-pentest-pack-2';
import { guidedPentestLabs3 } from '../labs/scenarios/guided-pentest-pack-3';
import { guidedPentestLabs4 } from '../labs/scenarios/guided-pentest-pack-4';
import { guidedPentestLabs5 } from '../labs/scenarios/guided-pentest-pack-5';
import { guidedPentestLabs6 } from '../labs/scenarios/guided-pentest-pack-6';
import { guidedPentestLabs7 } from '../labs/scenarios/guided-pentest-pack-7';
import { guidedPentestLabs8 } from '../labs/scenarios/guided-pentest-pack-8';
import { guidedPentestLabs9 } from '../labs/scenarios/guided-pentest-pack-9';
import { guidedPentestLabs10 } from '../labs/scenarios/guided-pentest-pack-10';
import { guidedPentestLabs11 } from '../labs/scenarios/guided-pentest-pack-11';
import { adCapstoneLabs } from '../labs/scenarios/capstone-ad-pack';
import { bugBountyCapstoneLabs } from '../labs/scenarios/capstone-bugbounty-pack';
import { cloudCapstoneLabs } from '../labs/scenarios/capstone-cloud-pack';
import { socCapstoneLabs } from '../labs/scenarios/capstone-soc-pack';
import { forensicsCapstoneLabs } from '../labs/scenarios/capstone-forensics-pack';
import { securityPlusCapstoneLabs } from '../labs/scenarios/capstone-securityplus-pack';
import { binaryAnalysisCapstoneLabs } from '../labs/scenarios/capstone-binaryanalysis-pack';
import { secEngineeringCapstoneLabs } from '../labs/scenarios/capstone-secengineering-pack';
import { apiCapstoneLabs } from '../labs/scenarios/capstone-api-pack';
import { cryptoCapstoneLabs } from '../labs/scenarios/capstone-crypto-pack';
import { mobileCapstoneLabs } from '../labs/scenarios/capstone-mobile-pack';
import { wirelessCapstoneLabs } from '../labs/scenarios/capstone-wireless-pack';
import { iotCapstoneLabs } from '../labs/scenarios/capstone-iot-pack';
import { aiSecurityCapstoneLabs } from '../labs/scenarios/capstone-aisecurity-pack';
import { batch22SocSiemDetectionIrLabs } from '../labs/scenarios/batch22-soc-siem-detection-ir';
import { batch22ForensicsCompletionLabs } from '../labs/scenarios/batch22-forensics-completion';
import { batch22MobileWirelessIotLabs } from '../labs/scenarios/batch22-mobile-wireless-iot-part1';
import { batch22AiCloudNetworkLabs } from '../labs/scenarios/batch22-ai-cloud-network-final';
import { pySocExtensionLabs } from '../labs/scenarios/py-soc-extension-pack';
import type { LabScenario } from '../labs/types';
import { advancedOffensiveCampaigns } from '../labs/scenarios/advanced-offensive-campaigns';
import { visualPentestLabs } from '../labs/scenarios/visual-pentest-labs';
import { preSecurityLabs } from '../labs/scenarios/pre-security-labs';

export interface LabEntry {
  scenario: LabScenario;
  slug: string;
}

function toEntries(scenarios: LabScenario[]): LabEntry[] {
  return scenarios.map((scenario) => ({ scenario, slug: scenario.id }));
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


const CATEGORY_REALISM: Record<LabScenario['category'], { briefing: string; objectives: { text: string; why: string }[]; hints: string[] }> = {
  Linux: { briefing: 'In a real Linux assessment, the useful evidence is not that a command worked once; it is the identity, permission, file owner, service context, or environment setting that made the action possible.', objectives: [{ text: 'Record the starting user and effective permissions before exploiting anything', why: 'Privilege findings need a before-and-after identity trail.' }, { text: 'Name the exact file, process, service, or permission that created the trust break', why: 'A reviewer needs the root cause, not just the final shell.' }], hints: ['Start with identity, permissions, and process context before trying escalation paths.', 'Write down the root cause in one sentence before you capture the final flag.'] },
  Network: { briefing: 'Real network testing is evidence-led: scope, source address, destination, protocol, port, response type, and timing all affect what a scan or connection actually proves.', objectives: [{ text: 'Confirm which service answered and how you know', why: 'Port numbers are clues; service behavior is evidence.' }, { text: 'Document whether the path was open, closed, filtered, or authenticated', why: 'Different network outcomes imply different controls and next steps.' }], hints: ['Compare service banners with scan output before deciding what the host is running.', 'If you see no response, consider filtering or routing before assuming the service is down.'] },
  Web: { briefing: 'Real web testing is controlled request comparison. A vulnerability claim should show the normal request, the single changed variable, and the server-side decision that failed.', objectives: [{ text: 'Capture a baseline request and response before changing input', why: 'Without a baseline, you cannot explain what changed.' }, { text: 'Change one parameter, header, role, or object at a time', why: 'Single-variable testing prevents false conclusions.' }], hints: ['Keep one clean baseline request for comparison.', 'If you changed multiple fields, repeat the test with one change.'] },
  'Active Directory': { briefing: 'Real AD testing follows trust relationships: identities, groups, delegation, tickets, certificate templates, replication rights, and workstation access combine into attack paths.', objectives: [{ text: 'Identify the current domain principal and reachable systems', why: 'Every AD path starts from a specific identity and location.' }, { text: 'Trace the trust edge that permits the next action', why: 'Attack paths are relationships, not isolated commands.' }], hints: ['Map user, host, and privilege relationship before using an AD abuse technique.', 'Separate credential access from authorization abuse in your notes.'] },
  'Bug Bounty': { briefing: 'Real bounty work is scoped, minimal-impact proof. The strongest report is easy to reproduce and avoids exposing unnecessary user data.', objectives: [{ text: 'State the program rule or scope assumption for the test', why: 'Triagers reject valid bugs when the test path is out of scope.' }, { text: 'Capture expected behavior, observed behavior, and impact', why: 'A report must show why the behavior matters.' }], hints: ['Use controlled test data wherever possible.', 'Write steps as if the triager has never seen your account state.'] },
  Cloud: { briefing: 'Real cloud findings come from principal, action, resource, and policy. Public exposure, metadata access, pass-role paths, and logging gaps have different evidence requirements.', objectives: [{ text: 'Record the principal and cloud action being tested', why: 'Cloud impact depends on who can do what to which resource.' }, { text: 'Separate data-plane exposure from control-plane authority', why: 'Reading data and changing infrastructure are different risks.' }], hints: ['Run identity checks before making cloud API claims.', 'Look for both resource policy and identity policy evidence.'] },
  SOC: { briefing: 'Real SOC investigations start with uncertainty. Alerts, queries, and dashboards are leads that must be tied to entities, timelines, and evidence before escalation.', objectives: [{ text: 'Anchor the investigation to time range, user, host, and source data', why: 'A case without scope cannot be reliably closed.' }, { text: 'Write what is fact, what is inference, and what remains unknown', why: 'Good analysts do not hide uncertainty.' }], hints: ['Pivot around one entity at a time: user, host, IP, process, then timeline.', 'Do not close the case until the evidence supports the conclusion.'] },
  Forensics: { briefing: 'Real forensic work depends on provenance. A file, timestamp, or registry key is useful only when its source and limitation are understood.', objectives: [{ text: 'Identify the evidence source before interpreting the artifact', why: 'Findings need provenance to be trusted.' }, { text: 'Corroborate important conclusions with a second artifact where possible', why: 'One artifact can be incomplete, stale, or misleading.' }], hints: ['Write the artifact path or source beside each conclusion.', 'Separate timeline facts from interpretation.'] },
  'Security+': { briefing: 'Real security fundamentals are useful when they guide decisions: define the risk, choose a control, describe evidence, and explain residual risk.', objectives: [{ text: 'Connect the concept to a concrete risk', why: 'Vocabulary matters only when it helps protect a system.' }, { text: 'Name a preventive, detective, or recovery control', why: 'Controls should reduce likelihood, impact, or recovery time.' }], hints: ['Translate every term into a plain-language risk statement.', 'Ask what evidence would prove the control works.'] },
  'Binary Analysis': { briefing: 'Real binary analysis requires exactness: architecture, protections, input control, crash state, and reproducibility decide whether a bug is exploitable.', objectives: [{ text: 'Record architecture, protections, and crash condition', why: 'Exploitability depends on environment and mitigations.' }, { text: 'Identify which input bytes influence program state', why: 'Control is the difference between a crash and a security issue.' }], hints: ['Reproduce the crash before interpreting it.', 'Avoid exploitability claims until you can show input control.'] },
  Malware: { briefing: 'Real malware analysis separates static clues from observed behavior. Indicators help detection, but behavior explains risk.', objectives: [{ text: 'Separate static indicators from dynamic behavior', why: 'Strings and hashes alone do not prove execution behavior.' }, { text: 'Map observed behavior to detection or containment action', why: 'Analysis should help defenders act.' }], hints: ['Collect hashes, strings, imports, and paths before dynamic claims.', 'Label unobserved behavior as a hypothesis.'] },
  'Security Engineering': { briefing: 'Real security engineering is about assumptions that can be tested. Trust boundaries, invariants, owners, and rollback plans turn design into protection.', objectives: [{ text: 'Name the trust boundary or invariant under test', why: 'A design issue must map to a property that should hold.' }, { text: 'Define how the fix would be verified and monitored', why: 'A fix without verification can silently regress.' }], hints: ['Draw the data flow before testing the control.', 'Ask who owns the control after deployment.'] },
  API: { briefing: 'Real API security is actor-action-object reasoning across every interface that reaches the same data or function.', objectives: [{ text: 'Identify actor, action, object, and expected authorization rule', why: 'Authorization failures require all four pieces.' }, { text: 'Check whether another endpoint exposes the same object differently', why: 'APIs often duplicate business functions.' }], hints: ['Test one role or object change at a time.', 'Compare REST, GraphQL, export, and batch paths when available.'] },
  Cryptography: { briefing: 'Real crypto failures usually come from misuse: bad nonce handling, missing authentication, unsafe error behavior, weak passwords, or incorrect protocol composition.', objectives: [{ text: 'Name the security property being tested', why: 'Confidentiality, integrity, and authenticity fail in different ways.' }, { text: 'Identify the key, nonce, mode, or oracle behavior involved', why: 'Crypto findings need precise misuse evidence.' }], hints: ['Do not stop at naming the algorithm; identify the usage rule.', 'Treat detailed errors and timing differences as possible signals.'] },
  Mobile: { briefing: 'Real mobile testing connects device artifacts, app behavior, and backend enforcement. Client-side controls are never enough by themselves.', objectives: [{ text: 'Map where sensitive data moves: storage, logs, IPC, and API', why: 'Mobile exposure often happens outside the visible screen.' }, { text: 'Verify server-side authorization for the tested action', why: 'A modified client can bypass UI-only checks.' }], hints: ['Check local storage and network behavior together.', 'Ask whether the backend would stop a modified client.'] },
  Wireless: { briefing: 'Real wireless testing is constrained by radio environment, authorization, capture quality, and segmentation after association.', objectives: [{ text: 'Identify the network, authentication mode, and evidence source', why: 'Wireless claims depend on capture context.' }, { text: 'Explain what access is possible after association', why: 'Joining Wi-Fi is not the same as reaching sensitive systems.' }], hints: ['Record SSID, BSSID, channel, and authentication type.', 'Separate signal observations from credential or segmentation findings.'] },
  IoT: { briefing: 'Real IoT security spans firmware, hardware interfaces, network services, cloud APIs, update trust, and product lifecycle.', objectives: [{ text: 'Identify firmware, interface, and device model context', why: 'A device finding must be tied to affected versions.' }, { text: 'Connect the single-device behavior to fleet or lifecycle risk', why: 'IoT impact often comes from scale and support lifetime.' }], hints: ['Look for default credentials, debug interfaces, and update trust.', 'Consider whether the issue affects one device or a fleet.'] },
  'AI Security': { briefing: 'Real AI security treats model output as untrusted and enforces authority outside the model. Prompts, retrieval content, memory, and tools must be scoped separately.', objectives: [{ text: 'List which input or retrieved content influenced the model', why: 'Prompt injection and leakage depend on data flow.' }, { text: 'Identify what external tool or data boundary was crossed', why: 'The model is not itself the security control.' }], hints: ['Separate model behavior from application permission checks.', 'Record model, tool scope, and data source when reporting.'] },
};

function enrichScenarioEducation(scenario: LabScenario): LabScenario {
  const guide = CATEGORY_REALISM[scenario.category];
  const briefing = scenario.briefing.split(/\s+/).length < 28 ? `${scenario.briefing}\n\nReal-world framing: ${guide.briefing}` : scenario.briefing;
  const objectives = scenario.objectives.length < 5 ? [...scenario.objectives, ...guide.objectives.slice(0, 5 - scenario.objectives.length)] : scenario.objectives;
  const hints = scenario.hints.length < 3 ? [...scenario.hints, ...guide.hints.slice(0, 3 - scenario.hints.length)] : scenario.hints;
  if (briefing === scenario.briefing && objectives === scenario.objectives && hints === scenario.hints) return scenario;
  return { ...scenario, briefing, objectives, hints };
}

function enrichEntryEducation(entry: LabEntry): LabEntry {
  return { ...entry, scenario: enrichScenarioEducation(entry.scenario) };
}

export const LAB_DEPTH_UPGRADES: { id: string; category: LabScenario['category']; originalFlags: number; originalObjectives: number }[] = [];

export const LABS: LabEntry[] = [
  ...ORIGINAL_LABS,
  ...toEntries(preSecurityLabs),
  ...toEntries(advancedOffensiveCampaigns),
  ...toEntries(visualPentestLabs),
].map(enrichEntryEducation);

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

for (const entry of LABS) addCloudLabTeaching(entry.scenario);

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
