import type { LabNarrative, LabScenario } from './types';

/** KC7-style case scenes for flagship labs, keyed by scenario id and merged into the scenario at load
 *  time (see data/labs.ts). Each puts the learner in a role, sets a realistic scene, names the stakes
 *  and the real event/technique it reconstructs — so a lab reads as an investigation, not a checklist.
 *  All environments are simulated and isolated; "based on" means a training reconstruction, never live. */
export const LAB_NARRATIVES: Record<string, LabNarrative> = {
  // ── Pre-security: first contact with each tool ────────────────────────────────────────────────
  'pre-lab-orientation': {
    role: 'New analyst on your first day in the DarkWorld training range',
    scene: 'Your mentor drops a folder on your desk and says: "Before you touch a real target, prove you can work a room calmly. Read the brief, look before you type, and bring me the one piece of evidence that proves you were here."',
    stakes: 'Every habit you build now — read first, act second, record what you find — is the difference between a tidy investigation and a mess no one can reproduce later.',
    realBasis: 'The read–try–observe–record loop every professional analyst and tester uses on real engagements.',
    mission: 'Learn the room, then capture the training flag without guessing.',
  },

  // ── Foundations: Linux, Network ──────────────────────────────────────────────────────────────
  'linux-fundamentals': {
    role: 'New team member finding your way around a shared Linux workstation',
    scene: 'A teammate left a training artifact somewhere under /root/projects, mixed in with ordinary notes and a stale database export. "Find it and read it," they said, "but do not touch the real project files." You have a root shell and nothing else to go on.',
    stakes: 'Moving confidently around a Linux filesystem — knowing where you are, who you are, and how to search without damaging anything — is the ground every later skill stands on.',
    realBasis: 'Core Linux navigation and search skills every analyst and tester relies on daily.',
    mission: 'Locate and read the artifact without altering the project files.',
  },
  'network-recon': {
    role: 'Junior penetration tester on an authorised engagement',
    scene: 'The scope document names exactly one host: 10.10.20.5. Nothing else — no services, no versions, no credentials. "That is the whole engagement," your lead says. "Tell me everything it runs, then find what someone left lying around on it."',
    stakes: 'You never assume what a machine runs — you fingerprint it. The quality of everything that follows depends on how thoroughly you map the target first.',
    realBasis: 'The reconnaissance-first methodology (nmap service scan, then service enumeration) that opens every real test.',
    mission: 'Fingerprint every service, then retrieve the file left on the host.',
  },

  // ── Web / API / Bug Bounty ───────────────────────────────────────────────────────────────────
  'web-idor-profile-api': {
    role: 'Application security tester reviewing a mobile backend',
    scene: 'Northgate Social\'s API returns a user profile for any numeric user_id you ask for — and never checks that the id belongs to you. You hold the token for user 42. The low, single-digit IDs are the oldest accounts on the system, which in practice means the service and admin accounts created on day one.',
    stakes: 'Changing one number in a request to read someone else\'s data is among the most common and damaging web flaws in the real world — and the easiest to miss if you only ever request your own id.',
    realBasis: 'Insecure Direct Object Reference (IDOR) / Broken Object Level Authorization — OWASP API Security Top 10 #1.',
    mission: 'Prove the missing authorization check by reaching an account that is not yours.',
  },
  'api-excessive-data-exposure-team-list': {
    role: 'API security reviewer during a pre-release assessment',
    scene: 'Teamapi27\'s team-directory endpoint looks harmless — it lists employees. But a developer returned the whole database row instead of a trimmed response, so every record quietly carries a password hash and the last four SSN digits used for HR identity checks.',
    stakes: 'The screen only showed names, so no one noticed. The API handed out far more than the UI ever displayed — exactly the mismatch attackers look for.',
    realBasis: 'Excessive Data Exposure — OWASP API Security Top 10 — where the response shape leaks fields the UI never shows.',
    mission: 'Read the raw JSON and identify the sensitive fields that should never have left the server.',
  },
  'secengineering-verbose-error-stack-trace-leak': {
    role: 'Security engineer reviewing a billing service before launch',
    scene: 'billing-api17 went to production with its framework\'s debug error handler still switched on. One malformed request, and instead of a tidy error page the server returns a full stack trace — internal file paths, the exact framework version, and the database query that failed.',
    stakes: 'A verbose error page is a free blueprint of the system\'s internals, handed to anyone who sends a broken request. It turns guesswork into a map.',
    realBasis: 'Security misconfiguration — debug mode left enabled in production (OWASP Top 10 A05).',
    mission: 'Trigger the error and catalogue exactly what the stack trace reveals.',
  },
  'bb-forgotten-staging': {
    role: 'Bug bounty hunter working an in-scope program',
    scene: 'Meridian\'s program allows testing of all their subdomains. Your recon surfaced one the main security review clearly never covered: an old staging host at 10.10.105.1. Its /debug console is hidden in robots.txt — a classic tell — but it is not truly open; a leftover QA debug key still guards it.',
    stakes: 'Forgotten staging and debug endpoints are where real bounties live: the softest, least-reviewed corners of an organisation\'s attack surface.',
    realBasis: 'Attack-surface discovery — forgotten staging subdomains and debug endpoints, a staple of real bug-bounty findings.',
    mission: 'Map the forgotten host and get past the leftover debug gate.',
  },

  // ── Active Directory ─────────────────────────────────────────────────────────────────────────
  'ad-smb-anon-domain-creds': {
    role: 'Penetration tester who has reached the internal network',
    scene: 'CORP.LOCAL\'s file server still has an anonymous SMB share left over from a migration — anyone can read it. Somewhere inside is a config file holding the password for svc_backup, a service account that was provisioned once and reused, verbatim, everywhere its function was needed.',
    stakes: 'One reused service-account password found in a forgotten share is how a single foothold becomes domain-wide access. This pattern ends more real intrusions than any exploit.',
    realBasis: 'Credential reuse via exposed SMB shares — the lateral-movement pattern behind countless Active Directory compromises.',
    mission: 'Read the share, recover the service credential, and prove where it is reused.',
  },

  // ── SOC / Forensics ──────────────────────────────────────────────────────────────────────────
  'soc-ssh-bruteforce-investigation': {
    role: 'Tier-1 SOC analyst on the morning shift',
    scene: 'An alert fired overnight: excessive authentication failures on devweb01. The auth log shows two different source IPs both logging in successfully as admin within the same hour. One is J. Alvarez\'s routine access. The other is not on the authorized-access roster at all.',
    stakes: 'A brute-force that succeeds looks almost identical to a normal login — until you check it against who is actually allowed. Miss the second IP and an intruder keeps their foothold.',
    realBasis: 'SSH brute-force triage: separating a successful attack from legitimate access using the auth log and an access roster.',
    mission: 'Find the login that should not exist and prove it against the roster.',
  },
  'forensics-timeline-analysis': {
    role: 'Incident responder examining a disk image after a suspected breach',
    scene: 'Meridian Retail\'s web root was imaged after the site "started behaving oddly". The whole site shipped in one release, so any file changed after that moment is worth explaining — but "modified after deploy" is not proof of anything on its own, because IT pushes plenty of approved patches too.',
    stakes: 'The skill here is separating the one attacker-planted file from the normal churn of legitimate changes — overclaiming on a timeline derails an entire investigation.',
    realBasis: 'Filesystem timeline analysis — using modification times against a known-good deploy baseline to find tampering.',
    mission: 'Find the file whose timing cannot be explained by the deploy or approved patches.',
  },
  'malware-static-triage-sample': {
    role: 'Malware analyst triaging a flagged email attachment',
    scene: 'An email gateway quarantined invoice_Q3_2026.exe and forwarded it to you. You will not run it. Instead you work the standard static-triage order: confirm what the file really is, pull its strings, and infer what it can do from the Windows APIs it imports.',
    stakes: 'Most triage decisions are made without ever executing the sample. Reading capability from static evidence is faster, safer, and what the SOC needs to start hunting on other machines.',
    realBasis: 'Static malware triage — file identification, strings and import analysis — the first pass in any real malware workflow.',
    mission: 'Build an evidence-based hypothesis of the sample\'s capability without running it.',
  },

  // ── Cloud ────────────────────────────────────────────────────────────────────────────────────
  'cloud-public-s3-bucket': {
    role: 'Cloud security reviewer following up on a recon finding',
    scene: 'Recon turned up the name of one of Meridian\'s storage buckets: meridian-corp-backups. Listing it only reveals filenames — you still have to request each object by hand, and the most sensitive file sits behind a nested prefix that a quick glance would miss.',
    stakes: 'A single bucket left readable has leaked the data of millions in real breaches. The finding is not "the bucket is public" — it is which exact object proves the exposure.',
    realBasis: 'Public object storage exposure — the misconfigured-S3-bucket class behind many real-world data leaks.',
    mission: 'Enumerate the bucket and retrieve the sensitive object that proves the exposure.',
  },

  // ── Binary / Crypto / Security+ ──────────────────────────────────────────────────────────────
  'binary-static-strings-crackme': {
    role: 'Reverse-engineering student facing your first crackme',
    scene: 'A small binary called crackme1 sits on your box. Run it and it demands a password. You are not going to brute-force it or debug it — you will recover the password with pure static analysis, reading what the compiled program already carries inside it.',
    stakes: 'Learning to see the secrets a binary keeps in plain sight — before reaching for heavier tools — is the foundation of everything in reverse engineering.',
    realBasis: 'Static binary analysis fundamentals: file identification and string extraction to recover embedded secrets.',
    mission: 'Recover the correct password without running a debugger.',
  },
  'crypto-bcrypt-low-cost-factor-fast-crack': {
    role: 'Security reviewer auditing a legacy password database',
    scene: 'legacy-accounts-db07 does the right thing on paper — it uses bcrypt, a sound password-hashing algorithm. The catch is the cost factor: set to 4 back in 2015 and never raised as hardware got faster, so each hash is now cheap enough to crack at speed.',
    stakes: 'A good algorithm with a weak setting gives a false sense of safety. The defect is not "they used a bad hash" — it is a tuning parameter that silently rotted as computers sped up.',
    realBasis: 'Weak bcrypt work factor — a real, distinct defect class from broken or unsalted hashing.',
    mission: 'Read the audit, understand why cost 4 is the flaw, and confirm the fast-crack impact.',
  },
  'securityplus-insufficient-log-retention-pci-dss': {
    role: 'Compliance auditor running a PCI DSS check',
    scene: 'A routine audit compares how long meridiancorp keeps its security logs — access, authentication, firewall — against PCI DSS Requirement 10.5.1, which demands a specific minimum retention window. The current policy document is on your desk; the number in it does not look right.',
    stakes: 'If logs are purged too early, an investigation months later has nothing to work with — and the organisation fails a mandatory, enforced requirement regardless of whether a breach ever happens.',
    realBasis: 'PCI DSS log-retention requirements — a real, currently-enforced compliance control.',
    mission: 'Read the policy and determine whether the retention window meets the standard.',
  },

  // ── Mobile / Wireless / IoT / AI ─────────────────────────────────────────────────────────────
  'mobile-exported-activity-admin-bypass': {
    role: 'Mobile security tester reviewing a decompiled app',
    scene: 'fieldopsapp requires an admin login before its device-wipe screen. But reading the AndroidManifest.xml pulled from the APK, you notice the login is enforced only by the Activity that draws the form — the AdminWipeActivity it hands off to is exported and can be launched directly, skipping the login entirely.',
    stakes: 'A door with a lock on the front but no lock on the side entrance. Anyone who knows the component name can trigger a full device wipe without ever authenticating.',
    realBasis: 'Exported Android components bypassing app authentication — a common real mobile authorization flaw.',
    mission: 'Find the exported component and prove the login can be skipped.',
  },
  'wireless-wep-iv-reuse-statistical-key-recovery': {
    role: 'Wireless assessor auditing a legacy industrial network',
    scene: 'A warehouse full of barcode scanners still runs on WEP — equipment so old it was never upgraded. WEP\'s flaw is structural, not a weak password: its RC4 cipher reuses a 24-bit Initialization Vector sent in the clear, and collect enough of them and the key falls out statistically.',
    stakes: 'WEP has been broken since 2005, yet it survives exactly here, in never-touched industrial kit. Recovering the key shows why "it still works" is not the same as "it is secure".',
    realBasis: 'WEP IV-reuse key recovery (the FMS/PTW attacks) — genuinely broken since the mid-2000s.',
    mission: 'Capture enough IVs to recover the WEP key statistically.',
  },
  'iot-uart-root-shell-no-auth': {
    role: 'Hardware security researcher on the bench',
    scene: 'You soldered a USB-to-serial adapter to four exposed header pads on a smart thermostat\'s circuit board and powered it on at 115200 baud. Now you review the captured boot log to see exactly what the device handed over — with not a single credential entered.',
    stakes: 'Factory debug pins left live on a shipping product are a back door anyone holding the device can walk through. The nicest login screen is irrelevant if the board offers a root console on four pads.',
    realBasis: 'Exposed UART debug console granting an unauthenticated root shell — a real, recurring IoT hardware flaw.',
    mission: 'Confirm from the capture what the boot process handed over for free.',
  },
  'ai-direct-prompt-injection-system-prompt-leak': {
    role: 'AI red-teamer assessing a customer-support chatbot',
    scene: 'acmesupportbot is told, in its hidden system prompt, never to reveal that prompt. Your job is to find out whether that instruction actually holds. You start with an honest baseline question, then test whether a direct override talks it into leaking its own rules.',
    stakes: 'A model that can be argued out of its own guardrails with a sentence of text is a new, fast-growing class of vulnerability — and the system prompt often hides keys, rules and internal logic.',
    realBasis: 'Direct prompt injection / system-prompt leakage — OWASP Top 10 for LLM Applications.',
    mission: 'Determine whether the chatbot can be made to reveal its system prompt.',
  },

  // ── Flagship capstone ────────────────────────────────────────────────────────────────────────
  'capstone-box': {
    role: 'Penetration tester running a full engagement end to end',
    scene: 'One target, 10.10.50.20, and zero information. This is the whole chain in one box: fingerprint it, find a way in, confirm the foothold, then hunt the misconfiguration that takes you to root. No hand-holding between steps — the methodology is the point.',
    stakes: 'This is the difference between knowing individual tricks and running a real engagement: choosing the right move at each stage and proving each result before moving on.',
    realBasis: 'A complete host compromise chain — recon, an FTP-leaked credential foothold, and a sudo/GTFOBins privilege escalation.',
    mission: 'Go from zero information to root, capturing both proofs along the way.',
  },
};

const CATEGORY_CONTEXT: Record<LabScenario['category'], Pick<LabNarrative, 'role' | 'stakes' | 'realBasis'>> = {
  Linux: { role: 'Linux security analyst working inside an authorised training range', stakes: 'A reliable conclusion depends on knowing which system, user and artifact produced each piece of evidence.', realBasis: 'A composite reconstruction of common Linux administration and security failures seen in production environments.' },
  Network: { role: 'Network security analyst investigating an in-scope segment', stakes: 'Incomplete service or traffic evidence can hide the one reachable path that changes the whole case.', realBasis: 'A composite reconstruction of real service-enumeration and network-analysis workflows.' },
  Web: { role: 'Application security tester on an authorised assessment', stakes: 'The team needs reproducible proof that connects a request, a broken control and measurable impact.', realBasis: 'A composite reconstruction of web weaknesses documented across real application assessments.' },
  'Active Directory': { role: 'Identity security analyst investigating a Windows domain', stakes: 'One misplaced trust relationship or reused credential can turn a workstation foothold into domain-wide impact.', realBasis: 'A composite reconstruction of Active Directory attack and defence patterns mapped to common enterprise incidents.' },
  'Bug Bounty': { role: 'Security researcher working within a published scope', stakes: 'A useful report must separate an interesting response from a reproducible vulnerability with clear impact.', realBasis: 'A composite reconstruction of recurring, responsibly disclosed bug-bounty findings.' },
  Cloud: { role: 'Cloud security analyst tracing identity, policy and data exposure', stakes: 'Cloud incidents cross identities and services quickly; naming the failed boundary determines the correct fix.', realBasis: 'A composite reconstruction of documented cloud configuration and identity failures.' },
  SOC: { role: 'SOC analyst receiving a new alert at shift handover', stakes: 'The alert is only a claim until raw telemetry establishes scope, outcome and affected identities.', realBasis: 'A fictionalised reconstruction of detection and triage patterns reported in real intrusions.' },
  Forensics: { role: 'Incident responder examining a preserved evidence set', stakes: 'Every conclusion must be reproducible from artifacts while preserving the difference between fact and inference.', realBasis: 'A composite reconstruction of host and network forensic workflows used in real response cases.' },
  'Security+': { role: 'Junior security analyst applying foundational controls', stakes: 'Simple control failures are often the easiest entry points and must be explained precisely enough to remediate.', realBasis: 'A practical reconstruction of foundational security control failures found in ordinary organisations.' },
  'Binary Analysis': { role: 'Reverse engineer triaging an unknown program in an isolated range', stakes: 'Careless execution adds risk; disciplined static evidence helps decide what deeper analysis is justified.', realBasis: 'A composite reconstruction of professional binary triage and reverse-engineering techniques.' },
  Malware: { role: 'Malware analyst supporting an active incident', stakes: 'Operations needs defensible indicators and capability assessment without contaminating the evidence or environment.', realBasis: 'A fictionalised reconstruction of behaviours reported in real malware campaigns.' },
  'Security Engineering': { role: 'Security engineer validating a system before attackers do', stakes: 'A finding becomes actionable when evidence identifies the failed control, plausible impact and verifiable fix.', realBasis: 'A composite reconstruction of production hardening and secure-design failures.' },
  API: { role: 'API security engineer testing an authorised service', stakes: 'APIs often expose data and actions the user interface hides, so raw request and authorization evidence matters.', realBasis: 'A composite reconstruction of OWASP API Security failure patterns.' },
  Cryptography: { role: 'Security reviewer evaluating how sensitive data is protected', stakes: 'Correct algorithms can still fail through weak parameters, key handling or unsafe composition.', realBasis: 'A controlled reconstruction of cryptographic implementation mistakes found in real systems.' },
  Mobile: { role: 'Mobile application security tester in an isolated lab', stakes: 'Client-side controls and exported components can expose data or actions beyond the intended application flow.', realBasis: 'A composite reconstruction of recurring Android and mobile application findings.' },
  Wireless: { role: 'Wireless security assessor working within a defined radio scope', stakes: 'Wireless trust crosses the physical perimeter, making protocol, identity and encryption evidence essential.', realBasis: 'A controlled reconstruction of documented wireless configuration and protocol weaknesses.' },
  IoT: { role: 'Embedded-device security researcher on an isolated test bench', stakes: 'Hardware access, debug interfaces and legacy services can bypass every visible application control.', realBasis: 'A composite reconstruction of recurring IoT hardware and firmware security failures.' },
  'AI Security': { role: 'AI security evaluator testing a contained model-enabled application', stakes: 'Model behaviour must be connected to application permissions and data boundaries before impact can be claimed.', realBasis: 'A controlled reconstruction of OWASP LLM application risks and documented AI-system failure patterns.' },
};

export function narrativeFor(scenario: LabScenario): LabNarrative {
  if (scenario.narrative) return scenario.narrative;
  if (LAB_NARRATIVES[scenario.id]) return LAB_NARRATIVES[scenario.id];
  const context = CATEGORY_CONTEXT[scenario.category];
  return {
    ...context,
    scene: scenario.briefing,
    mission: `Work the case from the first observable clue to ${scenario.totalFlags === 1 ? 'a verified proof' : `${scenario.totalFlags} verified proofs`}, explaining each decision from evidence.`,
  };
}
