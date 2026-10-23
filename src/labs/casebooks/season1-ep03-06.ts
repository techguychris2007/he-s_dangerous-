import { defineCasebook } from './casebook';
import { staffIn } from './world';
import { ASHEN_TIDE as AT, GLASS_HERON as GH } from './actors';

// ── Episode 3 · The Trusted Update ──────────────────────────────────────────────────────────────
const fleet = [...staffIn('IT'), ...staffIn('Engineering'), ...staffIn('Finance')].slice(0, 30);
const beaconing = fleet.slice(0, 18);
const [ep3Admin, ep3Engineer] = [fleet[0], fleet[9]];

export const ep03 = defineCasebook({
  id: 'casebook-s1e03-trusted-update',
  episode: 3,
  title: 'The Trusted Update',
  difficulty: 'Hard',
  replaces: 'defence-supply-chain-hunt',
  inspiredBy: 'software supply-chain compromises delivered through signed vendor updates',
  date: '2026-09-14',
  briefing: 'FleetPulse, the monitoring agent on Halcyon\'s IT, engineering and finance laptops, auto-updated overnight. By morning a threat-intelligence partner warns that a FleetPulse release is trojanised. Hunt the fleet: which devices took the update, which began talking to infrastructure that is not the vendor\'s, where the operator went hands-on, and whether the rollback reached every affected device.',
  chapters: [
    { id: 'fleet', title: 'Know the fleet' },
    { id: 'update', title: 'The update' },
    { id: 'beacon', title: 'The new conversation' },
    { id: 'handson', title: 'Hands on keyboard' },
    { id: 'response', title: 'Rollback and eviction' },
  ],
  inject(t, when) {
    fleet.forEach((e, i) => {
      t.add('DnsEvents', when(0, `03:0${i % 10}:${String(10 + i).padStart(2, '0')}`), { DeviceName: e.hostname, ClientIP: e.ip, QueryName: 'updates.fleetpulse.example', QueryType: 'A', Answer: '192.0.2.70' });
      t.add('FileEvents', when(0, `03:0${i % 10}:${String(20 + i).padStart(2, '0')}`), { DeviceName: e.hostname, AccountName: 'SYSTEM', ActionType: 'FileModified', FileName: 'fleetpulse-agent.exe', FolderPath: 'C:\\Program Files\\FleetPulse', FileVersion: '5.2.1', Signer: 'FleetPulse Software Ltd', SizeBytes: 5_812_224, SHA256: 'fp-5.2.1-trojanised' });
      t.add('ProcessEvents', when(0, `03:1${i % 10}:${String(10 + i).padStart(2, '0')}`), { DeviceName: e.hostname, AccountName: 'SYSTEM', ProcessName: 'fleetpulse-agent.exe', ParentProcessName: 'services.exe', CommandLine: '"C:\\Program Files\\FleetPulse\\fleetpulse-agent.exe" --service', SHA256: 'fp-5.2.1-trojanised' });
    });
    beaconing.forEach((e, i) => {
      t.add('DnsEvents', when(0, `04:${String(i * 3).padStart(2, '0')}:05`), { DeviceName: e.hostname, ClientIP: e.ip, QueryName: GH.domains.c2, QueryType: 'A', Answer: GH.ips.c2 });
      for (let k = 0; k < 3; k++) t.add('NetworkEvents', when(k === 2 ? 1 : 0, `${k === 1 ? '16' : '04'}:${String(i * 3).padStart(2, '0')}:1${k}`), { DeviceName: e.hostname, InitiatingProcessFileName: 'fleetpulse-agent.exe', RemoteIP: GH.ips.c2, RemotePort: 443, RemoteUrl: GH.domains.c2, ActionType: 'ConnectionSuccess', BytesSent: 2_048 });
    });
    t.add('ProcessEvents', when(0, '11:22:41'), { DeviceName: ep3Admin.hostname, AccountName: 'SYSTEM', ProcessName: 'cmd.exe', ParentProcessName: 'fleetpulse-agent.exe', CommandLine: 'cmd.exe /c whoami /all && net group "IT-Admins" /domain', SHA256: 'cmd-signed' });
    t.add('ProcessEvents', when(0, '11:31:02'), { DeviceName: ep3Engineer.hostname, AccountName: 'SYSTEM', ProcessName: 'powershell.exe', ParentProcessName: 'fleetpulse-agent.exe', CommandLine: 'powershell.exe -nop -c Get-ChildItem \\\\files.halcyonfreight.example\\engineering -Recurse', SHA256: 'powershell-signed' });
    t.add('FileEvents', when(0, '11:40:15'), { DeviceName: ep3Admin.hostname, AccountName: 'SYSTEM', ActionType: 'FileCreated', FileName: GH.implant, FolderPath: 'C:\\ProgramData\\HeronSync', SizeBytes: 1_204_224, SHA256: 'heronsvc-implant' });
    t.add('ProcessEvents', when(0, '11:40:30'), { DeviceName: ep3Admin.hostname, AccountName: 'SYSTEM', ProcessName: 'sc.exe', ParentProcessName: 'cmd.exe', CommandLine: `sc.exe create HeronSync binPath= "C:\\ProgramData\\HeronSync\\${GH.implant}" start= auto`, SHA256: 'sc-signed' });
    t.add('SecurityAlerts', when(0, '11:44:00'), { AlertName: 'LSASS memory read by unsigned service', Severity: 'High', DeviceName: ep3Admin.hostname, Entity: ep3Admin.email, Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '08:00:00'), { Indicator: GH.domains.c2, IndicatorType: 'domain', Actor: GH.name, Confidence: 'High', Source: 'Partner sharing community', Limitation: 'Attribution reflects the partner\'s assessment and has not been independently verified.' });
    beaconing.forEach((e, i) => t.add('ResponseActions', when(1, `09:${String(i * 2).padStart(2, '0')}:00`), { IncidentId: 'IR-0915', Target: e.hostname, Action: 'RollbackAgent', TargetVersion: '5.2.0', Result: i === 13 ? 'Failed' : 'Success', ApprovedBy: 'it-manager' }));
    [ep3Admin, ep3Engineer].forEach((e, i) => t.add('ResponseActions', when(0, `12:1${i}:00`), { IncidentId: 'IR-0915', Target: e.hostname, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' }));
  },
  questions: [
    { chapter: 'fleet', prompt: 'On how many devices did fleetpulse-agent.exe start after the overnight update?', teach: 'Before hunting, size the population. Count distinct devices where the agent process started — `summarize dcount(DeviceName)` — because one device can start the agent many times.', query: 'ProcessEvents | where ProcessName == "fleetpulse-agent.exe" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'dcount(DeviceName) over agent process starts.', type: 'number' },
    { chapter: 'update', prompt: 'Which agent version did the update install?', teach: 'FileEvents records the new binary\'s version and signer. A valid vendor signature means the vendor\'s build system produced the file — it does not prove the file is safe. That is what makes supply-chain attacks so effective.', query: 'FileEvents | where FileName == "fleetpulse-agent.exe" | distinct FileVersion', column: 'FileVersion', hint: 'distinct FileVersion on the agent binary.' },
    { chapter: 'update', prompt: 'Which domain served the update?', teach: 'Confirm the delivery path. The update came from the vendor\'s real update host — the compromise happened upstream, at the vendor, not in Halcyon\'s network. Blocking the vendor domain would stop future updates but not the implant already installed.', query: 'DnsEvents | where QueryName contains "fleetpulse" | distinct QueryName', column: 'QueryName', hint: 'distinct QueryName for lookups containing "fleetpulse".' },
    { chapter: 'beacon', prompt: 'To which non-vendor IP address did the agent itself start connecting?', teach: 'Profile the process, not just the network. A monitoring agent should only talk to its vendor. Filter NetworkEvents to the agent process and exclude the vendor\'s address (192.0.2.70) to see who else it talks to.', query: 'NetworkEvents | where InitiatingProcessFileName == "fleetpulse-agent.exe" and RemoteIP != "192.0.2.70" | distinct RemoteIP', column: 'RemoteIP', hint: 'Filter on the agent process and RemoteIP != the vendor address.' },
    { chapter: 'beacon', prompt: 'Which domain name resolves to that address?', teach: 'Turn an IP back into a name with DNS answers. Names like "analytics" are chosen to look like telemetry, which helps the traffic blend in.', query: `DnsEvents | where Answer == "${GH.ips.c2}" | distinct QueryName`, column: 'QueryName', hint: 'Search DnsEvents for that Answer.' },
    { chapter: 'beacon', prompt: 'How many devices beaconed to it?', teach: 'Not every device that received the update called out: the implant can stay dormant on most machines and wake on chosen targets. Your rollback scope is the beaconing set plus any device the operator touched.', query: `NetworkEvents | where RemoteIP == "${GH.ips.c2}" | summarize dcount(DeviceName)`, column: 'dcount_DeviceName', hint: 'dcount(DeviceName) for connections to the C2 address.', type: 'number' },
    { chapter: 'beacon', prompt: 'Which threat actor does the intelligence feed associate with that domain?', teach: 'ThreatIntel is a partner\'s assessment, not ground truth. Record the actor name with its confidence and limitation, and keep collecting your own evidence.', query: `ThreatIntel | where Indicator == "${GH.domains.c2}"`, column: 'Actor', hint: 'Look up the domain in ThreatIntel.' },
    { chapter: 'handson', prompt: 'On how many devices did the agent spawn a shell?', teach: 'A dormant implant becomes an intrusion when an operator issues commands. A monitoring agent launching cmd.exe or powershell.exe is a strong signal of hands-on activity.', query: 'ProcessEvents | where ParentProcessName == "fleetpulse-agent.exe" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'Count distinct devices where the agent is the parent process.', type: 'number' },
    { chapter: 'handson', prompt: `What did the operator install on ${ep3Admin.hostname} for persistence? Enter the file name.`, teach: 'Persistence keeps access alive if the trojanised agent is rolled back. Look for new executables in C:\\ProgramData — a writable, rarely inspected folder.', query: `FileEvents | where DeviceName == "${ep3Admin.hostname}" and FolderPath contains "ProgramData"`, column: 'FileName', hint: 'Look for files created under ProgramData on the admin device.' },
    { chapter: 'handson', prompt: 'Which command registered the persistence service? Enter the full command line.', teach: 'sc.exe create registers a Windows service that starts on boot. The service name inside this command is what defenders search for on other hosts and what eradication must remove.', query: `ProcessEvents | where DeviceName == "${ep3Admin.hostname}" and ProcessName == "sc.exe"`, column: 'CommandLine', hint: 'Read the sc.exe command line.' },
    { chapter: 'handson', prompt: `Which alert indicates credential theft on ${ep3Admin.hostname}?`, teach: 'Reading LSASS memory is how attackers extract passwords and tickets from Windows. On an IT administrator\'s laptop, assume privileged credentials are exposed and plan resets accordingly.', query: `SecurityAlerts | where DeviceName == "${ep3Admin.hostname}" and Severity == "High"`, column: 'AlertName', hint: 'High-severity alert on the admin device.' },
    { chapter: 'response', prompt: 'Which version did responders roll the agent back to?', teach: 'Rolling back to the last known-good version removes the trojanised code but not anything the operator installed separately — such as the persistence service you found.', query: 'ResponseActions | where Action == "RollbackAgent" | distinct TargetVersion', column: 'TargetVersion', hint: 'distinct TargetVersion on RollbackAgent actions.' },
    { chapter: 'response', prompt: 'On which device did the rollback fail?', teach: 'Read every receipt. One failed rollback leaves an active implant on the network while the ticket says "done".', query: 'ResponseActions | where Action == "RollbackAgent" and Result == "Failed"', column: 'Target', hint: 'Find the RollbackAgent receipt with Result Failed.' },
  ],
});

// ── Episode 4 · Borrowed Voice ──────────────────────────────────────────────────────────────────
const marketer = staffIn('Sales')[3];
const salesLead = staffIn('Sales')[9];
const EP4_DOMAIN = 'brandcollab-verify.example';

export const ep04 = defineCasebook({
  id: 'casebook-s1e04-borrowed-voice',
  episode: 4,
  title: 'Borrowed Voice',
  difficulty: 'Medium',
  replaces: 'siem-narrative-clouthaus-breach',
  inspiredBy: 'brand-account takeovers used for cryptocurrency giveaway scams',
  date: '2026-09-21',
  briefing: 'Halcyon Freight\'s official social account has just posted a "freight credit giveaway" asking customers to send cryptocurrency. Marketing did not write it. Trace how the attacker got into the social media manager, what they changed so they could stay, and how many people saw the scam before the account was recovered.',
  chapters: [
    { id: 'post', title: 'The rogue post' },
    { id: 'phish', title: 'How they got in' },
    { id: 'persist', title: 'Locking the owner out' },
    { id: 'recover', title: 'Recovery' },
  ],
  inject(t, when) {
    const v = marketer;
    t.add('EmailEvents', when(0, '10:12:03'), { MessageId: 'BC-0921', SenderAddress: `partnerships@${EP4_DOMAIN}`, RecipientAddress: v.email, Subject: 'Paid partnership offer - verify your brand account', Url: `https://${EP4_DOMAIN}/connect?brand=halcyon`, AttachmentName: '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
    t.add('DnsEvents', when(0, '10:30:40'), { DeviceName: v.hostname, ClientIP: v.ip, QueryName: EP4_DOMAIN, QueryType: 'A', Answer: '203.0.113.120' });
    t.add('ProxyEvents', when(0, '10:30:41'), { DeviceName: v.hostname, UserPrincipalName: v.email, Url: `https://${EP4_DOMAIN}/connect?brand=halcyon`, Domain: EP4_DOMAIN, DestinationIP: '203.0.113.120', Method: 'GET', StatusCode: 200, BytesSent: 700, BytesReceived: 31_220, UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0' });
    t.add('ProxyEvents', when(0, '10:31:55'), { DeviceName: v.hostname, UserPrincipalName: v.email, Url: `https://${EP4_DOMAIN}/connect/submit`, Domain: EP4_DOMAIN, DestinationIP: '203.0.113.120', Method: 'POST', StatusCode: 302, BytesSent: 1_402, BytesReceived: 300, UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0' });
    t.add('SigninLogs', when(0, '10:34:12'), { UserPrincipalName: v.email, IPAddress: '203.0.113.121', ResultType: 0, ResultDescription: 'Success', AppName: 'Halcyon Social Manager', DeviceName: 'unknown', Location: 'US', MfaResult: 'NotRequired', SessionId: 'SOC-SESS-882' });
    t.add('CloudAuditEvents', when(0, '10:36:00'), { UserPrincipalName: v.email, Operation: 'UpdateRecoveryEmail', Resource: 'Halcyon Social Manager', NewValue: 'halcyon.social.team@mailbox-free.example', IPAddress: '203.0.113.121', SessionId: 'SOC-SESS-882', Result: 'Success' });
    t.add('CloudAuditEvents', when(0, '10:37:30'), { UserPrincipalName: v.email, Operation: 'AddAdmin', Resource: 'Halcyon Social Manager', NewValue: 'growth.partner.77', IPAddress: '203.0.113.121', SessionId: 'SOC-SESS-882', Result: 'Success' });
    t.add('CloudAuditEvents', when(0, '10:38:10'), { UserPrincipalName: v.email, Operation: 'RemoveAdmin', Resource: 'Halcyon Social Manager', NewValue: salesLead.email, IPAddress: '203.0.113.121', SessionId: 'SOC-SESS-882', Result: 'Success' });
    ['10:45:00', '11:15:00', '11:45:00', '12:15:00'].forEach((time, i) => t.add('CloudAuditEvents', when(0, time), { UserPrincipalName: 'growth.partner.77', Operation: 'PublishPost', Resource: 'Halcyon Social Manager', NewValue: `Freight credit giveaway #${i + 1}: send crypto to double your credit`, IPAddress: '203.0.113.121', SessionId: 'SOC-SESS-903', Result: 'Success', Impressions: 4_100 + i * 2_250 }));
    t.add('SecurityAlerts', when(0, '12:20:00'), { AlertName: 'Brand account posting from new location', Severity: 'Medium', DeviceName: '', Entity: v.email, Status: 'New', Product: 'Halcyon Cloud Defender' });
    t.add('ResponseActions', when(0, '12:40:00'), { IncidentId: 'IR-0921', Target: 'Halcyon Social Manager', Action: 'ResetOwnerViaVendor', Result: 'Success', ApprovedBy: 'cmo' });
    t.add('ResponseActions', when(0, '12:44:00'), { IncidentId: 'IR-0921', Target: 'growth.partner.77', Action: 'RemoveAdmin', Result: 'Success', ApprovedBy: 'cmo' });
    t.add('ResponseActions', when(0, '12:50:00'), { IncidentId: 'IR-0921', Target: 'Halcyon Social Manager', Action: 'DeletePosts', Result: 'Success', ApprovedBy: 'cmo', Count: 4 });
    t.add('ResponseActions', when(0, '13:05:00'), { IncidentId: 'IR-0921', Target: 'Halcyon Social Manager', Action: 'EnforceMfa', Result: 'Success', ApprovedBy: 'ciso' });
  },
  questions: [
    { chapter: 'post', prompt: 'How many giveaway posts were published?', teach: 'CloudAuditEvents also covers business SaaS like the social media manager. PublishPost events are the public-facing impact — count them before anything else so communications know what to retract.', query: 'CloudAuditEvents | where Operation == "PublishPost" | count', column: 'Count', hint: 'Count PublishPost operations.', type: 'number' },
    { chapter: 'post', prompt: 'Which account published them?', teach: 'The publishing account is not an employee mailbox — it is an admin the attacker added. Attackers create their own identity inside a platform so they keep access even if the original victim resets a password.', query: 'CloudAuditEvents | where Operation == "PublishPost" | distinct UserPrincipalName', column: 'UserPrincipalName', hint: 'distinct UserPrincipalName on PublishPost.' },
    { chapter: 'post', prompt: 'How many impressions did the rogue posts receive in total?', teach: '`summarize sum(Impressions)` adds a numeric field across rows. Impressions estimate how many customers may have seen the scam — this drives the customer warning.', query: 'CloudAuditEvents | where Operation == "PublishPost" | summarize sum(Impressions)', column: 'sum_Impressions', hint: 'summarize sum(Impressions) over PublishPost events.', type: 'number' },
    { chapter: 'phish', prompt: 'Whose Halcyon account added the attacker\'s admin?', teach: 'Pivot from the new admin to the AddAdmin event. The UserPrincipalName on that event is the compromised staff account that performed it.', query: 'CloudAuditEvents | where Operation == "AddAdmin"', column: 'UserPrincipalName', hint: 'Find AddAdmin and read UserPrincipalName.' },
    { chapter: 'phish', prompt: 'From which IP address was that account signed in to the Social Manager?', teach: 'SigninLogs per application show which app was accessed. The social manager did not require MFA — a policy gap that turned one phished password into full brand control.', query: `SigninLogs | where UserPrincipalName == "${marketer.email}" and AppName == "Halcyon Social Manager"`, column: 'IPAddress', hint: 'Filter SigninLogs to the account and the Social Manager app.' },
    { chapter: 'phish', prompt: 'Which domain did the marketer submit a form to minutes before that sign-in?', teach: 'Credential phishing leaves a GET (the page loads) and a POST (the form is submitted) in the proxy log. The POST is the moment the password left.', query: `ProxyEvents | where UserPrincipalName == "${marketer.email}" and Method == "POST"`, column: 'Domain', hint: 'Find the marketer\'s POST request.' },
    { chapter: 'phish', prompt: 'What was the subject of the email that carried the link?', teach: 'Brand-partnership offers target marketing teams because responding to unknown partners is their job. Pretext matches role.', query: `EmailEvents | where Url contains "${EP4_DOMAIN}"`, column: 'Subject', hint: 'Search EmailEvents URLs for that domain.' },
    { chapter: 'persist', prompt: 'Which recovery email address did the attacker set?', teach: 'Changing the recovery address lets an attacker reclaim the account after the owner resets the password. Always check recovery settings during account recovery.', query: 'CloudAuditEvents | where Operation == "UpdateRecoveryEmail"', column: 'NewValue', hint: 'Read NewValue on UpdateRecoveryEmail.' },
    { chapter: 'persist', prompt: 'Which legitimate administrator did the attacker remove?', teach: 'Removing the real admins delays the response: the people who could fix the account no longer can. This is why vendor-assisted recovery was needed.', query: 'CloudAuditEvents | where Operation == "RemoveAdmin"', column: 'NewValue', hint: 'Read NewValue on RemoveAdmin.' },
    { chapter: 'recover', prompt: 'How did the company regain ownership? Enter the response action name.', teach: 'When attackers remove every legitimate admin, ownership must be proven to the platform vendor. Document the vendor case so it can be repeated quickly next time.', query: 'ResponseActions | where IncidentId == "IR-0921" and TimeGenerated == datetime("2026-09-21T12:40:00Z")', column: 'Action', hint: 'Read the first IR-0921 action at 12:40.' },
    { chapter: 'recover', prompt: 'Which control was enforced last to prevent a repeat?', teach: 'Containment removes the attacker; hardening removes the gap they used — here, the missing MFA on a high-impact SaaS app.', query: 'ResponseActions | where IncidentId == "IR-0921" and ApprovedBy == "ciso"', column: 'Action', hint: 'The final action was approved by the CISO.' },
  ],
});

// ── Episode 5 · Alerts Nobody Read ──────────────────────────────────────────────────────────────
const KIOSKS = ['HF-WHS-KIOSK-01', 'HF-WHS-KIOSK-02', 'HF-WHS-KIOSK-03', 'HF-WHS-KIOSK-04', 'HF-WHS-KIOSK-05'];
const VENDOR = 'svc-coolair@halcyonfreight.example';

export const ep05 = defineCasebook({
  id: 'casebook-s1e05-alerts-nobody-read',
  episode: 5,
  title: 'Alerts Nobody Read',
  difficulty: 'Medium',
  replaces: 'siem-suricata-target-2013',
  inspiredBy: 'retail breaches where a facilities vendor\'s access led to point-of-sale malware while alerts went unanswered',
  date: '2026-09-28',
  briefing: 'A card-processing partner reports that cards used at Halcyon\'s warehouse self-service kiosks are turning up in fraud. The IDS has been raising alerts for two days. Work out how the attacker reached the kiosks, what they installed, where the data went — and why nobody acted on the alerts.',
  chapters: [
    { id: 'alerts', title: 'The ignored alerts' },
    { id: 'entry', title: 'The way in' },
    { id: 'kiosks', title: 'The kiosks' },
    { id: 'exfil', title: 'Where the data went' },
  ],
  inject(t, when) {
    t.add('VpnLogs', when(0, '01:12:40'), { UserPrincipalName: VENDOR, SourceIP: '198.51.100.61', AssignedIP: '10.40.250.20', Gateway: 'vpn-acc-02', Result: 'Connected', MfaUsed: false });
    t.add('SigninLogs', when(0, '01:13:02'), { UserPrincipalName: VENDOR, IPAddress: '198.51.100.61', ResultType: 0, ResultDescription: 'Success', AppName: 'Vendor Portal', DeviceName: 'unknown', Location: 'RO', MfaResult: 'NotRequired', SessionId: 'VEN-SESS-11' });
    KIOSKS.forEach((k, i) => {
      t.add('NetworkEvents', when(0, `01:2${i}:00`), { DeviceName: k, InitiatingProcessFileName: 'System', RemoteIP: '10.40.250.20', RemotePort: 445, RemoteUrl: '', ActionType: 'InboundConnectionAccepted', BytesSent: 0 });
      t.add('FileEvents', when(0, `01:2${i}:20`), { DeviceName: k, AccountName: 'kiosk-admin', ActionType: 'FileCreated', FileName: 'possvc.exe', FolderPath: 'C:\\Windows\\Temp', SizeBytes: 98_304, SHA256: 'possvc-scraper' });
      t.add('ProcessEvents', when(0, `01:2${i}:40`), { DeviceName: k, AccountName: 'SYSTEM', ProcessName: 'possvc.exe', ParentProcessName: 'services.exe', CommandLine: 'C:\\Windows\\Temp\\possvc.exe -svc -scan pos.exe', SHA256: 'possvc-scraper' });
      t.add('SecurityAlerts', when(0, `01:3${i}:00`), { AlertName: 'Malware staging over SMB', Severity: 'High', DeviceName: k, Entity: VENDOR, Status: 'New', Product: 'Halcyon IDS' });
    });
    for (let d = 0; d < 2; d++) for (let h = 0; h < 4; h++) {
      const k = KIOSKS[(d * 4 + h) % KIOSKS.length];
      t.add('NetworkEvents', when(d, `2${h}:15:00`), { DeviceName: k, InitiatingProcessFileName: 'possvc.exe', RemoteIP: AT.ips.exfil, RemotePort: 21, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 250_000 + h * 10_000 });
      t.add('SecurityAlerts', when(d, `2${h}:16:00`), { AlertName: 'Cleartext FTP upload to external host', Severity: 'High', DeviceName: k, Entity: AT.ips.exfil, Status: 'New', Product: 'Halcyon IDS' });
    }
    t.add('ThreatIntel', when(1, '09:00:00'), { Indicator: AT.ips.exfil, IndicatorType: 'ip', Actor: AT.name, Confidence: 'Medium', Source: 'Card-processing partner notification', Limitation: 'Based on the partner\'s fraud correlation; no samples were shared.' });
  },
  questions: [
    { chapter: 'alerts', prompt: 'How many High-severity IDS alerts are still in status New?', teach: 'An alert nobody triages is the same as no alert. Count High-severity alerts from the IDS that were never acknowledged — and compare with the dismissed noise around them.', query: 'SecurityAlerts | where Product == "Halcyon IDS" and Severity == "High" and Status == "New" | count', column: 'Count', hint: 'Filter on Product, Severity and Status, then count.', type: 'number' },
    { chapter: 'alerts', prompt: 'Which IDS alert name appears most often?', teach: '`summarize count() by AlertName | sort by count_ desc | take 1` ranks alert names. Repetition is a signal: the same alert firing nightly means an ongoing process, not a one-off.', query: 'SecurityAlerts | where Product == "Halcyon IDS" | summarize count() by AlertName | sort by count_ desc | take 1', column: 'AlertName', hint: 'Summarize count() by AlertName, sort descending, take 1.' },
    { chapter: 'entry', prompt: 'Which account connected to the VPN at 01:12 without MFA?', teach: 'VpnLogs record remote-access sessions. Service accounts for vendors are often exempt from MFA "because it\'s a shared account" — exactly what attackers look for.', query: 'VpnLogs | where MfaUsed == false', column: 'UserPrincipalName', hint: 'Filter VpnLogs on MfaUsed == false.' },
    { chapter: 'entry', prompt: 'Which internal address did the VPN assign to that session?', teach: 'The VPN gateway hands remote users an internal IP. That AssignedIP is the address you will see in internal logs — the bridge between "who logged in" and "what touched the kiosks".', query: `VpnLogs | where UserPrincipalName == "${VENDOR}"`, column: 'AssignedIP', hint: 'Read AssignedIP on the vendor\'s session.' },
    { chapter: 'kiosks', prompt: 'How many kiosks accepted an SMB connection from that address?', teach: 'Port 445 is SMB, Windows file sharing — used here to copy malware onto each kiosk. A facilities vendor has no reason to reach payment kiosks: that is a network segmentation failure.', query: 'NetworkEvents | where RemoteIP == "10.40.250.20" and RemotePort == 445 | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'dcount(DeviceName) for port-445 connections from the VPN address.', type: 'number' },
    { chapter: 'kiosks', prompt: 'What malware file was dropped on the kiosks?', teach: 'C:\\Windows\\Temp is world-writable and rarely monitored. A file named like a service ("…svc") in Temp is a common disguise.', query: 'FileEvents | where DeviceName == "HF-WHS-KIOSK-01" and FolderPath contains "Temp"', column: 'FileName', hint: 'Look at files created in a Temp folder on a kiosk.' },
    { chapter: 'kiosks', prompt: 'Which process does the malware scan, according to its command line? Enter the full command line.', teach: 'RAM scrapers read card data from the memory of the payment application while it is briefly unencrypted. The command line names its target.', query: 'ProcessEvents | where DeviceName == "HF-WHS-KIOSK-01" and ParentProcessName == "services.exe" and CommandLine contains "-scan"', column: 'CommandLine', hint: 'Read the full command line of the malware process.' },
    { chapter: 'exfil', prompt: 'Which external IP received the data?', teach: 'Exfiltration is outbound. Filter connections made by the malware process and list destinations.', query: 'NetworkEvents | where InitiatingProcessFileName == "possvc.exe" | distinct RemoteIP', column: 'RemoteIP', hint: 'distinct RemoteIP for connections made by the malware.' },
    { chapter: 'exfil', prompt: 'Which port did the uploads use?', teach: 'Port 21 is FTP — cleartext. The IDS could see these uploads precisely because they were unencrypted, which makes the unanswered alerts more painful.', query: 'NetworkEvents | where InitiatingProcessFileName == "possvc.exe" | distinct RemotePort', column: 'RemotePort', hint: 'distinct RemotePort for the same connections.', type: 'number' },
    { chapter: 'exfil', prompt: 'How many bytes were uploaded in total?', teach: 'Summing bytes estimates the volume stolen — required for breach-notification decisions. It measures what left, not what was in it.', query: 'NetworkEvents | where InitiatingProcessFileName == "possvc.exe" | summarize sum(BytesSent)', column: 'sum_BytesSent', hint: 'summarize sum(BytesSent) over the upload connections.', type: 'number' },
    { chapter: 'exfil', prompt: 'Which actor does intelligence link to the destination?', teach: 'This address belongs to infrastructure seen elsewhere in Season 1. Recurring infrastructure lets defenders connect separate incidents into one campaign.', query: `ThreatIntel | where Indicator == "${AT.ips.exfil}"`, column: 'Actor', hint: 'Look the IP up in ThreatIntel.' },
  ],
});

// ── Episode 6 · Heartbeat ───────────────────────────────────────────────────────────────────────
const ep6Device = staffIn('Engineering')[5];

export const ep06 = defineCasebook({
  id: 'casebook-s1e06-heartbeat',
  episode: 6,
  title: 'Heartbeat',
  difficulty: 'Hard',
  replaces: 'siem-suricata-cobalt-strike-beacon',
  inspiredBy: 'Cobalt Strike-style HTTPS beacons with jitter',
  date: '2026-10-05',
  briefing: 'There is no alert this time. Threat hunting asks you to find any process — other than a browser — talking to the internet on a steady rhythm. Beacons check in on a timer with a little random "jitter" to avoid looking robotic. Find the rhythm, then the host, the binary, and the actor behind it.',
  chapters: [
    { id: 'hunt', title: 'Find the rhythm' },
    { id: 'host', title: 'The host' },
    { id: 'attribution', title: 'Who' },
  ],
  inject(t, when) {
    const e = ep6Device;
    t.add('FileEvents', when(0, '08:58:10'), { DeviceName: e.hostname, AccountName: e.username, ActionType: 'FileCreated', FileName: 'OneDriveUpdater.exe', FolderPath: `C:\\Users\\${e.username}\\AppData\\Local\\Temp\\odu`, SizeBytes: 302_080, SHA256: 'beacon-odu', Signer: 'Unsigned' });
    t.add('ProcessEvents', when(0, '09:00:00'), { DeviceName: e.hostname, AccountName: e.username, ProcessName: 'OneDriveUpdater.exe', ParentProcessName: 'explorer.exe', CommandLine: `"C:\\Users\\${e.username}\\AppData\\Local\\Temp\\odu\\OneDriveUpdater.exe"`, SHA256: 'beacon-odu' });
    for (let i = 0; i < 300; i++) {
      const seconds = 9 * 3600 + i * 60 + ((i * 37) % 13) - 6 + 6;
      const hh = String(Math.floor(seconds / 3600)).padStart(2, '0'), mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'), ss = String(seconds % 60).padStart(2, '0');
      t.add('NetworkEvents', when(0, `${hh}:${mm}:${ss}`), { DeviceName: e.hostname, InitiatingProcessFileName: 'OneDriveUpdater.exe', RemoteIP: AT.ips.c2, RemotePort: 443, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 512, JA3: '72a589da586844d7f0818ce684948eea' });
    }
    t.add('ThreatIntel', when(0, '07:00:00'), { Indicator: AT.ips.c2, IndicatorType: 'ip', Actor: AT.name, Confidence: 'High', Source: 'Halcyon IR-0901 (Episode 1)', Limitation: 'Internal observation; the address may be reassigned over time.' });
  },
  questions: [
    { chapter: 'hunt', prompt: 'Excluding the browser, which remote IP received the most connections?', teach: 'Hunting starts with a hypothesis and a stack count. Remove the noisiest legitimate process (the browser), then `summarize count() by RemoteIP | sort by count_ desc | take 1` to surface the loudest remaining destination.', query: 'NetworkEvents | where InitiatingProcessFileName != "msedge.exe" | summarize count() by RemoteIP | sort by count_ desc | take 1', column: 'RemoteIP', hint: 'Filter out msedge.exe, summarize count() by RemoteIP, sort desc, take 1.' },
    { chapter: 'hunt', prompt: 'How many connections were made to that address?', teach: 'Three hundred connections over five hours is one every minute — far too regular for a person.', query: `NetworkEvents | where RemoteIP == "${AT.ips.c2}" | count`, column: 'Count', hint: 'Count connections to that IP.', type: 'number' },
    { chapter: 'hunt', prompt: 'How many of those connections happened between 10:00:00 and 10:59:59 UTC?', teach: 'Bucketing by time shows the rhythm. Sixty connections in an hour means a 60-second sleep with jitter. Try `summarize count() by bin(TimeGenerated, 1h)` to see every hour at once.', query: `NetworkEvents | where RemoteIP == "${AT.ips.c2}" and TimeGenerated between (datetime("2026-10-05T10:00:00Z") .. datetime("2026-10-05T10:59:59Z")) | count`, column: 'Count', hint: 'Use a between() window for 10:00:00–10:59:59 and count.', type: 'number' },
    { chapter: 'hunt', prompt: 'What was the average number of bytes sent per connection?', teach: 'Beacons with no tasking send tiny, identical check-ins. A constant size is another fingerprint of automation.', query: `NetworkEvents | where RemoteIP == "${AT.ips.c2}" | summarize avg(BytesSent)`, column: 'avg_BytesSent', hint: 'summarize avg(BytesSent).', type: 'number' },
    { chapter: 'host', prompt: 'Which device was beaconing?', teach: 'Pivot from the destination to the source.', query: `NetworkEvents | where RemoteIP == "${AT.ips.c2}" | distinct DeviceName`, column: 'DeviceName', hint: 'distinct DeviceName for the beacon traffic.' },
    { chapter: 'host', prompt: 'Which process made the connections?', teach: 'The name imitates a legitimate updater. Names are free to choose; locations and signatures are harder to fake.', query: `NetworkEvents | where RemoteIP == "${AT.ips.c2}" | distinct InitiatingProcessFileName`, column: 'InitiatingProcessFileName', hint: 'distinct InitiatingProcessFileName.' },
    { chapter: 'host', prompt: 'In which folder was that executable written?', teach: 'Real OneDrive components live in Program Files and are signed by Microsoft. An unsigned "updater" in a Temp folder is a strong indicator of masquerading.', query: 'FileEvents | where FileName == "OneDriveUpdater.exe"', column: 'FolderPath', hint: 'Find the file in FileEvents and read FolderPath.' },
    { chapter: 'host', prompt: 'What signer is recorded for the file?', teach: 'Code-signing status is a quick triage check. Unsigned is not proof of malice, but combined with the location and the beaconing it completes the picture.', query: 'FileEvents | where FileName == "OneDriveUpdater.exe"', column: 'Signer', hint: 'Read the Signer field on the same record.' },
    { chapter: 'attribution', prompt: 'What JA3 TLS fingerprint did the beacon use?', teach: 'JA3 hashes how a client starts a TLS connection. Malware frameworks often have distinctive fingerprints that survive changes of IP and domain — useful for hunting the same tool elsewhere.', query: `NetworkEvents | where RemoteIP == "${AT.ips.c2}" | distinct JA3`, column: 'JA3', hint: 'distinct JA3 on the beacon traffic.' },
    { chapter: 'attribution', prompt: 'Which actor is associated with the destination address?', teach: 'This is the same C2 address you found in Episode 1. Linking incidents through shared infrastructure turns separate tickets into one campaign — and suggests the first eviction was incomplete.', query: `ThreatIntel | where Indicator == "${AT.ips.c2}"`, column: 'Actor', hint: 'Look up the IP in ThreatIntel.' },
    { chapter: 'attribution', prompt: 'Which earlier incident does the intelligence record cite as its source?', teach: 'Good intelligence records cite their source. Here it is Halcyon\'s own incident — internal intelligence is often the most relevant you have.', query: `ThreatIntel | where Indicator == "${AT.ips.c2}"`, column: 'Source', hint: 'Read Source on the same record.' },
  ],
});
