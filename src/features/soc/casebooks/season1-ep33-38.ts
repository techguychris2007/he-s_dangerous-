import { defineCasebook } from './casebook';
import { staffIn } from './world';
import { ASHEN_TIDE as AT, GLASS_HERON as GH } from './actors';

// ── Episode 33 · The Playbook Runs ──────────────────────────────────────────────────────────────
const EP33_HOSTS = ['HF-WHS-002', 'HF-WHS-009', 'HF-LOG-004', 'HF-LOG-011'];

export const ep33 = defineCasebook({
  id: 'casebook-s1e33-playbook-runs',
  episode: 33,
  title: 'The Playbook Runs',
  difficulty: 'Hard',
  replaces: 'siem-qradar-soar-automated-response',
  inspiredBy: 'an automated response playbook containing a ransomware outbreak faster than humans could',
  date: '2027-04-12',
  briefing: 'Ransomware started detonating across the warehouse at 2am, when no analyst was watching. But by the time the on-call engineer logged in, the automated response playbook had already isolated the affected hosts and blocked the C2. This case is about trusting — and verifying — automation. Confirm what the playbook did and whether it got everything.',
  chapters: [
    { id: 'outbreak', title: 'The outbreak' },
    { id: 'playbook', title: 'The automated response' },
    { id: 'verify', title: 'Did it get everything?' },
  ],
  inject(t, when) {
    EP33_HOSTS.forEach((host, i) => {
      t.add('ProcessEvents', when(0, `02:0${i}:00`), { DeviceName: host, AccountName: 'SYSTEM', ProcessName: 'locker.exe', ParentProcessName: 'services.exe', CommandLine: 'locker.exe /encrypt', SHA256: 'ransom-locker' });
      t.add('NetworkEvents', when(0, `02:0${i}:30`), { DeviceName: host, InitiatingProcessFileName: 'locker.exe', RemoteIP: AT.ips.c2, RemotePort: 443, RemoteUrl: AT.domains.payload, ActionType: 'ConnectionSuccess', BytesSent: 1200 });
      t.add('SecurityAlerts', when(0, `02:0${i}:40`), { AlertName: 'Ransomware encryption behaviour', Severity: 'High', DeviceName: host, Entity: 'warehouse', Status: 'New', Product: 'Halcyon EDR' });
      // The SOAR playbook auto-isolates each host within seconds — except one, which failed.
      t.add('ResponseActions', when(0, `02:0${i}:55`), { IncidentId: 'IR-0412', Target: host, Action: 'AutoIsolate', Result: i === 2 ? 'Failed' : 'Success', ApprovedBy: 'soar-playbook' });
    });
    t.add('ResponseActions', when(0, '02:06:00'), { IncidentId: 'IR-0412', Target: AT.ips.c2, Action: 'AutoBlockIndicator', Result: 'Success', ApprovedBy: 'soar-playbook' });
    // The on-call engineer completes the one the playbook missed.
    t.add('ResponseActions', when(0, '07:30:00'), { IncidentId: 'IR-0412', Target: EP33_HOSTS[2], Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'oncall-engineer' });
    t.add('ResponseActions', when(0, '09:00:00'), { IncidentId: 'IR-0412', Target: 'warehouse-fleet', Action: 'RestoreFromBackup', Result: 'Success', BackupAge: '6h', ApprovedBy: 'it-manager' });
    t.add('ThreatIntel', when(0, '03:00:00'), { Indicator: AT.ips.c2, IndicatorType: 'ip', Actor: AT.name, Confidence: 'High', Source: 'Internal prior incidents', Limitation: 'Automation acts on what it detects; a host whose isolation fails stays active until a human intervenes.' });
  },
  questions: [
    { chapter: 'outbreak', prompt: 'How many hosts ran the ransomware locker?', teach: 'Automation shines at machine speed, but you still verify its scope. Count the hosts running the locker process to know how many the outbreak touched — the number the playbook had to contain.', query: 'ProcessEvents | where ProcessName == "locker.exe" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'dcount(DeviceName) over the locker process.', type: 'number' },
    { chapter: 'outbreak', prompt: 'Which C2 address did the locker contact?', teach: 'Even ransomware usually checks in. The C2 address is a shared indicator and ties this outbreak to the actor’s known infrastructure.', query: 'NetworkEvents | where InitiatingProcessFileName == "locker.exe" | distinct RemoteIP', column: 'RemoteIP', hint: 'distinct RemoteIP on the locker’s connections.' },
    { chapter: 'playbook', prompt: 'How many hosts did the playbook successfully auto-isolate?', teach: 'Trust but verify. Count the AutoIsolate actions with a Success result to see how many hosts the automation actually contained — not how many it attempted.', query: 'ResponseActions | where Action == "AutoIsolate" and Result == "Success" | count', column: 'Count', hint: 'Count AutoIsolate actions with Result Success.', type: 'number' },
    { chapter: 'playbook', prompt: 'Which identity executed the automated isolations?', teach: 'Automated actions are logged under the playbook identity, not a person. Recognising "soar-playbook" as the actor distinguishes machine response from human response in the timeline.', query: 'ResponseActions | where Action == "AutoIsolate" | distinct ApprovedBy', column: 'ApprovedBy', hint: 'distinct ApprovedBy on the AutoIsolate actions.' },
    { chapter: 'playbook', prompt: 'Which action did the playbook take against the C2?', teach: 'A good playbook does more than isolate hosts — it also blocks the C2 to stop any host that slipped through from reaching the attacker. Confirm the automated block happened.', query: 'ResponseActions | where Action == "AutoBlockIndicator"', column: 'Action', hint: 'Find the automated indicator-block action.' },
    { chapter: 'verify', prompt: 'On which host did the automated isolation fail?', teach: 'This is why you verify automation: one AutoIsolate failed. That host stayed active and dangerous until a human noticed. Find it from the Failed result.', query: 'ResponseActions | where Action == "AutoIsolate" and Result == "Failed"', column: 'Target', hint: 'Find the AutoIsolate action with Result Failed.' },
    { chapter: 'verify', prompt: 'Which human-approved action finished the job on that host?', teach: 'The on-call engineer completed what the playbook could not. A manual IsolateDevice, approved by a person, covering the failed host, is the safety net that automation needs.', query: `ResponseActions | where Target == "${EP33_HOSTS[2]}" and ApprovedBy == "oncall-engineer"`, column: 'Action', hint: 'Find the engineer’s action on the failed host.' },
    { chapter: 'verify', prompt: 'What limitation does the intelligence note about automation?', teach: 'The lesson in one line: automation acts on what it detects, and a failed isolation leaves a host live until a human steps in. Verification is not optional.', query: `ThreatIntel | where Indicator == "${AT.ips.c2}"`, column: 'Limitation', hint: 'Read the Limitation on the C2 intel record.' },
    { chapter: 'verify', prompt: 'How old was the backup used to recover the fleet?', teach: 'Fast containment limits spread, but encrypted hosts still need restoring. The backup age is the data-loss window the automation’s speed helped minimise.', query: 'ResponseActions | where Action == "RestoreFromBackup" and IncidentId == "IR-0412"', column: 'BackupAge', hint: 'Read BackupAge on the restore action.' },
    { chapter: 'verify', prompt: 'Which incident ID ties the automated and human actions together?', teach: 'One incident ID spans both the playbook’s actions and the engineer’s follow-up, so the blended response is reviewed as a whole.', query: 'ResponseActions | where Action == "RestoreFromBackup" and IncidentId == "IR-0412"', column: 'IncidentId', hint: 'Read IncidentId on the restore action.' },
  ],
});

// ── Episode 34 · The Unread Logs ────────────────────────────────────────────────────────────────
const EP34_POS = ['HF-POS-01', 'HF-POS-02', 'HF-POS-03'];

export const ep34 = defineCasebook({
  id: 'casebook-s1e34-unread-logs',
  episode: 34,
  title: 'The Unread Logs',
  difficulty: 'Medium',
  replaces: 'siem-elastic-pci-dss-compliance-report',
  inspiredBy: 'a card-data breach that ran for months because required log reviews were never actually performed',
  date: '2027-04-19',
  briefing: 'A card brand flagged Halcyon’s retail unit for fraud traced to its point-of-sale terminals. The uncomfortable finding: the logs that would have caught it were being collected all along — nobody ever reviewed them. This case is about compliance that exists on paper only. Read the logs now, find what they always showed, and fix the process.',
  chapters: [
    { id: 'evidence', title: 'What the logs showed' },
    { id: 'gap', title: 'The review gap' },
    { id: 'response', title: 'Fix the process' },
  ],
  inject(t, when) {
    EP34_POS.forEach((host, i) => {
      t.add('FileEvents', when(-0, `02:${String(10 + i).padStart(2, '0')}:00`), { DeviceName: host, AccountName: 'SYSTEM', ActionType: 'FileCreated', FileName: 'memscan.exe', FolderPath: 'C:\\Windows\\Temp', SizeBytes: 90_000, SHA256: 'pos-scraper' });
      for (let d = 0; d < 3; d++) t.add('NetworkEvents', when(d % 2, `0${3 + d}:${String(15 + i).padStart(2, '0')}:00`), { DeviceName: host, InitiatingProcessFileName: 'memscan.exe', RemoteIP: AT.ips.exfil, RemotePort: 21, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 400_000 });
    });
    t.add('SecurityAlerts', when(1, '09:00:00'), { AlertName: 'POS terminal uploading to external FTP', Severity: 'High', DeviceName: EP34_POS[0], Entity: 'retail', Status: 'New', Product: 'Halcyon IDS' });
    t.add('CloudAuditEvents', when(1, '08:00:00'), { UserPrincipalName: 'compliance', Operation: 'ComplianceCheck', Resource: 'PCI/log-review', NewValue: 'Last performed: never', IPAddress: '10.40.0.70', SessionId: '', Result: 'Fail', ItemCount: 0 });
    t.add('ThreatIntel', when(1, '08:30:00'), { Indicator: AT.ips.exfil, IndicatorType: 'ip', Actor: AT.name, Confidence: 'Medium', Source: 'Card brand fraud notification', Limitation: 'Earliest log evidence bounds the known exposure window; the breach may predate the logs’ retention.' });
    EP34_POS.forEach((host) => t.add('ResponseActions', when(1, '10:00:00'), { IncidentId: 'IR-0419', Target: host, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' }));
    t.add('ResponseActions', when(1, '10:10:00'), { IncidentId: 'IR-0419', Target: AT.ips.exfil, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(1, '11:00:00'), { IncidentId: 'IR-0419', Target: 'pci-log-review', Action: 'ScheduleDailyReview', Result: 'Success', ApprovedBy: 'compliance-officer' });
  },
  questions: [
    { chapter: 'evidence', prompt: 'What malware file was present on the POS terminals?', teach: 'Compliance logs are only useful if read. The scraper sitting in Temp on the terminals was logged the whole time. Find it now to see what the reviews would have caught.', query: 'FileEvents | where FileName == "memscan.exe" | distinct FileName', column: 'FileName', hint: 'distinct FileName for the scraper in FileEvents.' },
    { chapter: 'evidence', prompt: 'How many POS terminals had the scraper?', teach: 'Count distinct terminals with the malware to scope the card-data exposure across the retail unit.', query: 'FileEvents | where FileName == "memscan.exe" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'dcount(DeviceName) for the scraper file.', type: 'number' },
    { chapter: 'evidence', prompt: 'Which port did the terminals use to upload stolen data?', teach: 'Port 21 is cleartext FTP — visible to the IDS the whole time. The uploads were never hidden; they were simply never looked at.', query: 'NetworkEvents | where InitiatingProcessFileName == "memscan.exe" | distinct RemotePort', column: 'RemotePort', hint: 'distinct RemotePort on the scraper’s uploads.', type: 'number' },
    { chapter: 'evidence', prompt: 'How many bytes were uploaded in total?', teach: 'Summing the uploads estimates the volume of card data stolen over the unreviewed period — the figure driving the breach notification.', query: 'NetworkEvents | where InitiatingProcessFileName == "memscan.exe" | summarize sum(BytesSent)', column: 'sum_BytesSent', hint: 'summarize sum(BytesSent) over the uploads.', type: 'number' },
    { chapter: 'gap', prompt: 'What did the compliance check record about the log review?', teach: 'The root cause is process, not technology. The compliance check result — "Last performed: never" — is the finding that explains how a visible breach ran undetected.', query: 'CloudAuditEvents | where Operation == "ComplianceCheck"', column: 'NewValue', hint: 'Find the ComplianceCheck event and read its recorded value.' },
    { chapter: 'gap', prompt: 'What result did that compliance check return?', teach: 'A failed compliance check is the paper trail of the gap. It confirms the control existed in policy but not in practice — the exact failure mode that enables long breaches.', query: 'CloudAuditEvents | where Operation == "ComplianceCheck"', column: 'Result', hint: 'Read the Result on the compliance check.' },
    { chapter: 'gap', prompt: 'What limitation does the intelligence note about the exposure window?', teach: 'Because the breach ran unreviewed, its true start is unknown. The earliest log only bounds what you can prove — the real exposure may predate retention.', query: `ThreatIntel | where Indicator == "${AT.ips.exfil}"`, column: 'Limitation', hint: 'Read the Limitation on the exfil-IP intel record.' },
    { chapter: 'response', prompt: 'How many terminals were isolated?', teach: 'Isolation covers every infected terminal. Matching the count to the scraper’s spread confirms full containment of the card-data risk.', query: 'ResponseActions | where IncidentId == "IR-0419" and Action == "IsolateDevice" | count', column: 'Count', hint: 'Count IsolateDevice actions in this incident.', type: 'number' },
    { chapter: 'response', prompt: 'Which control fixes the real failure? Enter the response action name.', teach: 'The durable fix is making the review actually happen — scheduling a daily log review turns a paper control into a practised one.', query: 'ResponseActions | where Target == "pci-log-review"', column: 'Action', hint: 'Find the response action targeting the PCI log review.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the isolations, the block and the process fix so the compliance failure and its remediation are reviewed together.', query: 'ResponseActions | where Action == "ScheduleDailyReview"', column: 'IncidentId', hint: 'Read IncidentId on the review-scheduling action.' },
  ],
});

// ── Episode 35 · The Stolen Seeds ───────────────────────────────────────────────────────────────
const ep35Victim = staffIn('Engineering')[8];

export const ep35 = defineCasebook({
  id: 'casebook-s1e35-stolen-seeds',
  episode: 35,
  title: 'The Stolen Seeds',
  difficulty: 'Hard',
  replaces: 'siem-suricata-rsa-securid-2011',
  inspiredBy: 'phishing an employee to breach the system that generates two-factor authentication seeds',
  date: '2027-04-26',
  briefing: 'A targeted phish hit an engineer who manages Halcyon’s hardware-token system — the one that holds the secret seeds behind every employee’s two-factor code. If those seeds were taken, the attacker could predict anyone’s 2FA. Establish whether the seed database was accessed and exfiltrated, and whether re-seeding closed the exposure.',
  chapters: [
    { id: 'entry', title: 'The targeted phish' },
    { id: 'crown', title: 'The seed database' },
    { id: 'response', title: 'Re-seed' },
  ],
  inject(t, when) {
    const v = ep35Victim;
    t.add('EmailEvents', when(0, '08:30:00'), { MessageId: 'GH-SEED-35', SenderAddress: `hr-benefits@${GH.domains.phish}`, RecipientAddress: v.email, Subject: '2027 Compensation Plan — review attached', AttachmentName: 'comp-plan.xls', Url: '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
    t.add('ProcessEvents', when(0, '08:50:00'), { DeviceName: v.hostname, AccountName: v.username, ProcessName: 'excel.exe', ParentProcessName: 'outlook.exe', CommandLine: 'excel.exe comp-plan.xls', SHA256: 'macro-xls' });
    t.add('ProcessEvents', when(0, '08:51:00'), { DeviceName: v.hostname, AccountName: v.username, ProcessName: 'powershell.exe', ParentProcessName: 'excel.exe', CommandLine: 'powershell.exe -nop -enc ...', SHA256: 'encoded-ps' });
    t.add('NetworkEvents', when(0, '08:55:00'), { DeviceName: v.hostname, InitiatingProcessFileName: 'powershell.exe', RemoteIP: GH.ips.c2, RemotePort: 443, RemoteUrl: GH.domains.c2, ActionType: 'ConnectionSuccess', BytesSent: 900 });
    t.add('CloudAuditEvents', when(0, '10:00:00'), { UserPrincipalName: v.email, Operation: 'ExportRecords', Resource: 'TokenSeedVault/all-seeds', IPAddress: GH.ips.c2, SessionId: 'SEED-35', Result: 'Success', ItemCount: 480, BytesSent: 2_400_000 });
    t.add('NetworkEvents', when(0, '10:05:00'), { DeviceName: 'HF-SEEDVAULT-01', InitiatingProcessFileName: 'seedtool.exe', RemoteIP: GH.ips.staging, RemotePort: 443, RemoteUrl: GH.domains.staging, ActionType: 'ConnectionSuccess', BytesSent: 2_400_000 });
    t.add('SecurityAlerts', when(0, '11:00:00'), { AlertName: 'Token seed vault exported to external host', Severity: 'High', DeviceName: 'HF-SEEDVAULT-01', Entity: v.email, Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '10:30:00'), { Indicator: GH.ips.staging, IndicatorType: 'ip', Actor: GH.name, Confidence: 'High', Source: 'Internal detection and sharing group', Limitation: 'If seeds were taken, every token must be assumed predictable until re-seeded; MFA alone is no longer sufficient.' });
    t.add('ResponseActions', when(0, '11:30:00'), { IncidentId: 'IR-0426', Target: v.hostname, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(1, '09:00:00'), { IncidentId: 'IR-0426', Target: 'all-tokens', Action: 'ReseedAllTokens', Result: 'Success', ReseededCount: 480, ApprovedBy: 'ciso' });
    t.add('ResponseActions', when(0, '11:40:00'), { IncidentId: 'IR-0426', Target: GH.ips.staging, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'entry', prompt: 'Which attachment delivered the phish to the token administrator?', teach: 'Attackers target the people who hold the keys. A compensation-plan spreadsheet is a tailored lure for an engineer — identify the macro-bearing attachment that started the chain.', query: 'EmailEvents | where MessageId == "GH-SEED-35"', column: 'AttachmentName', hint: 'Read AttachmentName on the lure email.' },
    { chapter: 'entry', prompt: 'Which process did the spreadsheet macro launch?', teach: 'Excel spawning PowerShell is the macro-malware signature. It gave the attacker code execution on the one machine that could reach the seed vault.', query: `ProcessEvents | where DeviceName == "${ep35Victim.hostname}" and ParentProcessName == "excel.exe"`, column: 'ProcessName', hint: 'Find the child of excel.exe.' },
    { chapter: 'entry', prompt: 'Which C2 did that process contact?', teach: 'The PowerShell beacon reaches the actor’s known C2. It confirms the intrusion is tied to the season’s espionage actor, not a commodity criminal.', query: `NetworkEvents | where DeviceName == "${ep35Victim.hostname}" and InitiatingProcessFileName == "powershell.exe"`, column: 'RemoteIP', hint: 'Find the PowerShell connection.' },
    { chapter: 'crown', prompt: 'Which resource did the administrator’s account export?', teach: 'This is the crown jewel. An export of the token seed vault means the secrets behind every employee’s 2FA code may be in the attacker’s hands.', query: 'CloudAuditEvents | where SessionId == "SEED-35" and Operation == "ExportRecords"', column: 'Resource', hint: 'Find the ExportRecords event in the session.' },
    { chapter: 'crown', prompt: 'How many token seeds were exported?', teach: 'The count is the number of employees whose 2FA is now predictable — the full scope of the exposure and the number of tokens that must be re-seeded.', query: 'CloudAuditEvents | where SessionId == "SEED-35" and Operation == "ExportRecords"', column: 'ItemCount', hint: 'Read ItemCount on the export event.', type: 'number' },
    { chapter: 'crown', prompt: 'To which external IP did the seed vault host upload the data?', teach: 'Confirm exfiltration from the vault host itself, not just the admin’s laptop. The upload destination matches the actor’s staging infrastructure.', query: 'NetworkEvents | where DeviceName == "HF-SEEDVAULT-01"', column: 'RemoteIP', hint: 'Find the outbound connection from the seed vault host.' },
    { chapter: 'crown', prompt: 'What limitation does the intelligence note about the seeds?', teach: 'The gravest lesson: if seeds are taken, MFA is no longer trustworthy until every token is re-seeded. The intel record states this — a reset password is not enough.', query: `ThreatIntel | where Indicator == "${GH.ips.staging}"`, column: 'Limitation', hint: 'Read the Limitation on the staging-IP intel record.' },
    { chapter: 'response', prompt: 'Which action restores trust in the 2FA system? Enter the response action name.', teach: 'The only fix for stolen seeds is to generate new ones. Re-seeding every token invalidates the exfiltrated secrets and makes the stolen data worthless.', query: 'ResponseActions | where Target == "all-tokens"', column: 'Action', hint: 'Find the response action targeting all tokens.' },
    { chapter: 'response', prompt: 'How many tokens were re-seeded?', teach: 'The re-seeded count should match the exported count — proof every exposed token was replaced, closing the exposure completely.', query: 'ResponseActions | where Action == "ReseedAllTokens"', column: 'ReseededCount', hint: 'Read ReseededCount on the re-seed action.', type: 'number' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the host isolation, the indicator block and the fleet re-seed into a single reviewable response to a crown-jewel compromise.', query: 'ResponseActions | where Action == "ReseedAllTokens"', column: 'IncidentId', hint: 'Read IncidentId on the re-seed action.' },
  ],
});

// ── Episode 36 · The Managed Pipeline ───────────────────────────────────────────────────────────
const EP36_MSP_TOOL = 'rmm-agent.exe';
const EP36_HOSTS = ['HF-IT-002', 'HF-IT-005', 'HF-ENG-003', 'HF-FIN-004', 'HF-SAL-008'];

export const ep36 = defineCasebook({
  id: 'casebook-s1e36-managed-pipeline',
  episode: 36,
  title: 'The Managed Pipeline',
  difficulty: 'Hard',
  replaces: 'siem-tcpdump-kaseya-vsa-2021',
  inspiredBy: 'attackers abusing a remote-management tool to push ransomware to every managed endpoint at once',
  date: '2027-05-03',
  briefing: 'Halcyon’s IT provider manages laptops through a remote-management agent that can run commands on every machine. This morning that agent pushed an "update" to the whole fleet simultaneously — and it was ransomware. When the trusted management pipeline itself is the delivery vehicle, the blast is instant and wide. Trace the push, the scope, and the containment.',
  chapters: [
    { id: 'push', title: 'The malicious push' },
    { id: 'scope', title: 'The blast radius' },
    { id: 'response', title: 'Cut the pipeline' },
  ],
  inject(t, when) {
    EP36_HOSTS.forEach((host, i) => {
      t.add('ProcessEvents', when(0, `06:0${i}:00`), { DeviceName: host, AccountName: 'SYSTEM', ProcessName: 'cmd.exe', ParentProcessName: EP36_MSP_TOOL, CommandLine: 'cmd.exe /c certutil -decode payload.b64 payload.exe & payload.exe', SHA256: 'rmm-dropper' });
      t.add('ProcessEvents', when(0, `06:0${i}:30`), { DeviceName: host, AccountName: 'SYSTEM', ProcessName: 'payload.exe', ParentProcessName: 'cmd.exe', CommandLine: 'payload.exe /encrypt', SHA256: 'ransom-payload' });
      t.add('FileEvents', when(0, `06:${String(5 + i).padStart(2, '0')}:00`), { DeviceName: host, AccountName: 'SYSTEM', ActionType: 'FileCreated', FileName: AT.ransomNote, FolderPath: 'C:\\', SizeBytes: 2100, SHA256: 'ransom-note' });
    });
    t.add('SecurityAlerts', when(0, '06:30:00'), { AlertName: 'Remote-management agent pushed encryptor fleet-wide', Severity: 'High', DeviceName: EP36_HOSTS[0], Entity: 'rmm-pipeline', Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '06:45:00'), { Indicator: EP36_MSP_TOOL, IndicatorType: 'file', Actor: AT.name, Confidence: 'High', Source: 'MSP breach notification', Limitation: 'Trust in the management tool means its actions bypass normal controls; every managed host must be treated as reachable.' });
    t.add('ResponseActions', when(0, '06:40:00'), { IncidentId: 'IR-0503', Target: 'rmm-pipeline', Action: 'DisableManagementAgent', Result: 'Success', ApprovedBy: 'ciso' });
    EP36_HOSTS.forEach((host) => t.add('ResponseActions', when(0, '07:00:00'), { IncidentId: 'IR-0503', Target: host, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' }));
    t.add('ResponseActions', when(0, '11:00:00'), { IncidentId: 'IR-0503', Target: 'managed-fleet', Action: 'RestoreFromBackup', Result: 'Success', BackupAge: '10h', ApprovedBy: 'it-manager' });
  },
  questions: [
    { chapter: 'push', prompt: 'Which management tool pushed the malicious command?', teach: 'When the delivery vehicle is a trusted tool, the parent process is the clue. A remote-management agent spawning cmd.exe to decode and run a payload is the pipeline being abused.', query: `ProcessEvents | where ParentProcessName == "${EP36_MSP_TOOL}" | distinct ParentProcessName`, column: 'ParentProcessName', hint: 'distinct ParentProcessName on the pushed commands.' },
    { chapter: 'push', prompt: 'What did the pushed command do, according to its command line?', teach: 'The command decodes a base64 payload with certutil and runs it — a living-off-the-land trick to smuggle the encryptor past controls. Reading the full command line reveals the technique.', query: `ProcessEvents | where ParentProcessName == "${EP36_MSP_TOOL}" and DeviceName == "${EP36_HOSTS[0]}"`, column: 'CommandLine', hint: 'Read the command line of the pushed cmd on the first host.' },
    { chapter: 'scope', prompt: 'On how many hosts did the encryptor payload run?', teach: 'A fleet-wide push means instant, wide impact. Counting distinct hosts running the payload measures the blast radius the trusted pipeline enabled.', query: 'ProcessEvents | where ProcessName == "payload.exe" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'dcount(DeviceName) over the payload process.', type: 'number' },
    { chapter: 'scope', prompt: 'How many hosts had the ransom note written?', teach: 'The ransom note confirms encryption completed, not just launched. Counting devices with the note cross-checks the payload count and scopes recovery.', query: 'FileEvents | where FileName endswith ".txt" and FolderPath contains "C:" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'Count distinct devices with the ransom note.', type: 'number' },
    { chapter: 'scope', prompt: 'Which actor does intelligence link to the management tool abuse?', teach: 'Attribution ties the compromise to a known crew via the MSP’s breach notification. The caveat: a trusted tool bypasses normal controls, so every managed host is in scope.', query: `ThreatIntel | where Indicator == "${EP36_MSP_TOOL}"`, column: 'Actor', hint: 'Look the management tool up in ThreatIntel.' },
    { chapter: 'scope', prompt: 'What limitation does the intelligence note about trusted tools?', teach: 'The lesson: because the management tool is trusted, its actions skip the usual defences — so treat every managed host as reachable, not just the ones you have seen hit.', query: `ThreatIntel | where Indicator == "${EP36_MSP_TOOL}"`, column: 'Limitation', hint: 'Read the Limitation on the intel record.' },
    { chapter: 'response', prompt: 'Which action stopped further pushes? Enter the response action name.', teach: 'The first move is to cut the pipeline itself — disabling the management agent stops any further malicious push while hosts are contained.', query: 'ResponseActions | where Target == "rmm-pipeline"', column: 'Action', hint: 'Find the response action targeting the management pipeline.' },
    { chapter: 'response', prompt: 'How many hosts were isolated?', teach: 'Isolation covers every host the push reached. Matching the count to the payload spread confirms the response was fleet-wide, like the attack.', query: 'ResponseActions | where IncidentId == "IR-0503" and Action == "IsolateDevice" | count', column: 'Count', hint: 'Count IsolateDevice actions in this incident.', type: 'number' },
    { chapter: 'response', prompt: 'How old was the backup used to recover?', teach: 'With a whole managed fleet encrypted, recovery leans entirely on backups. The age is the data-loss window across every affected machine.', query: 'ResponseActions | where Action == "RestoreFromBackup" and IncidentId == "IR-0503"', column: 'BackupAge', hint: 'Read BackupAge on the restore action.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the pipeline disable, the isolations and the restore into a single reviewable response to a supply-chain-of-management attack.', query: 'ResponseActions | where Action == "DisableManagementAgent"', column: 'IncidentId', hint: 'Read IncidentId on the agent-disable action.' },
  ],
});

// ── Episode 37 · The Long Watch ─────────────────────────────────────────────────────────────────
const EP37_SVC = 'svc-hrsync';

export const ep37 = defineCasebook({
  id: 'casebook-s1e37-long-watch',
  episode: 37,
  title: 'The Long Watch',
  difficulty: 'Hard',
  replaces: 'siem-splunk-opm-2015-nation-state',
  inspiredBy: 'a patient nation-state intrusion that quietly stole sensitive personnel records over a long period',
  date: '2027-05-10',
  briefing: 'A government partner alerted Halcyon that sensitive personnel data — background forms, clearances, next-of-kin — surfaced in a foreign intelligence context. This points to a patient, well-resourced intruder who took records slowly and avoided noise. Trace the account they rode, what categories of records left, and how the response evicted them.',
  chapters: [
    { id: 'foothold', title: 'The patient foothold' },
    { id: 'theft', title: 'The records taken' },
    { id: 'response', title: 'Eviction' },
  ],
  inject(t, when) {
    // Low-and-slow record pulls over two days through an HR sync service account.
    const categories = ['background-forms', 'clearance-records', 'next-of-kin', 'fingerprint-index'];
    categories.forEach((cat, i) => {
      for (let k = 0; k < 6; k++) t.add('CloudAuditEvents', when(k % 2, `0${1 + (i % 5)}:${String((i * 11 + k * 3) % 60).padStart(2, '0')}:00`), { UserPrincipalName: EP37_SVC, Operation: 'ExportRecords', Resource: `HR/${cat}`, IPAddress: GH.ips.staging, SessionId: 'LONGWATCH-37', Result: 'Success', ItemCount: 2000 + k * 100 });
    });
    t.add('ProcessEvents', when(0, '02:10:00'), { DeviceName: 'HF-HR-SYNC-01', AccountName: 'SYSTEM', ProcessName: 'heronsvc.exe', ParentProcessName: 'services.exe', CommandLine: 'heronsvc.exe --quiet', SHA256: 'heronsvc-implant' });
    t.add('NetworkEvents', when(0, '02:30:00'), { DeviceName: 'HF-HR-SYNC-01', InitiatingProcessFileName: 'heronsvc.exe', RemoteIP: GH.ips.c2, RemotePort: 443, RemoteUrl: GH.domains.c2, ActionType: 'ConnectionSuccess', BytesSent: 1500 });
    t.add('SecurityAlerts', when(1, '09:00:00'), { AlertName: 'HR sync account exporting sensitive record categories', Severity: 'High', DeviceName: 'HF-HR-SYNC-01', Entity: EP37_SVC, Status: 'New', Product: 'Halcyon UEBA' });
    t.add('ThreatIntel', when(1, '08:00:00'), { Indicator: GH.ips.c2, IndicatorType: 'ip', Actor: GH.name, Confidence: 'High', Source: 'Government partner notification', Limitation: 'Low-and-slow theft is sized from retained logs; records taken before the retention window cannot be counted.' });
    t.add('ResponseActions', when(1, '10:00:00'), { IncidentId: 'IR-0510', Target: EP37_SVC, Action: 'DisableAccount', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(1, '10:05:00'), { IncidentId: 'IR-0510', Target: 'HF-HR-SYNC-01', Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(1, '10:30:00'), { IncidentId: 'IR-0510', Target: GH.ips.c2, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'foothold', prompt: 'Which service account was used to export records?', teach: 'Patient intruders ride quiet, trusted identities. An HR sync service account rarely draws attention — which is exactly why it was chosen. Identify it to anchor the investigation.', query: 'CloudAuditEvents | where Operation == "ExportRecords" and Resource startswith "HR/" | distinct UserPrincipalName', column: 'UserPrincipalName', hint: 'distinct UserPrincipalName on the HR export events.' },
    { chapter: 'foothold', prompt: 'Which quiet implant was running on the HR sync host?', teach: 'Behind the service account is an implant. A process running with a "--quiet" flag, named to blend in, is the backdoor maintaining the long watch. Note it for eradication.', query: 'ProcessEvents | where DeviceName == "HF-HR-SYNC-01" and CommandLine contains "quiet"', column: 'ProcessName', hint: 'Find the quiet process on the HR sync host.' },
    { chapter: 'foothold', prompt: 'Which C2 did that implant contact?', teach: 'The implant beacons to the actor’s known C2 — tying this patient espionage to the season’s espionage actor and distinguishing it from noisy criminal activity.', query: 'NetworkEvents | where DeviceName == "HF-HR-SYNC-01" and InitiatingProcessFileName == "heronsvc.exe"', column: 'RemoteIP', hint: 'Find the implant’s outbound connection.' },
    { chapter: 'theft', prompt: 'How many export operations did the account perform?', teach: 'Low-and-slow means many small pulls rather than one big grab, to stay under alerting thresholds. Counting the exports reveals the drip-feed pattern.', query: `CloudAuditEvents | where Operation == "ExportRecords" and UserPrincipalName == "${EP37_SVC}" | count`, column: 'Count', hint: 'Count ExportRecords operations for the account.', type: 'number' },
    { chapter: 'theft', prompt: 'How many distinct record categories were taken?', teach: 'The breadth of categories — background forms, clearances, next-of-kin — signals intelligence value, not financial. Counting distinct resources shows how comprehensive the theft was.', query: `CloudAuditEvents | where Operation == "ExportRecords" and UserPrincipalName == "${EP37_SVC}" | summarize dcount(Resource)`, column: 'dcount_Resource', hint: 'dcount(Resource) over the exports.', type: 'number' },
    { chapter: 'theft', prompt: 'How many records were exported in total?', teach: 'Summing the records read sizes the exposure — though, as the intel notes, this is a floor: anything taken before log retention cannot be counted.', query: `CloudAuditEvents | where Operation == "ExportRecords" and UserPrincipalName == "${EP37_SVC}" | summarize sum(ItemCount)`, column: 'sum_ItemCount', hint: 'summarize sum(ItemCount) over the exports.', type: 'number' },
    { chapter: 'theft', prompt: 'What limitation does the intelligence note about counting the theft?', teach: 'Patient theft defeats precise accounting: you can only measure what the logs retained. Report the total as a minimum, and say so plainly.', query: `ThreatIntel | where Indicator == "${GH.ips.c2}"`, column: 'Limitation', hint: 'Read the Limitation on the C2 intel record.' },
    { chapter: 'response', prompt: 'Which action cut the account’s access?', teach: 'Disabling the ridden service account stops the ongoing exports immediately — the first eviction step.', query: `ResponseActions | where Target == "${EP37_SVC}"`, column: 'Action', hint: 'Find the response action targeting the service account.' },
    { chapter: 'response', prompt: 'Which host was isolated?', teach: 'Isolating the implanted HR sync host contains the backdoor and preserves it for forensic analysis of how the long watch began.', query: 'ResponseActions | where Target == "HF-HR-SYNC-01"', column: 'Action', hint: 'Find the response action targeting the HR sync host.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the account disable, host isolation and indicator block into a single reviewable response to a nation-state intrusion.', query: 'ResponseActions | where Action == "DisableAccount" and IncidentId == "IR-0510"', column: 'IncidentId', hint: 'Read IncidentId on the account-disable action.' },
  ],
});

// ── Episode 38 · The Vendor's Key ───────────────────────────────────────────────────────────────
const EP38_VENDOR = 'svc-hvac-vendor@halcyonfreight.example';
const EP38_POS = ['HF-STORE-01', 'HF-STORE-02', 'HF-STORE-03', 'HF-STORE-04'];

export const ep38 = defineCasebook({
  id: 'casebook-s1e38-vendors-key',
  episode: 38,
  title: 'The Vendor\u2019s Key',
  difficulty: 'Medium',
  replaces: 'siem-chronicle-home-depot-2014',
  inspiredBy: 'stolen third-party vendor credentials used to reach point-of-sale systems and deploy custom card-stealing malware',
  date: '2027-05-17',
  briefing: 'Fraud is tracing back to Halcyon’s retail checkouts again — but this time the way in was a facilities vendor’s stolen login, reused to reach systems it had no business touching. The malware was custom-built to dodge antivirus. Trace the vendor foothold, the self-checkout infections, and how the segmentation gap was closed.',
  chapters: [
    { id: 'vendor', title: 'The vendor foothold' },
    { id: 'infection', title: 'The checkouts' },
    { id: 'response', title: 'Segment and block' },
  ],
  inject(t, when) {
    t.add('SigninLogs', when(0, '23:50:00'), { UserPrincipalName: EP38_VENDOR, IPAddress: '198.51.100.70', ResultType: 0, ResultDescription: 'Success', AppName: 'Vendor Portal', DeviceName: 'unknown', Location: 'US', MfaResult: 'NotRequired', SessionId: 'VEND-38' });
    EP38_POS.forEach((host, i) => {
      t.add('NetworkEvents', when(1, `00:1${i}:00`), { DeviceName: host, InitiatingProcessFileName: 'System', RemoteIP: '10.40.252.40', RemotePort: 445, RemoteUrl: '', ActionType: 'InboundConnectionAccepted', BytesSent: 0 });
      t.add('FileEvents', when(1, `00:1${i}:30`), { DeviceName: host, AccountName: 'pos-svc', ActionType: 'FileCreated', FileName: 'winsvc32.exe', FolderPath: 'C:\\Windows\\Temp', SizeBytes: 120_000, SHA256: 'custom-pos-scraper', AvVerdict: 'Clean' });
      t.add('ProcessEvents', when(1, `00:1${i}:45`), { DeviceName: host, AccountName: 'SYSTEM', ProcessName: 'winsvc32.exe', ParentProcessName: 'services.exe', CommandLine: 'winsvc32.exe -scan checkout.exe', SHA256: 'custom-pos-scraper' });
      for (let d = 0; d < 2; d++) t.add('NetworkEvents', when(d, `2${d}:${String(15 + i).padStart(2, '0')}:00`), { DeviceName: host, InitiatingProcessFileName: 'winsvc32.exe', RemoteIP: AT.ips.exfil, RemotePort: 443, RemoteUrl: AT.domains.exfil, ActionType: 'ConnectionSuccess', BytesSent: 300_000 });
    });
    t.add('SecurityAlerts', when(1, '08:00:00'), { AlertName: 'Checkout terminal beaconing to external host', Severity: 'High', DeviceName: EP38_POS[0], Entity: 'retail', Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(1, '07:30:00'), { Indicator: AT.ips.exfil, IndicatorType: 'ip', Actor: AT.name, Confidence: 'Medium', Source: 'Card brand fraud notification', Limitation: 'Custom malware cleared antivirus; signature-based tools cannot be relied on to bound this exposure.' });
    t.add('ResponseActions', when(1, '09:00:00'), { IncidentId: 'IR-0517', Target: EP38_VENDOR, Action: 'DisableAccount', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(1, '09:10:00'), { IncidentId: 'IR-0517', Target: 'checkout-vlan', Action: 'SegmentNetwork', Result: 'Success', ApprovedBy: 'network-eng' });
    t.add('ResponseActions', when(1, '09:20:00'), { IncidentId: 'IR-0517', Target: AT.ips.exfil, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'vendor', prompt: 'Which vendor account signed in without MFA?', teach: 'Third-party access is a recurring weak point. A facilities vendor account with no MFA, signing in at midnight, is the foothold — identify it to disable and to understand the access path.', query: 'SigninLogs | where AppName == "Vendor Portal" and MfaResult == "NotRequired"', column: 'UserPrincipalName', hint: 'Find the Vendor Portal sign-in with MFA NotRequired.' },
    { chapter: 'vendor', prompt: 'How many checkout terminals accepted an SMB connection from the vendor network?', teach: 'A facilities vendor has no business reaching payment terminals — that it could is a segmentation failure. Counting port-445 acceptances from the vendor’s internal address scopes the reach.', query: 'NetworkEvents | where RemoteIP == "10.40.252.40" and RemotePort == 445 | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'dcount(DeviceName) for port-445 connections from the vendor address.', type: 'number' },
    { chapter: 'infection', prompt: 'What malware file was dropped on the checkouts?', teach: 'The scraper hides in Temp under a service-like name. Crucially, antivirus marked it clean — custom malware is built to evade signatures, which is why behaviour matters more than verdicts.', query: 'FileEvents | where FolderPath contains "Temp" and SHA256 == "custom-pos-scraper" | distinct FileName', column: 'FileName', hint: 'distinct FileName for the custom scraper.' },
    { chapter: 'infection', prompt: 'What antivirus verdict did that file receive?', teach: 'The verdict ("Clean") is the lesson: signature-based AV cleared custom malware. Detection here depended on spotting the behaviour — the beaconing — not the file.', query: 'FileEvents | where SHA256 == "custom-pos-scraper" | distinct AvVerdict', column: 'AvVerdict', hint: 'distinct AvVerdict on the scraper file.' },
    { chapter: 'infection', prompt: 'Which process does the scraper target, per its command line?', teach: 'The malware scans the memory of the checkout process where card data is briefly unencrypted. The command line names its target — confirming it is a RAM scraper after card data.', query: 'ProcessEvents | where SHA256 == "custom-pos-scraper" | distinct CommandLine', column: 'CommandLine', hint: 'distinct CommandLine on the scraper process.' },
    { chapter: 'infection', prompt: 'To which external IP did the terminals exfiltrate?', teach: 'The beaconing that AV missed is the real detection. The destination matches the actor’s exfil infrastructure and is the indicator to block.', query: 'NetworkEvents | where InitiatingProcessFileName == "winsvc32.exe" | distinct RemoteIP', column: 'RemoteIP', hint: 'distinct RemoteIP on the scraper’s connections.' },
    { chapter: 'infection', prompt: 'What limitation does the intelligence note about antivirus?', teach: 'The explicit warning: custom malware cleared AV, so signature tools cannot bound this exposure. Scope must come from behaviour and network evidence instead.', query: `ThreatIntel | where Indicator == "${AT.ips.exfil}"`, column: 'Limitation', hint: 'Read the Limitation on the exfil-IP intel record.' },
    { chapter: 'response', prompt: 'Which action removed the vendor foothold?', teach: 'Disabling the compromised vendor account cuts the entry path while the terminals are cleaned.', query: `ResponseActions | where Target == "${EP38_VENDOR}"`, column: 'Action', hint: 'Find the response action targeting the vendor account.' },
    { chapter: 'response', prompt: 'Which control stops a vendor from reaching checkouts again? Enter the response action name.', teach: 'The durable fix is network segmentation: the vendor network should never route to payment terminals. Segmenting the checkout VLAN closes the gap that enabled the whole breach.', query: 'ResponseActions | where Target == "checkout-vlan"', column: 'Action', hint: 'Find the response action targeting the checkout VLAN.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the account disable, the segmentation and the indicator block into a single reviewable response.', query: 'ResponseActions | where Action == "SegmentNetwork"', column: 'IncidentId', hint: 'Read IncidentId on the segmentation action.' },
  ],
});
