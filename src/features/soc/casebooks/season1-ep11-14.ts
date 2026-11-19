import { defineCasebook } from './casebook';
import { staffIn } from './world';
import { ASHEN_TIDE as AT, GLASS_HERON as GH } from './actors';

// ── Episode 11 · The Spreading Fire ─────────────────────────────────────────────────────────────
const ep11Patient0 = staffIn('Finance')[8];
const ep11Fleet = [...staffIn('Finance'), ...staffIn('Logistics'), ...staffIn('Warehouse')].slice(0, 24);

export const ep11 = defineCasebook({
  id: 'casebook-s1e11-spreading-fire',
  episode: 11,
  title: 'The Spreading Fire',
  difficulty: 'Hard',
  replaces: 'siem-suricata-notpetya-lateral-spread',
  inspiredBy: 'a destructive wiper spread through an accounting software update and SMB lateral movement',
  date: '2026-11-09',
  briefing: 'A finance laptop ran an update for the tax-filing tool overnight. By morning dozens of machines are unresponsive and files are renamed with a strange extension. This is not ransomware asking for money — it looks like a wiper. Trace the first machine, how it spread, and whether the network segmentation that was supposed to contain it held.',
  chapters: [
    { id: 'origin', title: 'Patient zero' },
    { id: 'spread', title: 'How it moved' },
    { id: 'impact', title: 'The damage' },
    { id: 'response', title: 'Containment' },
  ],
  inject(t, when) {
    const p0 = ep11Patient0;
    t.add('FileEvents', when(0, '02:14:00'), { DeviceName: p0.hostname, AccountName: 'SYSTEM', ActionType: 'FileModified', FileName: 'taxfiler-update.exe', FolderPath: 'C:\\Program Files\\TaxFiler', FileVersion: '9.4.2', Signer: 'TaxFiler Inc', SizeBytes: 7_340_032, SHA256: 'taxfiler-9.4.2-trojanised' });
    t.add('ProcessEvents', when(0, '02:14:30'), { DeviceName: p0.hostname, AccountName: 'SYSTEM', ProcessName: 'taxfiler-update.exe', ParentProcessName: 'services.exe', CommandLine: '"C:\\Program Files\\TaxFiler\\taxfiler-update.exe" /silent', SHA256: 'taxfiler-9.4.2-trojanised' });
    t.add('ProcessEvents', when(0, '02:15:10'), { DeviceName: p0.hostname, AccountName: 'SYSTEM', ProcessName: 'rundll32.exe', ParentProcessName: 'taxfiler-update.exe', CommandLine: 'rundll32.exe C:\\Windows\\perfc.dat,#1 60', SHA256: 'wiper-perfc' });
    // Credential theft, then SMB spread to the rest of the subnet.
    t.add('ProcessEvents', when(0, '02:16:00'), { DeviceName: p0.hostname, AccountName: 'SYSTEM', ProcessName: 'mimilite.exe', ParentProcessName: 'rundll32.exe', CommandLine: 'mimilite.exe sekurlsa::logonpasswords', SHA256: 'cred-dumper' });
    ep11Fleet.forEach((e, i) => {
      t.add('NetworkEvents', when(0, `02:${String(18 + i).padStart(2, '0')}:00`), { DeviceName: p0.hostname, InitiatingProcessFileName: 'rundll32.exe', RemoteIP: e.ip, RemotePort: 445, RemoteUrl: '', ActionType: 'ConnectionSuccess', BytesSent: 4096 });
      t.add('FileEvents', when(0, `02:${String(19 + i).padStart(2, '0')}:00`), { DeviceName: e.hostname, AccountName: 'SYSTEM', ActionType: 'FileRenamed', FileName: 'ledger.xlsx.encrypted', FolderPath: `C:\\Users\\${e.username}\\Documents`, SizeBytes: 220_000, SHA256: 'wiped' });
    });
    t.add('SecurityAlerts', when(0, '02:30:00'), { AlertName: 'Mass file rename consistent with destructive malware', Severity: 'High', DeviceName: p0.hostname, Entity: p0.email, Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '03:00:00'), { Indicator: 'perfc.dat', IndicatorType: 'file', Actor: AT.name, Confidence: 'Medium', Source: 'Industry sharing group', Limitation: 'A destruction-only payload offers no decryption even if a ransom were paid; recovery depends on backups.' });
    t.add('ResponseActions', when(0, '03:10:00'), { IncidentId: 'IR-1109', Target: 'finance-vlan', Action: 'IsolateNetworkSegment', Result: 'Success', ApprovedBy: 'ciso' });
    t.add('ResponseActions', when(0, '06:00:00'), { IncidentId: 'IR-1109', Target: 'finance-vlan', Action: 'RestoreFromBackup', Result: 'Success', BackupAge: '18h', ApprovedBy: 'it-manager' });
  },
  questions: [
    { chapter: 'origin', prompt: 'Which signed file was modified on the first machine before the outbreak?', teach: 'Destructive malware often arrives through a trusted software update, so the first file change looks legitimate — correct signer, normal location. The modification time (the dead of night) and what it spawns are what give it away.', query: `FileEvents | where DeviceName == "${ep11Patient0.hostname}" and ActionType == "FileModified" and FolderPath contains "TaxFiler"`, column: 'FileName', hint: 'Look for the FileModified event in the TaxFiler folder on patient zero.' },
    { chapter: 'origin', prompt: 'Which file did the update load through rundll32?', teach: 'The trojanised updater side-loads the wiper through rundll32 — the same living-off-the-land trick from Episode 1. The command line names a .dat file masquerading as a performance-counter library.', query: `ProcessEvents | where DeviceName == "${ep11Patient0.hostname}" and ProcessName == "rundll32.exe" and CommandLine contains "perfc"`, column: 'CommandLine', hint: 'Read the rundll32 command line that references perfc.' },
    { chapter: 'origin', prompt: 'Which tool dumped credentials on patient zero?', teach: 'To spread, the malware needs other machines’ credentials. A credential-dumping tool reading LSASS is the pivot from one infection to many. Identifying it tells you which passwords must be reset fleet-wide.', query: `ProcessEvents | where DeviceName == "${ep11Patient0.hostname}" and CommandLine contains "logonpasswords"`, column: 'ProcessName', hint: 'Find the process whose command line dumps logon passwords.' },
    { chapter: 'spread', prompt: 'How many machines did patient zero connect to over SMB (port 445)?', teach: 'Lateral movement over SMB is how the fire spreads. Counting distinct destinations from patient zero on port 445 measures the blast radius of the spread.', query: `NetworkEvents | where DeviceName == "${ep11Patient0.hostname}" and RemotePort == 445 | summarize dcount(RemoteIP)`, column: 'dcount_RemoteIP', hint: 'dcount(RemoteIP) for port-445 connections from patient zero.', type: 'number' },
    { chapter: 'impact', prompt: 'How many machines had files renamed with the wiper extension?', teach: 'The impact is measured on the victims, not the source. Counting devices with the destructive FileRenamed events shows how many machines need rebuilding — a different, larger number than those merely contacted.', query: 'FileEvents | where ActionType == "FileRenamed" and FileName endswith ".encrypted" | summarize dcount(DeviceName)', column: 'dcount_DeviceName', hint: 'Count distinct devices with the .encrypted FileRenamed events.', type: 'number' },
    { chapter: 'impact', prompt: 'What limitation does the intelligence note about this payload?', teach: 'This is the crucial lesson of a wiper disguised as ransomware: there is no key to buy. The intel record states it plainly — recovery depends on backups, not negotiation.', query: 'ThreatIntel | where Indicator == "perfc.dat"', column: 'Limitation', hint: 'Read the Limitation field on the perfc.dat intel record.' },
    { chapter: 'response', prompt: 'Which response action stopped the spread?', teach: 'When malware moves faster than you can clean individual hosts, cutting the network segment is the containment that works. Note it is approved at CISO level because it takes a business unit offline.', query: 'ResponseActions | where Action == "IsolateNetworkSegment"', column: 'IncidentId', hint: 'Find the segment-isolation action and read its incident ID.' },
    { chapter: 'response', prompt: 'How was data recovered? Enter the response action name.', teach: 'Against a wiper, backups are the whole recovery plan. The action — and the age of the backup used — determines how much work is lost.', query: 'ResponseActions | where IncidentId == "IR-1109" and BackupAge != ""', column: 'Action', hint: 'Find the IR-1109 action that references a backup.' },
    { chapter: 'response', prompt: 'How old was the backup that was restored?', teach: 'Backup age is the real cost of the incident: everything created after that point is gone. It is the number that justifies investment in more frequent backups.', query: 'ResponseActions | where Action == "RestoreFromBackup"', column: 'BackupAge', hint: 'Read BackupAge on the restore action.' },
    { chapter: 'response', prompt: 'Which actor does intelligence associate with the wiper?', teach: 'Attribution supports the bigger picture — the same financially motivated crew seen earlier in the season, now using destruction. It informs expectation of their next move, while staying an assessment, not a certainty.', query: 'ThreatIntel | where Indicator == "perfc.dat"', column: 'Actor', hint: 'Read the Actor on the wiper intel record.' },
  ],
});

// ── Episode 12 · The Open Door ──────────────────────────────────────────────────────────────────
const EP12_VPN_USER = 'contractor-vpn@halcyonfreight.example';
const EP12_ATTACKER = '203.0.113.188';

export const ep12 = defineCasebook({
  id: 'casebook-s1e12-open-door',
  episode: 12,
  title: 'The Open Door',
  difficulty: 'Hard',
  replaces: 'siem-sentinel-colonial-pipeline-vpn-no-mfa',
  inspiredBy: 'intrusion through a legacy VPN account that had no multi-factor authentication',
  date: '2026-11-16',
  briefing: 'A dormant contractor VPN account — one nobody remembered was still enabled — just logged in from an unfamiliar address with no second factor. Hours later, the operations scheduling server is encrypted and freight dispatch has stopped. Trace the entry, what the attacker reached, and whether the recovery restored operations without paying.',
  chapters: [
    { id: 'entry', title: 'The forgotten account' },
    { id: 'movement', title: 'Reaching operations' },
    { id: 'impact', title: 'Operations down' },
    { id: 'recovery', title: 'Back online' },
  ],
  inject(t, when) {
    t.add('VpnLogs', when(0, '23:40:00'), { UserPrincipalName: EP12_VPN_USER, SourceIP: EP12_ATTACKER, AssignedIP: '10.40.251.30', Gateway: 'vpn-legacy-01', Result: 'Connected', MfaUsed: false });
    t.add('SigninLogs', when(0, '23:41:00'), { UserPrincipalName: EP12_VPN_USER, IPAddress: EP12_ATTACKER, ResultType: 0, ResultDescription: 'Success', AppName: 'Legacy VPN', DeviceName: 'unknown', Location: 'US', MfaResult: 'NotRequired', SessionId: 'VPN-OPEN-12' });
    t.add('NetworkEvents', when(1, '00:05:00'), { DeviceName: 'HF-OPS-SCHED-01', InitiatingProcessFileName: 'System', RemoteIP: '10.40.251.30', RemotePort: 3389, RemoteUrl: '', ActionType: 'InboundConnectionAccepted', BytesSent: 0 });
    t.add('ProcessEvents', when(1, '00:12:00'), { DeviceName: 'HF-OPS-SCHED-01', AccountName: 'contractor', ProcessName: 'net.exe', ParentProcessName: 'cmd.exe', CommandLine: 'net.exe use \\\\HF-OPS-SCHED-01\\C$', SHA256: 'net-signed' });
    t.add('FileEvents', when(1, '00:40:00'), { DeviceName: 'HF-OPS-SCHED-01', AccountName: 'contractor', ActionType: 'FileCreated', FileName: AT.ransomNote, FolderPath: 'C:\\', SizeBytes: 2_100, SHA256: 'ransom-note' });
    for (let i = 0; i < 12; i++) t.add('FileEvents', when(1, `00:${String(42 + i).padStart(2, '0')}:00`), { DeviceName: 'HF-OPS-SCHED-01', AccountName: 'contractor', ActionType: 'FileRenamed', FileName: `dispatch-${i}.db.locked`, FolderPath: 'D:\\OpsData', SizeBytes: 5_000_000, SHA256: 'encrypted' });
    t.add('SecurityAlerts', when(1, '00:45:00'), { AlertName: 'Ransomware note written to system root', Severity: 'High', DeviceName: 'HF-OPS-SCHED-01', Entity: EP12_VPN_USER, Status: 'New', Product: 'Halcyon EDR' });
    t.add('ResponseActions', when(1, '01:30:00'), { IncidentId: 'IR-1116', Target: EP12_VPN_USER, Action: 'DisableAccount', Result: 'Success', ApprovedBy: 'soc-lead' });
    t.add('ResponseActions', when(1, '01:35:00'), { IncidentId: 'IR-1116', Target: 'vpn-legacy-01', Action: 'DecommissionGateway', Result: 'Success', ApprovedBy: 'ciso' });
    t.add('ResponseActions', when(1, '04:00:00'), { IncidentId: 'IR-1116', Target: 'HF-OPS-SCHED-01', Action: 'RestoreFromBackup', Result: 'Success', BackupAge: '4h', ApprovedBy: 'it-manager' });
    t.add('ResponseActions', when(1, '05:00:00'), { IncidentId: 'IR-1116', Target: 'all-vpn', Action: 'EnforceMfa', Result: 'Success', ApprovedBy: 'ciso' });
  },
  questions: [
    { chapter: 'entry', prompt: 'Which account connected to the VPN without multi-factor authentication?', teach: 'The weakest door is the one nobody is watching. A dormant account with MFA disabled is a standing invitation. Filter the VPN log for connections where no second factor was used.', query: 'VpnLogs | where MfaUsed == false', column: 'UserPrincipalName', hint: 'Filter VpnLogs on MfaUsed == false.' },
    { chapter: 'entry', prompt: 'From which IP address did the attacker connect?', teach: 'The source address is your pivot and your block. Capture it to find everything that followed from this session.', query: `VpnLogs | where UserPrincipalName == "${EP12_VPN_USER}"`, column: 'SourceIP', hint: 'Read SourceIP on the contractor VPN session.' },
    { chapter: 'entry', prompt: 'Which internal address was assigned to the VPN session?', teach: 'The VPN hands out an internal IP; that is the address that then appears reaching internal servers. It bridges "who dialled in" to "what they touched".', query: `VpnLogs | where UserPrincipalName == "${EP12_VPN_USER}"`, column: 'AssignedIP', hint: 'Read AssignedIP on the same session.' },
    { chapter: 'movement', prompt: 'Which server accepted an RDP connection from that internal address?', teach: 'Port 3389 is RDP, remote desktop. A VPN-assigned address opening RDP to the operations scheduler is the lateral move onto the crown-jewel system.', query: 'NetworkEvents | where RemoteIP == "10.40.251.30" and RemotePort == 3389', column: 'DeviceName', hint: 'Find the port-3389 connection from the VPN address.' },
    { chapter: 'movement', prompt: 'Which command did the attacker use to access the server’s C$ share?', teach: 'Administrative shares (C$) let an attacker read and write the whole disk once they have credentials. The net command reveals their hands-on activity on the server.', query: 'ProcessEvents | where DeviceName == "HF-OPS-SCHED-01" and ProcessName == "net.exe"', column: 'CommandLine', hint: 'Read the net.exe command line on the operations server.' },
    { chapter: 'impact', prompt: 'What ransom note filename was written to the server root?', teach: 'The ransom note is the attacker announcing themselves. Its presence in C:\\ confirms the encryption was deliberate extortion, not an accident.', query: 'FileEvents | where DeviceName == "HF-OPS-SCHED-01" and ActionType == "FileCreated" and FileName endswith ".txt"', column: 'FileName', hint: 'Find the FileCreated text file written to the server.' },
    { chapter: 'impact', prompt: 'How many dispatch files were encrypted?', teach: 'The operational impact — freight dispatch stopping — is measured in the files locked. Counting the FileRenamed events scopes the recovery.', query: 'FileEvents | where DeviceName == "HF-OPS-SCHED-01" and ActionType == "FileRenamed" and FileName endswith ".locked" | count', column: 'Count', hint: 'Count the .locked FileRenamed events on the server.', type: 'number' },
    { chapter: 'recovery', prompt: 'How was the legacy VPN permanently closed? Enter the response action name.', teach: 'Disabling the account stops this attacker; decommissioning the gateway removes the whole class of risk. The second is the durable fix that prevents the next forgotten account.', query: 'ResponseActions | where Target == "vpn-legacy-01"', column: 'Action', hint: 'Find the response action whose target is the legacy gateway.' },
    { chapter: 'recovery', prompt: 'How old was the backup used to restore operations?', teach: 'Backup age defines the operational gap — how many hours of dispatch records had to be re-entered. It is the figure that justifies tighter backup schedules for crown-jewel systems.', query: 'ResponseActions | where Action == "RestoreFromBackup" and Target == "HF-OPS-SCHED-01"', column: 'BackupAge', hint: 'Read BackupAge on the restore action.' },
    { chapter: 'recovery', prompt: 'Which control was enforced across all VPN access afterwards?', teach: 'The incident existed because one account lacked MFA. The hardening step — enforcing MFA on every VPN account — removes the gap the attacker walked through.', query: 'ResponseActions | where Target == "all-vpn"', column: 'Action', hint: 'Find the response action targeting all VPN access.' },
  ],
});

// ── Episode 13 · The Metadata Key ───────────────────────────────────────────────────────────────
const EP13_ATTACKER = '203.0.113.205';
const EP13_WAF = 'HF-CLOUD-WAF-01';

export const ep13 = defineCasebook({
  id: 'casebook-s1e13-metadata-key',
  episode: 13,
  title: 'The Metadata Key',
  difficulty: 'Hard',
  replaces: 'siem-qradar-capital-one-ssrf-metadata-2019',
  inspiredBy: 'a server-side request forgery used to steal cloud credentials from an instance metadata service',
  date: '2026-11-23',
  briefing: 'Halcyon’s customer-portal firewall logged a request that made the server fetch a URL from an internal cloud address it should never contact. Shortly after, that server’s cloud role started listing and downloading storage buckets from an unusual location. Work out how a web request turned into stolen cloud credentials and how much data was exposed.',
  chapters: [
    { id: 'ssrf', title: 'The forged request' },
    { id: 'creds', title: 'Stolen credentials' },
    { id: 'exfil', title: 'The buckets' },
    { id: 'response', title: 'Revocation' },
  ],
  inject(t, when) {
    // SSRF: the WAF logs a request whose parameter points at the cloud metadata endpoint.
    t.add('WebServerLogs', when(0, '13:05:00'), { Site: 'portal.halcyonfreight.example', ClientIP: EP13_ATTACKER, Method: 'GET', Url: '/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/portal-role', StatusCode: 200, UserAgent: 'python-requests/2.31', BytesSent: 1_540 });
    t.add('NetworkEvents', when(0, '13:05:01'), { DeviceName: EP13_WAF, InitiatingProcessFileName: 'portal.exe', RemoteIP: '169.254.169.254', RemotePort: 80, RemoteUrl: 'metadata', ActionType: 'ConnectionSuccess', BytesSent: 220 });
    t.add('CloudAuditEvents', when(0, '13:12:00'), { UserPrincipalName: 'portal-role', Operation: 'ListBuckets', Resource: 'storage/*', IPAddress: EP13_ATTACKER, SessionId: 'STS-STOLEN-13', Result: 'Success', ItemCount: 0 });
    for (let i = 0; i < 5; i++) t.add('CloudAuditEvents', when(0, `13:${String(20 + i * 3).padStart(2, '0')}:00`), { UserPrincipalName: 'portal-role', Operation: 'DownloadObject', Resource: `storage/customer-docs/batch-${i}.zip`, IPAddress: EP13_ATTACKER, SessionId: 'STS-STOLEN-13', Result: 'Success', ItemCount: 1, BytesSent: 140_000_000 });
    t.add('SecurityAlerts', when(0, '13:40:00'), { AlertName: 'Cloud role used from unfamiliar external IP', Severity: 'High', DeviceName: '', Entity: 'portal-role', Status: 'New', Product: 'Halcyon Cloud Defender' });
    t.add('ThreatIntel', when(0, '12:00:00'), { Indicator: EP13_ATTACKER, IndicatorType: 'ip', Actor: GH.name, Confidence: 'Medium', Source: 'Cloud provider abuse feed', Limitation: 'Access to storage does not by itself prove every object was read or published.' });
    t.add('ResponseActions', when(0, '14:00:00'), { IncidentId: 'IR-1123', Target: 'portal-role', Action: 'RevokeRoleCredentials', Result: 'Success', ApprovedBy: 'cloud-admin' });
    t.add('ResponseActions', when(0, '14:10:00'), { IncidentId: 'IR-1123', Target: EP13_WAF, Action: 'PatchSsrf', Result: 'Success', PatchVersion: 'portal-2.9.0', ApprovedBy: 'app-owner' });
    t.add('ResponseActions', when(0, '14:20:00'), { IncidentId: 'IR-1123', Target: 'metadata-service', Action: 'EnforceImdsv2', Result: 'Success', ApprovedBy: 'cloud-admin' });
  },
  questions: [
    { chapter: 'ssrf', prompt: 'Which internal address did the forged web request point the server at?', teach: 'Server-side request forgery (SSRF) tricks a server into fetching a URL of the attacker’s choosing. The dangerous target is the cloud metadata endpoint — a special internal address that hands out the server’s own credentials. The request URL contains it.', query: 'WebServerLogs | where Url contains "169.254.169.254"', column: 'Url', hint: 'Find the WebServerLogs request whose URL contains the metadata address.' },
    { chapter: 'ssrf', prompt: 'Which process on the firewall made the outbound metadata connection?', teach: 'Confirm the server actually fetched it. The portal process connecting to 169.254.169.254 is proof the SSRF worked — a web app has no legitimate reason to query the metadata service.', query: 'NetworkEvents | where RemoteIP == "169.254.169.254"', column: 'InitiatingProcessFileName', hint: 'Find the connection to the metadata address and read the process.' },
    { chapter: 'creds', prompt: 'Which cloud role’s credentials were used from the attacker’s IP?', teach: 'The metadata service returned temporary credentials for the role attached to the server. CloudAuditEvents then show that role acting from the attacker’s external address — the stolen key in use.', query: `CloudAuditEvents | where IPAddress == "${EP13_ATTACKER}" | distinct UserPrincipalName`, column: 'UserPrincipalName', hint: 'distinct UserPrincipalName on cloud events from the attacker IP.' },
    { chapter: 'creds', prompt: 'Which first operation did the stolen role perform?', teach: 'Attackers orient before they take. Listing buckets is reconnaissance — finding out what storage exists — before downloading. The ListBuckets event marks the start of the cloud intrusion.', query: 'CloudAuditEvents | where SessionId == "STS-STOLEN-13" and Operation == "ListBuckets"', column: 'Operation', hint: 'Find the ListBuckets operation in the stolen session.' },
    { chapter: 'exfil', prompt: 'How many objects did the attacker download?', teach: 'Count the DownloadObject events to scope the exposure. Each is a customer-document archive leaving the cloud account.', query: 'CloudAuditEvents | where SessionId == "STS-STOLEN-13" and Operation == "DownloadObject" | count', column: 'Count', hint: 'Count DownloadObject operations in the stolen session.', type: 'number' },
    { chapter: 'exfil', prompt: 'How many bytes were downloaded in total?', teach: 'Summing bytes estimates the volume of data exposed — the figure that drives breach-notification decisions. Remember the intel caveat: downloaded is not the same as published.', query: 'CloudAuditEvents | where SessionId == "STS-STOLEN-13" and Operation == "DownloadObject" | summarize sum(BytesSent)', column: 'sum_BytesSent', hint: 'summarize sum(BytesSent) over the downloads.', type: 'number' },
    { chapter: 'exfil', prompt: 'What limitation does the intelligence note about the download?', teach: 'Precision in reporting matters. The intel record reminds you that access and download do not prove every object was read or made public — a distinction that shapes how the breach is communicated.', query: `ThreatIntel | where Indicator == "${EP13_ATTACKER}"`, column: 'Limitation', hint: 'Read the Limitation on the attacker-IP intel record.' },
    { chapter: 'response', prompt: 'Which action cut off the stolen credentials?', teach: 'Temporary cloud credentials keep working until revoked. Revoking the role’s credentials immediately invalidates the stolen key, even mid-download.', query: 'ResponseActions | where Target == "portal-role"', column: 'Action', hint: 'Find the response action targeting the cloud role.' },
    { chapter: 'response', prompt: 'Which portal version fixed the SSRF?', teach: 'The root cause is the application fetching attacker-controlled URLs. Patching that — validating and restricting outbound fetches — is the durable fix. Record the version for fleet verification.', query: 'ResponseActions | where Action == "PatchSsrf"', column: 'PatchVersion', hint: 'Read PatchVersion on the SSRF patch action.' },
    { chapter: 'response', prompt: 'Which cloud control was enforced on the metadata service?', teach: 'Hardening the metadata service (requiring a session token to query it) blocks this SSRF technique even if another app bug appears. It is defence in depth beyond the single patch.', query: 'ResponseActions | where Target == "metadata-service"', column: 'Action', hint: 'Find the response action targeting the metadata service.' },
  ],
});

// ── Episode 14 · The Transfer Window ────────────────────────────────────────────────────────────
const EP14_ATTACKER = '203.0.113.233';
const EP14_MFT = 'HF-MFT-01';

export const ep14 = defineCasebook({
  id: 'casebook-s1e14-transfer-window',
  episode: 14,
  title: 'The Transfer Window',
  difficulty: 'Hard',
  replaces: 'siem-sentinel-moveit-cl0p-2023',
  inspiredBy: 'mass exploitation of a managed file-transfer appliance to steal data at scale',
  date: '2026-11-30',
  briefing: 'Halcyon runs a managed file-transfer appliance so partners can exchange customs documents. A notice warns of a critical flaw being exploited in the wild to drop a web shell and steal every file. Determine whether Halcyon’s appliance was hit, what the attacker installed, how much they took, and whether the response actually closed it.',
  chapters: [
    { id: 'exploit', title: 'The web shell' },
    { id: 'access', title: 'What they took' },
    { id: 'scope', title: 'How much' },
    { id: 'response', title: 'Patch and rotate' },
  ],
  inject(t, when) {
    t.add('WebServerLogs', when(0, '03:20:00'), { Site: 'mft.halcyonfreight.example', ClientIP: EP14_ATTACKER, Method: 'POST', Url: '/api/v1/folders/../../human2.aspx', StatusCode: 200, UserAgent: 'curl/8.1', BytesSent: 4_800 });
    t.add('FileEvents', when(0, '03:20:05'), { DeviceName: EP14_MFT, AccountName: 'mft-svc', ActionType: 'FileCreated', FileName: 'human2.aspx', FolderPath: 'C:\\MFT\\wwwroot', SizeBytes: 12_400, SHA256: 'webshell-aspx' });
    t.add('ProcessEvents', when(0, '03:21:00'), { DeviceName: EP14_MFT, AccountName: 'mft-svc', ProcessName: 'cmd.exe', ParentProcessName: 'w3wp.exe', CommandLine: 'cmd.exe /c whoami', SHA256: 'cmd-signed' });
    for (let i = 0; i < 8; i++) t.add('WebServerLogs', when(0, `03:${String(30 + i * 2).padStart(2, '0')}:00`), { Site: 'mft.halcyonfreight.example', ClientIP: EP14_ATTACKER, Method: 'GET', Url: `/human2.aspx?cmd=download&file=customs-batch-${i}.zip`, StatusCode: 200, UserAgent: 'curl/8.1', BytesSent: 90_000_000 });
    t.add('SecurityAlerts', when(0, '04:00:00'), { AlertName: 'Web shell created on file-transfer appliance', Severity: 'High', DeviceName: EP14_MFT, Entity: 'mft-svc', Status: 'New', Product: 'Halcyon EDR' });
    t.add('ThreatIntel', when(0, '01:00:00'), { Indicator: 'human2.aspx', IndicatorType: 'file', Actor: AT.name, Confidence: 'High', Source: 'Vendor advisory and sharing group', Limitation: 'Download via the web shell confirms access to those files; it does not enumerate which partners’ data was within them.' });
    t.add('ResponseActions', when(0, '05:00:00'), { IncidentId: 'IR-1130', Target: EP14_MFT, Action: 'TakeOffline', Result: 'Success', ApprovedBy: 'ciso' });
    t.add('ResponseActions', when(0, '05:30:00'), { IncidentId: 'IR-1130', Target: EP14_MFT, Action: 'ApplyPatch', Result: 'Success', PatchVersion: 'mft-2024.1.3', ApprovedBy: 'app-owner' });
    t.add('ResponseActions', when(0, '06:00:00'), { IncidentId: 'IR-1130', Target: 'partner-credentials', Action: 'RotateCredentials', Result: 'Success', ApprovedBy: 'security-eng' });
  },
  questions: [
    { chapter: 'exploit', prompt: 'What web shell file did the attacker create on the appliance?', teach: 'A web shell is a script dropped into a web server’s folder that lets an attacker run commands through ordinary HTTP requests. Find the newly created file in the appliance’s web root — its name becomes a key indicator to hunt elsewhere.', query: `FileEvents | where DeviceName == "${EP14_MFT}" and ActionType == "FileCreated" and FolderPath contains "wwwroot"`, column: 'FileName', hint: 'Look for a FileCreated event in the appliance web root.' },
    { chapter: 'exploit', prompt: 'Which process spawned a shell under the web server?', teach: 'The web server process (w3wp.exe) spawning cmd.exe is the signature of a web shell being used. A file-transfer appliance’s web process should never launch command shells.', query: `ProcessEvents | where DeviceName == "${EP14_MFT}" and ParentProcessName == "w3wp.exe"`, column: 'ProcessName', hint: 'Find the child of w3wp.exe on the appliance.' },
    { chapter: 'access', prompt: 'Under which service account did the web shell run?', teach: 'Commands run with the appliance service account’s rights. Knowing it tells you what the attacker could reach and which credentials to rotate.', query: `ProcessEvents | where DeviceName == "${EP14_MFT}" and ParentProcessName == "w3wp.exe"`, column: 'AccountName', hint: 'Read AccountName on the shell process.' },
    { chapter: 'access', prompt: 'Which IP address used the web shell to download files?', teach: 'The download requests hit the web shell’s filename with a cmd=download parameter. The client IP is the attacker and your block target.', query: 'WebServerLogs | where Url contains "human2.aspx" and Url contains "download" | distinct ClientIP', column: 'ClientIP', hint: 'distinct ClientIP on download requests to the web shell.' },
    { chapter: 'scope', prompt: 'How many file-download requests did the attacker make through the web shell?', teach: 'Count the download requests to scope the theft. Each pulls a customs-document archive off the appliance.', query: 'WebServerLogs | where Url contains "human2.aspx" and Url contains "download" | count', column: 'Count', hint: 'Count download requests to the web shell.', type: 'number' },
    { chapter: 'scope', prompt: 'How many bytes left through the web shell in total?', teach: 'Summing the bytes estimates the exposure. On a shared file-transfer appliance this data belongs to many partners, which widens the notification obligation.', query: 'WebServerLogs | where Url contains "human2.aspx" and Url contains "download" | summarize sum(BytesSent)', column: 'sum_BytesSent', hint: 'summarize sum(BytesSent) over the download requests.', type: 'number' },
    { chapter: 'scope', prompt: 'What limitation does the intelligence note?', teach: 'The honest boundary of this evidence: downloads prove access to the archives, but the logs do not list which partners’ records were inside them. State that clearly in the report.', query: 'ThreatIntel | where Indicator == "human2.aspx"', column: 'Limitation', hint: 'Read the Limitation on the web-shell intel record.' },
    { chapter: 'response', prompt: 'Which action immediately stopped the theft?', teach: 'When a public appliance is actively being drained, taking it offline is the fastest containment — it stops the bleeding before the patch is even applied.', query: `ResponseActions | where Target == "${EP14_MFT}" and Action == "TakeOffline"`, column: 'Action', hint: 'Find the TakeOffline response action.' },
    { chapter: 'response', prompt: 'Which patched version was applied?', teach: 'The durable fix is the vendor patch that closes the exploited flaw. Record the version so every appliance can be verified against it.', query: 'ResponseActions | where Action == "ApplyPatch" and IncidentId == "IR-1130"', column: 'PatchVersion', hint: 'Read PatchVersion on the patch action.' },
    { chapter: 'response', prompt: 'What else was rotated because the appliance held it? Enter the response action target.', teach: 'A file-transfer appliance stores partner credentials. Because the attacker had full access, those secrets must be treated as compromised and rotated — containment of the appliance alone is not enough.', query: 'ResponseActions | where Action == "RotateCredentials"', column: 'Target', hint: 'Find the credential-rotation action and read its target.' },
  ],
});
