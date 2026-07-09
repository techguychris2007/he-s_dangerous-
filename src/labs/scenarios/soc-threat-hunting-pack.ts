import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const socLabs: LabScenario[] = [
  {
    id: 'soc-ssh-bruteforce-investigation',
    title: 'SOC: SSH Brute-Force Investigation',
    difficulty: 'Easy',
    category: 'SOC',
    briefing:
      'A SIEM alert fired for excessive authentication failures on devweb01. The raw auth log shows two ' +
      'different source IPs successfully logging in as admin within the same hour — one of them is J. Alvarez\'s ' +
      'routine daily access, the other is not supposed to exist at all. IT\'s admin-access roster records every ' +
      'source authorized to use that account; your job is to work out which of the two successful logins is the ' +
      'actual compromise.',
    objectives: [
      {
        text: 'grep "Failed password" /var/log/auth.log',
        why: 'Confirms this is a sustained brute-force attempt (not a one-off typo) and shows the attacker cycling through multiple usernames — exactly the volume and pattern that would trip a real SIEM failed-auth threshold rule.',
      },
      {
        text: 'grep "Accepted password" /var/log/auth.log',
        why: 'Isolates every successful login in the window. There are two, from two different source IPs — that ambiguity is the actual problem this investigation has to resolve, not just "was there a successful login."',
      },
      {
        text: 'cat ~/admin-access-roster.txt to see which sources are actually authorized for admin access, and capture the flag',
        why: 'IT\'s own change-control record of who is allowed to authenticate as admin, and from where, is the only way to tell a routine login from an intrusion when both look identical in the log — a raw "Accepted password" line carries no authorization context by itself.',
      },
      {
        text: 'Confirm which successful login was the actual compromise',
        why: 'Naming the specific unauthorized source and timestamp is what turns a SIEM alert into an actionable incident — the account now needs a forced password reset and a review of everything it touched after 02:43:07.',
      },
    ],
    hints: [
      'grep "Failed password" /var/log/auth.log — confirms sustained brute-force volume against multiple usernames from one source.',
      'grep "Accepted password" /var/log/auth.log — two different source IPs both got in as admin within the same hour.',
      'cat ~/admin-access-roster.txt — only specific IPs/ranges are authorized to use the admin account; reading the full file captures the flag.',
      'grep "185.220.101.47" ~/admin-access-roster.txt — confirms that source is not on the authorized list, proving this was the unauthorized login.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'soc-analyst',
      user: 'root',
      root: dir({
        var: dir({
          log: dir({
            'auth.log': file(
              [
                'Jul 12 02:00:03 devweb01 sshd[19001]: Failed password for admin from 185.220.101.47 port 40012 ssh2',
                'Jul 12 02:00:06 devweb01 sshd[19002]: Failed password for root from 185.220.101.47 port 40015 ssh2',
                'Jul 12 02:00:09 devweb01 sshd[19003]: Failed password for admin from 185.220.101.47 port 40020 ssh2',
                'Jul 12 02:00:12 devweb01 sshd[19004]: Failed password for ubuntu from 185.220.101.47 port 40031 ssh2',
                'Jul 12 02:00:15 devweb01 sshd[19005]: Failed password for admin from 185.220.101.47 port 40044 ssh2',
                'Jul 12 02:00:19 devweb01 sshd[19006]: Failed password for admin from 185.220.101.47 port 40052 ssh2',
                'Jul 12 02:00:22 devweb01 sshd[19007]: Failed password for root from 185.220.101.47 port 40061 ssh2',
                'Jul 12 02:00:26 devweb01 sshd[19008]: Failed password for admin from 185.220.101.47 port 40073 ssh2',
                'Jul 12 02:00:29 devweb01 sshd[19009]: Failed password for ubuntu from 185.220.101.47 port 40088 ssh2',
                'Jul 12 02:00:33 devweb01 sshd[19010]: Failed password for admin from 185.220.101.47 port 40095 ssh2',
                'Jul 12 02:00:37 devweb01 sshd[19011]: Failed password for admin from 185.220.101.47 port 40103 ssh2',
                'Jul 12 02:00:41 devweb01 sshd[19012]: Failed password for admin from 185.220.101.47 port 40118 ssh2',
                'Jul 12 02:15:02 devweb01 sshd[19050]: Failed password for invalid user test from 41.223.10.5 port 55210 ssh2',
                'Jul 12 02:20:11 devweb01 sshd[19077]: Accepted password for admin from 10.50.0.14 port 52210 ssh2',
                'Jul 12 02:20:11 devweb01 sshd[19077]: pam_unix(sshd:session): session opened for user admin by (uid=0)',
                'Jul 12 02:35:04 devweb01 sshd[19081]: Failed password for admin from 185.220.101.47 port 40200 ssh2',
                'Jul 12 02:43:07 devweb01 sshd[19099]: Accepted password for admin from 185.220.101.47 port 41337 ssh2',
                'Jul 12 02:43:08 devweb01 sshd[19099]: pam_unix(sshd:session): session opened for user admin by (uid=0)',
                'Jul 12 03:10:12 devweb01 sshd[19200]: Failed password for invalid user test from 41.223.10.5 port 55210 ssh2',
              ].join('\n'),
            ),
          }),
        }),
        root: dir({
          'admin-access-roster.txt': file(
            [
              'Authorized administrative SSH sources for devweb01 (IT change-control record, last reviewed 2026-06-01):',
              '10.50.0.0/24   — corporate VPN pool (all sysadmins)',
              '10.50.0.14     — J. Alvarez, primary on-call sysadmin (static desk IP)',
              '203.0.113.9    — secondary on-call bastion host',
              '',
              'Any successful admin login from a source not listed above must be treated as a confirmed compromise, not routine access.',
              '',
              'Cross-check against /var/log/auth.log: 185.220.101.47 does not appear anywhere on this list, yet it successfully authenticated as admin at 02:43:07 on 2026-07-12.',
              'flag{brute_force_succeeded_from_unauthorized_source_185_220_101_47}',
            ].join('\n'),
          ),
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
      'The web team reports "weird slowness" on the customer portal. The Apache access log has plenty of noise ' +
      '— an old WordPress vulnerability scanner poking around, a customer search query with a stray apostrophe, ' +
      'and a request that triggered a 500 error long before anything landed. You need to find the request that ' +
      'actually carried a working SQL injection payload, then confirm against the database\'s own error log that ' +
      'it genuinely broke through, rather than just erroring out like the others.',
    objectives: [
      {
        text: 'grep "UNION" /var/log/apache2/access.log',
        why: 'A UNION-based injection is the classic way to pull data from a table the application never intended to expose — filtering the noisy access log for this one keyword isolates the single request that matters out of over a dozen lines of ordinary traffic and scanner noise.',
      },
      {
        text: 'Note the source IP and exact timestamp of that request',
        why: 'The access log alone only proves a malicious request was *sent* — proving it actually *succeeded* requires correlating that same IP and timestamp against the database\'s own error output.',
      },
      {
        text: 'grep "45.83.64.9" /var/log/mysql/error.log',
        why: 'The same source IP triggered two different database errors minutes apart — a generic syntax error while probing, and a distinct error later. Telling those two apart is exactly what separates "an attacker tried something" from "the attacker succeeded."',
      },
      {
        text: 'cat /var/log/mysql/error.log to read the full entry matching that timestamp and capture the flag',
        why: 'A "different number of columns" error is the specific, well-known signature of a UNION SELECT injection actively fingerprinting the target table\'s column count — pinpointing it by the exact request timestamp is what turns a suspicion into a confirmed, reportable SQL injection.',
      },
    ],
    hints: [
      'grep "UNION" /var/log/apache2/access.log — isolates the one request out of the whole log that carries a real SQLi payload.',
      'The malicious request hits /product?id= from 45.83.64.9 at 09:15:47 — note both the IP and the timestamp.',
      'grep "45.83.64.9" /var/log/mysql/error.log — this IP shows up twice; one entry is just a syntax error from earlier probing.',
      'cat /var/log/mysql/error.log — the entry timestamped 09:15:47 (not the earlier syntax error) is the confirmed injection, and the flag sits right after it.',
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
                  '203.0.113.5 - - [12/Jul/2026:09:10:01 +0000] "GET /product?id=1 HTTP/1.1" 200 512',
                  '203.0.113.5 - - [12/Jul/2026:09:10:04 +0000] "GET /product?id=2 HTTP/1.1" 200 498',
                  '198.51.100.9 - - [12/Jul/2026:09:11:22 +0000] "GET /cart HTTP/1.1" 200 1204',
                  '45.83.64.12 - - [12/Jul/2026:09:11:40 +0000] "GET /wp-login.php HTTP/1.1" 404 210',
                  '45.83.64.12 - - [12/Jul/2026:09:11:41 +0000] "GET /wp-admin/ HTTP/1.1" 404 210',
                  '198.51.100.9 - - [12/Jul/2026:09:12:03 +0000] "GET /search?q=womens-shoes HTTP/1.1" 200 812',
                  '203.0.113.5 - - [12/Jul/2026:09:12:40 +0000] "GET /product?id=3 HTTP/1.1" 200 505',
                  '198.51.100.9 - - [12/Jul/2026:09:13:03 +0000] "GET /checkout HTTP/1.1" 200 887',
                  '45.83.64.9 - - [12/Jul/2026:09:14:02 +0000] "GET /product?id=4 HTTP/1.1" 200 501',
                  '45.83.64.9 - - [12/Jul/2026:09:14:20 +0000] "GET /product?id=4%27 HTTP/1.1" 500 612',
                  '203.0.113.5 - - [12/Jul/2026:09:15:10 +0000] "GET /product?id=5 HTTP/1.1" 200 499',
                  '45.83.64.9 - - [12/Jul/2026:09:15:47 +0000] "GET /product?id=-1%20UNION%20SELECT%20username,password%20FROM%20users-- HTTP/1.1" 200 3311',
                  '198.51.100.9 - - [12/Jul/2026:09:16:03 +0000] "GET /checkout HTTP/1.1" 200 887',
                  '203.0.113.5 - - [12/Jul/2026:09:16:40 +0000] "GET /product?id=6 HTTP/1.1" 200 505',
                ].join('\n'),
              ),
            }),
            mysql: dir({
              'error.log': file(
                [
                  '[12/Jul/2026 09:10:01] Query OK — SELECT * FROM products WHERE id=1',
                  '[12/Jul/2026 09:10:04] Query OK — SELECT * FROM products WHERE id=2',
                  '[12/Jul/2026 09:12:40] Query OK — SELECT * FROM products WHERE id=3',
                  '[12/Jul/2026 09:14:20] ERROR 1064 (42000): SQL syntax error near unexpected token — client 45.83.64.9',
                  '[12/Jul/2026 09:15:10] Query OK — SELECT * FROM products WHERE id=5',
                  '[12/Jul/2026 09:15:47] ERROR 1222 (21000): The used SELECT statements have a different number of columns — client 45.83.64.9',
                  'flag{sqli_confirmed_column_mismatch_45_83_64_9_091547}',
                  '[12/Jul/2026 09:16:40] Query OK — SELECT * FROM products WHERE id=6',
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
      'Two different employees reported "suspicious invoice" emails this week. Both look urgent, both claim to ' +
      'be from Accounts Payable — but only one of them is actually spoofed. Analyze the raw headers on both and ' +
      'compare them against IT\'s reference list of Meridian Corp\'s own legitimate mail infrastructure to work ' +
      'out which one is a genuine (if annoyingly-worded) internal reminder, and which is a business email ' +
      'compromise (BEC) attempt.',
    objectives: [
      {
        text: 'ls ~/reported-emails and cat both reported email files',
        why: 'Treating both reports as a single case would risk either missing the real compromise or wasting response effort chasing a false alarm — you need to see how similar they look before anything else.',
      },
      {
        text: "cat ~/known-mail-infrastructure.txt to learn Meridian Corp's actual legitimate mail relay hostnames and domains, and capture the flag",
        why: 'You cannot judge whether a Received or Return-Path header is spoofed without first knowing what genuine infrastructure looks like — this is the same baseline reference a real analyst would pull from IT before touching either email.',
      },
      {
        text: 'grep "secure-mail-relay" ~/reported-emails/invoice-8291-billing.txt, then grep "secure-mail-relay" ~/known-mail-infrastructure.txt',
        why: 'The first confirms that domain appears in one of the two emails\' headers; the second confirms it appears nowhere on the authorized relay list — together that is the actual proof of spoofing, rather than just "the tone sounded urgent."',
      },
      {
        text: 'Confirm which reported email is the actual spoofed BEC attempt',
        why: 'Naming the specific email (not just "an email was suspicious") is what lets the SOC block the sender domain, warn the specific employee who received it, and confirm the other report was a false positive that needs no further action.',
      },
    ],
    hints: [
      'cat ~/reported-emails/invoice-7734-reminder.txt and cat ~/reported-emails/invoice-8291-billing.txt — both look urgent, so headers are what actually matter here.',
      'cat ~/known-mail-infrastructure.txt — genuine Meridian Corp mail only ever relays through mail01/mail02.meridian-corp.example; reading the full file captures the flag.',
      'grep "secure-mail-relay" ~/reported-emails/invoice-8291-billing.txt — that domain shows up in the Received and Return-Path headers of one email but not the other.',
      'grep "secure-mail-relay" ~/known-mail-infrastructure.txt — confirms that domain is not on the authorized list, proving invoice-8291-billing.txt is the spoofed one.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'soc-analyst',
      user: 'root',
      root: dir({
        root: dir({
          'known-mail-infrastructure.txt': file(
            [
              'Meridian Corp — Authorized Mail Infrastructure (IT reference, reviewed 2026-06-01)',
              'Outbound/inbound relays: mail01.meridian-corp.example (10.20.30.5), mail02.meridian-corp.example (10.20.30.6)',
              'Genuine Meridian Corp mail always shows a Received: header naming one of these two relays as the hop into mx.meridian-corp.example.',
              'The Return-Path domain for genuine outbound Meridian Corp mail is always meridian-corp.example — never a third-party relay domain.',
              '',
              'Known spoofed-sender indicators observed in reported phishing (SOC ticket SOC-2295): secure-mail-relay.example does not appear anywhere on this list.',
              'flag{bec_return_path_domain_not_in_authorized_relay_list}',
            ].join('\n'),
          ),
          'reported-emails': dir({
            'invoice-7734-reminder.txt': file(
              [
                'From: "Accounts Payable" <billing@meridian-corp.example>',
                'Reply-To: billing@meridian-corp.example',
                'Return-Path: <bounce@meridian-corp.example>',
                'Received: from mail01.meridian-corp.example (10.20.30.5) by mx.meridian-corp.example',
                'Subject: Reminder: Invoice #7734 due Friday',
                'Date: Fri, 10 Jul 2026 14:02:00 +0000',
                'Message-ID: <7734-reminder@meridian-corp.example>',
                '',
                'This is an automated reminder from the Finance system. Please process invoice #7734 before the due date.',
              ].join('\n'),
            ),
            'invoice-8291-billing.txt': file(
              [
                'From: "Accounts Payable" <billing@meridian-corp.example>',
                'Reply-To: urgent-payments@secure-mail-relay.example',
                'Return-Path: <bounce@secure-mail-relay.example>',
                'Received: from mail-relay-08.secure-mail-relay.example (unverified) by mx.meridian-corp.example',
                'Subject: URGENT: Invoice #8291 Overdue — Immediate Action Required',
                'Date: Sun, 12 Jul 2026 03:12:44 +0000',
                'Message-ID: <a8f2locale@secure-mail-relay.example>',
                '',
                'Please settle invoice #8291 immediately via the updated bank details attached to avoid service suspension.',
              ].join('\n'),
            ),
          }),
        }),
      }),
    },
    network: [],
  },
];
