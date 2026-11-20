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
  /** A situated, cinematic beat for this stage. `{target}` is replaced with the lab's target. */
  scene: string;
  /** The sharp offensive/investigative question this stage must answer. */
  question: string;
  method: string;
  observe: string;
};

const TECHNIQUES: Technique[] = [
  { match: /\b(nmap|masscan|rustscan)\b/i,
    title: 'Build the service map',
    scene: 'You are standing in front of {target} with nothing but its address. Everything you decide next — every tool, every assumption — depends on knowing what is actually listening behind it. So you knock on every door before you assume anything about the building.',
    question: 'Which services and versions does {target} expose, and which of them turns a bare port number into a real lead?',
    method: 'Choose service discovery when you know the host but do not yet know which network services deserve attention. Start broad enough to avoid assumptions, then use version detection to turn port numbers into testable hypotheses.',
    observe: 'Record each open port, the detected protocol and version, and any mismatch between the expected service and the returned banner. An open port proves reachability; a version string alone does not prove vulnerability.' },
  { match: /\bssh\b/i,
    title: 'Establish and verify the foothold',
    scene: 'The evidence has handed you a working credential. The moment you log in, your whole world shifts — the files, the commands, the privileges all belong to {target} now, not your own box. But a credential that "should" work is not the same as a shell.',
    question: 'Does this credential actually open a session on {target}, and who are you the instant you are inside?',
    method: 'Use SSH when the evidence provides a valid account on an in-scope host. Treat the login as a change of evidence context: after connecting, local files and commands belong to the remote host.',
    observe: 'Check the hostname, user identity and working directory after login. A successful session proves the credential works; it does not prove elevated privilege.' },
  { match: /\b(whoami|\bid\b|hostname|pwd)\b/i,
    title: 'Get your bearings in the session',
    scene: 'A shell opened — but a blinking cursor tells you almost nothing. Which machine is this? Which account are you wearing? Full shell or a cage? Before you reach for anything clever, you work out exactly where you are standing.',
    question: 'Which account, host and privilege level does this session actually have right now?',
    method: 'Use identity and location commands before deeper work so later changes can be compared with a known starting state. This prevents confusing the attacker workstation with a remote session or mistaking a normal user for root.',
    observe: 'Read the username or UID, group memberships, hostname and current path. These values define what the present shell can reasonably access.' },
  { match: /\b(find|locate)\b/i,
    title: 'Let the filesystem lead you',
    scene: 'What you need is not sitting in the obvious place — if it were, this would be over. Rather than guessing paths and burning time, you make the filesystem itself point at the interesting thing.',
    question: 'Where on {target} does the artifact that moves this engagement forward actually live?',
    method: 'Use a filesystem search when the relevant artifact is not in a known path. Narrow by name, type or permission so the output answers the investigation question instead of producing an unreadable inventory.',
    observe: 'Look for paths that differ from standard system locations, unusual owners or permission bits, recent artifacts, and names that fit the scenario. A path is a lead; inspect it before drawing a conclusion.' },
  { match: /\b(grep|ripgrep|\brg\b)\b/i,
    title: 'Cut the noise to the signal',
    scene: 'The record you need is buried under thousands of routine lines, and scrolling will cost you the engagement. You stop reading and start filtering — one pattern, the one your current theory predicts.',
    question: 'Which lines in all this noise confirm — or kill — the theory you are working right now?',
    method: 'Use text filtering when the source is known but the event of interest is buried among routine records. Select a pattern tied to the hypothesis, then retain enough surrounding context to understand sequence and outcome.',
    observe: 'Compare timestamps, source identifiers, accounts, outcomes and adjacent lines. Count repeated failures, then look for a success or a second data source that changes the interpretation.' },
  { match: /\b(cat|less|head|tail|type)\b/i,
    title: 'Read what the artifact really says',
    scene: 'You have found it. Its name hinted at something useful — but a filename is a promise, not proof. Before you build your next move on top of it, you read what it actually contains.',
    question: 'What does this file actually say, and what can you prove from it versus what you are still guessing?',
    method: 'Read the source artifact after discovery rather than treating its filename as proof. Choose a full read for short files and a bounded or paged read for large evidence so important context is not lost.',
    observe: 'Separate facts written in the artifact from your inference. Note provenance, timestamps, configuration values and any proof token returned by the lab.' },
  { match: /\b(curl|wget|http)\b/i,
    title: 'Bend one request and watch',
    scene: 'You have an endpoint and one input you want to lean on. The temptation is to throw everything at it — but that way you never know what mattered. So you send a clean request first, change exactly one thing, and watch how the server reacts.',
    question: 'How does {target}\'s response change when you vary this single input — and does that change mean impact?',
    method: 'Use a direct HTTP request after identifying an endpoint and the single input you want to vary. Keep the baseline request so response status, body and authorization behavior can be compared cleanly.',
    observe: 'Compare status codes, response fields, redirects, error detail and data belonging to another identity. A different response proves changed behavior; explain why that behavior creates impact.' },
  { match: /\b(gobuster|ffuf|feroxbuster|dirsearch)\b/i,
    title: 'Map what they forgot to link',
    scene: 'The homepage is only the part they want you to see. The real attack surface is in the corners nobody linked — the staging panel, the old backup, the debug route left on. You go looking for the doors that are not on the map.',
    question: 'What endpoints exist on {target} that the visible site never advertises?',
    method: 'Use content discovery when the visible page cannot represent the whole application. Enumerate paths within scope, then prioritize results by status, naming and likely sensitivity instead of attacking every response.',
    observe: 'Notice admin, backup, debug, API and upload paths, redirects, and size outliers. Discovery supplies leads; follow-up requests establish whether a lead is exposed or vulnerable.' },
  { match: /\b(ftp|ftp-get)\b/i,
    title: 'Try the door already ajar',
    scene: 'Recon flagged a file service on {target}. Before you think about cracking credentials, you test what it hands out for free — because the fastest wins in this job are the doors someone left open, not the ones you force.',
    question: 'What does this file service give up to an anonymous visitor, and is any of it sensitive?',
    method: 'Use the service-specific client after reconnaissance identifies FTP. Test the least-privileged access the server advertises before attempting credentials, then enumerate and retrieve only in-scope files.',
    observe: 'Confirm whether anonymous access is accepted, which directory is exposed and what the retrieved file actually contains. Service access and sensitive-data exposure are separate findings.' },
  { match: /\b(sudo|SUID|perm -4000)\b/i,
    title: 'Find the crack in the ceiling',
    scene: 'You are a low-privilege user and the ceiling is right above your head. Somewhere on {target} is a trusted program you are allowed to run as someone more powerful — and if its behaviour can be bent, that trust becomes your way up.',
    question: 'Which allowed command or special binary on {target} crosses the privilege boundary when you push on it?',
    method: 'Inspect delegated privilege and special file permissions after establishing a low-privilege baseline. The goal is to identify a trusted program whose allowed behavior crosses the boundary, then verify impact in the lab.',
    observe: 'Read the exact allowed binary, whether a password is required, the file owner and permission bits, and the identity after execution. A suspicious rule is a finding; privileged evidence confirms exploitability.' },
  { match: /\b(strings|file |objdump|readelf)\b/i,
    title: 'Read the binary without running it',
    scene: 'An unknown binary sits in front of you, daring you to run it. You do not — running it blind is a risk a professional does not take. Instead you read what it already carries inside, without executing a single instruction.',
    question: 'What do the file format and its embedded strings reveal before you ever run it?',
    method: 'Begin with static inspection when running an unknown sample would add risk. Identify the file format, then extract readable strings or imports to form a capability hypothesis.',
    observe: 'Look for embedded paths, domains, credentials, error messages and security-relevant APIs. Strings are clues and may be unused; corroborate them before making a capability claim.' },
  { match: /\b(hashcat|john)\b/i,
    title: 'Test how well the hash holds',
    scene: 'You are holding a hash, not a password — useless until you break it. Offline and patient, far from any lockout, you measure how well it resists an educated guess.',
    question: 'Does this hash — and the way it was generated — fall to realistic offline cracking?',
    method: 'Use offline cracking only after obtaining an authorised hash and identifying its format. Select the correct mode and a justified candidate source so the result evaluates password strength rather than random guessing.',
    observe: 'Confirm the hash type, cost parameters, candidate source and recovered value. A fast recovery may implicate the password, the hashing configuration, or both.' },
  { match: /\b(smbclient|rpcclient|enum4linux|secretsdump)\b/i,
    title: 'Open up the Windows trust surface',
    scene: 'A Windows service answered on {target}. Before you touch anything sensitive, you map what it exposes — the shares, the accounts, the level of access it hands a stranger — because in a domain, one careless share is a doorway to everything.',
    question: 'What does {target} share, and at what level of access, across the trust boundary?',
    method: 'Use SMB or directory-aware tooling after discovery confirms the service and scope. Start with enumeration and available access, then move to sensitive operations only when evidence and permissions justify them.',
    observe: 'Track domain or workgroup names, shares, access level, account identity and whether returned data crosses the expected trust boundary.' },
  { match: /\b(aws|s3|metadata|169\.254\.169\.254)\b/i,
    title: 'Follow the cloud identity',
    scene: 'The cloud has no perimeter to breach — it has identities and policies, and the whole game is who you are allowed to be. You separate what is publicly reachable from what your current identity can actually touch.',
    question: 'Who are you to this cloud account, and exactly which resource or credential can that identity reach?',
    method: 'Cloud investigations require separating public reachability, the active identity and that identity’s permissions. Inspect each layer in order so you can name the failed control precisely.',
    observe: 'Record the caller identity, resource name, policy boundary and exact object or credential exposed. Avoid describing every cloud exposure as simply “public.”' },
  { match: /\b(dig|nslookup|dns|tcpdump|wireshark)\b/i,
    title: 'Follow the evidence on the wire',
    scene: 'The answer is not in a file on {target} — it is in the traffic itself. You filter the capture down to the one conversation your question is about and read it in order, the way it actually happened.',
    question: 'What does the network evidence prove about resolution, connection or sequence here?',
    method: 'Use protocol-aware inspection when the question concerns resolution, repeated connections or traffic sequence. Filter on the field tied to the hypothesis and preserve timing and direction.',
    observe: 'Inspect source and destination, query or host name, response value, interval, protocol and failures. Repetition can indicate automation, but context distinguishes a beacon from ordinary polling.' },
  { match: /\b(msfconsole|metasploit)\b|\buse\s+(exploit|auxiliary|post|payload)\/|\bset\s+(rhosts|lhost|payload)\b|\bexploit\/|\bexploit\s+multi\//i,
    title: 'Load the module with intent',
    scene: 'Recon pointed at one specific weakness on {target}, and now there is a matching tool for it. You do not spray exploits and hope — you complete the module like a form, target and options and payload, so when it fires the result is yours, not luck.',
    question: 'Is {target} actually exploitable by this module, and what access does a successful run hand back?',
    method: 'Reach for an exploitation framework only after reconnaissance identifies a specific service and a matching module. Treat the module as a form to complete: confirm the target, options and payload before firing, so the result is attributable rather than lucky.',
    observe: 'Check that every required option is set, which session type you receive, and the account context it runs as. A returned session proves access; it does not yet prove privilege or impact.' },
  { match: /\b(crackmapexec|netexec|\bnxc\b|evil-winrm|psexec)\b/i,
    title: 'Measure the blast radius',
    scene: 'You hold a credential, and now the only question that matters is how far it reaches. Before you execute anything, you spray it read-only across the hosts and watch where it is accepted — mapping the blast radius before you pull the trigger.',
    question: 'Where across the network is this credential accepted, and at what privilege?',
    method: 'Use credential-spraying and remote-execution tooling after you hold a credential and want to know where it is accepted. Start by validating the credential read-only across hosts before any execution, exactly as an operator confirms blast radius before acting.',
    observe: 'Record which hosts accept the credential, the privilege level reported (for example Pwn3d!), and where access stops. Reuse across many hosts is the finding; one accepted login is only the start.' },
  { match: /\b(checksec|pwndbg|ropper|pattern_create|cyclic)\b/i,
    title: 'Weigh the bug against the defences',
    scene: 'The bug is real — but the compiler fights back now. Before you claim this crash is exploitable, you read which protections stand between a segfault and real control of {target}.',
    question: 'Which mitigations are in play, and do they downgrade this bug to a mere crash or leave a path to control?',
    method: 'Inspect a binary\'s compiled-in protections before assuming a bug is exploitable. Modern mitigations change the outcome of the same flaw, so knowing which are present tells you whether a crash is merely a crash.',
    observe: 'Note NX/DEP, stack canaries, PIE/ASLR and RELRO status. Each enabled mitigation removes an easy path; absent ones suggest where control might be regained.' },
  { match: /\b(airmon-ng|airodump-ng|aireplay-ng|aircrack-ng|wifite|hcxdumptool)\b/i,
    title: 'Work the radio, not the wire',
    scene: 'This target is not on a cable — it is on the air, and the air does not respect walls. You put the card into monitor mode and tighten the capture to just this network and channel, grabbing only the frames the attack truly needs.',
    question: 'What does the air reveal about this network, its clients and its encryption?',
    method: 'Use wireless capture tooling when the question is about a specific network and its clients. Put the interface into monitor mode, scope the capture to the target channel and BSSID, and capture only the frames the attack actually needs.',
    observe: 'Track the BSSID, channel, encryption type, connected clients and whether the handshake or enough IVs were captured. Capturing traffic is not recovering a key — confirm you have the material the next step requires.' },
  { match: /\b(yara|clamscan|capa|pefile|peframe)\b/i,
    title: 'Place the sample by its behaviour',
    scene: 'Static triage gave you a rough shape of the sample. Now you match it against behaviour the world has already seen and named — placing it, without ever letting it run.',
    question: 'Does this sample match a known family or capability pattern, and what does that tell the responders?',
    method: 'Apply signature and capability tooling after basic static triage, when you want to connect an unknown sample to known families or behaviours. Rules describe patterns, not verdicts — use them to prioritise, not to conclude.',
    observe: 'Record which rule matched and on what bytes or strings. A match is a lead to corroborate; absence of a match is not proof the sample is safe.' },
  { match: /\b(reg query|wevtutil|schtasks|dir \/|\bsc\b query|powershell|get-|wmic)\b/i,
    title: 'Go to the Windows source of truth',
    scene: 'A dashboard summarised what happened on {target} — but you do not build a case on a summary. You go straight to the record Windows itself wrote: the event log, the registry, the task that was scheduled.',
    question: 'What does the authoritative Windows record say about who did what, and when?',
    method: 'Query the operating system\'s own records rather than trusting a dashboard summary. On Windows, the authoritative evidence lives in the event log, registry, scheduled tasks and service configuration — go to the source that recorded the action.',
    observe: 'Tie each record to a provider and event ID, the account and time, and the exact value written. An entry is a statement by a source; corroborate it before attributing intent.' },
  { match: /\b(nc|ncat|netcat)\b/i,
    title: 'Hear the service in its own words',
    scene: 'You want to know what {target}\'s service really says — not what a polished client decides to show you. So you open a raw connection and simply listen to what it volunteers.',
    question: 'What does this service give up the moment you connect to it directly?',
    method: 'Use a raw connection tool when you want to see exactly what a service says, with no client interpretation in the way. It is the simplest way to read a banner, test a port or send a handcrafted request.',
    observe: 'Read the banner, prompt or response verbatim, including version strings and unexpected text. What the service volunteers on connection is often the first real lead.' },
];

const FALLBACK = {
  title: 'Take the next deliberate step',
  scene: 'Every move here should answer a question you can say out loud. You resist the urge to flail at the target and instead pick the smallest next step that genuinely advances the engagement — and you are ready to justify why.',
  question: 'What single fact does this stage need to establish, and what result would prove it?',
  method: 'Choose the action that answers the current question with the least change to the environment. Run one controlled step, read the result, and revise the hypothesis before continuing.',
  observe: 'Identify the exact output that confirms or rejects the hypothesis. Distinguish what the evidence proves from what still needs corroboration.',
};

function cleanObjective(text: string) {
  return text.replace(/^[`'"]+|[`'"]+$/g, '').replace(/\s+/g, ' ').trim();
}

/** A human-friendly name for the lab's primary target, used to situate generated scenes. */
function targetOf(scenario: LabScenario): string {
  const host = scenario.network[0];
  if (host) return host.ip || host.hostname;
  return 'the system';
}

export function learningFrameFor(scenario: LabScenario, index: number): LabLearningFrame {
  const raw = scenario.objectives[index];
  const step: ObjectiveStep = typeof raw === 'string' ? { text: raw } : raw;
  // Detect the technique from the objective text first. When several tools are named (e.g.
  // "Use anonymous FTP to find SSH credentials"), prefer the one that appears EARLIEST in the text —
  // that is the action this stage is really about, not a tool it merely refers to. If the objective
  // is phrased descriptively with no tool at all (e.g. "Review the browser history export"), fall
  // back to the matching hint, which carries the actual command (e.g. `cat ...`).
  const hintForStep = scenario.hints[index] ?? '';
  const earliestMatch = (text: string) => {
    let best: { tech: Technique; at: number } | undefined;
    for (const tech of TECHNIQUES) {
      const m = tech.match.exec(text);
      if (m && (best === undefined || m.index < best.at)) best = { tech, at: m.index };
    }
    return best?.tech;
  };
  const matchedTechnique = earliestMatch(step.text) ?? earliestMatch(hintForStep);
  const technique = matchedTechnique ?? FALLBACK;
  const target = targetOf(scenario);
  const fill = (s: string) => s.replace(/\{target\}/g, target);
  return {
    title: technique.title,
    scene: step.scene ?? fill(technique.scene),
    question: step.question ?? fill(technique.question),
    method: cleanObjective(step.text),
    why: step.why ?? technique.method,
    observe: step.observe ?? technique.observe,
    decision: step.decision ?? 'State what the result confirms, what it does not confirm, and the next action the evidence supports.',
    exactHint: (matchedTechnique ? scenario.hints.find(hint => matchedTechnique.match.test(hint)) : undefined) ?? scenario.hints[index],
  };
}
