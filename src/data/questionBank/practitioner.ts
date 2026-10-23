import type { TypedQuestion } from '../../types';

/** Kali validation/access, Metasploit and defensive practitioner track lessons. */
export const PRACTITIONER_QUESTIONS: Record<string, TypedQuestion[]> = {
  'kali-validation-1': [
    { prompt: 'Reconnaissance is the reduction of what about an environment?', answer: 'uncertainty' },
    { prompt: 'A search result is a what, not a confirmed vulnerability?', answer: 'clue', accept: ['a clue'] },
  ],
  'kali-validation-2': [
    { prompt: 'Which nmap flag performs host discovery without the port scan?', answer: '-sn' },
    { prompt: 'On a local IPv4 Ethernet segment, discovery can use which protocol?', answer: 'ARP' },
  ],
  'kali-validation-3': [
    { prompt: 'Which port conventionally carries HTTPS?', answer: '443' },
    { prompt: 'A string supplied by the software that can be hidden or altered is called a what?', answer: 'banner', accept: ['a banner'] },
  ],
  'kali-validation-4': [
    { prompt: 'Which framework’s options and modules does this lesson explain?', answer: 'Metasploit' },
    { prompt: 'Which vendor document lists affected releases and fixed builds?', answer: 'advisory', accept: ['vendor advisory'] },
  ],
  'msf-depth-1': [
    { prompt: 'Which command starts the Metasploit console?', answer: 'msfconsole' },
    { prompt: 'Which module type performs supporting actions such as service identification?', answer: 'auxiliary' },
  ],
  'msf-depth-2': [
    { prompt: 'Which msfconsole command reports the database connection?', answer: 'db_status' },
    { prompt: 'Which database backs Metasploit’s record store?', answer: 'PostgreSQL', accept: ['postgres'] },
  ],
  'msf-collection-1': [
    { prompt: 'What separates Metasploit records into logical groups?', answer: 'workspaces', accept: ['workspace'] },
    { prompt: 'A host record represents an imported or created what, not permission to test?', answer: 'observation', accept: ['an observation'] },
  ],
  'kali-access-1': [
    { prompt: 'Which Metasploit payload has its own command set and channels?', answer: 'Meterpreter' },
    { prompt: 'A prompt is only an interaction what?', answer: 'channel' },
  ],
  'kali-access-2': [
    { prompt: 'A derived value used to verify a password is a password what?', answer: 'hash' },
    { prompt: 'Finding an exposed credential does not automatically establish its what?', answer: 'validity' },
  ],
  'kali-access-3': [
    { prompt: 'Which kind of SSH forward is drawn in this lesson?', answer: 'local', accept: ['local forward'] },
    { prompt: 'In the destination position, 127.0.0.1 means the loopback of which side?', answer: 'server', accept: ['server loopback', 'ssh server'] },
  ],
  'kali-access-4': [
    { prompt: 'State that can enable later activity is called what?', answer: 'persistence' },
    { prompt: 'Which kind of authorized SSH key may permit a future login?', answer: 'public key', accept: ['ssh public key'] },
  ],
  'msf-depth-3': [
    { prompt: 'Which option typically names the target host(s) the framework contacts?', answer: 'RHOSTS' },
    { prompt: 'For a reverse payload, which side initiates the connection back?', answer: 'target', accept: ['the target'] },
  ],
  'msf-collection-2': [
    { prompt: 'Which command lists a module’s configurable options?', answer: 'show options' },
    { prompt: 'Which command describes a module’s details and contract?', answer: 'info' },
  ],
  'defensive-triage-telemetry-contracts': [
    { prompt: 'What specifies a source’s fields, types, time zone, interval and owner?', answer: 'source contract', accept: ['contract', 'event contract'] },
    { prompt: 'An account name is a weak identifier because it may be what?', answer: 'reused' },
  ],
  'defensive-triage-triage-decisions': [
    { prompt: 'An alert is a rule matching evidence, not a what?', answer: 'verdict', accept: ['a verdict'] },
    { prompt: 'In case notes, separate observations from what?', answer: 'interpretation' },
  ],
  'defensive-triage-handoff': [
    { prompt: 'Which time standard should a handoff timeline use?', answer: 'UTC' },
    { prompt: 'Besides the next review time, the handoff names the case what?', answer: 'owner', accept: ['case owner'] },
  ],
  'defensive-triage-host-telemetry': [
    { prompt: 'An authenticated context in which processes run is a logon what?', answer: 'session' },
    { prompt: 'Each child process gets a process what?', answer: 'identifier', accept: ['id', 'pid', 'process identifier'] },
  ],
  'defensive-triage-network-evidence': [
    { prompt: 'Which DNS record type describes an IPv6 address?', answer: 'AAAA' },
    { prompt: 'A packet capture records what crossed an observation what?', answer: 'point', accept: ['observation point'] },
  ],
  'defensive-investigation-identity-timelines': [
    { prompt: 'Display names and IP addresses are weak correlation what?', answer: 'keys' },
    { prompt: 'A join across two sources is a what until the field semantics agree?', answer: 'hypothesis', accept: ['a hypothesis'] },
  ],
  'defensive-investigation-endpoint-network': [
    { prompt: 'Process IDs can be what, so pair them with start time or a GUID?', answer: 'reused' },
    { prompt: 'Following a process’s parents is called process what?', answer: 'ancestry' },
  ],
  'defensive-investigation-containment': [
    { prompt: 'Containment reduces harm while what continues?', answer: 'investigation', accept: ['the investigation'] },
    { prompt: 'Which kind of actions does this lesson prefer you choose?', answer: 'reversible' },
  ],
  'defensive-investigation-forensic-collection': [
    { prompt: 'Recording how evidence was obtained preserves its what?', answer: 'provenance' },
    { prompt: 'Which state can disappear when a process ends or a host restarts: runtime or persistent?', answer: 'runtime', accept: ['runtime state'] },
  ],
  'defensive-investigation-intelligence-scoping': [
    { prompt: 'An address or domain is an what?', answer: 'observable', accept: ['an observable'] },
    { prompt: 'Linking activity to a specific actor is called what?', answer: 'attribution' },
  ],
  'defensive-detection-detection-contract': [
    { prompt: 'Which document names a detection’s behaviour, assets, fields, window and response?', answer: 'specification', accept: ['detection specification'] },
    { prompt: 'Describe the behaviour before selecting a query what?', answer: 'language' },
  ],
  'defensive-detection-hypothesis-hunting': [
    { prompt: 'A hunt begins with a bounded what?', answer: 'hypothesis' },
    { prompt: 'Well-designed hunts can produce useful what results?', answer: 'negative' },
  ],
  'defensive-detection-automation-safety': [
    { prompt: 'Collecting context without changing anything is called what?', answer: 'enrichment' },
    { prompt: 'Changing the environment to limit harm is called what?', answer: 'containment' },
  ],
  'defensive-detection-sysmon-sigma-validation': [
    { prompt: 'Which Windows tool records host activity in its operational channel?', answer: 'Sysmon' },
    { prompt: 'In which vendor-neutral format is the detection written?', answer: 'Sigma' },
  ],
  'defensive-detection-malware-triage-yara': [
    { prompt: 'Which signature language is used for the triage rule?', answer: 'YARA' },
    { prompt: 'Alongside size and path, which cryptographic value do you record for the file?', answer: 'digest', accept: ['hash'] },
  ],
  'defensive-command-evidence-integrity': [
    { prompt: 'What kind of evidence collection does this lesson call for?', answer: 'proportionate' },
    { prompt: 'Which kind of information should be prioritised first because it changes fastest?', answer: 'volatile' },
  ],
  'defensive-command-incident-command': [
    { prompt: 'Which role coordinates workstreams, decision authority and priorities?', answer: 'incident lead' },
    { prompt: 'The first step is to assign what rights?', answer: 'decision', accept: ['decision rights'] },
  ],
  'defensive-command-recovery-exercises': [
    { prompt: 'Test restoration, not backup what?', answer: 'presence' },
    { prompt: 'What should you record about the actual recovery?', answer: 'duration', accept: ['recovery duration'] },
  ],
  'defensive-command-response-automation': [
    { prompt: 'In which language’s standard library is the decision planner implemented?', answer: 'Python' },
    { prompt: 'Retries must be handled without duplicate what?', answer: 'actions' },
  ],
  'defensive-leadership-architecture': [
    { prompt: 'Start the model with a critical business what?', answer: 'transaction' },
    { prompt: 'Network ____ alone does not make a defensible architecture.', answer: 'segmentation' },
  ],
  'defensive-leadership-risk-metrics': [
    { prompt: 'A risk owner can accept the risk or do what to it?', answer: 'reduce', accept: ['reduce it'] },
    { prompt: 'Prioritise using business context rather than raw vulnerability what?', answer: 'counts' },
  ],
  'defensive-leadership-program-capstone': [
    { prompt: 'The capstone builds an evidence-backed improvement what?', answer: 'plan' },
    { prompt: 'You must defend the plan’s what?', answer: 'tradeoffs', accept: ['trade-offs'] },
  ],
  'defensive-leadership-modern-defense-lab': [
    { prompt: 'Snapshots and a what procedure keep lab experiments repeatable?', answer: 'reset' },
    { prompt: 'Measure evidence quality and recovery rather than tool what?', answer: 'count' },
  ],
};
