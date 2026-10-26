import type { LabScenario, ObjectiveStep } from './types';

export interface LabLearningFrame {
  title: string;
  scene: string;
  question: string;
  method: string;
  why: string;
  observe: string;
  decision: string;
  exactHint?: string;
}

type Technique = {
  match: RegExp;
  title: string;
  method: string;
  observe: string;
};

const TECHNIQUES: Technique[] = [
  { match: /\b(nmap|masscan|rustscan)\b/i, title: 'Build the service map', method: 'Choose service discovery when you know the host but do not yet know which network services deserve attention. Start broad enough to avoid assumptions, then use version detection to turn port numbers into testable hypotheses.', observe: 'Record each open port, the detected protocol and version, and any mismatch between the expected service and the returned banner. An open port proves reachability; a version string alone does not prove vulnerability.' },
  { match: /\bssh\b/i, title: 'Establish and verify the foothold', method: 'Use SSH when the evidence provides a valid account on an in-scope host. Treat the login as a change of evidence context: after connecting, local files and commands belong to the remote host.', observe: 'Check the hostname, user identity and working directory after login. A successful session proves the credential works; it does not prove elevated privilege.' },
  { match: /\b(whoami|\bid\b|hostname|pwd)\b/i, title: 'Establish a trustworthy baseline', method: 'Use identity and location commands before deeper work so later changes can be compared with a known starting state. This prevents confusing the attacker workstation with a remote session or mistaking a normal user for root.', observe: 'Read the username or UID, group memberships, hostname and current path. These values define what the present shell can reasonably access.' },
  { match: /\b(find|locate)\b/i, title: 'Search by filesystem evidence', method: 'Use a filesystem search when the relevant artifact is not in a known path. Narrow by name, type or permission so the output answers the investigation question instead of producing an unreadable inventory.', observe: 'Look for paths that differ from standard system locations, unusual owners or permission bits, recent artifacts, and names that fit the scenario. A path is a lead; inspect it before drawing a conclusion.' },
  { match: /\b(grep|ripgrep|\brg\b)\b/i, title: 'Reduce the evidence set', method: 'Use text filtering when the source is known but the event of interest is buried among routine records. Select a pattern tied to the hypothesis, then retain enough surrounding context to understand sequence and outcome.', observe: 'Compare timestamps, source identifiers, accounts, outcomes and adjacent lines. Count repeated failures, then look for a success or a second data source that changes the interpretation.' },
  { match: /\b(cat|less|head|tail|type)\b/i, title: 'Inspect the primary artifact', method: 'Read the source artifact after discovery rather than treating its filename as proof. Choose a full read for short files and a bounded or paged read for large evidence so important context is not lost.', observe: 'Separate facts written in the artifact from your inference. Note provenance, timestamps, configuration values and any proof token returned by the lab.' },
  { match: /\b(curl|wget|http)\b/i, title: 'Test one web hypothesis', method: 'Use a direct HTTP request after identifying an endpoint and the single input you want to vary. Keep the baseline request so response status, body and authorization behavior can be compared cleanly.', observe: 'Compare status codes, response fields, redirects, error detail and data belonging to another identity. A different response proves changed behavior; explain why that behavior creates impact.' },
  { match: /\b(gobuster|ffuf|feroxbuster|dirsearch)\b/i, title: 'Map hidden application surface', method: 'Use content discovery when the visible page cannot represent the whole application. Enumerate paths within scope, then prioritize results by status, naming and likely sensitivity instead of attacking every response.', observe: 'Notice admin, backup, debug, API and upload paths, redirects, and size outliers. Discovery supplies leads; follow-up requests establish whether a lead is exposed or vulnerable.' },
  { match: /\b(ftp|ftp-get)\b/i, title: 'Validate exposed file access', method: 'Use the service-specific client after reconnaissance identifies FTP. Test the least-privileged access the server advertises before attempting credentials, then enumerate and retrieve only in-scope files.', observe: 'Confirm whether anonymous access is accepted, which directory is exposed and what the retrieved file actually contains. Service access and sensitive-data exposure are separate findings.' },
  { match: /\b(sudo|SUID|perm -4000)\b/i, title: 'Evaluate a privilege boundary', method: 'Inspect delegated privilege and special file permissions after establishing a low-privilege baseline. The goal is to identify a trusted program whose allowed behavior crosses the boundary, then verify impact in the lab.', observe: 'Read the exact allowed binary, whether a password is required, the file owner and permission bits, and the identity after execution. A suspicious rule is a finding; privileged evidence confirms exploitability.' },
  { match: /\b(strings|file |objdump|readelf)\b/i, title: 'Triage the binary without execution', method: 'Begin with static inspection when running an unknown sample would add risk. Identify the file format, then extract readable strings or imports to form a capability hypothesis.', observe: 'Look for embedded paths, domains, credentials, error messages and security-relevant APIs. Strings are clues and may be unused; corroborate them before making a capability claim.' },
  { match: /\b(hashcat|john)\b/i, title: 'Test password resistance', method: 'Use offline cracking only after obtaining an authorised hash and identifying its format. Select the correct mode and a justified candidate source so the result evaluates password strength rather than random guessing.', observe: 'Confirm the hash type, cost parameters, candidate source and recovered value. A fast recovery may implicate the password, the hashing configuration, or both.' },
  { match: /\b(smbclient|rpcclient|enum4linux|secretsdump)\b/i, title: 'Interrogate the Windows trust surface', method: 'Use SMB or directory-aware tooling after discovery confirms the service and scope. Start with enumeration and available access, then move to sensitive operations only when evidence and permissions justify them.', observe: 'Track domain or workgroup names, shares, access level, account identity and whether returned data crosses the expected trust boundary.' },
  { match: /\b(aws|s3|metadata|169\.254\.169\.254)\b/i, title: 'Trace the cloud identity and data path', method: 'Cloud investigations require separating public reachability, the active identity and that identity’s permissions. Inspect each layer in order so you can name the failed control precisely.', observe: 'Record the caller identity, resource name, policy boundary and exact object or credential exposed. Avoid describing every cloud exposure as simply “public.”' },
  { match: /\b(dig|nslookup|dns|tcpdump|wireshark)\b/i, title: 'Follow the network evidence', method: 'Use protocol-aware inspection when the question concerns resolution, repeated connections or traffic sequence. Filter on the field tied to the hypothesis and preserve timing and direction.', observe: 'Inspect source and destination, query or host name, response value, interval, protocol and failures. Repetition can indicate automation, but context distinguishes a beacon from ordinary polling.' },
  { match: /\b(msfconsole|metasploit|\buse\b.*\/|set\s+(rhosts|lhost|payload)|\bexploit\b|\brun\b)\b/i, title: 'Drive the framework deliberately', method: 'Reach for an exploitation framework only after reconnaissance identifies a specific service and a matching module. Treat the module as a form to complete: confirm the target, options and payload before firing, so the result is attributable rather than lucky.', observe: 'Check that every required option is set, which session type you receive, and the account context it runs as. A returned session proves access; it does not yet prove privilege or impact.' },
  { match: /\b(crackmapexec|netexec|\bnxc\b|evil-winrm|psexec)\b/i, title: 'Validate access across the domain', method: 'Use credential-spraying and remote-execution tooling after you hold a credential and want to know where it is accepted. Start by validating the credential read-only across hosts before any execution, exactly as an operator confirms blast radius before acting.', observe: 'Record which hosts accept the credential, the privilege level reported (for example Pwn3d!), and where access stops. Reuse across many hosts is the finding; one accepted login is only the start.' },
  { match: /\b(checksec|pwndbg|ropper|pattern_create|cyclic)\b/i, title: 'Assess exploitability under protections', method: 'Inspect a binary\'s compiled-in protections before assuming a bug is exploitable. Modern mitigations change the outcome of the same flaw, so knowing which are present tells you whether a crash is merely a crash.', observe: 'Note NX/DEP, stack canaries, PIE/ASLR and RELRO status. Each enabled mitigation removes an easy path; absent ones suggest where control might be regained.' },
  { match: /\b(airmon-ng|airodump-ng|aireplay-ng|aircrack-ng|wifite|hcxdumptool)\b/i, title: 'Work the radio methodically', method: 'Use wireless capture tooling when the question is about a specific network and its clients. Put the interface into monitor mode, scope the capture to the target channel and BSSID, and capture only the frames the attack actually needs.', observe: 'Track the BSSID, channel, encryption type, connected clients and whether the handshake or enough IVs were captured. Capturing traffic is not recovering a key — confirm you have the material the next step requires.' },
  { match: /\b(yara|clamscan|capa|pefile|peframe)\b/i, title: 'Match the sample against known behaviour', method: 'Apply signature and capability tooling after basic static triage, when you want to connect an unknown sample to known families or behaviours. Rules describe patterns, not verdicts — use them to prioritise, not to conclude.', observe: 'Record which rule matched and on what bytes or strings. A match is a lead to corroborate; absence of a match is not proof the sample is safe.' },
  { match: /\b(reg query|wevtutil|schtasks|dir \/|\bsc\b query|powershell|get-|wmic)\b/i, title: 'Read the Windows source record', method: 'Query the operating system\'s own records rather than trusting a dashboard summary. On Windows, the authoritative evidence lives in the event log, registry, scheduled tasks and service configuration — go to the source that recorded the action.', observe: 'Tie each record to a provider and event ID, the account and time, and the exact value written. An entry is a statement by a source; corroborate it before attributing intent.' },
  { match: /\b(nc|ncat|netcat)\b/i, title: 'Speak to the service directly', method: 'Use a raw connection tool when you want to see exactly what a service says, with no client interpretation in the way. It is the simplest way to read a banner, test a port or send a handcrafted request.', observe: 'Read the banner, prompt or response verbatim, including version strings and unexpected text. What the service volunteers on connection is often the first real lead.' },
];

const FALLBACK = {
  title: 'Test the next evidence hypothesis',
  method: 'Choose the action that answers the current question with the least change to the environment. Run one controlled step, read the result, and revise the hypothesis before continuing.',
  observe: 'Identify the exact output that confirms or rejects the hypothesis. Distinguish what the evidence proves from what still needs corroboration.',
};

function cleanObjective(text: string) {
  return text.replace(/^[`'"]+|[`'"]+$/g, '').replace(/\s+/g, ' ').trim();
}

export function learningFrameFor(scenario: LabScenario, index: number): LabLearningFrame {
  const raw = scenario.objectives[index];
  const step: ObjectiveStep = typeof raw === 'string' ? { text: raw } : raw;
  // Detect the technique from the objective text first; if the objective is phrased descriptively
  // (e.g. "Review the browser history export"), fall back to the matching hint, which carries the
  // actual command (e.g. `cat ...`). This gives far more labs a specific "why/how" framing rather
  // than the generic one.
  const hintForStep = scenario.hints[index] ?? '';
  const matchedTechnique =
    TECHNIQUES.find(item => item.match.test(step.text)) ??
    TECHNIQUES.find(item => item.match.test(hintForStep));
  const technique = matchedTechnique ?? FALLBACK;
  const prior = index === 0 ? 'The brief is all you know so far.' : 'The previous stage produced a lead. Treat it as evidence, not as the answer.';
  return {
    title: technique.title,
    scene: step.scene ?? `${prior} Your next task is to decide what would reduce uncertainty before you take another action.`,
    question: step.question ?? `What does this stage need to establish, and which result would be strong enough to justify moving forward?`,
    method: cleanObjective(step.text),
    why: step.why ?? technique.method,
    observe: step.observe ?? technique.observe,
    decision: step.decision ?? 'State what the result confirms, what it does not confirm, and the next action the evidence supports.',
    exactHint: (matchedTechnique ? scenario.hints.find(hint => matchedTechnique.match.test(hint)) : undefined) ?? scenario.hints[index],
  };
}

