import { defineCasebook } from './casebook';
import { staffIn, STAFF } from './world';
import { ASHEN_TIDE as AT, GLASS_HERON as GH } from './actors';

// ── Episode 21 · The Phantom Transfers ──────────────────────────────────────────────────────────
const ep21Clerk = staffIn('Finance')[6];
const EP21_MULE = 'acct-9920-overseas';

export const ep21 = defineCasebook({
  id: 'casebook-s1e21-phantom-transfers',
  episode: 21,
  title: 'The Phantom Transfers',
  difficulty: 'Hard',
  replaces: 'siem-chronicle-bangladesh-bank',
  inspiredBy: 'fraudulent high-value payment instructions pushed through a compromised treasury workstation',
  date: '2027-01-18',
  briefing: 'The bank called: several large transfers left Halcyon’s treasury account overnight to an unfamiliar overseas account. The payments carried valid credentials. Work out which workstation issued them, how the attacker got onto it, and whether the recall request caught the money in time.',
  chapters: [
    { id: 'transfers', title: 'The payments' },
    { id: 'access', title: 'The workstation' },
    { id: 'response', title: 'Recall' },
  ],
  inject(t, when) {
    const clerk = ep21Clerk;
    for (let i = 0; i < 5; i++) t.add('CloudAuditEvents', when(0, `0${1 + i}:${String(i * 7).padStart(2, '0')}:00`), { UserPrincipalName: clerk.email, Operation: 'PaymentInstruction', Resource: 'Treasury/Wire', NewValue: EP21_MULE, IPAddress: clerk.ip, SessionId: 'FRAUD-21', Result: 'Success', ItemCount: 1, BytesSent: 0, Amount: 480000 + i * 20000 });
    // The clerk's workstation was accessed over RDP from a prior foothold.
    t.add('NetworkEvents', when(0, '00:20:00'), { DeviceName: clerk.hostname, InitiatingProcessFileName: 'System', RemoteIP: '10.40.0.99', RemotePort: 3389, RemoteUrl: '', ActionType: 'InboundConnectionAccepted', BytesSent: 0 });
    t.add('ProcessEvents', when(0, '00:25:00'), { DeviceName: clerk.hostname, AccountName: clerk.username, ProcessName: 'treasuryclient.exe', ParentProcessName: 'explorer.exe', CommandLine: 'treasuryclient.exe', SHA256: 'treasury-client' });
    t.add('EmailEvents', when(-0, '08:00:00'), { MessageId: 'GH-TREAS-21', SenderAddress: `vendor-portal@${GH.domains.phish}`, RecipientAddress: clerk.email, Subject: 'Treasury portal certificate renewal', Url: `https://${GH.domains.phish}/treasury`, AttachmentName: '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
    t.add('ProxyEvents', when(0, '00:05:00'), { DeviceName: clerk.hostname, UserPrincipalName: clerk.email, Url: `https://${GH.domains.phish}/treasury`, Domain: GH.domains.phish, DestinationIP: GH.ips.phish, Method: 'POST', StatusCode: 302, BytesSent: 1500, BytesReceived: 300, UserAgent: 'Mozilla/5.0' });
    t.add('SecurityAlerts', when(0, '06:00:00'), { AlertName: 'High-value wire to new beneficiary', Severity: 'High', DeviceName: clerk.hostname, Entity: clerk.email, Status: 'New', Product: 'Halcyon Fraud Monitoring' });
    t.add('ResponseActions', when(0, '06:30:00'), { IncidentId: 'IR-0118', Target: EP21_MULE, Action: 'RequestRecall', Result: 'Partial', RecoveredAmount: 1400000, ApprovedBy: 'treasury-lead' });
    t.add('ResponseActions', when(0, '06:35:00'), { IncidentId: 'IR-0118', Target: clerk.hostname, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '07:00:00'), { IncidentId: 'IR-0118', Target: 'treasury-wires', Action: 'EnableDualApproval', Result: 'Success', ApprovedBy: 'cfo' });
  },
  questions: [
    { chapter: 'transfers', prompt: 'How many fraudulent payment instructions were issued?', teach: 'Financial fraud leaves an audit trail in the payment system. Count the PaymentInstruction events to one new beneficiary to scope the theft before chasing how it happened.', query: 'CloudAuditEvents | where Operation == "PaymentInstruction" | count', column: 'Count', hint: 'Count PaymentInstruction operations.', type: 'number' },
    { chapter: 'transfers', prompt: 'Which beneficiary account received the transfers?', teach: 'The destination is the mule account. Identifying it lets the bank attempt a recall and flags it for every future payment.', query: 'CloudAuditEvents | where Operation == "PaymentInstruction" | distinct NewValue', column: 'NewValue', hint: 'distinct NewValue on the payment instructions.' },
    { chapter: 'transfers', prompt: 'What was the total amount transferred?', teach: 'Summing the amounts gives the gross exposure — the figure the business and insurers need immediately, separate from how much is later recovered.', query: 'CloudAuditEvents | where Operation == "PaymentInstruction" | summarize sum(Amount)', column: 'sum_Amount', hint: 'summarize sum(Amount) over the payment instructions.', type: 'number' },
    { chapter: 'transfers', prompt: 'Which clerk’s account issued the instructions?', teach: 'The payments carried a real clerk’s credentials — the account was used, not necessarily the person. Identify whose session issued them to focus the investigation on that workstation.', query: 'CloudAuditEvents | where Operation == "PaymentInstruction" | distinct UserPrincipalName', column: 'UserPrincipalName', hint: 'distinct UserPrincipalName on the payment instructions.' },
    { chapter: 'access', prompt: `Which port was used to connect into ${ep21Clerk.hostname} overnight?`, teach: 'Before issuing payments the attacker had to reach the treasury workstation. An inbound RDP connection (port 3389) at night is the remote-access foothold.', query: `NetworkEvents | where DeviceName == "${ep21Clerk.hostname}" and ActionType == "InboundConnectionAccepted"`, column: 'RemotePort', hint: 'Find the inbound connection to the clerk’s workstation.', type: 'number' },
    { chapter: 'access', prompt: 'Which domain did the clerk POST credentials to beforehand?', teach: 'The chain starts with phishing: a "certificate renewal" page captured the treasury credentials, enabling the later access. The proxy POST is where the password left.', query: `ProxyEvents | where UserPrincipalName == "${ep21Clerk.email}" and Method == "POST"`, column: 'Domain', hint: 'Find the clerk’s POST request.' },
    { chapter: 'access', prompt: 'What was the subject of the phishing email?', teach: 'Pivot from the domain to the lure. A treasury-portal certificate-renewal pretext is tailored to finance staff and their routine tasks.', query: `EmailEvents | where Url contains "${GH.domains.phish}" and RecipientAddress == "${ep21Clerk.email}"`, column: 'Subject', hint: 'Search EmailEvents for the phishing domain sent to the clerk.' },
    { chapter: 'response', prompt: 'What result did the recall request get?', teach: 'Recalls are rarely all-or-nothing; some funds move on before the request lands. The result ("Partial") sets realistic expectations for recovery.', query: `ResponseActions | where Target == "${EP21_MULE}"`, column: 'Result', hint: 'Find the RequestRecall action and read its Result.' },
    { chapter: 'response', prompt: 'How much money was recovered?', teach: 'The recovered amount, against the total transferred, is the net loss — the number that drives the fraud report and any claim.', query: 'ResponseActions | where Action == "RequestRecall"', column: 'RecoveredAmount', hint: 'Read RecoveredAmount on the recall action.', type: 'number' },
    { chapter: 'response', prompt: 'Which control prevents a single compromised clerk from wiring funds again?', teach: 'Dual approval means no one account can move money alone — the process fix that would have blocked this fraud even with stolen credentials.', query: 'ResponseActions | where Target == "treasury-wires"', column: 'Action', hint: 'Find the response action targeting treasury wires.' },
  ],
});

// ── Episode 22 · The Signed Backdoor ────────────────────────────────────────────────────────────
const EP22_HIGH_VALUE = ['HF-IT-001', 'HF-ENG-012', 'HF-EXE-004'];

export const ep22 = defineCasebook({
  id: 'casebook-s1e22-signed-backdoor',
  episode: 22,
  title: 'The Signed Backdoor',
  difficulty: 'Hard',
  replaces: 'siem-tcpdump-supply-chain-beacon',
  inspiredBy: 'a supply-chain backdoor that stayed dormant for weeks, then activated on selected high-value hosts',
  date: '2027-01-25',
  briefing: 'The network-monitoring platform used across the whole fleet shipped a signed update weeks ago. Only now, on a handful of carefully chosen machines, is it reaching out to infrastructure that is not the vendor’s. Supply-chain backdoors hide in trusted software and wait. Find which hosts woke up, what the backdoor did, and how deep it reached.',
  chapters: [
    { id: 'dwell', title: 'The dormant period' },
    { id: 'wake', title: 'Selective activation' },
    { id: 'depth', title: 'How deep' },
    { id: 'response', title: 'Eviction' },
  ],
  inject(t, when) {
    // The agent runs everywhere, but only three high-value hosts beacon out.
    STAFF.slice(0, 40).forEach((e, i) => t.add('ProcessEvents', when(0, `03:${String(i % 60).padStart(2, '0')}:00`), { DeviceName: e.hostname, AccountName: 'SYSTEM', ProcessName: 'netmon-agent.exe', ParentProcessName: 'services.exe', CommandLine: '"C:\\Program Files\\NetMon\\netmon-agent.exe" --service', SHA256: 'netmon-3.3.0-backdoored' }));
    EP22_HIGH_VALUE.forEach((host, i) => {
      t.add('DnsEvents', when(0, `09:${String(10 + i).padStart(2, '0')}:00`), { DeviceName: host, ClientIP: `10.40.${i}.5`, QueryName: GH.domains.c2, QueryType: 'A', Answer: GH.ips.c2 });
      for (let k = 0; k < 6; k++) t.add('NetworkEvents', when(k === 5 ? 1 : 0, `${k === 4 ? '18' : '09'}:${String(12 + i).padStart(2, '0')}:${String(k * 9).padStart(2, '0')}`), { DeviceName: host, InitiatingProcessFileName: 'netmon-agent.exe', RemoteIP: GH.ips.c2, RemotePort: 443, RemoteUrl: GH.domains.c2, ActionType: 'ConnectionSuccess', BytesSent: 1800 });
    });
    t.add('ProcessEvents', when(0, '09:40:00'), { DeviceName: 'HF-IT-001', AccountName: 'SYSTEM', ProcessName: 'powershell.exe', ParentProcessName: 'netmon-agent.exe', CommandLine: 'powershell.exe -c Get-ADUser -Filter * -Properties memberOf', SHA256: 'ps-recon' });
    t.add('FileEvents', when(0, '09:50:00'), { DeviceName: 'HF-IT-001', AccountName: 'SYSTEM', ActionType: 'FileCreated', FileName: GH.implant, FolderPath: 'C:\\ProgramData\\NetMonCache', SizeBytes: 1_100_000, SHA256: 'heronsvc-implant' });
    t.add('ThreatIntel', when(0, '08:00:00'), { Indicator: GH.domains.c2, IndicatorType: 'domain', Actor: GH.name, Confidence: 'High', Source: 'Vendor breach disclosure', Limitation: 'A dormant backdoor may exist on hosts that have not yet activated; absence of beaconing is not proof of safety.' });
    t.add('ResponseActions', when(1, '08:00:00'), { IncidentId: 'IR-0125', Target: 'netmon-agent', Action: 'QuarantineBuild', Result: 'Success', BuildVersion: '3.3.0', ApprovedBy: 'ciso' });
    EP22_HIGH_VALUE.forEach((host) => t.add('ResponseActions', when(1, '08:10:00'), { IncidentId: 'IR-0125', Target: host, Action: 'IsolateDevice', Result: 'Success', ApprovedBy: 'soc-lead' }));
    t.add('ResponseActions', when(1, '08:30:00'), { IncidentId: 'IR-0125', Target: GH.domains.c2, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'dwell', prompt: 'On how many hosts is the backdoored monitoring agent installed?', teach: 'Supply-chain backdoors reach everywhere the software is deployed, but activate selectively. First size the installed base — every one of these is a potential sleeper.', query: 'ProcessEvents | where ProcessName == "netmon-agent.exe" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'dcount(DeviceName) over the agent process.', type: 'number' },
    { chapter: 'wake', prompt: 'To which non-vendor domain did the agent start beaconing?', teach: 'The agent should only talk to its vendor. Filtering its connections for the C2 domain reveals the backdoor waking up. Dormancy is why this went unnoticed for weeks.', query: 'NetworkEvents | where InitiatingProcessFileName == "netmon-agent.exe" | distinct RemoteUrl', column: 'RemoteUrl', hint: 'distinct RemoteUrl on the agent’s connections.' },
    { chapter: 'wake', prompt: 'How many hosts actually beaconed to the C2 domain?', teach: 'Only the chosen few activated. Counting beaconing hosts — far fewer than the install base — shows the attacker targeting high-value machines, not spraying.', query: `NetworkEvents | where RemoteIP == "${GH.ips.c2}" | summarize dcount(DeviceName)`, column: 'dcount_DeviceName', hint: 'dcount(DeviceName) for connections to the C2 address.', type: 'number' },
    { chapter: 'wake', prompt: 'Which actor does intelligence link to the C2 domain?', teach: 'The domain ties to a known espionage actor — and the vendor breach disclosure is the source. The intel caveat matters: dormant copies may still lurk on quiet hosts.', query: `ThreatIntel | where Indicator == "${GH.domains.c2}"`, column: 'Actor', hint: 'Look the C2 domain up in ThreatIntel.' },
    { chapter: 'depth', prompt: 'Which reconnaissance command did the agent run on HF-IT-001?', teach: 'On an IT host the backdoor pulls directory data to map accounts and groups — the first step toward privileged access. A monitoring agent running Get-ADUser is deeply abnormal.', query: 'ProcessEvents | where DeviceName == "HF-IT-001" and ParentProcessName == "netmon-agent.exe" and ProcessName == "powershell.exe"', column: 'CommandLine', hint: 'Find the PowerShell child of the agent on HF-IT-001.' },
    { chapter: 'depth', prompt: 'What second-stage implant did it drop on HF-IT-001?', teach: 'A dropped executable in ProgramData gives the attacker persistence independent of the backdoored agent. Eviction must remove this too, not just quarantine the build.', query: 'FileEvents | where DeviceName == "HF-IT-001" and FolderPath contains "NetMonCache"', column: 'FileName', hint: 'Find the file created in the NetMonCache folder.' },
    { chapter: 'depth', prompt: 'What limitation does the intelligence note about dormant hosts?', teach: 'The honest boundary: quiet hosts are not proven clean — they may hold a sleeper that has not activated. This shapes a fleet-wide, not host-by-host, response.', query: `ThreatIntel | where Indicator == "${GH.domains.c2}"`, column: 'Limitation', hint: 'Read the Limitation on the C2 intel record.' },
    { chapter: 'response', prompt: 'Which build version was quarantined?', teach: 'Quarantining the specific backdoored build across the fleet addresses every install, activated or not — the right response to a supply-chain compromise.', query: 'ResponseActions | where Action == "QuarantineBuild"', column: 'BuildVersion', hint: 'Read BuildVersion on the quarantine action.' },
    { chapter: 'response', prompt: 'How many hosts were isolated?', teach: 'Isolation targets the hosts that actively beaconed. Matching that count to the activated set confirms the response reached every known-compromised machine.', query: 'ResponseActions | where IncidentId == "IR-0125" and Action == "IsolateDevice" | count', column: 'Count', hint: 'Count IsolateDevice actions in this incident.', type: 'number' },
    { chapter: 'response', prompt: 'Which incident ID tracks the eviction?', teach: 'One incident ID groups the build quarantine, host isolations and indicator block into a single campaign response.', query: 'ResponseActions | where Action == "QuarantineBuild"', column: 'IncidentId', hint: 'Read IncidentId on the quarantine action.' },
  ],
});

// ── Episode 23 · The Forged Token ───────────────────────────────────────────────────────────────
const EP23_MAILBOXES = [staffIn('Executive')[0], staffIn('Executive')[1], staffIn('Legal')[0], staffIn('Finance')[0]];

export const ep23 = defineCasebook({
  id: 'casebook-s1e23-forged-token',
  episode: 23,
  title: 'The Forged Token',
  difficulty: 'Hard',
  replaces: 'siem-sentinel-storm-0558',
  inspiredBy: 'forged authentication tokens used to read cloud mailboxes with no corresponding sign-in',
  date: '2027-02-01',
  briefing: 'Several executive mailboxes show mail being read, but there is no sign-in to match any of it — no password, no MFA, nothing in the sign-in logs. That points to forged authentication tokens minted with a stolen signing key, not a stolen password. Scope which mailboxes were read and confirm the key rotation closed it.',
  chapters: [
    { id: 'anomaly', title: 'Access without sign-in' },
    { id: 'scope', title: 'Which mailboxes' },
    { id: 'response', title: 'Rotate the key' },
  ],
  inject(t, when) {
    EP23_MAILBOXES.forEach((e, i) => {
      for (let k = 0; k < 4; k++) t.add('CloudAuditEvents', when(0, `0${2 + i}:${String(10 + k * 5).padStart(2, '0')}:00`), { UserPrincipalName: e.email, Operation: 'MailItemsAccessed', Resource: 'Inbox', IPAddress: GH.ips.operator, SessionId: `FORGED-${i}`, Result: 'Success', ItemCount: 20 + k, AuthMethod: 'Token' });
    });
    t.add('SecurityAlerts', when(0, '07:00:00'), { AlertName: 'Mailbox access with no matching sign-in', Severity: 'High', DeviceName: '', Entity: EP23_MAILBOXES[0].email, Status: 'New', Product: 'Halcyon Cloud Defender' });
    t.add('ThreatIntel', when(0, '06:30:00'), { Indicator: GH.ips.operator, IndicatorType: 'ip', Actor: GH.name, Confidence: 'High', Source: 'Cloud provider incident notice', Limitation: 'Forged tokens leave no sign-in record; scope must be built from resource-access logs, which may under-count.' });
    t.add('ResponseActions', when(0, '08:00:00'), { IncidentId: 'IR-0201', Target: 'token-signing-key', Action: 'RotateSigningKey', Result: 'Success', ApprovedBy: 'cloud-admin' });
    EP23_MAILBOXES.forEach((e) => t.add('ResponseActions', when(0, '08:15:00'), { IncidentId: 'IR-0201', Target: e.email, Action: 'RevokeSessions', Result: 'Success', ApprovedBy: 'soc-lead' }));
    t.add('CloudAuditEvents', when(0, '10:00:00'), { UserPrincipalName: EP23_MAILBOXES[0].email, Operation: 'MailItemsAccessed', Resource: 'Inbox', IPAddress: GH.ips.operator, SessionId: 'FORGED-0', Result: 'Denied', ItemCount: 0, AuthMethod: 'Token' });
  },
  questions: [
    { chapter: 'anomaly', prompt: `How many mail-access events came from the operator IP (${GH.ips.operator})?`, teach: 'Forged-token attacks are invisible in sign-in logs — the giveaway is resource access from one address with no authentication behind it. Count the mailbox-access events from the suspect IP to size the intrusion.', query: `CloudAuditEvents | where Operation == "MailItemsAccessed" and IPAddress == "${GH.ips.operator}" and Result == "Success" | count`, column: 'Count', hint: 'Count successful MailItemsAccessed events from the operator IP.', type: 'number' },
    { chapter: 'anomaly', prompt: 'How many sign-ins from that IP appear in the sign-in logs?', teach: 'The defining anomaly: zero sign-ins despite all that mailbox access. An absence is evidence — it rules out a stolen password and points to forged tokens.', query: `SigninLogs | where IPAddress == "${GH.ips.operator}" | count`, column: 'Count', hint: 'Count SigninLogs rows from the operator IP (expect none).', type: 'number' },
    { chapter: 'anomaly', prompt: 'Which authentication method is recorded on the mailbox access?', teach: 'The audit log records how access was authorised. "Token" with no sign-in confirms token-based access — the signature of a forged or stolen token rather than an interactive login.', query: `CloudAuditEvents | where Operation == "MailItemsAccessed" and IPAddress == "${GH.ips.operator}" | distinct AuthMethod`, column: 'AuthMethod', hint: 'distinct AuthMethod on the mailbox-access events.' },
    { chapter: 'scope', prompt: 'How many distinct mailboxes were accessed?', teach: 'Scope is built from resource-access logs, mailbox by mailbox. Counting distinct accounts shows the breadth — here, high-value executive and legal mailboxes.', query: `CloudAuditEvents | where Operation == "MailItemsAccessed" and IPAddress == "${GH.ips.operator}" | summarize dcount(UserPrincipalName)`, column: 'dcount_UserPrincipalName', hint: 'dcount(UserPrincipalName) on the mailbox-access events.', type: 'number' },
    { chapter: 'scope', prompt: 'Which actor does intelligence link to the operator IP?', teach: 'The cloud provider’s incident notice ties the address to a known espionage actor. The caveat is vital: forged-token access can under-count, so scope is a floor, not a ceiling.', query: `ThreatIntel | where Indicator == "${GH.ips.operator}"`, column: 'Actor', hint: 'Look the operator IP up in ThreatIntel.' },
    { chapter: 'scope', prompt: 'What limitation does the intelligence note about scoping?', teach: 'Because forged tokens leave no sign-in trail, the resource-access logs are all you have — and they may miss some access. State that the true scope could be larger.', query: `ThreatIntel | where Indicator == "${GH.ips.operator}"`, column: 'Limitation', hint: 'Read the Limitation on the operator-IP intel record.' },
    { chapter: 'response', prompt: 'Which action invalidates every forged token at once?', teach: 'You cannot revoke tokens you cannot see. Rotating the signing key invalidates all tokens it ever signed — the only move that reliably closes a forged-token attack.', query: 'ResponseActions | where Target == "token-signing-key"', column: 'Action', hint: 'Find the response action targeting the signing key.' },
    { chapter: 'response', prompt: 'What result did the forged token get after the key rotation?', teach: 'Validate containment: the same token-based session should be denied once the key is rotated — proof the forged tokens are now worthless.', query: 'CloudAuditEvents | where SessionId == "FORGED-0" and Result == "Denied"', column: 'Result', hint: 'Look at the forged session’s activity after rotation.' },
    { chapter: 'response', prompt: 'How many mailboxes had their sessions revoked?', teach: 'Session revocation is applied per affected mailbox as defence in depth alongside the key rotation. The count should match the mailboxes you scoped.', query: 'ResponseActions | where IncidentId == "IR-0201" and Action == "RevokeSessions" | count', column: 'Count', hint: 'Count the RevokeSessions actions in this incident.', type: 'number' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the key rotation and per-mailbox revocations into a single reviewable response.', query: 'ResponseActions | where Action == "RotateSigningKey"', column: 'IncidentId', hint: 'Read IncidentId on the key-rotation action.' },
  ],
});

// ── Episode 24 · The Admin Console ──────────────────────────────────────────────────────────────
const ep24Agent = staffIn('Support')[5];

export const ep24 = defineCasebook({
  id: 'casebook-s1e24-admin-console',
  episode: 24,
  title: 'The Admin Console',
  difficulty: 'Hard',
  replaces: 'siem-elastic-twitter-2020-insider',
  inspiredBy: 'a social-engineered support employee whose admin-tool access was used to take over customer accounts',
  date: '2027-02-08',
  briefing: 'A support agent’s internal admin console — the one that can reset any customer account — was used to change the email and password on a batch of high-value customer accounts in minutes. The agent swears it was not them. Trace whether the agent was socially engineered, what was done with the console, and how access was pulled back.',
  chapters: [
    { id: 'console', title: 'The console actions' },
    { id: 'pretext', title: 'How the agent was used' },
    { id: 'response', title: 'Pulling access' },
  ],
  inject(t, when) {
    const a = ep24Agent;
    t.add('CloudAuditEvents', when(0, '13:30:00'), { UserPrincipalName: 'servicedesk', Operation: 'VoiceCallLogged', Resource: 'Inbound support call', NewValue: 'caller impersonated IT, requested console access help', IPAddress: '10.40.0.60', SessionId: '', Result: 'Success', ItemCount: 1 });
    for (let i = 0; i < 9; i++) t.add('CloudAuditEvents', when(0, `14:${String(5 + i).padStart(2, '0')}:00`), { UserPrincipalName: a.email, Operation: 'AdminAccountTakeover', Resource: `customer/vip-${i}`, NewValue: `attacker+${i}@mailbox-free.example`, IPAddress: a.ip, SessionId: 'INSIDER-24', Result: 'Success', ItemCount: 1 });
    t.add('SecurityAlerts', when(0, '14:20:00'), { AlertName: 'Bulk admin account takeovers by one agent', Severity: 'High', DeviceName: a.hostname, Entity: a.email, Status: 'New', Product: 'Halcyon Insider Monitoring' });
    t.add('ResponseActions', when(0, '14:40:00'), { IncidentId: 'IR-0208', Target: a.email, Action: 'SuspendConsoleAccess', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(0, '14:45:00'), { IncidentId: 'IR-0208', Target: 'customer-vip', Action: 'RevertAccountChanges', Result: 'Success', RevertedCount: 9, ApprovedBy: 'trust-safety' });
    t.add('ResponseActions', when(0, '15:30:00'), { IncidentId: 'IR-0208', Target: 'admin-console', Action: 'RequireApprovalForTakeover', Result: 'Success', ApprovedBy: 'ciso' });
  },
  questions: [
    { chapter: 'console', prompt: 'How many customer accounts were taken over through the console?', teach: 'Powerful internal tools are high-impact when misused. Count the AdminAccountTakeover events to scope how many customers were affected before anything else.', query: 'CloudAuditEvents | where Operation == "AdminAccountTakeover" | count', column: 'Count', hint: 'Count AdminAccountTakeover operations.', type: 'number' },
    { chapter: 'console', prompt: 'Which agent account performed the takeovers?', teach: 'The console actions ran under a real agent’s identity. Identifying it focuses the question that follows: was the agent malicious, or used?', query: 'CloudAuditEvents | where Operation == "AdminAccountTakeover" | distinct UserPrincipalName', column: 'UserPrincipalName', hint: 'distinct UserPrincipalName on the takeover events.' },
    { chapter: 'console', prompt: 'Which email domain were the accounts redirected to?', teach: 'The attacker set a throwaway address as the new account email on every victim. The common domain is an indicator and shows the takeovers were one coordinated action.', query: 'CloudAuditEvents | where Operation == "AdminAccountTakeover" and Resource == "customer/vip-0"', column: 'NewValue', hint: 'Read NewValue on the first takeover event.' },
    { chapter: 'pretext', prompt: 'What does the logged support call record about the caller?', teach: 'Insider-tool abuse often starts with social engineering, not a rogue employee. The voice-call log captures the pretext — someone impersonating IT to walk the agent into granting access.', query: 'CloudAuditEvents | where Operation == "VoiceCallLogged"', column: 'NewValue', hint: 'Find the VoiceCallLogged event and read its recorded note.' },
    { chapter: 'pretext', prompt: 'Which session ID groups the takeover actions?', teach: 'All nine takeovers share one session — evidence of a single short burst, consistent with an attacker driving the console live during the call rather than the agent’s normal work.', query: 'CloudAuditEvents | where Operation == "AdminAccountTakeover" | distinct SessionId', column: 'SessionId', hint: 'distinct SessionId on the takeover events.' },
    { chapter: 'pretext', prompt: 'Which severity did insider monitoring assign the alert?', teach: 'Bulk privileged actions by one identity are high severity by nature — the kind of alert that should page a responder immediately, not wait in a queue.', query: `SecurityAlerts | where Entity == "${ep24Agent.email}"`, column: 'Severity', hint: 'Read Severity on the insider alert.' },
    { chapter: 'response', prompt: 'Which action removed the agent’s console access?', teach: 'Whether the agent was complicit or duped, suspending their console access immediately stops further takeovers while the investigation continues.', query: `ResponseActions | where Target == "${ep24Agent.email}"`, column: 'Action', hint: 'Find the response action targeting the agent.' },
    { chapter: 'response', prompt: 'How many customer accounts were reverted?', teach: 'Recovery here means restoring each hijacked account. The reverted count should match the takeovers — confirmation the response reached every victim.', query: 'ResponseActions | where Action == "RevertAccountChanges"', column: 'RevertedCount', hint: 'Read RevertedCount on the revert action.', type: 'number' },
    { chapter: 'response', prompt: 'Which control prevents one agent from taking over an account alone?', teach: 'Requiring a second approval for high-impact console actions means social-engineering one agent is no longer enough — the process fix for powerful internal tools.', query: 'ResponseActions | where Target == "admin-console"', column: 'Action', hint: 'Find the response action targeting the admin console.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'A single incident ID groups the access suspension, account reverts and the control change for review.', query: 'ResponseActions | where Action == "RequireApprovalForTakeover"', column: 'IncidentId', hint: 'Read IncidentId on the control-change action.' },
  ],
});

// ── Episode 25 · The Worm and the Switch ────────────────────────────────────────────────────────
const EP25_KILLSWITCH = 'iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea.example';

export const ep25 = defineCasebook({
  id: 'casebook-s1e25-worm-and-switch',
  episode: 25,
  title: 'The Worm and the Switch',
  difficulty: 'Hard',
  replaces: 'siem-tcpdump-wannacry-eternalblue-killswitch',
  inspiredBy: 'a self-spreading worm using an SMB exploit, halted by an accidental kill-switch domain',
  date: '2027-02-15',
  briefing: 'Machines across the warehouse are locking up one after another, each one infecting the next over the network with no human clicking anything. This is a worm. Partway through the morning the spread suddenly stopped on its own. Trace how it propagated, how many fell, and what the strange domain lookup that coincided with the halt was.',
  chapters: [
    { id: 'spread', title: 'Self-propagation' },
    { id: 'scale', title: 'The toll' },
    { id: 'switch', title: 'The kill-switch' },
    { id: 'response', title: 'Patch the hole' },
  ],
  inject(t, when) {
    const hosts = staffIn('Warehouse').concat(staffIn('Logistics')).slice(0, 20);
    // Each infected host scans and infects the next over SMB (port 445).
    hosts.forEach((e, i) => {
      if (i > 0) t.add('NetworkEvents', when(0, `08:${String(10 + i).padStart(2, '0')}:00`), { DeviceName: hosts[i - 1].hostname, InitiatingProcessFileName: 'tasksche.exe', RemoteIP: e.ip, RemotePort: 445, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 65_536 });
      t.add('ProcessEvents', when(0, `08:${String(11 + i).padStart(2, '0')}:00`), { DeviceName: e.hostname, AccountName: 'SYSTEM', ProcessName: 'tasksche.exe', ParentProcessName: 'services.exe', CommandLine: 'C:\\Windows\\tasksche.exe', SHA256: 'worm-tasksche' });
      t.add('FileEvents', when(0, `08:${String(12 + i).padStart(2, '0')}:00`), { DeviceName: e.hostname, AccountName: 'SYSTEM', ActionType: 'FileRenamed', FileName: 'manifest.xlsx.wncry', FolderPath: `C:\\Users\\${e.username}\\Documents`, SizeBytes: 220_000, SHA256: 'encrypted' });
    });
    // The kill-switch: once this domain resolves, the worm stops.
    t.add('DnsEvents', when(0, '10:30:00'), { DeviceName: hosts[10].hostname, ClientIP: hosts[10].ip, QueryName: EP25_KILLSWITCH, QueryType: 'A', Answer: '104.20.0.1' });
    t.add('SecurityAlerts', when(0, '09:00:00'), { AlertName: 'Self-propagating SMB worm detected', Severity: 'High', DeviceName: hosts[0].hostname, Entity: 'warehouse-vlan', Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '09:30:00'), { Indicator: 'tasksche.exe', IndicatorType: 'file', Actor: AT.name, Confidence: 'Medium', Source: 'Industry sharing group', Limitation: 'The kill-switch halts spread but does not decrypt already-encrypted files, and could be removed in a future variant.' });
    t.add('ResponseActions', when(0, '11:00:00'), { IncidentId: 'IR-0215', Target: 'smb-v1', Action: 'DisableProtocol', Result: 'Success', ApprovedBy: 'ciso' });
    t.add('ResponseActions', when(0, '11:30:00'), { IncidentId: 'IR-0215', Target: 'warehouse-fleet', Action: 'ApplyPatch', Result: 'Success', PatchVersion: 'MS17-010', ApprovedBy: 'it-manager' });
  },
  questions: [
    { chapter: 'spread', prompt: 'Which process drove the worm’s spread between machines?', teach: 'A worm needs no clicks — it propagates itself. The same process name appearing across many hosts, launched by services.exe, is the worm executing on each new victim.', query: 'ProcessEvents | where ProcessName == "tasksche.exe" | distinct ProcessName', column: 'ProcessName', hint: 'distinct ProcessName on the worm process.' },
    { chapter: 'spread', prompt: 'Which network port did it spread over?', teach: 'This worm exploits a flaw in SMB (port 445) to copy itself to the next machine. Connections from the worm process on 445 trace the propagation path.', query: 'NetworkEvents | where InitiatingProcessFileName == "tasksche.exe" | distinct RemotePort', column: 'RemotePort', hint: 'distinct RemotePort on the worm’s connections.', type: 'number' },
    { chapter: 'scale', prompt: 'How many machines ran the worm?', teach: 'Count distinct hosts running the worm process to measure the outbreak. With no human in the loop, a worm can cover a whole subnet in minutes.', query: 'ProcessEvents | where ProcessName == "tasksche.exe" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'dcount(DeviceName) over the worm process.', type: 'number' },
    { chapter: 'scale', prompt: 'How many machines had files encrypted with the worm’s extension?', teach: 'Spread and damage are different counts — a host can be infected and mid-encryption. Counting devices with the .wncry FileRenamed events scopes the actual data loss.', query: 'FileEvents | where FileName endswith ".wncry" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'Count distinct devices with the .wncry rename events.', type: 'number' },
    { chapter: 'switch', prompt: 'Which unusual domain was looked up when the spread stopped?', teach: 'This worm checks whether a hard-coded domain resolves; if it does, it halts. A long, random-looking domain lookup coinciding with the halt is the accidental kill-switch — registering it stops the spread.', query: 'DnsEvents | where QueryName contains "iuqerf"', column: 'QueryName', hint: 'Search DnsEvents for the long random domain.' },
    { chapter: 'switch', prompt: 'Which actor does intelligence associate with the worm file?', teach: 'Attribution ties the worm to a known crew. The caveat is important: the kill-switch is fragile — it halts spread but does not undo encryption, and a new variant could remove it.', query: 'ThreatIntel | where Indicator == "tasksche.exe"', column: 'Actor', hint: 'Look the worm file up in ThreatIntel.' },
    { chapter: 'switch', prompt: 'What limitation does the intelligence note about the kill-switch?', teach: 'The kill-switch is luck, not a cure. It stops new infections but leaves encrypted files encrypted — and the next variant may not have one. Recovery still depends on backups and patching.', query: 'ThreatIntel | where Indicator == "tasksche.exe"', column: 'Limitation', hint: 'Read the Limitation on the worm intel record.' },
    { chapter: 'response', prompt: 'Which protocol was disabled to stop the spread vector?', teach: 'The durable fix removes the exploited pathway. Disabling the vulnerable SMB version closes the door the worm used to move between machines.', query: 'ResponseActions | where Action == "DisableProtocol"', column: 'Target', hint: 'Find the DisableProtocol action and read its target.' },
    { chapter: 'response', prompt: 'Which patch was applied to the fleet?', teach: 'Patching the SMB flaw across the fleet immunises machines against this and related exploits. Record the patch so coverage can be verified everywhere.', query: 'ResponseActions | where Action == "ApplyPatch" and IncidentId == "IR-0215"', column: 'PatchVersion', hint: 'Read PatchVersion on the patch action.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'One incident ID groups the protocol disable and the patch rollout into a single reviewable response to the outbreak.', query: 'ResponseActions | where Action == "DisableProtocol" and IncidentId == "IR-0215"', column: 'IncidentId', hint: 'Read IncidentId on the protocol-disable action.' },
  ],
});

// ── Episode 26 · The Research Lure ──────────────────────────────────────────────────────────────
const EP26_TARGETS = [staffIn('Executive')[3], staffIn('Legal')[1], staffIn('Executive')[0], staffIn('Finance')[1]];
const EP26_DOMAIN = 'secure-docs-review.example';

export const ep26 = defineCasebook({
  id: 'casebook-s1e26-research-lure',
  episode: 26,
  title: 'The Research Lure',
  difficulty: 'Medium',
  replaces: 'siem-chronicle-dnc-spearphishing-2016',
  inspiredBy: 'targeted spear-phishing of a small group of high-value staff to harvest credentials',
  date: '2027-02-22',
  briefing: 'This is not a mass campaign. A handful of carefully chosen people — two executives, legal counsel, a finance lead — each received a tailored email pointing at a credential-harvesting page. Spear-phishing picks its targets. Work out who was selected, who fell for it, and how the response protected them.',
  chapters: [
    { id: 'targeting', title: 'Who was chosen' },
    { id: 'harvest', title: 'Who fell' },
    { id: 'response', title: 'Protect the fallen' },
  ],
  inject(t, when) {
    EP26_TARGETS.forEach((e, i) => {
      t.add('EmailEvents', when(0, `08:${String(30 + i).padStart(2, '0')}:00`), { MessageId: `GH-SP-${i}`, SenderAddress: `board-docs@${EP26_DOMAIN}`, RecipientAddress: e.email, Subject: 'Confidential: board document requires your review', Url: `https://${EP26_DOMAIN}/review`, AttachmentName: '', DeliveryAction: 'Delivered', Verdict: 'Clean' });
      t.add('DnsEvents', when(0, `09:${String(5 + i).padStart(2, '0')}:00`), { DeviceName: e.hostname, ClientIP: e.ip, QueryName: EP26_DOMAIN, QueryType: 'A', Answer: GH.ips.phish });
    });
    // Two of the four submitted credentials (a POST), the others only opened the page (a GET).
    [EP26_TARGETS[0], EP26_TARGETS[2]].forEach((e, i) => {
      t.add('ProxyEvents', when(0, `09:${String(10 + i).padStart(2, '0')}:00`), { DeviceName: e.hostname, UserPrincipalName: e.email, Url: `https://${EP26_DOMAIN}/review/submit`, Domain: EP26_DOMAIN, DestinationIP: GH.ips.phish, Method: 'POST', StatusCode: 302, BytesSent: 1400, BytesReceived: 300, UserAgent: 'Mozilla/5.0' });
    });
    [EP26_TARGETS[1], EP26_TARGETS[3]].forEach((e, i) => {
      t.add('ProxyEvents', when(0, `09:${String(20 + i).padStart(2, '0')}:00`), { DeviceName: e.hostname, UserPrincipalName: e.email, Url: `https://${EP26_DOMAIN}/review`, Domain: EP26_DOMAIN, DestinationIP: GH.ips.phish, Method: 'GET', StatusCode: 200, BytesSent: 700, BytesReceived: 22_000, UserAgent: 'Mozilla/5.0' });
    });
    t.add('SecurityAlerts', when(0, '10:00:00'), { AlertName: 'Targeted credential-harvesting campaign', Severity: 'High', DeviceName: '', Entity: EP26_DOMAIN, Status: 'New', Product: 'Halcyon Email Security' });
    t.add('ThreatIntel', when(0, '09:45:00'), { Indicator: EP26_DOMAIN, IndicatorType: 'domain', Actor: GH.name, Confidence: 'High', Source: 'Internal email security and sharing group', Limitation: 'A page visit (GET) shows exposure to the lure; only a submission (POST) indicates credentials were likely entered.' });
    [EP26_TARGETS[0], EP26_TARGETS[2]].forEach((e) => t.add('ResponseActions', when(0, '10:30:00'), { IncidentId: 'IR-0222', Target: e.email, Action: 'ForcePasswordReset', Result: 'Success', ApprovedBy: 'soc-lead' }));
    t.add('ResponseActions', when(0, '10:40:00'), { IncidentId: 'IR-0222', Target: EP26_DOMAIN, Action: 'BlockIndicator', Result: 'Success', ApprovedBy: 'soc-lead' });
  },
  questions: [
    { chapter: 'targeting', prompt: 'How many people received the spear-phishing email?', teach: 'Spear-phishing is defined by its narrow, deliberate targeting. Counting recipients of the lure shows this was a handful of chosen people, not a broad blast — which itself signals a motivated actor.', query: `EmailEvents | where SenderAddress == "board-docs@${EP26_DOMAIN}" | count`, column: 'Count', hint: 'Count emails from the spear-phishing sender.', type: 'number' },
    { chapter: 'targeting', prompt: 'What subject line did the lure use?', teach: 'The pretext is tailored to the targets’ roles — a confidential board document that executives and counsel would plausibly need to review. Relevance is what makes spear-phishing effective.', query: 'EmailEvents | where MessageId == "GH-SP-0"', column: 'Subject', hint: 'Read Subject on the first lure email.' },
    { chapter: 'targeting', prompt: 'Which domain did all the targets’ devices resolve?', teach: 'Every target that engaged looked up the same harvesting domain. It is the shared indicator tying the campaign together and the thing to block.', query: `DnsEvents | where QueryName == "${EP26_DOMAIN}" | distinct QueryName`, column: 'QueryName', hint: 'distinct QueryName for the harvesting domain.' },
    { chapter: 'harvest', prompt: 'How many targets submitted the form (a POST)?', teach: 'A POST to the /submit path means credentials were likely entered — the people who actually fell. This is a smaller, more urgent set than those who merely opened the page.', query: `ProxyEvents | where Domain == "${EP26_DOMAIN}" and Method == "POST" | count`, column: 'Count', hint: 'Count POST requests to the harvesting domain.', type: 'number' },
    { chapter: 'harvest', prompt: 'How many targets only opened the page (a GET) without submitting?', teach: 'A GET without a POST means exposure but probably no credentials entered. Separating the two drives a proportionate response — resets for submitters, awareness for the rest.', query: `ProxyEvents | where Domain == "${EP26_DOMAIN}" and Method == "GET" | count`, column: 'Count', hint: 'Count GET requests to the harvesting domain.', type: 'number' },
    { chapter: 'harvest', prompt: 'Which target submitted credentials from the first POST?', teach: 'Pivot a specific submission to the person. Each submitter is an account to reset and a user to support — turning telemetry into action.', query: `ProxyEvents | where Domain == "${EP26_DOMAIN}" and Method == "POST" and DeviceName == "${EP26_TARGETS[0].hostname}"`, column: 'UserPrincipalName', hint: 'Filter the POSTs to the first submitter’s device.' },
    { chapter: 'harvest', prompt: 'Which actor does intelligence link to the campaign domain?', teach: 'The domain ties to a known espionage actor, consistent with targeting executives and legal staff. The GET-versus-POST caveat shapes who needs what response.', query: `ThreatIntel | where Indicator == "${EP26_DOMAIN}"`, column: 'Actor', hint: 'Look the campaign domain up in ThreatIntel.' },
    { chapter: 'response', prompt: 'How many password resets were issued?', teach: 'Resets go to the submitters only — matching the POST count keeps the response accurate. The GET-only targets get awareness, not resets.', query: 'ResponseActions | where IncidentId == "IR-0222" and Action == "ForcePasswordReset" | count', column: 'Count', hint: 'Count the password-reset actions in this incident.', type: 'number' },
    { chapter: 'response', prompt: 'Which address was blocked for everyone?', teach: 'Blocking the harvesting domain protects the whole organisation from the lure, including anyone who had not yet opened it.', query: 'ResponseActions | where Action == "BlockIndicator" and IncidentId == "IR-0222"', column: 'Target', hint: 'Find the BlockIndicator action and read its target.' },
    { chapter: 'response', prompt: 'Which incident ID tracks the response?', teach: 'A single incident ID groups the resets and the domain block so the targeted campaign’s response is reviewed as one.', query: 'ResponseActions | where Action == "BlockIndicator" and IncidentId == "IR-0222"', column: 'IncidentId', hint: 'Read IncidentId on the block action.' },
  ],
});
