import type { LessonDepth } from './types';

/** Beginner depth for the defensive (SOC → leadership) track. The original lessons are written at
 *  practitioner density; these additions define the vocabulary, explain each idea with an everyday
 *  comparison and show it working on concrete, invented-but-realistic records. */
export const DEFENSIVE_DEPTH: Record<string, LessonDepth> = {
  // ── SOC Tier 1 ─────────────────────────────────────────────────────────────────────────────
  'defensive-triage-telemetry-contracts': {
    keyTerms: [
      { term: 'Sensor', meaning: 'Anything that records activity and sends it for analysis: a firewall, an endpoint agent, a web server log.' },
      { term: 'Event contract', meaning: 'A written description of what a log source sends: which fields, what they mean, what time zone, how often and who owns it.' },
      { term: 'Event time vs ingestion time', meaning: 'Event time is when something happened on the source; ingestion time is when the log reached the SIEM. They can differ by seconds or hours.' },
      { term: 'Normalisation', meaning: 'Converting logs from different products into common field names (e.g. every product\'s "user" field becomes user.name) so one search works across them.' },
    ],
    before: [{
      title: 'In plain English: trust the witness before the testimony',
      paragraphs: [
        'A SIEM alert is like a witness statement. Before you believe it, you ask: was the witness actually there, could they see clearly, and is their watch set to the right time? For logs, that means knowing what each source records, what each field means and whether its clock is correct.',
        'Two simple facts trip up most beginners. First, a log line\'s timestamp may be when the event happened or when it arrived — they are different. Second, silence is not safety: if a source stops sending logs, "no alerts" can mean "no visibility". Good analysts notice when a source goes quiet.',
      ],
    }],
    after: [{
      title: 'Worked example: why the order of events looked wrong',
      paragraphs: [
        'Below, the SIEM appears to show a file being read before the user logged in — impossible. Look at the two time columns. The file server buffers its logs and sends them every five minutes, so its ingestion time is late; its event time is correct.',
        'Sorting by event time (converted to UTC) puts the story back in order: login at 09:02:11, file read at 09:03:40. The lesson: always sort an investigation by event time, keep the original value, and record which source had a delay.',
      ],
      code: 'source        event_time (UTC)   ingest_time (UTC)  action\nfileserver    09:03:40           09:08:02           read payroll.xlsx\nidentity      09:02:11           09:02:12           login success alex\n\nSorted by ingest_time  -> read appears BEFORE login (misleading)\nSorted by event_time   -> login 09:02:11, then read 09:03:40 (correct)',
      label: 'Event time tells the story; ingestion time tells you about delays',
    }],
  },

  'defensive-triage-triage-decisions': {
    keyTerms: [
      { term: 'Event', meaning: 'A single recorded fact, such as "login failed for alex at 09:01".' },
      { term: 'Alert', meaning: 'A rule saying "these events match a suspicious pattern". It is a reason to look, not proof of an attack.' },
      { term: 'Hypothesis', meaning: 'A possible explanation you test against evidence, such as "this is password guessing" or "this is a stale saved password".' },
      { term: 'Verdict', meaning: 'Your conclusion after investigation: true positive, benign true positive (real but harmless), or false positive.' },
    ],
    before: [{
      title: 'In plain English: a smoke alarm is not a fire',
      paragraphs: [
        'A smoke alarm going off means "check the kitchen", not "the house is burning". Sometimes it is toast. An alert is the same: a rule saw something that might be bad. Triage is the quick, calm check that decides whether it is toast or fire.',
        'The best habit is to write down at least two explanations before you start digging — one bad, one harmless — and then look for evidence that would prove each one wrong. That stops you from only noticing the clues that fit your first guess.',
      ],
    }],
    after: [{
      title: 'Worked example: 40 failed logins — attack or mistake?',
      paragraphs: [
        'An alert fires: "40 failed logins for svc-backup in 10 minutes". Two hypotheses: (A) someone is guessing the password; (B) a script still uses an old password after it was changed.',
        'The evidence below fits B much better: every failure comes from one known server, at a perfectly regular interval, with the reason "bad password", starting two minutes after a recorded password change. Password guessing usually comes from unfamiliar addresses and tries many accounts. The verdict is a benign true positive, and the fix is updating the script — not an incident.',
      ],
      code: 'time (UTC)  account     source          reason\n08:58       (change ticket CHG-2231: svc-backup password rotated)\n09:00:00    svc-backup  10.0.4.12 (bkp01)  bad password\n09:00:15    svc-backup  10.0.4.12 (bkp01)  bad password\n09:00:30    svc-backup  10.0.4.12 (bkp01)  bad password\n...every 15 s, same host, same account...\n\nFits A (guessing)? no: one known host, one account, machine-regular timing\nFits B (stale credential)? yes: starts 2 min after the rotation\nVerdict: benign true positive — update the backup job\'s stored credential.',
      label: 'Test both explanations against the same evidence',
    }],
  },

  'defensive-triage-handoff': {
    keyTerms: [
      { term: 'Handoff', meaning: 'Passing an open investigation to the next analyst, for example at a shift change.' },
      { term: 'Case notes', meaning: 'The running written record of an investigation: what was seen, done and decided, with times.' },
      { term: 'Provenance', meaning: 'Where a piece of evidence came from, who collected it, when and how — so it can be trusted.' },
      { term: 'Escalation', meaning: 'Passing a case to someone with more authority or expertise because it needs a decision you cannot make.' },
    ],
    before: [{
      title: 'In plain English: write it so a stranger can continue',
      paragraphs: [
        'Imagine a nurse handing a patient to the next shift. They say what is wrong, what was already given, what to watch and when to call the doctor. A SOC handoff is the same: the next analyst must be able to continue safely without phoning you at 3am.',
        'Put the most important thing first — the current assessment and any decision needed — then the timeline and the evidence. Always separate "done" from "proposed", so nobody repeats or skips an action.',
      ],
    }],
    after: [{
      title: 'Worked example: a handoff note that works',
      paragraphs: [
        'The note below fits on one screen. The next analyst knows the status, what was already done, what is waiting for approval, what is still unknown and when to look again.',
      ],
      code: 'CASE IR-0412  Status: suspected account compromise (medium confidence)\nNeeds decision: approve disabling alex@corp (owner: IT duty manager)\n\nTimeline (UTC)\n09:02  login alex from new country (identity log, event 77812)\n09:05  mailbox rule created forwarding to external address (audit 5521)\n\nDone:      exported audit records -> case folder (SHA-256 recorded)\nProposed:  disable account, remove forwarding rule\nUnknown:   whether any mail was forwarded before 09:10\nNext review: 11:00 UTC by night shift',
      label: 'Assessment first, done vs proposed kept separate',
    }],
  },

  'defensive-triage-host-telemetry': {
    keyTerms: [
      { term: 'Event ID', meaning: 'A number that identifies the type of a Windows log record, e.g. 4624 = successful logon, 4625 = failed logon.' },
      { term: 'Logon session', meaning: 'The authenticated context created when someone logs in; processes started afterwards run inside it.' },
      { term: 'Parent process', meaning: 'The program that started another program. Odd parents (Word starting PowerShell) are a classic warning sign.' },
      { term: 'journalctl', meaning: 'The Linux command for reading logs collected by systemd.' },
    ],
    before: [{
      title: 'In plain English: read the original receipt',
      paragraphs: [
        'A dashboard is a summary; the operating system\'s own log is the receipt. When something looks suspicious, go back to the receipt and read exactly what was recorded: which account, which program, started by which other program, at what time.',
        'On Windows, each record type has an Event ID number. On Linux, services write to the journal. Learning a handful of record types — successful login, failed login, new process, new service — lets you answer most first questions yourself.',
      ],
    }],
  },

  'defensive-triage-network-evidence': {
    keyTerms: [
      { term: 'A / AAAA record', meaning: 'DNS answers that give an IPv4 (A) or IPv6 (AAAA) address for a name.' },
      { term: 'SNI', meaning: 'Server Name Indication: the website name a client announces at the start of a TLS connection. Visible even though the rest is encrypted.' },
      { term: 'Retransmission', meaning: 'TCP re-sending data that was not acknowledged — a sign of loss or an unresponsive peer.' },
      { term: 'Observation point', meaning: 'Where a capture was taken. A capture only shows traffic that passed that point.' },
    ],
    before: [{
      title: 'In plain English: each layer proves a different thing',
      paragraphs: [
        'A DNS lookup is asking for directions — it proves someone asked, not that they went. A TCP handshake is arriving at the door — it proves a connection, not what was said. TLS is a sealed envelope — you can see who it was addressed to, not the letter. Only the application layer (for example readable HTTP) shows what was actually requested.',
        'So match each claim to the layer you have evidence for. "The laptop resolved evil.example" is a weaker claim than "the laptop connected to it", which is weaker than "the laptop downloaded update.exe from it".',
      ],
    }],
  },

  // ── Investigation ──────────────────────────────────────────────────────────────────────────
  'defensive-investigation-identity-timelines': {
    keyTerms: [
      { term: 'Join key', meaning: 'A field present in two log sources that lets you link their records, ideally a stable ID such as a session ID rather than a name.' },
      { term: 'Principal ID', meaning: 'A permanent, unique identifier for an account that does not change when the display name changes.' },
      { term: 'Session ID', meaning: 'An identifier for one login session, shared by the actions taken within it.' },
      { term: 'Causation vs correlation', meaning: 'Two events happening close together (correlation) does not prove one caused the other (causation).' },
    ],
    before: [{
      title: 'In plain English: follow the wristband, not the face',
      paragraphs: [
        'At a festival, many people look alike, but each wristband number is unique. Investigating an account is similar. Names and IP addresses are like faces — easily shared or changed. Session IDs and account IDs are wristbands — they let you prove that a login and a later file download belong to the same visit.',
        'Put every action on one timeline in UTC, then connect them only where a shared ID proves the link. Where you only have "these happened around the same time", say so.',
      ],
    }],
    after: [{
      title: 'Worked example: linking a login to a download',
      paragraphs: [
        'Two logins for "alex" happen two minutes apart, one from the office and one from abroad. A sensitive file is then downloaded. Which login did it?',
        'Matching on the session ID answers the question: the download carries sid=7f2c, which belongs to the overseas login. Without that shared ID you could only say both logins were "nearby in time".',
      ],
      code: 'identity log\n09:01:10  alex  login  10.0.1.25 (office)    sid=a91d\n09:03:22  alex  login  203.0.113.8 (abroad)  sid=7f2c\n\nfile audit\n09:05:47  download  /finance/q3.xlsx  sid=7f2c\n\nJoin on sid -> the download belongs to the 203.0.113.8 session.\nJoin on time only -> ambiguous; both logins were active.',
      label: 'A shared session ID turns a guess into a link',
    }],
  },

  'defensive-investigation-endpoint-network': {
    keyTerms: [
      { term: 'Process ancestry', meaning: 'The chain of which program started which: explorer.exe → winword.exe → powershell.exe.' },
      { term: 'Command line', meaning: 'The full text used to start a process, including its arguments — often the most revealing field.' },
      { term: 'Beaconing', meaning: 'Malware checking in with its controller at regular intervals, visible as periodic outbound connections.' },
      { term: 'Confidence ladder', meaning: 'Stepping from "contact seen" to "contact by this process" to "suspicious behaviour" to "confirmed impact", each needing more evidence.' },
    ],
    before: [{
      title: 'In plain English: who made the call?',
      paragraphs: [
        'Network logs tell you a phone call was made from a building to a number. Endpoint logs tell you which person in the building picked up the phone. Correlation means joining the two so you can say "this program on this laptop connected to that address".',
        'Climb the confidence ladder one rung at a time. Seeing a connection is not the same as proving data was stolen; regular connections could be an updater or malware beaconing. Each rung needs its own evidence.',
      ],
    }],
    after: [{
      title: 'Worked example: matching a connection to its process',
      paragraphs: [
        'The firewall shows a laptop contacting 198.51.100.7 every 60 seconds. The endpoint agent on that laptop records a connection to the same address and port at the same times — made by a PowerShell process started by Word.',
        'Now the finding is concrete and bounded: "On LAPTOP-22, powershell.exe (started by winword.exe, user alex) connected to 198.51.100.7:443 every 60 s from 10:14 UTC." It does not yet say what data moved — that is the next question.',
      ],
      code: 'firewall       10:14:00  10.0.2.22 -> 198.51.100.7:443  allowed\nfirewall       10:15:00  10.0.2.22 -> 198.51.100.7:443  allowed   (every 60 s)\n\nendpoint (LAPTOP-22, 10.0.2.22)\n10:13:51  process start  powershell.exe -enc JABjAD0A...  parent=winword.exe  user=alex\n10:14:00  connect        powershell.exe -> 198.51.100.7:443\n\nRung reached: process-linked periodic contact. Not yet proven: data loss.',
      label: 'Firewall says "a call"; the endpoint says "who called"',
    }],
  },

  'defensive-investigation-containment': {
    keyTerms: [
      { term: 'Containment', meaning: 'Actions that stop an incident from spreading while you keep investigating.' },
      { term: 'Host isolation', meaning: 'Cutting a computer off from the network (often via the EDR) while keeping it powered on for evidence.' },
      { term: 'Session revocation', meaning: 'Forcing an account to log out everywhere by invalidating its tokens.' },
      { term: 'Rollback', meaning: 'Undoing a containment action if it causes more harm than it prevents.' },
    ],
    before: [{
      title: 'In plain English: close the fire doors, don\'t demolish the building',
      paragraphs: [
        'When a fire starts, you close fire doors to stop it spreading — you do not knock down the building. Containment is the same: choose the smallest action that stops the harm, can be undone, and keeps the evidence.',
        'Every action has a cost. Isolating a laptop stops one person working; disabling a shared service account might stop the whole payroll system. So write down who approved the action, when it happened, what you expect it to stop and how you would undo it.',
      ],
    }],
    after: [{
      title: 'Worked example: choosing between three options',
      paragraphs: [
        'A stolen account (alex) is being used from abroad to read mail. Compare three options. Revoking sessions and resetting the password stops the attacker immediately, affects only alex and is easy to reverse. Isolating alex\'s laptop does not help — the attacker is not on it. Blocking the whole country\'s IP range would also block travelling staff.',
        'The chosen action, its time and its owner are logged so later events can be read correctly ("after 10:42 any alex login is the real user").',
      ],
      code: 'Option                    Stops harm?  Blast radius      Reversible\nRevoke sessions + reset   yes          one user          yes\nIsolate alex laptop       no           one user          yes\nBlock country IP range    partly       all travellers    yes, but noisy\n\nDecision 10:42 UTC: revoke sessions + reset (approved by IT duty manager)\nRollback trigger: none needed; user re-enrols MFA.',
      label: 'Smallest effective, reversible action',
    }],
  },

  'defensive-investigation-forensic-collection': {
    keyTerms: [
      { term: 'Volatile evidence', meaning: 'Data that disappears when a computer restarts, such as memory contents and running processes.' },
      { term: 'Acquisition', meaning: 'Making a forensic copy of evidence (memory, disk) in a documented way.' },
      { term: 'Manifest', meaning: 'A record of what was collected, from where, by whom, with which tool, when, and its hash.' },
      { term: 'Hash verification', meaning: 'Re-computing a file\'s SHA-256 later to show its bytes have not changed since collection.' },
    ],
    before: [{
      title: 'In plain English: photograph the scene before you touch it',
      paragraphs: [
        'Detectives photograph a room before moving anything, because some evidence disappears once disturbed. Computers are similar: what is in memory vanishes when the machine reboots, so it is often collected first, while files on disk last longer.',
        'Collect what answers your question, write down exactly how you collected it, and record a hash so you can later prove the copy was not altered.',
      ],
    }],
  },

  'defensive-investigation-intelligence-scoping': {
    keyTerms: [
      { term: 'Indicator', meaning: 'A specific observable — an IP address, domain or file hash — linked to malicious activity in some report.' },
      { term: 'Threat intelligence', meaning: 'Information about attackers and their tools, gathered so defenders can make better decisions.' },
      { term: 'Attribution', meaning: 'Claiming which group or person carried out an attack. It needs far more evidence than one matching indicator.' },
      { term: 'Shared hosting', meaning: 'Many unrelated websites using the same server address, so one address can serve both a bad site and an innocent one.' },
    ],
    before: [{
      title: 'In plain English: a tip-off is not a conviction',
      paragraphs: [
        'Threat intelligence is like a police tip: "a suspicious van was seen at this address last month". Useful — but the address might be a busy car park used by hundreds of innocent people. An IP address from a report can be reused, shared or reassigned.',
        'Use intelligence to decide where to look in your own logs, not as proof by itself. Saying who the attacker is (attribution) is a separate, much bigger claim that one matching address can never support.',
      ],
    }],
  },

  // ── Detection & hunting ────────────────────────────────────────────────────────────────────
  'defensive-detection-detection-contract': {
    keyTerms: [
      { term: 'Detection specification', meaning: 'A plain-language description of what behaviour a rule should catch, which data it needs and what should happen when it fires.' },
      { term: 'Regression corpus', meaning: 'A saved set of example events (bad and harmless) that a rule is tested against every time it changes.' },
      { term: 'Aggregation window', meaning: 'The time span a rule counts over, e.g. "more than 20 failures in 5 minutes".' },
      { term: 'Grouping key', meaning: 'The field a rule counts per, such as per user or per source IP.' },
    ],
    before: [{
      title: 'In plain English: write the recipe before you cook',
      paragraphs: [
        'A detection rule is a small program, and like any program it can be wrong. Before writing a query, describe in plain words what bad behaviour you want to catch, which logs show it and what an analyst should do when it fires.',
        'Then keep a set of test examples: some that must trigger the rule and some harmless ones that must not. Every time someone edits the rule, run the tests. That is how a detection stays trustworthy for years.',
      ],
    }],
    after: [{
      title: 'Worked example: a specification and its tests',
      paragraphs: [
        'Below is a tiny specification for password-spraying detection, followed by its test cases. Notice the harmless case: one user mistyping five times must not fire, otherwise analysts drown in noise.',
      ],
      code: 'Behaviour:  one source tries a few passwords against MANY accounts\nData:       identity sign-in logs (source_ip, user, result, event_time)\nLogic:      failures from one source_ip across >= 15 distinct users in 10 min\nResponse:   Tier 1 checks source ownership; block if external and unknown\n\nTest cases\n  must fire   : 203.0.113.9 fails for 22 different users in 6 min\n  must NOT fire: 10.0.1.40 fails 5 times for one user (typo)\n  must NOT fire: VPN gateway, 18 users, failures spread over 3 hours',
      label: 'Plain-language spec + tests that must pass and must not fire',
    }],
  },

  'defensive-detection-hypothesis-hunting': {
    keyTerms: [
      { term: 'Threat hunt', meaning: 'A deliberate search for attacker activity that has not triggered any alert.' },
      { term: 'Falsifiable hypothesis', meaning: 'A claim that evidence could prove wrong, e.g. "service accounts never log in interactively".' },
      { term: 'Population', meaning: 'The set of systems, users or events a hunt examines.' },
      { term: 'Negative result', meaning: 'A hunt that finds nothing suspicious. If well designed, it still proves something useful.' },
    ],
    before: [{
      title: 'In plain English: searching for what the alarms missed',
      paragraphs: [
        'Alarms only catch what someone thought to set them for. Hunting means asking "if an attacker were here, what would they have to do?" and then looking for exactly that.',
        'A good hunt starts with a clear, testable statement — for example "our backup service account should never log in to a laptop" — and a plan for what you would see if it were true or false. Even finding nothing is useful, because it shows that path is clean and the logs needed to check it exist.',
      ],
    }],
    after: [{
      title: 'Worked example: a one-page hunt plan',
      paragraphs: [
        'The plan below fits on one page. It names the hypothesis, where to look, the exact query idea, what a finding would look like and what a clean result would prove.',
      ],
      code: 'Hypothesis: an attacker reuses svc-backup to log in to workstations\nPopulation: all Windows workstations, last 30 days\nData:       logon events (4624) with logon type 2 or 10 (interactive/remote)\nQuery idea: account = svc-backup AND host NOT IN backup-servers\nFinding:    any interactive svc-backup logon on a workstation\nClean result proves: no interactive use in 30 days AND logon data exists for\n                     all 412 workstations (coverage checked)',
      label: 'A hunt that is useful even if it finds nothing',
    }],
  },

  'defensive-detection-automation-safety': {
    keyTerms: [
      { term: 'Enrichment', meaning: 'Automatically adding context to an alert — who owns the device, where an IP is located — without changing anything.' },
      { term: 'Response action', meaning: 'An automated step that changes the environment, such as disabling an account or isolating a host.' },
      { term: 'Approval gate', meaning: 'A point where a human must confirm before automation takes a risky action.' },
      { term: 'Idempotent', meaning: 'Safe to run twice: repeating the action does not cause extra effects.' },
    ],
    before: [{
      title: 'In plain English: let the robot fetch, let the human decide',
      paragraphs: [
        'Automation is brilliant at fetching information quickly and terrible at judgement. Looking up who owns a laptop is safe to automate. Shutting down the CEO\'s account during a board meeting is not something a script should decide alone.',
        'So treat looking things up and changing things as two different permission levels, put a human approval in front of high-impact actions, and make every action safe to retry and easy to undo.',
      ],
    }],
    after: [{
      title: 'Worked example: an automated playbook with a human gate',
      paragraphs: [
        'The playbook below enriches automatically, proposes an action and waits for approval only when the target is high-impact. Note step 2: if enrichment fails, the playbook says so instead of quietly treating the alert as harmless.',
      ],
      code: '1 Enrich (automatic): asset owner, criticality, user role, IP reputation\n2 If enrichment failed -> mark "incomplete", route to analyst (never auto-close)\n3 Propose action: isolate host LAPTOP-22\n4 Gate: criticality = high OR user is executive -> require analyst approval\n5 Act once (idempotent: skip if already isolated), record time + approver\n6 Verify: EDR reports host isolated; else alert the on-call analyst',
      label: 'Automatic context, gated action, verified result',
    }],
  },

  'defensive-detection-sysmon-sigma-validation': {
    keyTerms: [
      { term: 'Sysmon', meaning: 'A free Microsoft tool that records detailed Windows activity (process starts, network connections, file changes) into the event log.' },
      { term: 'Sigma rule', meaning: 'A detection written in a vendor-neutral YAML format that can be converted into Splunk, Sentinel or other SIEM queries.' },
      { term: 'Field mapping', meaning: 'How a field from the source (e.g. Sysmon Image) is renamed in the SIEM (e.g. process.executable).' },
      { term: 'Encoded command', meaning: 'PowerShell run with -EncodedCommand / -enc, which hides the real script as Base64 text — often used by attackers.' },
    ],
    before: [{
      title: 'In plain English: you can only search what was recorded',
      paragraphs: [
        'A detection is a search over logs. If the log never recorded a detail, no rule can find it — like searching CCTV for a face when the camera only records number plates. So detection engineering starts by checking what the source actually sends.',
        'Sysmon is a Windows "camera" that records which programs start and with what command line. Sigma is a way of writing the search once and translating it into whichever SIEM you use. This lesson walks through both, then tests that the whole chain really works.',
      ],
    }],
  },

  'defensive-detection-malware-triage-yara': {
    keyTerms: [
      { term: 'Triage (malware)', meaning: 'A quick, safe first look at a suspicious file to decide how worried to be and what to do next.' },
      { term: 'Static analysis', meaning: 'Examining a file without running it: its hash, strings, format and metadata.' },
      { term: 'Dynamic analysis', meaning: 'Running a file in a safe sandbox to watch what it does.' },
      { term: 'YARA rule', meaning: 'A description of text or byte patterns that identifies a family of files, used to scan for matches.' },
    ],
    before: [{
      title: 'In plain English: inspect the parcel before opening it',
      paragraphs: [
        'If a suspicious parcel arrives, you check the label, weigh it and X-ray it before opening it. Malware triage is the same: record where the file came from, compute its hash and read its visible text without running it.',
        'A file name or extension proves nothing — "invoice.pdf" can be a program. YARA lets you describe tell-tale patterns inside files and scan for them. In this lesson you practise on harmless text files, so there is no risk.',
      ],
    }],
  },

  // ── Command ────────────────────────────────────────────────────────────────────────────────
  'defensive-command-evidence-integrity': {
    keyTerms: [
      { term: 'Forensic question', meaning: 'The specific thing an investigation must answer, e.g. "how did the attacker first get in?".' },
      { term: 'Proportionate collection', meaning: 'Collecting enough evidence to answer the question without grabbing everything or violating privacy.' },
      { term: 'Chain of custody', meaning: 'A record of every person who handled the evidence, when, and what they did.' },
      { term: 'Working copy', meaning: 'A duplicate of the evidence used for analysis, so the original is never altered.' },
    ],
    before: [{
      title: 'In plain English: decide what you are looking for before you search',
      paragraphs: [
        'You would not search a whole city to find one lost key; you would think about where you last had it. Investigations work the same way: first decide the question — how did they get in, which accounts were used, what data was touched — then collect the evidence that answers it.',
        'Then keep a careful record of everyone who handled that evidence. If the case goes to court or to an auditor, that record is what makes the evidence believable.',
      ],
    }],
    after: [{
      title: 'Worked example: a custody record',
      paragraphs: [
        'Each line records one transfer or action on the evidence. The hash is computed at collection and checked again before analysis; the matching values show the copy was not changed in between.',
      ],
      code: 'Evidence  E-07 laptop disk image LAPTOP-22.E01\nQuestion  How was the first malicious file delivered?\n\n2024-03-03 10:50 UTC  collected by J. Mensah (EDR remote acquisition)\n                      SHA-256 9f2a...c41e\n2024-03-03 11:05 UTC  transferred to evidence store (ticket IR-0412)\n2024-03-03 13:20 UTC  working copy made by A. Owusu; SHA-256 9f2a...c41e  (match)\nOriginal untouched; analysis performed on the working copy only.',
      label: 'Who, when, what — and a matching hash',
    }],
  },

  'defensive-command-incident-command': {
    keyTerms: [
      { term: 'Incident lead', meaning: 'The person coordinating the whole response: priorities, owners and decisions.' },
      { term: 'Workstream', meaning: 'One area of the response with its own owner, such as investigation, containment, communications or recovery.' },
      { term: 'Decision log', meaning: 'A timestamped record of each major decision, who made it and why.' },
      { term: 'Stakeholder', meaning: 'Anyone affected by or responsible for decisions: executives, legal, customers, regulators, IT owners.' },
    ],
    before: [{
      title: 'In plain English: one captain, clear jobs',
      paragraphs: [
        'In a serious incident, many people want to help and everyone has questions. Without a clear leader, two teams might both restart the same server while nobody tells customers anything. Incident command gives one person the job of coordinating, and gives each other job — investigating, containing, communicating — a named owner.',
        'Decisions are written in a log with the reason, so later nobody has to guess why something was done. Updates to managers say what is confirmed, what is unknown and what decision is needed from them.',
      ],
    }],
    after: [{
      title: 'Worked example: a 30-minute status update',
      paragraphs: [
        'This update is written for executives. It avoids jargon, separates confirmed facts from unknowns and ends with the one decision the incident lead needs from them.',
      ],
      code: 'STATUS 11:30 UTC  Incident IR-0412 (customer email compromise)\nConfirmed: one staff mailbox accessed from abroad 09:03–10:42; access now blocked.\nNot yet known: whether customer data in that mailbox was forwarded.\nUnder way: mailbox audit review (owner: SOC), customer list check (owner: CRM team)\nNext update: 12:00 UTC\nDecision needed: approve notifying the 14 customers in the mailbox if forwarding\n                 is confirmed (owner: Head of Legal)',
      label: 'Confirmed, unknown, under way, decision needed',
    }],
  },

  'defensive-command-recovery-exercises': {
    keyTerms: [
      { term: 'Restore test', meaning: 'Actually restoring a system from backup to prove the backup works and the service runs afterwards.' },
      { term: 'RTO / RPO', meaning: 'Recovery Time Objective (how fast a service must be back) and Recovery Point Objective (how much recent data you can afford to lose).' },
      { term: 'Tabletop exercise', meaning: 'A discussion-based rehearsal where a team talks through how they would handle a realistic incident.' },
      { term: 'Blameless review', meaning: 'An after-incident review focused on improving systems and processes, not punishing individuals.' },
    ],
    before: [{
      title: 'In plain English: a fire drill, not a fire extinguisher sticker',
      paragraphs: [
        'Having a fire extinguisher is not the same as knowing how to use it. Having backups is not the same as being able to recover. The only way to know is to rehearse: actually restore a system, time it and check it works.',
        'After a real incident or a drill, hold a review that asks "what made this hard, and what will we change?" — not "who is to blame?". Each review should end with specific improvements, owners and deadlines.',
      ],
    }],
    after: [{
      title: 'Worked example: a restore drill result',
      paragraphs: [
        'The drill below measured real numbers against the targets. It "passed" on data but failed on time, because nobody had the database password at night — a finding a sticker on the wall would never reveal.',
      ],
      code: 'Drill: restore payroll database from last night\'s backup\nTarget  RTO 4 h   RPO 24 h\nResult  restored in 6 h 10 min (FAIL)   data loss 9 h (PASS)\nCause of delay: restore credentials held by one person on leave\nActions:\n  1 store restore credentials in the vault with 2 named holders  (IT ops, 2 weeks)\n  2 repeat the drill next quarter                                 (SOC lead)',
      label: 'Measure against targets; turn findings into owned actions',
    }],
  },

  'defensive-command-response-automation': {
    keyTerms: [
      { term: 'Webhook', meaning: 'An automatic message one system sends to another when something happens, for example an alert payload sent to a playbook.' },
      { term: 'Input validation', meaning: 'Checking that incoming data has the expected fields and values before using it — even data from a security tool.' },
      { term: 'Action plan', meaning: 'The list of proposed steps a playbook produces before anything is executed.' },
      { term: 'Duplicate suppression', meaning: 'Making sure that a retried or repeated alert does not trigger the same action twice.' },
    ],
    before: [{
      title: 'In plain English: a careful assistant, not a runaway robot',
      paragraphs: [
        'A good assistant checks the request makes sense, prepares the paperwork, asks before doing anything drastic and confirms the job was done. Response automation should behave the same way.',
        'In this lesson you build that assistant in Python: it checks the alert data, writes a plan, waits for approval on risky steps and refuses to repeat an action that already happened.',
      ],
    }],
  },

  // ── Leadership ─────────────────────────────────────────────────────────────────────────────
  'defensive-leadership-architecture': {
    keyTerms: [
      { term: 'Trust boundary', meaning: 'A point where data or control passes between parts of a system that trust each other differently, e.g. the internet and your web server.' },
      { term: 'Attack path', meaning: 'A sequence of steps an attacker could take from an entry point to something valuable.' },
      { term: 'Standing privilege', meaning: 'Powerful access that is always on, even when not needed. Reducing it shrinks the damage of a stolen account.' },
      { term: 'Break-glass account', meaning: 'An emergency admin account kept locked away for use only when normal access fails.' },
    ],
    before: [{
      title: 'In plain English: walls, doors and who holds the keys',
      paragraphs: [
        'Designing a secure system is like designing a bank branch. Customers enter the lobby, staff pass a locked door, and only two people can open the vault — at the same time. Each locked door is a trust boundary, and the question at each one is "who checks identity here, and what gets recorded?".',
        'Good architecture removes unnecessary keys (standing privilege), keeps emergency keys sealed and monitored, and tests that the doors really stay locked.',
      ],
    }],
    after: [{
      title: 'Worked example: removing one attack path',
      paragraphs: [
        'A small company\'s web application uses one database account that can read every table, including salaries. If the web app is hacked, the attacker gets salaries too. Splitting the account removes that path, and a simple test proves it.',
      ],
      code: 'Before: web-app -> db_user (read ALL tables, incl. hr.salaries)\nAttack path: web bug -> db_user -> salaries\n\nChange: web-app -> db_web (read orders, products only)\n        hr-app  -> db_hr  (read hr.* only, from the HR network)\n\nTest: as db_web, SELECT * FROM hr.salaries  ->  permission denied  (PASS)\n      as db_web, SELECT * FROM orders       ->  rows returned      (PASS)',
      label: 'Remove the key, then prove the door is locked',
    }],
  },

  'defensive-leadership-risk-metrics': {
    keyTerms: [
      { term: 'Risk', meaning: 'Something that could happen and harm an objective, described with how likely it is and how bad it would be.' },
      { term: 'Risk owner', meaning: 'The person with authority to accept a risk or pay to reduce it — usually a business leader, not the security team.' },
      { term: 'Denominator', meaning: 'What a metric is divided by. "5 unpatched servers" means little until you know it is 5 of 10 or 5 of 5,000.' },
      { term: 'Vanity metric', meaning: 'A number that looks impressive but does not show whether security improved, e.g. "alerts processed".' },
    ],
    before: [{
      title: 'In plain English: measure outcomes, not busyness',
      paragraphs: [
        '"We closed 10,000 alerts this month" sounds great — but if 9,900 were false alarms, the team mostly proved the rules were noisy. Useful security metrics show whether the organisation is actually safer and whether problems are fixed in time.',
        'Always ask "out of how many?" and "compared with what?". And remember that deciding whether a risk is acceptable belongs to the business leader who owns it; security\'s job is to explain it clearly.',
      ],
    }],
    after: [{
      title: 'Worked example: turning a vanity metric into a useful one',
      paragraphs: [
        'The first report counts activity. The rewritten report measures outcome against a clear denominator and target, and it names the owner who must decide on the exception.',
      ],
      code: 'Vanity:  "Patched 1,240 vulnerabilities this quarter."\n\nUseful:  "Critical internet-facing vulnerabilities fixed within 14 days:\n          38 of 42 (90%, target 95%).\n          4 overdue on the legacy booking system — fix needs a vendor upgrade.\n          Risk owner: Head of Operations; decision needed by 30 June."',
      label: 'Denominator, target, exception and owner',
    }],
  },

  'defensive-leadership-program-capstone': {
    keyTerms: [
      { term: 'Operating model', meaning: 'How a security team actually runs: who does what, which tools and data they rely on, and how decisions flow.' },
      { term: 'Dependency', meaning: 'Something a service needs to work, such as an identity provider, a supplier or a network link.' },
      { term: 'Trade-off', meaning: 'Choosing one benefit at the cost of another, such as faster response versus fewer false alarms.' },
      { term: 'Roadmap', meaning: 'A time-ordered plan of improvements with owners and measures of success.' },
    ],
    before: [{
      title: 'In plain English: put all the pieces on one page',
      paragraphs: [
        'This capstone asks you to act as the security lead for a small organisation. You combine everything — what matters most to the business, which logs you have, who triages, how you escalate, how you recover — into one plan.',
        'Then you defend your choices. Leaders rarely pick the "perfect" option; they pick the best one they can afford and explain the trade-off honestly.',
      ],
    }],
    after: [{
      title: 'Worked example: one plan item with its trade-off',
      paragraphs: [
        'A strong plan item says what will change, why, what it costs and how success will be measured — including what you are choosing not to do.',
      ],
      code: 'Item 3: Require MFA for all remote access (staff and suppliers)\nWhy:     4 of the last 5 incidents began with a stolen password\nCost:    licences + 2 weeks of helpdesk load during rollout\nTrade-off: suppliers without smartphones get hardware keys (extra cost);\n          we defer SIEM expansion one quarter to fund this\nMeasure: % of remote logins with MFA (target 100% by Q3);\n         password-based incidents per quarter (target 0)',
      label: 'Change, reason, cost, trade-off, measure',
    }],
  },

  'defensive-leadership-modern-defense-lab': {
    keyTerms: [
      { term: 'Defense lab', meaning: 'A safe, isolated environment for practising attacks and detections end to end.' },
      { term: 'Snapshot', meaning: 'A saved state of a virtual machine that lets you reset it to a known starting point.' },
      { term: 'Coverage', meaning: 'Which attacker behaviours your data and detections can actually see.' },
      { term: 'Readiness measure', meaning: 'Evidence that the team can detect and recover — not just a count of tools owned.' },
    ],
    before: [{
      title: 'In plain English: a practice kitchen for the whole team',
      paragraphs: [
        'Restaurants train new chefs in a practice kitchen before service. A defense lab is the practice kitchen for a security team: a few safe machines where you run a harmless "attack", check the logs captured it, see whether a rule fired and practise the response.',
        'Because the lab can be reset with snapshots, every exercise starts the same way, so you can measure improvement honestly — for example "we now detect 9 of 12 practised techniques, up from 5".',
      ],
    }],
  },
};
