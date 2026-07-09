import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function genFailedLogins(ip: string, user: string, count: number, startHour: number): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const minute = (i * 3) % 60;
    lines.push(
      `Jul 12 ${String(startHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:0${i % 10} devweb01 sshd[190${i}]: Failed password for ${user} from ${ip} port ${40000 + i} ssh2`,
    );
  }
  return lines.join('\n');
}

export const socLabs: LabScenario[] = [
  {
    id: 'soc-ssh-bruteforce-investigation',
    title: 'SOC: SSH Brute-Force Investigation',
    difficulty: 'Easy',
    category: 'SOC',
    briefing:
      'A SIEM alert fired for excessive authentication failures on devweb01. Your job as the SOC analyst ' +
      'is to review the raw auth log, confirm this was a brute-force attempt, identify the attacking IP, ' +
      'and find evidence of whether the attacker ultimately succeeded.',
    objectives: [
      'Review /var/log/auth.log on your analyst workstation',
      'Identify the source IP responsible for the failed login attempts',
      'Determine whether any login from that IP eventually succeeded, and find the flag in that line',
    ],
    hints: [
      'cat /var/log/auth.log to read the whole file, or grep "Failed password" /var/log/auth.log to isolate failures.',
      'grep <the-attacking-ip> /var/log/auth.log to see every line involving that IP, including any success.',
      "A successful login shows 'Accepted password' instead of 'Failed password' — that line contains the flag.",
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'soc-analyst',
      user: 'root',
      root: dir({
        var: dir({
          log: dir({
            'auth.log': file(
              genFailedLogins('185.220.101.47', 'admin', 14, 2) +
                '\n' +
                'Jul 12 02:43:07 devweb01 sshd[19099]: Accepted password for admin from 185.220.101.47 port 41337 ssh2\n' +
                'flag{brute_force_succeeded_after_14_attempts}\n' +
                'Jul 12 02:43:08 devweb01 sshd[19099]: pam_unix(sshd:session): session opened for user admin\n' +
                'Jul 12 03:10:12 devweb01 sshd[19200]: Failed password for invalid user test from 41.223.10.5 port 55210 ssh2\n',
            ),
          }),
        }),
      }),
    },
    network: [],
  },
  {
    id: 'soc-web-log-sqli-detection',
    title: 'SOC: Web Server Log — SQLi Detection',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'The web team reports "weird slowness" on the customer portal. Review the Apache access log to ' +
      'determine whether this is normal traffic or an active SQL injection attempt, and identify exactly ' +
      'which request contains the attack payload.',
    objectives: [
      'Review /var/log/apache2/access.log',
      "Filter for suspicious query strings (look for SQL keywords like UNION, SELECT, or quote characters)",
      'Identify the exact malicious request line and capture the flag inside it',
    ],
    hints: [
      'cat /var/log/apache2/access.log to see the full traffic sample.',
      `grep -i "union" /var/log/apache2/access.log or grep "'" /var/log/apache2/access.log to isolate suspicious requests.`,
      'The malicious line targets /product?id= with an injected UNION SELECT payload — read it carefully.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'soc-analyst',
      user: 'root',
      root: dir({
        var: dir({
          log: dir({
            apache2: dir({
              'access.log': file(
                [
                  '203.0.113.5 - - [12/Jul/2026:09:12:01 +0000] "GET /product?id=1 HTTP/1.1" 200 512',
                  '203.0.113.5 - - [12/Jul/2026:09:12:04 +0000] "GET /product?id=2 HTTP/1.1" 200 498',
                  '198.51.100.9 - - [12/Jul/2026:09:14:22 +0000] "GET /cart HTTP/1.1" 200 1204',
                  `45.83.64.12 - - [12/Jul/2026:09:15:47 +0000] "GET /product?id=-1%20UNION%20SELECT%20username,password%20FROM%20users-- HTTP/1.1" 200 3311 flag{sqli_detected_in_access_log_union_select}`,
                  '198.51.100.9 - - [12/Jul/2026:09:16:03 +0000] "GET /checkout HTTP/1.1" 200 887',
                  '203.0.113.5 - - [12/Jul/2026:09:16:40 +0000] "GET /product?id=3 HTTP/1.1" 200 505',
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
    id: 'soc-phishing-header-analysis',
    title: 'SOC: Phishing Email Header Analysis',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'An employee reported a suspicious "invoice" email. Analyze the raw email headers to determine ' +
      'whether the sender address was spoofed — a classic business email compromise (BEC) technique.',
    objectives: [
      'Review the raw email headers in ~/reported-email-headers.txt',
      'Compare the From, Return-Path, and Received headers for inconsistencies',
      'Identify the spoofing evidence and capture the flag',
    ],
    hints: [
      'cat ~/reported-email-headers.txt to see the full raw headers.',
      'grep -E "From:|Return-Path:|Received:" ~/reported-email-headers.txt to isolate the key headers.',
      'A legitimate email\'s Return-Path domain should match the From domain — here they don\'t. That mismatch line holds the flag.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'soc-analyst',
      user: 'root',
      root: dir({
        root: dir({
          'reported-email-headers.txt': file(
            [
              'From: "Accounts Payable" <billing@meridian-corp.example>',
              'Reply-To: urgent-payments@secure-mail-relay.example',
              'Return-Path: <bounce@secure-mail-relay.example>',
              'Received: from mail-relay-08.secure-mail-relay.example (unverified) by mx.meridian-corp.example',
              'Subject: URGENT: Invoice #48291 Overdue — Immediate Action Required',
              'Date: Sun, 12 Jul 2026 03:12:44 +0000',
              '',
              'Note for analyst: From domain (meridian-corp.example) does NOT match Return-Path domain',
              '(secure-mail-relay.example) — a classic spoofed-sender indicator.',
              'flag{spoofed_return_path_reveals_bec_phishing}',
            ].join('\n'),
          ),
        }),
      }),
    },
    network: [],
  },
];
