import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({ wordlists: dir({ 'mini-rockyou.txt': file('123456\npassword\nletmein\nadmin123\nsummer2024\nqwerty\ndragon\ntrustno1\n') }) }) }) };
}

export const offensiveBatch3Labs: LabScenario[] = [
  {
    id: 'cve-2017-5638-struts2-ognl-rce',
    title: 'CVE-2017-5638: Apache Struts2 OGNL Injection RCE',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Meridian Credit Bureau runs a legacy customer portal (10.10.150.1) built on Apache Struts2. A ' +
      'malformed Content-Type header on a file-upload request gets evaluated as an OGNL expression by the ' +
      'Jakarta Multipart parser before any validation happens, letting an attacker run arbitrary commands ' +
      'with zero authentication. This is the exact real-world vulnerability (CVE-2017-5638) that led to the ' +
      '2017 Equifax breach — 147 million people\'s personal data exposed because a patch that had already ' +
      'been available for months was never applied to an internet-facing server.',
    objectives: [
      { text: 'Scan 10.10.150.1 with nmap -sV and identify the Struts2-based web application', why: 'Confirms the target framework and version before assuming the OGNL injection path is even present.' },
      { text: 'Launch the exploit: exploit struts2_ognl_content_type_rce 10.10.150.1', why: 'The malicious Content-Type header is crafted to break out of the expected multipart-parsing context and get evaluated as a live OGNL expression — a single unauthenticated request is all this CVE ever needed.' },
      { text: 'Confirm the resulting shell session and read the flag', why: 'Confirms the RCE actually lands — this exact vulnerability class, left unpatched, is what turned a routine disclosed CVE into one of the largest data breaches in history.' },
    ],
    hints: [
      'nmap -sV 10.10.150.1',
      'exploit struts2_ognl_content_type_rce 10.10.150.1',
      'Real-world detail: Apache disclosed and patched this CVE in March 2017; the Equifax breach happened because their instance stayed unpatched for months afterward — the flaw itself was never a secret.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'credit-portal01',
        ip: '10.10.150.1',
        os: 'CentOS 7 (Apache Struts 2.3.31, unpatched)',
        services: [{ port: 443, name: 'https', version: 'Apache Struts 2.3.31 / Jakarta Multipart parser (unpatched)' }],
        users: [],
        exploitableAs: 'struts2_ognl_content_type_rce',
        root: dir({ root: dir({ 'root.txt': file('CVE-2017-5638 confirmed — the same Struts2 OGNL injection flaw behind the 2017 Equifax breach.\nflag{struts2_ognl_contenttype_rce_2017_5638}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2023-34362-moveit-transfer-rce',
    title: 'CVE-2023-34362: MOVEit Transfer SQL Injection RCE',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Ashworth Payroll Services runs Progress MOVEit Transfer (10.10.150.2) for secure file exchange with ' +
      'clients. CVE-2023-34362 is a SQL injection in the web application\'s public-facing endpoint, deep ' +
      'enough to let an unauthenticated attacker plant a webshell and gain code execution on the underlying ' +
      'server. The Cl0p ransomware group weaponized this exact CVE in a mass-exploitation campaign ' +
      'throughout mid-2023, ultimately compromising data at thousands of organizations that had MOVEit ' +
      'exposed to the internet.',
    objectives: [
      { text: 'Scan 10.10.150.2 with nmap -sV and identify the MOVEit Transfer instance', why: 'Confirms the vulnerable software is actually present and internet-reachable before proceeding.' },
      { text: 'Launch the exploit: exploit moveit_sqli_webshell_rce 10.10.150.2', why: 'The SQL injection reaches deep enough into the application to write a file to disk — Cl0p used exactly this chain to drop a webshell (nicknamed "LEMURLOOT" by researchers) for follow-on data theft.' },
      { text: 'Confirm the resulting session and read the flag', why: 'Confirms full compromise of the file-transfer server — in the real 2023 campaign, this was the exact point where mass data exfiltration began.' },
    ],
    hints: [
      'nmap -sV 10.10.150.2',
      'exploit moveit_sqli_webshell_rce 10.10.150.2',
      'Real-world detail: this campaign is one of the largest single-CVE mass-exploitation events on record, precisely because MOVEit is widely deployed specifically to handle sensitive file transfers.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'moveit-transfer01',
        ip: '10.10.150.2',
        os: 'Windows Server 2019 (Progress MOVEit Transfer 2023.0.0, unpatched)',
        services: [{ port: 443, name: 'https', version: 'Progress MOVEit Transfer 2023.0.0 (unpatched, CVE-2023-34362)' }],
        users: [],
        exploitableAs: 'moveit_sqli_webshell_rce',
        root: dir({ root: dir({ 'root.txt': file('CVE-2023-34362 confirmed — the exact MOVEit Transfer flaw the Cl0p ransomware group mass-exploited in 2023.\nflag{moveit_sqli_webshell_rce_2023_34362}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2022-42475-fortios-sslvpn-rce',
    title: 'CVE-2022-42475: FortiOS SSL-VPN Heap Overflow RCE',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Palisade Energy secures remote access through a Fortinet FortiGate SSL-VPN appliance (10.10.150.3). ' +
      'CVE-2022-42475 is a heap-based buffer overflow in the SSL-VPN service itself, reachable without any ' +
      'authentication — an attacker only needs network access to the VPN portal, not a valid account. ' +
      'Fortinet confirmed this exact vulnerability was exploited in the wild against government and large ' +
      'organization targets before a patch was even available, a genuine zero-day in active use.',
    objectives: [
      { text: 'Scan 10.10.150.3 with nmap -sV and identify the exposed FortiGate SSL-VPN service', why: 'Confirms the appliance and firmware version are reachable and worth targeting.' },
      { text: 'Launch the exploit: exploit fortios_sslvpn_heap_overflow 10.10.150.3', why: 'The overflow happens during SSL-VPN session negotiation itself, before any login credential is ever checked — reachability is the only prerequisite.' },
      { text: 'Confirm the resulting session and read the flag', why: 'Confirms code execution on the VPN appliance — in the real attacks, this was the entry point into the internal network the VPN was supposed to protect.' },
    ],
    hints: [
      'nmap -sV 10.10.150.3',
      'exploit fortios_sslvpn_heap_overflow 10.10.150.3',
      'Real-world detail: Fortinet and CISA both confirmed active pre-patch exploitation of this CVE, making it one of the rarer, genuinely-observed-as-a-zero-day network appliance vulnerabilities.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'fortigate-vpn01',
        ip: '10.10.150.3',
        os: 'FortiOS 7.2.1 (SSL-VPN, unpatched, CVE-2022-42475)',
        services: [{ port: 443, name: 'https', version: 'Fortinet FortiOS 7.2.1 SSL-VPN (unpatched)' }],
        users: [],
        exploitableAs: 'fortios_sslvpn_heap_overflow',
        root: dir({ root: dir({ 'root.txt': file('CVE-2022-42475 confirmed — the FortiOS SSL-VPN heap overflow exploited as a real zero-day before a patch existed.\nflag{fortios_sslvpn_heap_overflow_2022_42475}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'cve-2024-21887-ivanti-connect-secure-rce',
    title: 'CVE-2024-21887: Ivanti Connect Secure Auth Bypass + Command Injection',
    difficulty: 'Hard',
    category: 'Network',
    briefing:
      'Northshore Health Systems terminates remote clinical staff access through an Ivanti Connect Secure ' +
      'VPN gateway (10.10.150.4). CVE-2024-21887 is a command injection vulnerability that, chained with a ' +
      'separate authentication bypass (CVE-2023-46805) disclosed the same week, lets an unauthenticated ' +
      'attacker run arbitrary commands on the appliance. This exact chain was exploited broadly beginning ' +
      'in January 2024, with CISA issuing an emergency directive ordering federal agencies to disconnect ' +
      'affected devices from their networks entirely rather than trust an in-place patch.',
    objectives: [
      { text: 'Scan 10.10.150.4 with nmap -sV and identify the exposed Ivanti Connect Secure gateway', why: 'Confirms the appliance and version before proceeding — this exact combination of CVEs is version-specific.' },
      { text: 'Launch the exploit: exploit ivanti_connectsecure_authbypass_rce 10.10.150.4', why: 'The chain first bypasses authentication entirely (CVE-2023-46805), then uses that unauthenticated access to reach the command-injection endpoint (CVE-2024-21887) — two real CVEs combined into one working exploit.' },
      { text: 'Confirm the resulting session and read the flag', why: 'Confirms code execution on the VPN gateway — severe enough in the real incident that CISA\'s guidance was full disconnection rather than trusting a patched-in-place device.' },
    ],
    hints: [
      'nmap -sV 10.10.150.4',
      'exploit ivanti_connectsecure_authbypass_rce 10.10.150.4',
      'Real-world detail: CISA\'s emergency directive in January 2024 was unusually strong — ordering physical disconnection of affected devices rather than trusting Ivanti\'s own mitigation guidance, because both CVEs were already being exploited by multiple threat actors.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'ivanti-cs01',
        ip: '10.10.150.4',
        os: 'Ivanti Connect Secure 9.1R14 (unpatched, CVE-2023-46805 + CVE-2024-21887)',
        services: [{ port: 443, name: 'https', version: 'Ivanti Connect Secure 9.1R14 (unpatched)' }],
        users: [],
        exploitableAs: 'ivanti_connectsecure_authbypass_rce',
        root: dir({ root: dir({ 'root.txt': file('CVE-2024-21887 + CVE-2023-46805 confirmed — the chained Ivanti Connect Secure auth-bypass and command-injection flaws exploited widely from January 2024.\nflag{ivanti_connectsecure_authbypass_rce_2024_21887}\n') }) }),
      } as HostDef,
    ],
  },
  {
    id: 'web-ldap-injection-auth-bypass',
    title: 'LDAP Injection: Bypassing an Active Directory-Backed Login',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Kingsley Legal\'s client portal (10.10.150.5) authenticates against the firm\'s Active Directory over ' +
      'LDAP — but builds its search filter by directly concatenating the submitted username into the query ' +
      'string, exactly the same class of bug as SQL injection, just against a different query language. An ' +
      'LDAP filter like (&(uid=INJECT)(password=...)) can be broken out of with the right wildcard and ' +
      'logical-operator syntax, turning "find this one user" into "match every user in the directory."',
    objectives: [
      { text: 'Scan 10.10.150.5 and identify the login portal', why: 'Confirms the target and that a login form is actually present before crafting an injection payload.' },
      {
        text: 'Send an LDAP filter injection as the username: curl -d "username=*)(uid=*))(|(uid=*&password=anything" 10.10.150.5/login',
        why: 'This payload closes the intended filter early with *)(uid=*)) and then opens a new always-true OR clause with (|(uid=*  — the same "break out and inject your own logic" idea as a SQL injection payload, just in LDAP filter syntax.',
      },
      { text: 'Confirm the authentication bypass and capture the flag', why: 'Confirms the injected filter logic actually short-circuited the real credential check, not just that the server accepted unusual input.' },
    ],
    hints: [
      'nmap -sV 10.10.150.5',
      'curl 10.10.150.5/login  for a baseline response first.',
      'curl -d "username=*)(uid=*))(|(uid=*&password=anything" 10.10.150.5/login',
      'The injected value needs to contain the exact sequence *)(uid=*))(|(uid=*  to close and reopen the LDAP filter\'s logic.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legal-portal01',
        ip: '10.10.150.5',
        os: 'Ubuntu 22.04 (Node.js app, LDAP-backed auth)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.22.0 + Node.js LDAP auth backend',
            http: { '/': '<html><body><h1>Kingsley Legal — Client Portal</h1></body></html>' },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/login',
                param: 'username',
                triggerSubstrings: ['*)(uid=*))(|(uid=*'],
                vulnerableResponse:
                  '<html><body><h1>Welcome, Administrator</h1>' +
                  '<p>LDAP filter matched every entry in the directory — authentication bypassed.</p></body></html>\n' +
                  'flag{ldap_injection_wildcard_filter_auth_bypass}',
                normalResponse: '<html><body><h1>401 Unauthorized</h1><p>Invalid credentials.</p></body></html>',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'web-nosql-injection-login-bypass',
    title: 'NoSQL Injection: Bypassing a MongoDB-Backed Login',
    difficulty: 'Medium',
    category: 'Web',
    briefing:
      'Fenwick Retail\'s customer account API (10.10.150.6) checks credentials with a MongoDB query built ' +
      'directly from the submitted form body — {username: req.body.username, password: req.body.password} ' +
      '— with no type checking. Express\'s extended URL-encoded body parser turns bracket notation like ' +
      'username[$ne]=null into a real nested object {username: {$ne: null}}, and MongoDB\'s $ne ("not ' +
      'equal") operator, submitted where the application expected a plain string, turns "password equals ' +
      'this exact value" into "password is anything that isn\'t null" — matching virtually every real ' +
      'account in the database. This is a real, still-common bug class wherever a NoSQL query is built from ' +
      'unvalidated user input.',
    objectives: [
      { text: 'Scan 10.10.150.6 and identify the account API', why: 'Confirms the target and that the login endpoint accepts a form-style body before crafting the operator injection.' },
      {
        text: 'Send a MongoDB operator injection: curl -d "username[$ne]=null&password[$ne]=null" 10.10.150.6/api/login',
        why: 'The $ne (not-equal) operator, delivered via Express\'s bracket-notation body parsing, is interpreted by MongoDB as a real query operator instead of a literal value — matching the first account in the collection instead of checking any specific credential at all.',
      },
      { text: 'Confirm the authentication bypass and capture the flag', why: 'Confirms the injected operator actually altered the query\'s meaning, not just that malformed input was tolerated.' },
    ],
    hints: [
      'nmap -sV 10.10.150.6',
      'curl -d "username=test&password=test" 10.10.150.6/api/login  for a baseline rejected response.',
      'curl -d "username[$ne]=null&password[$ne]=null" 10.10.150.6/api/login',
      'The literal key username[$ne] with value null is what needs to appear in the submitted body for the injection to trigger.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'retail-api01',
        ip: '10.10.150.6',
        os: 'Ubuntu 22.04 (Node.js/Express + MongoDB)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Node.js/Express API + MongoDB backend',
            http: { '/': '<html><body><h1>Fenwick Retail — Account API</h1></body></html>' },
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/api/login',
                param: 'username[$ne]',
                triggerSubstrings: ['null'],
                vulnerableResponse:
                  '{"status": "authenticated", "user": "j.fenwick@fenwick-retail.example", "role": "admin"}\n' +
                  'flag{nosql_injection_ne_operator_auth_bypass}',
                normalResponse: '{"status": "error", "message": "invalid credentials"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
  {
    id: 'privesc-sudo-systemctl-gtfobins',
    title: 'Privesc: The systemctl Command (sudo NOPASSWD)',
    difficulty: 'Medium',
    category: 'Linux',
    briefing:
      'Target 10.10.150.7 (svc-mgr01) belongs to Oakhaven Municipal Services. Anonymous FTP exposes ' +
      'deployment notes with an SSH credential for "svcadmin", who holds a NOPASSWD sudo rule on systemctl ' +
      '— a real, well-documented GTFOBins technique: systemctl can be pointed at an arbitrary unit file, and ' +
      'a crafted .service unit\'s ExecStart line runs as whatever privilege level started the service, which ' +
      'is root when systemctl itself is invoked via sudo.',
    objectives: [
      { text: 'Scan 10.10.150.7 and enumerate open services', why: 'Confirms which services are actually reachable before deciding where to focus — the standard first move against any unknown host.' },
      { text: 'Use anonymous FTP on 10.10.150.7 to find SSH credentials for "svcadmin"', why: 'Deployment notes left in an anonymous-accessible FTP share are one of the most common real footholds — Oakhaven never locked it down after go-live.' },
      { text: 'Log in as svcadmin and capture user.txt', why: 'Confirms the recovered credential actually grants a working interactive shell, not just that it looked plausible on paper.' },
      { text: 'Run \'sudo -l\' to enumerate exactly what svcadmin is allowed to run as root', why: 'Confirming the exact NOPASSWD rule before acting is what separates a deliberate escalation from a lucky guess.' },
      { text: 'Exploit the NOPASSWD rule on systemctl to spawn a root shell', why: 'A malicious systemd unit\'s ExecStart line runs with the privileges of whatever started the service — since systemctl itself is running as root (via sudo), the service it starts is root too.' },
      { text: 'Read /root/root.txt to capture the final flag', why: 'Confirms full root compromise of the host, not just a shell that still lacks real privileges.' },
    ],
    hints: [
      'nmap -sV 10.10.150.7',
      'ftp 10.10.150.7 then ftp-get 10.10.150.7 notes.txt to read the deployment notes.',
      'ssh svcadmin@10.10.150.7 with the recovered password, then cat user.txt.',
      'sudo -l',
      'sudo systemctl start rootshell.service',
      'What that command does: systemctl start launches a systemd unit — since sudo is granting systemctl itself root, a crafted rootshell.service unit\'s ExecStart line (a shell command) executes as root the moment the service starts.',
      'Once root, check /root/root.txt.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'svc-mgr01',
        ip: '10.10.150.7',
        os: 'Ubuntu 22.04',
        services: [
          { port: 21, name: 'ftp', version: 'vsftpd 3.0.3', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true },
          { port: 22, name: 'ssh', version: 'OpenSSH 8.9p1 Ubuntu-3ubuntu0.4' },
        ],
        users: [{ username: 'svcadmin', password: 'SvcMgr#2024', sudo: { nopasswdCommands: ['/usr/bin/systemctl'] } }],
        root: dir({
          srv: dir({ ftp: dir({ 'notes.txt': file('Oakhaven Municipal Services deployment notes.\nSSH access for svcadmin: password is "SvcMgr#2024"\n') }) }),
          home: dir({ svcadmin: dir({ 'user.txt': file('Foothold established on svc-mgr01.\nflag{gtfobins_systemctl_foothold_svcadmin}\n') }) }),
          root: dir({ 'root.txt': file('Root compromise via sudo NOPASSWD misconfiguration on \'systemctl\'.\nflag{gtfobins_sudo_systemctl_root_shell}\n') }),
        }),
      } as HostDef,
    ],
  },
  {
    id: 'privesc-suid-env-gtfobins',
    title: 'Privesc: The env Command (SUID)',
    difficulty: 'Easy',
    category: 'Linux',
    briefing:
      'Target 10.10.150.8 (util-box01) belongs to Ridgeline Analytics. Web enumeration reveals a username ' +
      'via a disallowed robots.txt path, and hydra recovers the SSH password. Once in, "/usr/bin/env" turns ' +
      'out to be SUID root — one of the simplest and most classic GTFOBins entries: env\'s entire purpose is ' +
      'running another program with a modified environment, so env /bin/sh with the SUID bit set just runs a ' +
      'shell directly, inheriting root.',
    objectives: [
      { text: 'Scan 10.10.150.8 and enumerate open services', why: 'Confirms which services are actually reachable before deciding where to focus — the standard first move against any unknown host.' },
      { text: 'Enumerate the web server on 10.10.150.8 (check /robots.txt) to identify the username, then brute-force the SSH password with hydra', why: 'Narrowing hydra to a single confirmed username (leaked via a disallowed robots.txt path) turns a slow, noisy blind brute-force into a fast, targeted one.' },
      { text: 'Log in as analyst and capture user.txt', why: 'Confirms the recovered credential actually grants a working interactive shell, not just that it looked plausible on paper.' },
      { text: 'Run \'find / -perm -4000 2>/dev/null\' to discover which SUID-root binaries exist on the box', why: 'This is the standard, single-pass way real operators enumerate every SUID-root binary on a host instead of guessing file paths one at a time.' },
      { text: 'Execute the SUID-root env binary directly to spawn a root shell', why: 'env\'s whole job is launching another program — pointed at /bin/sh with the SUID bit set, it launches a shell that inherits root instead of the invoking user\'s own privileges.' },
      { text: 'Read /root/root.txt to capture the final flag', why: 'Confirms full root compromise of the host, not just a shell that still lacks real privileges.' },
    ],
    hints: [
      'nmap -sV 10.10.150.8',
      'curl 10.10.150.8/robots.txt reveals the username, then: hydra -l analyst -P /root/wordlists/mini-rockyou.txt ssh://10.10.150.8',
      'ssh analyst@10.10.150.8 with the recovered password, then cat user.txt.',
      'find / -perm -4000 2>/dev/null',
      '/usr/bin/env /bin/sh',
      'What that command does: env\'s job is to run a program (optionally with a modified environment) — pointed directly at /bin/sh, it just launches a shell, and since env itself is SUID root, that shell is root.',
      'Once root, check /root/root.txt.',
    ],
    totalFlags: 2,
    attacker: attacker(),
    network: [
      {
        hostname: 'util-box01',
        ip: '10.10.150.8',
        os: 'Debian 12',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0',
            http: {
              '/': '<html><body><h1>Ridgeline Analytics — Internal</h1></body></html>',
              '/robots.txt': 'User-agent: *\nDisallow: /internal-analyst-notes\n',
            },
          },
          { port: 22, name: 'ssh', version: 'OpenSSH 9.2p1 Debian-2' },
        ],
        users: [{ username: 'analyst', password: 'DataView!7' }],
        suidBinary: '/usr/bin/env',
        root: dir({
          home: dir({ analyst: dir({ 'user.txt': file('Foothold established on util-box01.\nflag{gtfobins_env_foothold_analyst}\n') }) }),
          usr: dir({ bin: dir({ env: file('ELF binary (SUID root)\n', '-rwsr-xr-x') }) }),
          root: dir({ 'root.txt': file('Root compromise via SUID binary on \'env\'.\nflag{gtfobins_suid_env_root_shell}\n') }),
        }),
      } as HostDef,
    ],
  },
];
